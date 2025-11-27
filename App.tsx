import React, { useState, useMemo, useEffect, useTransition, Suspense, useRef } from 'react';
import { DefectReport, UserRole, ToastType, User, RoleSettings, PermissionField, SystemSettings, Product } from './types';
import { PlusIcon, BarChartIcon, ArrowDownTrayIcon, ListBulletIcon, ArrowRightOnRectangleIcon, UserGroupIcon, ChartPieIcon, TableCellsIcon, ShieldCheckIcon, CalendarIcon, Cog8ToothIcon, EllipsisHorizontalIcon } from './components/Icons';
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
  getDocs,
  where
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
        // Initialize position to bottom right
        setPosition({ 
            x: window.innerWidth - 80, 
            y: window.innerHeight - 100 
        });
        setIsInitialized(true);

        const handleResize = () => {
             setPosition(prev => ({
                 x: Math.min(prev.x, window.innerWidth - 80),
                 y: Math.min(prev.y, window.innerHeight - 80)
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

// --- Initial Data for Seeding (Only used once) ---
const INITIAL_USERS: User[] = [
  { username: 'admin', fullName: 'Quản Trị Viên', role: UserRole.Admin, password: '123' },
  { username: 'kythuat', fullName: 'Nguyễn Văn Kỹ', role: UserRole.KyThuat, password: '123' },
  { username: 'sanxuat', fullName: 'Trần Văn Sản', role: UserRole.SanXuat, password: '123' },
  { username: 'cungung', fullName: 'Lê Thị Cung', role: UserRole.CungUng, password: '123' },
  { username: 'kho', fullName: 'Phạm Văn Kho', role: UserRole.Kho, password: '123' },
  { username: 'tgd', fullName: 'Nguyễn Tổng', role: UserRole.TongGiamDoc, password: '123' },
];

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

// --- Main App Component ---

export const App: React.FC = () => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State (Sync with Firebase)
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
  
  // Menu States
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
  
  // Initialize Year Filter to Current Year
  const currentYear = new Date().getFullYear().toString();
  const [yearFilter, setYearFilter] = useState(currentYear); 
  
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isPending, startTransition] = useTransition();

  // --- FIREBASE REAL-TIME LISTENERS ---

  // 1. Listen to REPORTS
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

  // 2. Listen to USERS (and Seed if empty)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), async (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data()) as User[];
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, [isLoadingDB]);

  // 3. Listen to PRODUCTS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  // 4. Listen to SETTINGS (Role Config & System Settings)
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

  // 5. Apply System Settings to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (systemSettings.fontFamily) {
        root.style.setProperty('font-family', systemSettings.fontFamily);
    }
    if (systemSettings.baseFontSize) {
        root.style.fontSize = systemSettings.baseFontSize;
    }
  }, [systemSettings.fontFamily, systemSettings.baseFontSize]);

  // Safety timeout for loading
  useEffect(() => {
      const timer = setTimeout(() => {
          if (isLoadingDB) {
              setIsLoadingDB(false);
          }
      }, 3000);
      return () => clearTimeout(timer);
  }, [isLoadingDB]);
  
  // Close menus on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          // Admin Menu
          if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
              setIsAdminMenuOpen(false);
          }
          // Profile Menu
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
    const config = roleSettings[role] || DEFAULT_ROLE_SETTINGS[role]; // Fallback
    
    // Fallback logic if permissions are undefined for a new role
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
     const config = roleSettings[currentUser.role] || DEFAULT_ROLE_SETTINGS[currentUser.role];
     return config ? config.canViewDashboard : false;
  }, [currentUser, roleSettings]);
  
  // Available Roles list (Dynamic)
  const availableRoles = useMemo(() => {
      return Object.keys(roleSettings);
  }, [roleSettings]);

  // Filter Logic
  const filteredReports = useMemo(() => {
    let result = reports;

    if (currentUser) {
        const config = roleSettings[currentUser.role] || DEFAULT_ROLE_SETTINGS[currentUser.role];
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

    // Year Filter Logic
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
  
  // Calculate available years for global filter
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, defectTypeFilter, yearFilter, dateFilter]);


  // Handlers

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
      setIsProfileMenuOpen(false);
  };

  // --- FIRESTORE ACTIONS ---

  const handleSaveReport = async (report: DefectReport) => {
    try {
        if (editingReport && report.id) {
            const reportRef = doc(db, "reports", report.id);
            const { id, ...data } = report;
            await updateDoc(reportRef, data as any);
            showToast('Cập nhật báo cáo thành công!', 'success');
        } else {
            const { id, ...data } = report;
            const newReportData = {
                ...data,
                ngayTao: new Date().toISOString()
            };
            await addDoc(collection(db, "reports"), newReportData);
            showToast('Tạo báo cáo mới thành công!', 'success');
        }
        setIsFormOpen(false);
        setEditingReport(null);
        setSelectedReport(null);
    } catch (error) {
        console.error("Error saving report:", error);
        showToast('Lỗi khi lưu báo cáo', 'error');
    }
  };

  const handleDeleteReport = async (id: string) => {
    // Rely on the UI component (list or detail) to handle confirmation
    try {
        await deleteDoc(doc(db, "reports", id));
        if (selectedReport?.id === id) setSelectedReport(null);
        showToast('Đã xóa báo cáo.', 'info');
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
    const fileName = `bao_cao_san_pham_loi_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  const handleImportProducts = async (newProducts: Product[]) => {
      try {
          // Chunking logic to avoid Firebase limit
          const chunkSize = 450; // Limit per batch
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
        // Fetch all product docs
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            showToast("Danh sách sản phẩm đang trống.", "info");
            return;
        }

        // Chunking for batch delete (limit 500)
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
          setRoleSettings(newSettings); // Optimistic Update
          showToast('Cập nhật phân quyền thành công.', 'success');
      } catch (error) {
          showToast("Lỗi khi lưu phân quyền", "error");
      }
  };

  const handleRenameRole = async (oldName: string, newName: string) => {
      try {
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

  const handleSaveSystemSettings = async (newSettings: SystemSettings) => {
      try {
          await setDoc(doc(db, "settings", "systemSettings"), newSettings);
          setSystemSettings(newSettings); // Optimistic update
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

  // Search & Filter Handlers used in List Component
  const handleSearchTermChange = (term: string) => startTransition(() => setSearchTerm(term));
  const handleStatusFilterChange = (status: string) => startTransition(() => setStatusFilter(status));
  const handleDefectTypeFilterChange = (type: string) => startTransition(() => setDefectTypeFilter(type));
  const handleYearFilterChange = (year: string) => startTransition(() => setYearFilter(year));
  const handleDateFilterChange = (dates: {start: string, end: string}) => startTransition(() => setDateFilter(dates));
  
  // Dashboard interaction handler
  const handleDashboardFilterSelect = (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => {
      startTransition(() => {
          setYearFilter('All'); // Reset year on dashboard click
          if (filterType === 'search' && value) {
              setSearchTerm(value);
              setStatusFilter('All');
              setDefectTypeFilter('All');
              setCurrentView('list'); // Switch to list if searching
          } else if (filterType === 'all') {
              setStatusFilter('All');
              setDefectTypeFilter('All');
              setSearchTerm('');
              setCurrentView('list');
          }
          // For 'status', 'defectType', 'brand', the Dashboard component handles the modal display
      });
  };

  // Helper to get user initials for Avatar
  const getUserInitials = (name: string) => {
      return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (!currentUser) {
      return (
        <Suspense fallback={<Loading />}>
             {/* Fallback to INITIAL_USERS if DB is empty or not connected */}
             {/* Use merged system settings */}
             <Login 
                onLogin={handleLogin} 
                users={users.length > 0 ? users : INITIAL_USERS} 
                settings={{...DEFAULT_SYSTEM_SETTINGS, ...systemSettings}}
             />
        </Suspense>
      );
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-100 text-slate-900 relative">
      {/* Header */}
      <header 
        className="backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 transition-all"
        style={{
            backgroundColor: systemSettings.headerBackgroundColor || 'rgba(255, 255, 255, 0.9)',
            color: systemSettings.headerTextColor || '#0f172a'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
               <BarChartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-sm sm:text-lg font-bold tracking-tight truncate hidden sm:block uppercase text-inherit">
              THEO DÕI LỖI SẢN PHẨM
            </h1>
            {isLoadingDB && <span className="text-xs text-blue-500 animate-pulse ml-2">● Đồng bộ...</span>}
          </div>

          {/* Center: View Switcher & Global Year Filter */}
          {canViewDashboard && (
             <div className="flex items-center gap-1 sm:gap-2">
                 {/* Year Filter Button */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 py-1.5 flex items-center active:scale-95 transition-transform">
                    <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 mr-1 sm:mr-2 opacity-80" />
                    <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline opacity-80">Năm:</span>
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

                 {/* Desktop View Switcher */}
                 <div className="bg-white/50 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50 hidden md:flex">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${
                            currentView === 'list' 
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
                            : 'text-inherit hover:opacity-80 hover:bg-white/50'
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
                            : 'text-inherit hover:opacity-80 hover:bg-white/50'
                        }`}
                        title="Xem báo cáo thống kê"
                    >
                        <ChartPieIcon className="h-4 w-4 mr-2" />
                        Báo cáo
                    </button>
                </div>
            </div>
          )}

          {/* Right: Actions & User */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Secondary Actions Group */}
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

                {/* Unified Admin Settings Dropdown */}
                {currentUser.role === UserRole.Admin && (
                    <div className="relative" ref={adminMenuRef}>
                        <button
                            onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border active:scale-95 ${isAdminMenuOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:text-blue-600 opacity-80 hover:opacity-100'}`}
                            title="Cài đặt hệ thống"
                        >
                            <Cog8ToothIcon className={`h-5 w-5 ${isAdminMenuOpen ? 'animate-spin-slow' : ''}`} />
                            <span className="hidden sm:inline text-sm font-bold">Cài đặt</span>
                        </button>
                        
                        {/* Unified Dropdown Menu */}
                        {isAdminMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up origin-top-right text-slate-900">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quản trị hệ thống</p>
                                </div>
                                <button
                                    onClick={() => { setIsPermissionModalOpen(true); setIsAdminMenuOpen(false); }}
                                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <ShieldCheckIcon className="h-5 w-5 mr-3 text-slate-400" />
                                    Phân quyền
                                </button>
                                <button
                                    onClick={() => { setIsProductModalOpen(true); setIsAdminMenuOpen(false); }}
                                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <TableCellsIcon className="h-5 w-5 mr-3 text-slate-400" />
                                    Danh sách sản phẩm
                                </button>
                                <button
                                    onClick={() => { setIsUserModalOpen(true); setIsAdminMenuOpen(false); }}
                                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <UserGroupIcon className="h-5 w-5 mr-3 text-slate-400" />
                                    Quản lý người dùng
                                </button>
                                <button
                                    onClick={() => { setIsSystemSettingsModalOpen(true); setIsAdminMenuOpen(false); }}
                                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <Cog8ToothIcon className="h-5 w-5 mr-3 text-slate-400" />
                                    Cấu hình / Cài đặt web
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* User Profile Dropdown */}
            <div className="relative ml-1" ref={profileMenuRef}>
                <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="focus:outline-none transition-transform active:scale-95"
                    title="Thông tin tài khoản"
                >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md border-2 border-white ring-2 ring-transparent hover:ring-blue-200 transition-all text-sm">
                        {getUserInitials(currentUser.fullName || currentUser.username)}
                    </div>
                </button>

                {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up origin-top-right text-slate-900">
                        <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-sm font-bold text-slate-800 capitalize truncate">
                                {currentUser.fullName || currentUser.username}
                            </p>
                            <p className="text-xs font-normal text-slate-500 mt-0.5">
                                {currentUser.role}
                            </p>
                        </div>
                        <div className="py-1">
                            <button 
                                onClick={handleLogout}
                                className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                )}
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

      {/* Draggable Create Button */}
      {userPermissions.canCreate && (
          <DraggableFAB onClick={handleCreateClick} />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center sm:p-6">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedReport(null)}></div>
               <div className="relative w-full max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden h-[95dvh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-slide-up ring-1 ring-slate-900/5 z-50">
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
                availableRoles={availableRoles}
              />
          )}
          
          {isPermissionModalOpen && (
              <PermissionManagementModal
                roleSettings={roleSettings}
                onSave={handleSavePermissions}
                onRenameRole={handleRenameRole}
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

      {/* Toast Notification */}
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