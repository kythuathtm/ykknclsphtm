
import { useState, useEffect } from 'react';
import { User, UserRole, ToastType } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

const INITIAL_USERS: User[] = [
  { username: 'admin', fullName: 'Quản Trị Viên', role: UserRole.Admin, password: '123' },
  { username: 'kythuat', fullName: 'Nguyễn Văn Kỹ', role: UserRole.KyThuat, password: '123' },
  { username: 'sanxuat', fullName: 'Trần Văn Sản', role: UserRole.SanXuat, password: '123' },
  { username: 'cungung', fullName: 'Lê Thị Cung', role: UserRole.CungUng, password: '123' },
  { username: 'kho', fullName: 'Phạm Văn Kho', role: UserRole.Kho, password: '123' },
  { username: 'tgd', fullName: 'Nguyễn Tổng', role: UserRole.TongGiamDoc, password: '123' },
];

export const useAuth = (showToast: (msg: string, type: ToastType) => void) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Listen to USERS (and Seed if empty)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), async (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data()) as User[];
      setUsers(usersData);
      setIsLoadingUsers(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const saveUser = async (user: User, isEdit: boolean) => {
    try {
        await setDoc(doc(db, "users", user.username), user);
        showToast(isEdit ? 'Cập nhật tài khoản thành công.' : 'Thêm tài khoản mới thành công.', 'success');
        return true;
    } catch (error) {
        console.error("User save error:", error);
        showToast("Lỗi khi lưu tài khoản", "error");
        return false;
    }
  };

  const deleteUser = async (username: string) => {
    try {
        await deleteDoc(doc(db, "users", username));
        showToast('Đã xóa tài khoản.', 'info');
        return true;
    } catch (error) {
        showToast("Lỗi khi xóa tài khoản", "error");
        return false;
    }
  };

  return {
    currentUser,
    users: users.length > 0 ? users : INITIAL_USERS, // Fallback for login screen
    isLoadingUsers,
    login,
    logout,
    saveUser,
    deleteUser
  };
};
