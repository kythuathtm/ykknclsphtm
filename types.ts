
export enum UserRole {
  Admin = 'Admin',
  CungUng = 'Nhân viên cung ứng',
  Kho = 'Nhân viên kho',
  TongGiamDoc = 'Tổng giám đốc',
  KyThuat = 'Kỹ thuật',
  SanXuat = 'Sản xuất',
}

export interface User {
  username: string;
  fullName?: string;
  role: UserRole;
  password?: string; 
}

export interface Product {
  maSanPham: string;
  tenThuongMai: string;
  tenThietBi: string; // Tên thiết bị y tế
  dongSanPham: string;
  nhanHang?: string;
  GPLH: string;
}

export interface DefectReport {
  id: string;
  ngayTao: string;
  ngayPhanAnh: string;
  maSanPham: string;
  dongSanPham: string;
  tenThuongMai: string;
  tenThietBi?: string; // New field
  nhaPhanPhoi: string;
  donViSuDung: string;
  noiDungPhanAnh: string;
  soLo: string;
  maNgaySanXuat: string;
  soLuongLoi: number;
  soLuongDaNhap: number;
  soLuongDoi: number;
  nguyenNhan?: string;
  huongKhacPhuc?: string;
  trangThai: 'Mới' | 'Đang xử lý' | 'Chưa tìm ra nguyên nhân' | 'Hoàn thành';
  ngayHoanThanh?: string;
  loaiLoi: 'Lỗi Sản xuất' | 'Lỗi Nhà cung cấp' | 'Lỗi Hỗn hợp' | 'Lỗi Khác';
  nhanHang: 'HTM' | 'VMA' | 'Khác';
}

export type ToastType = 'success' | 'error' | 'info';

export type PermissionField = 'general' | 'soLuongDoi' | 'loaiLoi' | 'nguyenNhan' | 'huongKhacPhuc' | 'trangThai' | 'ngayHoanThanh';

export interface RoleConfig {
  canCreate: boolean;
  canViewDashboard: boolean;
  viewableDefectTypes: string[];
  editableFields: PermissionField[];
}

export type RoleSettings = Record<UserRole, RoleConfig>;

export interface SystemSettings {
  appName: string;
  companyName: string;
  logoUrl: string;
  backgroundType: 'default' | 'image' | 'color';
  backgroundValue: string;
}
