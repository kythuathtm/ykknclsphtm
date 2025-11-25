import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DefectReport, UserRole } from '../types';
import Pagination from './Pagination';
import { 
    MagnifyingGlassIcon, InboxIcon, ClockIcon, CheckCircleIcon, 
    SparklesIcon, Cog6ToothIcon, TrashIcon, ArrowDownTrayIcon,
    CalendarIcon, FunnelIcon, XIcon, DocumentDuplicateIcon
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
  onDuplicate?: (report: DefectReport) => void;
}

const statusColorMap: { [key in DefectReport['trangThai']]: string } = {
  'Mới': 'bg-blue-50 text-blue-700 border-blue-200',
  'Đang xử lý': 'bg-amber-50 text-amber-700 border-amber-200',
  'Chưa tìm ra nguyên nhân': 'bg-purple-50 text-purple-700 border-purple-200',
  'Hoàn thành': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

type ColumnId = 'stt' | 'ngayTao' | 'ngayPhanAnh' | 'maSanPham' | 'tenThuongMai' | 'tenThietBi' | 'noiDungPhanAnh' | 'soLo' | 'maNgaySanXuat' | 'trangThai' | 'ngayHoanThanh' | 'actions';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  span: number;
  minWidth: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: 'STT', visible: true, span: 0.1, minWidth: '50px' },
    { id: 'ngayPhanAnh', label: 'Ngày phản ánh', visible: true, span: 0.5, minWidth: '130px' },
    { id: 'maSanPham', label: 'Mã sản phẩm', visible: true, span: 0, minWidth: '180px' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, span: 2, minWidth: '220px' },
    { id: 'noiDungPhanAnh', label: 'Nội dung phản ánh', visible: true, span: 3, minWidth: '320px' },
    { id: 'soLo', label: 'Số lô', visible: true, span: 0.5, minWidth: '100px' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: true, span: 0.5, minWidth: '100px' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, span: 0.8, minWidth: '150px' },
    { id: 'tenThietBi', label: 'Tên thiết bị', visible: false, span: 1.5, minWidth: '180px' },
    { id: 'ngayTao', label: 'Ngày tạo', visible: false, span: 0.8, minWidth: '110px' },
    { id: 'ngayHoanThanh', label: 'Hoàn thành', visible: false, span: 0.8, minWidth: '110px' },
    { id: 'actions', label: '', visible: true, span: 0.2, minWidth: '90px' },
];

const DefectReportList: React.FC<Props> = ({ 
  reports, totalReports, currentPage, itemsPerPage, onPageChange, 
  selectedReport, onSelectReport, currentUserRole,
  filters, onSearchTermChange, onStatusFilterChange, onDefectTypeFilterChange, onYearFilterChange, onDateFilterChange,
  summaryStats, onItemsPerPageChange, onDelete, isLoading, onExport, onDuplicate
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [reportToDelete, setReportToDelete] = useState<DefectReport | null>(null);
  const [hoveredReport, setHoveredReport] = useState<DefectReport | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleRowMouseEnter = (report: DefectReport) => setHoveredReport(report);
  const handleRowMouseLeave = () => setHoveredReport(null);
  
  const handleRowMouseMove = (e: React.MouseEvent) => {
      if (tooltipRef.current) {
          const tooltip = tooltipRef.current;
          let x = e.clientX + 15;
          let y = e.clientY + 15;
          
          const rect = tooltip.getBoundingClientRect();
          const winWidth = window.innerWidth;
          const winHeight = window.innerHeight;

          if (x + rect.width > winWidth - 20) {
              x = e.clientX - rect.width - 15;
          }
          if (y + rect.height > winHeight - 20) {
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
                  return defaultCol ? { ...defaultCol, ...savedCol, minWidth: defaultCol.minWidth, span: defaultCol.span } : savedCol;
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
              return <span className="text-slate-400 font-bold text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
          case 'ngayTao':
              return <span className="text-slate-500 text-sm">{report.ngayTao ? new Date(report.ngayTao).toLocaleDateString('en-GB') : '-'}</span>;
          case 'ngayPhanAnh':
              return <span className="text-slate-700 font-bold text-sm whitespace-nowrap bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/50">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>;
          case 'maSanPham':
              return (
                  <div className="flex items-center w-full pr-4">
                      <span className="text-slate-900 font-bold text-sm whitespace-nowrap bg-white text-blue-800 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-colors" title={report.maSanPham}>
                          {report.maSanPham}
                      </span>
                  </div>
              );
          case 'tenThuongMai':
              return (
                <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 text-sm whitespace-normal leading-snug group-hover:text-blue-700 transition-colors">
                        {report.tenThuongMai}
                    </div>
                </div>
              );
          case 'tenThietBi':
              return <div className="text-slate-600 text-sm truncate" title={report.tenThietBi}>{report.tenThietBi}</div>;
          case 'noiDungPhanAnh':
              return <div className="text-slate-600 text-sm line-clamp-2 leading-relaxed" title={report.noiDungPhanAnh}>{report.noiDungPhanAnh}</div>;
          case 'soLo':
              return <span className="text-slate-600 text-sm font-bold whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{report.soLo}</span>;
          case 'maNgaySanXuat':
              return <span className="text-slate-500 text-sm whitespace-nowrap font-medium">{report.maNgaySanXuat}</span>;
          case 'ngayHoanThanh':
              return report.ngayHoanThanh ? <span className="text-emerald-600 font-medium text-sm whitespace-nowrap">{new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}</span> : <span className="text-slate-300">-</span>;
          case 'trangThai':
              return (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-sm border ${statusColorMap[report.trangThai]}`}>
                      {report.trangThai.toUpperCase()}
                  </span>
              );
          case 'actions':
              const canDelete = ([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole);
              return (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDuplicate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(report);
                            }}
                            className="p-1.5 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all shadow-sm active:scale-95"
                            title="Sao chép phản ánh"
                        >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setReportToDelete(report);
                            }}
                            className="p-1.5 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all shadow-sm active:scale-95"
                            title="Xóa phản ánh"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                  </div>
              );
          default:
              return null;
      }
  };

  const StatTab = ({ label, count, active, onClick, icon }: any) => (
      <button 
          onClick={onClick}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap z-10 ${
              active 
              ? 'text-blue-700 border-blue-600 bg-blue-50/40' 
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
          }`}
      >
          <span className={`${active ? 'text-blue-600' : 'text-slate-400'} transition-colors`}>{icon}</span>
          <span>{label}</span>
          <span className={`ml-1 py-0.5 px-2 rounded-full text-[10px] font-extrabold transition-colors ${
              active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
          }`}>
              {count}
          </span>
      </button>
  );

  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-6 max-w-[1920px] mx-auto w-full">
      
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden ring-1 ring-slate-100">
          
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white shadow-sm z-20 sticky top-0">
              <StatTab label="Tất cả" count={summaryStats.total} active={filters.statusFilter === 'All'} onClick={() => onStatusFilterChange('All')} icon={<InboxIcon className="h-4 w-4"/>} />
              <StatTab label="Mới" count={summaryStats.moi} active={filters.statusFilter === 'Mới'} onClick={() => onStatusFilterChange('Mới')} icon={<SparklesIcon className="h-4 w-4"/>} />
              <StatTab label="Đang xử lý" count={summaryStats.dangXuLy} active={filters.statusFilter === 'Đang xử lý'} onClick={() => onStatusFilterChange('Đang xử lý')} icon={<ClockIcon className="h-4 w-4"/>} />
              <StatTab label="Chưa rõ" count={summaryStats.chuaTimRaNguyenNhan} active={filters.statusFilter === 'Chưa tìm ra nguyên nhân'} onClick={() => onStatusFilterChange('Chưa tìm ra nguyên nhân')} icon={<MagnifyingGlassIcon className="h-4 w-4"/>} />
              <StatTab label="Hoàn thành" count={summaryStats.hoanThanh} active={filters.statusFilter === 'Hoàn thành'} onClick={() => onStatusFilterChange('Hoàn thành')} icon={<CheckCircleIcon className="h-4 w-4"/>} />
          </div>

          <div className="p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-white border-b border-slate-100">
             
             <div className="relative w-full xl:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm hover:border-slate-300"
                    placeholder="Tìm kiếm theo mã SP, tên, lô..."
                    value={filters.searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <FunnelIcon className="h-4 w-4" />
                    </div>
                    <select
                        className="pl-9 pr-8 py-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer appearance-none min-w-[160px] shadow-sm focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300"
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

                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all hover:border-slate-300">
                    <CalendarIcon className="h-4 w-4 text-slate-400 mr-2" />
                    <input
                        type="date"
                        className="bg-transparent text-sm text-slate-700 focus:outline-none font-bold w-28 py-0.5"
                        value={filters.dateFilter.start}
                        onChange={(e) => onDateFilterChange({ ...filters.dateFilter, start: e.target.value })}
                    />
                    <span className="text-slate-300 mx-2">-</span>
                    <input
                        type="date"
                         className="bg-transparent text-sm text-slate-700 focus:outline-none font-bold w-28 py-0.5"
                        value={filters.dateFilter.end}
                        onChange={(e) => onDateFilterChange({ ...filters.dateFilter, end: e.target.value })}
                    />
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <button
                    onClick={onExport}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                    title="Xuất Excel"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                </button>

                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:scale-95 ${showSettings ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-600'}`}
                        title="Cấu hình cột"
                    >
                        <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                    {showSettings && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-2 animate-fade-in-up">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-1">Hiển thị cột</h4>
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
                        className="p-2.5 ml-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-transparent hover:border-red-200 shadow-sm active:scale-95"
                        title="Xóa bộ lọc"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
          </div>

          <div className={`flex-1 overflow-hidden relative transition-opacity duration-300 flex flex-col bg-slate-50/30 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {reports.length > 0 ? (
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="min-w-full inline-block align-middle">
                        <div className="flex bg-white/95 backdrop-blur-md border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                            {visibleColumns.map((col) => (
                                <div 
                                    key={col.id} 
                                    className="py-4 px-4 first:pl-6 last:pr-6" 
                                    style={{ flex: `${col.span} 1 0%`, minWidth: col.minWidth }}
                                >
                                    {col.label}
                                </div>
                            ))}
                        </div>
                        
                        <div className="divide-y divide-slate-100 bg-white">
                            {reports.map((report, index) => (
                                <div 
                                    key={report.id}
                                    onClick={() => onSelectReport(report)}
                                    onMouseEnter={() => handleRowMouseEnter(report)}
                                    onMouseLeave={handleRowMouseLeave}
                                    onMouseMove={handleRowMouseMove}
                                    className="group flex items-center odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/60 transition-colors cursor-pointer relative will-change-transform border-l-[3px] border-transparent hover:border-blue-500"
                                >
                                    {visibleColumns.map((col) => (
                                        <div 
                                            key={col.id} 
                                            className="py-5 px-4 first:pl-6 last:pr-6 text-sm" 
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
                    <div className="bg-white p-6 rounded-full mb-4 ring-1 ring-slate-100 shadow-lg animate-fade-in-up">
                        <InboxIcon className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Không tìm thấy dữ liệu</h3>
                    <p className="text-slate-500 mt-2 max-w-sm font-medium">
                        {areFiltersActive 
                            ? "Thử thay đổi hoặc xóa bộ lọc để xem kết quả." 
                            : "Hệ thống chưa có phản ánh nào."}
                    </p>
                    {areFiltersActive && (
                        <button 
                            onClick={resetFilters}
                            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 hover:bg-blue-700"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}

            <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.01)] relative z-20">
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

      {reportToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up border border-white/20">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5 mx-auto shadow-sm ring-1 ring-red-100">
                    <TrashIcon className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center mb-2 uppercase tracking-tight">XÓA PHẢN ÁNH?</h3>
                <p className="text-sm text-slate-500 text-center mb-8 font-medium">
                    Bạn sắp xóa phản ánh <span className="font-bold text-slate-900 bg-slate-100 px-1 rounded">{reportToDelete.maSanPham}</span>. Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setReportToDelete(null)}
                        className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => {
                            onDelete(reportToDelete.id);
                            setReportToDelete(null);
                        }}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
                    >
                        Xóa ngay
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Tooltip - Increased Z-Index, Better Shadow */}
      <div 
        ref={tooltipRef}
        className={`fixed z-[999] bg-white/95 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-2xl pointer-events-none transition-opacity duration-200 max-w-[340px] w-full ring-1 ring-black/5 ${hoveredReport ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        style={{ left: 0, top: 0, transitionProperty: 'opacity, transform' }}
      >
        {hoveredReport && (
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-black text-sm text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded-lg ring-1 ring-blue-100">{hoveredReport.maSanPham}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase shadow-sm ${
                        hoveredReport.trangThai === 'Mới' ? 'bg-blue-100 text-blue-700' : 
                        hoveredReport.trangThai === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-amber-100 text-amber-700'
                    }`}>
                        {hoveredReport.trangThai}
                    </span>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800 truncate mb-1 leading-tight">{hoveredReport.tenThuongMai}</p>
                    {hoveredReport.tenThietBi && (
                         <p className="text-xs text-slate-500 truncate mb-2">{hoveredReport.tenThietBi}</p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold mb-3">
                         <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">Lô: {hoveredReport.soLo}</span>
                         {hoveredReport.loaiLoi && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{hoveredReport.loaiLoi}</span>}
                    </div>
                    <div className="relative bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">
                            "{hoveredReport.noiDungPhanAnh}"
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default React.memo(DefectReportList);