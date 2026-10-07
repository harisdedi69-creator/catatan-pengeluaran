# 💰 CatatDuit Pro - Catatan Pengeluaran Harian

Aplikasi pencatatan pengeluaran harian modern dengan desain visual menarik (Glassmorphism, Dark/Light Mode), fitur canggih (Grafik Analitik Interaktif, Smart Budget Bar, Split Bill Calculator, Export CSV/PDF), dan integrasi basis data cloud **Supabase** + fallback **Local Storage**.

---

## ✨ Fitur-Fitur Unggulan

1. **🎨 Tampilan Modern & Menarik**:
   - Desain Glassmorphism dengan Tailwind CSS & palet warna Indigo-Emerald.
   - Dukungan **Dark Mode** & **Light Mode** instan.
   - Efek perayaan konfeti (*Canvas Confetti*) saat mencatat pengeluaran.
   - Responsif untuk layar Desktop, Tablet, dan Smartphone.

2. **📊 Analitik & Grafik Interaktif (Chart.js)**:
   - **Tren Pengeluaran Harian**: Grafik area dengan pilihan rentang 7 hari atau 30 hari.
   - **Distribusi Kategori**: Grafik donat untuk melihat persentase pengeluaran per kategori.
   - **Rasio Kebutuhan vs Keinginan**: Evaluasi pengeluaran esensial (*Needs*) vs sekunder (*Wants*) vs darurat.

3. **🎯 Smart Budget & Peringatan Dini**:
   - Pengaturan batas pengeluaran harian dan target bulanan.
   - Visual progress bar gauge yang berubah warna otomatis (Hijau -> Kuning -> Merah).
   - Banner notifikasi peringatan jika pengeluaran sudah mendekati atau melebihi limit harian.

4. **⚡ Preset Cepat 1-Klik**:
   - Tombol sekali klik untuk pengeluaran rutin harian (Kopi, Makan Siang, Bensin, Parkir, Pulsa).

5. **🔍 Filter & Pencarian Lengkap**:
   - Pencarian teks instan (judul, catatan, kategori).
   - Filter berdasarkan Kategori belanja.
   - Filter berdasarkan Metode Pembayaran (Tunai, QRIS, Transfer, E-Wallet, Kartu).
   - Filter Rentang Waktu (Hari ini, 7 hari terakhir, Bulan ini, Semua).
   - Pengurutan data (Terbaru, Terlama, Nominal Terbesar, Terkecil).

6. **🧮 Kalkulator Split Bill (Bagi Bon)**:
   - Hitung patungan makanan bersama teman lengkap dengan persentase pajak & service.
   - Tombol 1-klik untuk langsung mencatat bagian sendiri ke riwayat pengeluaran.

7. **📥 Ekspor & Laporan**:
   - Unduh seluruh data ke format **Excel / CSV**.
   - Cetak laporan rapi atau Simpan ke format **PDF**.

8. **☁️ Integrasi Supabase Cloud + Mode Lokal**:
   - Terintegrasi penuh dengan Supabase Database via Supabase JS Client v2.
   - Otomatis beralih ke Mode Lokal (*LocalStorage*) jika belum terhubung atau saat offline, sehingga aplikasi **selalu siap pakai kapan saja**.
   - Fitur 1-klik untuk mengunggah (*sync*) data lokal ke Supabase Cloud setelah terhubung.

---

## 🚀 Cara Menjalankan Proyek

### Cara 1: Menggunakan Script Python (Otomatis Buka Browser)
Jalankan perintah berikut di PowerShell atau Command Prompt:
```bash
python C:\Users\ASUS\.gemini\antigravity\scratch\catatan-pengeluaran\start_server.py
```
Browser akan otomatis terbuka di `http://localhost:8000`.

### Cara 2: Langsung Buka File HTML
Anda juga bisa langsung membuka file `index.html` dengan klik ganda di File Explorer:
`C:\Users\ASUS\.gemini\antigravity\scratch\catatan-pengeluaran\index.html`

---

## 🛠️ Panduan Menghubungkan ke Database Supabase

Jika Anda ingin menyimpan data secara online di cloud Supabase:

### Langkah 1: Buat Proyek di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan buat akun gratis.
2. Buat proyek baru (*New Project*).

### Langkah 2: Buat Tabel Database
1. Di dashboard Supabase, klik menu **SQL Editor** pada navigasi sebelah kiri.
2. Buka file `supabase_schema.sql` yang ada di dalam folder proyek ini.
3. Salin (*copy*) seluruh isinya, tempel ke SQL Editor Supabase, lalu klik tombol **Run**.

### Langkah 3: Ambil Kunci API
1. Buka menu **Project Settings** (ikon gear di kiri bawah) > **API**.
2. Salin **Project URL** (contoh: `https://xyzabcdefg.supabase.co`).
3. Salin **Project API Keys** bagian **`anon` `public`**.

### Langkah 4: Masukkan ke Aplikasi
1. Buka aplikasi CatatDuit Pro di browser.
2. Klik tombol status **"Mode Lokal"** atau ikon gear di navigasi atas.
3. Tempelkan URL dan Anon Key Anda, lalu klik **"Uji & Simpan Koneksi"**.
4. Selesai! Indikator akan berubah menjadi hijau **"Supabase Cloud: Terhubung"**. Anda juga bisa menekan tombol **"Unggah Data Lokal"** untuk menyinkronkan data yang sudah pernah dicatat sebelumnya.

---

## 📁 Struktur Berkas Proyek

```
catatan-pengeluaran/
├── index.html              # Antarmuka utama aplikasi (Tailwind, Lucide, Chart.js)
├── css/
│   └── style.css           # Glassmorphism styling, animasi, print stylesheet
├── js/
│   ├── config.js           # Konfigurasi kategori, preset cepat, format Rupiah
│   ├── db.js               # Abstraksi database Supabase & LocalStorage fallback
│   ├── charts.js           # Controller grafik interaktif Chart.js
│   └── app.js              # Controller utama aplikasi (state, filter, modal, ekspor)
├── supabase_schema.sql     # Skrip SQL lengkap untuk setup tabel dan RLS di Supabase
├── start_server.py         # Skrip server lokal Python portabel
└── README.md               # Dokumentasi lengkap proyek
```
