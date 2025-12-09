import React, { useState, useEffect, useRef } from 'react';
import * as ReactToPrintPkg from 'react-to-print';
import { DefectReport, UserRole, ActivityLog } from '../types';
import { 
  PencilIcon, TrashIcon, XIcon, WrenchIcon, ClipboardDocumentListIcon, 
  TagIcon, ChatBubbleLeftIcon, ClockIcon, CheckCircleIcon, ArrowDownTrayIcon, 
  BuildingStoreIcon, CalendarIcon, PaperAirplaneIcon, MapPinIcon, UserGroupIcon,
  ArchiveBoxIcon, ExclamationTriangleIcon, CubeIcon, PrinterIcon, ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from './Icons';

// Handle ReactToPrint import compatibility
const useReactToPrint = (ReactToPrintPkg as any).useReactToPrint || (ReactToPrintPkg as any).default?.useReactToPrint;

interface Props {
  report: DefectReport;
  onEdit: (report: DefectReport) => void;
  onUpdate: (id: string, updates: Partial<DefectReport>, msg?: string, user?: { username: string, role: string }) => Promise<boolean>;
  onDelete: (id: string) => void;
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  currentUserRole: UserRole;
  currentUsername: string;
  onAddComment: (reportId: string, content: string, user: { username: string, role: string }) => Promise<boolean>;
}

// --- Helper Functions ---
const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch(e) { return dateStr || ''; }
};

// --- Helper Components ---

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  wrapperClass?: string;
  icon?: React.ReactNode;
  isFullWidth?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, className = "text-slate-800", wrapperClass = "col-span-1", icon, isFullWidth = false }) => {
    // Check if value is potentially dangerous (raw object)
    let displayValue = value;
    const showPlaceholder = value === null || value === undefined || value === '';

    if (!showPlaceholder && typeof value === 'object' && !React.isValidElement(value)) {
        try {
            if (value instanceof Date) displayValue = value.toLocaleDateString('vi-VN');
            else if (Array.isArray(value)) displayValue = value.join(', ');
            else displayValue = JSON.stringify(value);
        } catch (e) {
            displayValue = "Error displaying value";
        }
    }

    return (
        <div className={`flex flex-col ${wrapperClass}`}>
            <dt className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 truncate">
                {icon && <span className="opacity-70 text-slate-500">{icon}</span>}
                {label}
            </dt>
            <dd className={`text-sm font-medium break-words bg-slate-50/50 px-3 py-2.5 rounded-xl border border-slate-100 flex items-center shadow-sm ${isFullWidth ? 'min-h-[60px] items-start' : 'min-h-[42px]'} ${showPlaceholder ? '' : className}`}>
                {showPlaceholder ? <span className="text-slate-300 italic font-normal text-xs">---</span> : displayValue}
            </dd>
        </div>
    );
};

interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
    gradient?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, className = "", headerAction, gradient }) => (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-md group ${className}`}>
        {gradient && <div className={`h-1.5 w-full bg-gradient-to-r rounded-t-3xl ${gradient}`}></div>}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-sm group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                    {icon}
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</h4>
            </div>
            {headerAction}
        </div>
        <div className="p-6 flex-1 relative">
            {children}
        </div>
    </div>
);

const TimelineItem: React.FC<{ log: ActivityLog }> = ({ log }) => {
  const isComment = log.type === 'comment';
  return (
    <div className="flex gap-5 pb-8 last:pb-2 relative animate-fade-in group">
      {/* Line connector */}
      <div className="absolute top-5 left-[19px] bottom-0 w-[2px] bg-slate-100 group-last:hidden"></div>
      
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm border transition-colors ${
        isComment ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
        {isComment ? <ChatBubbleLeftIcon className="w-5 h-5"/> : <ClockIcon className="w-5 h-5"/>}
      </div>
      
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {log.user}
              <span className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-md border tracking-wide ${isComment ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {log.role || 'System'}
              </span>
          </span>
          <span className="text-[0.65rem] text-slate-400 font-bold tabular-nums bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
        </div>
        <div className={`text-sm leading-relaxed p-4 rounded-2xl rounded-tl-none border shadow-sm relative group-hover:shadow-md transition-all ${
            isComment 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-100/80 text-slate-700' 
            : 'bg-white border-slate-200 text-slate-600 italic'
        }`}>
            {log.content}
        </div>
      </div>
    </div>
  );
};

// Visual Progress Stepper for Report Status
const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
    const steps = ['Mới', 'Đang tiếp nhận', 'Đang xác minh', 'Đang xử lý', 'Hoàn thành'];
    const currentIndex = steps.indexOf(currentStatus);
    const isErrorState = currentStatus === 'Chưa tìm ra nguyên nhân';

    return (
        <div className="w-full py-6 px-0 mb-0 bg-white border-b border-slate-100 overflow-x-auto print:hidden no-scrollbar">
            <div className="flex items-center justify-between min-w-[600px] relative mx-auto max-w-4xl px-4">
                {/* Background Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full -z-10"></div>
                
                {/* Active Line */}
                <div 
                    className={`absolute left-6 top-1/2 -translate-y-1/2 h-1.5 rounded-full -z-10 transition-all duration-700 ease-in-out shadow-sm ${isErrorState ? 'bg-purple-300' : 'bg-blue-500'}`}
                    style={{ width: isErrorState ? 'calc(100% - 3rem)' : `${(currentIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    let status = 'pending'; // pending, active, completed
                    if (isErrorState) {
                         if (index < 4) status = 'completed'; 
                    } else {
                        if (index < currentIndex) status = 'completed';
                        else if (index === currentIndex) status = 'active';
                    }
                    
                    return (
                        <div key={step} className="flex flex-col items-center gap-3 relative group px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[4px] transition-all duration-500 z-10 shadow-sm ${
                                status === 'completed' ? 'border-blue-500 bg-blue-500 text-white scale-100' :
                                status === 'active' ? 'border-blue-500 bg-white text-blue-600 shadow-[0_0_0_6px_rgba(59,130,246,0.15)] scale-110' :
                                'border-white bg-slate-100 text-slate-300 ring-4 ring-white'
                            }`}>
                                {status === 'completed' ? (
                                    <CheckCircleIcon className="w-6 h-6" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>
                            <span className={`text-[0.65rem] font-bold uppercase tracking-wider text-center transition-colors duration-300 px-2 py-1 rounded-lg ${
                                status === 'active' ? 'text-blue-700 bg-blue-50' : 
                                status === 'completed' ? 'text-slate-600' : 'text-slate-300'
                            }`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            {isErrorState && (
                <div className="mt-5 flex justify-center animate-fade-in-up">
                    <span className="px-5 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-2 shadow-sm uppercase tracking-wide">
                        <ExclamationTriangleIcon className="w-4 h-4 text-purple-600" />
                        Trạng thái hiện tại: Chưa tìm ra nguyên nhân
                    </span>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onUpdate, onDelete, permissions, onClose, currentUserRole, currentUsername, onAddComment }) => {
  // Tabs: 'info' (Information + Resolution), 'log' (Log + Chat)
  const [activeTab, setActiveTab] = useState<'info' | 'log'>('info');

  const [quickUpdateData, setQuickUpdateData] = useState({
      nguyenNhan: report.nguyenNhan || '',
      huongKhacPhuc: report.huongKhacPhuc || '',
      soLuongDoi: report.soLuongDoi || 0,
      ngayDoiHang: report.ngayDoiHang || '',
      trangThai: report.trangThai,
      loaiLoi: report.loaiLoi || ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);
  
  // Printing Logic
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint ? useReactToPrint({
      content: () => componentRef.current,
      documentTitle: `Phieu_Khieu_Nai_${report.id}`,
  }) : () => alert('Printing not available');
  
  // Granular edit state
  const [editingSections, setEditingSections] = useState({
      nguyenNhan: false,
      huongKhacPhuc: false,
      soLuong: false
  });

  // Sync state when report prop updates
  useEffect(() => {
      setQuickUpdateData({
          nguyenNhan: report.nguyenNhan || '',
          huongKhacPhuc: report.huongKhacPhuc || '',
          soLuongDoi: report.soLuongDoi || 0,
          ngayDoiHang: report.ngayDoiHang || '',
          trangThai: report.trangThai,
          loaiLoi: report.loaiLoi || ''
      });
  }, [report]);

  // Scroll to bottom of comments when opened or new comment added
  useEffect(() => {
    if (activeTab === 'log' && commentEndRef.current) {
        commentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [report.activityLog?.length, activeTab]);

  const handleQuickUpdate = async () => {
      setIsUpdating(true);
      const updates: any = {};
      
      if (editingSections.nguyenNhan) updates.nguyenNhan = quickUpdateData.nguyenNhan;
      if (editingSections.huongKhacPhuc) updates.huongKhacPhuc = quickUpdateData.huongKhacPhuc;
      if (editingSections.soLuong) {
          updates.soLuongDoi = Number(quickUpdateData.soLuongDoi);
          updates.ngayDoiHang = quickUpdateData.ngayDoiHang;
      }
      
      // Always update status and origin if they changed in the dropdowns
      if (quickUpdateData.trangThai !== report.trangThai) {
          updates.trangThai = quickUpdateData.trangThai;
      }
      if (quickUpdateData.loaiLoi !== report.loaiLoi) {
          updates.loaiLoi = quickUpdateData.loaiLoi;
      }

      if (updates.trangThai === 'Hoàn thành' && !report.ngayHoanThanh) {
          const d = new Date();
          const y = d.getFullYear();
          const m = (`0${d.getMonth() + 1}`).slice(-2);
          const day = (`0${d.getDate()}`).slice(-2);
          updates.ngayHoanThanh = `${y}-${m}-${day}`;
      }

      const user = { username: currentUsername, role: currentUserRole };
      const success = await onUpdate(report.id, updates, 'Đã cập nhật thông tin xử lý.', user);
      if (success) {
          setEditingSections({ nguyenNhan: false, huongKhacPhuc: false, soLuong: false });
      }
      setIsUpdating(false);
  };

  const handleSendComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      setIsSendingComment(true);
      const success = await onAddComment(report.id, newComment, { username: currentUsername, role: currentUserRole });
      if (success) {
          setNewComment('');
      }
      setIsSendingComment(false);
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Mới': return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';
          case 'Đang tiếp nhận': return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10';
          case 'Đang xác minh': return 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-500/10';
          case 'Đang xử lý': return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
          case 'Chưa tìm ra nguyên nhân': return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10';
          case 'Hoàn thành': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
          default: return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/10';
      }
  };

  return (
    <div className="flex flex-col h-full sm:h-auto bg-[#f8fafc] font-sans">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
      
      {/* 1. Sticky Header */}
      <div className="flex flex-col border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm z-30 sticky top-0 print:hidden flex-shrink-0">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-5 min-w-0">
                <div className={`hidden sm:flex px-3 py-1.5 rounded-xl text-[0.6875rem] font-extrabold border uppercase tracking-wider ring-4 shadow-sm ${getStatusColor(report.trangThai)}`}>
                        {report.trangThai}
                </div>
                <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[0.625rem] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">#{report.id}</span>
                            <span className="sm:hidden text-[0.625rem] font-extrabold uppercase text-slate-500">{report.trangThai}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight truncate" title={report.tenThuongMai}>
                            {report.tenThuongMai}
                        </h2>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
                <button 
                    onClick={handlePrint}
                    className="p-2.5 bg-white text-slate-600 border border-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                    title="In phiếu"
                >
                    <PrinterIcon className="w-5 h-5" />
                </button>

                {permissions.canEdit && (
                    <button 
                        onClick={() => onEdit(report)}
                        className="p-2.5 bg-white text-slate-600 border border-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                        title="Chỉnh sửa"
                    >
                        <PencilIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                )}
                
                {permissions.canDelete && (
                    <button 
                        onClick={() => { if(window.confirm('Bạn có chắc chắn muốn xóa phiếu này?')) onDelete(report.id); }}
                        className="p-2.5 bg-white text-slate-600 border border-slate-300 font-bold rounded-xl text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                        title="Xóa"
                    >
                        <TrashIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                )}
                
                <div className="w-px h-8 bg-slate-200 mx-1"></div>

                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
                     <XIcon className="h-7 w-7" />
                </button>
            </div>
          </div>
      </div>
      
      {/* 2. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar pb-24 sm:max-h-[calc(90vh-5rem)]" ref={componentRef}>
         <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Status Stepper - No Scrollbar */}
            <StatusStepper currentStatus={report.trangThai} />

             {/* TABS (Non-printing) */}
             <div className="flex p-1.5 bg-slate-200/60 rounded-2xl mb-8 print:hidden max-w-lg mx-auto backdrop-blur-sm">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === 'info' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                    Thông tin & Xử lý
                </button>
                <button 
                    onClick={() => setActiveTab('log')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === 'log' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                    Lịch sử & Thảo luận
                </button>
             </div>

             {/* INFO TAB */}
             {activeTab === 'info' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up items-start">
                    
                    {/* LEFT COLUMN: Product & Complaint (7/12) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* A. Product Info (SIMPLIFIED & CLEANER) */}
                        <SectionCard title="Thông tin Sản phẩm" icon={<TagIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <DetailRow label="Mã sản phẩm" value={report.maSanPham} icon={<TagIcon className="w-3 h-3"/>} className="text-[#003DA5] font-black" />
                                <DetailRow label="Tên thương mại" value={report.tenThuongMai} wrapperClass="col-span-2 md:col-span-2" className="font-bold text-slate-800" />
                                <DetailRow label="Số Lô" value={report.soLo} className="font-bold bg-slate-100" />
                                <DetailRow label="Mã NSX" value={report.maNgaySanXuat} className="font-bold" />
                                <DetailRow label="Hạn dùng" value={formatDate(report.hanDung)} icon={<CalendarIcon className="w-3 h-3"/>} />
                                {/* Hidden: Dòng SP, Tên TB, Nhãn hàng, ĐVT */}
                            </div>
                        </SectionCard>

                        {/* B. Complaint Details & Distribution (MERGED & GROUPED) */}
                        <SectionCard title="Chi tiết Phản ánh & Phân phối" icon={<ShieldCheckIcon className="w-5 h-5"/>}>
                            <div className="space-y-6">
                                
                                {/* Group: Distribution & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailRow label="Nhà phân phối" value={report.nhaPhanPhoi} icon={<BuildingStoreIcon className="w-3 h-3"/>} />
                                    <DetailRow label="Đơn vị sử dụng" value={report.donViSuDung} icon={<UserGroupIcon className="w-3 h-3"/>} />
                                    <DetailRow label="Ngày phản ánh" value={formatDate(report.ngayPhanAnh)} icon={<CalendarIcon className="w-3 h-3"/>} />
                                </div>

                                {/* Content & Images */}
                                <div>
                                    <DetailRow 
                                        label="Nội dung khiếu nại" 
                                        value={report.noiDungPhanAnh} 
                                        className="bg-orange-50/40 border-orange-100 text-slate-800 italic leading-relaxed" 
                                        wrapperClass="col-span-full"
                                        isFullWidth={true}
                                    />
                                    {report.images && report.images.length > 0 && (
                                        <div className="mt-5">
                                            <dt className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                <ArchiveBoxIcon className="w-3 h-3"/> Hình ảnh minh chứng
                                            </dt>
                                            <div className="flex flex-wrap gap-3">
                                                {report.images.map((img, idx) => (
                                                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden hover:opacity-90 transition-all block bg-white shadow-sm hover:shadow-md relative group">
                                                        <img src={img} alt={`evidence-${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* RIGHT COLUMN: Resolution (5/12) */}
                    <div className="lg:col-span-5 h-full">
                        <SectionCard 
                            title="Xử lý & Khắc phục" 
                            icon={<WrenchIcon className="w-5 h-5"/>} 
                            className="border-emerald-100 shadow-md overflow-hidden h-full"
                            gradient="from-emerald-400 to-teal-500"
                            headerAction={
                                !isUpdating && permissions.canEdit && (
                                    <button 
                                        onClick={handleQuickUpdate} 
                                        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors border border-emerald-200 shadow-sm active:scale-95"
                                    >
                                        Lưu thay đổi
                                    </button>
                                )
                            }
                        >
                            <div className="space-y-8">
                                {/* Quantities Grid - Vertical Stack on Mobile/Side Panel, Grid on specific widths if space allows */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-1 group hover:border-blue-200 transition-colors text-center shadow-inner">
                                        <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-tight group-hover:text-blue-500">Đã nhập</span>
                                        <div className="text-2xl font-black text-slate-700">{report.soLuongDaNhap}</div>
                                        <span className="text-[0.6rem] text-slate-400 font-bold bg-white px-2 rounded-full border border-slate-200">{report.donViTinh || 'ĐVT'}</span>
                                    </div>
                                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 flex flex-col items-center justify-center gap-1 group hover:border-rose-200 transition-colors text-center shadow-inner">
                                        <span className="text-[0.6rem] font-bold text-rose-400 uppercase tracking-tight group-hover:text-rose-600">Lỗi</span>
                                        <div className="text-2xl font-black text-rose-600">{report.soLuongLoi}</div>
                                        <span className="text-[0.6rem] text-rose-400/80 font-bold bg-white px-2 rounded-full border border-rose-100">{report.donViTinh || 'ĐVT'}</span>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center gap-1 relative group hover:border-emerald-200 transition-colors text-center shadow-inner">
                                        <span className="text-[0.6rem] font-bold text-emerald-500 uppercase tracking-tight group-hover:text-emerald-700">Đổi trả</span>
                                        
                                        {permissions.canEdit && editingSections.soLuong ? (
                                            <div className="w-full flex flex-col items-center animate-fade-in">
                                                <input 
                                                    type="number" 
                                                    className="w-20 text-center border border-emerald-300 rounded-lg px-1 py-0.5 text-lg font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none mb-1 shadow-sm"
                                                    value={quickUpdateData.soLuongDoi}
                                                    onChange={(e) => setQuickUpdateData({...quickUpdateData, soLuongDoi: Number(e.target.value)})}
                                                    autoFocus
                                                />
                                                <input 
                                                    type="date"
                                                    className="w-full text-[0.6rem] border border-emerald-200 rounded-md px-1 py-0.5"
                                                    value={quickUpdateData.ngayDoiHang || ''}
                                                    onChange={(e) => setQuickUpdateData({...quickUpdateData, ngayDoiHang: e.target.value})}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1 relative">
                                                    {report.soLuongDoi}
                                                    {permissions.canEdit && (
                                                        <button 
                                                            className="absolute -right-4 -top-2 w-6 h-6 rounded-full bg-white border border-emerald-200 text-emerald-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-50"
                                                            onClick={() => setEditingSections({...editingSections, soLuong: true})}
                                                        >
                                                            <PencilIcon className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {/* Exchange Date Display */}
                                                <div className="flex items-center gap-1 mt-1 bg-emerald-100/60 px-2 py-0.5 rounded-full border border-emerald-200/50 min-h-[22px]">
                                                    {report.ngayDoiHang ? (
                                                        <span className="text-[0.6rem] font-bold text-emerald-800 whitespace-nowrap">
                                                            {formatDate(report.ngayDoiHang)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[0.6rem] text-emerald-600/50 italic">--/--/--</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Resolution Details - Stacked for Side Panel */}
                                <div className="space-y-6">
                                    {/* Cause */}
                                    <div className="group flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
                                                <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nguyên nhân</dt>
                                            </div>
                                            {permissions.canEdit && (
                                                <button 
                                                    onClick={() => setEditingSections({...editingSections, nguyenNhan: !editingSections.nguyenNhan})}
                                                    className="text-[0.625rem] font-bold text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2.5 py-1 rounded-lg"
                                                >
                                                    {editingSections.nguyenNhan ? 'Hủy' : 'Sửa'}
                                                </button>
                                            )}
                                        </div>
                                        {editingSections.nguyenNhan ? (
                                            <textarea 
                                                className="w-full p-3 border border-blue-300 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[100px] shadow-sm animate-fade-in"
                                                rows={3}
                                                value={quickUpdateData.nguyenNhan}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, nguyenNhan: e.target.value})}
                                                placeholder="Nhập nguyên nhân..."
                                            />
                                        ) : (
                                            <div className="text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[80px] shadow-inner text-slate-700 leading-relaxed">
                                                {report.nguyenNhan || <span className="text-slate-400 italic font-light">Chưa cập nhật...</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Solution */}
                                    <div className="group flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                                <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Biện pháp khắc phục</dt>
                                            </div>
                                            {permissions.canEdit && (
                                                <button 
                                                    onClick={() => setEditingSections({...editingSections, huongKhacPhuc: !editingSections.huongKhacPhuc})}
                                                    className="text-[0.625rem] font-bold text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2.5 py-1 rounded-lg"
                                                >
                                                    {editingSections.huongKhacPhuc ? 'Hủy' : 'Sửa'}
                                                </button>
                                            )}
                                        </div>
                                        {editingSections.huongKhacPhuc ? (
                                            <textarea 
                                                className="w-full p-3 border border-blue-300 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[100px] shadow-sm animate-fade-in"
                                                rows={3}
                                                value={quickUpdateData.huongKhacPhuc}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, huongKhacPhuc: e.target.value})}
                                                placeholder="Nhập hướng xử lý..."
                                            />
                                        ) : (
                                            <div className="text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[80px] shadow-inner text-slate-700 leading-relaxed">
                                                {report.huongKhacPhuc || <span className="text-slate-400 italic font-light">Chưa cập nhật...</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Final Status & Origin Control (Grouped) */}
                                {permissions.canEdit ? (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-4 space-y-5 shadow-sm">
                                        {/* Origin Selection */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TagIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Phân loại lỗi:</span>
                                            </div>
                                            <select
                                                value={quickUpdateData.loaiLoi || ''}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, loaiLoi: e.target.value as any})}
                                                className="text-sm font-bold bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 cursor-pointer shadow-sm hover:border-blue-300 transition-colors w-full"
                                            >
                                                <option value="" disabled>-- Chọn phân loại --</option>
                                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                                <option value="Lỗi Khác">Lỗi Khác</option>
                                            </select>
                                        </div>

                                        <div className="h-px bg-slate-200 w-full"></div>

                                        {/* Status Selection */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <ArrowRightOnRectangleIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Trạng thái hồ sơ:</span>
                                            </div>
                                            <select 
                                                value={quickUpdateData.trangThai}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, trangThai: e.target.value as any})}
                                                className="text-sm font-bold bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 cursor-pointer shadow-sm hover:border-blue-300 transition-colors w-full"
                                            >
                                                <option value="Mới">Mới</option>
                                                <option value="Đang tiếp nhận">Đang tiếp nhận</option>
                                                <option value="Đang xác minh">Đang xác minh</option>
                                                <option value="Đang xử lý">Đang xử lý</option>
                                                <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra nguyên nhân</option>
                                                <option value="Hoàn thành">Hoàn thành</option>
                                            </select>
                                            
                                            {quickUpdateData.trangThai === 'Hoàn thành' && !report.ngayHoanThanh && (
                                                 <span className="text-[0.65rem] text-emerald-600 font-bold animate-pulse flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 mt-2">
                                                     <CheckCircleIcon className="w-3.5 h-3.5"/> Tự động chốt ngày hoàn thành
                                                 </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Nguồn gốc:</span>
                                            <span className="text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{report.loaiLoi || 'Chưa phân loại'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Trạng thái:</span>
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border shadow-sm ${getStatusColor(report.trangThai)}`}>{report.trangThai}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                 </div>
             )}

             {/* LOG TAB */}
             {activeTab === 'log' && (
                 <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 min-h-[500px] flex flex-col shadow-sm">
                        <div className="flex-1 space-y-2 mb-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar p-2">
                            {report.activityLog && report.activityLog.length > 0 ? (
                                report.activityLog.map((log) => <TimelineItem key={log.id} log={log} />)
                            ) : (
                                <div className="text-center flex flex-col items-center justify-center h-48 text-slate-400 italic">
                                    <ChatBubbleLeftIcon className="w-10 h-10 mb-2 opacity-20"/>
                                    Chưa có lịch sử hoạt động
                                </div>
                            )}
                            <div ref={commentEndRef} />
                        </div>
                        
                        {/* Comment Input */}
                        <div className="mt-auto bg-slate-50 p-3 rounded-3xl border border-slate-200 shadow-inner flex items-end gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận hoặc ghi chú..."
                                className="flex-1 p-3 text-sm bg-transparent outline-none resize-none max-h-32 min-h-[44px] placeholder-slate-400 font-medium"
                                rows={1}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendComment(e);
                                    }
                                }}
                            />
                            <button 
                                onClick={handleSendComment}
                                disabled={!newComment.trim() || isSendingComment}
                                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-blue-500/30"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default DefectReportDetail;