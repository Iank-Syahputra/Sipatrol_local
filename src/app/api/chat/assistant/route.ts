import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { executeReadOnlyQuery } from '@/lib/db-readonly';

const AI_MODEL = "llama-3.3-70b-versatile";

// Initialize Groq client through AI SDK
let groq: ReturnType<typeof createGroq>;

try {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables');
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }
  groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });
} catch (error) {
  console.error('Failed to initialize Groq client:', error);
}

// Define the database schema for the AI to understand
const DATABASE_SCHEMA = `
Database Schema for SiPatrol (Security Patrol Management):

1. \`units\` table:
   - id (String, UUID, Primary Key)
   - name (String) - Unit name
   - district (String) - District where unit operates
   - created_at (DateTime)

2. \`profiles\` table:
   - id (String, UUID, Primary Key)
   - username (String, Unique) - Username for login
   - password (String) - User password (hashed)
   - full_name (String) - Full name of the user
   - role (Enum: admin, security) - User role
   - phone_number (String) - Phone number
   - assigned_unit_id (String, Foreign Key) - Reference to assigned unit
   - created_at (DateTime)

3. \`report_categories\` table:
   - id (String, UUID, Primary Key)
   - name (String, Unique) - Category name (e.g., "Unsafe Action", "Safe Condition")
   - color (String) - Color for UI representation
   - created_at (DateTime)

4. \`unit_locations\` table:
   - id (String, UUID, Primary Key)
   - unit_id (String, Foreign Key) - Reference to unit
   - name (String) - Location name within the unit
   - created_at (DateTime)

5. \`reports\` table:
   - id (String, UUID, Primary Key)
   - user_id (String, Foreign Key) - Reference to reporting user
   - unit_id (String, Foreign Key) - Reference to unit
   - category_id (String, Foreign Key) - Reference to report category
   - location_id (String, Foreign Key) - Reference to location
   - image_path (String) - Path to evidence image
   - notes (Text) - Detailed notes about the report
   - latitude (Float) - Latitude coordinate
   - longitude (Float) - Longitude coordinate
   - captured_at (DateTime) - Time when report was captured
   - is_offline_submission (Boolean) - Whether submitted offline
   - location_name_cached (String) - Cached location name
   - created_at (DateTime)
`;

const BUSINESS_RULES = `
Business Rules for SiPatrol Analysis:

1. Time Definitions:
   - "Hari ini" (Today) = DATE(captured_at) = CURDATE()
   - "Minggu ini" (This Week) = captured_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
   - "Bulan ini" (This Month) = MONTH(captured_at) = MONTH(CURDATE()) AND YEAR(captured_at) = YEAR(CURDATE())

2. Safety Classification (Keyword Based):
   - "Unsafe" / "Temuan" / "Bahaya" = notes LIKE '%unsafe%' OR notes LIKE '%bahaya%' OR notes LIKE '%rusak%' OR notes LIKE '%temuan%'
   - "Safe" / "Aman" = notes LIKE '%aman%' OR notes LIKE '%kondusif%'

3. Data Limits:
   - Always query specific columns, avoid SELECT *
   - Always add LIMIT 10 for list-based queries to prevent token overflow
`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY || !process.env.READ_ONLY_DATABASE_URL) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    if (!groq) {
      groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Processing message:', message);

    // Step 1: Generate SQL query
    const systemPromptSQL = `You are an expert SQL developer. Convert natural language questions into MySQL SELECT queries. Only provide SQL without explanation.

${DATABASE_SCHEMA}

${BUSINESS_RULES}

Rules:
- Only SELECT queries (no INSERT, UPDATE, DELETE)
- WAJIB gunakan JOIN untuk mengambil nama dari tabel relasi. Jangan pernah mengembalikan UUID/ID!
  Contoh JOIN yang WAJIB ada:
  - LEFT JOIN profiles p ON reports.user_id = p.id (pilih p.full_name AS nama_pelapor)
  - LEFT JOIN units u ON reports.unit_id = u.id (pilih u.name AS nama_unit)
  - LEFT JOIN unit_locations l ON reports.location_id = l.id (pilih l.name AS nama_lokasi)
  - LEFT JOIN report_categories c ON reports.category_id = c.id (pilih c.name AS nama_kategori)
- Kolom yang HARUS ada di SELECT: captured_at, nama_pelapor, nama_unit, nama_lokasi, nama_kategori, notes
- Use LIMIT 10 for lists`;

    const sqlResult = await generateText({
      model: groq(AI_MODEL),
      messages: [
        { role: 'system', content: systemPromptSQL },
        { role: 'user', content: `Convert to SQL: "${message}"` }
      ],
      temperature: 0,
    });

    const rawOutput = sqlResult.text;
    console.log('Raw SQL output:', rawOutput);

    // Clean SQL
    let cleanSQL = rawOutput.replace(/```sql/gi, '').replace(/```/g, '').trim();
    const selectMatch = cleanSQL.match(/\bSELECT\b/i);

    if (!selectMatch) {
      return NextResponse.json({ error: 'Failed to generate SQL query' }, { status: 500 });
    }

    cleanSQL = cleanSQL.substring(selectMatch.index!).trim();
    console.log('Clean SQL:', cleanSQL);

    // Step 2: Execute query
    let queryResult;
    try {
      queryResult = await executeReadOnlyQuery(cleanSQL);
    } catch (error) {
      console.error('Query execution error:', error);
      return NextResponse.json({ error: 'Error executing query: ' + (error as Error).message }, { status: 500 });
    }

    // Step 3: Generate natural language response
    const prompt = `
Anda adalah Asisten Cerdas SiPatrol untuk Dashboard HSE. Jelaskan data dengan bahasa natural dan profesional menggunakan format Markdown.

Pertanyaan: "${message}"
Data Hasil Database: ${JSON.stringify(queryResult, null, 2)}

Aturan Format Wajib:
Jika memberikan detail laporan, gunakan struktur list seperti ini:
- **Waktu:** [nilai dari captured_at]
- **Pelapor:** [nilai dari nama_pelapor]
- **Unit / Lokasi:** [nilai dari nama_unit] — [nilai dari nama_lokasi]
- **Kategori:** [nilai dari nama_kategori]
- **Catatan:** "[nilai dari notes]"

Gunakan emoji K3 yang relevan (⚠️, 🛡️, 📝, ✅, 📍). Berikan satu kalimat kesimpulan di akhir. Jika nama tidak ada di data, baru tulis "Tidak diketahui", namun utamakan mengambil data dari JSON di atas.

Jawaban:`;

    const responseResult = await generateText({
      model: groq(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: `Anda adalah analis data keamanan profesional untuk aplikasi SiPatrol.

ATURAN FORMAT:
1. Jawab dengan data NYATA dari field "Data Hasil" di bawah. JANGAN gunakan teks placeholder.
2. Gunakan bullet points (-). Hindari paragraf panjang.
3. Format laporan:
   - **Waktu:** <nilai dari captured_at>
   - **Pelapor:** <nilai dari nama_pelapor>
   - **Unit/Lokasi:** <nilai dari nama_unit> — <nilai dari nama_lokasi>
   - **Kategori:** <nilai dari nama_kategori>
   - **Catatan:** "<nilai dari notes>"
4. JANGAN output teks seperti "[nama]" atau "[waktu]". Ekstrak nilai ASLI dari data.
5. Gunakan emoji K3 yang relevan (⚠️, 🛡️, 📝, ✅, 📍).
6. Akhiri dengan kalimat penutup yang relevan.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      maxTokens: 1000,
    });

    return NextResponse.json({
      success: true,
      response: responseResult.text,
      query: cleanSQL,
      data: queryResult
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ error: 'Error: ' + (error as Error).message }, { status: 500 });
  }
}