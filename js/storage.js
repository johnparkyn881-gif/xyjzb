// ==================== 数据存储模块 ====================
// 使用 LocalStorage 进行数据持久化

const Storage = {
    // 存储键名
    KEYS: {
        USERS: 'budget_tracker_users',
        CURRENT_USER: 'budget_tracker_current_user',
        EXPENSES: 'budget_tracker_expenses_',
        CATEGORIES: 'budget_tracker_categories_',
        SETTINGS: 'budget_tracker_settings_'
    },

    // 获取数据
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    // 保存数据
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    // 清空所有数据
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    // 获取所有用户
    getUsers() {
        return this.get(this.KEYS.USERS, []);
    },

    // 保存用户
    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        return this.set(this.KEYS.USERS, users);
    },

    // 检查用户名是否存在
    userExists(username) {
        const users = this.getUsers();
        return users.some(u => u.username === username);
    },

    // 获取用户
    getUser(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username);
    },

    // 获取当前登录用户
    getCurrentUser() {
        return this.get(this.KEYS.CURRENT_USER);
    },

    // 设置当前登录用户
    setCurrentUser(username) {
        return this.set(this.KEYS.CURRENT_USER, username);
    },

    // 退出登录
    logout() {
        return this.remove(this.KEYS.CURRENT_USER);
    },

    // 获取用户的账单数据
    getExpenses(username) {
        return this.get(this.KEYS.EXPENSES + username, []);
    },

    // 保存用户的账单数据
    saveExpenses(username, expenses) {
        return this.set(this.KEYS.EXPENSES + username, expenses);
    },

    // 添加账单
    addExpense(username, expense) {
        const expenses = this.getExpenses(username);
        expense.id = Date.now().toString();
        expense.createdAt = new Date().toISOString();
        expenses.push(expense);
        return this.saveExpenses(username, expenses);
    },

    // 更新账单
    updateExpense(username, expenseId, updatedExpense) {
        const expenses = this.getExpenses(username);
        const index = expenses.findIndex(e => e.id === expenseId);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updatedExpense };
            return this.saveExpenses(username, expenses);
        }
        return false;
    },

    // 删除账单
    deleteExpense(username, expenseId) {
        const expenses = this.getExpenses(username);
        const filtered = expenses.filter(e => e.id !== expenseId);
        return this.saveExpenses(username, filtered);
    },

    // 获取用户的分类数据
    getCategories(username) {
        const defaultCategories = {
            expense: [
                { id: 'food', name: '餐饮', icon: '🍜', color: '#ef4444' },
                { id: 'transport', name: '交通', icon: '🚌', color: '#f59e0b' },
                { id: 'study', name: '学习', icon: '📚', color: '#3b82f6' },
                { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#8b5cf6' },
                { id: 'shopping', name: '购物', icon: '🛍️', color: '#ec4899' },
                { id: 'health', name: '医疗', icon: '💊', color: '#10b981' },
                { id: 'housing', name: '住房', icon: '🏠', color: '#6366f1' },
                { id: 'other', name: '其他', icon: '📦', color: '#64748b' }
            ],
            income: [
                { id: 'salary', name: '工资', icon: '💰', color: '#10b981' },
                { id: 'parttime', name: '兼职', icon: '💼', color: '#059669' },
                { id: 'scholarship', name: '奖学金', icon: '🎓', color: '#0d9488' },
                { id: 'allowance', name: '生活费', icon: '💵', color: '#14b8a6' },
                { id: 'bonus', name: '奖金', icon: '🎁', color: '#06b6d4' },
                { id: 'other', name: '其他', icon: '📦', color: '#64748b' }
            ]
        };
        return this.get(this.KEYS.CATEGORIES + username, defaultCategories);
    },

    // 保存用户的分类数据
    saveCategories(username, categories) {
        return this.set(this.KEYS.CATEGORIES + username, categories);
    },

    // 获取用户设置
    getSettings(username) {
        const defaultSettings = {
            theme: 'light',
            currency: 'CNY',
            language: 'zh-CN'
        };
        return this.get(this.KEYS.SETTINGS + username, defaultSettings);
    },

    // 保存用户设置
    saveSettings(username, settings) {
        return this.set(this.KEYS.SETTINGS + username, settings);
    },

    // 导出用户数据
    exportUserData(username) {
        return {
            username: username,
            expenses: this.getExpenses(username),
            categories: this.getCategories(username),
            settings: this.getSettings(username),
            exportDate: new Date().toISOString()
        };
    },

    // 导入用户数据
    importUserData(username, data) {
        try {
            if (data.expenses) {
                this.saveExpenses(username, data.expenses);
            }
            if (data.categories) {
                this.saveCategories(username, data.categories);
            }
            if (data.settings) {
                this.saveSettings(username, data.settings);
            }
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
};

// 导出到全局
window.Storage = Storage;
