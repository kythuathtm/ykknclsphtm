
import React, { useState, useMemo, useEffect, useTransition, Suspense } from 'react';
import { DefectReport, UserRole, ToastType, PermissionField } from './types';
import { PlusIcon, BarChartIcon, ArrowDownTrayIcon, ListBulletIcon, ArrowRightOnRectangleIcon, UserGroupIcon, ChartPieIcon, TableCellsIcon, ShieldCheckIcon, CalendarIcon, Cog8ToothIcon } from './components/Icons';
import * as XLSX from 'xlsx';
import Loading from './components/Loading';

// Custom Hooks
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
    <div className={`fixed bottom-5 right-5 ${bg} text-white py-3 px-5 rounded-xl shadow-2xl flex items-center z-50 animate-fade-in-up`}>
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

// --- Main App Component ---

export const App: React.FC = () => {
  // Global Toast Handler
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  // --- Using Custom Hooks ---
  const { currentUser, users, login, logout, saveUser, deleteUser } = useAuth(showToast);
  const { reports, isLoadingReports, saveReport, deleteReport } = useReports(showToast);
  const { products, addProduct, deleteProduct, deleteAllProducts, importProducts } = useProducts(showToast);
  const { roleSettings, systemSettings, saveRoleSettings, saveSystemSettings, renameRole } = useSettings(showToast);

  // UI State
  const [selectedReport, setSelectedReport] = useState<DefectReport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DefectReport | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'dashboard'>('list');

  // Filters & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [defectTypeFilter, setDefectTypeFilter] = useState('All');
  
  // Initialize Year Filter to Current Year
  const currentYear = new Date().getFullYear().toString();
  const [yearFilter, setYearFilter] = useState(currentYear); 
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isPending, startTransition] = useTransition();

  // Safety loading
  const isLoadingDB = isLoadingReports; // simplified global loading

  // Derived State for Permission Checking
  const userPermissions = useMemo(() => {
    if (!currentUser) return { canCreate: false, canEdit: false, canDelete: false };
    const role = currentUser.role;
    // @ts-ignore
    const config = roleSettings[role]; 
    
    if (!config) {
        return { canCreate: false, canEdit: false, canDelete: false };
    }

    return {
      canCreate: config.canCreate,
      canEdit: ([UserRole.Admin, UserRole.KyThuat, UserRole.CungUng, UserRole.SanXuat] as string[]).includes(role),
      canDelete: ([UserRole.Admin, UserRole.KyThuat] as string[]).includes(role),
    };
  }, [currentUser, roleSettings]);

  const canViewDashboard = useMemo(() => {
     if (!currentUser) return false;
     // @ts-ignore
     const config = roleSettings[currentUser.role];
     return config ? config.canViewDashboard : false;
  }, [currentUser, roleSettings]);
  
  const availableRoles = useMemo(() => Object.keys(roleSettings), [roleSettings]);

  // Filter Logic
  const filteredReports = useMemo(() => {
    let result = reports;

    if (currentUser) {
        // @ts-ignore
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
             years.add(new Date(r.ngayPhanAnh).getFullYear().toString());
          }
      });
      return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [reports]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter]);

  // Actions Handlers

  const onLogin = (user: any) => {
      login(user);
      setCurrentView('list');
  };

  const onLogout = () => {
      logout();
      setSelectedReport(null);
      setIsFormOpen(false);
      setIsUserModalOpen(false);
      setIsProductModalOpen(false);
      setIsPermissionModalOpen(false);
      setIsSystemSettingsModalOpen(false);
  };

  const onSaveReport = async (report: DefectReport) => {
      const success = await saveReport(report, !!(editingReport && report.id && !report.id.startsWith('new_')));
      if(success) {
          setIsFormOpen(false);
          setEditingReport(null);
          setSelectedReport(null);
      }
  };
  
  const onDeleteReport = async (id: string) => {
      const success = await deleteReport(id);
      if(success && selectedReport?.id === id) setSelectedReport(null);
  };

  const handleEditClick = (report: DefectReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
    setSelectedReport(null); 
  };
  
  const handleDuplicateReport = (report: DefectReport) => {
      const duplicatedReport: DefectReport = {
          ...report,
          id: 'new_' + Date.now(), 
          ngayTao: new Date().toISOString(),
          ngayPhanAnh: new Date().toISOString().split('T')[0],
          trangThai: 'Mới',
          ngayHoanThanh: '',
          soLuongDoi: 0,
          nguyenNhan: '',
          huongKhacPhuc: '',
      };
      setEditingReport(duplicatedReport);
      setIsFormOpen(true);
      showToast('Đã sao chép thông tin vào form tạo mới.', 'info');
  };

  const handleCreateClick = () => {
    setEditingReport(null);
    setIsFormOpen(true);
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
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCao");
    const fileName = `bao_cao_san_pham_loi_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  const handleImportProductsCallback = async (newProducts: any[]) => {
      const success = await importProducts(newProducts);
      if(success) setIsProductModalOpen(false);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSearchTermChange = (term: string) => startTransition(() => setSearchTerm(term));
  const handleStatusFilterChange = (status: string) => startTransition(() => setStatusFilter(status));
  const handleDefectTypeFilterChange = (type: string) => startTransition(() => setDefectTypeFilter(type));
  const handleYearFilterChange = (year: string) => startTransition(() => setYearFilter(year));
  const handleDateFilterChange = (dates: {start: string, end: string}) => startTransition(() => setDateFilter(dates));
  
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

  if (!currentUser) {
      return (
        <Suspense fallback={<Loading />}>
             <Login 
                onLogin={onLogin} 
                users={users} 
                settings={systemSettings}
             />
        </Suspense>
      );
  }

  // @ts-ignore
  const userRoleConfig = roleSettings[currentUser.role];

  return (
    <div className="flex flex-col h-dvh bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 transition-all">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
               <BarChartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-sm sm:text-lg font-bold text-slate-800 tracking-tight truncate hidden sm:block uppercase">
              THEO DÕI LỖI SẢN PHẨM
            </h1>
            {isLoadingDB && <span className="text-xs text-blue-500 animate-pulse ml-2">● Đồng bộ...</span>}
          </div>

          {canViewDashboard && (
             <div className="flex items-center gap-1 sm:gap-2">
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 py-1.5 flex items-center active:scale-95 transition-transform">
                    <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 mr-1 sm:mr-2" />
                    <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Năm:</span>
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="text-xs sm:text-sm font-bold text-blue-600 bg-transparent focus:outline-none cursor-pointer hover:text-blue-700"
                    >
                        <option value="All">Tất cả</option>
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                 </div>

                 <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50 hidden md:flex">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${
                            currentView === 'list' 
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                        title="Xem danh sách báo cáo"
                    >
                        <ListBulletIcon className="h-4 w-4 mr-2" />
                        Danh sách
                    </button>
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${
                            currentView === 'dashboard' 
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                        title="Xem báo cáo thống kê"
                    >
                        <ChartPieIcon className="h-4 w-4 mr-2" />
                        Báo cáo
                    </button>
                </div>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-3">
            {userPermissions.canCreate && (
              <button
                onClick={handleCreateClick}
                className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                <span className="hidden sm:inline">Tạo mới</span>
              </button>
            )}

            <div className="flex items-center gap-1">
                {currentView === 'list' && (
                    <button
                    onClick={handleExportData}
                    className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center"
                    title="Xuất Excel"
                    >
                    <ArrowDownTrayIcon className="h-5 w-5 sm:mr-2 text-slate-500" />
                    <span className="hidden sm:inline">Xuất</span>
                    </button>
                )}

                {currentUser.role === UserRole.Admin && (
                    <div className="flex items-center gap-1">
                         <button
                            onClick={() => setIsPermissionModalOpen(true)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                            title="Cấu hình phân quyền"
                        >
                            <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button
                            onClick={() => setIsProductModalOpen(true)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                            title="Danh sách Sản phẩm"
                        >
                            <TableCellsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                            title="Quản lý Người dùng"
                        >
                            <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                         <button 
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                            onClick={() => setIsSystemSettingsModalOpen(true)}
                            title="Cấu hình / Cài đặt web"
                        >
                             <Cog8ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                )}
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-2 sm:gap-3 pl-1">
                <div className="text-right hidden md:block leading-tight">
                    {currentUser.role !== UserRole.Admin && (
                        <div className="text-sm font-bold text-slate-800">{currentUser.fullName || currentUser.username}</div>
                    )}
                    <div className={`text-xs font-medium ${currentUser.role === UserRole.Admin ? 'text-slate-800 font-bold text-sm' : 'text-slate-500'}`}>
                        {currentUser.role}
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100 active:scale-95"
                    title="Đăng xuất"
                >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                    onDelete={onDeleteReport}
                    currentUserRole={currentUser.role}
                    filters={{ searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter }}
                    onSearchTermChange={handleSearchTermChange}
                    onStatusFilterChange={handleStatusFilterChange}
                    onDefectTypeFilterChange={handleDefectTypeFilterChange}
                    onYearFilterChange={handleYearFilterChange}
                    onDateFilterChange={handleDateFilterChange}
                    summaryStats={summaryStats}
                    isLoading={isPending}
                    onExport={handleExportData}
                    onDuplicate={userPermissions.canCreate ? handleDuplicateReport : undefined}
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

      {/* Modals */}
      <Suspense fallback={null}>
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedReport(null)}></div>
               <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up ring-1 ring-slate-900/5">
                  <DefectReportDetail
                    report={selectedReport}
                    onEdit={handleEditClick}
                    onDelete={onDeleteReport}
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
              onSave={onSaveReport}
              onClose={() => {
                setIsFormOpen(false);
                setEditingReport(null);
              }}
              currentUserRole={currentUser.role}
              editableFields={userRoleConfig?.editableFields || []}
              products={products}
            />
          )}
          
          {isProductModalOpen && (
              <ProductListModal 
                products={products} 
                onClose={() => setIsProductModalOpen(false)} 
                onImport={handleImportProductsCallback}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
