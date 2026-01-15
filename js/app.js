// ==================== 主应用模块 ====================

// Toast 提示函数
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// 页面切换
function switchPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // 显示目标页面
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // 根据页面更新内容
    switch (pageName) {
        case 'dashboard':
            StatsManager.updateDashboard();
            ExpenseManager.renderRecentTransactions();
            break;
        case 'expenses':
            ExpenseManager.renderExpenseList();
            break;
        case 'statistics':
            StatsManager.updateStatisticsPage(StatsManager.currentPeriod);
            break;
    }
}

// 显示应用页面
function showApp(username) {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'block';
    document.getElementById('current-username').textContent = username;

    // 初始化模块
    ExpenseManager.init(username);
    StatsManager.init(username);

    // 显示仪表盘
    switchPage('dashboard');
}

// 显示登录页面
function showAuth() {
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('app-page').style.display = 'none';
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // ==================== 认证相关 ====================

    // 切换登录/注册表单
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
    });

    // 注册表单提交
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        const result = Auth.register(username, password, confirm);
        showToast(result.message);

        if (result.success) {
            // 清空表单
            e.target.reset();
            // 切换到登录表单
            document.getElementById('register-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        }
    });

    // 登录表单提交
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        const result = Auth.login(username, password);
        showToast(result.message);

        if (result.success) {
            e.target.reset();
            showApp(result.username);
        }
    });

    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', () => {
        const result = Auth.logout();
        showToast(result.message);
        if (result.success) {
            showAuth();
        }
    });

    // ==================== 导航相关 ====================

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });

    // ==================== 账单相关 ====================

    // 打开添加账单弹窗
    const openExpenseModal = () => {
        document.getElementById('modal-title').textContent = '记一笔';
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-type').value = 'expense';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

        // 重置类型按钮
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'expense');
        });

        ExpenseManager.renderCategoryOptions();
        document.getElementById('expense-modal').classList.add('active');
    };

    document.getElementById('add-expense-btn').addEventListener('click', openExpenseModal);
    document.getElementById('add-expense-btn-2').addEventListener('click', openExpenseModal);

    // 关闭弹窗
    const closeModal = () => {
        document.getElementById('expense-modal').classList.remove('active');
    };

    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-cancel').addEventListener('click', closeModal);

    // 点击背景关闭
    document.getElementById('expense-modal').addEventListener('click', (e) => {
        if (e.target.id === 'expense-modal') {
            closeModal();
        }
    });

    // 类型切换
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('expense-type').value = btn.dataset.type;
            ExpenseManager.renderCategoryOptions();
        });
    });

    // 账单表单提交
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const expenseId = document.getElementById('expense-id').value;
        const type = document.getElementById('expense-type').value;
        const amount = document.getElementById('expense-amount').value;
        const date = document.getElementById('expense-date').value;
        const note = document.getElementById('expense-note').value.trim();

        // 获取选中的分类
        const selectedCategory = document.querySelector('.category-btn.active');
        if (!selectedCategory) {
            showToast('请选择分类');
            return;
        }

        const category = selectedCategory.dataset.category;

        const expenseData = {
            type,
            amount,
            category,
            date,
            note
        };

        let result;
        if (expenseId) {
            // 更新
            result = ExpenseManager.updateExpense(expenseId, expenseData);
        } else {
            // 添加
            result = ExpenseManager.addExpense(expenseData);
        }

        showToast(result.message);

        if (result.success) {
            closeModal();
            ExpenseManager.renderExpenseList();
            ExpenseManager.renderRecentTransactions();
            StatsManager.refresh();
        }
    });

    // 筛选器
    document.getElementById('filter-type')?.addEventListener('change', (e) => {
        ExpenseManager.setFilter('type', e.target.value);
    });

    document.getElementById('filter-category')?.addEventListener('change', (e) => {
        ExpenseManager.setFilter('category', e.target.value);
    });

    document.getElementById('filter-month')?.addEventListener('change', (e) => {
        ExpenseManager.setFilter('month', e.target.value);
    });

    // 初始化筛选器
    const initFilters = () => {
        const filterMonth = document.getElementById('filter-month');
        if (filterMonth) {
            filterMonth.value = new Date().toISOString().slice(0, 7);
        }

        // 填充分类筛选器
        const filterCategory = document.getElementById('filter-category');
        if (filterCategory && ExpenseManager.categories) {
            const allCategories = [
                ...ExpenseManager.categories.expense,
                ...ExpenseManager.categories.income
            ];

            filterCategory.innerHTML = '<option value="all">全部分类</option>' +
                allCategories.map(cat =>
                    `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
                ).join('');
        }
    };

    // ==================== 统计相关 ====================

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.dataset.period;
            StatsManager.updateStatisticsPage(period);
        });
    });

    // ==================== 设置相关 ====================

    // 深色模式切换
    document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            if (Auth.getCurrentUser()) {
                const settings = Storage.getSettings(Auth.getCurrentUser());
                settings.theme = 'dark';
                Storage.saveSettings(Auth.getCurrentUser(), settings);
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (Auth.getCurrentUser()) {
                const settings = Storage.getSettings(Auth.getCurrentUser());
                settings.theme = 'light';
                Storage.saveSettings(Auth.getCurrentUser(), settings);
            }
        }
    });

    // 导出数据
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
        const username = Auth.getCurrentUser();
        if (!username) return;

        const data = Storage.exportUserData(username);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-tracker-${username}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('数据导出成功');
    });

    // 导入数据
    document.getElementById('import-data-btn')?.addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const username = Auth.getCurrentUser();
                if (!username) return;

                if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
                    const result = Storage.importUserData(username, data);
                    if (result) {
                        showToast('数据导入成功');
                        // 刷新页面
                        ExpenseManager.init(username);
                        StatsManager.init(username);
                        switchPage('dashboard');
                    } else {
                        showToast('数据导入失败');
                    }
                }
            } catch (error) {
                showToast('文件格式错误');
            }
        };
        reader.readAsText(file);

        // 重置文件输入
        e.target.value = '';
    });

    // ==================== 初始化 ====================

    // 检查登录状态
    if (Auth.isLoggedIn()) {
        const username = Auth.getCurrentUser();
        showApp(username);

        // 加载用户设置
        const settings = Storage.getSettings(username);
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) themeToggle.checked = true;
        }

        // 初始化筛选器
        setTimeout(initFilters, 100);
    } else {
        showAuth();
    }
});

// 导出函数到全局
window.showToast = showToast;
window.switchPage = switchPage;
