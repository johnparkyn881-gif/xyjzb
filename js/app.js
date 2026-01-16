// ==================== 主应用模块 (Firebase 升级版) ====================

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function toggleLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

async function switchPage(pageName) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'dashboard') {
        ExpenseManager.renderRecentTransactions();
        StatsManager.updateDashboard();
    } else if (pageName === 'expenses') {
        ExpenseManager.renderExpenseList();
    } else if (pageName === 'statistics') {
        StatsManager.updateStatisticsPage(StatsManager.currentPeriod);
    }
}

async function showApp(user) {
    toggleLoading(true);
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'block';

    // 获取并显示用户名
    const username = await Auth.getUsername();
    document.getElementById('current-username').textContent = username;

    // 检查是否有本地数据需要同步 (仅限首次升级)
    const oldUsername = localStorage.getItem('budget_tracker_current_user');
    if (oldUsername && oldUsername.startsWith('"')) { // 处理 JSON 引号
        const cleanName = JSON.parse(oldUsername);
        await Storage.migrateLocalData(user.uid, cleanName);
        localStorage.removeItem('budget_tracker_current_user');
    }

    // 初始化模块
    await ExpenseManager.init(user.uid);
    await StatsManager.init(user.uid);

    toggleLoading(false);
    switchPage('dashboard');
}

function showAuth() {
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('app-page').style.display = 'none';
    toggleLoading(false);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialization started...');

    // 监听 Firebase 登录状态
    console.log('Setting up Auth state listener...');
    window.fbAuth.onAuthStateChanged(user => {
        console.log('Auth state changed:', user ? 'Logged In' : 'Logged Out');
        if (user) {
            showApp(user);
        } else {
            showAuth();
        }
    });

    // 注册提交
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Register form submitted');
        toggleLoading(true);
        const res = await Auth.register(
            document.getElementById('register-username').value.trim(),
            document.getElementById('register-password').value,
            document.getElementById('register-confirm').value
        );
        showToast(res.message);
        toggleLoading(false);
    });

    // 登录提交
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        toggleLoading(true);
        const res = await Auth.login(
            document.getElementById('login-username').value.trim(),
            document.getElementById('login-password').value
        );
        if (!res.success) {
            showToast(res.message);
            toggleLoading(false);
        }
    });

    // 切换登录/注册表单
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginFormDiv = document.getElementById('login-form');
    const registerFormDiv = document.getElementById('register-form');

    console.log('Elements found:', {
        showRegisterLink: !!showRegisterLink,
        showLoginLink: !!showLoginLink,
        loginFormDiv: !!loginFormDiv,
        registerFormDiv: !!registerFormDiv
    });

    if (showRegisterLink && loginFormDiv && registerFormDiv) {
        showRegisterLink.onclick = (e) => {
            e.preventDefault();
            console.log('Switching to register form (via onclick)');
            loginFormDiv.classList.remove('active');
            registerFormDiv.classList.add('active');
        };
    }

    if (showLoginLink && loginFormDiv && registerFormDiv) {
        showLoginLink.onclick = (e) => {
            e.preventDefault();
            console.log('Switching to login form (via onclick)');
            registerFormDiv.classList.remove('active');
            loginFormDiv.classList.add('active');
        };
    }

    // 登出
    document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

    // 记账提交
    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const expenseId = document.getElementById('expense-id').value;
        const selCat = document.querySelector('.category-btn.active');
        if (!selCat) return showToast('请选择分类');

        const data = {
            type: document.getElementById('expense-type').value,
            amount: document.getElementById('expense-amount').value,
            category: selCat.dataset.category,
            date: document.getElementById('expense-date').value,
            note: document.getElementById('expense-note').value.trim()
        };

        toggleLoading(true);
        const res = expenseId ? await ExpenseManager.updateExpense(expenseId, data) : await ExpenseManager.addExpense(data);
        showToast(res.message);

        if (res.success) {
            document.getElementById('expense-modal').classList.remove('active');
            ExpenseManager.renderExpenseList();
            ExpenseManager.renderRecentTransactions();
            await StatsManager.refresh();
        }
        toggleLoading(false);
    });

    // 导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchPage(item.dataset.page));
    });

    // 展开/收起添加弹窗
    const openMod = () => {
        document.getElementById('modal-title').textContent = '记一笔';
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        ExpenseManager.renderCategoryOptions();
        document.getElementById('expense-modal').classList.add('active');
    };
    document.getElementById('add-expense-btn').onclick = openMod;
    document.getElementById('add-expense-btn-2').onclick = openMod;
    document.querySelector('.modal-close').onclick = () => document.getElementById('expense-modal').classList.remove('active');

    // 类型切换
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('expense-type').value = btn.dataset.type;
            ExpenseManager.renderCategoryOptions();
        };
    });
});
