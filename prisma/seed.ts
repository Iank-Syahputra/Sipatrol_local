// prisma/seed.ts

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai mengisi data awal (Seeding)...')

  // 1. Buat Kategori Laporan (Sesuai SQL lama Anda)
  await prisma.reportCategory.createMany({
    data: [
      { name: 'Aman', color: 'green' },
      { name: 'Unsafe Condition (Kondisi Tidak Aman)', color: 'yellow' },
      { name: 'Unsafe Action (Perilaku Tidak Aman)', color: 'red' },
    ],
    skipDuplicates: true, // Agar tidak error kalau dijalankan 2x
  })
  console.log('✅ Kategori Laporan dibuat.')

  // 2. Buat Unit PLN (Contoh: UP KENDARI)
  const unitKendari = await prisma.unit.create({
    data: {
      name: 'UP KENDARI',
      district: 'Kendari',
      // Kita buat lokasi sekalian
      locations: {
        create: [
          { name: 'Lobby Utama' },
          { name: 'Pos Security Depan' },
          { name: 'Ruang Server' },
          { name: 'Area Parkir' },
        ],
      },
    },
  })
  console.log('✅ Unit UP KENDARI & Lokasi dibuat.')

  // 3. Buat Akun ADMIN (Penting untuk login pertama!)
  // Passwordnya kita set: "admin123"
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.profile.create({
    data: {
      username: 'admin',      // Username login
      password: hashedPassword, 
      fullName: 'Super Admin',
      role: 'admin',
      assignedUnitId: unitKendari.id, // Admin ditugaskan di Kendari
    },
  })
  console.log('✅ Akun Admin dibuat (User: admin, Pass: admin123)')

  // 4. Buat Akun SECURITY (Contoh)
  const passSecurity = await bcrypt.hash('security123', 10)
  
  await prisma.profile.create({
    data: {
      username: 'security',
      password: passSecurity,
      fullName: 'security1',
      role: 'security',
      assignedUnitId: unitKendari.id,
      phoneNumber: '08123456789',
    },
  })
  console.log('✅ Akun Security dibuat (User: darmayanti, Pass: security123)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })