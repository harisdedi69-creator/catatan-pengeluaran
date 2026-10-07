/**
 * charts.js - Inisialisasi dan Update Grafik Interaktif dengan Chart.js
 */

class ExpenseCharts {
    constructor() {
        this.trendChart = null;
        this.categoryChart = null;
        this.typeChart = null;
        this.trendRange = 7; // default 7 hari terakhir
    }

    // Periksa apakah dark mode aktif
    isDark() {
        return document.documentElement.classList.contains('dark');
    }

    getThemeColors() {
        const dark = this.isDark();
        return {
            textColor: dark ? '#cbd5e1' : '#475569',
            gridColor: dark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)',
            tooltipBg: dark ? '#1e293b' : '#0f172a',
            tooltipText: '#ffffff'
        };
    }

    init() {
        this.renderTrendChart([]);
        this.renderCategoryChart([]);
        this.renderTypeChart([]);
    }

    // 1. Grafik Tren Harian
    renderTrendChart(expenses) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const theme = this.getThemeColors();
        const days = this.trendRange;

        // Siapkan array tanggal X hari ke belakang
        const datesMap = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const label = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
            datesMap[key] = { label, total: 0 };
        }

        // Akumulasi pengeluaran
        expenses.forEach(item => {
            if (datesMap[item.date]) {
                datesMap[item.date].total += Number(item.amount);
            }
        });

        const labels = Object.values(datesMap).map(d => d.label);
        const dataValues = Object.values(datesMap).map(d => d.total);

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Pengeluaran',
                    data: dataValues,
                    borderColor: '#6366f1',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#818cf8',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: theme.tooltipBg,
                        titleColor: theme.tooltipText,
                        bodyColor: theme.tooltipText,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return ' Total: ' + formatRupiah(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: theme.gridColor, drawBorder: false },
                        ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
                    },
                    y: {
                        grid: { color: theme.gridColor, drawBorder: false },
                        ticks: {
                            color: theme.textColor,
                            font: { family: 'Plus Jakarta Sans', size: 11 },
                            callback: function(value) {
                                if (value >= 1000000) return (value / 1000000).toFixed(1) + ' Jt';
                                if (value >= 1000) return (value / 1000).toFixed(0) + ' Rb';
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. Grafik Donat Kategori
    renderCategoryChart(expenses) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const theme = this.getThemeColors();

        // Hitung total per kategori
        const categoryTotals = {};
        expenses.forEach(item => {
            const cat = item.category || 'Lainnya';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
        });

        const labels = Object.keys(categoryTotals);
        const dataValues = Object.values(categoryTotals);
        const totalAll = dataValues.reduce((acc, curr) => acc + curr, 0);

        // Ambil warna sesuai tema kategori
        const backgroundColors = labels.map(lbl => {
            const info = getCategoryInfo(lbl);
            return info.color || '#94a3b8';
        });

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        // Tampilkan placeholder jika kosong
        if (labels.length === 0) {
            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Belum Ada Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: [theme.gridColor],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    cutout: '72%'
                }
            });
            return;
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: this.isDark() ? '#1e293b' : '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: theme.textColor,
                            boxWidth: 12,
                            padding: 12,
                            font: { family: 'Plus Jakarta Sans', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: theme.tooltipBg,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const pct = totalAll > 0 ? ((val / totalAll) * 100).toFixed(1) : 0;
                                return ` ${context.label}: ${formatRupiah(val)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. Grafik Kebutuhan vs Keinginan
    renderTypeChart(expenses) {
        const ctx = document.getElementById('typeChart');
        if (!ctx) return;

        const theme = this.getThemeColors();
        let kebutuhan = 0;
        let keinginan = 0;
        let darurat = 0;

        expenses.forEach(item => {
            const amt = Number(item.amount) || 0;
            if (item.expense_type === 'Keinginan') keinginan += amt;
            else if (item.expense_type === 'Darurat/Tabungan') darurat += amt;
            else kebutuhan += amt;
        });

        const total = kebutuhan + keinginan + darurat;

        if (this.typeChart) {
            this.typeChart.destroy();
        }

        this.typeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Kebutuhan', 'Keinginan', 'Darurat/Tabungan'],
                datasets: [{
                    data: total === 0 ? [1, 0, 0] : [kebutuhan, keinginan, darurat],
                    backgroundColor: total === 0 ? [theme.gridColor, theme.gridColor, theme.gridColor] : ['#3b82f6', '#f59e0b', '#a855f7'],
                    borderWidth: 2,
                    borderColor: this.isDark() ? '#1e293b' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: theme.textColor,
                            boxWidth: 12,
                            padding: 8,
                            font: { family: 'Plus Jakarta Sans', size: 11 }
                        }
                    },
                    tooltip: {
                        enabled: total > 0,
                        backgroundColor: theme.tooltipBg,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return ` ${context.label}: ${formatRupiah(val)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Perbarui semua grafik sekaligus
    updateAll(expenses) {
        this.renderTrendChart(expenses);
        this.renderCategoryChart(expenses);
        this.renderTypeChart(expenses);
    }

    setTrendRange(days, expenses) {
        this.trendRange = days;
        this.renderTrendChart(expenses);
    }
}

window.charts = new ExpenseCharts();
