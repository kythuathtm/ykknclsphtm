
import React, { useState, useMemo, useEffect, useTransition, Suspense, useRef, useCallback } from 'react';
import { DefectReport, UserRole, ToastType, User, RoleSettings, PermissionField, SystemSettings, Product } from './types';
import { PlusIcon, BarChartIcon, ArrowDownTrayIcon, ListBulletIcon, ArrowRightOnRectangleIcon, UserGroupIcon, ChartPieIcon, TableCellsIcon, ShieldCheckIcon, CalendarIcon, Cog8ToothIcon, EllipsisHorizontalIcon } from './components/Icons';
import * as XLSX from 'xlsx';
import Loading from './components/Loading';

// Hooks Imports
import { useAuth } from './hooks/useAuth';
import { useReports } from './hooks/useReports';
import { useProducts } from './hooks/useProducts';
import { useSettings } from './hooks/useSettings';

// Component Imports
import { Header } from './components/Header';
import DraggableFAB from './components/DraggableFAB';

// Lazy load components
const DefectReportList = React.lazy(() => import('./components/DefectReportList') as Promise<{ default: React.ComponentType<any> }>);
const DefectReportDetail = React.lazy(() => import('./components/DefectReportDetail'));
const DefectReportForm = React.lazy(() => import('./components/DefectReportForm'));
const ProductListModal = React.lazy(() => import('./components/ProductListModal'));
const UserManagementModal = React.lazy(() => import('./components/UserManagementModal'));
const PermissionManagementModal = React.lazy(() => import('./components/PermissionManagementModal'));
// Explicitly cast Login type to avoid default export confusion in some environments
const Login = React.lazy(() => import('./components/Login') as Promise<{ default: React.ComponentType<any> }>);
const DashboardReport = React.lazy(() => import('./components/DashboardReport') as Promise<{ default: React.ComponentType<any> }>);
const SystemSettingsModal = React.lazy(() => import('./components/SystemSettingsModal'));
const ChatInterface = React.lazy(() => import('./components/ChatInterface'));

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-green-500', icon: '✅' },
    error: { bg: 'bg-red-500', icon: '❌' },
    info: { bg: 'bg-blue-500', icon: 'ℹ️' },
  };

  const { bg, icon } = config[type];

  return (
    <div className={`fixed bottom-5 right-5 ${bg} text-white py-3 px-5 rounded-xl shadow-2xl flex items-center z-[60] animate-fade-in-up`}>
      <span className="mr-3 text-xl">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

// Safe XLSX access
const xlsxLib = (XLSX as any).default ?? XLSX;

// --- Main App Component ---

export const App: React.FC = () => {
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Define showToast first so it can be passed to hooks
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  // Use Custom Hooks
  const { currentUser, users, login, logout, saveUser, deleteUser } = useAuth(showToast);
  const { reports, isLoadingReports, saveReport, deleteReport, updateReport, addComment, importReports } = useReports(showToast);
  const { products, addProduct, deleteProduct, deleteAllProducts, importProducts } = useProducts(showToast);
  const { roleSettings, systemSettings, saveRoleSettings, saveSystemSettings, renameRole, isOffline, connectionError } = useSettings(showToast);

  // UI State
  const [selectedReport, setSelectedReport] = useState<DefectReport | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false); // State to handle modal closing animation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DefectReport | null>(null);
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState<'list' | 'dashboard'>('list');

  // Filters & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [defectTypeFilter, setDefectTypeFilter] = useState('All');
  
  // Initialize Year Filter
  const currentYear = new Date().getFullYear().toString();
  const [yearFilter, setYearFilter] = useState(currentYear); 
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
      key: 'ngayPhanAnh', 
      direction: 'desc' 
  });

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply System Settings to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // Global Settings
    if (systemSettings.fontFamily) {
        root.style.setProperty('font-family', systemSettings.fontFamily);
    }
    if (systemSettings.baseFontSize) {
        root.style.fontSize = systemSettings.baseFontSize;
    }

    // Extended Settings (Header & List)
    if (systemSettings.headerFontFamily) {
        root.style.setProperty('--header-font', systemSettings.headerFontFamily);
    } else {
        root.style.removeProperty('--header-font');
    }

    if (systemSettings.headerFontSize) {
        root.style.setProperty('--header-size', systemSettings.headerFontSize);
    } else {
        root.style.removeProperty('--header-size');
    }

    if (systemSettings.listFontFamily) {
        root.style.setProperty('--list-font', systemSettings.listFontFamily);
    } else {
        root.style.removeProperty('--list-font');
    }

    if (systemSettings.listFontSize) {
        root.style.setProperty('--list-size', systemSettings.listFontSize);
    } else {
        root.style.removeProperty('--list-size');
    }

  }, [
      systemSettings.fontFamily, 
      systemSettings.baseFontSize,
      systemSettings.headerFontFamily,
      systemSettings.headerFontSize,
      systemSettings.listFontFamily,
      systemSettings.listFontSize
  ]);

  // Sync selectedReport with reports to ensure realtime updates in modal
  useEffect(() => {
    if (selectedReport) {
        const updatedReport = reports.find(r => r.id === selectedReport.id);
        // Only update if reference changed (implies data update from Firestore)
        if (updatedReport && updatedReport !== selectedReport) {
            setSelectedReport(updatedReport);
        }
    }
  }, [reports, selectedReport]);

  // Derived State for Permission Checking
  const userPermissions = useMemo(() => {
    if (!currentUser) return { canCreate: false, canEdit: false, canDelete: false };
    const role = currentUser.role;
    const config = roleSettings[role]; // Config might be undefined if role deleted
    
    // Fallback if config missing
    if (!config) return { canCreate: false, canEdit: false, canDelete: false };

    return {
      canCreate: config.canCreate,
      canEdit: ([UserRole.Admin, UserRole.KyThuat, UserRole.CungUng, UserRole.SanXuat] as string[]).includes(role),
      canDelete: ([UserRole.Admin, UserRole.KyThuat] as string[]).includes(role),
    };
  }, [currentUser, roleSettings]);

  const canViewDashboard = useMemo(() => {
     if (!currentUser) return false;
     const config = roleSettings[currentUser.role];
     return config ? config.canViewDashboard : false;
  }, [currentUser, roleSettings]);
  
  const availableRoles = useMemo(() => {
      return Object.keys(roleSettings);
  }, [roleSettings]);

  // Filter Logic
  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (currentUser) {
        const config = roleSettings[currentUser.role];
        if (config && !config.viewableDefectTypes.includes('All')) {
            result = result.filter(r => config.viewableDefectTypes.includes(r.loaiLoi));
        }
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.maSanPham.toLowerCase().includes(lowerTerm) ||
          r.tenThuongMai.toLowerCase().includes(lowerTerm) ||
          r.dongSanPham.toLowerCase().includes(lowerTerm) ||
          r.nhaPhanPhoi.toLowerCase().includes(lowerTerm) ||
          r.donViSuDung.toLowerCase().includes(lowerTerm) ||
          r.soLo.toLowerCase().includes(lowerTerm) ||
          r.noiDungPhanAnh.toLowerCase().includes(lowerTerm) ||
          (r.nhanHang && r.nhanHang.toLowerCase().includes(lowerTerm))
      );
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Processing_Group') {
          // Group: Đang tiếp nhận, Đang xác minh, Đang xử lý
          result = result.filter(r => ['Đang tiếp nhận', 'Đang xác minh', 'Đang xử lý'].includes(r.trangThai));
      } else {
          result = result.filter((r) => r.trangThai === statusFilter);
      }
    }

    if (defectTypeFilter !== 'All') {
        result = result.filter((r) => r.loaiLoi === defectTypeFilter);
    }

    if (yearFilter !== 'All') {
        result = result.filter((r) => {
            if (!r.ngayPhanAnh) return false;
            const year = new Date(r.ngayPhanAnh).getFullYear().toString();
            return year === yearFilter;
        });
    }

    if (dateFilter.start) {
      result = result.filter((r) => r.ngayPhanAnh >= dateFilter.start);
    }

    if (dateFilter.end) {
      result = result.filter((r) => r.ngayPhanAnh <= dateFilter.end);
    }

    // Sorting Logic
    if (sortConfig.key) {
        result.sort((a, b) => {
            let aVal = (a as any)[sortConfig.key];
            let bVal = (b as any)[sortConfig.key];

            // Handle potential null/undefined
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            // String comparison
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [reports, searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter, currentUser, roleSettings, sortConfig]);

  const paginatedReports = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const summaryStats = useMemo(() => {
      // Calculate based on the CURRENT VIEW (respecting year/search filters) to be more dynamic
      // Or use the 'reports' base if we want global stats regardless of other filters.
      // Usually dashboard stats respect the global filters (Year).
      
      let baseData = reports;
      
      // Respect Year Filter for Summary
      if (yearFilter !== 'All') {
          baseData = baseData.filter((r) => {
            if (!r.ngayPhanAnh) return false;
            const year = new Date(r.ngayPhanAnh).getFullYear().toString();
            return year === yearFilter;
        });
      }

      return {
          total: baseData.length,
          moi: baseData.filter(r => r.trangThai === 'Mới').length,
          dangTiepNhan: baseData.filter(r => r.trangThai === 'Đang tiếp nhận').length,
          dangXacMinh: baseData.filter(r => r.trangThai === 'Đang xác minh').length,
          dangXuLy: baseData.filter(r => r.trangThai === 'Đang xử lý').length,
          chuaTimRaNguyenNhan: baseData.filter(r => r.trangThai === 'Chưa tìm ra nguyên nhân').length,
          hoanThanh: baseData.filter(r => r.trangThai === 'Hoàn thành').length,
      }
  }, [reports, yearFilter]);
  
  const availableYears = useMemo(() => {
      const years = new Set<string>();
      const cYear = new Date().getFullYear().toString();
      years.add(cYear);

      reports.forEach(r => {
          if(r.ngayPhanAnh) {
             const y = new Date(r.ngayPhanAnh).getFullYear().toString();
             years.add(y);
          }
      });

      return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [reports]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter]);

  // Handlers
  const handleLogin = async (user: User) => {
      login(user);
      setCurrentView('list'); 
  };

  const handleLogout = () => {
      logout();
      // Reset UI states
      setSelectedReport(null);
      setIsFormOpen(false);
      setIsUserModalOpen(false);
      setIsProductModalOpen(false);
      setIsPermissionModalOpen(false);
      setIsSystemSettingsModalOpen(false);
      setIsChatOpen(false);
      
      // Reset Filters to Default to prevent leakage to next user
      setCurrentPage(1);
      setSearchTerm('');
      setStatusFilter('All');
      setDefectTypeFilter('All');
      setYearFilter(new Date().getFullYear().toString());
      setDateFilter({ start: '', end: '' });
      setSortConfig({ key: 'ngayPhanAnh', direction: 'desc' });
  };

  // Memoized Handlers for List to avoid re-renders
  const handleSaveReportWrapper = async (report: DefectReport) => {
      const isEditing = !!editingReport && !editingReport.id.startsWith('new_');
      const success = await saveReport(report, isEditing);
      if (success) {
          setIsFormOpen(false);
          setEditingReport(null);
          setSelectedReport(null);
      }
  };

  const handleDeleteReportWrapper = useCallback(async (id: string) => {
      const success = await deleteReport(id);
      if (success) {
          setSelectedReport(prev => prev?.id === id ? null : prev);
      }
  }, [deleteReport]);

  const handleEditClick = (report: DefectReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
    setSelectedReport(null); 
  };

  const handleCreateClick = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleCloseDetailModal = useCallback(() => {
      setIsModalClosing(true);
      // Wait for animation to finish before unmounting
      setTimeout(() => {
          setSelectedReport(null);
          setIsModalClosing(false);
      }, 280); // Matches animation duration
  }, []);

  const handleDuplicateReport = useCallback((report: DefectReport) => {
      // Create a copy but reset status-related fields
      const duplicate: DefectReport = {
          ...report,
          id: `new_${Date.now()}`, // Temporary ID to indicate new
          ngayTao: new Date().toISOString(),
          ngayPhanAnh: new Date().toISOString().split('T')[0],
          trangThai: 'Mới',
          soLuongLoi: report.soLuongLoi, // Keep quantities as they might be similar
          soLuongDaNhap: report.soLuongDaNhap,
          soLuongDoi: 0,
          nguyenNhan: '',
          huongKhacPhuc: '',
          ngayHoanThanh: '',
          ngayDoiHang: '',
          images: [], // Reset images for new report
      };
      setEditingReport(duplicate);
      setIsFormOpen(true);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleSearchTermChange = useCallback((term: string) => startTransition(() => setSearchTerm(term)), []);
  const handleStatusFilterChange = useCallback((status: string) => startTransition(() => setStatusFilter(status)), []);
  const handleDefectTypeFilterChange = useCallback((type: string) => startTransition(() => setDefectTypeFilter(type)), []);
  const handleYearFilterChange = useCallback((year: string) => startTransition(() => setYearFilter(year)), []);
  const handleDateFilterChange = useCallback((dates: {start: string, end: string}) => startTransition(() => setDateFilter(dates)), []);
  
  const handleSort = useCallback((key: string) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  }, []);

  const handleDashboardFilterSelect = (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => {
      startTransition(() => {
          setYearFilter('All');
          if (filterType === 'search' && value) {
              setSearchTerm(value);
              setStatusFilter('All');
              setDefectTypeFilter('All');
              setCurrentView('list');
          } else if (filterType === 'all') {
              setStatusFilter('All');
              setDefectTypeFilter('All');
              setSearchTerm('');
              setCurrentView('list');
          } else if (filterType === 'status' && value) {
              setStatusFilter(value);
              setCurrentView('list');
          } else if (filterType === 'defectType' && value) {
              setDefectTypeFilter(value);
              setCurrentView('list');
          } else if (filterType === 'brand' && value) {
              setSearchTerm(value);
              setStatusFilter('All');
              setDefectTypeFilter('All');
              setCurrentView('list');
          }
      });
  };

  const handleExportData = () => {
    const dataToExport = filteredReports.map(r => ({
        'ID': r.id,
        'Ngày tạo': r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('en-GB') + ' ' + new Date(r.ngayTao).toLocaleTimeString('en-GB') : '',
        'Ngày phản ánh': new Date(r.ngayPhanAnh).toLocaleDateString('en-GB'),
        'Mã sản phẩm': r.maSanPham,
        'Dòng sản phẩm': r.dongSanPham,
        'Tên thương mại': r.tenThuongMai,
        'Nhãn hàng': r.nhanHang || '',
        'Nhà phân phối': r.nhaPhanPhoi,
        'Đơn vị sử dụng': r.donViSuDung,
        'Nội dung phản ánh': r.noiDungPhanAnh,
        'Số lô': r.soLo,
        'Mã ngày sản xuất': r.maNgaySanXuat,
        'Số lượng lỗi': r.soLuongLoi,
        'Số lượng đã nhập': r.soLuongDaNhap,
        'Số lượng đổi': r.soLuongDoi,
        'Nguyên nhân': r.nguyenNhan || '',
        'Hướng khắc phục': r.huongKhacPhuc || '',
        'Trạng thái': r.trangThai,
        'Ngày hoàn thành': r.ngayHoanThanh ? new Date(r.ngayHoanThanh).toLocaleDateString('en-GB') : '',
        'Loại lỗi': r.loaiLoi || ''
    }));
    const worksheet = xlsxLib.utils.json_to_sheet(dataToExport);
    const workbook = xlsxLib.utils.book_new();
    xlsxLib.utils.book_append_sheet(workbook, worksheet, "BaoCao");
    xlsxLib.writeFile(workbook, `bao_cao_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- Excel Import Logic ---
  const handleDownloadReportTemplate = () => {
      const templateData = [
          {
              "Ngày phản ánh": "2024-01-30",
              "Mã sản phẩm": "SP001",
              "Tên thương mại": "Kim lấy máu chân không",
              "Dòng sản phẩm": "Vật tư tiêu hao",
              "Nhãn hàng": "HTM",
              "Số lô": "LOT123",
              "Hạn dùng": "2026-01-01",
              "Nhà phân phối": "NPP A",
              "Đơn vị sử dụng": "Bệnh viện X",
              "Nội dung phản ánh": "Kim bị cong",
              "Số lượng lỗi": 10,
              "Số lượng đổi": 5,
              "Trạng thái": "Mới",
              "Loại lỗi": "Lỗi Sản xuất",
              "Nguyên nhân": "",
              "Biện pháp khắc phục": ""
          }
      ];
      const worksheet = xlsxLib.utils.json_to_sheet(templateData);
      const workbook = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(workbook, worksheet, "MauNhapLieu");
      xlsxLib.writeFile(workbook, "Mau_Nhap_Khieu_Nai.xlsx");
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const data = event.target?.result;
          if (!data || !(data instanceof ArrayBuffer)) return;

          try {
              const workbook = xlsxLib.read(new Uint8Array(data), { type: 'array' });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = xlsxLib.utils.sheet_to_json(worksheet);
              
              const newReports: DefectReport[] = [];
              const todayStr = new Date().toISOString();

              jsonData.forEach((row: any) => {
                  const getVal = (keys: string[]) => {
                      const key = Object.keys(row).find(k => keys.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
                      return key ? row[key] : '';
                  };

                  const maSanPham = getVal(['Mã sản phẩm', 'Ma SP']);
                  const ngayPhanAnhRaw = getVal(['Ngày phản ánh']);
                  
                  // Parse Excel Date (Serial number or string)
                  let ngayPhanAnh = new Date().toISOString().split('T')[0];
                  if (typeof ngayPhanAnhRaw === 'number') {
                      const date = new Date((ngayPhanAnhRaw - (25567 + 2)) * 86400 * 1000); // Adjust excel date
                      ngayPhanAnh = date.toISOString().split('T')[0];
                  } else if (typeof ngayPhanAnhRaw === 'string' && ngayPhanAnhRaw.includes('/')) {
                      // Try DD/MM/YYYY
                      const parts = ngayPhanAnhRaw.split('/');
                      if (parts.length === 3) ngayPhanAnh = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  } else if (ngayPhanAnhRaw) {
                      ngayPhanAnh = String(ngayPhanAnhRaw);
                  }

                  if (maSanPham) {
                      newReports.push({
                          id: '', // Will be generated in hook
                          ngayTao: todayStr,
                          ngayPhanAnh,
                          maSanPham: String(maSanPham).trim(),
                          tenThuongMai: String(getVal(['Tên thương mại', 'Ten thuong mai']) || ''),
                          dongSanPham: String(getVal(['Dòng sản phẩm', 'Dong san pham']) || ''),
                          nhanHang: (getVal(['Nhãn hàng', 'Brand']) || 'HTM') as any,
                          soLo: String(getVal(['Số lô', 'So lo']) || ''),
                          hanDung: getVal(['Hạn dùng']) ? String(getVal(['Hạn dùng'])) : '',
                          nhaPhanPhoi: String(getVal(['Nhà phân phối', 'NPP']) || ''),
                          donViSuDung: String(getVal(['Đơn vị sử dụng', 'Benh vien']) || ''),
                          noiDungPhanAnh: String(getVal(['Nội dung', 'Mo ta']) || ''),
                          soLuongLoi: Number(getVal(['Số lượng lỗi', 'SL loi']) || 0),
                          soLuongDaNhap: 0,
                          soLuongDoi: Number(getVal(['Số lượng đổi', 'SL doi']) || 0),
                          trangThai: (getVal(['Trạng thái', 'Status']) || 'Mới') as any,
                          loaiLoi: (getVal(['Loại lỗi', 'Nguyen nhan goc']) || '') as any,
                          nguyenNhan: String(getVal(['Nguyên nhân', 'Root cause']) || ''),
                          huongKhacPhuc: String(getVal(['Biện pháp', 'Khac phuc']) || ''),
                          maNgaySanXuat: '',
                          tenThietBi: '',
                          donViTinh: '',
                          images: [],
                          activityLog: []
                      });
                  }
              });

              if (newReports.length > 0) {
                  await importReports(newReports);
              } else {
                  showToast("Không tìm thấy dữ liệu hợp lệ trong file.", "error");
              }

          } catch (error) {
              console.error("Import error", error);
              showToast("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng.", "error");
          }
          
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsArrayBuffer(file);
  };

  if (!currentUser) {
      return (
        <Suspense fallback={<Loading />}>
             <Login 
                onLogin={handleLogin} 
                users={users} 
                settings={systemSettings}
             />
        </Suspense>
      );
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-100 text-slate-900 relative">
      <Header 
        currentUser={currentUser}
        systemSettings={systemSettings}
        isLoadingReports={isLoadingReports}
        canViewDashboard={canViewDashboard}
        currentView={currentView}
        setCurrentView={setCurrentView}
        yearFilter={yearFilter}
        setYearFilter={handleYearFilterChange}
        availableYears={availableYears}
        onExport={handleExportData}
        onImport={() => fileInputRef.current?.click()}
        onDownloadTemplate={handleDownloadReportTemplate}
        canImport={userPermissions.canCreate}
        onLogout={handleLogout}
        onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
        onOpenProductModal={() => setIsProductModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenSystemSettingsModal={() => setIsSystemSettingsModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isOffline={isOffline}
      />
      
      {/* Hidden File Input for Import */}
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileImport} 
          className="hidden" 
          accept=".xlsx, .xls" 
      />

      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<Loading />}>
            <div key={currentView} className="animate-zoom-in h-full flex flex-col origin-top">
                {currentView === 'list' || !canViewDashboard ? (
                     <DefectReportList
                        reports={paginatedReports}
                        totalReports={filteredReports.length}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        selectedReport={selectedReport}
                        onSelectReport={setSelectedReport}
                        onDelete={handleDeleteReportWrapper}
                        currentUserRole={currentUser.role}
                        currentUsername={currentUser.username} // Pass username for storage key
                        filters={{ searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter }}
                        onSearchTermChange={handleSearchTermChange}
                        onStatusFilterChange={handleStatusFilterChange}
                        onDefectTypeFilterChange={handleDefectTypeFilterChange}
                        onYearFilterChange={handleYearFilterChange}
                        onDateFilterChange={handleDateFilterChange}
                        summaryStats={summaryStats}
                        isLoading={isPending}
                        onExport={handleExportData}
                        onDuplicate={handleDuplicateReport}
                        baseFontSize={systemSettings.baseFontSize}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                ) : (
                    <DashboardReport 
                        reports={filteredReports} 
                        onFilterSelect={handleDashboardFilterSelect}
                        onSelectReport={setSelectedReport} 
                        onOpenAiAnalysis={() => setIsChatOpen(true)}
                    />
                )}
            </div>
        </Suspense>
      </main>

      {userPermissions.canCreate && <DraggableFAB onClick={handleCreateClick} />}

      <Suspense fallback={null}>
          {isChatOpen && (
              <ChatInterface 
                  onClose={() => setIsChatOpen(false)} 
                  data={filteredReports}
              />
          )}

          {selectedReport && (
            <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center sm:p-4">
               {/* Backdrop */}
               <div 
                  className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity ${isModalClosing ? 'animate-fade-out' : 'animate-backdrop-in'}`} 
                  onClick={handleCloseDetailModal}
               ></div>
               
               {/* Modal Card - WIDENED to max-w-7xl/95vw for better layout */}
               <div className={`relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-[95vw] xl:max-w-7xl bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-900/5 z-50 will-change-transform ${isModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
                  <DefectReportDetail
                    report={selectedReport}
                    onEdit={handleEditClick}
                    onUpdate={updateReport}
                    onDelete={handleDeleteReportWrapper}
                    permissions={userPermissions}
                    onClose={handleCloseDetailModal}
                    currentUserRole={currentUser.role}
                    currentUsername={currentUser.username}
                    onAddComment={addComment}
                  />
               </div>
            </div>
          )}

          {isFormOpen && (
            <DefectReportForm
              initialData={editingReport}
              onSave={handleSaveReportWrapper}
              onClose={() => { setIsFormOpen(false); setEditingReport(null); }}
              currentUserRole={currentUser.role}
              editableFields={(roleSettings[currentUser.role])?.editableFields || []}
              products={products}
            />
          )}
          
          {isProductModalOpen && (
              <ProductListModal 
                products={products} 
                onClose={() => setIsProductModalOpen(false)} 
                onImport={importProducts}
                onAdd={addProduct}
                onDelete={deleteProduct}
                onDeleteAll={deleteAllProducts}
                currentUserRole={currentUser.role}
              />
          )}

          {isUserModalOpen && (
              <UserManagementModal 
                users={users}
                onSaveUser={saveUser}
                onDeleteUser={deleteUser}
                onClose={() => setIsUserModalOpen(false)}
                availableRoles={availableRoles}
              />
          )}
          
          {isPermissionModalOpen && (
              <PermissionManagementModal
                roleSettings={roleSettings}
                onSave={saveRoleSettings}
                onRenameRole={renameRole}
                onClose={() => setIsPermissionModalOpen(false)}
              />
          )}

          {isSystemSettingsModalOpen && (
              <SystemSettingsModal
                currentSettings={systemSettings}
                onSave={saveSystemSettings}
                onClose={() => setIsSystemSettingsModalOpen(false)}
                isOffline={isOffline}
                connectionError={connectionError}
              />
          )}
      </Suspense>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
