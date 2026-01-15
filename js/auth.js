// ==================== 用户认证模块 ====================

const Auth = {
    // 简单的密码哈希（实际应用中应使用更安全的方法）
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    },

    // 验证用户名
    validateUsername(username) {
        if (!username || username.length < 3 || username.length > 20) {
            return { valid: false, message: '用户名长度应为3-20个字符' };
        }
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' };
        }
        return { valid: true };
    },

    // 验证密码
    validatePassword(password) {
        if (!password || password.length < 6) {
            return { valid: false, message: '密码长度至少为6个字符' };
        }
        return { valid: true };
    },

    // 注册
    register(username, password, confirmPassword) {
        // 验证用户名
        const usernameValidation = this.validateUsername(username);
        if (!usernameValidation.valid) {
            return { success: false, message: usernameValidation.message };
        }

        // 验证密码
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.valid) {
            return { success: false, message: passwordValidation.message };
        }

        // 确认密码
        if (password !== confirmPassword) {
            return { success: false, message: '两次输入的密码不一致' };
        }

        // 检查用户名是否已存在
        if (Storage.userExists(username)) {
            return { success: false, message: '用户名已存在' };
        }

        // 创建用户
        const user = {
            username: username,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        // 保存用户
        if (Storage.saveUser(user)) {
            return { success: true, message: '注册成功' };
        } else {
            return { success: false, message: '注册失败，请重试' };
        }
    },

    // 登录
    login(username, password) {
        // 验证输入
        if (!username || !password) {
            return { success: false, message: '请输入用户名和密码' };
        }

        // 获取用户
        const user = Storage.getUser(username);
        if (!user) {
            return { success: false, message: '用户名或密码错误' };
        }

        // 验证密码
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: '用户名或密码错误' };
        }

        // 设置当前用户
        if (Storage.setCurrentUser(username)) {
            return { success: true, message: '登录成功', username: username };
        } else {
            return { success: false, message: '登录失败，请重试' };
        }
    },

    // 退出登录
    logout() {
        if (Storage.logout()) {
            return { success: true, message: '已退出登录' };
        } else {
            return { success: false, message: '退出失败' };
        }
    },

    // 检查登录状态
    isLoggedIn() {
        return Storage.getCurrentUser() !== null;
    },

    // 获取当前用户
    getCurrentUser() {
        return Storage.getCurrentUser();
    }
};

// 导出到全局
window.Auth = Auth;
