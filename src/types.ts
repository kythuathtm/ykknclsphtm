
// Change from enum to const object to support dynamic roles
export const UserRole = {
  Admin: 'Admin',
  CungUng: 'Bộ phận Cung ứng',
  Kho: 'Bộ phận Kho',
  TongGiamDoc: 'Tổng giám đốc',
  KyThuat: 'Bộ phận Kỹ thuật',
  SanXuat: 'Bộ phận Sản xuất',
} as const;

// Define UserRole type as string to allow custom roles
export type UserRole = typeof UserRole[keyof typeof UserRole] | string;

export interface User {
  username: string;
  fullName?: string;
  role: UserRole;
  password?: string; 
  avatarUrl?: string; // Add avatarUrl optional field
}

export interface Product {
  maSanPham: string;
  tenThuongMai: string;
  tenThietBi: string; // Tên thiết bị y tế
  dongSanPham: string;
  nhanHang?: string;
  GPLH: string;
  donViTinh?: string; // Unit
}

export interface ActivityLog {
  id: string;
  type: 'log' | 'comment';
  content: string;
  timestamp: string;
  user: string;
  role?: string;
}

export interface DefectReport {
  id: string;
  ngayTao: string;
  ngayPhanAnh: string;
  maSanPham: string;
  dongSanPham: string;
  tenThuongMai: string;
  tenThietBi?: string; 
  nhaPhanPhoi: string;
  donViSuDung: string;
  noiDungPhanAnh: string;
  images?: string[]; // New field: Image URLs
  soLo: string;
  hanDung?: string; // New field: Expiration Date
  donViTinh?: string; // New field: Unit
  maNgaySanXuat: string;
  soLuongLoi: number;
  soLuongDaNhap: number;
  soLuongDoi: number;
  ngayDoiHang?: string; // New field: Exchange Date
  nguyenNhan?: string;
  huongKhacPhuc?: string;
  trangThai: 'Mới' | 'Đang tiếp nhận' | 'Đang xác minh' | 'Đang xử lý' | 'Chưa tìm ra nguyên nhân' | 'Hoàn thành';
  ngayHoanThanh?: string;
  loaiLoi: 'Lỗi Sản xuất' | 'Lỗi Nhà cung cấp' | 'Lỗi Hỗn hợp' | 'Lỗi Khác';
  nhanHang: 'HTM' | 'VMA' | 'Khác';
  activityLog?: ActivityLog[];
}

export type ToastType = 'success' | 'error' | 'info';

export type PermissionField = 'general' | 'soLuongDoi' | 'loaiLoi' | 'nguyenNhan' | 'huongKhacPhuc' | 'trangThai' | 'ngayHoanThanh' | 'ngayDoiHang';

export interface RoleConfig {
  canCreate: boolean;
  canViewDashboard: boolean;
  canDelete: boolean; // New permission field
  viewableDefectTypes: string[];
  editableFields: PermissionField[];
}

// RoleSettings key is now just string to support dynamic roles
export type RoleSettings = Record<string, RoleConfig>;

export interface SystemSettings {
  appName: string;
  companyName: string;
  companyAddress?: string; // Optional address
  logoUrl: string;
  backgroundType: 'default' | 'image' | 'color';
  backgroundValue: string;
  
  // Global Settings
  fontFamily?: string; 
  baseFontSize?: string;
  
  // Header Specifics
  headerBackgroundColor?: string; 
  headerTextColor?: string;
  headerFontFamily?: string; // New
  headerFontSize?: string; // New
  
  // List/Table Specifics
  listFontFamily?: string; // New
  listFontSize?: string; // New
}