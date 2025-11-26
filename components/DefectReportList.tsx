
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  onDeleteMultiple?: (ids: string[]) => Promise<boolean>;
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

type ColumnId = 'stt' | 'ngayPhanAnh' | 'maSanPham' | 'tenThuongMai' | 'noiDungPhanAnh' | 'soLo' | 'maNgaySanXuat' | 'trangThai' | 'actions';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  width: number;
  align?: 'left' | 'center' | 'right';
}

// Optimized widths for single-page view with 2-line height constraint
const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'stt', label: 'STT', visible: true, width: 50, align: 'center' },
    { id: 'ngayPhanAnh', label: 'Ngày P.Ánh', visible: true, width: 100, align: 'left' },
    { id: 'maSanPham', label: 'Mã SP', visible: true, width: 90, align: 'left' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, width: 250, align: 'left' },
    { id: 'noiDungPhanAnh', label: 'Nội dung phản ánh', visible: true, width: 350, align: 'left' },
    { id: 'soLo', label: 'Số lô', visible: true, width: 90, align: 'left' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: true, width: 90, align: 'left' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, width: 130, align: 'left' },
    { id: 'actions', label: '', visible: true, width: 80, align: 'center' },
];

const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim() || !text) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-200 text-slate-900 rounded-[2px] px-0.5 font-semibold shadow-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const DefectReportList: React.FC<Props> = ({ 
  reports, totalReports, currentPage, itemsPerPage, onPageChange, 
  onSelectReport, currentUserRole,
  filters, onSearchTermChange, onStatusFilterChange, onDefectTypeFilterChange, onYearFilterChange, onDateFilterChange,
  summaryStats, onItemsPerPageChange, onDelete, isLoading, onExport, onDuplicate
}) => {
  // Columns State
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [reportToDelete, setReportToDelete] = useState<DefectReport | null>(null);
  const [hoveredReport, setHoveredReport] = useState<DefectReport | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Virtualization State
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  
  // Fixed ROW_HEIGHT for approx 2 lines of text (14px font * 1.5 line-height * 2 lines + padding)
  const ROW_HEIGHT = 72; 

  // --- RESIZING LOGIC ---
  const resizingRef = useRef<{ startX: number; startWidth: number; colId: ColumnId } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = (e: React.MouseEvent, colId: ColumnId, currentWidth: number) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      resizingRef.current = { startX: e.clientX, startWidth: currentWidth, colId };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { startX, startWidth, colId } = resizingRef.current;
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);

      setColumns(prev => prev.map(col => 
          col.id === colId ? { ...col, width: newWidth } : col
      ));
  }, []);

  const handleMouseUp = useCallback(() => {
      setIsResizing(false);
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // --- VIRTUALIZATION LOGIC ---
  useEffect(() => {
      const handleResize = () => {
          if (parentRef.current) {
              setContainerHeight(parentRef.current.clientHeight);
          }
      };
      // Initial measure
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
      if (parentRef.current) {
          parentRef.current.scrollTop = 0;
          setScrollTop(0);
      }
  }, [currentPage, filters]);

  // Calculations for virtual window
  const totalContentHeight = reports.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2); // Buffer top
  const endIndex = Math.min(
      reports.length, 
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + 2 // Buffer bottom
  );
  const visibleReports = reports.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  // --- MISC HANDLERS ---
  const handleRowMouseEnter = (report: DefectReport) => setHoveredReport(report);
  const handleRowMouseLeave = () => setHoveredReport(null);
  
  const handleRowMouseMove = (e: React.MouseEvent) => {
      if (tooltipRef.current) {
          const tooltip = tooltipRef.current;
          let x = e.clientX + 15;
          let y = e.clientY + 15;
          const rect = tooltip.getBoundingClientRect();
          if (x + rect.width > window.innerWidth - 20) x = e.clientX - rect.width - 15;
          if (y + rect.height > window.innerHeight - 20) y = e.clientY - rect.height - 15;
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
      }
  };

  useEffect(() => {
      const savedColumns = localStorage.getItem('tableColumnConfigV6'); // Bump version for layout change
      if (savedColumns) {
          try {
              const parsedColumns = JSON.parse(savedColumns);
              const mergedColumns = DEFAULT_COLUMNS.map(def => {
                  const saved = parsedColumns.find((p: any) => p.id === def.id);
                  return saved ? { ...def, visible: saved.visible, width: saved.width } : def;
              });
              setColumns(mergedColumns);
          } catch (e) {
              setColumns(DEFAULT_COLUMNS);
          }
      }
  }, []);

  useEffect(() => { localStorage.setItem('tableColumnConfigV6', JSON.stringify(columns)); }, [columns]);

  // Close settings on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
              setShowSettings(false);
          }
      };

      if (showSettings) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [showSettings]);

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

  // Helper to calculate total table min-width
  const totalTableMinWidth = useMemo(() => visibleColumns.reduce((acc, col) => acc + col.width, 0), [visibleColumns]);

  // Helper to get column styles (fluid vs fixed)
  const getColumnStyle = (col: ColumnConfig) => {
      const isFluid = col.id === 'tenThuongMai' || col.id === 'noiDungPhanAnh';
      return {
          className: `${isFluid ? 'flex-1' : 'flex-none'} ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`,
          style: isFluid ? { minWidth: col.width } : { width: col.width }
      };
  };

  const renderCell = (report: DefectReport, columnId: ColumnId, index: number) => {
      switch (columnId) {
          case 'stt':
              return <span className="text-slate-500 font-bold text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
          case 'ngayPhanAnh':
              return <span className="text-slate-700 font-bold text-xs whitespace-nowrap">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>;
          case 'maSanPham':
              return (
                  <span className="text-blue-700 font-bold text-xs whitespace-nowrap block truncate" title={report.maSanPham}>
                      <HighlightText text={report.maSanPham} highlight={filters.searchTerm} />
                  </span>
              );
          case 'tenThuongMai':
              return (
                <div className="w-full pr-2" title={report.tenThuongMai}>
                    <div className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 whitespace-normal break-words">
                        <HighlightText text={report.tenThuongMai} highlight={filters.searchTerm} />
                    </div>
                </div>
              );
          case 'noiDungPhanAnh':
              return (
                <div className="w-full pr-2" title={report.noiDungPhanAnh}>
                    <div className="text-slate-600 text-xs leading-snug line-clamp-2 whitespace-normal break-words">
                        <HighlightText text={report.noiDungPhanAnh} highlight={filters.searchTerm} />
                    </div>
                </div>
              );
          case 'soLo':
              return (
                  <div className="w-full pr-1" title={report.soLo}>
                      <div className="text-slate-700 text-xs font-bold leading-snug line-clamp-2 whitespace-normal break-words">
                          <HighlightText text={report.soLo} highlight={filters.searchTerm} />
                      </div>
                  </div>
              );
          case 'maNgaySanXuat':
              return (
                  <div className="w-full pr-1" title={report.maNgaySanXuat}>
                      <div className="text-slate-600 text-xs font-medium leading-snug line-clamp-2 whitespace-normal break-words">
                          {report.maNgaySanXuat}
                      </div>
                  </div>
              );
          case 'trangThai':
              return (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap border ${statusColorMap[report.trangThai]}`}>
                      {report.trangThai.toUpperCase()}
                  </span>
              );
          case 'actions':
              const canDelete = ([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole);
              return (
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDuplicate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(report);
                            }}
                            className="p-1.5 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all shadow-sm active:scale-95"
                            title="Sao chép"
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
                            title="Xóa"
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
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap z-10 ${
              active 
              ? 'text-blue-700 border-blue-600 bg-blue-50/40' 
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
          }`}
      >
          <span className={`${active ? 'text-blue-600' : 'text-slate-400'} transition-colors`}>{icon}</span>
          <span>{label}</span>
          <span className={`ml-1 py-0.5 px-2 rounded-full text-xs font-extrabold transition-colors ${
              active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
          }`}>
              {count}
          </span>
      </button>
  );

  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-4 max-w-[1920px] mx-auto w-full">
      
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden ring-1 ring-slate-100 relative">
          
          {/* TABS */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white shadow-sm z-20 sticky top-0 h-12">
              <StatTab label="Tất cả" count={summaryStats.total} active={filters.statusFilter === 'All'} onClick={() => onStatusFilterChange('All')} icon={<InboxIcon className="h-4 w-4"/>} />
              <StatTab label="Mới" count={summaryStats.moi} active={filters.statusFilter === 'Mới'} onClick={() => onStatusFilterChange('Mới')} icon={<SparklesIcon className="h-4 w-4"/>} />
              <StatTab label="Đang xử lý" count={summaryStats.dangXuLy} active={filters.statusFilter === 'Đang xử lý'} onClick={() => onStatusFilterChange('Đang xử lý')} icon={<ClockIcon className="h-4 w-4"/>} />
              <StatTab label="Chưa rõ" count={summaryStats.chuaTimRaNguyenNhan} active={filters.statusFilter === 'Chưa tìm ra nguyên nhân'} onClick={() => onStatusFilterChange('Chưa tìm ra nguyên nhân')} icon={<MagnifyingGlassIcon className="h-4 w-4"/>} />
              <StatTab label="Hoàn thành" count={summaryStats.hoanThanh} active={filters.statusFilter === 'Hoàn thành'} onClick={() => onStatusFilterChange('Hoàn thành')} icon={<CheckCircleIcon className="h-4 w-4"/>} />
          </div>

          {/* FILTER BAR */}
          <div className="p-3 flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between bg-white border-b border-slate-100">
             <div className="relative w-full xl:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm hover:border-slate-300"
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
                        className="pl-9 pr-8 py-2 text-sm font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-blue-500 hover:bg-slate-50 cursor-pointer appearance-none min-w-[160px] shadow-sm focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300"
                        value={filters.defectTypeFilter}
                        onChange={(e) => onDefectTypeFilterChange(e.target.value)}
                    >
                        <option value="All">Tất cả nguồn gốc lỗi</option>
                        <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                        <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                        <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                        <option value="Lỗi Khác">Lỗi Khác</option>
                    </select>
                </div>
                 <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all hover:border-slate-300">
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
                 <button onClick={onExport} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:scale-95" title="Xuất Excel"><ArrowDownTrayIcon className="h-5 w-5" /></button>
                 <div className="relative" ref={settingsRef}>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:scale-95 ${showSettings ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-600'}`} title="Cấu hình cột"><Cog6ToothIcon className="h-5 w-5" /></button>
                    {showSettings && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-2 animate-fade-in-up">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-1">Hiển thị cột</h4>
                            <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                                {columns.map((col) => (
                                    <button key={col.id} onClick={() => toggleColumnVisibility(col.id)} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${col.visible ? 'text-blue-700 bg-blue-50 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}><span>{col.label || 'Thao tác'}</span>{col.visible && <CheckCircleIcon className="h-4 w-4" />}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {areFiltersActive && (
                    <button onClick={resetFilters} className="p-2 ml-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-transparent hover:border-red-200 shadow-sm active:scale-95" title="Xóa bộ lọc"><XIcon className="h-5 w-5" /></button>
                )}
            </div>
          </div>

          {/* TABLE CONTENT (Virtualized + Resizable + Auto Expand) */}
          <div className={`flex-1 overflow-hidden relative transition-opacity duration-300 flex flex-col bg-slate-50/30 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {reports.length > 0 ? (
                <div 
                    ref={parentRef} 
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto custom-scrollbar relative"
                >
                    <div className="min-w-full inline-block align-middle" style={{ minWidth: totalTableMinWidth }}>
                        {/* Table Header (Flex) */}
                        <div className="flex bg-white/95 backdrop-blur-md border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-20 shadow-sm h-[48px]">
                            {visibleColumns.map((col) => {
                                const { className, style } = getColumnStyle(col);
                                return (
                                    <div 
                                        key={col.id} 
                                        className={`relative flex items-center px-4 h-full border-r border-transparent hover:border-slate-100 ${className}`} 
                                        style={style}
                                    >
                                        {col.label}
                                        
                                        {/* Resize Handle */}
                                        <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-30"
                                            onMouseDown={(e) => startResize(e, col.id, col.width)}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                        
                        {/* Virtualized List Container */}
                        <div 
                            className="relative" 
                            style={{ height: totalContentHeight }}
                        >
                            {visibleReports.map((report, index) => {
                                const actualIndex = startIndex + index;
                                return (
                                    <div 
                                        key={report.id}
                                        style={{ 
                                            transform: `translateY(${offsetY + (index * ROW_HEIGHT)}px)`,
                                            height: ROW_HEIGHT,
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0
                                        }}
                                        onClick={() => onSelectReport(report)}
                                        onMouseEnter={() => handleRowMouseEnter(report)}
                                        onMouseLeave={handleRowMouseLeave}
                                        onMouseMove={handleRowMouseMove}
                                        className="group flex items-center transition-colors cursor-pointer border-b border-slate-100 hover:border-blue-500 hover:z-10 bg-white hover:bg-blue-50/60"
                                    >
                                        {visibleColumns.map((col) => {
                                            const { className, style } = getColumnStyle(col);
                                            return (
                                                <div 
                                                    key={col.id} 
                                                    className={`px-4 h-full flex items-center overflow-hidden ${className}`} 
                                                    style={style}
                                                >
                                                    {renderCell(report, col.id, actualIndex)}
                                                </div>
                                            )
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-16 text-center animate-fade-in-up">
                    <div className="w-64 h-48 bg-slate-100 rounded-full mb-6 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-slate-50 opacity-50"></div>
                        <InboxIcon className="h-24 w-24 text-slate-300/50" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Trống trơn!</h3>
                    <p className="text-slate-500 mt-2 max-w-sm font-medium leading-relaxed">
                        {areFiltersActive 
                            ? "Không tìm thấy kết quả nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh lại." 
                            : "Hệ thống chưa có dữ liệu phản ánh nào. Hãy bắt đầu bằng cách tạo mới."}
                    </p>
                    {areFiltersActive && (
                        <button 
                            onClick={resetFilters}
                            className="mt-6 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 active:scale-95"
                        >
                            Xóa bộ lọc tìm kiếm
                        </button>
                    )}
                </div>
            )}

            <div className="p-3 border-t border-slate-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.01)] relative z-20">
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
                <h3 className="text-xl font-bold text-slate-900 text-center mb-2 uppercase tracking-tight">XÓA PHẢN ÁNH?</h3>
                <p className="text-sm text-slate-500 text-center mb-8 font-medium">
                    Bạn sắp xóa phản ánh <span className="font-bold text-slate-900 bg-slate-100 px-1 rounded">{reportToDelete.maSanPham}</span>. Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setReportToDelete(null)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95">Hủy</button>
                    <button onClick={() => { onDelete(reportToDelete.id); setReportToDelete(null); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95">Xóa ngay</button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Tooltip */}
      <div 
        ref={tooltipRef}
        className={`fixed z-[999] bg-white/95 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-2xl pointer-events-none transition-opacity duration-200 max-w-[340px] w-full ring-1 ring-black/5 ${hoveredReport ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        style={{ left: 0, top: 0, transitionProperty: 'opacity, transform' }}
      >
        {hoveredReport && (
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-sm text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded-lg ring-1 ring-blue-100">{hoveredReport.maSanPham}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase shadow-sm ${
                        hoveredReport.trangThai === 'Mới' ? 'bg-blue-100 text-blue-700' : 
                        hoveredReport.trangThai === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-amber-100 text-amber-700'
                    }`}>
                        {hoveredReport.trangThai}
                    </span>
                </div>
                <div>
                    <p className="text-base font-bold text-slate-800 mb-1 leading-tight">{hoveredReport.tenThuongMai}</p>
                    {hoveredReport.tenThietBi && ( <p className="text-sm text-slate-500 truncate mb-2">{hoveredReport.tenThietBi}</p> )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3">
                         <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">Lô: {hoveredReport.soLo}</span>
                         {hoveredReport.loaiLoi && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{hoveredReport.loaiLoi}</span>}
                    </div>
                    <div className="relative bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 italic">
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
