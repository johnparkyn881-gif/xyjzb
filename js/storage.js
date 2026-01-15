// ==================== 数据存储模块 (Firebase 升级版) ====================

const Storage = {
    // 获取用户的账单数据 (从 Firestore)
    async getExpenses(userId) {
        try {
            const snapshot = await window.fbDb.collection('users').doc(userId).collection('expenses').orderBy('date', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting expenses:', error);
            return [];
        }
    },

    // 添加账单
    async addExpense(userId, expense) {
        try {
            const data = {
                ...expense,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await window.fbDb.collection('users').doc(userId).collection('expenses').add(data);
            return docRef.id;
        } catch (error) {
            console.error('Error adding expense:', error);
            return null;
        }
    },

    // 更新账单
    async updateExpense(userId, expenseId, updatedExpense) {
        try {
            await window.fbDb.collection('users').doc(userId).collection('expenses').doc(expenseId).update(updatedExpense);
            return true;
        } catch (error) {
            console.error('Error updating expense:', error);
            return false;
        }
    },

    // 删除账单
    async deleteExpense(userId, expenseId) {
        try {
            await window.fbDb.collection('users').doc(userId).collection('expenses').doc(expenseId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            return false;
        }
    },

    // 获取用户的分类数据
    async getCategories(userId) {
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

        try {
            const doc = await window.fbDb.collection('users').doc(userId).get();
            if (doc.exists && doc.data().categories) {
                return doc.data().categories;
            }
            return defaultCategories;
        } catch (error) {
            return defaultCategories;
        }
    },

    // 获取用户设置
    async getSettings(userId) {
        const defaultSettings = { theme: 'light' };
        try {
            const doc = await window.fbDb.collection('users').doc(userId).get();
            if (doc.exists && doc.data().settings) {
                return doc.data().settings;
            }
            return defaultSettings;
        } catch (error) {
            return defaultSettings;
        }
    },

    // 保存设置
    async saveSettings(userId, settings) {
        try {
            await window.fbDb.collection('users').doc(userId).update({ settings });
            return true;
        } catch (error) {
            return false;
        }
    },

    // 迁移旧的本地数据到云端 (仅执行一次)
    async migrateLocalData(userId, oldUsername) {
        const localExpenses = JSON.parse(localStorage.getItem(`budget_tracker_expenses_${oldUsername}`) || '[]');
        if (localExpenses.length === 0) return;

        console.log(`Migrating ${localExpenses.length} records for ${oldUsername}...`);

        const batch = window.fbDb.batch();
        localExpenses.forEach(exp => {
            const ref = window.fbDb.collection('users').doc(userId).collection('expenses').doc();
            batch.set(ref, {
                type: exp.type,
                amount: exp.amount,
                category: exp.category,
                date: exp.date,
                note: exp.note || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        // 迁移后清除本地数据，防止重复迁移
        localStorage.removeItem(`budget_tracker_expenses_${oldUsername}`);
        console.log('Migration complete.');
    }
};

// 导出到全局
window.Storage = Storage;
