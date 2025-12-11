
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
    success: { bg: 'bg-green-500/90 backdrop-blur-md', icon: '✅' },
    error: { bg: 'bg-red-500/90 backdrop-blur-md', icon: '❌' },
    info: { bg: 'bg-blue-500/90 backdrop-blur-md', icon: 'ℹ️' },
  };

  const { bg, icon } = config[type];

  return (
    <div className={`fixed bottom-5 right-5 ${bg} text-white py-3 px-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 flex items-center z-[60] animate-fade-in-up`}>
      <span className="mr-3 text-xl">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

// Safe XLSX access
const xlsxLib = (XLSX as any).default ?? XLSX;

// --- Helper for date filtering ---
const getProcessingDays = (startDate: string, endDate?: string) => {
    if (!startDate) return 0;
    try {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch { return 0; }
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
  
  // New Overdue Filter State
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  
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

    // Dashboard Settings
    if (systemSettings.dashboardFontFamily) {
        root.style.setProperty('--dashboard-font', systemSettings.dashboardFontFamily);
    } else {
        root.style.removeProperty('--dashboard-font');
    }

    if (systemSettings.dashboardFontSize) {
        root.style.setProperty('--dashboard-size', systemSettings.dashboardFontSize);
    } else {
        root.style.removeProperty('--dashboard-size');
    }

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

  // AUTO-REDIRECT TO DASHBOARD EFFECT
  useEffect(() => {
      if (currentUser) {
          if (canViewDashboard) {
              setCurrentView('dashboard');
          } else {
              setCurrentView('list');
          }
      }
  }, [currentUser, canViewDashboard]);

  // --- FILTER LOGIC SEPARATION ---

  // 1. Dashboard Reports: Only affected by Time Filters (Year, Date) and User Permissions
  const dashboardReports = useMemo(() => {
    let result = [...reports];

    // Role-based permission filter
    if (currentUser) {
        const config = roleSettings[currentUser.role];
        
        // FAIL CLOSED: If config doesn't exist for the role, assume NO PERMISSIONS
        if (!config) {
            result = [];
        }
        // If config exists, check if 'All' is NOT present. If it's not present, we must filter.
        else if (!config.viewableDefectTypes.includes('All')) {
            result = result.filter(r => {
                // Keep reports that have a type matching the allowed types
                // ALSO keep reports with empty/undefined type if they are 'Mới' so users can triage them (optional business rule, keeping it strict for now as per request)
                // Strict: Only show if type matches exactly.
                return config.viewableDefectTypes.includes(r.loaiLoi);
            });
        }
    }

    // Time Filters
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

  // 2. List Reports: Dashboard Reports + List specific filters (Search, Status, Defect Type)
  const filteredReports = useMemo(() => {
    let result = [...dashboardReports]; // Start with the time-filtered set

    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean); // Split by whitespace
      
      result = result.filter((r) => {
          // Join all searchable fields into one string for efficient searching
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

          // Check if EVERY term exists in the searchable text
          return terms.every(term => searchableText.includes(term));
      });
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

    // Overdue Filter
    if (isOverdueFilter) {
        result = result.filter(r => {
            if (r.trangThai === 'Hoàn thành') return false;
            return getProcessingDays(r.ngayPhanAnh) > 7;
        });
    }

    return result;
  }, [dashboardReports, searchTerm, statusFilter, defectTypeFilter, isOverdueFilter]);

  // Sorting
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

  // Pagination
  const currentReports = useMemo(() => {
      const firstPageIndex = (currentPage - 1) * itemsPerPage;
      const lastPageIndex = firstPageIndex + itemsPerPage;
      return sortedReports.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, itemsPerPage, sortedReports]);

  // Summary Stats for Dashboard
  const summaryStats = useMemo(() => {
      // Use dashboardReports (time-filtered) for stats, not list-filtered
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
        
        {/* Background Overlay based on Settings */}
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
                <>
                    <Header 
                        currentUser={currentUser}
                        systemSettings={systemSettings}
                        isLoadingReports={isLoadingReports}
                        canViewDashboard={canViewDashboard}
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        yearFilter={yearFilter}
                        setYearFilter={setYearFilter}
                        availableYears={['2023', '2024', '2025']} // Example years
                        onExport={() => {/* Implement export */}}
                        onImport={() => fileInputRef.current?.click()}
                        onDownloadTemplate={() => {/* Implement template */}}
                        canImport={userPermissions.canCreate}
                        onLogout={logout}
                        onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
                        onOpenProductModal={() => setIsProductModalOpen(true)}
                        onOpenUserModal={() => setIsUserModalOpen(true)}
                        onOpenSystemSettingsModal={() => setIsSystemSettingsModalOpen(true)}
                        onOpenProfileModal={() => setIsProfileModalOpen(true)}
                        onToggleChat={() => setIsChatOpen(!isChatOpen)}
                        isOffline={isOffline}
                    />
                    
                    {/* Hidden Import Input */}
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
                                // Map json to DefectReport and import
                                // For now just a placeholder action
                                importReports(json as DefectReport[]);
                            }
                        };
                        reader.readAsBinaryString(file);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }} />

                    <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
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
                                    const ws = xlsxLib.utils.json_to_sheet(filteredReports);
                                    const wb = xlsxLib.utils.book_new();
                                    xlsxLib.utils.book_append_sheet(wb, ws, "Reports");
                                    xlsxLib.writeFile(wb, "DefectReports.xlsx");
                                }}
                                onDuplicate={(r) => { 
                                    // Duplicate logic
                                    const { id, ...rest } = r;
                                    setEditingReport({ ...rest, id: `new_${Date.now()}` } as DefectReport);
                                    setIsFormOpen(true);
                                }}
                                sortConfig={sortConfig}
                                onSort={(key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                            />
                        )}
                    </main>

                    {/* Modals & Overlays */}
                    {isFormOpen && (
                        <DefectReportForm 
                            initialData={editingReport}
                            onSave={(r) => { saveReport(r, !!editingReport); setIsFormOpen(false); setEditingReport(null); }}
                            onClose={() => { setIsFormOpen(false); setEditingReport(null); }}
                            currentUserRole={currentUser.role as UserRole}
                            editableFields={roleSettings[currentUser.role]?.editableFields || []}
                            products={products}
                        />
                    )}

                    {selectedReport && (
                        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
                            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedReport(null)}></div>
                            <div className="w-full max-w-4xl h-full bg-white shadow-2xl pointer-events-auto animate-slide-left overflow-hidden flex flex-col">
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

                    {isChatOpen && (
                        <ChatInterface 
                            onClose={() => setIsChatOpen(false)}
                            data={filteredReports}
                        />
                    )}

                    <div className="sm:hidden">
                        <DraggableFAB onClick={() => { setEditingReport(null); setIsFormOpen(true); }} />
                    </div>
                </>
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </Suspense>
    </div>
  );
};
