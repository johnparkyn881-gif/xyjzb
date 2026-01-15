// Firebase 配置信息
const firebaseConfig = {
  apiKey: "AIzaSyDnyiOCD8EsCcdg4iqcuUuzz0vJFHUlR0Y",
  authDomain: "xyjzb-95957.firebaseapp.com",
  projectId: "xyjzb-95957",
  storageBucket: "xyjzb-95957.firebasestorage.app",
  messagingSenderId: "235041538251",
  appId: "1:235041538251:web:d05671c4748fbe36ad9b4e",
  measurementId: "G-LZY6G4XFGJ"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 导出到全局
window.fbAuth = auth;
window.fbDb = db;
