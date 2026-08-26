import { ApiError } from '../../lib/api/api-client';

export function getAccountErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  }
  if (!(error instanceof ApiError)) {
    return 'Terjadi kesalahan. Silakan coba lagi.';
  }
  if (error.status === 400)
    return 'Data account belum valid. Periksa kembali formulir Anda.';
  if (error.status === 401)
    return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  if (error.status === 404)
    return 'Account tidak ditemukan atau tidak dapat diakses.';
  if (error.status === 409)
    return 'Minimal satu account aktif harus tetap tersedia.';
  if (error.status === 429)
    return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (error.status >= 500)
    return 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
  return 'Permintaan account tidak dapat diproses.';
}
