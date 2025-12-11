import React, { useState, useEffect, useMemo } from 'react';
import { DefectReport, UserRole } from '../types';
import { 
  FunnelIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, 
  TrashIcon, DocumentDuplicateIcon, PencilIcon, 
  CalendarIcon, AdjustmentsIcon, EyeIcon, 
  CheckCircleIcon, WrenchIcon, ShoppingBagIcon, 
  TagIcon, UserIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon,
  ChartPieIcon, InboxIcon, ExclamationCircleIcon,
  ListBulletIcon, Squares2X2Icon, CubeIcon
} from './Icons';
import Pagination from './Pagination';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  cellAlign?: 'left' | 'center' | 'right';
  fixed?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: 'STT', visible: true, width: 60, align: 'center' },
    { id: 'ngayPhanAnh', label: 'Ngày khiếu nại', visible: true, width: 130, align: 'center' },
    { id: 'duration', label: 'Thời gian XL', visible: true, width: 100, align: 'center' },
    { id: 'maSanPham', label: 'Mã sản phẩm', visible: true, width: 100, headerAlign: 'center', cellAlign: 'left' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, width: 250, headerAlign: 'center', cellAlign: 'left' }, 
    { id: 'noiDungPhanAnh', label: 'Nội dung khiếu nại', visible: true, width: 280, headerAlign: 'center', cellAlign: 'left' },
    { id: 'soLo', label: 'Số lô', visible: true, width: 90, align: 'center' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: false, width: 90, align: 'center' },
    { id: 'hanDung', label: 'Hạn dùng', visible: false, width: 110, align: 'center' },
    { id: 'donViTinh', label: 'ĐVT', visible: false, width: 80, align: 'center' },
    { id: 'trangThai', label: 'Tiến độ xử lý', visible: true, width: 150, align: 'center' }, // Renamed Label
    { id: 'actions', label: '', visible: true, width: 90, align: 'center', fixed: true },
];

interface FilterState {
    searchTerm: string;
    statusFilter: string;
    defectTypeFilter: string;
    yearFilter: string;
    dateFilter: { start: string, end: string };
    isOverdue?: boolean; // Added for overdue tracking
}

interface DefectReportListProps {
  reports: DefectReport[];
  totalReports: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  selectedReport: DefectReport | null;
  onSelectReport: (report: DefectReport) => void;
  onDelete: (id: string) => void;
  currentUserRole: string;
  currentUsername: string;
  filters: FilterState;
  onSearchTermChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDefectTypeFilterChange: (type: string) => void;
  onYearFilterChange: (year: string) => void;
  onDateFilterChange: (range: { start: string, end: string }) => void;
  onOverdueFilterChange?: (isOverdue: boolean) => void; // New prop handler
  summaryStats: any;
  isLoading: boolean;
  onExport: () => void;
  onDuplicate: (report: DefectReport) => void;
  baseFontSize?: string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch(e) { return dateStr; }
};

const getProcessingDays = (startDate: string, endDate?: string) => {
    if (!startDate) return 0;
    try {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch { return 0; }
};

// Check if report is older than 7 days and not completed
const isOverdue = (dateStr: string, status: string) => {
    if (status === 'Hoàn thành') return false;
    const days = getProcessingDays(dateStr);
    return days > 7;
};

// Calculate progress percentage based on status
const getProgress = (status: string) => {
    switch(status) {
        case 'Mới': return 10;
        case 'Đang tiếp nhận': return 25;
        case 'Đang xác minh': return 50;
        case 'Đang xử lý': return 75;
        case 'Hoàn thành': return 100;
        case 'Chưa tìm ra nguyên nhân': return 85;
        default: return 0;
    }
}

// --- UPDATED DASHBOARD TAB STYLES (Glassmorphism Cards) ---
type TabStyleKey = 'All' | 'Mới' | 'Processing' | 'Unknown' | 'Hoàn thành';

const TAB_STYLES: Record<TabStyleKey, { 
    wrapper: string, 
    activeWrapper: string, 
    iconBg: string, 
    activeIconBg: string, 
    iconColor: string, 
    activeIconColor: string,
    text: string,
    activeText: string,
    barColor: string,
    accentColor: string
}> = {
    'All': {
        wrapper: 'bg-white/40 backdrop-blur-md border border-white/50 hover:bg-white/60 shadow-sm',
        activeWrapper: 'bg-white/80 backdrop-blur-xl ring-1 ring-slate-300 border-white shadow-lg',
        iconBg: 'bg-slate-100',
        activeIconBg: 'bg-slate-800',
        iconColor: 'text-slate-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-slate-800',
        barColor: 'bg-slate-800',
        accentColor: '#1e293b'
    },
    'Mới': {
        wrapper: 'bg-white/40 backdrop-blur-md border border-white/50 hover:bg-blue-50/40 shadow-sm',
        activeWrapper: 'bg-white/80 backdrop-blur-xl ring-1 ring-blue-400 border-white shadow-lg shadow-blue-500/10',
        iconBg: 'bg-blue-50',
        activeIconBg: 'bg-blue-600',
        iconColor: 'text-blue-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-blue-700',
        barColor: 'bg-blue-600',
        accentColor: '#2563eb'
    },
    'Processing': {
        wrapper: 'bg-white/40 backdrop-blur-md border border-white/50 hover:bg-amber-50/40 shadow-sm',
        activeWrapper: 'bg-white/80 backdrop-blur-xl ring-1 ring-amber-400 border-white shadow-lg shadow-amber-500/10',
        iconBg: 'bg-amber-50',
        activeIconBg: 'bg-amber-500',
        iconColor: 'text-amber-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-amber-700',
        barColor: 'bg-amber-500',
        accentColor: '#f59e0b'
    },
    'Unknown': {
        wrapper: 'bg-white/40 backdrop-blur-md border border-white/50 hover:bg-purple-50/40 shadow-sm',
        activeWrapper: 'bg-white/80 backdrop-blur-xl ring-1 ring-purple-400 border-white shadow-lg shadow-purple-500/10',
        iconBg: 'bg-purple-50',
        activeIconBg: 'bg-purple-600',
        iconColor: 'text-purple-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-purple-700',
        barColor: 'bg-purple-600',
        accentColor: '#9333ea'
    },
    'Hoàn thành': {
        wrapper: 'bg-white/40 backdrop-blur-md border border-white/50 hover:bg-emerald-50/40 shadow-sm',
        activeWrapper: 'bg-white/80 backdrop-blur-xl ring-1 ring-emerald-400 border-white shadow-lg shadow-emerald-500/10',
        iconBg: 'bg-emerald-50',
        activeIconBg: 'bg-emerald-600',
        iconColor: 'text-emerald-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-emerald-700',
        barColor: 'bg-emerald-600',
        accentColor: '#059669'
    }
};

const DashboardTab = ({ label, count, total, isActive, onClick, styleKey, icon }: { label: string, count: number, total: number, isActive: boolean, onClick: () => void, styleKey: TabStyleKey, icon?: React.ReactNode }) => {
    const styles = TAB_STYLES[styleKey];
    const percent = total > 0 ? (count / total) * 100 : 0;

    return (
        <button 
            onClick={onClick}
            className={`
                relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-300 select-none w-full h-[100px] group hover:-translate-y-1 overflow-hidden
                ${isActive ? styles.activeWrapper + ' scale-[1.02] z-10' : styles.wrapper}
            `}
        >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`} style={{ backgroundColor: styles.accentColor }}></div>

            <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg transition-colors duration-300 shadow-sm border border-white/50 ${isActive ? styles.activeIconBg : styles.iconBg} ${isActive ? styles.activeIconColor : styles.iconColor}`}>
                        {icon && React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                    </div>
                    <span className={`text-[0.65rem] font-bold uppercase tracking-widest leading-tight ${isActive ? styles.activeText : styles.text}`}>
                        {label}
                    </span>
                </div>
            </div>
            
            <div className="flex items-end justify-between w-full mt-auto relative z-10">
                <span className={`text-3xl font-bold leading-none tracking-tighter tabular-nums transition-colors ${isActive ? styles.activeText : 'text-slate-700'}`}>
                    {count.toLocaleString()}
                </span>
                <div className="flex flex-col items-end gap-1">
                     {isActive && <div className={`h-1.5 w-1.5 rounded-full ${styles.barColor} animate-pulse`}></div>}
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full opacity-50">
                <div 
                    className={`h-full ${styles.barColor} transition-all duration-1000 ease-out`} 
                    style={{ width: isActive ? '100%' : `${percent}%`, opacity: isActive ? 1 : 0.5 }}
                ></div>
            </div>
        </button>
    );
};

const SkeletonRow: React.FC<{ columns: ColumnConfig[] }> = ({ columns }) => {
    return (
        <tr className="animate-pulse bg-white/40 border-b border-slate-50">
            {columns.filter(c => c.visible).map((col, idx) => (
                <td key={idx} className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded-md w-full opacity-60"></div>
                </td>
            ))}
        </tr>
    );
};

const DefectReportList: React.FC<DefectReportListProps> = ({
  reports,
  totalReports,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  selectedReport,
  onSelectReport,
  onDelete,
  currentUserRole,
  currentUsername,
  filters,
  onSearchTermChange,
  onStatusFilterChange,
  onDefectTypeFilterChange,
  onYearFilterChange,
  onDateFilterChange,
  onOverdueFilterChange,
  summaryStats,
  isLoading,
  onExport,
  onDuplicate,
  baseFontSize = '15px',
  sortConfig,
  onSort
}) => {
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        const savedColumns = localStorage.getItem(`columns_${currentUsername}`);
        if (savedColumns) {
            try {
                const parsed = JSON.parse(savedColumns);
                const merged = DEFAULT_COLUMNS.map(defCol => {
                    const savedCol = parsed.find((c: ColumnConfig) => c.id === defCol.id);
                    return savedCol ? { ...defCol, visible: savedCol.visible } : defCol;
                });
                setColumns(merged);
            } catch (e) {
                console.error("Failed to parse saved columns", e);
            }
        }
    }, [currentUsername]);

    const toggleColumn = (id: string) => {
        const newColumns = columns.map(col => 
            col.id === id ? { ...col, visible: !col.visible } : col
        );
        setColumns(newColumns);
        localStorage.setItem(`columns_${currentUsername}`, JSON.stringify(newColumns));
    };

    const getStatusBadge = (status: string) => {
        let style = 'bg-slate-100 text-slate-600 border-slate-200';
        switch (status) {
            case 'Mới': style = 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10'; break;
            case 'Đang tiếp nhận': style = 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/10'; break;
            case 'Đang xác minh': style = 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-1 ring-cyan-500/10'; break;
            case 'Đang xử lý': style = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10'; break;
            case 'Chưa tìm ra nguyên nhân': style = 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10'; break;
            case 'Hoàn thành': style = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10'; break;
        }
        return (
            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg border text-[0.6rem] font-bold uppercase tracking-wide whitespace-nowrap shadow-sm ${style}`}>
                {status}
            </span>
        );
    };

    const renderCell = (report: DefectReport, columnId: string, index: number) => {
        switch (columnId) {
            case 'stt':
                return <span className="font-medium text-slate-700 text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
            case 'ngayPhanAnh':
                const overdue = isOverdue(report.ngayPhanAnh, report.trangThai);
                return (
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                            <span className={`block font-bold text-sm ${overdue ? 'text-red-600' : 'text-slate-700'}`}>{formatDate(report.ngayPhanAnh)}</span>
                            {overdue && (
                                <div className="group/tooltip relative">
                                    <ExclamationCircleIcon className="w-4 h-4 text-red-500 animate-pulse cursor-help"/>
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                                        Quá 7 ngày chưa xong
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-[0.6rem] text-slate-400 font-bold bg-slate-50 px-1.5 rounded inline-block mt-0.5 border border-slate-100 tracking-wider">{report.id}</span>
                    </div>
                );
            case 'duration':
                const days = getProcessingDays(report.ngayPhanAnh, report.ngayHoanThanh);
                let dayColor = 'bg-slate-100 text-slate-600 border-slate-200';
                if (report.trangThai === 'Hoàn thành') dayColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                else if (days > 7) dayColor = 'bg-red-50 text-red-600 border-red-100';
                else if (days > 3) dayColor = 'bg-amber-50 text-amber-600 border-amber-100';
                
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${dayColor}`}>
                        <ClockIcon className="w-3 h-3"/> {days} ngày
                    </span>
                );
            case 'maSanPham':
                return (
                    <span className="font-bold text-slate-700 text-sm group-hover:text-[#003DA5] transition-colors bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {report.maSanPham}
                    </span>
                );
            case 'tenThuongMai':
                return (
                    <div className="font-medium text-slate-700 line-clamp-2 leading-snug group-hover:text-[#003DA5] transition-colors" title={report.tenThuongMai} style={{ fontSize: 'inherit' }}>
                        {report.tenThuongMai}
                    </div>
                );
            case 'nhanHang':
                return (
                    <span className="text-slate-500 text-xs font-bold">{report.nhanHang}</span>
                );
            case 'noiDungPhanAnh':
                return (
                    <div className="text-slate-600 line-clamp-2 text-sm italic leading-relaxed bg-slate-50/50 p-1.5 rounded-lg border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all shadow-sm" title={report.noiDungPhanAnh}>
                        {report.noiDungPhanAnh}
                    </div>
                );
            case 'soLo':
                return <span className="font-bold text-slate-700 text-sm">{report.soLo}</span>;
            case 'maNgaySanXuat':
                return <span className="font-bold text-slate-700 text-sm">{report.maNgaySanXuat}</span>;
            case 'hanDung':
                return <span className="text-slate-600 font-medium text-xs">{formatDate(report.hanDung || '')}</span>;
            case 'donViTinh':
                return <span className="text-slate-600 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{report.donViTinh}</span>;
            case 'trangThai':
                const progress = getProgress(report.trangThai);
                let barColor = 'bg-slate-300';
                if (progress <= 10) barColor = 'bg-blue-500';
                else if (progress <= 25) barColor = 'bg-indigo-500';
                else if (progress <= 50) barColor = 'bg-cyan-500';
                else if (progress <= 75) barColor = 'bg-amber-500';
                else if (progress === 100) barColor = 'bg-emerald-500';
                else barColor = 'bg-purple-500'; // Unknown cause

                return (
                    <div className="flex flex-col items-center gap-1.5 w-full max-w-[120px] mx-auto">
                        {getStatusBadge(report.trangThai)}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                );
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelectReport(report); }}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 shadow-sm"
                            title="Xem chi tiết"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                        {currentUserRole !== 'Kho' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                className="p-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm"
                                title="Nhân bản"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                        )}
                        {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shadow-sm"
                                title="Xóa"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent" style={{ fontSize: baseFontSize }}>
            
            {/* 1. DASHBOARD CONTAINER (KPIs) */}
            <div className="flex-shrink-0 w-full py-5 z-10 animate-fade-in-up">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <DashboardTab 
                            label="Tổng phiếu" 
                            count={summaryStats.total}
                            total={summaryStats.total}
                            isActive={filters.statusFilter === 'All'}
                            onClick={() => onStatusFilterChange('All')}
                            styleKey="All"
                            icon={<InboxIcon/>}
                        />
                        <DashboardTab 
                            label="Mới" 
                            count={summaryStats.moi} 
                            total={summaryStats.total}
                            isActive={filters.statusFilter === 'Mới'}
                            onClick={() => onStatusFilterChange('Mới')}
                            styleKey="Mới"
                            icon={<TagIcon/>}
                        />
                        <DashboardTab 
                            label="Đang xử lý" 
                            count={summaryStats.dangXuLy + summaryStats.dangTiepNhan + summaryStats.dangXacMinh} 
                            total={summaryStats.total}
                            isActive={filters.statusFilter === 'Processing_Group' || ['Đang tiếp nhận', 'Đang xác minh', 'Đang xử lý'].includes(filters.statusFilter)}
                            onClick={() => onStatusFilterChange('Processing_Group')}
                            styleKey="Processing"
                            icon={<ClockIcon/>}
                        />
                        <DashboardTab 
                            label="Chưa rõ nguyên nhân" 
                            count={summaryStats.chuaTimRaNguyenNhan} 
                            total={summaryStats.total}
                            isActive={filters.statusFilter === 'Chưa tìm ra nguyên nhân'}
                            onClick={() => onStatusFilterChange('Chưa tìm ra nguyên nhân')}
                            styleKey="Unknown"
                            icon={<ExclamationCircleIcon/>}
                        />
                        <DashboardTab 
                            label="Hoàn thành" 
                            count={summaryStats.hoanThanh} 
                            total={summaryStats.total}
                            isActive={filters.statusFilter === 'Hoàn thành'}
                            onClick={() => onStatusFilterChange('Hoàn thành')}
                            styleKey="Hoàn thành"
                            icon={<CheckCircleIcon/>}
                        />
                    </div>
                </div>
            </div>

            {/* 2. DATA TABLE CONTAINER */}
            <div className="flex-1 flex flex-col px-4 sm:px-6 pb-6 overflow-hidden min-h-0 w-full max-w-[1920px] mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                
                <div className="flex-1 bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col overflow-hidden ring-1 ring-white/50">
                    
                    {/* Header Bar */}
                    <div className="bg-slate-50/50 border-b border-slate-200/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 backdrop-blur-sm relative z-30">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <ListBulletIcon className="w-4 h-4 text-[#003DA5]" />
                                Danh sách khiếu nại
                            </h2>
                            <span className="bg-white/80 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-md border border-slate-200 shadow-sm backdrop-blur-sm">
                                {totalReports}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                            <div className="relative flex-1 sm:min-w-[320px] max-w-md group w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#003DA5] transition-colors">
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm mã, tên, lô..." 
                                    value={filters.searchTerm}
                                    onChange={(e) => onSearchTermChange(e.target.value)}
                                    className="pl-10 pr-4 h-10 w-full bg-white/80 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5] outline-none transition-all placeholder:text-slate-400 shadow-sm backdrop-blur-sm"
                                />
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                {/* Overdue Filter Button */}
                                {onOverdueFilterChange && (
                                    <button 
                                        onClick={() => onOverdueFilterChange(!filters.isOverdue)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${
                                            filters.isOverdue 
                                            ? 'bg-red-500 border-red-500 text-white shadow-md animate-pulse' 
                                            : 'bg-white/80 border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-300 shadow-sm backdrop-blur-sm'
                                        }`}
                                        title="Lọc phiếu quá hạn (> 7 ngày)"
                                    >
                                        <ExclamationCircleIcon className="h-5 w-5" />
                                    </button>
                                )}

                                <div className="relative">
                                    <button 
                                        onClick={() => setShowDateFilter(!showDateFilter)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${
                                            filters.dateFilter.start || filters.dateFilter.end 
                                            ? 'bg-[#003DA5] border-[#003DA5] text-white shadow-md' 
                                            : 'bg-white/80 border-slate-200 text-slate-500 hover:text-[#003DA5] hover:border-blue-300 shadow-sm backdrop-blur-sm'
                                        }`}
                                        title="Lọc theo ngày"
                                    >
                                        <CalendarIcon className="h-5 w-5" />
                                    </button>
                                    
                                    {showDateFilter && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowDateFilter(false)}></div>
                                            <div className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-5 z-50 w-72 animate-fade-in-up ring-1 ring-black/5">
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Từ ngày</label>
                                                        <input 
                                                            type="date" 
                                                            value={filters.dateFilter.start}
                                                            onChange={(e) => onDateFilterChange({...filters.dateFilter, start: e.target.value})}
                                                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-[#003DA5] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đến ngày</label>
                                                        <input 
                                                            type="date" 
                                                            value={filters.dateFilter.end}
                                                            onChange={(e) => onDateFilterChange({...filters.dateFilter, end: e.target.value})}
                                                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-[#003DA5] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="pt-2">
                                                        <button 
                                                            onClick={() => { onDateFilterChange({ start: '', end: '' }); setShowDateFilter(false); }}
                                                            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-100 active:scale-95"
                                                        >
                                                            Xóa bộ lọc
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="relative">
                                    <button 
                                        onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${
                                            viewMode === 'grid' 
                                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                            : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm backdrop-blur-sm'
                                        }`}
                                        title={viewMode === 'list' ? "Chuyển sang chế độ lưới" : "Chuyển sang chế độ danh sách"}
                                    >
                                        {viewMode === 'list' ? <Squares2X2Icon className="h-5 w-5" /> : <ListBulletIcon className="h-5 w-5" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <button 
                                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${
                                            showColumnMenu
                                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                                            : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm backdrop-blur-sm'
                                        }`}
                                        title="Tùy chỉnh cột"
                                    >
                                        <AdjustmentsIcon className="h-5 w-5" />
                                    </button>
                                    {showColumnMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)}></div>
                                            <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-3 z-50 animate-fade-in-up max-h-[400px] overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                                                <h4 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Hiển thị cột</h4>
                                                <div className="space-y-1">
                                                    {columns.map(col => (
                                                        <label key={col.id} className="flex items-center px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group select-none">
                                                            <div className="relative flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={col.visible}
                                                                    onChange={() => toggleColumn(col.id)}
                                                                    className="peer h-4 w-4 rounded border-slate-300 text-[#003DA5] focus:ring-[#003DA5] cursor-pointer opacity-0 absolute"
                                                                />
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${col.visible ? 'bg-[#003DA5] border-[#003DA5]' : 'bg-white border-slate-300 group-hover:border-[#003DA5]'}`}>
                                                                    {col.visible && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                                                </div>
                                                            </div>
                                                            <span className={`ml-3 text-xs font-bold transition-colors ${col.visible ? 'text-slate-800' : 'text-slate-500'}`}>{col.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 relative">
                        {isLoading ? (
                            <div className="p-0">
                                <table className="min-w-full border-collapse">
                                    <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-20 shadow-sm border-b border-slate-200/60 opacity-50">
                                        <tr>
                                            {columns.filter(c => c.visible).map((col) => (
                                                <th key={col.id} className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse"></div></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(8)].map((_, i) => (
                                            <SkeletonRow key={i} columns={columns} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : viewMode === 'grid' ? (
                            // GRID VIEW
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 animate-fade-in">
                                {reports.length > 0 ? (
                                    reports.map(report => (
                                        <div 
                                            key={report.id} 
                                            onClick={() => onSelectReport(report)}
                                            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden hover:-translate-y-1 relative"
                                        >
                                            {/* Image Cover */}
                                            <div className="h-36 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100 group-hover:border-blue-100 transition-colors">
                                                {report.images && report.images.length > 0 ? (
                                                    <img src={report.images[0]} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="text-slate-300 flex flex-col items-center">
                                                        <CubeIcon className="w-10 h-10 opacity-30" />
                                                        <span className="text-[0.6rem] font-bold uppercase mt-2 tracking-widest opacity-50">No Image</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 shadow-md">
                                                    {getStatusBadge(report.trangThai)}
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                     <span className="text-[0.6rem] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">{report.id}</span>
                                                     <span className={`text-[0.6rem] font-bold flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100 ${isOverdue(report.ngayPhanAnh, report.trangThai) ? 'text-red-500 border-red-100' : 'text-slate-400'}`}>
                                                        {isOverdue(report.ngayPhanAnh, report.trangThai) ? <ExclamationCircleIcon className="w-3 h-3"/> : <CalendarIcon className="w-3 h-3" />}
                                                        {formatDate(report.ngayPhanAnh)}
                                                     </span>
                                                </div>
                                                
                                                <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2 line-clamp-2 group-hover:text-[#003DA5] transition-colors" title={report.tenThuongMai}>
                                                    {report.tenThuongMai}
                                                </h3>
                                                
                                                <div className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1.5 flex-wrap">
                                                    <span className="flex items-center gap-1 text-[#003DA5] bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50 font-bold text-[0.65rem]">
                                                        <TagIcon className="w-3 h-3 opacity-70" />
                                                        {report.maSanPham}
                                                    </span>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center h-6">
                                                     <div className="flex-1 min-w-0">
                                                         {report.loaiLoi && (
                                                            <span className="text-[0.6rem] font-bold text-slate-500 truncate block bg-slate-50 px-2 py-0.5 rounded w-fit" title={report.loaiLoi}>{report.loaiLoi}</span>
                                                         )}
                                                     </div>
                                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                        {currentUserRole !== 'Kho' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                                title="Nhân bản"
                                                            >
                                                                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Xóa"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                                        <InboxIcon className="h-10 w-10 opacity-20 mb-2" />
                                        <p className="text-sm font-bold">Không tìm thấy dữ liệu</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // LIST VIEW
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block h-full">
                                    <table className="min-w-full border-collapse" style={{ fontFamily: 'inherit', fontSize: '1rem' }}>
                                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-20 shadow-sm border-b border-slate-200/60">
                                            <tr>
                                                {columns.filter(c => c.visible).map((col, idx, arr) => {
                                                    const isSortable = onSort && ['ngayPhanAnh', 'maSanPham', 'tenThuongMai', 'trangThai', 'soLo', 'nhanHang', 'duration'].includes(col.id);
                                                    const isSorted = sortConfig?.key === col.id;
                                                    const sortDirection = sortConfig?.direction;
                                                    const headerAlign = col.headerAlign || col.align || 'left';

                                                    return (
                                                        <th 
                                                            key={col.id}
                                                            scope="col"
                                                            className={`px-4 py-4 text-left text-[0.6875rem] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap relative
                                                                ${col.fixed ? 'sticky right-0 bg-slate-50/90 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.02)] z-30' : ''}
                                                                ${isSortable ? 'cursor-pointer hover:bg-slate-100/50 hover:text-slate-900 transition-colors select-none group' : ''}
                                                            `}
                                                            style={{ width: col.width, textAlign: headerAlign }}
                                                            onClick={() => isSortable && onSort && onSort(col.id)}
                                                        >
                                                            <div className={`flex items-center gap-1.5 ${headerAlign === 'center' ? 'justify-center' : headerAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                                                                {col.label}
                                                                {isSortable && (
                                                                    <span className={`transition-opacity duration-200 ${isSorted ? 'opacity-100 text-[#003DA5]' : 'opacity-30 group-hover:opacity-60'}`}>
                                                                        <div className="flex flex-col -space-y-1">
                                                                            <ArrowUpIcon className={`w-2 h-2 ${isSorted && sortDirection === 'asc' ? 'text-[#003DA5]' : 'text-slate-400'}`} />
                                                                            <ArrowDownIcon className={`w-2 h-2 ${isSorted && sortDirection === 'desc' ? 'text-[#003DA5]' : 'text-slate-400'}`} />
                                                                        </div>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {idx < arr.length - 1 && (
                                                                <div className="absolute right-0 top-1/3 h-1/3 w-px bg-slate-300/30"></div>
                                                            )}
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-slate-100/60">
                                            {reports.length > 0 ? (
                                                reports.map((report, index) => (
                                                    <tr 
                                                        key={report.id} 
                                                        onClick={() => onSelectReport(report)}
                                                        className={`hover:bg-blue-50/30 transition-colors group cursor-pointer border-b border-slate-50 ${selectedReport?.id === report.id ? 'bg-blue-50/60' : 'bg-white/40 odd:bg-slate-50/30'}`}
                                                    >
                                                        {columns.filter(c => c.visible).map(col => (
                                                            <td 
                                                                key={col.id} 
                                                                className={`px-4 py-3 align-middle text-sm relative ${col.fixed ? 'sticky right-0 bg-white/90 group-hover:bg-blue-50/90 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.02)]' : ''}`}
                                                                style={{ textAlign: col.cellAlign || col.align || 'left' }}
                                                            >
                                                                {renderCell(report, col.id, index)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={columns.filter(c => c.visible).length} className="px-6 py-16 text-center text-slate-400">
                                                        <InboxIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                        <p className="font-bold text-sm">Không tìm thấy dữ liệu</p>
                                                        <p className="text-xs opacity-60 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List View */}
                                <div className="md:hidden space-y-3 p-4">
                                    {reports.length > 0 ? (
                                        reports.map(report => (
                                            <div 
                                                key={report.id} 
                                                onClick={() => onSelectReport(report)}
                                                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-[#003DA5] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{report.maSanPham}</span>
                                                    </div>
                                                    {getStatusBadge(report.trangThai)}
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1">{report.tenThuongMai}</h3>
                                                <div className="text-xs text-slate-500 mb-2 line-clamp-1">{report.noiDungPhanAnh}</div>
                                                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-2 mt-2">
                                                    <span className={`flex items-center gap-1 ${isOverdue(report.ngayPhanAnh, report.trangThai) ? 'text-red-500 font-bold' : ''}`}>
                                                        {isOverdue(report.ngayPhanAnh, report.trangThai) ? <ExclamationCircleIcon className="w-3 h-3"/> : null}
                                                        {formatDate(report.ngayPhanAnh)}
                                                    </span>
                                                    {/* Mobile Duration */}
                                                    <span className="font-bold text-slate-500">
                                                        {getProcessingDays(report.ngayPhanAnh, report.ngayHoanThanh)} ngày
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <InboxIcon className="h-10 w-10 opacity-20 mb-2" />
                                            <p className="text-sm font-bold">Không tìm thấy dữ liệu</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-slate-200/60 bg-white/60 backdrop-blur-md px-5 py-3 flex-shrink-0">
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={totalReports}
                            itemsPerPage={itemsPerPage}
                            onPageChange={onPageChange}
                            onItemsPerPageChange={onItemsPerPageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefectReportList;