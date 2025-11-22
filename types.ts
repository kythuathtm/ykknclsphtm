
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
  fullName?: string; // Họ và tên hiển thị
  role: UserRole;
  password?: string; 
}

export interface DefectReport {
  id: string;
  ngayTao: string; // Added field: Creation timestamp
  ngayPhanAnh: string;
  maSanPham: string;
  dongSanPham: string;
  tenThuongMai: string;
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
  loaiLoi: 'Lỗi bộ phận sản xuất' | 'Lỗi Nhà cung cấp' | 'Lỗi vừa sản xuất vừa NCC' | 'Lỗi khác';
  nhanHang: 'HTM' | 'VMA' | 'Khác';
}

export type ToastType = 'success' | 'error' | 'info';

export type PermissionField = 'general' | 'soLuongDoi' | 'loaiLoi' | 'nguyenNhan' | 'huongKhacPhuc' | 'trangThai' | 'ngayHoanThanh';

// Cấu hình phân quyền
export interface RoleConfig {
  canCreate: boolean; // Quyền thêm mới
  canViewDashboard: boolean; // Quyền xem báo cáo thống kê
  viewableDefectTypes: string[]; // Danh sách các loại lỗi được phép xem ('All' hoặc cụ thể)
  editableFields: PermissionField[]; // Danh sách các trường được phép chỉnh sửa
}

export type RoleSettings = Record<UserRole, RoleConfig>;
