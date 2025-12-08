
import React, { useState, useEffect, useMemo } from 'react';
import { DefectReport, UserRole } from '../types';
import { 
  FunnelIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, 
  TrashIcon, DocumentDuplicateIcon, PencilIcon, 
  CalendarIcon, AdjustmentsIcon, EyeIcon, 
  CheckCircleIcon, WrenchIcon, ShoppingBagIcon, 
  TagIcon, UserIcon, ClockIcon 
} from './Icons';
import Pagination from './Pagination';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean;
}

// Default Configuration - Removed 'select' column
const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: 'STT', visible: true, width: 60, align: 'center' },
    { id: 'ngayPhanAnh', label: 'Ngày khiếu nại', visible: true, width: 130, align: 'left' },
    { id: 'maSanPham', label: 'Mã sản phẩm', visible: true, width: 120, align: 'left' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, width: 250, align: 'left' }, 
    { id: 'noiDungPhanAnh', label: 'Nội dung khiếu nại', visible: true, width: 300, align: 'left' }, 
    { id: 'soLo', label: 'Số lô', visible: true, width: 100, align: 'left' },
    { id: 'hanDung', label: 'Hạn dùng', visible: false, width: 120, align: 'left' },
    { id: 'donViTinh', label: 'ĐVT', visible: false, width: 80, align: 'center' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: true, width: 100, align: 'left' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, width: 160, align: 'left' },
    { id: 'actions', label: '', visible: true, width: 100, align: 'center', fixed: true },
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
  baseFontSize = '15px'
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Mới': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Đang tiếp nhận': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Đang xác minh': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            case 'Đang xử lý': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Chưa tìm ra nguyên nhân': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Hoàn thành': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const renderCell = (report: DefectReport, columnId: string, index: number) => {
        switch (columnId) {
            case 'stt':
                return (currentPage - 1) * itemsPerPage + index + 1;
            case 'ngayPhanAnh':
                return (
                    <div>
                        <span className="block font-medium text-slate-700" style={{ fontSize: 'inherit' }}>{formatDate(report.ngayPhanAnh)}</span>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1 rounded inline-block mt-0.5">{report.id}</span>
                    </div>
                );
            case 'maSanPham':
                return (
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                        {report.maSanPham}
                    </span>
                );
            case 'tenThuongMai':
                return (
                    <div>
                        <div className="font-bold text-slate-800 line-clamp-1" title={report.tenThuongMai} style={{ fontSize: 'inherit' }}>{report.tenThuongMai}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{report.dongSanPham} - {report.nhanHang}</div>
                    </div>
                );
            case 'noiDungPhanAnh':
                return <div className="line-clamp-2 text-slate-600" title={report.noiDungPhanAnh} style={{ fontSize: 'inherit' }}>{report.noiDungPhanAnh}</div>;
            case 'soLo':
                return <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{report.soLo}</span>;
            case 'hanDung':
                return formatDate(report.hanDung || '');
            case 'donViTinh':
                return report.donViTinh;
            case 'maNgaySanXuat':
                return report.maNgaySanXuat;
            case 'trangThai':
                return (
                    <span className={`inline-flex px-2 py-1 rounded border text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${getStatusStyle(report.trangThai)}`}>
                        {report.trangThai}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelectReport(report); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Xem chi tiết"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                        {currentUserRole !== 'Kho' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                title="Nhân bản"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                        )}
                        {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* Filter Bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row gap-3 items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm phiếu..." 
                            value={filters.searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            className="pl-10 pr-3 py-2 w-full border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] shadow-sm outline-none bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 custom-scrollbar">
                        <div className="relative min-w-[140px]">
                            <select 
                                value={filters.statusFilter}
                                onChange={(e) => onStatusFilterChange(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] shadow-sm outline-none appearance-none bg-white cursor-pointer"
                            >
                                <option value="All">Tất cả trạng thái</option>
                                <option value="Mới">Mới</option>
                                <option value="Đang tiếp nhận">Đang tiếp nhận</option>
                                <option value="Đang xác minh">Đang xác minh</option>
                                <option value="Đang xử lý">Đang xử lý</option>
                                <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra NN</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                                <FunnelIcon className="h-4 w-4" />
                            </div>
                        </div>

                         <div className="relative min-w-[140px]">
                            <select 
                                value={filters.defectTypeFilter}
                                onChange={(e) => onDefectTypeFilterChange(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] shadow-sm outline-none appearance-none bg-white cursor-pointer"
                            >
                                <option value="All">Tất cả lỗi</option>
                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                <option value="Lỗi Khác">Lỗi Khác</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                                <TagIcon className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="relative">
                             <button 
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                className={`flex items-center px-3 py-2 border rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm active:scale-95 ${
                                    filters.dateFilter.start || filters.dateFilter.end 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                             >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {filters.dateFilter.start ? 'Đã lọc ngày' : 'Lọc ngày'}
                             </button>
                             
                             {showDateFilter && (
                                 <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 w-72 animate-fade-in-up">
                                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Khoảng thời gian</h4>
                                     <div className="space-y-3">
                                         <div>
                                             <label className="block text-xs font-medium text-slate-700 mb-1">Từ ngày</label>
                                             <input 
                                                type="date" 
                                                value={filters.dateFilter.start}
                                                onChange={(e) => onDateFilterChange({...filters.dateFilter, start: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-xs font-medium text-slate-700 mb-1">Đến ngày</label>
                                             <input 
                                                type="date" 
                                                value={filters.dateFilter.end}
                                                onChange={(e) => onDateFilterChange({...filters.dateFilter, end: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                             />
                                         </div>
                                         <button 
                                            onClick={() => { onDateFilterChange({ start: '', end: '' }); setShowDateFilter(false); }}
                                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                                         >
                                             Xóa lọc ngày
                                         </button>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                     <div className="relative">
                         <button 
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className="p-2 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            title="Tùy chỉnh cột"
                         >
                             <AdjustmentsIcon className="h-5 w-5" />
                         </button>
                         {showColumnMenu && (
                             <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in-up max-h-[300px] overflow-y-auto custom-scrollbar">
                                 <h4 className="text-xs font-bold text-slate-400 uppercase px-3 py-2 border-b border-slate-50 mb-1">Hiển thị cột</h4>
                                 {columns.map(col => (
                                     <label key={col.id} className="flex items-center px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                         <input 
                                            type="checkbox" 
                                            checked={col.visible}
                                            onChange={() => toggleColumn(col.id)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                         />
                                         <span className="ml-2 text-sm text-slate-700">{col.label}</span>
                                     </label>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block flex-1 overflow-auto custom-scrollbar p-0 sm:p-4">
                <div className="bg-white border border-slate-200 shadow-sm rounded-none sm:rounded-xl overflow-hidden min-w-full inline-block align-middle">
                     <table className="min-w-full divide-y divide-slate-200" style={{ fontFamily: 'var(--list-font, inherit)', fontSize: 'var(--list-size, 1rem)' }}>
                         <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                             <tr>
                                 {columns.filter(c => c.visible).map((col) => (
                                     <th 
                                        key={col.id}
                                        scope="col"
                                        className={`px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.fixed ? 'sticky right-0 bg-slate-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''}`}
                                        style={{ width: col.width, textAlign: col.align || 'left', fontSize: 'inherit' }}
                                     >
                                         {col.label}
                                     </th>
                                 ))}
                             </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-slate-100">
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
                                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                     >
                                         {columns.filter(c => c.visible).map((col) => (
                                             <td 
                                                key={`${report.id}-${col.id}`} 
                                                className={`px-4 py-3 align-middle ${col.fixed ? 'sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''}`}
                                                style={{ textAlign: col.align || 'left' }}
                                             >
                                                 {renderCell(report, col.id, index)}
                                             </td>
                                         ))}
                                     </tr>
                                 ))
                             ) : (
                                 <tr>
                                     <td colSpan={columns.filter(c => c.visible).length} className="px-6 py-12 text-center text-slate-400">
                                         <div className="flex flex-col items-center justify-center">
                                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <MagnifyingGlassIcon className="h-8 w-8 opacity-40" />
                                             </div>
                                             <p className="text-sm font-medium">Không tìm thấy dữ liệu phù hợp.</p>
                                         </div>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3" style={{ fontSize: 'var(--list-size, 0.875rem)' }}>
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
                            <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                                <div className="h-8 w-8 bg-slate-100 rounded"></div>
                                <div className="h-8 w-8 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    ))
                ) : reports.length > 0 ? (
                    reports.map((report, index) => (
                        <div 
                            key={report.id} 
                            onClick={() => onSelectReport(report)} 
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-all flex flex-col gap-2 animate-fade-in-up"
                        >
                            {/* Card Header: Date & Status */}
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                     <CalendarIcon className="w-3 h-3"/> {formatDate(report.ngayPhanAnh)}
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wide ${getStatusStyle(report.trangThai)}`}>
                                    {report.trangThai}
                                </span>
                            </div>

                            {/* Main Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                     <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-[10px] uppercase">{report.maSanPham}</span>
                                     {report.soLo && (
                                        <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{report.soLo}</span>
                                     )}
                                     <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] ml-auto">{report.nhanHang}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{report.tenThuongMai}</h3>
                                {report.dongSanPham && <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{report.dongSanPham}</div>}
                            </div>

                            {/* Content Snippet */}
                            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic line-clamp-2 leading-relaxed">
                                "{report.noiDungPhanAnh}"
                            </div>
                            
                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-1">
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
                                        className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        title="Nhân bản"
                                    >
                                        <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>
                                )}
                                {([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole) && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa phiếu này?')) onDelete(report.id); }}
                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Xóa"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <MagnifyingGlassIcon className="h-12 w-12 opacity-20 mb-3" />
                        <p className="text-sm font-medium">Không tìm thấy dữ liệu.</p>
                    </div>
                )}
            </div>

            {/* Footer Pagination */}
            <div className="bg-white border-t border-slate-200 px-4 py-3 sm:px-6 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
