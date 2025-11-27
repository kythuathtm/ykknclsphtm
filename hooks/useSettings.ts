





import { useState, useEffect } from 'react';
import { RoleSettings, SystemSettings, UserRole, ToastType } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, setDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';

const DEFAULT_ROLE_SETTINGS: RoleSettings = {
    [UserRole.Admin]: { canCreate: true, canViewDashboard: true, canDelete: true, viewableDefectTypes: ['All'], editableFields: ['general', 'soLuongDoi', 'loaiLoi', 'nguyenNhan', 'huongKhacPhuc', 'trangThai', 'ngayHoanThanh'] },
    [UserRole.KyThuat]: { canCreate: true, canViewDashboard: true, canDelete: true, viewableDefectTypes: ['All'], editableFields: ['general', 'soLuongDoi', 'loaiLoi', 'nguyenNhan', 'huongKhacPhuc', 'trangThai', 'ngayHoanThanh'] },
    [UserRole.CungUng]: { canCreate: false, canViewDashboard: true, canDelete: false, viewableDefectTypes: ['All'], editableFields: ['general', 'loaiLoi', 'trangThai'] },
    [UserRole.TongGiamDoc]: { canCreate: false, canViewDashboard: true, canDelete: false, viewableDefectTypes: ['All'], editableFields: [] },
    [UserRole.SanXuat]: { canCreate: false, canViewDashboard: false, canDelete: false, viewableDefectTypes: ['Lỗi Sản xuất', 'Lỗi Hỗn hợp'], editableFields: ['nguyenNhan', 'huongKhacPhuc'] },
    [UserRole.Kho]: { canCreate: false, canViewDashboard: false, canDelete: false, viewableDefectTypes: ['All'], editableFields: [] },
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  appName: 'Theo dõi lỗi SP',
  companyName: 'Công ty Cổ phần Vật tư Y tế Hồng Thiện Mỹ',
  logoUrl: '',
  backgroundType: 'default',
  backgroundValue: '',
  fontFamily: 'Arial, sans-serif',
  baseFontSize: '15px',
  headerBackgroundColor: 'rgba(255, 255, 255, 0.9)',
  headerTextColor: '#0f172a'
};

export const useSettings = (showToast: (msg: string, type: ToastType) => void) => {
  const [roleSettings, setRoleSettings] = useState<RoleSettings>(DEFAULT_ROLE_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  // Listen to SETTINGS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "settings"), (snapshot) => {
      if (!snapshot.empty) {
        const roleDoc = snapshot.docs.find(d => d.id === 'roleSettings');
        if (roleDoc) {
            setRoleSettings(roleDoc.data() as RoleSettings);
        }
        const systemDoc = snapshot.docs.find(d => d.id === 'systemSettings');
        if (systemDoc) {
            setSystemSettings({
                ...DEFAULT_SYSTEM_SETTINGS, // Merge with defaults to ensure new fields like fontFamily exist
                ...systemDoc.data() as SystemSettings
            });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const saveRoleSettings = async (newSettings: RoleSettings) => {
      try {
          await setDoc(doc(db, "settings", "roleSettings"), newSettings);
          setRoleSettings(newSettings); // Optimistic Update
          showToast('Cập nhật phân quyền thành công.', 'success');
      } catch (error) {
          showToast("Lỗi khi lưu phân quyền", "error");
      }
  };

  const saveSystemSettings = async (newSettings: SystemSettings) => {
      try {
          await setDoc(doc(db, "settings", "systemSettings"), newSettings);
          setSystemSettings(newSettings); // Optimistic update
          showToast('Cập nhật cấu hình hệ thống thành công.', 'success');
      } catch (error) {
          console.error("System settings save error:", error);
          showToast("Lỗi khi lưu cấu hình", "error");
      }
  };

  const renameRole = async (oldName: string, newName: string) => {
      try {
          // 1. Update Users with the old role
          const q = query(collection(db, "users"), where("role", "==", oldName));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
              const batch = writeBatch(db);
              snapshot.docs.forEach(doc => {
                  batch.update(doc.ref, { role: newName });
              });
              await batch.commit();
              showToast(`Đã đồng bộ vai trò mới cho ${snapshot.size} tài khoản.`, 'success');
          }
      } catch (error) {
          console.error("Error renaming role for users:", error);
          showToast("Lỗi khi cập nhật vai trò người dùng", "error");
      }
  };

  return {
    roleSettings,
    systemSettings,
    saveRoleSettings,
    saveSystemSettings,
    renameRole
  };
};