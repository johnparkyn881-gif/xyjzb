// ==================== 账单管理模块 (Firebase 升级版) ====================

const ExpenseManager = {
    userId: null,
    categories: null,
    expenses: [],
    currentFilter: {
        type: 'all',
        category: 'all',
        month: new Date().toISOString().slice(0, 7)
    },

    // 初始化
    async init(userId) {
        this.userId = userId;
        this.categories = await Storage.getCategories(userId);
        this.expenses = await Storage.getExpenses(userId);
        this.renderCategoryOptions();
    },

    // 重新加载数据
    async refreshData() {
        this.expenses = await Storage.getExpenses(this.userId);
    },

    // 获取分类
    getCategory(type, categoryId) {
        return this.categories[type].find(c => c.id === categoryId) || { name: '未知', icon: '❓', color: '#94a3b8' };
    },

    // 渲染分类选项
    renderCategoryOptions() {
        const expenseGrid = document.getElementById('category-grid');
        if (!expenseGrid) return;

        const type = document.getElementById('expense-type').value;
        const categories = this.categories[type];

        expenseGrid.innerHTML = categories.map(cat => `
            <div class="category-btn" data-category="${cat.id}">
                <span class="category-btn-icon">${cat.icon}</span>
                <span>${cat.name}</span>
            </div>
        `).join('');

        expenseGrid.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                expenseGrid.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    },

    // 添加账单
    async addExpense(expenseData) {
        const id = await Storage.addExpense(this.userId, expenseData);
        if (id) {
            await this.refreshData();
            return { success: true, message: '添加成功' };
        }
        return { success: false, message: '添加失败' };
    },

    // 更新账单
    async updateExpense(expenseId, expenseData) {
        const result = await Storage.updateExpense(this.userId, expenseId, expenseData);
        if (result) {
            await this.refreshData();
            return { success: true, message: '更新成功' };
        }
        return { success: false, message: '更新失败' };
    },

    // 删除账单
    async deleteExpense(expenseId) {
        if (confirm('确定要删除这条记录吗？')) {
            const result = await Storage.deleteExpense(this.userId, expenseId);
            if (result) {
                await this.refreshData();
                return { success: true, message: '删除成功' };
            }
            return { success: false, message: '删除失败' };
        }
        return { success: false, message: '已取消' };
    },

    // 获取过滤后的账单
    getFilteredExpenses() {
        return this.expenses.filter(expense => {
            if (this.currentFilter.type !== 'all' && expense.type !== this.currentFilter.type) return false;
            if (this.currentFilter.category !== 'all' && expense.category !== this.currentFilter.category) return false;
            if (this.currentFilter.month && !expense.date.startsWith(this.currentFilter.month)) return false;
            return true;
        });
    },

    // 渲染账单列表
    renderExpenseList() {
        const listContainer = document.getElementById('expense-list');
        if (!listContainer) return;

        const filtered = this.getFilteredExpenses();
        if (filtered.length === 0) {
            listContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><h3>暂无账单记录</h3></div>`;
            return;
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        listContainer.innerHTML = filtered.map(expense => {
            const category = this.getCategory(expense.type, expense.category);
            const amountClass = expense.type === 'income' ? 'income' : 'expense';
            const amountPrefix = expense.type === 'income' ? '+' : '-';

            return `
                <div class="expense-item" data-id="${expense.id}">
                    <div class="expense-item-info">
                        <div class="expense-item-icon" style="background: ${category.color}20; color: ${category.color}">${category.icon}</div>
                        <div class="expense-item-details">
                            <h4>${category.name}</h4>
                            <p>${expense.date} ${expense.note ? '· ' + expense.note : ''}</p>
                        </div>
                    </div>
                    <div class="expense-item-amount ${amountClass}">${amountPrefix}¥${parseFloat(expense.amount).toFixed(2)}</div>
                    <div class="expense-item-actions">
                        <button class="icon-btn edit-btn" data-id="${expense.id}">✏️</button>
                        <button class="icon-btn delete-btn" data-id="${expense.id}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => this.editExpense(e.target.dataset.id)));
        listContainer.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            const res = await this.deleteExpense(e.target.dataset.id);
            if (res.success) {
                showToast(res.message);
                this.renderExpenseList();
                this.renderRecentTransactions();
                StatsManager.updateDashboard();
            }
        }));
    },

    // 渲染最近交易
    renderRecentTransactions() {
        const container = document.getElementById('recent-list');
        if (!container) return;

        const recent = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        if (recent.length === 0) {
            container.innerHTML = `<p class="empty-state">暂无交易记录</p>`;
            return;
        }

        container.innerHTML = recent.map(expense => {
            const category = this.getCategory(expense.type, expense.category);
            const amountClass = expense.type === 'income' ? 'income' : 'expense';
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon" style="background: ${category.color}20; color: ${category.color}">${category.icon}</div>
                        <div class="transaction-details"><h4>${category.name}</h4><p>${expense.date}</p></div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${expense.type === 'income' ? '+' : '-'}¥${parseFloat(expense.amount).toFixed(2)}</div>
                </div>
            `;
        }).join('');
    },

    editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;
        document.getElementById('modal-title').textContent = '编辑账单';
        document.getElementById('expense-id').value = expense.id;
        document.getElementById('expense-type').value = expense.type;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-note').value = expense.note || '';
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === expense.type));
        this.renderCategoryOptions();
        setTimeout(() => {
            const btn = document.querySelector(`[data-category="${expense.category}"]`);
            if (btn) btn.classList.add('active');
        }, 50);
        document.getElementById('expense-modal').classList.add('active');
    },

    setFilter(filterType, value) {
        this.currentFilter[filterType] = value;
        this.renderExpenseList();
    }
};

window.ExpenseManager = ExpenseManager;
