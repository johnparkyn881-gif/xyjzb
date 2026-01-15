// ==================== 用户认证模块 (Firebase 升级版) ====================

const Auth = {
    // 注册
    async register(username, password, confirmPassword) {
        // 简单的前端验证
        if (password !== confirmPassword) {
            return { success: false, message: '两次输入的密码不一致' };
        }
        if (password.length < 6) {
            return { success: false, message: '密码长度至少为 6 个字符' };
        }

        // 修改为邮箱格式以适配 Firebase (这里简单将用户名转为虚拟邮箱)
        const email = `${username}@xyjzb.com`;

        try {
            const userCredential = await window.fbAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 在 Firestore 中存储额外信息
            await window.fbDb.collection('users').doc(user.uid).set({
                username: username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, message: '注册成功' };
        } catch (error) {
            console.error('Registration error:', error);
            let msg = '注册失败';
            if (error.code === 'auth/email-already-in-use') msg = '用户名已存在';
            if (error.code === 'auth/invalid-email') msg = '用户名格式不正确';
            return { success: false, message: msg };
        }
    },

    // 登录
    async login(username, password) {
        const email = `${username}@xyjzb.com`;
        try {
            await window.fbAuth.signInWithEmailAndPassword(email, password);
            return { success: true, message: '登录成功' };
        } catch (error) {
            console.error('Login error:', error);
            let msg = '登录失败，请检查用户名和密码';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                msg = '用户名或密码错误';
            }
            return { success: false, message: msg };
        }
    },

    // 退出登录
    async logout() {
        try {
            await window.fbAuth.signOut();
            return { success: true, message: '已退出登录' };
        } catch (error) {
            return { success: false, message: '退出失败' };
        }
    },

    // 检查登录状态 (迁移到异步监听)
    isLoggedIn() {
        return window.fbAuth.currentUser !== null;
    },

    // 获取当前用户
    getCurrentUser() {
        const user = window.fbAuth.currentUser;
        return user ? user.uid : null;
    },

    // 获取当前显示名称
    async getUsername() {
        const user = window.fbAuth.currentUser;
        if (!user) return null;
        const doc = await window.fbDb.collection('users').doc(user.uid).get();
        return doc.exists ? doc.data().username : '用户';
    }
};

// 导出到全局
window.Auth = Auth;
