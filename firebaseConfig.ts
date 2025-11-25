// @ts-ignore
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// QUAN TRỌNG: Thay thế thông tin bên dưới bằng thông tin từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDjW9eTJbMUc-PTWyT7IL6ps5V7AN3DZCo",
  authDomain: "theo-doi-san-pham-loi.firebaseapp.com",
  projectId: "theo-doi-san-pham-loi",
  storageBucket: "theo-doi-san-pham-loi.firebasestorage.app",
  messagingSenderId: "393797044768",
  appId: "1:393797044768:web:a84dd44b4164f573554a45"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };