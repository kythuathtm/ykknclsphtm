
import React, { useState, useMemo, useEffect, useTransition, Suspense } from 'react';
import { DefectReport, UserRole, ToastType, User, RoleSettings, PermissionField, SystemSettings, Product } from './types';
import { PlusIcon, BarChartIcon, ArrowDownTrayIcon, ListBulletIcon, ArrowRightOnRectangleIcon, UserGroupIcon, ChartPieIcon, TableCellsIcon, ShieldCheckIcon, CalendarIcon, Cog8ToothIcon } from './components/Icons';
import * as XLSX from 'xlsx';
import Loading from './components/Loading';

// Firebase Imports
import { db } from './firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';

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

// --- Initial Data for Seeding (Only used once) ---
const INITIAL_USERS: User[] = [
  { username: 'admin', fullName: 'Quản Trị Viên', role: UserRole.Admin, password: '123' },
  { username: 'kythuat', fullName: 'Nguyễn Văn Kỹ', role: UserRole.KyThuat, password: '123' },
  { username: 'sanxuat', fullName: 'Trần Văn Sản', role: UserRole.SanXuat, password: '123' },
  { username: 'cungung', fullName: 'Lê Thị Cung', role: UserRole.CungUng, password: '123' },
  { username: 'kho', fullName: 'Phạm Văn Kho', role: UserRole.Kho, password: '123' },
  { username: 'tgd', fullName: 'Nguyễn Tổng', role: UserRole.TongGiamDoc, password: '123' },
];

const INITIAL_PRODUCTS: Product[] = [];

const DEFAULT_ROLE_SETTINGS: RoleSettings = {
    [UserRole.Admin]: { canCreate: true, canViewDashboard: true, viewableDefectTypes: ['All'], editableFields: ['general', 'soLuongDoi', 'loaiLoi', 'nguyenNhan', 'huongKhacPhuc', 'trangThai', 'ngayHoanThanh'] },
    [UserRole.KyThuat]: { canCreate: true, canViewDashboard: true, viewableDefectTypes: ['All'], editableFields: ['general', 'soLuongDoi', 'loaiLoi', 'nguyenNhan', 'huongKhacPhuc', 'trangThai', 'ngayHoanThanh'] },
    [UserRole.CungUng]: { canCreate: false, canViewDashboard: true, viewableDefectTypes: ['All'], editableFields: ['general', 'loaiLoi', 'trangThai'] },
    [UserRole.TongGiamDoc]: { canCreate: false, canViewDashboard: true, viewableDefectTypes: ['All'], editableFields: [] },
    [UserRole.SanXuat]: { canCreate: false, canViewDashboard: false, viewableDefectTypes: ['Lỗi Sản xuất', 'Lỗi Hỗn hợp'], editableFields: ['nguyenNhan', 'huongKhacPhuc'] },
    [UserRole.Kho]: { canCreate: false, canViewDashboard: false, viewableDefectTypes: ['All'], editableFields: [] },
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  appName: 'Theo dõi lỗi SP',
  companyName: 'Công ty Cổ phần Vật tư Y tế Hồng Thiện Mỹ',
  logoUrl: '',
  backgroundType: 'default',
  backgroundValue: ''
};

// --- Main App Component ---

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<DefectReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [roleSettings, setRoleSettings] = useState<RoleSettings>(DEFAULT_ROLE_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  
  const [selectedReport, setSelectedReport] = useState<DefectReport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DefectReport | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'dashboard'>('list');
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [defectTypeFilter, setDefectTypeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("ngayTao", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DefectReport[];
      setReports(reportsData);
      setIsLoadingDB(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setIsLoadingDB(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), async (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data()) as User[];
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, [isLoadingDB]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "settings"), (snapshot) => {
      if (!snapshot.empty) {
        const roleDoc = snapshot.docs.find(d => d.id === 'roleSettings');
        if (roleDoc) {
            setRoleSettings(roleDoc.data() as RoleSettings);
        }
        const systemDoc = snapshot.docs.find(d => d.id === 'systemSettings');
        if (systemDoc) {
            setSystemSettings(systemDoc.data() as SystemSettings);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      const timer = setTimeout(() => {
          if (isLoadingDB) {
              setIsLoadingDB(false);
          }
      }, 3000);
      return () => clearTimeout(timer);
  }, [isLoadingDB]);

  const userPermissions = useMemo(() => {
    if (!currentUser) return { canCreate: false, canEdit: false, canDelete: false };
    const role = currentUser.role;
    const config = roleSettings[role] || DEFAULT_ROLE_SETTINGS[role];
    
    return {
      canCreate: config.canCreate,
      canEdit: [UserRole.Admin, UserRole.KyThuat, UserRole.CungUng, UserRole.SanXuat].includes(role),
      canDelete: [UserRole.Admin, UserRole.KyThuat].includes(role),
    };
  }, [currentUser, roleSettings]);

  const canViewDashboard = useMemo(() => {
     if (!currentUser) return false;
     return (roleSettings[currentUser.role] || DEFAULT_ROLE_SETTINGS[currentUser.role]).canViewDashboard;
  }, [currentUser, roleSettings]);

  const filteredReports = useMemo(() => {
    let result = reports;

    if (currentUser) {
        const config = roleSettings[currentUser.role] || DEFAULT_ROLE_SETTINGS[currentUser.role];
        if (!config.viewableDefectTypes.includes('All')) {
            result = result.filter(r => config.viewableDefectTypes.some(type => {
                const loaiLoi = r.loaiLoi as string;
                if (type === 'Lỗi Sản xuất') return loaiLoi === 'Lỗi Sản xuất' || loaiLoi === 'Lỗi bộ phận sản xuất';
                if (type === 'Lỗi Hỗn hợp') return loaiLoi === 'Lỗi Hỗn hợp' || loaiLoi === 'Lỗi vừa sản xuất vừa NCC';
                if (type === 'Lỗi Khác') return loaiLoi === 'Lỗi Khác' || loaiLoi === 'Lỗi khác';
                return loaiLoi === type;
            }));
        }
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.maSanPham.toLowerCase().includes(lowerTerm) ||
          r.tenThuongMai.toLowerCase().includes(lowerTerm) ||
          (r.tenThietBi && r.tenThietBi.toLowerCase().includes(lowerTerm)) ||
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
        result = result.filter((r) => {
            const loaiLoi = r.loaiLoi as string;
            if (defectTypeFilter === 'Lỗi Sản xuất') return loaiLoi === 'Lỗi Sản xuất' || loaiLoi === 'Lỗi bộ phận sản xuất';
            if (defectTypeFilter === 'Lỗi Hỗn hợp') return loaiLoi === 'Lỗi Hỗn hợp' || loaiLoi === 'Lỗi vừa sản xuất vừa NCC';
            if (defectTypeFilter === 'Lỗi Khác') return loaiLoi === 'Lỗi Khác' || loaiLoi === 'Lỗi khác';
            return loaiLoi === defectTypeFilter;
        });
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

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
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
      const currentYear = new Date().getFullYear().toString();
      years.add(currentYear);

      reports.forEach(r => {
          if(r.ngayPhanAnh) {
             const y = new Date(r.ngayPhanAnh).getFullYear().toString();
             years.add(y);
          }
      });

      return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [reports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleLogin = async (user: User) => {
      setCurrentUser(user);
      setCurrentView('list'); 
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setSelectedReport(null);
      setIsFormOpen(false);
      setIsUserModalOpen(false);
      setIsProductModalOpen(false);
      setIsPermissionModalOpen(false);
      setIsSystemSettingsModalOpen(false);
  };

  const handleSaveReport = async (report: DefectReport) => {
    try {
        if (editingReport && report.id) {
            const reportRef = doc(db, "reports", report.id);
            const { id, ...data } = report;
            await updateDoc(reportRef, data as any);
            showToast('Cập nhật phản ánh thành công!', 'success');
        } else {
            const { id, ...data } = report;
            const newReportData = {
                ...data,
                ngayTao: new Date().toISOString()
            };
            await addDoc(collection(db, "reports"), newReportData);
            showToast('Tạo phản ánh mới thành công!', 'success');
        }
        setIsFormOpen(false);
        setEditingReport(null);
        setSelectedReport(null);
    } catch (error) {
        console.error("Error saving report:", error);
        showToast('Lỗi khi lưu phản ánh', 'error');
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
        await deleteDoc(doc(db, "reports", id));
        if (selectedReport?.id === id) setSelectedReport(null);
        showToast('Đã xóa phản ánh.', 'info');
    } catch (error) {
        console.error("Error deleting:", error);
        showToast('Lỗi khi xóa', 'error');
    }
  };

  const handleEditClick = (report: DefectReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
    setSelectedReport(null); 
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
        'Tên thiết bị': r.tenThietBi || '',
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
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `phan_anh_san_pham_loi_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  const handleImportProducts = async (newProducts: Product[]) => {
      try {
          const chunkSize = 450; 
          const chunks = [];
          for (let i = 0; i < newProducts.length; i += chunkSize) {
              chunks.push(newProducts.slice(i, i + chunkSize));
          }
          
          let totalCount = 0;
          for (const chunk of chunks) {
              const batch = writeBatch(db);
              chunk.forEach((p: any) => {
                  if(p.maSanPham) {
                      const ref = doc(db, "products", p.maSanPham);
                      batch.set(ref, p);
                  }
              });
              await batch.commit();
              totalCount += chunk.length;
          }
          
          showToast(`Đã import thành công ${totalCount} sản phẩm lên Cloud.`, 'success');
          setIsProductModalOpen(false);
      } catch (error) {
          console.error("Import error:", error);
          showToast("Lỗi khi import sản phẩm", "error");
      }
  };

  const handleAddProduct = async (product: Product) => {
    try {
        await setDoc(doc(db, "products", product.maSanPham), product);
        showToast('Thêm sản phẩm thành công', 'success');
    } catch (error) {
        console.error(error);
        showToast('Lỗi khi thêm sản phẩm', 'error');
    }
  };

  const handleDeleteProduct = async (maSanPham: string) => {
    if(!window.confirm(`Xóa sản phẩm ${maSanPham}?`)) return;
    try {
        await deleteDoc(doc(db, "products", maSanPham));
        showToast('Xóa sản phẩm thành công', 'info');
    } catch (error) {
        console.error(error);
        showToast('Lỗi khi xóa sản phẩm', 'error');
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!window.confirm("CẢNH BÁO QUAN TRỌNG:\n\nBạn đang thực hiện xóa TOÀN BỘ danh sách sản phẩm.\nHành động này KHÔNG THỂ khôi phục.\n\nBạn có chắc chắn muốn tiếp tục?")) return;

    try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            showToast("Danh sách sản phẩm đang trống.", "info");
            return;
        }

        const chunkSize = 450;
        const chunks = [];
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += chunkSize) {
            chunks.push(docs.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        
        showToast("Đã xóa toàn bộ dữ liệu sản phẩm.", "info");
    } catch (error) {
        console.error("Delete all error:", error);
        showToast("Lỗi khi xóa dữ liệu.", "error");
    }
  };

  const handleSaveUser = async (user: User, isEdit: boolean) => {
      try {
          await setDoc(doc(db, "users", user.username), user);
          showToast(isEdit ? 'Cập nhật tài khoản thành công.' : 'Thêm tài khoản mới thành công.', 'success');
      } catch (error) {
          console.error("User save error:", error);
          showToast("Lỗi khi lưu tài khoản", "error");
      }
  };

  const handleDeleteUser = async (username: string) => {
      try {
          await deleteDoc(doc(db, "users", username));
          showToast('Đã xóa tài khoản.', 'info');
      } catch (error) {
          showToast("Lỗi khi xóa tài khoản", "error");
      }
  };

  const handleSavePermissions = async (newSettings: RoleSettings) => {
      try {
          await setDoc(doc(db, "settings", "roleSettings"), newSettings);
          showToast('Cập nhật phân quyền thành công.', 'success');
      } catch (error) {
          showToast("Lỗi khi lưu phân quyền", "error");
      }
  };

  const handleSaveSystemSettings = async (newSettings: SystemSettings) => {
      try {
          await setDoc(doc(db, "settings", "systemSettings"), newSettings);
          setSystemSettings(newSettings);
          showToast('Cập nhật cấu hình hệ thống thành công.', 'success');
      } catch (error) {
          console.error("System settings save error:", error);
          showToast("Lỗi khi lưu cấu hình", "error");
      }
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
              setCurrentView('list'); // Only switch to list for search
          } else if (filterType === 'all') {
              setStatusFilter('All');
              setDefectTypeFilter('All');
              setSearchTerm('');
              setCurrentView('list');
          }
          // For status and defect type, the Dashboard component will handle expansion
      });
  };

  if (!currentUser) {
      return (
        <Suspense fallback={<Loading />}>
             <Login 
                onLogin={handleLogin} 
                users={users.length > 0 ? users : INITIAL_USERS} 
                settings={{...DEFAULT_SYSTEM_SETTINGS, ...systemSettings}}
             />
        </Suspense>
      );
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-100 font-sans text-slate-900">
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
                        title="Xem danh sách phản ánh"
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
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100 active:scale-95"
                    title="Đăng xuất"
                >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
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
                    onDelete={handleDeleteReport}
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
                />
            ) : (
                <DashboardReport 
                    reports={filteredReports} 
                    onFilterSelect={handleDashboardFilterSelect}
                    onSelectReport={setSelectedReport} // Pass this so Dashboard can open details
                />
            )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedReport(null)}></div>
               <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up ring-1 ring-slate-900/5">
                  <DefectReportDetail
                    report={selectedReport}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteReport}
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
              onSave={handleSaveReport}
              onClose={() => {
                setIsFormOpen(false);
                setEditingReport(null);
              }}
              currentUserRole={currentUser.role}
              editableFields={(roleSettings[currentUser.role] || DEFAULT_ROLE_SETTINGS[currentUser.role]).editableFields}
              products={products}
            />
          )}
          
          {isProductModalOpen && (
              <ProductListModal 
                products={products} 
                onClose={() => setIsProductModalOpen(false)} 
                onImport={handleImportProducts}
                onAdd={handleAddProduct}
                onDelete={handleDeleteProduct}
                onDeleteAll={handleDeleteAllProducts}
                currentUserRole={currentUser.role}
              />
          )}

          {isUserModalOpen && (
              <UserManagementModal 
                users={users}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onClose={() => setIsUserModalOpen(false)}
              />
          )}
          
          {isPermissionModalOpen && (
              <PermissionManagementModal
                roleSettings={roleSettings}
                onSave={handleSavePermissions}
                onClose={() => setIsPermissionModalOpen(false)}
              />
          )}

          {isSystemSettingsModalOpen && (
              <SystemSettingsModal
                currentSettings={systemSettings}
                onSave={handleSaveSystemSettings}
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
