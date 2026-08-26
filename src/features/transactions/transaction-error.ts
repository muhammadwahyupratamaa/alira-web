import { ApiError } from '../../lib/api/api-client';
export function getTransactionErrorMessage(error: unknown): string {
  if (error instanceof TypeError)
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  if (!(error instanceof ApiError))
    return 'Terjadi kesalahan. Silakan coba lagi.';
  if (error.status === 400) return 'Data transaksi atau filter belum valid.';
  if (error.status === 401)
    return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  if (error.status === 404)
    return 'Transaksi atau resource terkait tidak ditemukan.';
  if (error.status === 409)
    return 'Transaksi tidak dapat diproses karena konflik data.';
  if (error.status === 429)
    return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (error.status >= 500)
    return 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
  return 'Permintaan transaksi tidak dapat diproses.';
}
