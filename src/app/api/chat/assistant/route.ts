import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { executeReadOnlyQuery } from '@/lib/db-readonly';
const AI_MODEL = "llama-3.3-70b-versatile";

// Log environment variables (be careful not to expose sensitive data in production)
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('READ_ONLY_DATABASE_URL exists:', !!process.env.READ_ONLY_DATABASE_URL);

// Initialize Groq client with error handling
let groq: Groq;
try {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables');
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} catch (error) {
  console.error('Failed to initialize Groq client:', error);
  // We'll handle this in the POST function instead of crashing the module
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

// Define business rules for the AI
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
   - Always query specific columns, avoid SELECT * if possible
   - Always add LIMIT 10 for list-based queries to prevent token overflow
`;

export async function POST(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set in environment variables' },
        { status: 500 }
      );
    }

    if (!process.env.READ_ONLY_DATABASE_URL) {
      console.error('READ_ONLY_DATABASE_URL is not set in environment variables');
      return NextResponse.json(
        { error: 'READ_ONLY_DATABASE_URL is not set in environment variables' },
        { status: 500 }
      );
    }

    // Re-initialize groq client if needed
    if (!groq) {
      try {
        groq = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
      } catch (error) {
        console.error('Failed to initialize Groq client in POST handler:', error);
        return NextResponse.json(
          { error: 'Failed to initialize AI service' },
          { status: 500 }
        );
      }
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Processing message:', message);

    // Step 1: Use LLM to translate natural language to SQL query with robust cleaning
    const systemPromptSQL = `You are an expert SQL developer. Your job is to convert natural language questions into accurate MySQL SELECT queries based on the provided schema and business rules. Only provide the SQL query without any additional text or explanation. Pay close attention to proper SQL syntax, especially JOIN clauses and WHERE conditions.

${DATABASE_SCHEMA}

${BUSINESS_RULES}`;

    const lastMessage = `Convert the following natural language question into a valid MySQL SELECT query:

Question: "${message}"

Important guidelines:
1. Only generate SELECT queries (no INSERT, UPDATE, DELETE, etc.)
2. Use proper JOIN syntax: "JOIN table_name alias ON left_table.column = right_table.column"
3. Use appropriate JOINs to connect related tables (units, profiles, reports, report_categories, unit_locations)
4. Apply the time definitions and safety classifications as specified in the business rules
5. Use LIMIT 10 for list-based queries to prevent token overflow
6. Select only the necessary columns, avoid SELECT *
7. Format the query properly with correct syntax
8. Do NOT repeat column names in JOIN conditions (e.g., avoid "ON r.category_id = rc.d = rc.id")
9. Use correct LIKE syntax: "column LIKE '%keyword%'"
10. Use proper WHERE clause syntax

Provide only the SQL query without any additional explanation:

MySQL Query:`;

    // 1. Request to Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPromptSQL },
        { role: "user", content: lastMessage }
      ],
      model: AI_MODEL,
      temperature: 0, 
    });

    const rawOutput = completion.choices[0]?.message?.content || "";
    console.log("🤖 Raw AI Output:", rawOutput); 

    // --- SMART SQL CLEANING ---
    // A. Remove Markdown
    let cleanSQL = rawOutput.replace(/```sql/gi, '').replace(/```/g, '');

    // B. Find the first "SELECT" keyword (ignoring case)
    const selectMatch = cleanSQL.match(/\bSELECT\b/i);
    
    if (!selectMatch || selectMatch.index === undefined) {
      console.error("❌ SQL Error: No SELECT keyword found in output.");
      return NextResponse.json({ 
        role: 'assistant', 
        content: "Maaf, saya gagal membuat query database yang valid. Mohon ulangi pertanyaan." 
      });
    }

    // C. Extract everything starting from SELECT
    cleanSQL = cleanSQL.substring(selectMatch.index).trim();
    
    console.log("🧹 Final Executed SQL:", cleanSQL);

    // --- EXECUTE ---
    let queryResult;
    try {
      queryResult = await executeReadOnlyQuery(cleanSQL);
      console.log('Query result:', queryResult);
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      return NextResponse.json(
        { error: 'Error executing database query: ' + (queryError as Error).message },
        { status: 500 }
      );
    }

    // Step 3: Use LLM to generate natural language response from query results
    let response;
    try {
      // Set a timeout for response generation to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Response generation timeout')), 15000); // 15 second timeout
      });
      
      const responsePromise = generateNaturalLanguageResponse(message, cleanSQL, queryResult);
      response = await Promise.race([responsePromise, timeoutPromise]) as string;
    } catch (responseError) {
      console.error('Error generating natural language response:', responseError);
      return NextResponse.json(
        { error: 'Error generating response: ' + (responseError as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response,
      query: cleanSQL,
      data: queryResult
    });
  } catch (error) {
    console.error('Dashboard assistant error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request: ' + (error as Error).message },
      { status: 500 }
    );
  }
}


async function generateNaturalLanguageResponse(
  originalQuestion: string,
  sqlQuery: string,
  queryResult: any[]
): Promise<string> {
  // Deteksi jika hasil kosong untuk penyesuaian nada bicara
  const isDataEmpty = !queryResult || queryResult.length === 0;

  const prompt = `
    Anda adalah Asisten Cerdas untuk Dashboard HSE (Health, Safety, Environment) bernama "SiPatrol".
    Tugas Anda adalah menjelaskan data keamanan kepada pengguna dengan bahasa yang **natural, mengalir, dan profesional**, layaknya seorang rekan kerja ahli K3, bukan robot.

    --- KONTEKS ---
    Pertanyaan User: "${originalQuestion}"
    Data Temuan (JSON): ${JSON.stringify(queryResult, null, 2)}
    
    --- ATURAN GAYA BAHASA (PENTING) ---
    1. **HINDARI BASA-BASI ROBOTIK**: Jangan memulai kalimat dengan "Berdasarkan hasil analisis database...", "Query yang dijalankan adalah...", atau "Saya adalah analis...". Langsung jawab intinya.
    2. **KONTEKS SAPAAN**: Jika user hanya menyapa (contoh: "hai", "selamat pagi", "halo"), balas dengan ramah dan tawarkan bantuan terkait data patroli. JANGAN membahas data kosong jika user hanya menyapa.
    3. **NARASI MENGALIR**: Ubah data JSON menjadi kalimat paragraf yang enak dibaca.
    4. **JANGAN SEBUT ID/UUID**: User tidak mengerti kode acak (misal: "e4885..."). Gunakan Nama Pelapor,Unit atau Lokasi sebagai identitas.
    5. **PENJELASAN SEBAB-AKIBAT**: Jika ada kolom 'notes', jelaskan itu sebagai penyebab atau kondisi yang terjadi. Gunakan kata penghubung seperti "dikarenakan", "dengan temuan", atau "catatan lapangan menyebutkan".

    --- FORMATTING ---
    - Gunakan **Bold** hanya untuk: **Nama Pelapor**, **Nama Unit**, **Lokasi**, **Kategori Laporan**, dan **Waktu/Tanggal**.
    - Gunakan Emoji K3 yang relevan (seperti ⚠️, 🛡️, 📝, ✅) di awal paragraf untuk visualisasi cepat, tapi jangan berlebihan.

    --- SKENARIO JAWABAN ---
    
    [SKENARIO 1: DATA DITEMUKAN]
    Contoh gaya bicara: 
    "⚠️ Terdapat laporan terbaru kategori **Unsafe Condition** dari unit **UP KENDARI**. Laporan ini dibuat pada **5 Februari 2026** di lokasi **Area Turbin**. Petugas mencatat adanya tumpahan oli yang berpotensi bahaya slip..."

    [SKENARIO 2: DATA KOSONG]
    Contoh gaya bicara:
    "✅ Tidak ditemukan laporan aneh atau insiden yang sesuai dengan kriteria pencarian Anda dalam periode ini. Sepertinya kondisi di lapangan relatif aman terkendali."

    [SKENARIO 3: USER BERTANYA "KENAPA"]
    Jelaskan alasan berdasarkan kolom 'notes'. Jika notes tidak jelas, katakan apa adanya dengan sopan.

    Silakan jawab pertanyaan user sekarang dengan gaya bahasa di atas:
  `;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Anda adalah seorang Analis Data Keamanan profesional yang memberikan jawaban dalam Bahasa Indonesia. Berikan jawaban yang informatif, ringkas, dan kontekstual berdasarkan data yang tersedia. Gunakan format markdown untuk mencetak tebal hanya elemen penting berikut: nama pelapor, nama unit, kategori laporan, nama lokasi, dan waktu/tanggal. Hindari menyebut ID yang abstrak, sebutkan nama pelapor atau nama unit yang relevan. Gunakan terminology HSE (Kesehatan, Keselamatan, Lingkungan) yang sesuai. Format jawaban dalam bentuk paragraf yang terstruktur, bukan hanya data mentah.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content?.trim() || 'Tidak dapat menghasilkan jawaban saat ini.';
  } catch (error) {
    console.error('Error generating natural language response:', error);
    return 'Tidak dapat menghasilkan jawaban saat ini. Silakan coba lagi.';
  }
}