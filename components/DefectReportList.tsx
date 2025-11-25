
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DefectReport, UserRole } from '../types';
import Pagination from './Pagination';
import { 
    MagnifyingGlassIcon, InboxIcon, ClockIcon, CheckCircleIcon, 
    SparklesIcon, Cog6ToothIcon, TrashIcon, ArrowDownTrayIcon,
    CalendarIcon, FunnelIcon, XIcon
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
  'Mới': 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  'Đang xử lý': 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  'Chưa tìm ra nguyên nhân': 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  'Hoàn thành': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
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
    { id: 'actions', label: '', visible: true, span: 0.4, minWidth: '50px' },
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

  // --- Tooltip Logic ---
  const [hoveredReport, setHoveredReport] = useState<DefectReport | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleRowMouseEnter = (report: DefectReport) => {
      setHoveredReport(report);
  };

  const handleRowMouseLeave = () => {
      setHoveredReport(null);
  };

  const handleRowMouseMove = (e: React.MouseEvent) => {
      if (tooltipRef.current) {
          const tooltip = tooltipRef.current;
          let x = e.clientX + 15;
          let y = e.clientY + 15;
          const rect = tooltip.getBoundingClientRect();
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;

          if (x + rect.width > screenWidth - 20) {
              x = e.clientX - rect.width - 15;
          }
          if (y + rect.height > screenHeight - 20) {
              y = e.clientY - rect.height - 15;
          }
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
      }
  };

  useEffect(() => {
      const savedColumns = localStorage.getItem('tableColumnConfig');
      if (savedColumns) {
          try {
              const parsedColumns = JSON.parse(savedColumns);
              const mergedColumns = parsedColumns.map((savedCol: any) => {
                  const defaultCol = DEFAULT_COLUMNS.find(def => def.id === savedCol.id);
                  return defaultCol ? { ...defaultCol, ...savedCol, minWidth: defaultCol.minWidth } : savedCol;
              });
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
              return <span className="text-slate-400 font-medium text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
          case 'ngayTao':
              return <span className="text-slate-500 text-xs">{report.ngayTao ? new Date(report.ngayTao).toLocaleDateString('en-GB') : '-'}</span>;
          case 'ngayPhanAnh':
              return <span className="text-slate-600 font-medium text-sm">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>;
          case 'maSanPham':
              return <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs font-bold">{report.maSanPham}</span>;
          case 'tenThuongMai':
              return (
                <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 text-sm truncate" title={report.tenThuongMai}>{report.tenThuongMai}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{report.dongSanPham} • {report.nhanHang}</div>
                </div>
              );
          case 'noiDungPhanAnh':
              return <div className="text-slate-600 text-sm line-clamp-2 leading-relaxed">{report.noiDungPhanAnh}</div>;
          case 'soLo':
              return <span className="font-mono text-slate-500 text-xs">{report.soLo}</span>;
          case 'maNgaySanXuat':
              return <span className="font-mono text-slate-500 text-xs">{report.maNgaySanXuat}</span>;
          case 'ngayHoanThanh':
              return report.ngayHoanThanh ? <span className="text-emerald-600 font-medium text-sm">{new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}</span> : <span className="text-slate-300">-</span>;
          case 'trangThai':
              return (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${statusColorMap[report.trangThai]}`}>
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

  const StatTab = ({ label, count, active, onClick, icon }: any) => (
      <button 
          onClick={onClick}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              active 
              ? 'text-blue-600 border-blue-600 bg-blue-50/50' 
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
          }`}
      >
          <span className={`${active ? 'text-blue-500' : 'text-slate-400'}`}>{icon}</span>
          <span>{label}</span>
          <span className={`ml-1 py-0.5 px-2 rounded-full text-[10px] ${
              active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}>
              {count}
          </span>
      </button>
  );

  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-6 max-w-[1920px] mx-auto w-full">
      
      {/* Main Container Card */}
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* 1. Status Tabs Header */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white">
              <StatTab label="Tất cả" count={summaryStats.total} active={filters.statusFilter === 'All'} onClick={() => onStatusFilterChange('All')} icon={<InboxIcon className="h-4 w-4"/>} />
              <StatTab label="Mới" count={summaryStats.moi} active={filters.statusFilter === 'Mới'} onClick={() => onStatusFilterChange('Mới')} icon={<SparklesIcon className="h-4 w-4"/>} />
              <StatTab label="Đang xử lý" count={summaryStats.dangXuLy} active={filters.statusFilter === 'Đang xử lý'} onClick={() => onStatusFilterChange('Đang xử lý')} icon={<ClockIcon className="h-4 w-4"/>} />
              <StatTab label="Chưa rõ" count={summaryStats.chuaTimRaNguyenNhan} active={filters.statusFilter === 'Chưa tìm ra nguyên nhân'} onClick={() => onStatusFilterChange('Chưa tìm ra nguyên nhân')} icon={<MagnifyingGlassIcon className="h-4 w-4"/>} />
              <StatTab label="Hoàn thành" count={summaryStats.hoanThanh} active={filters.statusFilter === 'Hoàn thành'} onClick={() => onStatusFilterChange('Hoàn thành')} icon={<CheckCircleIcon className="h-4 w-4"/>} />
          </div>

          {/* 2. Toolbar (Search & Filters) */}
          <div className="p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-white border-b border-slate-100">
             
             {/* Left: Search */}
             <div className="relative w-full xl:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white"
                    placeholder="Tìm kiếm theo mã SP, tên, lô..."
                    value={filters.searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>

            {/* Right: Filters & Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                
                {/* Defect Type Filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <FunnelIcon className="h-4 w-4" />
                    </div>
                    <select
                        className="pl-9 pr-8 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer appearance-none min-w-[160px]"
                        value={filters.defectTypeFilter}
                        onChange={(e) => onDefectTypeFilterChange(e.target.value)}
                    >
                        <option value="All">Tất cả loại lỗi</option>
                        <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                        <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                        <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                        <option value="Lỗi Khác">Lỗi Khác</option>
                    </select>
                </div>

                {/* Date Filter */}
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-2">
                    <CalendarIcon className="h-4 w-4 text-slate-400 mr-2" />
                    <input
                        type="date"
                        className="bg-transparent text-sm text-slate-700 focus:outline-none font-medium w-28"
                        value={filters.dateFilter.start}
                        onChange={(e) => onDateFilterChange({ ...filters.dateFilter, start: e.target.value })}
                    />
                    <span className="text-slate-300 mx-2">-</span>
                    <input
                        type="date"
                         className="bg-transparent text-sm text-slate-700 focus:outline-none font-medium w-28"
                        value={filters.dateFilter.end}
                        onChange={(e) => onDateFilterChange({ ...filters.dateFilter, end: e.target.value })}
                    />
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                {/* Action Buttons */}
                <button
                    onClick={onExport}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                    title="Xuất Excel"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                </button>

                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all ${showSettings ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-600'}`}
                        title="Cấu hình cột"
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

                {areFiltersActive && (
                    <button 
                        onClick={resetFilters}
                        className="p-2.5 ml-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-transparent hover:border-red-200"
                        title="Xóa bộ lọc"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
          </div>

          {/* 3. Table Area */}
          <div className={`flex-1 overflow-hidden relative transition-opacity duration-300 flex flex-col ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {reports.length > 0 ? (
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="min-w-full inline-block align-middle">
                        {/* Sticky Header */}
                        <div className="flex bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
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
                        <div className="divide-y divide-slate-100 bg-white">
                            {reports.map((report, index) => (
                                <div 
                                    key={report.id}
                                    onClick={() => onSelectReport(report)}
                                    onMouseEnter={() => handleRowMouseEnter(report)}
                                    onMouseLeave={handleRowMouseLeave}
                                    onMouseMove={handleRowMouseMove}
                                    className="group flex items-center hover:bg-blue-50/30 transition-colors cursor-pointer relative"
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

            {/* Pagination Footer */}
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

      {/* Floating Tooltip */}
      <div 
        ref={tooltipRef}
        className={`fixed z-[100] bg-slate-900/95 backdrop-blur text-white p-3.5 rounded-xl shadow-2xl pointer-events-none transition-opacity duration-200 border border-slate-700/50 max-w-[320px] w-full ${hoveredReport ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: 0, top: 0 }}
      >
        {hoveredReport && (
            <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                    <span className="font-bold text-xs text-blue-300 font-mono uppercase">{hoveredReport.maSanPham}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        hoveredReport.trangThai === 'Mới' ? 'bg-blue-500/20 text-blue-300' : 
                        hoveredReport.trangThai === 'Hoàn thành' ? 'bg-emerald-500/20 text-emerald-300' : 
                        'bg-amber-500/20 text-amber-300'
                    }`}>
                        {hoveredReport.trangThai}
                    </span>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-100 truncate mb-1">{hoveredReport.tenThuongMai}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mb-2">
                         <span className="bg-slate-800 px-1 rounded">Lô: {hoveredReport.soLo}</span>
                         {hoveredReport.loaiLoi && <span className="bg-slate-800 px-1 rounded">{hoveredReport.loaiLoi}</span>}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 italic">
                        "{hoveredReport.noiDungPhanAnh}"
                    </p>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default React.memo(DefectReportList);
