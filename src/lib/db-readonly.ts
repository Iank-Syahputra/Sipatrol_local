import mysql from 'mysql2/promise';

/**
 * DAFTAR KEYWORD TERLARANG
 * Kita tambahkan spasi (misal ' DELETE ') atau batas kata agar kata-kata 
 * umum dalam kalimat (seperti "update status") tidak ikut terblokir.
 */
const BLOCKED_KEYWORDS = [
  'DROP ', 'DELETE ', 'UPDATE ', 'INSERT ', 'ALTER ', 
  'TRUNCATE ', 'GRANT ', 'REVOKE ', 'CREATE USER', 
  'FLUSH ', 'COMMIT', 'ROLLBACK'
];

/**
 * Membersihkan dan memvalidasi query
 */
function validateQuery(sql: string): string {
  // 1. Sanitasi: Hapus komentar SQL (-- atau /* */) biar tidak menipu validasi
  const cleanSql = sql
    .replace(/--.*$/gm, '')       // Hapus komentar satu baris
    .replace(/\/\*[\s\S]*?\*\//g, '') // Hapus komentar blok
    .trim();

  const upperSql = cleanSql.toUpperCase();

  // 2. Cek apakah diawali perintah BACA (Read-Only)
  // Kita izinkan: SELECT, WITH (untuk CTE), SHOW, DESCRIBE, dan kurung buka '('
  const isReadCommand = 
    upperSql.startsWith('SELECT') || 
    upperSql.startsWith('WITH') || 
    upperSql.startsWith('SHOW') || 
    upperSql.startsWith('DESCRIBE') || 
    upperSql.startsWith('(');

  if (!isReadCommand) {
    throw new Error(`Blocked SQL: Query must start with SELECT, WITH, or SHOW. Got: ${cleanSql.substring(0, 20)}...`);
  }

  // 3. Cek keyword berbahaya (Blacklist)
  // Kita cek apakah ada keyword terlarang yang berdiri sendiri (bukan bagian dari kata lain)
  for (const keyword of BLOCKED_KEYWORDS) {
    if (upperSql.includes(keyword)) {
       throw new Error(`Blocked SQL: Contains forbidden keyword "${keyword.trim()}"`);
    }
  }

  return cleanSql;
}

/**
 * Executes a read-only SQL query against the database
 */
export async function executeReadOnlyQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  // 1. Validasi Query
  const cleanQuery = validateQuery(query);

  // Debugging: Lihat query apa yang dijalankan (Bisa dihapus nanti)
  // console.log("🛡️ Executing SQL:", cleanQuery);

  // 2. Ambil Konfigurasi DB
  const connectionString = process.env.READ_ONLY_DATABASE_URL;
  if (!connectionString) {
    throw new Error('READ_ONLY_DATABASE_URL environment variable is not set.');
  }

  let connection: mysql.Connection | null = null;
  
  try {
    // 3. Buat Koneksi
    connection = await mysql.createConnection(connectionString);
    
    // 4. Eksekusi
    const [results] = await connection.execute(cleanQuery, params || []);
    
    // 5. Return Hasil
    // mysql2 execute mengembalikan [rows, fields]. Kita cuma butuh rows.
    if (Array.isArray(results)) {
      return results as T[];
    }
    
    return [] as T[];

  } catch (error: any) {
    console.error('Database Query Error:', error.message);
    throw error; // Lempar error ke API Route biar ditangkap di sana
  } finally {
    // 6. Tutup Koneksi (Penting!)
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Validates the read-only database connection
 */
export async function validateReadOnlyConnection(): Promise<boolean> {
  const connectionString = process.env.READ_ONLY_DATABASE_URL;
  if (!connectionString) return false;

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(connectionString);
    await connection.execute('SELECT 1'); // Tes query ringan
    return true;
  } catch (error) {
    console.error('Read-Only DB Connection Failed:', error);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}