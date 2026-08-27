import { ApiError } from '../../lib/api/api-client';
export function getProfileErrorMessage(error: unknown): string {
  if (error instanceof TypeError)
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  if (!(error instanceof ApiError))
    return 'Terjadi kesalahan. Silakan coba lagi.';
  if (error.status === 400) return 'Data yang dimasukkan belum valid.';
  if (error.status === 401) return 'Sesi atau password saat ini tidak valid.';
  if (error.status === 403) return 'Operasi ini tidak diizinkan.';
  if (error.status === 404) return 'Profil tidak ditemukan.';
  if (error.status === 409)
    return 'Perubahan bertentangan dengan data yang tersedia.';
  if (error.status === 429)
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (error.status >= 500)
    return 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
  return 'Permintaan tidak dapat diproses.';
}
