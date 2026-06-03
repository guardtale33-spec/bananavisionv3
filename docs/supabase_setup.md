# Panduan Integrasi Supabase Storage — BananaVision

Dokumen ini menjelaskan langkah-langkah untuk menyiapkan dan menghubungkan **Supabase Storage** sebagai media penyimpanan cloud model AI (`.keras`) Anda di lingkungan production.

---

## 1. Konfigurasi di Dashboard Supabase

Ikuti langkah berikut di [Supabase Console](https://supabase.com/):

### Langkah 1: Buat Bucket Baru
1. Masuk ke dashboard proyek Supabase Anda.
2. Klik menu **Storage** di sidebar kiri.
3. Klik tombol **New bucket**.
4. Beri nama bucket: **`models`** (atau sesuaikan dengan nama yang Anda inginkan).
5. Aktifkan opsi **Public bucket** agar file model dapat diunduh langsung oleh server Python melalui URL publik.
6. Klik **Save**.

### Langkah 2: Atur Policies (Kebijakan Akses)
Agar backend Node.js Anda dapat mengunggah file ke bucket, Anda harus memberikan izin upload:
1. Pada bucket `models` yang baru dibuat, klik tab **Policies**.
2. Di bagian **Storage Policies**, klik **New Policy**.
3. Pilih **Allowed Access** (atau buat policy manual).
4. Centang operasi **`INSERT`**, **`SELECT`**, **`UPDATE`**, dan **`DELETE`**.
5. Di bagian target user, pastikan izin diberikan untuk semua user (atau batasi menggunakan API key Service Role jika menginginkan keamanan lebih ketat).
6. Klik **Review** lalu **Save Policy**.

---

## 2. Instalasi Dependency pada Backend Node.js
Buka terminal Anda, masuk ke folder `backend/`, lalu jalankan perintah berikut untuk menginstal SDK resmi Supabase:

```bash
cd backend
npm install @supabase/supabase-js
```

---

## 3. Tambahkan Environment Variables
Buka file `backend/.env` Anda dan tambahkan konfigurasi Supabase berikut:

```env
# Supabase Configuration
SUPABASE_URL=https://<id-proyek-supabase-anda>.supabase.co
SUPABASE_KEY=<api-key-anon-atau-service-role-anda>
SUPABASE_BUCKET=models
```

---

## 4. Alur Kerja Sistem (Bagaimana Ini Bekerja?)

1. **Admin** mengunggah file model (`.keras`) di panel admin.
2. **Node.js Backend** menyimpan file secara sementara, lalu mengunggahnya ke Supabase Storage.
3. Setelah terunggah, Node.js mendapatkan **URL Publik** model dari Supabase, menyimpan record di MongoDB, lalu menghapus file sementara.
4. **Node.js** memicu server **Python** melalui endpoint `/api/reload` dengan membawa URL publik tersebut.
5. Server **Python** akan secara otomatis mengunduh file `.keras` dari Supabase ke direktori lokalnya lalu memuatnya ke memori TensorFlow.

---

## 5. Sinkronisasi Saat Server Python Restart
Jika server Python di Railway mengalami restart (yang akan menghapus penyimpanan lokalnya):
1. Saat startup, server Python akan membaca file `active_model.json`.
2. Jika terdeteksi model aktif memiliki URL Supabase, server Python akan **mengunduh ulang secara otomatis** file model tersebut dari Supabase sebelum memuat TensorFlow.
3. Aplikasi Anda akan tetap berjalan normal tanpa kehilangan status model aktif terakhir.
