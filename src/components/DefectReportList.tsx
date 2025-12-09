
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

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: 'STT', visible: true, width: 60, align: 'center' },
    { id: 'ngayPhanAnh', label: 'Ngày khiếu nại', visible: true, width: 110, align: 'left' },
    { id: 'maSanPham', label: 'Mã sản phẩm', visible: true, width: 100, align: 'left' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, width: 220, align: 'left' }, 
    { id: 'noiDungPhanAnh', label: 'Nội dung khiếu nại', visible: true, width: 280, align: 'left' },
    { id: 'soLo', label: 'Số lô', visible: true, width: 90, align: 'left' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: true, width: 90, align: 'left' },
    { id: 'hanDung', label: 'Hạn dùng', visible: false, width: 110, align: 'left' },
    { id: 'donViTinh', label: 'ĐVT', visible: false, width: 80, align: 'center' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, width: 140, align: 'center' },
    { id: 'actions', label: '', visible: true, width: 90, align: 'center', fixed: true },
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
        wrapper: 'bg-white border border-transparent hover:border-slate-200 shadow-sm hover:shadow',
        activeWrapper: 'bg-white ring-2 ring-slate-200 border-transparent shadow-md',
        iconBg: 'bg-slate-100',
        activeIconBg: 'bg-slate-800',
        iconColor: 'text-slate-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-slate-800',
        barColor: 'bg-slate-800'
    },
    'Mới': {
        wrapper: 'bg-white border border-transparent hover:border-blue-200 shadow-sm hover:shadow',
        activeWrapper: 'bg-white ring-2 ring-blue-100 border-transparent shadow-md',
        iconBg: 'bg-blue-50',
        activeIconBg: 'bg-blue-600',
        iconColor: 'text-blue-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-blue-700',
        barColor: 'bg-blue-600'
    },
    'Processing': {
        wrapper: 'bg-white border border-transparent hover:border-amber-200 shadow-sm hover:shadow',
        activeWrapper: 'bg-white ring-2 ring-amber-100 border-transparent shadow-md',
        iconBg: 'bg-amber-50',
        activeIconBg: 'bg-amber-500',
        iconColor: 'text-amber-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-amber-700',
        barColor: 'bg-amber-500'
    },
    'Unknown': {
        wrapper: 'bg-white border border-transparent hover:border-purple-200 shadow-sm hover:shadow',
        activeWrapper: 'bg-white ring-2 ring-purple-100 border-transparent shadow-md',
        iconBg: 'bg-purple-50',
        activeIconBg: 'bg-purple-600',
        iconColor: 'text-purple-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-purple-700',
        barColor: 'bg-purple-600'
    },
    'Hoàn thành': {
        wrapper: 'bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow',
        activeWrapper: 'bg-white ring-2 ring-emerald-100 border-transparent shadow-md',
        iconBg: 'bg-emerald-50',
        activeIconBg: 'bg-emerald-600',
        iconColor: 'text-emerald-400',
        activeIconColor: 'text-white',
        text: 'text-slate-500',
        activeText: 'text-emerald-700',
        barColor: 'bg-emerald-600'
    }
};

const DashboardTab = ({ label, count, total, isActive, onClick, styleKey, icon }: { label: string, count: number, total: number, isActive: boolean, onClick: () => void, styleKey: TabStyleKey, icon?: React.ReactNode }) => {
    const styles = TAB_STYLES[styleKey];
    
    return (
        <button 
            onClick={onClick}
            className={`
                relative flex flex-col justify-between px-4 py-3 rounded-2xl transition-all duration-300 select-none w-full h-[88px] group
                ${isActive ? styles.activeWrapper + ' scale-[1.02] shadow-md z-10' : styles.wrapper}
            `}
        >
            <div className="flex justify-between items-start w-full">
                <span className={`text-[0.65rem] font-bold uppercase tracking-widest leading-tight ${isActive ? styles.activeText : styles.text}`}>
                    {label}
                </span>
                <div className={`p-1.5 rounded-lg transition-colors duration-300 ${isActive ? styles.activeIconBg : styles.iconBg} ${isActive ? styles.activeIconColor : styles.iconColor}`}>
                    {icon && React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" })}
                </div>
            </div>
            
            <div className="flex items-end justify-between w-full mt-auto">
                <span className={`text-2xl font-bold leading-none tracking-tight tabular-nums ${isActive ? styles.activeText : 'text-slate-700'}`}>
                    {count.toLocaleString()}
                </span>
                {isActive && (
                    <div className={`h-1 w-8 rounded-full ${styles.barColor}`}></div>
                )}
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
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [showDateFilter, setShowDateFilter] = useState(false);

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
                return <span className="font-medium text-slate-700 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
            case 'ngayPhanAnh':
                return (
                    <div>
                        <span className="block font-medium text-slate-700 tabular-nums text-sm" style={{ fontSize: 'inherit' }}>{formatDate(report.ngayPhanAnh)}</span>
                        <span className="text-[0.6rem] text-slate-400 font-bold bg-slate-50 px-1.5 rounded inline-block mt-0.5 border border-slate-100 tracking-wider">{report.id}</span>
                    </div>
                );
            case 'maSanPham':
                return (
                    <span className="font-medium text-slate-700 group-hover:text-[#C5003E] transition-colors">
                        {report.maSanPham}
                    </span>
                );
            case 'tenThuongMai':
                return (
                    <div className="font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-[#003DA5] transition-colors" title={report.tenThuongMai} style={{ fontSize: 'inherit' }}>
                        {report.tenThuongMai}
                    </div>
                );
            case 'noiDungPhanAnh':
                return (
                    <div className="text-slate-500 line-clamp-2 text-sm italic leading-relaxed" title={report.noiDungPhanAnh}>
                        {report.noiDungPhanAnh}
                    </div>
                );
            case 'soLo':
                return <span className="font-bold text-slate-700 tabular-nums">{report.soLo}</span>;
            case 'maNgaySanXuat':
                return <span className="font-bold text-slate-700 tabular-nums">{report.maNgaySanXuat}</span>;
            case 'hanDung':
                return <span className="text-slate-600 font-medium text-xs tabular-nums">{formatDate(report.hanDung)}</span>;
            case 'donViTinh':
                return <span className="text-slate-600 text-xs font-medium bg-slate-50 px-2 py-1 rounded-md">{report.donViTinh}</span>;
            case 'trangThai':
                return getStatusBadge(report.trangThai);
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
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
            
            {/* 1. DASHBOARD CONTAINER */}
            <div className="flex-shrink-0 w-full py-4 z-10 bg-[#F8FAFC]">
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
            <div className="flex-1 flex flex-col px-4 sm:px-6 pb-6 overflow-hidden min-h-0 w-full max-w-[1920px] mx-auto">
                
                {/* Header Row: Title & Search/Filter Combined */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
                    
                    {/* Name of Data Table */}
                    <div className="flex items-center gap-3 pl-1">
                        <div className="p-2 bg-[#003DA5] text-white rounded-lg shadow-sm shadow-blue-900/20">
                            <ListBulletIcon className="w-5 h-5"/>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-tight whitespace-nowrap">DANH SÁCH KHIẾU NẠI</h2>
                        <span className="hidden sm:inline-flex bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            {totalReports}
                        </span>
                    </div>

                    {/* Search / Filter Group */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 sm:min-w-[280px] lg:min-w-[320px] group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#003DA5] transition-colors">
                                <MagnifyingGlassIcon className="h-4 w-4" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm phiếu..." 
                                value={filters.searchTerm}
                                onChange={(e) => onSearchTermChange(e.target.value)}
                                className="pl-9 pr-3 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowDateFilter(!showDateFilter)}
                                    className={`flex items-center justify-center h-full px-4 py-2.5 border rounded-xl transition-all shadow-sm active:scale-95 gap-2 text-sm font-bold whitespace-nowrap ${
                                        filters.dateFilter.start || filters.dateFilter.end 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                    title="Lọc theo ngày"
                                >
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Thời gian</span>
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

                            <div className="relative">
                                <button 
                                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                                    className="flex items-center justify-center h-full px-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
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
                                                <span className="ml-3 text-sm text-slate-700 font-bold group-hover:text-slate-900">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Content (Table + List) */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ring-1 ring-black/5 relative">
                    
                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block flex-1 overflow-auto custom-scrollbar">
                        <table className="min-w-full" style={{ fontFamily: 'inherit', fontSize: '1rem', borderCollapse: 'separate', borderSpacing: '0 0' }}>
                            <thead className="bg-slate-50 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                                <tr>
                                    {columns.filter(c => c.visible).map((col) => {
                                        const isSortable = onSort && ['ngayPhanAnh', 'maSanPham', 'tenThuongMai', 'trangThai', 'soLo'].includes(col.id);
                                        const isSorted = sortConfig?.key === col.id;
                                        const sortDirection = sortConfig?.direction;

                                        return (
                                            <th 
                                                key={col.id}
                                                scope="col"
                                                className={`px-4 py-4 text-left text-[0.6875rem] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap border-b border-slate-200
                                                    ${col.fixed ? 'sticky right-0 bg-slate-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.02)]' : ''}
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
                            <tbody className="bg-white divide-y divide-slate-100">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {columns.filter(c => c.visible).map((col, j) => (
                                                <td key={j} className="px-4 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    reports.map((report, index) => (
                                        <tr 
                                            key={report.id} 
                                            onClick={() => onSelectReport(report)}
                                            className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${selectedReport?.id === report.id ? 'bg-blue-50' : ''}`}
                                        >
                                            {columns.filter(c => c.visible).map((col) => (
                                                <td 
                                                    key={col.id} 
                                                    className={`px-4 py-3 align-middle border-b border-slate-50 ${
                                                        col.fixed ? 'sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.02)]' : ''
                                                    }`}
                                                    style={{ textAlign: col.align || 'left', width: col.width }}
                                                >
                                                    {renderCell(report, col.id, index)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        
                        {reports.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <div className="bg-slate-50 p-4 rounded-full mb-3">
                                    <InboxIcon className="h-10 w-10 opacity-30" />
                                </div>
                                <p className="text-sm font-bold">Không tìm thấy dữ liệu</p>
                                <p className="text-xs opacity-70 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                            </div>
                        )}
                    </div>

                    {/* MOBILE LIST VIEW */}
                    <div className="md:hidden flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-32"></div>
                            ))
                        ) : reports.length > 0 ? (
                            reports.map((report) => (
                                <div 
                                    key={report.id}
                                    onClick={() => onSelectReport(report)}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:scale-[0.98] transition-all relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[0.6rem] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{report.id}</span>
                                        {getStatusBadge(report.trangThai)}
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{report.tenThuongMai}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                        <span className="font-medium text-[#003DA5]">{report.maSanPham}</span>
                                        <span>•</span>
                                        <span>{formatDate(report.ngayPhanAnh)}</span>
                                    </div>
                                    {report.loaiLoi && (
                                        <div className="inline-block text-[0.6rem] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-100">
                                            {report.loaiLoi}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <InboxIcon className="h-10 w-10 opacity-30 mb-2" />
                                <p className="text-xs font-bold">Không có dữ liệu</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-200 bg-white z-10 flex-shrink-0">
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

export default React.memo(DefectReportList);
