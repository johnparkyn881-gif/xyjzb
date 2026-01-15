// ==================== 统计分析模块 ====================

const StatsManager = {
    currentUser: null,
    expenses: [],
    categories: null,
    charts: {},
    currentPeriod: 'month',

    // 初始化
    init(username) {
        this.currentUser = username;
        this.expenses = Storage.getExpenses(username);
        this.categories = Storage.getCategories(username);
        this.updateDashboard();
    },

    // 获取时间范围
    getDateRange(period) {
        const now = new Date();
        const start = new Date();

        switch (period) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth(), 1);
                break;
            case 'year':
                start.setMonth(0, 1);
                break;
        }

        return { start, end: now };
    },

    // 获取时间段内的账单
    getExpensesInRange(start, end) {
        return this.expenses.filter(expense => {
            const date = new Date(expense.date);
            return date >= start && date <= end;
        });
    },

    // 计算统计数据
    calculateStats(period = 'month') {
        const { start, end } = this.getDateRange(period);
        const expenses = this.getExpensesInRange(start, end);

        const income = expenses
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const expense = expenses
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const balance = income - expense;

        // 计算日均支出
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const dailyAverage = expense / days;

        // 按分类统计
        const byCategory = {};
        expenses.filter(e => e.type === 'expense').forEach(e => {
            if (!byCategory[e.category]) {
                byCategory[e.category] = 0;
            }
            byCategory[e.category] += parseFloat(e.amount);
        });

        // 按日期统计
        const byDate = {};
        expenses.forEach(e => {
            if (!byDate[e.date]) {
                byDate[e.date] = { income: 0, expense: 0 };
            }
            byDate[e.date][e.type] += parseFloat(e.amount);
        });

        return {
            income,
            expense,
            balance,
            dailyAverage,
            byCategory,
            byDate,
            count: expenses.length
        };
    },

    // 更新仪表盘
    updateDashboard() {
        const stats = this.calculateStats('month');

        // 更新统计卡片
        const incomeEl = document.getElementById('total-income');
        const expenseEl = document.getElementById('total-expense');
        const balanceEl = document.getElementById('total-balance');

        if (incomeEl) incomeEl.textContent = `¥${stats.income.toFixed(2)}`;
        if (expenseEl) expenseEl.textContent = `¥${stats.expense.toFixed(2)}`;
        if (balanceEl) {
            balanceEl.textContent = `¥${stats.balance.toFixed(2)}`;
            balanceEl.style.color = stats.balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        }

        // 更新图表
        this.updateTrendChart();
        this.updateCategoryChart();
    },

    // 更新趋势图
    updateTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { start, end } = this.getDateRange('month');

        // 生成日期标签
        const labels = [];
        const data = [];
        const current = new Date(start);

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            labels.push(dateStr.slice(5)); // MM-DD

            const dayExpenses = this.expenses.filter(e =>
                e.date === dateStr && e.type === 'expense'
            );
            const total = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            data.push(total);

            current.setDate(current.getDate() + 1);
        }

        // 销毁旧图表
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        // 创建新图表
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '每日支出',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '¥' + value;
                            }
                        }
                    }
                }
            }
        });
    },

    // 更新分类图
    updateCategoryChart() {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const stats = this.calculateStats('month');

        const labels = [];
        const data = [];
        const colors = [];

        Object.entries(stats.byCategory).forEach(([categoryId, amount]) => {
            const category = this.categories.expense.find(c => c.id === categoryId);
            if (category && amount > 0) {
                labels.push(category.name);
                data.push(amount);
                colors.push(category.color);
            }
        });

        // 销毁旧图表
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        // 创建新图表
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // 更新统计页面
    updateStatisticsPage(period = 'month') {
        this.currentPeriod = period;
        const stats = this.calculateStats(period);

        // 更新汇总数据
        const incomeEl = document.getElementById('stats-income');
        const expenseEl = document.getElementById('stats-expense');
        const dailyEl = document.getElementById('stats-daily');

        if (incomeEl) incomeEl.textContent = `¥${stats.income.toFixed(2)}`;
        if (expenseEl) expenseEl.textContent = `¥${stats.expense.toFixed(2)}`;
        if (dailyEl) dailyEl.textContent = `¥${stats.dailyAverage.toFixed(2)}`;

        // 更新图表
        this.updateDailyTrendChart(period);
        this.updateCategoryPieChart(period);
        this.updateCategoryBarChart(period);
    },

    // 更新每日趋势图
    updateDailyTrendChart(period) {
        const canvas = document.getElementById('daily-trend-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { start, end } = this.getDateRange(period);

        const labels = [];
        const incomeData = [];
        const expenseData = [];
        const current = new Date(start);

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            labels.push(dateStr.slice(5));

            const dayIncome = this.expenses
                .filter(e => e.date === dateStr && e.type === 'income')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const dayExpense = this.expenses
                .filter(e => e.date === dateStr && e.type === 'expense')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);

            incomeData.push(dayIncome);
            expenseData.push(dayExpense);

            current.setDate(current.getDate() + 1);
        }

        if (this.charts.dailyTrend) {
            this.charts.dailyTrend.destroy();
        }

        this.charts.dailyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '收入',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '支出',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '¥' + value;
                            }
                        }
                    }
                }
            }
        });
    },

    // 更新分类饼图
    updateCategoryPieChart(period) {
        const canvas = document.getElementById('category-pie-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const stats = this.calculateStats(period);

        const labels = [];
        const data = [];
        const colors = [];

        Object.entries(stats.byCategory).forEach(([categoryId, amount]) => {
            const category = this.categories.expense.find(c => c.id === categoryId);
            if (category && amount > 0) {
                labels.push(category.name);
                data.push(amount);
                colors.push(category.color);
            }
        });

        if (this.charts.categoryPie) {
            this.charts.categoryPie.destroy();
        }

        this.charts.categoryPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // 更新分类柱状图
    updateCategoryBarChart(period) {
        const canvas = document.getElementById('category-bar-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const stats = this.calculateStats(period);

        const labels = [];
        const data = [];
        const colors = [];

        Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([categoryId, amount]) => {
                const category = this.categories.expense.find(c => c.id === categoryId);
                if (category && amount > 0) {
                    labels.push(category.name);
                    data.push(amount);
                    colors.push(category.color);
                }
            });

        if (this.charts.categoryBar) {
            this.charts.categoryBar.destroy();
        }

        this.charts.categoryBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '支出金额',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '¥' + value;
                            }
                        }
                    }
                }
            }
        });
    },

    // 刷新数据
    refresh() {
        this.expenses = Storage.getExpenses(this.currentUser);
        this.updateDashboard();
        this.updateStatisticsPage(this.currentPeriod);
    }
};

// 导出到全局
window.StatsManager = StatsManager;
