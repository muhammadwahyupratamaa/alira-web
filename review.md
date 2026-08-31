# Review command

```bash
npm run format:check && npm run lint && npm run typecheck && npm test -- --run && npm run build
```

# Alira frontend — feature and flow review

Dokumen ini merangkum fitur frontend yang sudah tersedia, alur pengguna, dan batasan yang masih bergantung pada backend.

## Ringkasan flow aplikasi

```text
Register
  -> Login
  -> cek account aktif
      -> belum ada: Onboarding Account (/accounts/new)
      -> sudah ada: Dashboard

Dashboard
  -> lihat saldo, ringkasan bulanan, kategori, account, transaksi terbaru
  -> pilih account/kategori untuk membuka History dengan filter URL
  -> Quick Add Transaction (modal)
      -> simpan transaksi
      -> refresh Dashboard + Account + History

Navigasi utama
  -> Transaksi: cari, filter, urutkan, detail, duplikat, hapus, Undo
  -> Account: buat, lihat saldo, ubah, nonaktifkan
  -> Kategori: tambah, ubah custom, nonaktifkan/hapus sesuai respons API
  -> Profile: preferensi, ubah password di modal, logout
```

## Authentication

- Register dan login dengan validasi email/password di frontend.
- Access token hanya disimpan di memory; tidak disimpan di `localStorage` atau `sessionStorage`.
- Bootstrap sesi menggunakan refresh cookie dan `/auth/me`.
- Ketika refresh gagal, auth state dibersihkan dan user kembali ke login.
- Login mengecek `GET /accounts` setelah autentikasi:
  - ada account aktif -> Dashboard;
  - belum ada account aktif -> onboarding Account.
- Logout membersihkan auth state frontend.

## Dashboard

- Total saldo seluruh account aktif.
- Pemasukan, pengeluaran, net saving, dan perbandingan bulan sebelumnya.
- Breakdown pengeluaran per kategori dengan doughnut chart.
- Lima transaksi terbaru.
- Account Overview untuk maksimal tiga account aktif, termasuk saldo dan link History terfilter.
- Pemilih periode bulanan.
- Loading, error/retry, dan empty state.
- Tampilan mobile-first dengan surface translucent, blur lembut, sidebar responsif, dan angka Rupiah tabular.
- Total Balance memakai ukuran `clamp()` dan `white-space: nowrap` agar digit nominal besar tidak pecah baris.

## Quick Add Transaction

- Tombol `Tambah transaksi` di Dashboard membuka modal, bukan memindahkan user ke halaman lain.
- Fokus awal langsung ke nominal.
- Mendukung keyboard submit, Escape, tombol X, dan klik backdrop untuk menutup saat tidak sedang menyimpan.
- Menggunakan validasi dan API transaksi yang sama dengan halaman transaksi biasa.
- Setelah sukses, query transaksi, account, dan dashboard di-refresh.
- Toast sukses menyediakan Undo selama 8 detik. Undo melakukan soft delete pada transaksi yang baru dibuat lalu me-refresh Dashboard, Account, dan History.
- Tipe transaksi, account, dan kategori terakhir diingat selama session browser untuk mempercepat pencatatan berikutnya.
- Halaman `/transactions/new` tetap tersedia sebagai alternatif full-page.

## Transactions

- Buat dan ubah transaksi income/expense.
- Validasi nominal, account, kategori, tipe kategori, tanggal masa depan, dan catatan.
- Filter tanggal, account, kategori, tipe; search; sorting ramah user; dan pagination backend.
- Filter disimpan pada URL query.
- Detail transaksi, duplicate, soft delete, restore melalui tombol Undo.
- Nominal diperlakukan sebagai string decimal; tidak ada kalkulasi floating-point di frontend.

## Account

- Membuat account Cash, Bank, dan E-Wallet dengan saldo awal.
- Melihat saldo berjalan dan saldo awal per account.
- Ubah detail account.
- Nonaktifkan account melalui dialog konfirmasi.
- Account aktif dan nonaktif menggunakan komponen/grid/card yang sama agar layout tidak collapse.
- Account nonaktif tetap menampilkan saldo dan riwayat, tetapi tidak memiliki aksi nonaktifkan lagi.
- Grid responsif: satu kolom mobile dan menyesuaikan jumlah kolom berdasarkan ruang tersedia.

## Category

- Menampilkan kategori default dan custom.
- Membuat serta mengubah kategori custom.
- Menampilkan status aktif/nonaktif berdasarkan respons API.
- Form transaksi hanya menawarkan kategori aktif dengan tipe yang cocok.

## Profile dan settings

- Profile overview: avatar berbasis inisial email, email, mata uang, dan timezone.
- Ubah preferensi currency IDR dan timezone dengan validasi IANA timezone.
- Layout desktop dua kolom; tablet/mobile satu kolom tanpa card kosong berlebihan.
- Password tidak lagi memakai form permanen di halaman.
- `Ubah password` membuka modal aksesibel dengan:
  - password saat ini, password baru, konfirmasi;
  - show/hide password dengan ikon mata;
  - validasi Zod dan error API;
  - loading state dan pencegahan submit ganda;
  - Cancel, X, Escape, backdrop click, focus trap, dan restore focus;
  - form password dibersihkan setelah berhasil dan modal ditutup.
- Logout tersedia dari Profile dan sidebar.

## Shared UI dan accessibility

- Dropdown aplikasi memakai custom shadcn/Radix Select; tidak ada native `<select>` untuk dropdown aplikasi.
- Label sort transaksi memakai bahasa user, bukan `asc`/`desc`.
- Font, radius, shadow, border, warna teal, dan glass surface diseragamkan.
- State loading, empty, success, error, disabled, focus-visible, dan reduced-motion tersedia pada flow utama.
- Income dan expense tidak dibedakan oleh warna saja: ada tanda `+`/`−`, label, dan teks.

## PRD frontend yang belum dapat dibuat tanpa backend baru

- Grafik bar/line income vs expense lintas periode: kontrak saat ini hanya menyediakan satu summary bulanan dan breakdown expense, belum ada endpoint time-series.
- Semua item backend/infrastruktur: rate limit, rotasi refresh token, ownership authorization, database constraint, Swagger, Docker, CI/CD, health endpoint, dan deployment.

## Verification terakhir

- Format: pass.
- ESLint: pass.
- Strict typecheck: pass.
- Vitest: 49 tests pass.
- Production build: pass.
- Review diff dan `git diff --check`: bersih saat commit terakhir.

## Commit terkait

- `23a70b5 feat: add dashboard quick transaction flow`
- `33e496e feat: complete dashboard account onboarding flow`
- `95327d4 feat: polish profile settings experience`
- `79122a4 feat: polish dashboard and account surfaces`
