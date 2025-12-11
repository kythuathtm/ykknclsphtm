
import React, { useState, useEffect, useRef } from 'react';
import * as ReactToPrintPkg from 'react-to-print';
import { DefectReport, UserRole, ActivityLog } from '../types';
import { 
  PencilIcon, TrashIcon, XIcon, WrenchIcon, 
  TagIcon, ChatBubbleLeftIcon, ClockIcon, CheckCircleIcon, 
  BuildingStoreIcon, CalendarIcon, PaperAirplaneIcon, MapPinIcon, UserGroupIcon,
  ArchiveBoxIcon, ExclamationTriangleIcon, CubeIcon, PrinterIcon, ArrowRightOnRectangleIcon, UserIcon, ExclamationCircleIcon
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

const getProcessingDays = (startDate: string, endDate?: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        <div className={`flex flex-col min-w-0 ${wrapperClass}`}>
            <dt className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate">
                {icon && <span className="opacity-70 text-slate-500">{icon}</span>}
                {label}
            </dt>
            <dd className={`text-sm font-bold break-words bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100 flex items-center shadow-sm ${isFullWidth ? 'min-h-[50px] items-start' : 'min-h-[38px]'} ${showPlaceholder ? '' : className}`}>
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
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shadow-sm group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                    {icon}
                </div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h4>
            </div>
            {headerAction}
        </div>
        <div className="p-5 flex-1 relative">
            {children}
        </div>
    </div>
);

const TimelineItem: React.FC<{ log: ActivityLog }> = ({ log }) => {
  const isComment = log.type === 'comment';
  return (
    <div className="flex gap-4 pb-6 last:pb-2 relative animate-fade-in group">
      {/* Line connector */}
      <div className="absolute top-5 left-[15px] bottom-0 w-[2px] bg-slate-100 group-last:hidden"></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm border transition-colors ${
        isComment ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
        {isComment ? <ChatBubbleLeftIcon className="w-4 h-4"/> : <ClockIcon className="w-4 h-4"/>}
      </div>
      
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              {log.user}
              <span className={`text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded-md border tracking-wide ${isComment ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {log.role || 'System'}
              </span>
          </span>
          <span className="text-[0.6rem] text-slate-400 font-bold tabular-nums bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
        </div>
        <div className={`text-sm leading-relaxed p-3 rounded-xl rounded-tl-none border shadow-sm relative group-hover:shadow-md transition-all ${
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

// 2. Block Status Stepper
const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
    const steps = ['Mới', 'Đang tiếp nhận', 'Đang xác minh', 'Đang xử lý', 'Hoàn thành'];
    const currentIndex = steps.indexOf(currentStatus);
    const isErrorState = currentStatus === 'Chưa tìm ra nguyên nhân';

    return (
        <div className="w-full py-4 px-0 bg-white border-b border-slate-100 overflow-x-auto print:hidden no-scrollbar shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative z-20">
            <div className="flex items-start justify-between min-w-[500px] relative mx-auto max-w-3xl px-4 pt-2">
                {/* Background Line */}
                <div className="absolute left-6 right-6 top-[1.1rem] h-0.5 bg-slate-100 rounded-full -z-10"></div>
                
                {/* Active Line */}
                <div 
                    className={`absolute left-6 top-[1.1rem] h-0.5 rounded-full -z-10 transition-all duration-700 ease-in-out shadow-sm ${isErrorState ? 'bg-purple-300' : 'bg-blue-500'}`}
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
                        <div key={step} className="flex flex-col items-center gap-2 relative group px-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 z-10 shadow-sm ${
                                status === 'completed' ? 'border-blue-500 bg-blue-500 text-white scale-100' :
                                status === 'active' ? 'border-blue-500 bg-white text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.15)] scale-110' :
                                'border-white bg-slate-100 text-slate-300 ring-2 ring-white'
                            }`}>
                                {status === 'completed' ? (
                                    <CheckCircleIcon className="w-4 h-4" />
                                ) : (
                                    <span className="text-xs font-bold">{index + 1}</span>
                                )}
                            </div>
                            <span className={`text-[0.6rem] font-bold uppercase tracking-wider text-center transition-colors duration-300 px-2 py-0.5 rounded-lg ${
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
                <div className="mt-3 flex justify-center animate-fade-in-up">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-[0.6rem] font-bold border border-purple-200 flex items-center gap-1.5 shadow-sm uppercase tracking-wide">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5 text-purple-600" />
                        Trạng thái hiện tại: Chưa tìm ra nguyên nhân
                    </span>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onUpdate, onDelete, permissions, onClose, currentUserRole, currentUsername, onAddComment }) => {
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
  
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint ? useReactToPrint({
      content: () => componentRef.current,
      documentTitle: `Phieu_Khieu_Nai_${report.id}`,
  }) : () => alert('Printing not available');
  
  const [editingSections, setEditingSections] = useState({
      nguyenNhan: false,
      huongKhacPhuc: false,
      soLuong: false
  });

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

  const daysOpen = getProcessingDays(report.ngayPhanAnh, report.ngayHoanThanh);
  const isOverdue = daysOpen > 7 && report.trangThai !== 'Hoàn thành';

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
      
      {/* 1. Header (Sticky) */}
      <div className="flex flex-col border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm z-30 sticky top-0 print:hidden flex-shrink-0">
          <div className="flex justify-between items-center px-5 py-3">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`hidden sm:flex px-3 py-1.5 rounded-xl text-[0.6rem] font-bold border uppercase tracking-wider ring-4 shadow-sm ${getStatusColor(report.trangThai)}`}>
                        {report.trangThai}
                </div>
                <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[0.625rem] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">#{report.id}</span>
                            <span className="sm:hidden text-[0.625rem] font-bold uppercase text-slate-500">{report.trangThai}</span>
                            
                            <span className="text-sm font-black text-[#003DA5] px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-1">
                                <TagIcon className="w-3 h-3 text-[#003DA5] opacity-50"/>
                                {report.maSanPham}
                            </span>

                            <span className={`text-[0.625rem] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${isOverdue ? 'text-red-600 bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                {isOverdue ? <ExclamationCircleIcon className="w-3 h-3 animate-pulse"/> : <ClockIcon className="w-3 h-3"/>} 
                                {daysOpen} ngày xử lý
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight truncate" title={report.tenThuongMai}>
                            {report.tenThuongMai}
                        </h2>
                </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
                <button 
                    onClick={handlePrint}
                    className="p-2 bg-white text-slate-600 border border-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                    title="In phiếu"
                >
                    <PrinterIcon className="w-4 h-4" />
                </button>

                {permissions.canEdit && (
                    <button 
                        onClick={() => onEdit(report)}
                        className="p-2 bg-white text-slate-600 border border-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                        title="Chỉnh sửa"
                    >
                        <PencilIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </button>
                )}
                
                {permissions.canDelete && (
                    <button 
                        onClick={() => { if(window.confirm('Bạn có chắc chắn muốn xóa phiếu này?')) onDelete(report.id); }}
                        className="p-2 bg-white text-slate-600 border border-slate-300 font-bold rounded-xl text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                        title="Xóa"
                    >
                        <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                )}
                
                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
                     <XIcon className="h-6 w-6" />
                </button>
            </div>
          </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-0 sm:p-0 custom-scrollbar pb-24 sm:max-h-[calc(90vh-4rem)]" ref={componentRef}>
         
         {/* 2. Status Stepper */}
         <StatusStepper currentStatus={report.trangThai} />

         <div className="max-w-[1280px] mx-auto p-4 sm:p-5 space-y-5">
             
             {/* 3. Information & Processing Blocks (and History via tabs) */}
             <div className="flex p-1 bg-slate-200/60 rounded-xl mb-4 print:hidden max-w-sm mx-auto backdrop-blur-sm">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${activeTab === 'info' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                    Thông tin & Xử lý
                </button>
                <button 
                    onClick={() => setActiveTab('log')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${activeTab === 'log' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                    Lịch sử & Thảo luận
                </button>
             </div>

             {activeTab === 'info' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in-up items-start">
                    
                    {/* LEFT COLUMN (7/12): 3.1 & 3.2 */}
                    <div className="lg:col-span-7 space-y-5">
                        
                        {/* 3.1. Customer & Complaint Block */}
                        <SectionCard title="Thông tin Khách hàng & Khiếu nại" icon={<UserGroupIcon className="w-4 h-4"/>}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4">
                                    <DetailRow label="Nhà phân phối" value={report.nhaPhanPhoi} icon={<BuildingStoreIcon className="w-3 h-3"/>} wrapperClass="col-span-12 sm:col-span-6" />
                                    <DetailRow label="Đơn vị sử dụng" value={report.donViSuDung} icon={<MapPinIcon className="w-3 h-3"/>} wrapperClass="col-span-12 sm:col-span-6" />
                                    
                                    <DetailRow label="Người liên hệ" value={report.nguoiLienHe} icon={<UserIcon className="w-3 h-3"/>} wrapperClass="col-span-12 sm:col-span-6" />
                                    <DetailRow label="SĐT liên hệ" value={report.soDienThoai} icon={<PaperAirplaneIcon className="w-3 h-3"/>} wrapperClass="col-span-12 sm:col-span-6" />

                                    <DetailRow label="Ngày khiếu nại" value={formatDate(report.ngayPhanAnh)} icon={<CalendarIcon className="w-3 h-3"/>} wrapperClass="col-span-12" className="text-blue-700 bg-blue-50 border-blue-100 font-bold"/>
                                </div>

                                <div>
                                    <DetailRow 
                                        label="Nội dung khiếu nại" 
                                        value={
                                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar pr-2 w-full">
                                                {report.noiDungPhanAnh}
                                            </div>
                                        } 
                                        className="bg-orange-50/40 border-orange-100 text-slate-800 italic leading-relaxed" 
                                        wrapperClass="col-span-full"
                                        isFullWidth={true}
                                    />
                                    {report.images && report.images.length > 0 && (
                                        <div className="mt-4">
                                            <dt className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <ArchiveBoxIcon className="w-3 h-3"/> Hình ảnh minh chứng
                                            </dt>
                                            <div className="flex flex-wrap gap-2">
                                                {report.images.map((img, idx) => (
                                                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden hover:opacity-90 transition-all block bg-white shadow-sm hover:shadow-md relative group">
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

                        {/* 3.2. Product Information Block */}
                        <SectionCard title="Thông tin Sản phẩm" icon={<CubeIcon className="w-4 h-4"/>}>
                            <div className="grid grid-cols-12 gap-4 mb-4">
                                <DetailRow label="Số Lô" value={report.soLo} className="font-bold bg-slate-100" wrapperClass="col-span-4" />
                                <DetailRow label="Mã NSX" value={report.maNgaySanXuat} className="font-bold" wrapperClass="col-span-4" />
                                <DetailRow label="Hạn dùng" value={formatDate(report.hanDung)} icon={<CalendarIcon className="w-3 h-3"/>} wrapperClass="col-span-4" />
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <dt className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <TagIcon className="w-3 h-3"/> Số lượng chi tiết
                                </dt>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-0.5 group hover:border-blue-200 transition-colors text-center shadow-inner">
                                        <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-tight group-hover:text-blue-500">Đã nhập</span>
                                        <div className="text-xl font-bold text-slate-700">{report.soLuongDaNhap}</div>
                                        <span className="text-[0.6rem] text-slate-400 font-bold bg-white px-2 rounded-full border border-slate-200">{report.donViTinh || 'ĐVT'}</span>
                                    </div>
                                    <div className="bg-rose-50 p-2 rounded-2xl border border-rose-100 flex flex-col items-center justify-center gap-0.5 group hover:border-rose-200 transition-colors text-center shadow-inner">
                                        <span className="text-[0.6rem] font-bold text-rose-400 uppercase tracking-tight group-hover:text-rose-600">Lỗi</span>
                                        <div className="text-xl font-bold text-rose-600">{report.soLuongLoi}</div>
                                        <span className="text-[0.6rem] text-rose-400/80 font-bold bg-white px-2 rounded-full border border-rose-100">{report.donViTinh || 'ĐVT'}</span>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center gap-0.5 relative group hover:border-emerald-200 transition-colors text-center shadow-inner">
                                        <span className="text-[0.6rem] font-bold text-emerald-500 uppercase tracking-tight group-hover:text-emerald-700">Đổi trả</span>
                                        
                                        {permissions.canEdit && editingSections.soLuong ? (
                                            <div className="w-full flex flex-col items-center animate-fade-in">
                                                <input 
                                                    type="number" 
                                                    className="w-20 text-center border border-emerald-300 rounded-lg px-1 py-0 text-lg font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none mb-1 shadow-sm bg-white"
                                                    value={quickUpdateData.soLuongDoi}
                                                    onChange={(e) => setQuickUpdateData({...quickUpdateData, soLuongDoi: Number(e.target.value)})}
                                                    autoFocus
                                                />
                                                <input 
                                                    type="date"
                                                    className="w-full text-[0.6rem] border border-emerald-200 rounded-md px-1 py-0.5 bg-white"
                                                    value={quickUpdateData.ngayDoiHang || ''}
                                                    onChange={(e) => setQuickUpdateData({...quickUpdateData, ngayDoiHang: e.target.value})}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-xl font-bold text-emerald-600 flex items-center justify-center gap-1 relative">
                                                    {report.soLuongDoi}
                                                    {permissions.canEdit && (
                                                        <button 
                                                            className="absolute -right-4 -top-2 w-5 h-5 rounded-full bg-white border border-emerald-200 text-emerald-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-50"
                                                            onClick={() => setEditingSections({...editingSections, soLuong: true})}
                                                        >
                                                            <PencilIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5 bg-emerald-100/60 px-1.5 py-0.5 rounded-full border border-emerald-200/50 min-h-[20px]">
                                                    {report.ngayDoiHang ? (
                                                        <span className="text-[0.55rem] font-bold text-emerald-800 whitespace-nowrap">
                                                            {formatDate(report.ngayDoiHang)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[0.55rem] text-emerald-600/50 italic">--/--/--</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* RIGHT COLUMN (5/12): 3.3 Resolution Block */}
                    <div className="lg:col-span-5 h-full">
                        <SectionCard 
                            title="Xử lý & Khắc phục" 
                            icon={<WrenchIcon className="w-4 h-4"/>} 
                            className="border-emerald-100 shadow-md overflow-hidden h-full"
                            gradient="from-emerald-400 to-teal-500"
                            headerAction={
                                !isUpdating && permissions.canEdit && (
                                    <button 
                                        onClick={handleQuickUpdate} 
                                        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 shadow-sm active:scale-95"
                                    >
                                        Lưu
                                    </button>
                                )
                            }
                        >
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    {/* Cause */}
                                    <div className="group flex flex-col">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-orange-400 rounded-full"></div>
                                                <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nguyên nhân</dt>
                                            </div>
                                            {permissions.canEdit && (
                                                <button 
                                                    onClick={() => setEditingSections({...editingSections, nguyenNhan: !editingSections.nguyenNhan})}
                                                    className="text-[0.625rem] font-bold text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2 py-0.5 rounded-lg"
                                                >
                                                    {editingSections.nguyenNhan ? 'Hủy' : 'Sửa'}
                                                </button>
                                            )}
                                        </div>
                                        {editingSections.nguyenNhan ? (
                                            <textarea 
                                                className="w-full p-3 border border-blue-300 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[80px] shadow-sm animate-fade-in bg-white"
                                                rows={3}
                                                value={quickUpdateData.nguyenNhan}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, nguyenNhan: e.target.value})}
                                                placeholder="Nhập nguyên nhân..."
                                            />
                                        ) : (
                                            <div className="text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100 min-h-[60px] max-h-[160px] overflow-y-auto custom-scrollbar shadow-inner text-slate-700 leading-relaxed">
                                                {report.nguyenNhan || <span className="text-slate-400 italic font-light">Chưa cập nhật...</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Solution */}
                                    <div className="group flex flex-col">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Biện pháp khắc phục</dt>
                                            </div>
                                            {permissions.canEdit && (
                                                <button 
                                                    onClick={() => setEditingSections({...editingSections, huongKhacPhuc: !editingSections.huongKhacPhuc})}
                                                    className="text-[0.625rem] font-bold text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2 py-0.5 rounded-lg"
                                                >
                                                    {editingSections.huongKhacPhuc ? 'Hủy' : 'Sửa'}
                                                </button>
                                            )}
                                        </div>
                                        {editingSections.huongKhacPhuc ? (
                                            <textarea 
                                                className="w-full p-3 border border-blue-300 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[80px] shadow-sm animate-fade-in bg-white"
                                                rows={3}
                                                value={quickUpdateData.huongKhacPhuc}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, huongKhacPhuc: e.target.value})}
                                                placeholder="Nhập hướng xử lý..."
                                            />
                                        ) : (
                                            <div className="text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100 min-h-[60px] max-h-[160px] overflow-y-auto custom-scrollbar shadow-inner text-slate-700 leading-relaxed">
                                                {report.huongKhacPhuc || <span className="text-slate-400 italic font-light">Chưa cập nhật...</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Status & Origin Control */}
                                {permissions.canEdit ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 space-y-3 shadow-sm">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-wide">Phân loại lỗi:</span>
                                            </div>
                                            <select
                                                value={quickUpdateData.loaiLoi || ''}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, loaiLoi: e.target.value as any})}
                                                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm hover:border-blue-300 transition-colors w-full"
                                            >
                                                <option value="" disabled>-- Chọn phân loại --</option>
                                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                                <option value="Lỗi Khác">Lỗi Khác</option>
                                            </select>
                                        </div>

                                        <div className="h-px bg-slate-200 w-full"></div>

                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-wide">Trạng thái hồ sơ:</span>
                                            </div>
                                            <select 
                                                value={quickUpdateData.trangThai}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, trangThai: e.target.value as any})}
                                                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm hover:border-blue-300 transition-colors w-full"
                                            >
                                                <option value="Mới">Mới</option>
                                                <option value="Đang tiếp nhận">Đang tiếp nhận</option>
                                                <option value="Đang xác minh">Đang xác minh</option>
                                                <option value="Đang xử lý">Đang xử lý</option>
                                                <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra nguyên nhân</option>
                                                <option value="Hoàn thành">Hoàn thành</option>
                                            </select>
                                            
                                            {quickUpdateData.trangThai === 'Hoàn thành' && !report.ngayHoanThanh && (
                                                 <span className="text-[0.6rem] text-emerald-600 font-bold animate-pulse flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 mt-1">
                                                     <CheckCircleIcon className="w-3 h-3"/> Tự động chốt ngày hoàn thành
                                                 </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[0.65rem] font-bold text-slate-500 uppercase">Nguồn gốc:</span>
                                            <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">{report.loaiLoi || 'Chưa phân loại'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[0.65rem] font-bold text-slate-500 uppercase">Trạng thái:</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg border shadow-sm ${getStatusColor(report.trangThai)}`}>{report.trangThai}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                 </div>
             )}

             {/* Log & Discussion Tab */}
             {activeTab === 'log' && (
                 <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-white rounded-3xl border border-slate-200 p-5 min-h-[450px] flex flex-col shadow-sm">
                        <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar p-2">
                            {report.activityLog && report.activityLog.length > 0 ? (
                                report.activityLog.map((log) => <TimelineItem key={log.id} log={log} />)
                            ) : (
                                <div className="text-center flex flex-col items-center justify-center h-40 text-slate-400 italic">
                                    <ChatBubbleLeftIcon className="w-8 h-8 mb-2 opacity-20"/>
                                    Chưa có lịch sử hoạt động
                                </div>
                            )}
                            <div ref={commentEndRef} />
                        </div>
                        
                        {/* Comment Input */}
                        <div className="mt-auto bg-slate-50 p-2.5 rounded-3xl border border-slate-200 shadow-inner flex items-end gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận hoặc ghi chú..."
                                className="flex-1 p-2 text-sm bg-transparent outline-none resize-none max-h-24 min-h-[38px] placeholder-slate-400 font-medium"
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
                                className="p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-blue-500/30"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
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
