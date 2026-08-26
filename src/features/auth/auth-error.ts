import { ApiError } from '../../lib/api/api-client';

export function getAuthErrorMessage(
  error: unknown,
  context: 'login' | 'register',
) {
  if (error instanceof TypeError) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.';
  }

  if (!(error instanceof ApiError)) {
    return 'Terjadi kesalahan. Silakan coba lagi.';
  }

  if (error.status === 429) {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  }

  if (context === 'login' && error.status === 401) {
    return 'Email atau kata sandi tidak sesuai.';
  }

  if (context === 'register' && error.status === 409) {
    return 'Email tersebut sudah digunakan. Silakan gunakan email lain.';
  }

  if (error.status === 400) {
    return 'Data yang dimasukkan belum valid. Periksa kembali formulir Anda.';
  }

  if (error.status >= 500) {
    return 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
  }

  return 'Permintaan tidak dapat diproses. Silakan coba lagi.';
}
