
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DefectReport, UserRole } from '../types';
import Pagination from './Pagination';
import { 
    MagnifyingGlassIcon, InboxIcon, ClockIcon, CheckCircleIcon, 
    DocumentDuplicateIcon, SparklesIcon, Cog6ToothIcon, EyeIcon, 
    EyeSlashIcon, ArrowUpIcon, ArrowDownIcon, QuestionMarkCircleIcon,
    TrashIcon, ArrowDownTrayIcon
} from './Icons';

interface SummaryStats {
    total: number;
    moi: number;
    dangXuLy: number;
    chuaTimRaNguyenNhan: number;
    hoanThanh: number;
}

interface Props {
  reports: DefectReport[];
  totalReports: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  selectedReport: DefectReport | null;
  onSelectReport: (report: DefectReport) => void;
  currentUserRole: UserRole;
  filters: {
    searchTerm: string;
    statusFilter: string;
    defectTypeFilter: string;
    yearFilter: string;
    dateFilter: { start: string; end: string };
  };
  onSearchTermChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDefectTypeFilterChange: (type: string) => void;
  onYearFilterChange: (year: string) => void;
  onDateFilterChange: (dates: { start: string; end: string }) => void;
  summaryStats: SummaryStats;
  onItemsPerPageChange: (items: number) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  onExport: () => void;
}

const statusColorMap: { [key in DefectReport['trangThai']]: string } = {
  'Mới': 'bg-blue-100 text-blue-700 border-blue-200',
  'Đang xử lý': 'bg-amber-100 text-amber-700 border-amber-200',
  'Chưa tìm ra nguyên nhân': 'bg-purple-100 text-purple-700 border-purple-200',
  'Hoàn thành': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

type ColumnId = 'stt' | 'ngayTao' | 'ngayPhanAnh' | 'maSanPham' | 'tenThuongMai' | 'noiDungPhanAnh' | 'soLo' | 'maNgaySanXuat' | 'trangThai' | 'ngayHoanThanh' | 'actions';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  span: number;
  minWidth: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: '#', visible: true, span: 0.3, minWidth: '40px' },
    { id: 'ngayPhanAnh', label: 'Ngày P.Ánh', visible: true, span: 0.8, minWidth: '100px' },
    { id: 'maSanPham', label: 'Mã SP', visible: true, span: 0.8, minWidth: '90px' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, span: 2, minWidth: '180px' },
    { id: 'noiDungPhanAnh', label: 'Nội dung phản ánh', visible: true, span: 3.5, minWidth: '300px' },
    { id: 'soLo', label: 'Số lô', visible: true, span: 0.8, minWidth: '90px' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, span: 1, minWidth: '150px' },
    { id: 'ngayTao', label: 'Ngày tạo', visible: false, span: 1, minWidth: '110px' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: false, span: 0.8, minWidth: '90px' },
    { id: 'ngayHoanThanh', label: 'Hoàn thành', visible: false, span: 1, minWidth: '110px' },
    { id: 'actions', label: '', visible: true, span: 0.4, minWidth: '60px' },
];

const DefectReportList: React.FC<Props> = ({ 
  reports, totalReports, currentPage, itemsPerPage, onPageChange, 
  selectedReport, onSelectReport, currentUserRole,
  filters, onSearchTermChange, onStatusFilterChange, onDefectTypeFilterChange, onYearFilterChange, onDateFilterChange,
  summaryStats, onItemsPerPageChange, onDelete, isLoading, onExport
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [reportToDelete, setReportToDelete] = useState<DefectReport | null>(null);

  useEffect(() => {
      const savedColumns = localStorage.getItem('tableColumnConfig');
      if (savedColumns) {
          try {
              const parsedColumns = JSON.parse(savedColumns);
              const mergedColumns = parsedColumns.map((savedCol: any) => {
                  const defaultCol = DEFAULT_COLUMNS.find(def => def.id === savedCol.id);
                  return defaultCol ? { ...defaultCol, ...savedCol, minWidth: defaultCol.minWidth } : savedCol;
              });
               // Ensure all defaults exist
              DEFAULT_COLUMNS.forEach(def => {
                  if (!mergedColumns.find((m: any) => m.id === def.id)) mergedColumns.push(def);
              });
              setColumns(mergedColumns);
          } catch (e) {
              setColumns(DEFAULT_COLUMNS);
          }
      }
  }, []);

  useEffect(() => {
      localStorage.setItem('tableColumnConfig', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
              setShowSettings(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumnVisibility = (id: ColumnId) => {
      setColumns(prev => prev.map(col => col.id === id ? { ...col, visible: !col.visible } : col));
  };

  const resetFilters = () => {
    onSearchTermChange('');
    onStatusFilterChange('All');
    onDefectTypeFilterChange('All');
    onYearFilterChange('All');
    onDateFilterChange({ start: '', end: '' });
  };
  
  const areFiltersActive = filters.searchTerm || filters.statusFilter !== 'All' || filters.defectTypeFilter !== 'All' || filters.yearFilter !== 'All' || filters.dateFilter.start || filters.dateFilter.end;
  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const renderCell = (report: DefectReport, columnId: ColumnId, index: number) => {
      switch (columnId) {
          case 'stt':
              return <span className="text-slate-400 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
          case 'ngayTao':
              return <span className="text-slate-500 text-xs">{report.ngayTao ? new Date(report.ngayTao).toLocaleDateString('en-GB') : '-'}</span>;
          case 'ngayPhanAnh':
              return <span className="text-slate-700 font-medium">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>;
          case 'maSanPham':
              return <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs font-bold">{report.maSanPham}</span>;
          case 'tenThuongMai':
              return (
                <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate" title={report.tenThuongMai}>{report.tenThuongMai}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{report.dongSanPham} • {report.nhanHang}</div>
                </div>
              );
          case 'noiDungPhanAnh':
              return <div className="text-slate-600 text-sm line-clamp-2 leading-relaxed" title={report.noiDungPhanAnh}>{report.noiDungPhanAnh}</div>;
          case 'soLo':
              return <span className="font-mono text-slate-600 text-xs bg-slate-100 px-1.5 py-0.5 rounded">{report.soLo}</span>;
          case 'maNgaySanXuat':
              return <span className="font-mono text-slate-600 text-xs">{report.maNgaySanXuat}</span>;
          case 'ngayHoanThanh':
              return report.ngayHoanThanh ? <span className="text-emerald-600 font-medium">{new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}</span> : <span className="text-slate-300">-</span>;
          case 'trangThai':
              return (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${statusColorMap[report.trangThai]}`}>
                      {report.trangThai}
                  </span>
              );
          case 'actions':
              const canDelete = [UserRole.Admin, UserRole.KyThuat].includes(currentUserRole);
              if (!canDelete) return null;
              return (
                  <button
                      onClick={(e) => {
                          e.stopPropagation();
                          setReportToDelete(report);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Xóa phản ánh"
                  >
                      <TrashIcon className="h-4 w-4" />
                  </button>
              );
          default:
              return null;
      }
  };

  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-6 space-y-4 max-w-[1920px] mx-auto w-full">
      
      {/* Top Controls: Stats & Main Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
               {[
                  { label: 'Tất cả', count: summaryStats.total, color: 'bg-slate-100 text-slate-600', active: filters.statusFilter === 'All', onClick: () => onStatusFilterChange('All') },
                  { label: 'Mới', count: summaryStats.moi, color: 'bg-blue-100 text-blue-700', active: filters.statusFilter === 'Mới', onClick: () => onStatusFilterChange('Mới') },
                  { label: 'Đang xử lý', count: summaryStats.dangXuLy, color: 'bg-amber-100 text-amber-700', active: filters.statusFilter === 'Đang xử lý', onClick: () => onStatusFilterChange('Đang xử lý') },
                  { label: 'Chưa rõ', count: summaryStats.chuaTimRaNguyenNhan, color: 'bg-purple-100 text-purple-700', active: filters.statusFilter === 'Chưa tìm ra nguyên nhân', onClick: () => onStatusFilterChange('Chưa tìm ra nguyên nhân') },
                  { label: 'Hoàn thành', count: summaryStats.hoanThanh, color: 'bg-emerald-100 text-emerald-700', active: filters.statusFilter === 'Hoàn thành', onClick: () => onStatusFilterChange('Hoàn thành') },
               ].map((stat, idx) => (
                   <button 
                        key={idx}
                        onClick={stat.onClick}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${stat.active ? 'ring-2 ring-offset-1 ring-blue-500 border-transparent scale-105' : 'border-transparent hover:bg-slate-200/50' } ${stat.color}`}
                   >
                       <span>{stat.label}</span>
                       <span className="bg-white/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{stat.count}</span>
                   </button>
               ))}
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Tìm kiếm nhanh..."
                    value={filters.searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>
            
            <button
                onClick={onExport}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                title="Xuất Excel"
            >
                <ArrowDownTrayIcon className="h-5 w-5" />
            </button>

            <div className="relative" ref={settingsRef}>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`px-3 py-2 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all ${showSettings ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-600'}`}
                >
                    <Cog6ToothIcon className="h-5 w-5" />
                </button>
                {showSettings && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 p-2 animate-fade-in-up">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-1">Hiển thị cột</h4>
                        <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                            {columns.map((col) => (
                                <button 
                                    key={col.id} 
                                    onClick={() => toggleColumnVisibility(col.id)}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${col.visible ? 'text-blue-700 bg-blue-50 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <span>{col.label || 'Thao tác'}</span>
                                    {col.visible && <CheckCircleIcon className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
           <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={filters.defectTypeFilter}
                onChange={(e) => onDefectTypeFilterChange(e.target.value)}
            >
                <option value="All">Tất cả loại lỗi</option>
                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                <option value="Lỗi Khác">Lỗi Khác</option>
            </select>
            
            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2">
                <span className="text-xs text-slate-500 font-medium mr-2">Từ:</span>
                <input
                    type="date"
                    className="bg-transparent text-sm py-1.5 text-slate-700 focus:outline-none"
                    value={filters.dateFilter.start}
                    onChange={(e) => onDateFilterChange({ ...filters.dateFilter, start: e.target.value })}
                />
                <span className="text-slate-300 mx-2">|</span>
                <span className="text-xs text-slate-500 font-medium mr-2">Đến:</span>
                 <input
                    type="date"
                     className="bg-transparent text-sm py-1.5 text-slate-700 focus:outline-none"
                    value={filters.dateFilter.end}
                    onChange={(e) => onDateFilterChange({ ...filters.dateFilter, end: e.target.value })}
                />
            </div>
            
            {areFiltersActive && (
                <button 
                    onClick={resetFilters}
                    className="ml-auto px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                >
                    Xóa bộ lọc
                </button>
            )}
      </div>

      {/* Main Table Card */}
      <div className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative transition-opacity duration-300 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        
        {reports.length > 0 ? (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <div className="min-w-full inline-block align-middle">
                    {/* Header */}
                    <div className="flex bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        {visibleColumns.map((col) => (
                            <div 
                                key={col.id} 
                                className="py-3 px-4 first:pl-6 last:pr-6" 
                                style={{ flex: `${col.span} 1 0%`, minWidth: col.minWidth }}
                            >
                                {col.label}
                            </div>
                        ))}
                    </div>
                    
                    {/* Body */}
                    <div className="divide-y divide-slate-100">
                        {reports.map((report, index) => (
                            <div 
                                key={report.id}
                                onClick={() => onSelectReport(report)}
                                className="group flex items-center hover:bg-slate-50 transition-colors cursor-pointer relative"
                            >
                                {visibleColumns.map((col) => (
                                    <div 
                                        key={col.id} 
                                        className="py-4 px-4 first:pl-6 last:pr-6 text-sm" 
                                        style={{ flex: `${col.span} 1 0%`, minWidth: col.minWidth }}
                                    >
                                        {renderCell(report, col.id, index)}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100">
                    <InboxIcon className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy dữ liệu</h3>
                <p className="text-slate-500 mt-2 max-w-sm">
                    {areFiltersActive 
                        ? "Thử thay đổi hoặc xóa bộ lọc để xem kết quả." 
                        : "Hệ thống chưa có phản ánh nào."}
                </p>
                {areFiltersActive && (
                    <button 
                        onClick={resetFilters}
                        className="mt-6 px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </div>
        )}
        
        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-200 bg-white">
            <Pagination
                currentPage={currentPage}
                totalItems={totalReports}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
            />
        </div>
      </div>

      {/* Delete Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2 uppercase">XÓA PHẢN ÁNH?</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                    Bạn sắp xóa phản ánh <span className="font-bold text-slate-800">{reportToDelete.maSanPham}</span>. Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setReportToDelete(null)}
                        className="flex-1 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => {
                            onDelete(reportToDelete.id);
                            setReportToDelete(null);
                        }}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30"
                    >
                        Xóa ngay
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DefectReportList);
