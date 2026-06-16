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
- Use proper JOIN syntax
- Use LIMIT 10 for lists
- Select only necessary columns`;

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
Anda adalah Asisten Cerdas SiPatrol untuk Dashboard HSE. Jelaskan data dengan bahasa natural dan profesional.

Pertanyaan: "${message}"
SQL Query: ${cleanSQL}
Data Hasil: ${JSON.stringify(queryResult, null, 2)}

Aturan:
1. Langsung jawab inti, hindari basa-basi robotik
2. Gunakan bold untuk: **Nama Pelapor**, **Unit**, **Lokasi**, **Kategori**, **Waktu**
3. Gunakan emoji K3 yang relevan (⚠️, 🛡️, 📝, ✅)
4. Jika data kosong, jelaskan dengan sopan
5. Format dalam paragraf terstruktur, bukan data mentah
6. Jangan sebut ID/UUID yang abstrak

Jawaban:`;

    const responseResult = await generateText({
      model: groq(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: 'Anda adalah analis data keamanan profesional. Berikan jawaban informatif dalam Bahasa Indonesia dengan format markdown yang terstruktur.'
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