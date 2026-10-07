-- ============================================================
-- SQL Schema: Database Catatan Pengeluaran Harian (Supabase)
-- ============================================================
-- Petunjuk:
-- 1. Buka dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Masuk ke menu "SQL Editor"
-- 3. Tempel seluruh kode SQL ini lalu klik tombol "RUN"
-- ============================================================

-- 1. Buat Tabel Pengeluaran (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100) NOT NULL DEFAULT 'Makanan & Minuman',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Tunai',
    expense_type VARCHAR(50) NOT NULL DEFAULT 'Kebutuhan',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 2. Buat Tabel Pengaturan Budget (budget_settings)
CREATE TABLE IF NOT EXISTS public.budget_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    daily_budget NUMERIC(15, 2) NOT NULL DEFAULT 100000,
    monthly_budget NUMERIC(15, 2) NOT NULL DEFAULT 3000000,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- Masukkan default budget jika belum ada
INSERT INTO public.budget_settings (id, daily_budget, monthly_budget)
VALUES ('default', 100000, 3000000)
ON CONFLICT (id) DO NOTHING;

-- 3. Buat Index untuk performa query pencarian dan tanggal
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses (created_at DESC);

-- 4. Setup Row Level Security (RLS)
-- Mengizinkan akses publik penuh menggunakan Supabase Anon Key (mudah untuk testing/demo)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk expenses: membaca, menambah, mengubah, dan menghapus
CREATE POLICY "Public Read Expenses" ON public.expenses 
    FOR SELECT USING (true);

CREATE POLICY "Public Insert Expenses" ON public.expenses 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Update Expenses" ON public.expenses 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public Delete Expenses" ON public.expenses 
    FOR DELETE USING (true);

-- Policy untuk budget_settings
CREATE POLICY "Public Read Budget" ON public.budget_settings 
    FOR SELECT USING (true);

CREATE POLICY "Public Update Budget" ON public.budget_settings 
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Data Sampel Awal (Opsional - agar ada data langsung terlihat menarik)
INSERT INTO public.expenses (title, amount, category, payment_method, expense_type, date, time, notes)
VALUES 
    ('Makan Siang Nasi Padang', 25000, 'Makanan & Minuman', 'QRIS', 'Kebutuhan', CURRENT_DATE, '12:30:00', 'Paket rendang + es teh'),
    ('Kopi Susu Gula Aren', 18000, 'Makanan & Minuman', 'E-Wallet', 'Keinginan', CURRENT_DATE, '14:15:00', 'Kopi sore kantor'),
    ('Bensin Motor Pertalite', 25000, 'Transportasi', 'Tunai', 'Kebutuhan', CURRENT_DATE, '08:00:00', 'Isi bensin full'),
    ('Parkir Kantor & Mall', 6000, 'Transportasi', 'Tunai', 'Kebutuhan', CURRENT_DATE, '17:45:00', 'Parkir harian'),
    ('Belanja Mingguan Sayur & Buah', 85000, 'Belanja & Kebutuhan', 'Transfer Bank', 'Kebutuhan', CURRENT_DATE - INTERVAL '1 day', '09:00:00', 'Supermarket bahan makanan'),
    ('Langganan Spotify & Netflix', 65000, 'Tagihan & Utilitas', 'Kartu Debit/Kredit', 'Keinginan', CURRENT_DATE - INTERVAL '2 day', '10:00:00', 'Hiburan bulanan'),
    ('Beli Vitamin & Obat Sakit Kepala', 32000, 'Kesehatan', 'QRIS', 'Kebutuhan', CURRENT_DATE - INTERVAL '3 day', '19:20:00', 'Apotek K-24')
ON CONFLICT DO NOTHING;
