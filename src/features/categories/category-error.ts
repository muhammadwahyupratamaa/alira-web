import { ApiError } from '../../lib/api/api-client';

export function getCategoryErrorMessage(error: unknown): string {
  if (error instanceof TypeError)
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  if (!(error instanceof ApiError))
    return 'Terjadi kesalahan. Silakan coba lagi.';
  if (error.status === 400)
    return 'Data kategori belum valid. Periksa kembali input Anda.';
  if (error.status === 401)
    return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  if (error.status === 403)
    return 'Kategori bawaan sistem tidak dapat diubah atau dinonaktifkan.';
  if (error.status === 404)
    return 'Kategori tidak ditemukan atau tidak dapat diakses.';
  if (error.status === 409)
    return 'Nama kategori tersebut sudah digunakan untuk tipe yang sama.';
  if (error.status === 429)
    return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (error.status >= 500)
    return 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
  return 'Permintaan kategori tidak dapat diproses.';
}
