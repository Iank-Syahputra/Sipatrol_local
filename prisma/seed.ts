const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai proses seeding...')

  // 1. BERSIHKAN DATA LAMA (Urutan Penting!)
  // Kita hapus dari tabel yang punya Foreign Key dulu biar gak error
  console.log('🧹 Membersihkan data lama...')
  await prisma.report.deleteMany()        // Hapus laporan dulu
  await prisma.unitLocation.deleteMany()  // Hapus lokasi unit
  await prisma.profile.deleteMany()       // Hapus user/profile
  await prisma.reportCategory.deleteMany()// Hapus kategori
  await prisma.unit.deleteMany()          // Terakhir hapus unit
  console.log('✨ Database bersih.')

  // 2. BUAT KATEGORI LAPORAN
  // Schema: name, color, createdAt (default now)
  await prisma.reportCategory.createMany({
    data: [
      { name: 'Aman', color: 'green' },
      { name: 'Unsafe Condition (Kondisi Tidak Aman)', color: 'yellow' },
      { name: 'Unsafe Action (Perilaku Tidak Aman)', color: 'red' },
    ],
  })
  console.log('✅ Kategori Laporan dibuat.')

  // 3. BUAT UNIT & LOKASI
  // Kita pakai nested create agar lokasi langsung terhubung ke unitnya
  const unitWuaWua = await prisma.unit.create({
    data: {
      name: 'ULPLTD WUAWUA',
      district: 'Kendari',
      // createdAt otomatis diisi oleh database (@default(now))
      locations: {
        create: [
          { name: 'Pos Security Utama' },
          { name: 'Ruang Mesin' },
          { name: 'Gudang BBM' },
          { name: 'Area Parkir' },
        ],
      },
    },
  })

  const unitRaha = await prisma.unit.create({
    data: {
      name: 'ULPLTD RAHA',
      district: 'Muna',
      locations: {
        create: [
          { name: 'Gerbang Depan' },
          { name: 'Ruang Control Room' },
        ],
      },
    },
  })
  console.log('✅ Unit & Lokasi dibuat.')

  // 4. SIAPKAN PASSWORD
  const adminPassword = await bcrypt.hash('admin123', 10)
  const securityPassword = await bcrypt.hash('luffy123', 10)

  // 5. BUAT USER ADMIN
  // Schema: username, password, fullName, role, assignedUnitId (nullable)
  await prisma.profile.create({
    data: {
      username: 'admin',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'admin', // Sesuai Enum Role
      // Admin tidak wajib punya unit, jadi assignedUnitId kita kosongkan
    },
  })
  console.log('✅ Akun Admin dibuat (User: admin / Pass: admin123)')

  // 6. BUAT USER SECURITY (Luffy)
  await prisma.profile.create({
    data: {
      username: 'luffy',
      password: securityPassword,
      fullName: 'Monkey D. Luffy',
      role: 'security', // Sesuai Enum Role
      phoneNumber: '081234567890',
      assignedUnitId: unitWuaWua.id, // Sambungkan ke Unit WuaWua
    },
  })
  console.log('✅ Akun Security dibuat (User: luffy / Pass: luffy123)')
}

main()
  .catch((e) => {
    console.error('❌ Terjadi error saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })