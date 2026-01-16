// ==================== 用户认证模块 (Firebase 升级版) ====================

const Auth = {
    // 注册
    async register(username, password, confirmPassword) {
        // 1. 基本验证
        if (!username || !password || !confirmPassword) {
            return { success: false, message: '请填写所有必填项' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: '两次输入的密码不一致' };
        }
        if (password.length < 6) {
            return { success: false, message: '密码长度至少为 6 个字符' };
        }

        // 2. 用户名格式验证 (关键修复)
        // 允许字母、数字、下划线，长度 3-20
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return { success: false, message: '用户名只能包含字母、数字和下划线，长度3-20位' };
        }

        // 修改为邮箱格式以适配 Firebase
        // 统一转换为小写
        const email = `${username.toLowerCase()}@xyjzb.com`;

        try {
            console.log(`Attempting to register user: ${username} (${email})`);
            const userCredential = await window.fbAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 在 Firestore 中存储额外信息
            await window.fbDb.collection('users').doc(user.uid).set({
                username: username, // 显示名称保留原样
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Registration successful for:', user.uid);
            return { success: true, message: '注册成功' };
        } catch (error) {
            console.error('Registration error details:', error);
            let msg = '注册失败，请稍后重试';

            // 详细错误映射
            switch (error.code) {
                case 'auth/email-already-in-use':
                    msg = '该用户名已被占用';
                    break;
                case 'auth/invalid-email':
                    msg = '生成的邮箱格式不正确 (系统错误)';
                    break;
                case 'auth/operation-not-allowed':
                    msg = '系统注册功能暂时关闭';
                    break;
                case 'auth/weak-password':
                    msg = '密码强度太低';
                    break;
                case 'auth/network-request-failed':
                    msg = '网络连接失败，请检查网络';
                    break;
            }
            return { success: false, message: msg };
        }
    },

    // 登录
    // 登录
    async login(username, password) {
        if (!username || !password) {
            return { success: false, message: '请输入用户名和密码' };
        }

        // 统一转换为小写，避免大小写敏感问题
        const email = `${username.toLowerCase()}@xyjzb.com`;

        try {
            await window.fbAuth.signInWithEmailAndPassword(email, password);
            return { success: true, message: '登录成功' };
        } catch (error) {
            console.error('Login error:', error);
            let msg = '登录失败，请检查用户名和密码';

            // 详细错误处理
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    msg = '用户名或密码错误';
                    break;
                case 'auth/invalid-email':
                    msg = '用户名格式不正确';
                    break;
                case 'auth/user-disabled':
                    msg = '该账号已被禁用';
                    break;
                case 'auth/too-many-requests':
                    msg = '尝试登录次数过多，请稍后再试';
                    break;
                case 'auth/network-request-failed':
                    msg = '网络连接失败，请检查网络设置';
                    break;
                default:
                    // 对于未知错误，显示错误代码以便排查
                    msg = `登录失败 (${error.code})`;
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
