import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route'; // Path naik 3 level
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper: Validasi Password (VERSI BEBAS)
function validatePasswordStrength(password: string): string | null {
  // Cek jika kosong
  if (!password || password.length === 0) {
    return 'Password baru wajib diisi';
  }

  // Opsional: Minimal 4 karakter (Saran minimal keamanan)
  if (password.length < 4) {
    return 'Password minimal 4 karakter';
  }

  // Tidak ada syarat huruf besar, angka, atau simbol. Langsung lolos.
  return null;
}

// POST: Endpoint khusus ganti password
export async function POST(request: Request) {
  console.log('API Ganti Password dipanggil!'); // Cek terminal VS Code Anda nanti

  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // 1. Ambil User
    const user = await prisma.profile.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // 2. Cek Password Lama
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(currentPassword, user.password || '');
    } catch (e) {
      // Fallback untuk password lama (plain text)
      isValidPassword = currentPassword === user.password;
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password lama salah!' }, { status: 400 });
    }

    // 3. Validasi Password Baru
    const passwordValidation = validatePasswordStrength(newPassword);
    if (passwordValidation !== null) {
      return NextResponse.json({ error: passwordValidation }, { status: 400 });
    }

    // 4. Hash & Update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.profile.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error ganti password:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}