
import React, { useState, useMemo, useEffect, useTransition, Suspense, useRef, useCallback } from 'react';
import { DefectReport, UserRole, ToastType, User, RoleSettings, PermissionField, SystemSettings, Product } from './types';
import { PlusIcon, BarChartIcon, ArrowDownTrayIcon, ListBulletIcon, ArrowRightOnRectangleIcon, UserGroupIcon, ChartPieIcon, TableCellsIcon, ShieldCheckIcon, CalendarIcon, Cog8ToothIcon, EllipsisHorizontalIcon } from './components/Icons';
import * as XLSX from 'xlsx';
import Loading from './components/Loading';

// Hooks Imports
import { useAuth } from './hooks/useAuth';
import { useReports } from './hooks/useReports';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers'; // Import new hook
import { useSettings } from './hooks/useSettings';

// Component Imports
import { Header } from './components/Header';
import DraggableFAB from './components/DraggableFAB';

// Lazy load components
const DefectReportList = React.lazy(() => import('./components/DefectReportList') as Promise<{ default: React.ComponentType<any> }>);
const DefectReportDetail = React.lazy(() => import('./components/DefectReportDetail'));
const DefectReportForm = React.lazy(() => import('./components/DefectReportForm'));
const ProductListModal = React.lazy(() => import('./components/ProductListModal'));
const CustomerListModal = React.lazy(() => import('./components/CustomerListModal')); // Import new modal
const UserManagementModal = React.lazy(() => import('./components/UserManagementModal'));
const PermissionManagementModal = React.lazy(() => import('./components/PermissionManagementModal'));
const Login = React.lazy(() => import('./components/Login') as Promise<{ default: React.ComponentType<any> }>);
const DashboardReport = React.lazy(() => import('./components/DashboardReport') as Promise<{ default: React.ComponentType<any> }>);
const SystemSettingsModal = React.lazy(() => import('./components/SystemSettingsModal'));
const ChatInterface = React.lazy(() => import('./components/ChatInterface'));
const UserProfileModal = React.lazy(() => import('./components/UserProfileModal'));

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
    success: { bg: 'bg-green-500/90 backdrop-blur-sm', icon: '✅' },
    error: { bg: 'bg-red-500/90 backdrop-blur-sm', icon: '❌' },
    info: { bg: 'bg-blue-500/90 backdrop-blur-sm', icon: 'ℹ️' },
  };

  const { bg, icon } = config[type];

  return (
    <div className={`fixed bottom-5 right-5 ${bg} text-white py-3 px-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 flex items-center z-[60] animate-fade-in-up`}>
      <span className="mr-3 text-xl">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

const xlsxLib = (XLSX as any).default ?? XLSX;

const getProcessingDays = (startDate: string, endDate?: string) => {
    if (!startDate) return 0;
    try {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch { return 0; }
};

// Helper for date formatting in export (DD/MM/YYYY)
const formatDateForExport = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch (e) { return dateStr || ''; }
};

export const App: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const { currentUser, users, login, logout, saveUser, deleteUser } = useAuth(showToast);
  const { reports, isLoadingReports, saveReport, deleteReport, updateReport, addComment, importReports } = useReports(showToast);
  const { products, addProduct, deleteProduct, deleteAllProducts, importProducts } = useProducts(showToast);
  const { customers, addCustomer, updateCustomer, deleteCustomer, deleteAllCustomers, importCustomers } = useCustomers(showToast); // Use new hook and update function
  const { roleSettings, systemSettings, saveRoleSettings, saveSystemSettings, renameRole, isOffline, connectionError } = useSettings(showToast);

  const [selectedReport, setSelectedReport] = useState<DefectReport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DefectReport | null>(null);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false); // New state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState<'list' | 'dashboard'>('list');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Performance: Debounced search
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [defectTypeFilter, setDefectTypeFilter] = useState('All');
  
  const currentYear = new Date().getFullYear().toString();
  const [yearFilter, setYearFilter] = useState(currentYear); 
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
      key: 'ngayPhanAnh', 
      direction: 'desc' 
  });

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevUsernameRef = useRef<string | null>(null);

  // Performance: Debounce Search Term
  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearchTerm(searchTerm);
      }, 300); // Wait 300ms after user stops typing
      return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const root = document.documentElement;
    
    if (systemSettings.fontFamily) {
        root.style.setProperty('font-family', systemSettings.fontFamily);
    }
    if (systemSettings.baseFontSize) {
        root.style.fontSize = systemSettings.baseFontSize;
    }

    if (systemSettings.headerFontFamily) root.style.setProperty('--header-font', systemSettings.headerFontFamily);
    else root.style.removeProperty('--header-font');

    if (systemSettings.headerFontSize) root.style.setProperty('--header-size', systemSettings.headerFontSize);
    else root.style.removeProperty('--header-size');

    if (systemSettings.listFontFamily) root.style.setProperty('--list-font', systemSettings.listFontFamily);
    else root.style.removeProperty('--list-font');

    if (systemSettings.listFontSize) root.style.setProperty('--list-size', systemSettings.listFontSize);
    else root.style.removeProperty('--list-size');

    if (systemSettings.dashboardFontFamily) root.style.setProperty('--dashboard-font', systemSettings.dashboardFontFamily);
    else root.style.removeProperty('--dashboard-font');

    if (systemSettings.dashboardFontSize) root.style.setProperty('--dashboard-size', systemSettings.dashboardFontSize);
    else root.style.removeProperty('--dashboard-size');

  }, [
      systemSettings.fontFamily, 
      systemSettings.baseFontSize,
      systemSettings.headerFontFamily,
      systemSettings.headerFontSize,
      systemSettings.listFontFamily,
      systemSettings.listFontSize,
      systemSettings.dashboardFontFamily,
      systemSettings.dashboardFontSize
  ]);

  useEffect(() => {
    if (selectedReport) {
        const updatedReport = reports.find(r => r.id === selectedReport.id);
        if (updatedReport && updatedReport !== selectedReport) {
            setSelectedReport(updatedReport);
        }
    }
  }, [reports, selectedReport]);

  const userPermissions = useMemo(() => {
    if (!currentUser) return { canCreate: false, canEdit: false, canDelete: false };
    const role = currentUser.role;
    const config = roleSettings[role];
    
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

  useEffect(() => {
      // Logic to set default view ONLY when user logs in or switches user
      // Prevents resetting to dashboard when user profile updates in background
      if (currentUser && currentUser.username !== prevUsernameRef.current) {
          if (canViewDashboard) {
              setCurrentView('dashboard');
          } else {
              setCurrentView('list');
          }
          prevUsernameRef.current = currentUser.username;
      } else if (!currentUser) {
          prevUsernameRef.current = null;
      }

      // Ensure that if user loses dashboard permission while on dashboard, they are redirected
      if (currentUser && currentView === 'dashboard' && !canViewDashboard) {
          setCurrentView('list');
      }
  }, [currentUser, canViewDashboard, currentView]);

  const dashboardReports = useMemo(() => {
    let result = [...reports];

    if (currentUser) {
        const config = roleSettings[currentUser.role];
        if (!config) {
            result = [];
        }
        else if (!config.viewableDefectTypes.includes('All')) {
            result = result.filter(r => config.viewableDefectTypes.includes(r.loaiLoi));
        }
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
  }, [reports, yearFilter, dateFilter, currentUser, roleSettings]);

  const filteredReports = useMemo(() => {
    let result = [...dashboardReports];

    if (debouncedSearchTerm) {
      const terms = debouncedSearchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      
      result = result.filter((r) => {
          const searchableText = [
              r.maSanPham,
              r.tenThuongMai,
              r.dongSanPham,
              r.nhaPhanPhoi,
              r.donViSuDung,
              r.soLo,
              r.noiDungPhanAnh,
              r.nhanHang
          ].join(' ').toLowerCase();

          return terms.every(term => searchableText.includes(term));
      });
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Processing_Group') {
          result = result.filter(r => ['Đang tiếp nhận', 'Đang xác minh', 'Đang xử lý'].includes(r.trangThai));
      } else {
          result = result.filter((r) => r.trangThai === statusFilter);
      }
    }

    if (defectTypeFilter !== 'All') {
        result = result.filter((r) => r.loaiLoi === defectTypeFilter);
    }

    if (isOverdueFilter) {
        result = result.filter(r => {
            if (r.trangThai === 'Hoàn thành') return false;
            return getProcessingDays(r.ngayPhanAnh) > 7;
        });
    }

    return result;
  }, [dashboardReports, debouncedSearchTerm, statusFilter, defectTypeFilter, isOverdueFilter]);

  const sortedReports = useMemo(() => {
      let sortableItems = [...filteredReports];
      if (sortConfig.key) {
          sortableItems.sort((a, b) => {
              // @ts-ignore
              let aValue = a[sortConfig.key];
              // @ts-ignore
              let bValue = b[sortConfig.key];
              
              if (sortConfig.key === 'duration') {
                  aValue = getProcessingDays(a.ngayPhanAnh, a.ngayHoanThanh);
                  bValue = getProcessingDays(b.ngayPhanAnh, b.ngayHoanThanh);
              }
              
              if (aValue < bValue) {
                  return sortConfig.direction === 'asc' ? -1 : 1;
              }
              if (aValue > bValue) {
                  return sortConfig.direction === 'asc' ? 1 : -1;
              }
              return 0;
          });
      }
      return sortableItems;
  }, [filteredReports, sortConfig]);

  const currentReports = useMemo(() => {
      const firstPageIndex = (currentPage - 1) * itemsPerPage;
      const lastPageIndex = firstPageIndex + itemsPerPage;
      return sortedReports.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, itemsPerPage, sortedReports]);

  const summaryStats = useMemo(() => {
      const total = dashboardReports.length;
      const moi = dashboardReports.filter(r => r.trangThai === 'Mới').length;
      const dangTiepNhan = dashboardReports.filter(r => r.trangThai === 'Đang tiếp nhận').length;
      const dangXacMinh = dashboardReports.filter(r => r.trangThai === 'Đang xác minh').length;
      const dangXuLy = dashboardReports.filter(r => r.trangThai === 'Đang xử lý').length;
      const chuaTimRaNguyenNhan = dashboardReports.filter(r => r.trangThai === 'Chưa tìm ra nguyên nhân').length;
      const hoanThanh = dashboardReports.filter(r => r.trangThai === 'Hoàn thành').length;
      
      return { total, moi, dangTiepNhan, dangXacMinh, dangXuLy, chuaTimRaNguyenNhan, hoanThanh };
  }, [dashboardReports]);

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#003DA5] selection:text-white overflow-hidden flex flex-col relative">
        
        {systemSettings.backgroundType !== 'default' && (
            <div className="absolute inset-0 z-0 pointer-events-none">
                {systemSettings.backgroundType === 'image' && systemSettings.backgroundValue && (
                    <>
                        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${systemSettings.backgroundValue})` }}></div>
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                    </>
                )}
                {systemSettings.backgroundType === 'color' && systemSettings.backgroundValue && (
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: systemSettings.backgroundValue }}></div>
                )}
            </div>
        )}

        <Suspense fallback={<Loading />}>
            {!currentUser ? (
                <Login onLogin={login} users={users} settings={systemSettings} />
            ) : (
                <div className="flex flex-col h-full w-full animate-fade-in">
                    <Header 
                        currentUser={currentUser}
                        systemSettings={systemSettings}
                        isLoadingReports={isLoadingReports}
                        canViewDashboard={canViewDashboard}
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        yearFilter={yearFilter}
                        setYearFilter={setYearFilter}
                        availableYears={['2023', '2024', '2025']}
                        onExport={() => {
                            const exportData = filteredReports.map(r => ({
                                "Mã phiếu": r.id,
                                "Ngày phản ánh": formatDateForExport(r.ngayPhanAnh),
                                "Trạng thái": r.trangThai,
                                "Mã SP": r.maSanPham,
                                "Tên thương mại": r.tenThuongMai,
                                "Tên thiết bị": r.tenThietBi,
                                "Dòng SP": r.dongSanPham,
                                "Nhãn hàng": r.nhanHang,
                                "Số lô": r.soLo,
                                "Hạn dùng": formatDateForExport(r.hanDung),
                                "ĐVT": r.donViTinh,
                                "Nhà phân phối": r.nhaPhanPhoi,
                                "Đơn vị sử dụng": r.donViSuDung,
                                "Nội dung phản ánh": r.noiDungPhanAnh,
                                "Nguyên nhân": r.nguyenNhan,
                                "Hướng khắc phục": r.huongKhacPhuc,
                                "SL Lỗi": r.soLuongLoi,
                                "SL Đổi": r.soLuongDoi,
                                "Ngày đổi": formatDateForExport(r.ngayDoiHang),
                                "Mã vận đơn": r.maVanDon,
                                "Ngày hoàn thành": formatDateForExport(r.ngayHoanThanh),
                                "Nguồn gốc lỗi": r.loaiLoi,
                                "Mức độ ưu tiên": r.mucDoUuTien
                            }));
                            const ws = xlsxLib.utils.json_to_sheet(exportData);
                            const wb = xlsxLib.utils.book_new();
                            xlsxLib.utils.book_append_sheet(wb, ws, "DanhSachKhieuNai");
                            xlsxLib.writeFile(wb, "DanhSachKhieuNai.xlsx");
                        }}
                        onImport={() => fileInputRef.current?.click()}
                        onDownloadTemplate={() => {/* Implement template */}}
                        canImport={userPermissions.canCreate}
                        onLogout={logout}
                        onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
                        onOpenProductModal={() => setIsProductModalOpen(true)}
                        onOpenCustomerModal={() => setIsCustomerModalOpen(true)} // Open customer modal
                        onOpenUserModal={() => setIsUserModalOpen(true)}
                        onOpenSystemSettingsModal={() => setIsSystemSettingsModalOpen(true)}
                        onOpenProfileModal={() => setIsProfileModalOpen(true)}
                        onToggleChat={() => setIsChatOpen(!isChatOpen)}
                        isOffline={isOffline}
                        reports={reports}
                    />
                    
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            const data = e.target?.result;
                            if (data) {
                                const workbook = xlsxLib.read(data, { type: 'binary' });
                                const sheetName = workbook.SheetNames[0];
                                const sheet = workbook.Sheets[sheetName];
                                const json = xlsxLib.utils.sheet_to_json(sheet);
                                importReports(json as DefectReport[]);
                            }
                        };
                        reader.readAsBinaryString(file);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }} />

                    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
                        {/* Using key to force remount and trigger animation on view switch */}
                        <div key={currentView} className="h-full w-full view-transition-enter">
                            {currentView === 'dashboard' && canViewDashboard ? (
                                <DashboardReport 
                                    reports={dashboardReports}
                                    onFilterSelect={(type, val) => {
                                        if(type === 'status' && val) setStatusFilter(val);
                                        if(type === 'defectType' && val) setDefectTypeFilter(val);
                                        if(type === 'month' && val) { /* handle month filter */ }
                                        if(type === 'all') { setStatusFilter('All'); setDefectTypeFilter('All'); setSearchTerm(''); }
                                        if(type === 'overdue') setIsOverdueFilter(true);
                                        setCurrentView('list');
                                    }}
                                    onSelectReport={setSelectedReport}
                                    onOpenAiAnalysis={() => setIsChatOpen(true)}
                                    isLoading={isLoadingReports}
                                    currentUser={currentUser}
                                    systemSettings={systemSettings}
                                />
                            ) : (
                                <DefectReportList 
                                    reports={currentReports}
                                    totalReports={filteredReports.length}
                                    currentPage={currentPage}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={setItemsPerPage}
                                    selectedReport={selectedReport}
                                    onSelectReport={setSelectedReport}
                                    onDelete={deleteReport}
                                    currentUserRole={currentUser.role}
                                    currentUsername={currentUser.username}
                                    filters={{ searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter, isOverdue: isOverdueFilter }}
                                    onSearchTermChange={setSearchTerm}
                                    onStatusFilterChange={setStatusFilter}
                                    onDefectTypeFilterChange={setDefectTypeFilter}
                                    onYearFilterChange={setYearFilter}
                                    onDateFilterChange={setDateFilter}
                                    onOverdueFilterChange={setIsOverdueFilter}
                                    summaryStats={summaryStats}
                                    isLoading={isLoadingReports}
                                    onExport={() => {
                                        const exportData = filteredReports.map(r => ({
                                            "Mã phiếu": r.id,
                                            "Ngày phản ánh": formatDateForExport(r.ngayPhanAnh),
                                            "Trạng thái": r.trangThai,
                                            "Mã SP": r.maSanPham,
                                            "Tên thương mại": r.tenThuongMai,
                                            "Tên thiết bị": r.tenThietBi,
                                            "Dòng SP": r.dongSanPham,
                                            "Nhãn hàng": r.nhanHang,
                                            "Số lô": r.soLo,
                                            "Hạn dùng": formatDateForExport(r.hanDung),
                                            "ĐVT": r.donViTinh,
                                            "Nhà phân phối": r.nhaPhanPhoi,
                                            "Đơn vị sử dụng": r.donViSuDung,
                                            "Nội dung phản ánh": r.noiDungPhanAnh,
                                            "Nguyên nhân": r.nguyenNhan,
                                            "Hướng khắc phục": r.huongKhacPhuc,
                                            "SL Lỗi": r.soLuongLoi,
                                            "SL Đổi": r.soLuongDoi,
                                            "Ngày đổi": formatDateForExport(r.ngayDoiHang),
                                            "Mã vận đơn": r.maVanDon,
                                            "Ngày hoàn thành": formatDateForExport(r.ngayHoanThanh),
                                            "Nguồn gốc lỗi": r.loaiLoi,
                                            "Mức độ ưu tiên": r.mucDoUuTien
                                        }));
                                        const ws = xlsxLib.utils.json_to_sheet(exportData);
                                        const wb = xlsxLib.utils.book_new();
                                        xlsxLib.utils.book_append_sheet(wb, ws, "DanhSachKhieuNai");
                                        xlsxLib.writeFile(wb, "DanhSachKhieuNai.xlsx");
                                    }}
                                    onDuplicate={(r) => { 
                                        const { id, ...rest } = r;
                                        setEditingReport({ ...rest, id: `new_${Date.now()}` } as DefectReport);
                                        setIsFormOpen(true);
                                    }}
                                    sortConfig={sortConfig}
                                    onSort={(key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                />
                            )}
                        </div>
                    </main>

                    {selectedReport && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedReport(null)}></div>
                            <div className="w-full max-w-5xl h-full max-h-[95vh] bg-white shadow-2xl pointer-events-auto animate-dialog-enter overflow-hidden flex flex-col rounded-2xl ring-1 ring-white/20">
                                <DefectReportDetail 
                                    report={selectedReport}
                                    onEdit={(r) => { setSelectedReport(null); setEditingReport(r); setIsFormOpen(true); }}
                                    onUpdate={updateReport}
                                    onDelete={(id) => { deleteReport(id); setSelectedReport(null); }}
                                    permissions={userPermissions}
                                    onClose={() => setSelectedReport(null)}
                                    currentUserRole={currentUser.role as UserRole}
                                    currentUsername={currentUser.username}
                                    onAddComment={addComment}
                                />
                            </div>
                        </div>
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

                    {/* Customer Modal */}
                    {isCustomerModalOpen && (
                        <CustomerListModal 
                            customers={customers}
                            onClose={() => setIsCustomerModalOpen(false)}
                            onImport={importCustomers}
                            onAdd={addCustomer}
                            onEdit={updateCustomer} // Pass the update function
                            onDelete={deleteCustomer}
                            onDeleteAll={deleteAllCustomers}
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

                    {isProfileModalOpen && (
                        <UserProfileModal 
                            currentUser={currentUser}
                            onSave={(u) => saveUser(u, true)}
                            onClose={() => setIsProfileModalOpen(false)}
                        />
                    )}

                    {isFormOpen && (
                        <DefectReportForm 
                            initialData={editingReport}
                            onSave={(r) => { saveReport(r, !!editingReport); setIsFormOpen(false); setEditingReport(null); }}
                            onClose={() => { setIsFormOpen(false); setEditingReport(null); }}
                            currentUserRole={currentUser.role as UserRole}
                            editableFields={roleSettings[currentUser.role]?.editableFields || []}
                            products={products}
                            customers={customers} // Pass customers
                        />
                    )}

                    {isChatOpen && (
                        <ChatInterface 
                            onClose={() => setIsChatOpen(false)}
                            data={filteredReports}
                        />
                    )}

                    <div className="sm:hidden">
                        <DraggableFAB onClick={() => { setEditingReport(null); setIsFormOpen(true); }} />
                    </div>
                </div>
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </Suspense>
    </div>
  );
};
