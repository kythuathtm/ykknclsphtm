
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DefectReport, UserRole } from '../types';
import Pagination from './Pagination';
import { 
    MagnifyingGlassIcon, InboxIcon, ClockIcon, CheckCircleIcon, 
    SparklesIcon, Cog6ToothIcon, TrashIcon, ArrowDownTrayIcon,
    CalendarIcon, FunnelIcon, XIcon, DocumentDuplicateIcon,
    ArrowUpIcon, ArrowDownIcon, AdjustmentsIcon, CheckSquareIcon
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
  currentUsername: string;
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
  onDeleteMultiple?: (ids: string[]) => void;
  isLoading?: boolean;
  onExport: () => void;
  onDuplicate?: (report: DefectReport) => void;
  baseFontSize?: string; 
}

const statusColorMap: { [key in DefectReport['trangThai']]: string } = {
  'Mới': 'bg-[#003DA5]/10 text-[#003DA5] border-[#003DA5]/20', 
  'Đang xử lý': 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20', 
  'Chưa tìm ra nguyên nhân': 'bg-slate-100 text-slate-600 border-slate-200', 
  'Hoàn thành': 'bg-[#009183]/10 text-[#009183] border-[#009183]/20', 
};

const statusBorderMap: { [key in DefectReport['trangThai']]: string } = {
  'Mới': 'bg-[#003DA5]',
  'Đang xử lý': 'bg-[#F59E0B]',
  'Chưa tìm ra nguyên nhân': 'bg-slate-400',
  'Hoàn thành': 'bg-[#009183]',
};

type ColumnId = 'select' | 'stt' | 'ngayPhanAnh' | 'maSanPham' | 'tenThuongMai' | 'noiDungPhanAnh' | 'soLo' | 'maNgaySanXuat' | 'trangThai' | 'actions';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  width: number;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'select', label: '', visible: true, width: 40, align: 'center', fixed: true },
    { id: 'stt', label: 'STT', visible: true, width: 50, align: 'center' },
    { id: 'ngayPhanAnh', label: 'Ngày phản ánh', visible: true, width: 120, align: 'left' },
    { id: 'maSanPham', label: 'Mã sản phẩm', visible: true, width: 120, align: 'left' },
    { id: 'tenThuongMai', label: 'Tên thương mại', visible: true, width: 250, align: 'left' }, 
    { id: 'noiDungPhanAnh', label: 'Nội dung phản ánh', visible: true, width: 300, align: 'left' }, 
    { id: 'soLo', label: 'Số lô', visible: true, width: 100, align: 'left' },
    { id: 'maNgaySanXuat', label: 'Mã NSX', visible: true, width: 100, align: 'left' },
    { id: 'trangThai', label: 'Trạng thái', visible: true, width: 150, align: 'left' },
    { id: 'actions', label: '', visible: true, width: 100, align: 'center', fixed: true },
];

const HighlightText = React.memo(({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim() || !text) return <>{text}</>;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-200 text-slate-900 rounded-[2px] px-0.5 shadow-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
});

// Mobile Card
const MobileReportCard = React.memo(({ 
    report, onSelect, onDuplicate, onDelete, canDelete, highlight, style, isSelected, onToggleSelect 
}: { 
    report: DefectReport, onSelect: () => void, 
    onDuplicate: ((r: DefectReport) => void) | undefined, 
    onDelete: (id: string) => void, canDelete: boolean, highlight: string, style?: React.CSSProperties,
    isSelected: boolean, onToggleSelect: () => void
}) => {
    return (
        <div 
            style={style}
            onClick={onSelect}
            className={`absolute left-0 right-0 w-full pl-3 pr-4 py-3 border-b border-slate-100 transition-colors touch-manipulation flex flex-col justify-between bg-white overflow-hidden ${isSelected ? 'bg-blue-50/50' : ''}`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusBorderMap[report.trangThai]}`}></div>

            <div className="flex gap-3">
                {/* Selection Checkbox Area */}
                <div className="flex items-start pt-1" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#003DA5] border-[#003DA5]' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#003DA5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                <HighlightText text={report.maSanPham} highlight={highlight} />
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}
                            </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColorMap[report.trangThai]}`}>
                            {report.trangThai}
                        </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-base mb-1.5 leading-snug line-clamp-2">
                        <HighlightText text={report.tenThuongMai} highlight={highlight} />
                    </h4>
                    
                    <div className="text-sm font-normal text-slate-600 mb-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
                        <HighlightText text={report.noiDungPhanAnh || 'Không có nội dung'} highlight={highlight} />
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Lô: <span className="text-slate-800"><HighlightText text={report.soLo} highlight={highlight} /></span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {onDuplicate && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDuplicate(report); }}
                                    className="text-slate-400 hover:text-[#003DA5] active:scale-95 p-2 -m-2"
                                >
                                    <DocumentDuplicateIcon className="h-5 w-5" />
                                </button>
                            )}
                            {canDelete && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
                                    className="text-slate-400 hover:text-red-600 active:scale-95 p-2 -m-2"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const DefectReportList: React.FC<Props> = ({ 
  reports, totalReports, currentPage, itemsPerPage, onPageChange, 
  onSelectReport, currentUserRole, currentUsername,
  filters, onSearchTermChange, onStatusFilterChange, onDefectTypeFilterChange, onYearFilterChange, onDateFilterChange,
  summaryStats, onItemsPerPageChange, onDelete, onDeleteMultiple, isLoading, onExport, onDuplicate, baseFontSize = '15px'
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [reportToDelete, setReportToDelete] = useState<DefectReport | null>(null);
  const [hoveredReport, setHoveredReport] = useState<DefectReport | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const parentRef = useRef<HTMLDivElement>(null);       
  const mobileListRef = useRef<HTMLDivElement>(null);   
  const [scrollTop, setScrollTop] = useState(0);              
  const [mobileScrollTop, setMobileScrollTop] = useState(0);  
  const [containerHeight, setContainerHeight] = useState(600);
  const [mobileContainerHeight, setMobileContainerHeight] = useState(600);
  
  const fontSizePx = parseInt(baseFontSize, 10) || 15;
  const ROW_HEIGHT = Math.max(50, fontSizePx * 3.4);        
  const MOBILE_ROW_HEIGHT = Math.max(190, fontSizePx * 12.5);

  const resizingRef = useRef<{ startX: number; startWidth: number; colId: ColumnId } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedColId, setDraggedColId] = useState<ColumnId | null>(null);
  const storageKey = `tableColumnConfigV18_${currentUsername}`; // Bump version

  // Reset Selection when data changes (e.g. page change or filter)
  useEffect(() => {
      setSelectedIds(new Set());
  }, [currentPage, filters]);

  // Load Columns
  useEffect(() => {
    if (!currentUsername) return;
    const savedColumnsStr = localStorage.getItem(storageKey); 
    if (savedColumnsStr) {
        try {
            const parsedColumns = JSON.parse(savedColumnsStr) as ColumnConfig[];
            // Ensure select column exists and is first
            const defaultColMap = new Map(DEFAULT_COLUMNS.map(c => [c.id, c]));
            const newColumns: ColumnConfig[] = [];
            
            // Add 'select' if missing from saved (migration)
            if (!parsedColumns.find(c => c.id === 'select')) {
                newColumns.push(DEFAULT_COLUMNS[0]);
            }

            parsedColumns.forEach(savedCol => {
                const defaultCol = defaultColMap.get(savedCol.id);
                if (defaultCol) {
                    newColumns.push({ ...defaultCol, width: savedCol.width, visible: savedCol.visible });
                }
            });
            // Add new defaults
            DEFAULT_COLUMNS.forEach(defCol => {
                if (!newColumns.find(c => c.id === defCol.id)) newColumns.push(defCol);
            });
            setColumns(newColumns);
        } catch (e) {
            setColumns(DEFAULT_COLUMNS);
        }
    } else {
        setColumns(DEFAULT_COLUMNS);
    }
  }, [currentUsername]);

  useEffect(() => { if (currentUsername) localStorage.setItem(storageKey, JSON.stringify(columns)); }, [columns, currentUsername]);

  // --- HANDLERS ---
  const handleSelectAll = () => {
      if (selectedIds.size === reports.length && reports.length > 0) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(reports.map(r => r.id)));
      }
  };

  const handleSelectOne = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
      if (selectedIds.size === 0) return;
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} phiếu đã chọn?`)) {
          onDeleteMultiple?.(Array.from(selectedIds));
          setSelectedIds(new Set());
      }
  };

  // --- RESIZE HANDLERS ---
  const startResize = (e: React.MouseEvent, colId: ColumnId, currentWidth: number) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      resizingRef.current = { startX: e.clientX, startWidth: currentWidth, colId };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { startX, startWidth, colId } = resizingRef.current;
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);

      setColumns(prev => prev.map(col => 
          col.id === colId ? { ...col, width: newWidth } : col
      ));
  }, []);

  const handleResizeMouseUp = useCallback(() => {
      setIsResizing(false);
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
  }, [handleResizeMouseMove]);

  // --- VIRTUALIZATION HANDLERS ---
  useEffect(() => {
      const handleResize = () => {
          if (parentRef.current) setContainerHeight(parentRef.current.clientHeight);
          if (mobileListRef.current) setMobileContainerHeight(mobileListRef.current.clientHeight);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => { requestAnimationFrame(() => setScrollTop(e.currentTarget.scrollTop)); }, []);
  const handleMobileScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => { requestAnimationFrame(() => setMobileScrollTop(e.currentTarget.scrollTop)); }, []);

  useEffect(() => {
      if (parentRef.current) { parentRef.current.scrollTop = 0; setScrollTop(0); }
      if (mobileListRef.current) { mobileListRef.current.scrollTop = 0; setMobileScrollTop(0); }
  }, [currentPage, filters]);

  // Virtualization Calc
  const totalContentHeight = reports.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2); 
  const endIndex = Math.min(reports.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + 2);
  const visibleReports = reports.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  const totalMobileContentHeight = reports.length * MOBILE_ROW_HEIGHT;
  const mobileStartIndex = Math.max(0, Math.floor(mobileScrollTop / MOBILE_ROW_HEIGHT) - 2);
  const mobileEndIndex = Math.min(reports.length, Math.ceil((mobileScrollTop + mobileContainerHeight) / MOBILE_ROW_HEIGHT) + 2);
  const visibleMobileReports = reports.slice(mobileStartIndex, mobileEndIndex);
  const mobileOffsetY = mobileStartIndex * MOBILE_ROW_HEIGHT;

  // --- DRAG & DROP COLUMN ORDERING ---
  const handleHeaderDragStart = (e: React.DragEvent, colId: ColumnId) => {
    if (e.button !== 0) { e.preventDefault(); return; }
    setDraggedColId(colId);
    e.dataTransfer.setData('colId', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleHeaderDragEnter = (e: React.DragEvent, targetColId: ColumnId) => { e.preventDefault(); };
  const handleHeaderDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleHeaderDrop = (e: React.DragEvent, targetColId: ColumnId) => {
    e.preventDefault();
    const sourceColId = e.dataTransfer.getData('colId') as ColumnId;
    setDraggedColId(null);
    if (!sourceColId || sourceColId === targetColId) return;

    const fromIndex = columns.findIndex(c => c.id === sourceColId);
    const toIndex = columns.findIndex(c => c.id === targetColId);

    if (fromIndex !== -1 && toIndex !== -1) {
        if (columns[fromIndex].fixed || columns[toIndex].fixed) return;
        const newCols = [...columns];
        const [movedCol] = newCols.splice(fromIndex, 1);
        newCols.splice(toIndex, 0, movedCol);
        setColumns(newCols);
    }
  };

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
      const handleClickOutside = (event: MouseEvent) => {
          if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setShowSettings(false);
      };
      if (showSettings) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const toggleColumnVisibility = (id: ColumnId) => {
      setColumns(prev => prev.map(col => col.id === id ? { ...col, visible: !col.visible } : col));
  };

  const resetColumnsToDefault = () => setColumns(DEFAULT_COLUMNS);

  const moveColumn = (index: number, direction: -1 | 1) => {
    const newCols = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    if (newCols[targetIndex].fixed) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const resetFilters = () => {
    onSearchTermChange('');
    onStatusFilterChange('All');
    onDefectTypeFilterChange('All');
    onYearFilterChange('All');
    onDateFilterChange({ start: '', end: '' });
  };
  
  const areFiltersActive = filters.searchTerm || filters.statusFilter !== 'All' || filters.defectTypeFilter !== 'All' || filters.yearFilter !== 'All' || filters.dateFilter.start || filters.dateFilter.end;
  
  // --- RENDER HELPERS ---
  const canDeleteRole = ([UserRole.Admin, UserRole.KyThuat] as string[]).includes(currentUserRole);
  const showDefectTypeFilter = !([UserRole.SanXuat, UserRole.Kho] as string[]).includes(currentUserRole);
  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const renderCell = (report: DefectReport, columnId: ColumnId, index: number) => {
      const isSelected = selectedIds.has(report.id);
      switch (columnId) {
          case 'select':
              return (
                  <div className="flex items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleSelectOne(report.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#003DA5] border-[#003DA5]' : 'border-slate-300 bg-white hover:border-[#003DA5]'}`}
                      >
                          {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                  </div>
              );
          case 'stt': return <span className="text-slate-500 font-normal text-base">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
          case 'ngayPhanAnh': return <span className="text-slate-700 font-normal text-base whitespace-nowrap">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>;
          case 'maSanPham': return <span className="text-[#003DA5] font-bold text-base whitespace-nowrap block truncate" title={report.maSanPham}><HighlightText text={report.maSanPham} highlight={filters.searchTerm} /></span>;
          case 'tenThuongMai': return <div className="w-full pr-2" title={report.tenThuongMai}><div className="font-semibold text-slate-800 text-base leading-snug line-clamp-2 whitespace-normal break-words"><HighlightText text={report.tenThuongMai} highlight={filters.searchTerm} /></div></div>;
          case 'noiDungPhanAnh': return <div className="w-full pr-2" title={report.noiDungPhanAnh}><div className="text-slate-500 text-sm font-normal leading-snug line-clamp-2 whitespace-normal break-words italic"><HighlightText text={report.noiDungPhanAnh} highlight={filters.searchTerm} /></div></div>;
          case 'soLo': return <div className="w-full pr-1" title={report.soLo}><div className="text-slate-700 text-base font-medium leading-snug line-clamp-2 whitespace-normal break-words"><HighlightText text={report.soLo} highlight={filters.searchTerm} /></div></div>;
          case 'maNgaySanXuat': return <div className="w-full pr-1" title={report.maNgaySanXuat}><div className="text-slate-600 text-sm font-normal leading-snug line-clamp-2 whitespace-normal break-words">{report.maNgaySanXuat}</div></div>;
          case 'trangThai': return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap border uppercase tracking-wide ${statusColorMap[report.trangThai]}`}>{report.trangThai}</span>;
          case 'actions':
              return (
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDuplicate && <button onClick={(e) => { e.stopPropagation(); onDuplicate(report); }} className="p-1.5 bg-white text-slate-400 hover:text-[#003DA5] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg shadow-sm" title="Sao chép"><DocumentDuplicateIcon className="h-4 w-4" /></button>}
                      {canDeleteRole && <button onClick={(e) => { e.stopPropagation(); setReportToDelete(report); }} className="p-1.5 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg shadow-sm" title="Xóa"><TrashIcon className="h-4 w-4" /></button>}
                  </div>
              );
          default: return null;
      }
  };

  const StatTab = ({ label, count, active, onClick, icon }: any) => (
      <button 
          onClick={onClick}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap z-10 flex-shrink-0 snap-start ${
              active 
              ? 'text-[#003DA5] border-[#003DA5] bg-blue-50/40' 
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
          }`}
      >
          <span className={`${active ? 'text-[#003DA5]' : 'text-slate-400'} transition-colors`}>{icon}</span>
          <span>{label}</span>
          <span className={`ml-1 py-0.5 px-2 rounded-full text-xs font-extrabold transition-colors ${
              active ? 'bg-[#003DA5] text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
          }`}>
              {count}
          </span>
      </button>
  );

  const getColumnStyle = (col: ColumnConfig) => {
      return {
          className: `${col.fixed ? 'sticky right-0 z-10 bg-white/95 backdrop-blur shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] flex-none' : ''} ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'} flex items-center min-w-0`,
          style: { 
              flex: col.fixed ? 'none' : `${col.width} 1 ${col.width}px`,
              minWidth: `${col.width}px`,
              width: col.fixed ? `${col.width}px` : undefined
          }
      };
  };

  return (
    <div className="flex flex-col h-full w-full relative px-0 sm:px-4 lg:px-8 py-0 sm:py-4">
      <div className="flex flex-col h-full bg-slate-50 sm:bg-white sm:rounded-2xl sm:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] sm:border sm:border-slate-200 overflow-hidden sm:ring-1 sm:ring-slate-100 relative">
          
          {/* TABS */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white shadow-sm z-20 sticky top-0 h-12 w-full snap-x">
              <StatTab label="Tất cả" count={summaryStats.total} active={filters.statusFilter === 'All'} onClick={() => onStatusFilterChange('All')} icon={<InboxIcon className="h-4 w-4"/>} />
              <StatTab label="Mới" count={summaryStats.moi} active={filters.statusFilter === 'Mới'} onClick={() => onStatusFilterChange('Mới')} icon={<SparklesIcon className="h-4 w-4"/>} />
              <StatTab label="Đang xử lý" count={summaryStats.dangXuLy} active={filters.statusFilter === 'Đang xử lý'} onClick={() => onStatusFilterChange('Đang xử lý')} icon={<ClockIcon className="h-4 w-4"/>} />
              <StatTab label="Chưa rõ" count={summaryStats.chuaTimRaNguyenNhan} active={filters.statusFilter === 'Chưa tìm ra nguyên nhân'} onClick={() => onStatusFilterChange('Chưa tìm ra nguyên nhân')} icon={<MagnifyingGlassIcon className="h-4 w-4"/>} />
              <StatTab label="Hoàn thành" count={summaryStats.hoanThanh} active={filters.statusFilter === 'Hoàn thành'} onClick={() => onStatusFilterChange('Hoàn thành')} icon={<CheckCircleIcon className="h-4 w-4"/>} />
          </div>

          {/* FILTER BAR */}
          <div className="p-2 sm:p-3 flex flex-col lg:flex-row gap-2 sm:gap-3 items-stretch lg:items-center justify-between bg-white border-b border-slate-100">
             
             {/* Mobile Filter Toggle & Search */}
             <div className="flex gap-2 items-center w-full lg:w-auto">
                <div className="relative w-full lg:w-80 xl:w-96 group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#003DA5] transition-colors"><MagnifyingGlassIcon className="h-5 w-5" /></div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] focus:bg-white transition-all shadow-sm hover:border-slate-300" placeholder="Tìm theo mã, tên, lô..." value={filters.searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} />
                </div>
                <button onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)} className={`lg:hidden p-2 rounded-xl border transition-all ${isMobileFiltersOpen ? 'bg-blue-50 text-[#003DA5] border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><AdjustmentsIcon className="h-5 w-5" /></button>
             </div>

            {/* Collapsible Filter Area */}
            <div className={`flex flex-col lg:flex-row gap-2 w-full lg:w-auto overflow-hidden transition-all duration-300 ease-in-out lg:!h-auto lg:!opacity-100 ${isMobileFiltersOpen ? 'max-h-[300px] opacity-100 pt-2 lg:pt-0 border-t border-slate-100 lg:border-none' : 'max-h-0 opacity-0 lg:overflow-visible'}`}>
                <div className="flex flex-col sm:flex-row gap-2 w-full items-center">
                    {showDefectTypeFilter && (
                        <div className="relative group w-full sm:w-auto sm:min-w-[150px]">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#003DA5] transition-colors"><FunnelIcon className="h-4 w-4" /></div>
                            <select className="w-full pl-8 pr-8 py-2 text-sm font-normal border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-[#003DA5] hover:bg-slate-50 cursor-pointer appearance-none shadow-sm focus:ring-2 focus:ring-blue-500/20" value={filters.defectTypeFilter} onChange={(e) => onDefectTypeFilterChange(e.target.value)}>
                                <option value="All">Tất cả nguồn</option>
                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                <option value="Lỗi Nhà cung cấp">Lỗi NCC</option>
                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                <option value="Lỗi Khác">Lỗi Khác</option>
                            </select>
                        </div>
                    )}
                    <div className="flex w-full sm:w-auto items-center bg-white rounded-xl border border-slate-200 px-2 sm:px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all hover:border-slate-300">
                        <CalendarIcon className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                        <div className="flex items-center gap-1 flex-1">
                            <input type="date" className="bg-transparent text-sm text-slate-700 focus:outline-none font-normal py-0.5 w-[85px] cursor-pointer" value={filters.dateFilter.start} max={filters.dateFilter.end} onChange={(e) => onDateFilterChange({ ...filters.dateFilter, start: e.target.value })} />
                            <span className="text-slate-300 font-medium">-</span>
                            <input type="date" className="bg-transparent text-sm text-slate-700 focus:outline-none font-normal py-0.5 w-[85px] cursor-pointer" value={filters.dateFilter.end} min={filters.dateFilter.start} onChange={(e) => onDateFilterChange({ ...filters.dateFilter, end: e.target.value })} />
                        </div>
                        {(filters.dateFilter.start || filters.dateFilter.end) && <button onClick={() => onDateFilterChange({ start: '', end: '' })} className="ml-1 text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-colors active:scale-90 flex-shrink-0"><XIcon className="h-3.5 w-3.5" /></button>}
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0 lg:ml-auto w-full lg:w-auto">
                     <div className="h-8 w-px bg-slate-200 mx-1 hidden lg:block"></div>
                     <button onClick={onExport} className="flex-1 lg:flex-none p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-[#003DA5] hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 lg:block" title="Xuất Excel"><ArrowDownTrayIcon className="h-5 w-5" /><span className="lg:hidden text-sm font-bold">Xuất Excel</span></button>
                     <div className="relative hidden md:block" ref={settingsRef}>
                        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 bg-white border border-slate-200 rounded-xl hover:text-[#003DA5] hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm active:scale-95 ${showSettings ? 'text-[#003DA5] border-blue-200 bg-blue-50' : 'text-slate-600'}`} title="Cấu hình cột"><Cog6ToothIcon className="h-5 w-5" /></button>
                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-3 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cấu hình cột</h4>
                                    <button onClick={resetColumnsToDefault} className="text-xs font-bold text-[#003DA5] hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors">Mặc định</button>
                                </div>
                                <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                                    {columns.map((col, index) => {
                                        if (col.fixed) return null;
                                        const isTop = columns[index - 1]?.fixed;
                                        const isBottom = columns[index + 1]?.fixed;
                                        return (
                                            <div key={col.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                                                <button onClick={() => toggleColumnVisibility(col.id)} className="flex items-center flex-1 gap-3 min-w-0">
                                                    <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${col.visible ? 'bg-[#003DA5] border-[#003DA5]' : 'border-slate-300 bg-white'}`}>{col.visible && <CheckCircleIcon className="w-4 h-4 text-white" />}</div>
                                                    <span className={`text-sm font-medium truncate ${col.visible ? 'text-slate-700' : 'text-slate-400'}`}>{col.label}</span>
                                                </button>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                     <button onClick={(e) => { e.stopPropagation(); moveColumn(index, -1); }} disabled={isTop} className="p-1.5 text-slate-400 hover:text-[#003DA5] hover:bg-blue-50 rounded-md disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"><ArrowUpIcon className="w-3.5 h-3.5" /></button>
                                                     <button onClick={(e) => { e.stopPropagation(); moveColumn(index, 1); }} disabled={isBottom} className="p-1.5 text-slate-400 hover:text-[#003DA5] hover:bg-blue-50 rounded-md disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"><ArrowDownIcon className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    {areFiltersActive && <button onClick={resetFilters} className="p-2 ml-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-transparent hover:border-red-200 shadow-sm active:scale-95 flex-shrink-0" title="Xóa bộ lọc"><XIcon className="h-5 w-5" /></button>}
                </div>
            </div>
          </div>

          {/* LIST CONTENT */}
          <div className={`flex-1 overflow-hidden relative transition-opacity duration-300 flex flex-col bg-slate-50/50 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {reports.length > 0 ? (
                <>
                    {/* MOBILE CARD VIEW */}
                    <div ref={mobileListRef} onScroll={handleMobileScroll} className="md:hidden flex-1 overflow-y-auto bg-slate-50 pb-24 custom-scrollbar relative">
                        <div style={{ height: totalMobileContentHeight }} className="relative w-full">
                            {visibleMobileReports.map((report, index) => (
                                <MobileReportCard key={report.id} style={{ top: 0, transform: `translateY(${mobileOffsetY + (index * MOBILE_ROW_HEIGHT)}px)`, height: MOBILE_ROW_HEIGHT, willChange: 'transform' }} report={report} onSelect={() => onSelectReport(report)} onDuplicate={onDuplicate} onDelete={(id) => setReportToDelete(reports.find(r => r.id === id) || null)} canDelete={canDeleteRole} highlight={filters.searchTerm} isSelected={selectedIds.has(report.id)} onToggleSelect={() => handleSelectOne(report.id)} />
                            ))}
                        </div>
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div ref={parentRef} onScroll={handleScroll} className="hidden md:block flex-1 overflow-auto custom-scrollbar relative">
                        <div className="min-w-full inline-block align-middle">
                            <div className="flex bg-white/95 backdrop-blur-md border-b border-slate-200 text-left text-sm font-bold text-slate-600 tracking-wide sticky top-0 z-20 shadow-sm min-w-full w-full" style={{ height: ROW_HEIGHT }}>
                                {visibleColumns.map((col) => (
                                    <div key={col.id} draggable={!col.fixed} onDragStart={(e) => handleHeaderDragStart(e, col.id)} onDragEnter={(e) => handleHeaderDragEnter(e, col.id)} onDragOver={handleHeaderDragOver} onDrop={(e) => handleHeaderDrop(e, col.id)} className={`relative flex items-center px-3 h-full border-r border-transparent hover:border-slate-100 ${col.fixed ? 'sticky right-0 z-10 bg-white/95 backdrop-blur shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] flex-none' : ''} whitespace-nowrap ${!col.fixed ? 'cursor-move active:cursor-grabbing hover:bg-slate-50' : ''} ${draggedColId === col.id ? 'opacity-50 bg-blue-50' : ''} ${col.id === 'select' ? 'justify-center' : ''}`} style={{ flex: col.fixed ? 'none' : `${col.width} 1 ${col.width}px`, minWidth: `${col.width}px`, width: col.fixed ? `${col.width}px` : undefined }} title={!col.fixed ? "Kéo để sắp xếp lại cột" : undefined}>
                                        {col.id === 'select' ? (
                                            <button onClick={handleSelectAll} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.size > 0 && selectedIds.size === reports.length ? 'bg-[#003DA5] border-[#003DA5]' : 'border-slate-300 bg-white hover:border-[#003DA5]'}`}>
                                                {selectedIds.size > 0 && selectedIds.size === reports.length && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                        ) : (
                                            <>
                                                {col.label}
                                                {!col.fixed && <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-30 opacity-0 hover:opacity-100 transition-opacity" onMouseDown={(e) => startResize(e, col.id, col.width)} onClick={(e) => e.stopPropagation()} />}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="relative min-w-full w-full" style={{ height: totalContentHeight }}>
                                {visibleReports.map((report, index) => {
                                    const actualIndex = startIndex + index;
                                    const isSelected = selectedIds.has(report.id);
                                    return (
                                        <div key={report.id} style={{ transform: `translateY(${offsetY + (index * ROW_HEIGHT)}px)`, height: ROW_HEIGHT, position: 'absolute', top: 0, left: 0, right: 0, willChange: 'transform' }} onClick={() => onSelectReport(report)} onMouseEnter={() => setHoveredReport(report)} onMouseLeave={() => setHoveredReport(null)} onMouseMove={handleRowMouseMove} className={`group flex items-center transition-colors cursor-pointer border-b hover:z-10 min-w-full w-full ${isSelected ? 'bg-blue-50/60 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-500 hover:bg-[#003DA5]/5'}`}>
                                            {visibleColumns.map((col) => {
                                                const { className, style } = getColumnStyle(col);
                                                return (
                                                    <div key={col.id} className={`px-3 h-full flex items-center overflow-hidden ${className}`} style={style}>
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
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-16 text-center animate-fade-in-up">
                    <div className="w-64 h-48 bg-slate-100 rounded-full mb-6 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-slate-50 opacity-50"></div><InboxIcon className="h-24 w-24 text-slate-300/50" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Trống trơn!</h3>
                    <p className="text-slate-500 mt-2 max-w-sm font-medium leading-relaxed">{filters.searchTerm ? "Không tìm thấy kết quả nào." : "Hệ thống chưa có dữ liệu phản ánh nào."}</p>
                    {areFiltersActive && <button onClick={resetFilters} className="mt-6 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all hover:border-blue-300 hover:text-[#003DA5] active:scale-95">Xóa bộ lọc tìm kiếm</button>}
                </div>
            )}
            <div className="hidden md:block p-3 border-t border-slate-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.01)] relative z-20"><Pagination currentPage={currentPage} totalItems={totalReports} itemsPerPage={itemsPerPage} onPageChange={onPageChange} onItemsPerPageChange={onItemsPerPageChange} /></div>
            <div className="md:hidden p-3 pb-safe bg-white border-t border-slate-200 relative z-20"><Pagination currentPage={currentPage} totalItems={totalReports} itemsPerPage={itemsPerPage} onPageChange={onPageChange} onItemsPerPageChange={onItemsPerPageChange} /></div>
          </div>
      </div>
      
      {/* BULK ACTIONS FLOATING BAR */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 transform ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
          <div className="bg-slate-800 text-white rounded-2xl shadow-2xl p-2 px-4 flex items-center gap-4 border border-slate-700">
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Đã chọn {selectedIds.size}</span>
              <div className="h-6 w-px bg-slate-600"></div>
              {canDeleteRole && (
                  <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold transition-colors active:scale-95">
                      <TrashIcon className="w-4 h-4" /> Xóa
                  </button>
              )}
              <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-colors active:scale-95">
                  Hủy
              </button>
          </div>
      </div>

      {reportToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up border border-white/20">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5 mx-auto shadow-sm ring-1 ring-red-100"><TrashIcon className="h-7 w-7 text-red-500" /></div>
                <h3 className="text-xl font-bold text-slate-900 text-center mb-2 uppercase tracking-tight">XÓA PHẢN ÁNH?</h3>
                <p className="text-sm text-slate-500 text-center mb-8 font-medium">Bạn sắp xóa phản ánh <span className="font-bold text-slate-900 bg-slate-100 px-1 rounded">{reportToDelete.maSanPham}</span>.</p>
                <div className="flex gap-3">
                    <button onClick={() => setReportToDelete(null)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95">Hủy</button>
                    <button onClick={() => { onDelete(reportToDelete.id); setReportToDelete(null); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95">Xóa ngay</button>
                </div>
            </div>
        </div>
      )}
      
      <div ref={tooltipRef} className={`hidden md:block fixed z-[999] bg-white/95 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-2xl pointer-events-none transition-opacity duration-200 max-w-[340px] w-full ring-1 ring-black/5 ${hoveredReport ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ left: 0, top: 0, transitionProperty: 'opacity, transform' }}>
        {hoveredReport && (
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-sm text-[#003DA5] uppercase bg-blue-50 px-2 py-0.5 rounded-lg ring-1 ring-blue-100">{hoveredReport.maSanPham}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase shadow-sm ${statusColorMap[hoveredReport.trangThai]}`}>{hoveredReport.trangThai}</span>
                </div>
                <div>
                    <p className="text-base font-bold text-slate-800 mb-1 leading-tight">{hoveredReport.tenThuongMai}</p>
                    {hoveredReport.tenThietBi && ( <p className="text-sm text-slate-500 truncate mb-2">{hoveredReport.tenThietBi}</p> )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3">
                         <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">Lô: {hoveredReport.soLo}</span>
                         {hoveredReport.loaiLoi && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{hoveredReport.loaiLoi}</span>}
                    </div>
                    <div className="relative bg-slate-50 p-2 rounded-lg border border-slate-100"><p className="text-sm text-slate-600 leading-relaxed line-clamp-3 italic">"{hoveredReport.noiDungPhanAnh}"</p></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DefectReportList);
