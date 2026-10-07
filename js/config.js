/**
 * config.js - Konfigurasi Kategori, Preset Cepat, dan Helper Format
 */

const APP_CONFIG = {
    STORAGE_KEYS: {
        SUPABASE_URL: 'catat_duit_supabase_url',
        SUPABASE_KEY: 'catat_duit_supabase_key',
        LOCAL_EXPENSES: 'catat_duit_local_expenses',
        BUDGET_DAILY: 'catat_duit_budget_daily',
        BUDGET_MONTHLY: 'catat_duit_budget_monthly',
        THEME: 'catat_duit_theme'
    },

    DEFAULT_BUDGET: {
        daily: 100000,   // Rp 100.000 / hari
        monthly: 3000000 // Rp 3.000.000 / bulan
    },

    CATEGORIES: [
        { id: 'Makanan & Minuman', name: 'Makanan & Minuman', icon: 'utensils', color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
        { id: 'Transportasi', name: 'Transportasi', icon: 'car', color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
        { id: 'Belanja & Kebutuhan', name: 'Belanja & Kebutuhan', icon: 'shopping-bag', color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
        { id: 'Tagihan & Utilitas', name: 'Tagihan & Utilitas', icon: 'zap', color: '#ef4444', bg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
        { id: 'Hiburan & Hobi', name: 'Hiburan & Hobi', icon: 'gamepad-2', color: '#8b5cf6', bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
        { id: 'Kesehatan', name: 'Kesehatan', icon: 'heart-pulse', color: '#ec4899', bg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
        { id: 'Pendidikan', name: 'Pendidikan', icon: 'graduation-cap', color: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
        { id: 'Investasi & Tabungan', name: 'Investasi & Tabungan', icon: 'trending-up', color: '#14b8a6', bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
        { id: 'Lainnya', name: 'Lainnya', icon: 'more-horizontal', color: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' }
    ],

    PAYMENT_METHODS: [
        'Tunai',
        'QRIS',
        'Transfer Bank',
        'E-Wallet (GoPay/OVO/Dana/Shopee)',
        'Kartu Debit/Kredit'
    ],

    EXPENSE_TYPES: [
        { id: 'Kebutuhan', label: 'Kebutuhan (Needs)', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
        { id: 'Keinginan', label: 'Keinginan (Wants)', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
        { id: 'Darurat/Tabungan', label: 'Darurat/Tabungan', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' }
    ],

    QUICK_PRESETS: [
        { title: '☕ Kopi / Teh', amount: 18000, category: 'Makanan & Minuman', payment: 'QRIS', type: 'Keinginan' },
        { title: '🍛 Makan Siang', amount: 25000, category: 'Makanan & Minuman', payment: 'QRIS', type: 'Kebutuhan' },
        { title: '⛽ Bensin Motor', amount: 25000, category: 'Transportasi', payment: 'Tunai', type: 'Kebutuhan' },
        { title: '🅿️ Parkir', amount: 5000, category: 'Transportasi', payment: 'Tunai', type: 'Kebutuhan' },
        { title: '🛒 Camilan / Snack', amount: 15000, category: 'Makanan & Minuman', payment: 'E-Wallet (GoPay/OVO/Dana/Shopee)', type: 'Keinginan' },
        { title: '📱 Pulsa / Kuota', amount: 50000, category: 'Tagihan & Utilitas', payment: 'Transfer Bank', type: 'Kebutuhan' }
    ],

    INITIAL_SEED_DATA: [
        {
            id: 'mock-1',
            title: 'Makan Siang Nasi Padang',
            amount: 25000,
            category: 'Makanan & Minuman',
            payment_method: 'QRIS',
            expense_type: 'Kebutuhan',
            date: new Date().toISOString().split('T')[0],
            time: '12:30',
            notes: 'Ayam gulai + es teh manis',
            created_at: new Date().toISOString()
        },
        {
            id: 'mock-2',
            title: 'Kopi Susu Aren',
            amount: 18000,
            category: 'Makanan & Minuman',
            payment_method: 'E-Wallet (GoPay/OVO/Dana/Shopee)',
            expense_type: 'Keinginan',
            date: new Date().toISOString().split('T')[0],
            time: '14:45',
            notes: 'Kopi sore buat coding',
            created_at: new Date().toISOString()
        },
        {
            id: 'mock-3',
            title: 'Bensin Motor',
            amount: 25000,
            category: 'Transportasi',
            payment_method: 'Tunai',
            expense_type: 'Kebutuhan',
            date: new Date().toISOString().split('T')[0],
            time: '08:15',
            notes: 'Isi full tangki',
            created_at: new Date().toISOString()
        },
        {
            id: 'mock-4',
            title: 'Belanja Sayur & Buah Segar',
            amount: 75000,
            category: 'Belanja & Kebutuhan',
            payment_method: 'Transfer Bank',
            expense_type: 'Kebutuhan',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            time: '09:00',
            notes: 'Pasar tradisional / supermarket',
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'mock-5',
            title: 'Langganan Streaming Bulanan',
            amount: 54000,
            category: 'Hiburan & Hobi',
            payment_method: 'Kartu Debit/Kredit',
            expense_type: 'Keinginan',
            date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            time: '20:10',
            notes: 'Tagihan bulanan hiburan',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    ]
};

// Format Rupiah
function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num);
}

// Format Tanggal Indonesia
function formatDateIndo(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return dateStr;
    }
}

// Ambil Icon Kategori
function getCategoryInfo(categoryName) {
    const found = APP_CONFIG.CATEGORIES.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
    return found || {
        id: categoryName,
        name: categoryName || 'Lainnya',
        icon: 'tag',
        color: '#6b7280',
        bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    };
}
