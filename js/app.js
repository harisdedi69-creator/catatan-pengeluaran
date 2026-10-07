/**
 * app.js - Logika Utama Aplikasi Catatan Pengeluaran Harian
 */

class ExpenseApp {
    constructor() {
        this.expenses = [];
        this.budgetSettings = {
            dailyBudget: APP_CONFIG.DEFAULT_BUDGET.daily,
            monthlyBudget: APP_CONFIG.DEFAULT_BUDGET.monthly
        };
        this.filters = {
            search: '',
            category: 'all',
            paymentMethod: 'all',
            dateRange: 'all', // 'today', 'week', 'month', 'all'
            sortBy: 'date-desc'
        };
        this.editingId = null;
    }

    async init() {
        this.initTheme();
        this.renderQuickPresets();
        this.renderCategorySelectOptions();
        this.bindEvents();

        // Status listener untuk Supabase
        window.db.onStatusChange((info) => {
            this.updateDatabaseStatusBadge(info);
        });

        // Inisialisasi Database
        await window.db.init();

        // Muat Pengaturan Budget
        this.budgetSettings = await window.db.getBudgetSettings();

        // Inisialisasi Grafik
        window.charts.init();

        // Muat Data Transaksi
        await this.loadExpenses();

        // Render Ikon Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // ==================== TEMA GELAP / TERANG ====================
    initTheme() {
        const savedTheme = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME) || 'light';
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        this.updateThemeButtonIcon();
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
        this.updateThemeButtonIcon();
        window.charts.updateAll(this.getFilteredExpenses());
    }

    updateThemeButtonIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        const iconSpan = document.getElementById('themeIcon');
        if (iconSpan) {
            iconSpan.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // ==================== STATUS SUPABASE ====================
    updateDatabaseStatusBadge({ status, message }) {
        const badge = document.getElementById('dbStatusBadge');
        const dot = document.getElementById('dbStatusDot');
        const text = document.getElementById('dbStatusText');
        const alertBanner = document.getElementById('localModeBanner');

        if (!badge || !dot || !text) return;

        if (status === 'connected') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 status-dot-pulse';
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer hover:opacity-90';
            text.textContent = 'Supabase Cloud: Terhubung';
            if (alertBanner) alertBanner.classList.add('hidden');
        } else {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500';
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer hover:opacity-90';
            text.textContent = 'Mode Lokal (Browser)';
            if (alertBanner) alertBanner.classList.remove('hidden');
        }
    }

    // ==================== DATA LOADING ====================
    async loadExpenses() {
        this.showLoadingTable(true);
        try {
            this.expenses = await window.db.getExpenses();
            this.renderAll();
        } catch (error) {
            this.showToast('Gagal memuat data: ' + error.message, 'error');
        } finally {
            this.showLoadingTable(false);
        }
    }

    // ==================== RENDER SEMUA KOMPONEN ====================
    renderAll() {
        this.updateKPIStats();
        this.renderExpensesTable();
        window.charts.updateAll(this.expenses);
        if (window.lucide) window.lucide.createIcons();
    }

    // ==================== STATISTIK & KPI ====================
    updateKPIStats() {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentYearMonth = todayStr.substring(0, 7);

        // 7 Hari Terakhir
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let todayTotal = 0;
        let weekTotal = 0;
        let monthTotal = 0;
        let countToday = 0;

        this.expenses.forEach(item => {
            const amt = Number(item.amount) || 0;
            const itemDate = new Date(item.date + 'T00:00:00');

            if (item.date === todayStr) {
                todayTotal += amt;
                countToday++;
            }
            if (itemDate >= sevenDaysAgo && itemDate <= now) {
                weekTotal += amt;
            }
            if (item.date.startsWith(currentYearMonth)) {
                monthTotal += amt;
            }
        });

        // Update Elemen Teks
        document.getElementById('statTodayExpense').textContent = formatRupiah(todayTotal);
        document.getElementById('statTodayCount').textContent = `${countToday} transaksi hari ini`;

        document.getElementById('statWeekExpense').textContent = formatRupiah(weekTotal);
        document.getElementById('statMonthExpense').textContent = formatRupiah(monthTotal);

        // Budget Harian
        const dailyLimit = this.budgetSettings.dailyBudget || 100000;
        const remainingDaily = dailyLimit - todayTotal;
        const dailyPercent = Math.min(Math.round((todayTotal / dailyLimit) * 100), 100);

        const remainingEl = document.getElementById('statRemainingDaily');
        const progressBar = document.getElementById('dailyBudgetProgress');
        const budgetPercentLabel = document.getElementById('budgetPercentLabel');
        const budgetAlertBox = document.getElementById('budgetAlertBox');

        remainingEl.textContent = formatRupiah(Math.abs(remainingDaily));
        document.getElementById('statRemainingPrefix').textContent = remainingDaily >= 0 ? 'Sisa:' : 'Over Budget:';
        if (remainingDaily < 0) {
            remainingEl.classList.remove('text-emerald-600', 'dark:text-emerald-400');
            remainingEl.classList.add('text-rose-600', 'dark:text-rose-400');
        } else {
            remainingEl.classList.remove('text-rose-600', 'dark:text-rose-400');
            remainingEl.classList.add('text-emerald-600', 'dark:text-emerald-400');
        }

        budgetPercentLabel.textContent = `${dailyPercent}% (${formatRupiah(todayTotal)} / ${formatRupiah(dailyLimit)})`;
        progressBar.style.width = `${dailyPercent}%`;

        // Ubah warna progress bar
        if (todayTotal > dailyLimit) {
            progressBar.className = 'progress-bar-fill h-2.5 rounded-full bg-rose-500';
            budgetAlertBox.classList.remove('hidden');
            document.getElementById('budgetAlertMsg').textContent = `Peringatan: Pengeluaran hari ini melebihi limit harian sebesar ${formatRupiah(todayTotal - dailyLimit)}!`;
        } else if (dailyPercent >= 80) {
            progressBar.className = 'progress-bar-fill h-2.5 rounded-full bg-amber-500';
            budgetAlertBox.classList.remove('hidden');
            document.getElementById('budgetAlertMsg').textContent = `Perhatian: Pengeluaran hari ini sudah mencapai ${dailyPercent}% dari target batas harian.`;
        } else {
            progressBar.className = 'progress-bar-fill h-2.5 rounded-full bg-emerald-500';
            budgetAlertBox.classList.add('hidden');
        }
    }

    // ==================== FILTER & PENCARIAN ====================
    getFilteredExpenses() {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentYearMonth = todayStr.substring(0, 7);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        return this.expenses.filter(item => {
            // Filter Pencarian Teks
            if (this.filters.search) {
                const q = this.filters.search.toLowerCase();
                const matchTitle = (item.title || '').toLowerCase().includes(q);
                const matchNotes = (item.notes || '').toLowerCase().includes(q);
                const matchCategory = (item.category || '').toLowerCase().includes(q);
                if (!matchTitle && !matchNotes && !matchCategory) return false;
            }

            // Filter Kategori
            if (this.filters.category !== 'all' && item.category !== this.filters.category) {
                return false;
            }

            // Filter Metode Pembayaran
            if (this.filters.paymentMethod !== 'all' && item.payment_method !== this.filters.paymentMethod) {
                return false;
            }

            // Filter Rentang Tanggal
            if (this.filters.dateRange === 'today' && item.date !== todayStr) {
                return false;
            }
            if (this.filters.dateRange === 'week' && (item.date < sevenDaysAgoStr || item.date > todayStr)) {
                return false;
            }
            if (this.filters.dateRange === 'month' && !item.date.startsWith(currentYearMonth)) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            switch (this.filters.sortBy) {
                case 'date-asc':
                    return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
                case 'amount-desc':
                    return Number(b.amount) - Number(a.amount);
                case 'amount-asc':
                    return Number(a.amount) - Number(b.amount);
                case 'date-desc':
                default:
                    return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '');
            }
        });
    }

    // ==================== RENDER TABEL & DAFTAR ====================
    renderExpensesTable() {
        const container = document.getElementById('expensesTableBody');
        const emptyState = document.getElementById('emptyState');
        const countBadge = document.getElementById('filteredCountBadge');

        const filtered = this.getFilteredExpenses();
        countBadge.textContent = `${filtered.length} Transaksi`;

        if (filtered.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        container.innerHTML = filtered.map(item => {
            const cat = getCategoryInfo(item.category);
            const typeClass = item.expense_type === 'Keinginan' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : (item.expense_type === 'Darurat/Tabungan'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300');

            return `
                <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/80">
                    <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bg}">
                                <i data-lucide="${cat.icon}" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100 leading-snug">${this.escapeHtml(item.title)}</p>
                                ${item.notes ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">${this.escapeHtml(item.notes)}</p>` : ''}
                            </div>
                        </div>
                    </td>
                    <td class="py-3.5 px-4 hidden sm:table-cell">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            ${cat.name}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 hidden md:table-cell">
                        <div class="text-xs text-gray-600 dark:text-gray-300">
                            <span class="font-medium">${formatDateIndo(item.date)}</span>
                            ${item.time ? `<span class="text-gray-400 dark:text-gray-500 ml-1">(${item.time})</span>` : ''}
                        </div>
                    </td>
                    <td class="py-3.5 px-4 hidden lg:table-cell">
                        <div class="flex flex-col gap-1 items-start">
                            <span class="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                ${this.escapeHtml(item.payment_method || 'Tunai')}
                            </span>
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${typeClass}">
                                ${this.escapeHtml(item.expense_type || 'Kebutuhan')}
                            </span>
                        </div>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        <span class="font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            - ${formatRupiah(item.amount)}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-center no-print">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="app.openEditModal('${item.id}')" title="Edit Transaksi" class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.confirmDelete('${item.id}')" title="Hapus Transaksi" class="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    // ==================== PRESET CEPAT ====================
    renderQuickPresets() {
        const container = document.getElementById('quickPresetsContainer');
        if (!container) return;

        container.innerHTML = APP_CONFIG.QUICK_PRESETS.map((preset, idx) => `
            <button onclick="app.applyQuickPreset(${idx})" class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all shadow-sm">
                <span>${preset.title}</span>
                <span class="text-indigo-600 dark:text-indigo-400 font-bold">${formatRupiah(preset.amount)}</span>
            </button>
        `).join('');
    }

    async applyQuickPreset(index) {
        const preset = APP_CONFIG.QUICK_PRESETS[index];
        if (!preset) return;

        const payload = {
            title: preset.title.replace(/^[^\w\s]+\s*/, ''), // bersihkan emoji depan
            amount: preset.amount,
            category: preset.category,
            payment_method: preset.payment,
            expense_type: preset.type,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            notes: 'Preset Cepat 1-Klik'
        };

        const res = await window.db.addExpense(payload);
        if (res.success) {
            this.showToast(`Berhasil mencatat "${payload.title}" (${formatRupiah(payload.amount)})!`, 'success');
            if (window.confetti) {
                window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
            }
            await this.loadExpenses();
        }
    }

    // ==================== OPTIONS SELECT KATEGORI ====================
    renderCategorySelectOptions() {
        const selects = [
            document.getElementById('expenseCategory'),
            document.getElementById('filterCategory')
        ];

        selects.forEach(select => {
            if (!select) return;
            const isFilter = select.id === 'filterCategory';
            let html = isFilter ? '<option value="all">Semua Kategori</option>' : '';
            APP_CONFIG.CATEGORIES.forEach(cat => {
                html += `<option value="${cat.name}">${cat.name}</option>`;
            });
            select.innerHTML = html;
        });

        // Payment Method Select
        const paySelects = [
            document.getElementById('expensePaymentMethod'),
            document.getElementById('filterPayment')
        ];
        paySelects.forEach(select => {
            if (!select) return;
            const isFilter = select.id === 'filterPayment';
            let html = isFilter ? '<option value="all">Semua Metode</option>' : '';
            APP_CONFIG.PAYMENT_METHODS.forEach(pm => {
                html += `<option value="${pm}">${pm}</option>`;
            });
            select.innerHTML = html;
        });
    }

    // ==================== MODAL TAMBAH & EDIT ====================
    openAddModal() {
        this.editingId = null;
        document.getElementById('expenseModalTitle').textContent = 'Tambah Pengeluaran Baru';
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('expenseTime').value = new Date().toTimeString().slice(0, 5);
        document.getElementById('amountFormattedPreview').textContent = 'Rp 0';
        this.toggleModal('expenseModal', true);
    }

    openEditModal(id) {
        const item = this.expenses.find(x => x.id === id);
        if (!item) return;

        this.editingId = id;
        document.getElementById('expenseModalTitle').textContent = 'Edit Pengeluaran';
        document.getElementById('expenseTitle').value = item.title;
        document.getElementById('expenseAmount').value = item.amount;
        document.getElementById('expenseCategory').value = item.category;
        document.getElementById('expensePaymentMethod').value = item.payment_method;
        document.getElementById('expenseType').value = item.expense_type || 'Kebutuhan';
        document.getElementById('expenseDate').value = item.date;
        document.getElementById('expenseTime').value = item.time || '';
        document.getElementById('expenseNotes').value = item.notes || '';
        document.getElementById('amountFormattedPreview').textContent = formatRupiah(item.amount);

        this.toggleModal('expenseModal', true);
    }

    async handleExpenseSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('expenseTitle').value.trim();
        const amount = Number(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;
        const payment_method = document.getElementById('expensePaymentMethod').value;
        const expense_type = document.getElementById('expenseType').value;
        const date = document.getElementById('expenseDate').value;
        const time = document.getElementById('expenseTime').value;
        const notes = document.getElementById('expenseNotes').value.trim();

        if (!title || !amount || amount <= 0) {
            this.showToast('Harap masukkan judul dan jumlah nominal yang valid.', 'error');
            return;
        }

        const payload = { title, amount, category, payment_method, expense_type, date, time, notes };

        try {
            if (this.editingId) {
                await window.db.updateExpense(this.editingId, payload);
                this.showToast('Transaksi berhasil diperbarui!', 'success');
            } else {
                await window.db.addExpense(payload);
                this.showToast('Pengeluaran berhasil dicatat!', 'success');
                if (window.confetti) {
                    window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
                }
            }

            this.toggleModal('expenseModal', false);
            await this.loadExpenses();
        } catch (err) {
            this.showToast('Terjadi kesalahan: ' + err.message, 'error');
        }
    }

    async confirmDelete(id) {
        const item = this.expenses.find(x => x.id === id);
        const name = item ? `"${item.title}" (${formatRupiah(item.amount)})` : 'transaksi ini';
        if (confirm(`Yakin ingin menghapus ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
            try {
                await window.db.deleteExpense(id);
                this.showToast('Transaksi berhasil dihapus.', 'info');
                await this.loadExpenses();
            } catch (err) {
                this.showToast('Gagal menghapus: ' + err.message, 'error');
            }
        }
    }

    // ==================== MODAL PENGATURAN SUPABASE ====================
    openSupabaseModal() {
        const url = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_URL) || '';
        const key = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY) || '';

        document.getElementById('supabaseUrlInput').value = url;
        document.getElementById('supabaseKeyInput').value = key;
        document.getElementById('supabaseModalStatus').textContent = window.db.statusMessage;

        this.toggleModal('supabaseModal', true);
    }

    async saveSupabaseSettings() {
        const url = document.getElementById('supabaseUrlInput').value.trim();
        const key = document.getElementById('supabaseKeyInput').value.trim();
        const btn = document.getElementById('btnSaveSupabase');

        btn.disabled = true;
        btn.textContent = 'Menguji Koneksi...';

        try {
            await window.db.configureSupabase(url, key);
            this.showToast('Koneksi Supabase Berhasil Terhubung! 🚀', 'success');
            this.toggleModal('supabaseModal', false);
            await this.loadExpenses();
        } catch (err) {
            this.showToast(err.message, 'error');
            document.getElementById('supabaseModalStatus').textContent = 'Error: ' + err.message;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Uji & Simpan Koneksi';
        }
    }

    disconnectSupabase() {
        if (confirm('Putus koneksi Supabase? Aplikasi akan beralih ke Mode Penyimpanan Lokal di browser.')) {
            window.db.disconnectSupabase();
            this.showToast('Koneksi Supabase diputus. Beralih ke Mode Lokal.', 'info');
            this.toggleModal('supabaseModal', false);
            this.loadExpenses();
        }
    }

    async syncLocalToCloud() {
        const btn = document.getElementById('btnSyncToSupabase');
        btn.disabled = true;
        btn.textContent = 'Mengunggah...';

        try {
            const res = await window.db.syncLocalToSupabase();
            this.showToast(res.message, 'success');
            await this.loadExpenses();
        } catch (err) {
            this.showToast('Gagal sinkronisasi: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Kirim Data Lokal ke Supabase';
        }
    }

    // ==================== MODAL BUDGET SETTINGS ====================
    openBudgetModal() {
        document.getElementById('dailyBudgetInput').value = this.budgetSettings.dailyBudget;
        document.getElementById('monthlyBudgetInput').value = this.budgetSettings.monthlyBudget;
        this.toggleModal('budgetModal', true);
    }

    async saveBudgetSettings(e) {
        e.preventDefault();
        const daily = Number(document.getElementById('dailyBudgetInput').value) || APP_CONFIG.DEFAULT_BUDGET.daily;
        const monthly = Number(document.getElementById('monthlyBudgetInput').value) || APP_CONFIG.DEFAULT_BUDGET.monthly;

        this.budgetSettings = await window.db.saveBudgetSettings(daily, monthly);
        this.showToast('Pengaturan batas anggaran berhasil disimpan!', 'success');
        this.toggleModal('budgetModal', false);
        this.updateKPIStats();
    }

    // ==================== KALKULATOR SPLIT BILL ====================
    openSplitBillModal() {
        document.getElementById('splitTotalBill').value = '';
        document.getElementById('splitPeople').value = '2';
        document.getElementById('splitTaxPercent').value = '10';
        this.calculateSplitBill();
        this.toggleModal('splitBillModal', true);
    }

    calculateSplitBill() {
        const total = Number(document.getElementById('splitTotalBill').value) || 0;
        const people = Math.max(1, Number(document.getElementById('splitPeople').value) || 1);
        const tax = Number(document.getElementById('splitTaxPercent').value) || 0;

        const totalWithTax = total + (total * (tax / 100));
        const perPerson = Math.ceil(totalWithTax / people);

        document.getElementById('splitTotalWithTax').textContent = formatRupiah(totalWithTax);
        document.getElementById('splitPerPersonResult').textContent = formatRupiah(perPerson);

        return { totalWithTax, perPerson };
    }

    recordSplitBillAsExpense() {
        const { perPerson } = this.calculateSplitBill();
        if (perPerson <= 0) {
            this.showToast('Masukkan total tagihan terlebih dahulu.', 'error');
            return;
        }

        this.toggleModal('splitBillModal', false);
        this.openAddModal();
        document.getElementById('expenseTitle').value = 'Patungan Makan / Split Bill';
        document.getElementById('expenseAmount').value = perPerson;
        document.getElementById('amountFormattedPreview').textContent = formatRupiah(perPerson);
        document.getElementById('expenseCategory').value = 'Makanan & Minuman';
        document.getElementById('expenseNotes').value = `Hasil split bill patungan untuk 1 porsi bagian sendiri.`;
    }

    // ==================== EKSPOR DATA ====================
    exportToCSV() {
        const data = this.getFilteredExpenses();
        if (data.length === 0) {
            this.showToast('Tidak ada data untuk diekspor.', 'error');
            return;
        }

        const headers = ['ID', 'Judul', 'Nominal (IDR)', 'Kategori', 'Metode Pembayaran', 'Tipe', 'Tanggal', 'Waktu', 'Catatan'];
        const csvRows = [headers.join(',')];

        data.forEach(item => {
            const row = [
                `"${item.id}"`,
                `"${(item.title || '').replace(/"/g, '""')}"`,
                item.amount,
                `"${item.category || ''}"`,
                `"${item.payment_method || ''}"`,
                `"${item.expense_type || ''}"`,
                `"${item.date}"`,
                `"${item.time || ''}"`,
                `"${(item.notes || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `catatan_pengeluaran_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast('Laporan CSV berhasil diunduh!', 'success');
    }

    printReport() {
        window.print();
    }

    // ==================== HELPER UI ====================
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        if (show) {
            modal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        } else {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const colors = {
            success: 'bg-emerald-600 text-white border-emerald-700',
            error: 'bg-rose-600 text-white border-rose-700',
            info: 'bg-gray-900 text-white border-gray-800 dark:bg-gray-100 dark:text-gray-900'
        };

        const icons = {
            success: 'check-circle-2',
            error: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 shrink-0"></i>
            <span class="flex-1">${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3800);
    }

    showLoadingTable(loading) {
        const skeleton = document.getElementById('tableLoadingSkeleton');
        if (skeleton) {
            if (loading) skeleton.classList.remove('hidden');
            else skeleton.classList.add('hidden');
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

    // ==================== BIND EVENT LISTENERS ====================
    bindEvents() {
        // Form Tambah / Edit
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.saveBudgetSettings(e));

        // Format live preview amount
        document.getElementById('expenseAmount').addEventListener('input', (e) => {
            const val = Number(e.target.value) || 0;
            document.getElementById('amountFormattedPreview').textContent = formatRupiah(val);
        });

        // Pencarian & Filter
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderExpensesTable();
        });

        document.getElementById('filterCategory').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.renderExpensesTable();
        });

        document.getElementById('filterPayment').addEventListener('change', (e) => {
            this.filters.paymentMethod = e.target.value;
            this.renderExpensesTable();
        });

        document.getElementById('sortBySelect').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.renderExpensesTable();
        });

        // Filter Rentang Waktu (Pills)
        document.querySelectorAll('[data-date-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-date-filter]').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow');
                    b.classList.add('text-gray-600', 'dark:text-gray-400');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow');
                btn.classList.remove('text-gray-600', 'dark:text-gray-400');

                this.filters.dateRange = btn.getAttribute('data-date-filter');
                this.renderExpensesTable();
            });
        });

        // Rentang Tren Chart (7 Hari vs 30 Hari)
        document.querySelectorAll('[data-trend-days]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-trend-days]').forEach(b => {
                    b.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
                    b.classList.add('text-gray-500');
                });
                btn.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
                btn.classList.remove('text-gray-500');

                const days = Number(btn.getAttribute('data-trend-days')) || 7;
                window.charts.setTrendRange(days, this.expenses);
            });
        });

        // Split Bill inputs
        ['splitTotalBill', 'splitPeople', 'splitTaxPercent'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.calculateSplitBill());
        });
    }
}

// Inisialisasi saat window load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new ExpenseApp();
    window.app.init();
});
