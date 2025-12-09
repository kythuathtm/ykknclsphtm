import React, { useState, useEffect, useMemo } from 'react';
import { DefectReport, UserRole } from '../types';
import { 
  FunnelIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, 
  TrashIcon, DocumentDuplicateIcon, PencilIcon, 
  CalendarIcon, AdjustmentsIcon, EyeIcon, 
  CheckCircleIcon, WrenchIcon, ShoppingBagIcon, 
  TagIcon, UserIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon,
  ChartPieIcon, InboxIcon, ExclamationCircleIcon,
  ListBulletIcon
} from './Icons';
import Pagination from './Pagination';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean;
}

// Default Configuration based on user request
const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: 'STT', visible: true, width: 60, align: 'center' },
    { id: 'ngayPhanAnh', label: 'Ngày khiếu nại', visible: true, width: 130, align: 'left' },
    { id: 'maSanPham', label: 'Mã sản phẩm', visible: true, width: 120, align: 'left' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, width: 220, align: 'left' }, 
    { id: 'noiDungPhanAnh', label: 'Nội dung khiếu nại', visible: true, width: 280, align: 'left' },
    { id: 'soLo', label: 'Số lô', visible: true, width: 100, align: 'left' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: true, width: 100, align: 'left' },
    { id: 'hanDung', label: 'Hạn dùng', visible: false, width: 110, align: 'left' },
    { id: 'donViTinh', label: 'ĐVT', visible: false, width: 80, align: 'center' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, width: 150, align: 'center' },
    { id: 'actions', label: '', visible: true, width: 80, align: 'center', fixed: true },
];

interface FilterState {
    searchTerm: string;
    statusFilter: string;
    defectTypeFilter: string;
    yearFilter: string;
    dateFilter: { start: string, end: string };
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
  summaryStats: any;
  isLoading: boolean;
  onExport: () => void;
  onDuplicate: (report: DefectReport) => void;
  baseFontSize?: string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}

// Helper to format date string YYYY-MM-DD to DD/MM/YYYY
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

// --- Style Configuration for Dashboard Tabs ---
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
    barColor: string 
}> = {
    'All': {
        wrapper: 'border-slate-100 hover:border-slate-200 hover:bg-slate-50',
        activeWrapper: 'bg-slate-50 border-slate-300 ring-1 ring-slate-200',
        iconBg: 'bg-slate-100',
        activeIconBg: 'bg-white shadow-sm',
        iconColor: 'text-slate-400',
        activeIconColor: 'text-slate-600',
        text: 'text-slate-500',
        activeText: 'text-slate-800',
        barColor: 'bg-slate-400'
    },
    'Mới': {
        wrapper: 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/50',
        activeWrapper: 'bg-blue-50 border-blue-200 ring-1 ring-blue-100',
        iconBg: 'bg-blue-50',
        activeIconBg: 'bg-white shadow-sm',
        iconColor: 'text-blue-400',
        activeIconColor: 'text-blue-600',
        text: 'text-slate-500',
        activeText: 'text-blue-700',
        barColor: 'bg-blue-500'
    },
    'Processing': {
        wrapper: 'border-slate-100 hover:border-amber-200 hover:bg-amber-50/50',
        activeWrapper: 'bg-amber-50 border-amber-200 ring-1 ring-amber-100',
        iconBg: 'bg-amber-50',
        activeIconBg: 'bg-white shadow-sm',
        iconColor: 'text-amber-400',
        activeIconColor: 'text-amber-600',
        text: 'text-slate-500',
        activeText: 'text-amber-700',
        barColor: 'bg-amber-500'
    },
    'Unknown': {
        wrapper: 'border-slate-100 hover:border-purple-200 hover:bg-purple-50/50',
        activeWrapper: 'bg-purple-50 border-purple-200 ring-1 ring-purple-100',
        iconBg: 'bg-purple-50',
        activeIconBg: 'bg-white shadow-sm',
        iconColor: 'text-purple-400',
        activeIconColor: 'text-purple-600',
        text: 'text-slate-500',
        activeText: 'text-purple-700',
        barColor: 'bg-purple-500'
    },
    'Hoàn thành': {
        wrapper: 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50',
        activeWrapper: 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100',
        iconBg: 'bg-emerald-50',
        activeIconBg: 'bg-white shadow-sm',
        iconColor: 'text-emerald-400',
        activeIconColor: 'text-emerald-600',
        text: 'text-slate-500',
        activeText: 'text-emerald-700',
        barColor: 'bg-emerald-500'
    }
};

const DashboardTab = ({ label, count, total, isActive, onClick, styleKey, icon }: { label: string, count: number, total: number, isActive: boolean, onClick: () => void, styleKey: TabStyleKey, icon?: React.ReactNode }) => {
    const styles = TAB_STYLES[styleKey];
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <button 
            onClick={onClick}
            className={`
                relative flex flex-col justify-between px-4 py-3 rounded-2xl transition-all duration-300 select-none min-w-[120px] flex-1 lg:flex-none border text-left h-24
                ${isActive ? styles.activeWrapper + ' shadow-sm transform -translate-y-0.5' : styles.wrapper}
            `}
        >
            <div className="flex items-start justify-between w-full mb-2">
                <div className={`
                    p-1.5 rounded-lg transition-colors
                    ${isActive ? styles.activeIconBg : styles.iconBg}
                    ${isActive ? styles.activeIconColor : styles.iconColor}
                `}>
                    {icon && React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                </div>
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider mt-1 ${isActive ? styles.activeText : styles.text}`}>
                    {label}
                </span>
            </div>
            
            <div>
                <span className={`text-2xl font-black leading-none tracking-tight ${isActive ? styles.activeText : 'text-slate-700'}`}>
                    {count.toLocaleString()}
                </span>
                
                {/* Mini Progress Bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.barColor}`} 
                        style={{ width: `${percentage}%`, opacity: isActive ? 1 : 0.6 }}
                    ></div>
                </div>
            </div>
        </button>
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
  summaryStats,
  isLoading,
  onExport,
  onDuplicate,
  baseFontSize = '15px',
  sortConfig,
  onSort
}) => {
    // State for column customization
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Load columns from local storage on mount
    useEffect(() => {
        const savedColumns = localStorage.getItem(`columns_${currentUsername}`);
        if (savedColumns) {
            try {
                const parsed = JSON.parse(savedColumns);
                // Merge with default to ensure new columns appear
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

    // Save columns to local storage
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
                return <span className="font-bold text-slate-400 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
            case 'ngayPhanAnh':
                return (
                    <div>
                        <span className="block font-bold text-slate-700 tabular-nums" style={{ fontSize: 'inherit' }}>{formatDate(report.ngayPhanAnh)}</span>
                        <span className="text-[0.6rem] text-slate-400 font-bold bg-slate-100 px-1.5 rounded inline-block mt-0.5 border border-slate-200">#{report.id.split('-')[1] || report.id}</span>
                    </div>
                );
            case 'maSanPham':
                return (
                    <span className="font-bold text-slate-800 text-xs">
                        {report.maSanPham}
                    </span>
                );
            case 'tenThuongMai':
                return (
                    <div className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#003DA5] transition-colors" title={report.tenThuongMai} style={{ fontSize: 'inherit' }}>
                        {report.tenThuongMai}
                    </div>
                );
            case 'noiDungPhanAnh':
                return (
                    <div className="text-slate-600 line-clamp-2 text-sm italic leading-relaxed" title={report.noiDungPhanAnh}>
                        {report.noiDungPhanAnh}
                    </div>
                );
            case 'soLo':
                return <span className="font-bold text-slate-800 text-xs">{report.soLo}</span>;
            case 'maNgaySanXuat':
                return <span className="font-bold text-slate-800 text-xs">{report.maNgaySanXuat}</span>;
            case 'hanDung':
                return <span className="text-slate-600 font-medium text-xs">{formatDate(report.hanDung)}</span>;
            case 'donViTinh':
                return <span className="text-slate-600 text-xs font-medium">{report.donViTinh}</span>;
            case 'trangThai':
                return getStatusBadge(report.trangThai);
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelectReport(report); }}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                            title="Xem chi tiết"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                        {currentUserRole !== 'Kho' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                className="p-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                title="Nhân bản"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                        )}
                        {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
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
        <div className="h-full flex flex-col bg-[#F8FAFC]" style={{ fontSize: baseFontSize }}>
            
            {/* MIDDLE: COMBINED DASHBOARD & SEARCH TOOLBAR (STICKY) */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] flex flex-col xl:flex-row xl:items-center px-4 sm:px-6 py-4 gap-4 transition-all">
                
                {/* 1. DASHBOARD TABS (Mini-Dashboard) */}
                <div className="flex-1 overflow-x-auto custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex gap-3 min-w-max pb-1">
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
                            label="Chưa rõ NN" 
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

                {/* 2. SEARCH & FILTER (Right on Desktop) */}
                <div className="flex items-center gap-3 w-full xl:w-auto xl:pl-4 xl:border-l border-slate-200">
                    <div className="relative flex-1 xl:w-72 group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#003DA5] transition-colors">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm phiếu, mã SP..." 
                            value={filters.searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5] shadow-inner outline-none transition-all placeholder:text-slate-400 focus:bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Date Filter */}
                        <div className="relative">
                             <button 
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                className={`flex items-center justify-center w-10 h-10 border rounded-xl transition-all shadow-sm active:scale-95 ${
                                    filters.dateFilter.start || filters.dateFilter.end 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                                title="Lọc theo ngày"
                             >
                                <CalendarIcon className="h-5 w-5" />
                             </button>
                             
                             {showDateFilter && (
                                 <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 w-72 animate-fade-in-up ring-1 ring-black/5">
                                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Khoảng thời gian</h4>
                                     <div className="space-y-3">
                                         <div>
                                             <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Từ ngày</label>
                                             <input 
                                                type="date" 
                                                value={filters.dateFilter.start}
                                                onChange={(e) => onDateFilterChange({...filters.dateFilter, start: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/10"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đến ngày</label>
                                             <input 
                                                type="date" 
                                                value={filters.dateFilter.end}
                                                onChange={(e) => onDateFilterChange({...filters.dateFilter, end: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/10"
                                             />
                                         </div>
                                         <button 
                                            onClick={() => { onDateFilterChange({ start: '', end: '' }); setShowDateFilter(false); }}
                                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors mt-2"
                                         >
                                             Xóa bộ lọc
                                     </button>
                                 </div>
                             </div>
                         )}
                        </div>

                        {/* Columns Toggle */}
                        <div className="relative">
                             <button 
                                onClick={() => setShowColumnMenu(!showColumnMenu)}
                                className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                                title="Tùy chỉnh cột"
                             >
                                 <AdjustmentsIcon className="h-5 w-5" />
                             </button>
                             {showColumnMenu && (
                                 <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in-up max-h-[400px] overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                                     <h4 className="text-xs font-bold text-slate-400 uppercase px-4 py-2 border-b border-slate-50 mb-1">Hiển thị cột</h4>
                                     {columns.map(col => (
                                         <label key={col.id} className="flex items-center px-4 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                             <input 
                                                type="checkbox" 
                                                checked={col.visible}
                                                onChange={() => toggleColumn(col.id)}
                                                className="rounded border-slate-300 text-[#003DA5] focus:ring-[#003DA5] cursor-pointer"
                                             />
                                             <span className="ml-3 text-sm text-slate-700 font-medium group-hover:text-slate-900">{col.label}</span>
                                         </label>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            {/* 3. DATA TABLE LIST */}
            <div className="hidden md:block flex-1 overflow-auto custom-scrollbar px-4 sm:px-6 py-6">
                <div className="bg-white border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden min-w-full inline-block align-middle ring-1 ring-black/5">
                     <table className="min-w-full divide-y divide-slate-100" style={{ fontFamily: 'inherit', fontSize: '1rem' }}>
                         <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10">
                             <tr>
                                 {columns.filter(c => c.visible).map((col) => {
                                     const isSortable = onSort && ['ngayPhanAnh', 'maSanPham', 'tenThuongMai', 'trangThai', 'soLo'].includes(col.id);
                                     const isSorted = sortConfig?.key === col.id;
                                     const sortDirection = sortConfig?.direction;

                                     return (
                                         <th 
                                            key={col.id}
                                            scope="col"
                                            className={`px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap 
                                                ${col.fixed ? 'sticky right-0 bg-slate-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]' : ''}
                                                ${isSortable ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors select-none group' : ''}
                                            `}
                                            style={{ width: col.width, textAlign: col.align || 'left' }}
                                            onClick={() => isSortable && onSort && onSort(col.id)}
                                         >
                                             <div className={`flex items-center gap-1.5 ${col.align === 'center' ? 'justify-center' : ''}`}>
                                                 {col.label}
                                                 {isSortable && (
                                                     <span className={`transition-opacity duration-200 ${isSorted ? 'opacity-100 text-[#003DA5]' : 'opacity-0 group-hover:opacity-40'}`}>
                                                         {isSorted && sortDirection === 'desc' ? <ArrowDownIcon className="w-3 h-3" /> : <ArrowUpIcon className="w-3 h-3" />}
                                                     </span>
                                                 )}
                                             </div>
                                         </th>
                                     );
                                 })}
                             </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-slate-50">
                             {isLoading ? (
                                 [...Array(5)].map((_, i) => (
                                     <tr key={i} className="animate-pulse">
                                         {columns.filter(c => c.visible).map((c, j) => (
                                             <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                         ))}
                                     </tr>
                                 ))
                             ) : reports.length > 0 ? (
                                 reports.map((report, index) => (
                                     <tr 
                                        key={report.id} 
                                        onClick={() => onSelectReport(report)}
                                        className={`group hover:bg-blue-50/40 transition-all duration-200 cursor-pointer ${selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-l-[#003DA5]' : ''}`}
                                     >
                                         {columns.filter(c => c.visible).map((col) => (
                                             <td 
                                                key={`${report.id}-${col.id}`} 
                                                className={`px-4 py-3.5 align-top text-sm ${col.fixed ? 'sticky right-0 bg-white group-hover:bg-blue-50/40 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]' : ''}`}
                                                style={{ textAlign: col.align || 'left' }}
                                             >
                                                 {renderCell(report, col.id, index)}
                                             </td>
                                         ))}
                                     </tr>
                                 ))
                             ) : (
                                 <tr>
                                     <td colSpan={columns.filter(c => c.visible).length} className="px-6 py-24 text-center text-slate-400">
                                         <div className="flex flex-col items-center justify-center">
                                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                <InboxIcon className="h-10 w-10 opacity-30" />
                                             </div>
                                             <p className="text-sm font-bold text-slate-500">Không tìm thấy dữ liệu</p>
                                             <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc</p>
                                         </div>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex-1 overflow-auto custom-scrollbar p-4 space-y-4" style={{ fontSize: '0.875rem' }}>
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-pulse">
                            <div className="flex justify-between items-center mb-3">
                                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                                <div className="h-5 bg-slate-100 rounded w-1/4"></div>
                            </div>
                            <div className="h-6 bg-slate-100 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-slate-50 rounded w-1/2 mb-3"></div>
                            <div className="h-16 bg-slate-50 rounded w-full mb-3"></div>
                        </div>
                    ))
                ) : reports.length > 0 ? (
                    reports.map((report, index) => (
                        <div 
                            key={report.id} 
                            onClick={() => onSelectReport(report)} 
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 active:scale-[0.98] transition-all flex flex-col gap-3 animate-fade-in-up ring-1 ring-black/5"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="text-[0.65rem] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                        #{report.id.split('-')[1] || report.id}
                                    </span>
                                    <span className="text-[0.65rem] font-bold text-slate-400 flex items-center gap-1">
                                         <CalendarIcon className="w-3 h-3"/> {formatDate(report.ngayPhanAnh)}
                                    </span>
                                </div>
                                {getStatusBadge(report.trangThai)}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                     <span className="font-bold text-[#003DA5] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 text-xs">{report.maSanPham}</span>
                                     {report.soLo && (
                                        <span className="font-semibold text-slate-500 text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Lô: {report.soLo}</span>
                                     )}
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{report.tenThuongMai}</h3>
                            </div>

                            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic line-clamp-2 leading-relaxed">
                                "{report.noiDungPhanAnh}"
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-3 mt-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSelectReport(report); }}
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                >
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                                {currentUserRole !== 'Kho' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                        className="p-2 text-slate-500 bg-slate-50 hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        <DocumentDuplicateIcon className="w-5 h-5" />
                                    </button>
                                )}
                                {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <InboxIcon className="h-16 w-16 opacity-20 mb-4" />
                        <p className="text-sm font-bold">Không tìm thấy dữ liệu.</p>
                    </div>
                )}
            </div>

            {/* 5. Footer Pagination */}
            <div className="bg-white border-t border-slate-200 px-4 py-4 sm:px-6 sticky bottom-0 z-20 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.03)]">
                 <Pagination 
                    currentPage={currentPage}
                    totalItems={totalReports}
                    itemsPerPage={itemsPerPage}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                 />
            </div>
        </div>
    );
};

export default React.memo(DefectReportList);