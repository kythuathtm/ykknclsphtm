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

// Lazy load components
const DefectReportList = React.lazy(() => import('./components/DefectReportList'));
const DefectReportDetail = React.lazy(() => import('./components/DefectReportDetail'));
const DefectReportForm = React.lazy(() => import('./components/DefectReportForm'));
const ProductListModal = React.lazy(() => import('./components/ProductListModal'));
const UserManagementModal = React.lazy(() => import('./components/UserManagementModal'));
const PermissionManagementModal = React.lazy(() => import('./components/PermissionManagementModal'));
const Login = React.lazy(() => import('./components/Login'));
const DashboardReport = React.lazy(() => import('./components/DashboardReport'));
const SystemSettingsModal = React.lazy(() => import('./components/SystemSettingsModal'));

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
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
      <span className="mr-3 text-xl">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

// --- Draggable FAB Component ---
const DraggableFAB = ({ onClick }: { onClick: () => void }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const hasMovedRef = useRef(false);

    useEffect(() => {
        // Initialize position higher up on mobile to avoid pagination overlap
        const isMobile = window.innerWidth < 640;
        setPosition({ 
            x: window.innerWidth - 80, 
            y: window.innerHeight - (isMobile ? 140 : 100)
        });
        setIsInitialized(true);

        const handleResize = () => {
             const isMobile = window.innerWidth < 640;
             setPosition(prev => ({
                 x: Math.min(prev.x, window.innerWidth - 80),
                 y: Math.min(prev.y, window.innerHeight - (isMobile ? 140 : 80))
             }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        hasMovedRef.current = false;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        // Clamp within window
        const clampedX = Math.max(10, Math.min(window.innerWidth - 70, newX));
        const clampedY = Math.max(10, Math.min(window.innerHeight - 70, newY));

        // Check if moved significantly (threshold 5px)
        if (Math.abs(clampedX - position.x) > 2 || Math.abs(clampedY - position.y) > 2) {
            hasMovedRef.current = true;
        }

        setPosition({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (!hasMovedRef.current) {
            onClick();
        }
    };

    if (!isInitialized) return null;

    return (
        <button
            style={{ left: position.x, top: position.y, touchAction: 'none' }}
            className={`fixed z-40 p-4 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/40 hover:bg-blue-700 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center cursor-move group ${isDragging ? 'scale-110 cursor-grabbing shadow-2xl' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            title="Tạo mới (Kéo để di chuyển)"
        >
            <PlusIcon className="h-7 w-7 transition-transform group-hover:rotate-90" />
        </button>
    );
};

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
  const { reports, isLoadingReports, saveReport, deleteReport, updateReport } = useReports(showToast);
  const { products, addProduct, deleteProduct, deleteAllProducts, importProducts } = useProducts(showToast);
  const { roleSettings, systemSettings, saveRoleSettings, saveSystemSettings, renameRole } = useSettings(showToast);

  // UI State
  const [selectedReport, setSelectedReport] = useState<DefectReport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DefectReport | null>(null);
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState<'list' | 'dashboard'>('list');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
  
  const [isPending, startTransition] = useTransition();

  // Apply System Settings to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (systemSettings.fontFamily) {
        root.style.setProperty('font-family', systemSettings.fontFamily);
    }
    if (systemSettings.baseFontSize) {
        root.style.fontSize = systemSettings.baseFontSize;
    }
  }, [systemSettings.fontFamily, systemSettings.baseFontSize]);

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

  // Close menus on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
              setIsAdminMenuOpen(false);
          }
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setIsProfileMenuOpen(false);
          }
      };
      if (isAdminMenuOpen || isProfileMenuOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isAdminMenuOpen, isProfileMenuOpen]);

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
    let result = reports;

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
      result = result.filter((r) => r.trangThai === statusFilter);
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

    return result;
  }, [reports, searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter, currentUser, roleSettings]);

  const paginatedReports = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const summaryStats = useMemo(() => {
      return {
          total: filteredReports.length,
          moi: filteredReports.filter(r => r.trangThai === 'Mới').length,
          dangXuLy: filteredReports.filter(r => r.trangThai === 'Đang xử lý').length,
          chuaTimRaNguyenNhan: filteredReports.filter(r => r.trangThai === 'Chưa tìm ra nguyên nhân').length,
          hoanThanh: filteredReports.filter(r => r.trangThai === 'Hoàn thành').length,
      }
  }, [filteredReports]);
  
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
      setIsProfileMenuOpen(false);
      
      // Reset Filters to Default to prevent leakage to next user
      setCurrentPage(1);
      setSearchTerm('');
      setStatusFilter('All');
      setDefectTypeFilter('All');
      setYearFilter(new Date().getFullYear().toString());
      setDateFilter({ start: '', end: '' });
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
          }
      });
  };

  const getUserInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

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
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCao");
    XLSX.writeFile(workbook, `bao_cao_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      <header 
        className="backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 transition-all"
        style={{
            backgroundColor: systemSettings.headerBackgroundColor || 'rgba(255, 255, 255, 0.9)',
            color: systemSettings.headerTextColor || '#0f172a'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
               <BarChartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-sm sm:text-lg font-bold tracking-tight truncate hidden sm:block uppercase text-inherit">
              THEO DÕI LỖI SẢN PHẨM
            </h1>
            {isLoadingReports && <span className="text-xs text-blue-500 animate-pulse ml-2">● Đồng bộ...</span>}
          </div>

          {canViewDashboard && (
             <div className="flex items-center gap-1 sm:gap-2">
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 py-1.5 flex items-center active:scale-95 transition-transform">
                    <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 mr-1 sm:mr-2 opacity-80" />
                    <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline opacity-80">Năm:</span>
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="text-xs sm:text-sm font-bold text-blue-600 bg-transparent focus:outline-none cursor-pointer hover:text-blue-700"
                    >
                        <option value="All">Tất cả</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
                 {/* FIX: Removed 'hidden md:flex' to show on mobile */}
                 <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${currentView === 'list' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Danh sách"
                    >
                        <ListBulletIcon className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Danh sách</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Báo cáo"
                    >
                        <ChartPieIcon className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Báo cáo</span>
                    </button>
                </div>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
                {currentView === 'list' && (
                    <button onClick={handleExportData} className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center" title="Xuất Excel">
                        <ArrowDownTrayIcon className="h-5 w-5 sm:mr-2 text-slate-500" /><span className="hidden sm:inline">Xuất</span>
                    </button>
                )}
                {currentUser.role === UserRole.Admin && (
                    <div className="relative" ref={adminMenuRef}>
                        <button onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border active:scale-95 ${isAdminMenuOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:text-blue-600 opacity-80 hover:opacity-100'}`}>
                            <Cog8ToothIcon className={`h-5 w-5 ${isAdminMenuOpen ? 'animate-spin-slow' : ''}`} /><span className="hidden sm:inline text-sm font-bold">Cài đặt</span>
                        </button>
                        {isAdminMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up origin-top-right text-slate-900">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quản trị hệ thống</p></div>
                                <button onClick={() => { setIsPermissionModalOpen(true); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><ShieldCheckIcon className="h-5 w-5 mr-3 text-slate-400" />Phân quyền</button>
                                <button onClick={() => { setIsProductModalOpen(true); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><TableCellsIcon className="h-5 w-5 mr-3 text-slate-400" />Danh sách sản phẩm</button>
                                <button onClick={() => { setIsUserModalOpen(true); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><UserGroupIcon className="h-5 w-5 mr-3 text-slate-400" />Quản lý người dùng</button>
                                <button onClick={() => { setIsSystemSettingsModalOpen(true); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><Cog8ToothIcon className="h-5 w-5 mr-3 text-slate-400" />Cấu hình / Cài đặt web</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="relative ml-1" ref={profileMenuRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="focus:outline-none transition-transform active:scale-95" title="Thông tin tài khoản">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md border-2 border-white ring-2 ring-transparent hover:ring-blue-200 transition-all text-sm">{getUserInitials(currentUser.fullName || currentUser.username)}</div>
                </button>
                {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up origin-top-right text-slate-900">
                        <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-sm font-bold text-slate-800 capitalize truncate">{currentUser.fullName || currentUser.username}</p>
                            <p className="text-xs font-normal text-slate-500 mt-0.5">{currentUser.role}</p>
                        </div>
                        <div className="py-1">
                            <button onClick={handleLogout} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"><ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />Đăng xuất</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<Loading />}>
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
                />
            ) : (
                <DashboardReport 
                    reports={filteredReports} 
                    onFilterSelect={handleDashboardFilterSelect}
                    onSelectReport={setSelectedReport} 
                />
            )}
        </Suspense>
      </main>

      {userPermissions.canCreate && <DraggableFAB onClick={handleCreateClick} />}

      <Suspense fallback={null}>
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center sm:p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedReport(null)}></div>
               <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up ring-1 ring-slate-900/5 z-50">
                  <DefectReportDetail
                    report={selectedReport}
                    onEdit={handleEditClick}
                    onUpdate={updateReport}
                    onDelete={handleDeleteReportWrapper}
                    permissions={userPermissions}
                    onClose={() => setSelectedReport(null)}
                    currentUserRole={currentUser.role}
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
              />
          )}
      </Suspense>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};