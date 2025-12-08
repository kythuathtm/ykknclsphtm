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

// Simplified Dashboard Summary Tab
const DashboardTab = ({ label, count, isActive, onClick, colorClass, icon }: { label: string, count: number, isActive: boolean, onClick: () => void, colorClass: string, icon?: React.ReactNode }) => (
    <button 
        onClick={onClick}
        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 select-none min-w-[140px] flex-1 md:flex-none ${isActive ? `bg-white border-${colorClass.split('-')[1]}-200 shadow-md transform -translate-y-0.5` : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
    >
        <div className={`p-1.5 rounded-lg ${isActive ? `bg-${colorClass.split('-')[1]}-50 text-${colorClass.split('-')[1]}-600` : 'bg-slate-100 text-slate-400'}`}>
            {icon}
        </div>
        <div className="text-left">
            <span className="block text-[0.6rem] font-bold uppercase text-slate-400 tracking-wider leading-tight">{label}</span>
            <span className={`block text-lg font-black leading-none mt-0.5 ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{count}</span>
        </div>
        {isActive && <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-${colorClass.split('-')[1]}-500`}></div>}
    </button>
);

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
            case 'Mới': style = 'bg-blue-50 text-blue-700 border-blue-200'; break;
            case 'Đang tiếp nhận': style = 'bg-indigo-50 text-indigo-700 border-indigo-200'; break;
            case 'Đang xác minh': style = 'bg-cyan-50 text-cyan-700 border-cyan-200'; break;
            case 'Đang xử lý': style = 'bg-amber-50 text-amber-700 border-amber-200'; break;
            case 'Chưa tìm ra nguyên nhân': style = 'bg-purple-50 text-purple-700 border-purple-200'; break;
            case 'Hoàn thành': style = 'bg-emerald-50 text-emerald-700 border-emerald-200'; break;
        }
        return (
            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md border text-[0.65rem] font-bold uppercase tracking-wide whitespace-nowrap shadow-sm ${style}`}>
                {status}
            </span>
        );
    };

    const renderCell = (report: DefectReport, columnId: string, index: number) => {
        switch (columnId) {
            case 'stt':
                return <span className="font-medium text-slate-500 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
            case 'ngayPhanAnh':
                return (
                    <div>
                        <span className="block font-bold text-slate-700" style={{ fontSize: 'inherit' }}>{formatDate(report.ngayPhanAnh)}</span>
                        <span className="text-[0.6rem] text-slate-400 font-mono bg-slate-50 px-1 rounded inline-block mt-0.5">#{report.id}</span>
                    </div>
                );
            case 'maSanPham':
                return (
                    <span className="font-bold text-[#003DA5] bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50 text-xs font-mono">
                        {report.maSanPham}
                    </span>
                );
            case 'tenThuongMai':
                return (
                    <div className="font-bold text-slate-800 line-clamp-2" title={report.tenThuongMai} style={{ fontSize: 'inherit' }}>
                        {report.tenThuongMai}
                    </div>
                );
            case 'noiDungPhanAnh':
                return (
                    <div className="text-slate-600 line-clamp-2 text-sm italic" title={report.noiDungPhanAnh}>
                        {report.noiDungPhanAnh}
                    </div>
                );
            case 'soLo':
                return <span className="font-semibold text-slate-600 font-mono text-xs">{report.soLo}</span>;
            case 'maNgaySanXuat':
                return <span className="text-slate-600 font-mono">{report.maNgaySanXuat}</span>;
            case 'hanDung':
                return <span className="text-slate-600 font-mono">{formatDate(report.hanDung)}</span>;
            case 'donViTinh':
                return <span className="text-slate-600">{report.donViTinh}</span>;
            case 'trangThai':
                return getStatusBadge(report.trangThai);
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelectReport(report); }}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                        {currentUserRole !== 'Kho' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                className="p-2 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Nhân bản"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                        )}
                        {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
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
            
            {/* STICKY HEADER SECTION: DASHBOARD + SEARCH */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm flex flex-col">
                
                {/* 1. DASHBOARD SUMMARY TABS (Horizontal Scroll) */}
                <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-white">
                    <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                        <DashboardTab 
                            label="Tổng phiếu" 
                            count={summaryStats.total} 
                            isActive={filters.statusFilter === 'All'}
                            onClick={() => onStatusFilterChange('All')}
                            colorClass="text-slate-600"
                            icon={<InboxIcon className="w-4 h-4"/>}
                        />
                        <DashboardTab 
                            label="Mới" 
                            count={summaryStats.moi} 
                            isActive={filters.statusFilter === 'Mới'}
                            onClick={() => onStatusFilterChange('Mới')}
                            colorClass="text-blue-600"
                            icon={<TagIcon className="w-4 h-4"/>}
                        />
                        <DashboardTab 
                            label="Đang xử lý" 
                            count={summaryStats.dangXuLy + summaryStats.dangTiepNhan + summaryStats.dangXacMinh} 
                            isActive={filters.statusFilter === 'Processing_Group' || ['Đang tiếp nhận', 'Đang xác minh', 'Đang xử lý'].includes(filters.statusFilter)}
                            onClick={() => onStatusFilterChange('Processing_Group')}
                            colorClass="text-amber-600"
                            icon={<ClockIcon className="w-4 h-4"/>}
                        />
                        <DashboardTab 
                            label="Chưa rõ NN" 
                            count={summaryStats.chuaTimRaNguyenNhan} 
                            isActive={filters.statusFilter === 'Chưa tìm ra nguyên nhân'}
                            onClick={() => onStatusFilterChange('Chưa tìm ra nguyên nhân')}
                            colorClass="text-purple-600"
                            icon={<ExclamationCircleIcon className="w-4 h-4"/>}
                        />
                        <DashboardTab 
                            label="Hoàn thành" 
                            count={summaryStats.hoanThanh} 
                            isActive={filters.statusFilter === 'Hoàn thành'}
                            onClick={() => onStatusFilterChange('Hoàn thành')}
                            colorClass="text-emerald-600"
                            icon={<CheckCircleIcon className="w-4 h-4"/>}
                        />
                    </div>
                </div>

                {/* 2. SEARCH & FILTER TOOLBAR */}
                <div className="px-4 sm:px-6 py-3 bg-slate-50 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:max-w-lg group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#003DA5] transition-colors">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm phiếu, sản phẩm, nội dung..." 
                            value={filters.searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5] shadow-sm outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {/* Date Filter */}
                        <div className="relative">
                             <button 
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                className={`flex items-center px-3.5 py-2.5 border rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${
                                    filters.dateFilter.start || filters.dateFilter.end 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' 
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
                                }`}
                             >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {filters.dateFilter.start ? 'Đã lọc ngày' : 'Thời gian'}
                             </button>
                             
                             {showDateFilter && (
                                 <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 w-72 animate-fade-in-up ring-1 ring-black/5">
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
                            className="p-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm active:scale-95"
                            title="Tùy chỉnh cột"
                         >
                             <AdjustmentsIcon className="h-5 w-5" />
                         </button>
                         {showColumnMenu && (
                             <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in-up max-h-[300px] overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                                 <h4 className="text-xs font-bold text-slate-400 uppercase px-3 py-2 border-b border-slate-50 mb-1">Hiển thị cột</h4>
                                 {columns.map(col => (
                                     <label key={col.id} className="flex items-center px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                         <input 
                                            type="checkbox" 
                                            checked={col.visible}
                                            onChange={() => toggleColumn(col.id)}
                                            className="rounded border-slate-300 text-[#003DA5] focus:ring-[#003DA5] cursor-pointer"
                                         />
                                         <span className="ml-3 text-sm text-slate-700 font-medium">{col.label}</span>
                                     </label>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            </div>
            </div>

            {/* 3. DATA TABLE LIST */}
            <div className="hidden md:block flex-1 overflow-auto custom-scrollbar px-4 sm:px-6 py-4">
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden min-w-full inline-block align-middle ring-1 ring-black/5">
                     <table className="min-w-full divide-y divide-slate-100" style={{ fontFamily: 'inherit', fontSize: '1rem' }}>
                         <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10">
                             <tr>
                                 {columns.filter(c => c.visible).map((col) => {
                                     const isSortable = onSort && ['ngayPhanAnh', 'maSanPham', 'tenThuongMai', 'trangThai', 'soLo'].includes(col.id);
                                     const isSorted = sortConfig?.key === col.id;
                                     const sortDirection = sortConfig?.direction;

                                     return (
                                         <th 
                                            key={col.id}
                                            scope="col"
                                            className={`px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap 
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
                                        className={`hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-l-[#003DA5]' : ''}`}
                                     >
                                         {columns.filter(c => c.visible).map((col) => (
                                             <td 
                                                key={`${report.id}-${col.id}`} 
                                                className={`px-4 py-3 align-top text-sm ${col.fixed ? 'sticky right-0 bg-white group-hover:bg-blue-50/30 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]' : ''}`}
                                                style={{ textAlign: col.align || 'left' }}
                                             >
                                                 {renderCell(report, col.id, index)}
                                             </td>
                                         ))}
                                     </tr>
                                 ))
                             ) : (
                                 <tr>
                                     <td colSpan={columns.filter(c => c.visible).length} className="px-6 py-16 text-center text-slate-400">
                                         <div className="flex flex-col items-center justify-center">
                                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <InboxIcon className="h-8 w-8 opacity-30" />
                                             </div>
                                             <p className="text-sm font-bold text-slate-500">Không tìm thấy dữ liệu</p>
                                             <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với từ khóa khác</p>
                                         </div>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex-1 overflow-auto custom-scrollbar p-3 space-y-3" style={{ fontSize: '0.875rem' }}>
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
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all flex flex-col gap-2 animate-fade-in-up ring-1 ring-black/5"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="text-[0.65rem] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                        #{report.id.split('-')[1] || report.id}
                                    </span>
                                    <span className="text-[0.65rem] font-bold text-slate-400 flex items-center gap-1">
                                         <CalendarIcon className="w-3 h-3"/> {formatDate(report.ngayPhanAnh)}
                                    </span>
                                </div>
                                {getStatusBadge(report.trangThai)}
                            </div>

                            <div className="mt-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                     <span className="font-bold text-[#003DA5] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs font-mono">{report.maSanPham}</span>
                                     {report.soLo && (
                                        <span className="font-semibold text-slate-500 text-xs bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Lô: {report.soLo}</span>
                                     )}
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{report.tenThuongMai}</h3>
                            </div>

                            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic line-clamp-2 leading-relaxed mt-1">
                                "{report.noiDungPhanAnh}"
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-3 mt-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSelectReport(report); }}
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                                {currentUserRole !== 'Kho' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                        className="p-2 text-slate-500 bg-slate-50 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>
                                )}
                                {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <InboxIcon className="h-12 w-12 opacity-20 mb-3" />
                        <p className="text-sm font-bold">Không tìm thấy dữ liệu.</p>
                    </div>
                )}
            </div>

            {/* 5. Footer Pagination */}
            <div className="bg-white border-t border-slate-200 px-4 py-3 sm:px-6 sticky bottom-0 z-20 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.03)]">
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