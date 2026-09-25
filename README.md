# My Budget 💰

Aplikasi budgeting pribadi modern, clean, dan mobile-first untuk mengelola keuangan harian, budget bulanan, cicilan utang, serta target tabungan.

Dibangun dengan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Recharts**, dan **Neon PostgreSQL** via **Drizzle ORM**.

---

## 🌟 Fitur Utama

- 🏠 **Dashboard Komprehensif**: Saldo, ringkasan pemasukan/pengeluaran, quick actions, pie chart pengeluaran per kategori, bar chart tabungan bulanan, insight keuangan otomatis, dan widget budget makan harian.
- 💸 **Transaksi**: Catat pengeluaran & pemasukan, filter per kategori, filter per bulan, live search, serta manajemen edit & hapus.
- 📊 **Budget Bulanan**: Pantau batas budget tiap kategori dengan progress bar adaptif (hijau <70%, kuning 70-90%, merah >90%).
- 💳 **Cicilan & Utang**: Lacak jadwal cicilan multi-bulan, tandai status lunas (*mark as paid*), serta estimasi sisa utang dan proyeksi bulan lunas.
- 🎯 **Target Tabungan**: Tetapkan target (contoh: Dana Darurat Rp20.000.000), catat setoran tabungan, dan pantau persentase pencapaian.
- 📈 **Laporan Keuangan**: Analisis cashflow bulanan, perbandingan income vs expense, dan breakdown per kategori dengan rentang filter 30 hari hingga 1 tahun.
- ⚙️ **Settings & Prorata Gaji**: Pengaturan gaji bulanan, tanggal gajian (ke-25), opsi prorata hari kalender vs hari kerja (Senin–Jumat), serta fitur export data dalam format JSON.
- 📱 **Mobile-First UX**: Dilengkapi bottom navigation bar untuk kenyamanan navigasi di smartphone, dialog sentuh yang responsif, dan layout sidebar di desktop.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Database**: [Neon PostgreSQL](https://neon.tech/) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)

---

## 🚀 Menjalankan Secara Lokal

### 1. Clone repository
```bash
git clone https://github.com/awanbadut/mybudget.git
cd mybudget
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root folder:
```env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
DEV_USER_ID="00000000-0000-0000-0000-000000000001"
```

### 4. Push Schema & Seed Database
```bash
# Push schema tabel ke database Neon
npm run db:push

# Isi data awal (kategori, default budget, cicilan, target tabungan)
npm run db:seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## ☁️ Deployment ke Vercel

1. Buka [vercel.com](https://vercel.com) dan import repository ini.
2. Tambahkan **Environment Variables** di project settings:
   - `DATABASE_URL`: Connection string Neon PostgreSQL Anda
   - `DEV_USER_ID`: `00000000-0000-0000-0000-000000000001`
3. Klik **Deploy**.
