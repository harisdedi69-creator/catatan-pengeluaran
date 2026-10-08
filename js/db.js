/**
 * db.js - Abstraksi Database: Supabase Client & LocalStorage Fallback Store
 */

class ExpenseDatabase {
    constructor() {
        this.client = null;
        this.status = 'offline_local'; // 'connected' | 'offline_local' | 'error'
        this.statusMessage = 'Mode Lokal (Data tersimpan di browser)';
        this.listeners = [];
    }

    // Daftarkan listener saat status database berubah
    onStatusChange(callback) {
        this.listeners.push(callback);
    }

    notifyStatusChange() {
        this.listeners.forEach(cb => cb({ status: this.status, message: this.statusMessage }));
    }

    // Inisialisasi koneksi
    async init() {
        const url = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_URL) || APP_CONFIG.DEFAULT_SUPABASE_URL;
        const key = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY) || APP_CONFIG.DEFAULT_SUPABASE_KEY;

        // Inisialisasi local storage dengan data sampel jika masih kosong
        if (!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCAL_EXPENSES)) {
            localStorage.setItem(
                APP_CONFIG.STORAGE_KEYS.LOCAL_EXPENSES, 
                JSON.stringify(APP_CONFIG.INITIAL_SEED_DATA)
            );
        }

        if (url && key && window.supabase) {
            try {
                this.client = window.supabase.createClient(url, key);
                // Uji koneksi ringan ke tabel expenses
                const { data, error } = await this.client
                    .from('expenses')
                    .select('id')
                    .limit(1);

                if (error) {
                    console.warn('Gagal koneksi ke Supabase:', error.message);
                    this.status = 'offline_local';
                    this.statusMessage = 'Gagal terhubung ke Supabase (Cek URL/Key/Tabel). Berjalan di Mode Lokal.';
                } else {
                    this.status = 'connected';
                    this.statusMessage = 'Terhubung ke Supabase Database Cloud 🚀';
                }
            } catch (err) {
                console.error('Error inisialisasi Supabase:', err);
                this.status = 'offline_local';
                this.statusMessage = 'Error koneksi Supabase. Berjalan di Mode Lokal.';
            }
        } else {
            this.status = 'offline_local';
            this.statusMessage = 'Mode Lokal Aktif (Belum dihubungkan ke Supabase)';
        }

        this.notifyStatusChange();
        return this.status;
    }

    // Simpan konfigurasi Supabase dan uji
    async configureSupabase(url, key) {
        if (!url || !key) {
            throw new Error('URL dan Public Anon Key Supabase wajib diisi.');
        }

        const cleanUrl = url.trim();
        const cleanKey = key.trim();

        if (!cleanUrl.startsWith('https://')) {
            throw new Error('Supabase URL harus diawali dengan https://');
        }

        if (!window.supabase) {
            throw new Error('Supabase JS Library belum dimuat di browser.');
        }

        const testClient = window.supabase.createClient(cleanUrl, cleanKey);
        const { data, error } = await testClient
            .from('expenses')
            .select('id')
            .limit(1);

        if (error) {
            // Berikan pesan ramah jika tabel belum dibuat
            if (error.code === '42P01' || error.message.includes('relation "expenses" does not exist') || error.message.includes('not found')) {
                throw new Error('Tabel "expenses" belum dibuat di Supabase! Harap jalankan script "supabase_schema.sql" di SQL Editor Supabase terlebih dahulu.');
            }
            throw new Error(`Koneksi Supabase ditolak: ${error.message}`);
        }

        // Simpan ke local storage jika berhasil
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_URL, cleanUrl);
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY, cleanKey);

        this.client = testClient;
        this.status = 'connected';
        this.statusMessage = 'Terhubung ke Supabase Database Cloud 🚀';
        this.notifyStatusChange();

        return true;
    }

    // Putus koneksi Supabase & kembali ke mode lokal
    disconnectSupabase() {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_URL);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY);
        this.client = null;
        this.status = 'offline_local';
        this.statusMessage = 'Mode Lokal Aktif (Supabase diputus)';
        this.notifyStatusChange();
    }

    // Ambil semua transaksi
    async getExpenses() {
        if (this.status === 'connected' && this.client) {
            try {
                const { data, error } = await this.client
                    .from('expenses')
                    .select('*')
                    .order('date', { ascending: false })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error('Gagal mengambil data dari Supabase, fallback ke lokal:', err);
                return this.getLocalExpenses();
            }
        }
        return this.getLocalExpenses();
    }

    // Tambah Transaksi Baru
    async addExpense(expenseData) {
        const payload = {
            title: expenseData.title.trim(),
            amount: Number(expenseData.amount),
            category: expenseData.category || 'Makanan & Minuman',
            payment_method: expenseData.payment_method || 'Tunai',
            expense_type: expenseData.expense_type || 'Kebutuhan',
            date: expenseData.date || new Date().toISOString().split('T')[0],
            time: expenseData.time || new Date().toTimeString().slice(0, 5),
            notes: expenseData.notes ? expenseData.notes.trim() : ''
        };

        if (this.status === 'connected' && this.client) {
            try {
                const { data, error } = await this.client
                    .from('expenses')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } catch (err) {
                console.warn('Gagal simpan ke Supabase, menyimpan ke lokal:', err);
                // Tetap simpan ke lokal jika network error
                return this.addLocalExpense(payload);
            }
        }

        return this.addLocalExpense(payload);
    }

    // Update Transaksi
    async updateExpense(id, expenseData) {
        const payload = {
            title: expenseData.title.trim(),
            amount: Number(expenseData.amount),
            category: expenseData.category,
            payment_method: expenseData.payment_method,
            expense_type: expenseData.expense_type,
            date: expenseData.date,
            time: expenseData.time,
            notes: expenseData.notes ? expenseData.notes.trim() : ''
        };

        if (this.status === 'connected' && this.client && !id.toString().startsWith('local-') && !id.toString().startsWith('mock-')) {
            try {
                const { data, error } = await this.client
                    .from('expenses')
                    .update(payload)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } catch (err) {
                console.warn('Gagal update di Supabase, update di lokal:', err);
                return this.updateLocalExpense(id, payload);
            }
        }

        return this.updateLocalExpense(id, payload);
    }

    // Hapus Transaksi
    async deleteExpense(id) {
        if (this.status === 'connected' && this.client && !id.toString().startsWith('local-') && !id.toString().startsWith('mock-')) {
            try {
                const { error } = await this.client
                    .from('expenses')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return { success: true };
            } catch (err) {
                console.warn('Gagal hapus di Supabase, hapus dari lokal:', err);
                return this.deleteLocalExpense(id);
            }
        }

        return this.deleteLocalExpense(id);
    }

    // Sinkronisasi data dari Local Storage ke Supabase Cloud
    async syncLocalToSupabase() {
        if (this.status !== 'connected' || !this.client) {
            throw new Error('Supabase belum terhubung!');
        }

        const localData = this.getLocalExpenses();
        if (!localData || localData.length === 0) {
            return { count: 0, message: 'Tidak ada data lokal untuk disinkronkan.' };
        }

        // Hapus field id bawaan lokal agar Supabase meng-generate UUID baru yang valid
        const formattedData = localData.map(item => ({
            title: item.title,
            amount: item.amount,
            category: item.category,
            payment_method: item.payment_method,
            expense_type: item.expense_type,
            date: item.date,
            time: item.time,
            notes: item.notes
        }));

        const { data, error } = await this.client
            .from('expenses')
            .insert(formattedData)
            .select();

        if (error) throw error;

        return { count: data.length, message: `Berhasil mengunggah ${data.length} transaksi ke Supabase!` };
    }

    // Budget Settings: Get & Update
    async getBudgetSettings() {
        const localDaily = Number(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.BUDGET_DAILY)) || APP_CONFIG.DEFAULT_BUDGET.daily;
        const localMonthly = Number(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.BUDGET_MONTHLY)) || APP_CONFIG.DEFAULT_BUDGET.monthly;

        if (this.status === 'connected' && this.client) {
            try {
                const { data, error } = await this.client
                    .from('budget_settings')
                    .select('*')
                    .eq('id', 'default')
                    .single();

                if (!error && data) {
                    return {
                        dailyBudget: Number(data.daily_budget),
                        monthlyBudget: Number(data.monthly_budget)
                    };
                }
            } catch (e) {
                // Gunakan fallback lokal
            }
        }

        return {
            dailyBudget: localDaily,
            monthlyBudget: localMonthly
        };
    }

    async saveBudgetSettings(dailyBudget, monthlyBudget) {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.BUDGET_DAILY, dailyBudget);
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.BUDGET_MONTHLY, monthlyBudget);

        if (this.status === 'connected' && this.client) {
            try {
                await this.client
                    .from('budget_settings')
                    .upsert({
                        id: 'default',
                        daily_budget: dailyBudget,
                        monthly_budget: monthlyBudget,
                        updated_at: new Date().toISOString()
                    });
            } catch (e) {
                console.warn('Gagal menyimpan budget ke Supabase:', e);
            }
        }

        return { dailyBudget, monthlyBudget };
    }

    // ==================== HELPER LOCAL STORAGE ====================
    getLocalExpenses() {
        try {
            const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCAL_EXPENSES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    saveLocalExpenses(expenses) {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LOCAL_EXPENSES, JSON.stringify(expenses));
    }

    addLocalExpense(item) {
        const list = this.getLocalExpenses();
        const newItem = {
            id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            ...item,
            created_at: new Date().toISOString()
        };
        list.unshift(newItem);
        this.saveLocalExpenses(list);
        return { success: true, data: newItem };
    }

    updateLocalExpense(id, payload) {
        let list = this.getLocalExpenses();
        list = list.map(item => (item.id === id ? { ...item, ...payload } : item));
        this.saveLocalExpenses(list);
        return { success: true, data: { id, ...payload } };
    }

    deleteLocalExpense(id) {
        let list = this.getLocalExpenses();
        list = list.filter(item => item.id !== id);
        this.saveLocalExpenses(list);
        return { success: true };
    }
}

// Instance global
window.db = new ExpenseDatabase();
