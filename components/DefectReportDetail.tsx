
import React, { useState, useEffect, useRef } from 'react';
import { DefectReport, UserRole, ActivityLog } from '../types';
import { PencilIcon, TrashIcon, XIcon, WrenchIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon, TagIcon, UserIcon, CheckCircleIcon, CalendarIcon, CompanyLogo, ListBulletIcon, UserGroupIcon, ClockIcon } from './Icons';
// Fix import for react-to-print to work with ESM/CDN
import ReactToPrintPkg from 'react-to-print';

// Robust extraction of useReactToPrint hook
// @ts-ignore
const useReactToPrint = ReactToPrintPkg.useReactToPrint || ReactToPrintPkg.default?.useReactToPrint || ReactToPrintPkg;

interface Props {
  report: DefectReport;
  onEdit: (report: DefectReport) => void;
  onUpdate: (id: string, updates: Partial<DefectReport>, msg?: string, user?: { username: string, role: string }) => Promise<boolean>;
  onDelete: (id: string) => void;
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  currentUserRole: UserRole;
  currentUsername?: string; 
  onAddComment?: (reportId: string, content: string, user: { username: string, role: string }) => Promise<boolean>;
}

const DetailItem = ({ label, value, className, fullWidth }: any) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</dt>
            <dd className={`text-base text-slate-900 break-words font-medium ${className}`}>{value}</dd>
        </div>
    );
};

const Section = ({ title, icon, children, className }: any) => (
    <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] h-full flex flex-col ${className}`}>
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-3 mb-5 flex items-center gap-2">
            <span className="p-1.5 bg-[#003DA5]/5 text-[#003DA5] rounded-lg">{icon}</span>
            {title}
        </h4>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onUpdate, onDelete, permissions, onClose, currentUserRole, currentUsername, onAddComment }) => {
  const canSeeLoaiLoi = ([UserRole.Admin, UserRole.TongGiamDoc, UserRole.CungUng, UserRole.KyThuat] as string[]).includes(currentUserRole);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [commentText, setCommentText] = useState('');
  
  const [quickUpdateData, setQuickUpdateData] = useState({
      nguyenNhan: report.nguyenNhan || '',
      huongKhacPhuc: report.huongKhacPhuc || '',
      soLuongDoi: report.soLuongDoi || 0,
      ngayDoiHang: report.ngayDoiHang || ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Granular edit state
  const [editingSections, setEditingSections] = useState({
      nguyenNhan: false,
      huongKhacPhuc: false,
      soLuong: false
  });

  const printRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get current font setting
  const currentFont = typeof document !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--app-font').trim() 
    : "'Inter', sans-serif";

  const handlePrint = useReactToPrint({
      content: () => printRef.current,
      documentTitle: `Phieu_Phan_Anh_${report.maSanPham}_${report.id.slice(0, 6)}`,
      bodyClass: 'bg-white',
      pageStyle: `
        @page { size: A4; margin: 15mm; }
        body { 
            font-family: ${currentFont || "'Inter', sans-serif"} !important;
            -webkit-print-color-adjust: exact; 
        }
        .print-container { width: 100%; font-size: 14px; line-height: 1.5; }
        .no-print { display: none !important; }
      `
  });

  const isEditing = Object.values(editingSections).some(Boolean);

  // Sync local state when report updates from parent (Real-time update)
  useEffect(() => {
    if (!isEditing) {
        setQuickUpdateData({
            nguyenNhan: report.nguyenNhan || '',
            huongKhacPhuc: report.huongKhacPhuc || '',
            soLuongDoi: report.soLuongDoi || 0,
            ngayDoiHang: report.ngayDoiHang || ''
        });
    }
  }, [report, isEditing]);

  // Auto scroll to bottom of history
  useEffect(() => {
      if (activeTab === 'history' && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [activeTab, report.activityLog]);

  const getLoaiLoiBadge = (loaiLoi: string) => {
    let style = 'bg-slate-100 text-slate-600 border-slate-200';
    if (loaiLoi === 'Lỗi Hỗn hợp') style = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    else if (loaiLoi === 'Lỗi Sản xuất') style = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (loaiLoi === 'Lỗi Nhà cung cấp') style = 'bg-orange-50 text-orange-700 border-orange-200';
    
    return <span className={`px-2 py-1 rounded-md text-sm font-bold border ${style}`}>{loaiLoi}</span>;
  };

  const handleQuickUpdate = async () => {
      setIsUpdating(true);
      try {
          const updates: any = {
              nguyenNhan: quickUpdateData.nguyenNhan,
              huongKhacPhuc: quickUpdateData.huongKhacPhuc,
              soLuongDoi: Number(quickUpdateData.soLuongDoi),
              ngayDoiHang: quickUpdateData.ngayDoiHang
          };

          let message = "Đã cập nhật thông tin xử lý.";
          // Logic: Auto-complete if everything is filled
          if (updates.nguyenNhan && updates.huongKhacPhuc && updates.soLuongDoi > 0 && report.trangThai !== 'Hoàn thành') {
              updates.trangThai = 'Hoàn thành';
              updates.ngayHoanThanh = new Date().toISOString().split('T')[0];
              message = "Đã cập nhật thông tin và chuyển trạng thái sang HOÀN THÀNH do đủ điều kiện.";
          }

          const user = { username: currentUsername || 'Unknown', role: currentUserRole };
          const success = await onUpdate(report.id, updates, message, user);
          
          if (success) {
              setEditingSections({ nguyenNhan: false, huongKhacPhuc: false, soLuong: false });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsUpdating(false);
      }
  };

  const handleSendComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentText.trim() || !onAddComment) return;
      
      const user = { username: currentUsername || 'Unknown', role: currentUserRole };
      const success = await onAddComment(report.id, commentText.trim(), user);
      if (success) {
          setCommentText('');
      }
  };

  const cancelQuickEdit = () => {
      setQuickUpdateData({
          nguyenNhan: report.nguyenNhan || '',
          huongKhacPhuc: report.huongKhacPhuc || '',
          soLuongDoi: report.soLuongDoi || 0,
          ngayDoiHang: report.ngayDoiHang || ''
      });
      setEditingSections({ nguyenNhan: false, huongKhacPhuc: false, soLuong: false });
  };
  
  const startEditing = (section: keyof typeof editingSections) => {
      if (permissions.canEdit) {
          setEditingSections(prev => ({ ...prev, [section]: true }));
      }
  };

  const enableEditAll = () => {
      if (permissions.canEdit) {
          setEditingSections({ nguyenNhan: true, huongKhacPhuc: true, soLuong: true });
      }
  };

  const sortedLogs = [...(report.activityLog || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <>
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md flex justify-between items-start sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#003DA5] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded shadow-sm">{report.maSanPham}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}
                </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight line-clamp-2 tracking-tight">{report.tenThuongMai}</h3>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => handlePrint()} className="hidden sm:flex p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-200" title="In phiếu">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
            </button>
            {permissions.canEdit && (
              <button onClick={() => onEdit(report)} className="p-2 text-slate-400 hover:text-[#003DA5] hover:bg-blue-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-blue-100" title="Chỉnh sửa toàn bộ">
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {permissions.canDelete && (
                <button onClick={() => { if (window.confirm('Xóa phản ánh này?')) onDelete(report.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100" title="Xóa">
                  <TrashIcon className="h-5 w-5" />
                </button>
            )}
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all active:scale-95">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 sm:px-6 border-b border-slate-200 bg-white sticky top-[73px] z-20">
          <button 
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'info' ? 'text-[#003DA5] border-[#003DA5]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
              Thông tin chi tiết
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'text-[#003DA5] border-[#003DA5]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
              Lịch sử & Thảo luận
              {(report.activityLog?.length || 0) > 0 && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">{report.activityLog?.length}</span>}
          </button>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar relative" ref={scrollRef}>
        
        {/* TAB 1: INFO */}
        {activeTab === 'info' && (
            <div className="p-4 sm:p-6 space-y-6 pb-24 sm:pb-8 animate-fade-in">
                {/* TOP ROW: PRODUCT & CUSTOMER - Stack on mobile, grid on large */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Section title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4"/>}>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <DetailItem label="Dòng sản phẩm" value={report.dongSanPham} />
                            <DetailItem label="Nhãn hàng" value={report.nhanHang} className="font-bold text-[#003DA5]"/>
                            <DetailItem label="Tên thiết bị y tế" value={report.tenThietBi} fullWidth />
                            <DetailItem label="Số lô" value={report.soLo} className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded w-fit font-bold border border-slate-200"/>
                            <DetailItem label="Mã NSX" value={report.maNgaySanXuat}/>
                        </dl>
                        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Đã nhập</p>
                                <p className="font-black text-xl text-slate-700 mt-1">{report.soLuongDaNhap}</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center shadow-sm">
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Lỗi</p>
                                <p className="font-black text-xl text-[#C5003E] mt-1">{report.soLuongLoi}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center shadow-sm">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Đổi</p>
                                <p className="font-black text-xl text-[#009183] mt-1">{report.soLuongDoi}</p>
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Khách hàng & Phản ánh" icon={<UserIcon className="h-4 w-4"/>}>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <DetailItem label="Nhà phân phối" value={report.nhaPhanPhoi} fullWidth/>
                            <DetailItem label="Đơn vị sử dụng" value={report.donViSuDung} fullWidth/>
                            <div className="col-span-full mt-2">
                                <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nội dung phản ánh</dt>
                                <dd className="text-base text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed shadow-inner font-medium">
                                    {report.noiDungPhanAnh}
                                </dd>
                            </div>
                            {report.images && report.images.length > 0 && (
                                <div className="col-span-full mt-4">
                                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hình ảnh minh chứng</dt>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {report.images.map((img, idx) => (
                                            <div key={idx} className="cursor-pointer group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm hover:shadow-md transition-all" onClick={() => setPreviewImage(img)}>
                                                <img src={img} alt="proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </dl>
                    </Section>
                </div>

                {/* BOTTOM ROW: PROCESSING (ACTIONABLE) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex flex-col sm:flex-row justify-between sm:items-center relative z-10 gap-2">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><ClipboardDocumentListIcon className="w-5 h-5" /></span>
                            Xử lý & Khắc phục
                        </h4>
                        <div className="flex gap-3 items-center justify-between sm:justify-end w-full sm:w-auto">
                            {report.trangThai !== 'Hoàn thành' && permissions.canEdit && (
                                <>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 animate-fade-in">
                                            <button 
                                                onClick={cancelQuickEdit}
                                                disabled={isUpdating}
                                                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
                                            >
                                                Hủy
                                            </button>
                                            <button 
                                                onClick={handleQuickUpdate}
                                                disabled={isUpdating}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center"
                                            >
                                                <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                                {isUpdating ? 'Lưu...' : 'Lưu'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={enableEditAll}
                                            className="text-xs bg-white border border-blue-200 text-[#003DA5] hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center"
                                            title="Chỉnh sửa tất cả các trường"
                                        >
                                            <PencilIcon className="w-3.5 h-3.5 mr-1.5" />
                                            Cập nhật
                                        </button>
                                    )}
                                </>
                            )}
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black border ml-auto sm:ml-2 shadow-sm uppercase tracking-wide ${
                                report.trangThai === 'Hoàn thành' ? 'bg-[#009183]/10 text-[#009183] border-[#009183]/20' :
                                report.trangThai === 'Mới' ? 'bg-[#003DA5]/10 text-[#003DA5] border-[#003DA5]/20' : 
                                'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                            }`}>
                                {report.trangThai}
                            </span>
                        </div>
                    </div>

                    {/* Quick Edit Fields - Stack on mobile */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                        {/* Left: Input Areas */}
                        <div className="md:col-span-8 grid grid-cols-1 gap-4">
                            {/* Cause Input */}
                            <div 
                                className={`bg-amber-50/50 rounded-xl p-4 border border-amber-100 group transition-all ${!editingSections.nguyenNhan && permissions.canEdit ? 'cursor-pointer hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5' : ''}`}
                                onClick={() => !editingSections.nguyenNhan && startEditing('nguyenNhan')}
                            >
                                <div className="flex items-center gap-2 mb-2 text-[#F59E0B]">
                                        <QuestionMarkCircleIcon className="w-4 h-4" />
                                        <label className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Nguyên nhân</label>
                                </div>
                                {editingSections.nguyenNhan ? (
                                    <textarea 
                                        className="w-full bg-white border border-amber-200 rounded-lg p-3 text-base font-normal focus:ring-2 focus:ring-amber-500/20 outline-none resize-none shadow-sm touch-manipulation"
                                        rows={3}
                                        placeholder="Nhập nguyên nhân..."
                                        value={quickUpdateData.nguyenNhan}
                                        onChange={(e) => setQuickUpdateData({...quickUpdateData, nguyenNhan: e.target.value})}
                                        autoFocus
                                    />
                                ) : (
                                    <p className={`text-base font-medium leading-relaxed ${quickUpdateData.nguyenNhan ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                        {quickUpdateData.nguyenNhan || 'Click để nhập nguyên nhân...'}
                                    </p>
                                )}
                            </div>

                            {/* Solution Input */}
                            <div 
                                className={`bg-blue-50/50 rounded-xl p-4 border border-blue-100 group transition-all ${!editingSections.huongKhacPhuc && permissions.canEdit ? 'cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5' : ''}`}
                                onClick={() => !editingSections.huongKhacPhuc && startEditing('huongKhacPhuc')}
                            >
                                <div className="flex items-center gap-2 mb-2 text-[#003DA5]">
                                        <WrenchIcon className="w-4 h-4" />
                                        <label className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Hướng khắc phục</label>
                                </div>
                                {editingSections.huongKhacPhuc ? (
                                    <textarea 
                                        className="w-full bg-white border border-blue-200 rounded-lg p-3 text-base font-normal focus:ring-2 focus:ring-blue-500/20 outline-none resize-none shadow-sm touch-manipulation"
                                        rows={3}
                                        placeholder="Nhập hướng xử lý..."
                                        value={quickUpdateData.huongKhacPhuc}
                                        onChange={(e) => setQuickUpdateData({...quickUpdateData, huongKhacPhuc: e.target.value})}
                                        autoFocus
                                    />
                                ) : (
                                    <p className={`text-base font-medium leading-relaxed ${quickUpdateData.huongKhacPhuc ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                        {quickUpdateData.huongKhacPhuc || 'Click để nhập hướng khắc phục...'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right: Metrics & Info */}
                        <div className="md:col-span-4 flex flex-col gap-4">
                            {/* Exchange Qty Input */}
                            <div 
                                className={`bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 flex flex-col gap-4 transition-all ${!editingSections.soLuong && permissions.canEdit ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5' : ''}`}
                                onClick={() => !editingSections.soLuong && startEditing('soLuong')}
                            >
                                <div className="flex flex-col items-center justify-center text-center">
                                    <label className="text-[10px] font-bold text-[#009183] uppercase mb-2 cursor-pointer tracking-widest">Số lượng đổi</label>
                                    {editingSections.soLuong ? (
                                        <div className="flex items-center justify-center w-full">
                                            <input 
                                                    type="number" 
                                                    min="0"
                                                    className="w-24 text-center text-3xl font-black text-[#009183] bg-white border border-emerald-200 rounded-lg py-1 focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm touch-manipulation"
                                                    value={quickUpdateData.soLuongDoi}
                                                    onChange={(e) => setQuickUpdateData({...quickUpdateData, soLuongDoi: Number(e.target.value)})}
                                                    onClick={(e) => e.stopPropagation()} 
                                                    autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-4xl font-black text-[#009183]">{report.soLuongDoi}</p>
                                    )}
                                </div>
                                
                                {/* Date Exchange Field */}
                                <div className="border-t border-emerald-200/50 pt-3 mt-1">
                                    <div className="flex items-center justify-center gap-2 mb-1 text-[#009183]">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        <label className="text-[10px] font-bold uppercase cursor-pointer tracking-widest">Ngày đổi hàng</label>
                                    </div>
                                    {editingSections.soLuong ? (
                                        <input 
                                                type="date"
                                                className="w-full text-center text-sm font-bold text-emerald-800 bg-white border border-emerald-200 rounded-lg py-1.5 focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm touch-manipulation"
                                                value={quickUpdateData.ngayDoiHang}
                                                onChange={(e) => setQuickUpdateData({...quickUpdateData, ngayDoiHang: e.target.value})}
                                                onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <p className="text-center text-sm font-bold text-emerald-800">
                                            {quickUpdateData.ngayDoiHang ? new Date(quickUpdateData.ngayDoiHang).toLocaleDateString('en-GB') : <span className="text-emerald-400 italic font-normal text-xs">--/--/----</span>}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Info Chips */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                {report.ngayHoanThanh && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ngày hoàn thành</span>
                                            <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                {new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                )}
                                {canSeeLoaiLoi && report.loaiLoi && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 tracking-wide">Nguồn gốc lỗi</span>
                                            {getLoaiLoiBadge(report.loaiLoi)}
                                        </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: HISTORY & COMMENTS - Updated with Timeline UI */}
        {activeTab === 'history' && (
            <div className="p-4 sm:p-6 pb-20 sm:pb-6 min-h-full flex flex-col animate-fade-in relative">
                <div className="flex-1 space-y-0 relative pl-4">
                    {/* Vertical Timeline Line */}
                    {sortedLogs.length > 0 && (
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                    )}

                    {sortedLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <ClockIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">Chưa có lịch sử hoạt động nào.</p>
                        </div>
                    ) : (
                        sortedLogs.map((log) => (
                            <div key={log.id} className="relative z-10 flex gap-4 mb-6 group">
                                {/* Icon/Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border ring-4 ring-white ${
                                    log.type === 'comment' 
                                        ? (log.user === currentUsername ? 'bg-[#003DA5] text-white border-[#003DA5]' : 'bg-slate-100 text-slate-600 border-slate-200')
                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {log.type === 'log' ? <WrenchIcon className="w-4 h-4" /> : (log.user ? log.user.charAt(0).toUpperCase() : '?')}
                                </div>
                                
                                {/* Content Bubble */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">{log.user || 'Hệ thống'}</span>
                                            {log.role && <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{log.role}</span>}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                                    </div>
                                    
                                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-2xl ${
                                        log.type === 'comment' && log.user === currentUsername 
                                            ? 'bg-blue-50 text-slate-800 border border-blue-100' 
                                            : 'bg-white border border-slate-200 text-slate-700'
                                    }`}>
                                        {log.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input - Sticky */}
                <div className="mt-4 sticky bottom-0 bg-white/80 backdrop-blur-xl p-2 sm:p-4 border-t border-slate-100 rounded-xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                    <form onSubmit={handleSendComment} className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003DA5] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {currentUserRole.charAt(0)}
                        </div>
                        <input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Viết thảo luận hoặc ghi chú..." 
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] outline-none transition-all shadow-inner text-sm"
                        />
                        <button 
                            type="submit" 
                            disabled={!commentText.trim()}
                            className="px-4 py-2.5 bg-[#003DA5] hover:bg-[#002a70] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all active:scale-95 font-bold text-sm"
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>

      {/* Image Preview Modal */}
      {previewImage && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-colors">
                  <XIcon className="w-8 h-8" />
              </button>
          </div>
      )}

      {/* Hidden Print Template */}
      <div style={{ display: 'none' }}>
            <div ref={printRef} className="print-container p-8 font-sans text-slate-900 bg-white">
                <style>{`
                    @media print {
                        @page { size: A4; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact; }
                        .print-container { width: 100%; font-size: 14px; line-height: 1.5; }
                        .no-print { display: none !important; }
                    }
                `}</style>
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16"><CompanyLogo className="w-full h-full"/></div>
                        <div>
                             <h1 className="text-2xl font-bold uppercase">PHIẾU PHẢN ÁNH SẢN PHẨM LỖI</h1>
                             <p className="text-sm font-semibold text-slate-600">Công ty Cổ phần Vật tư Y tế Hồng Thiện Mỹ</p>
                        </div>
                     </div>
                     <div className="text-right">
                         <p className="text-sm font-bold">Số phiếu: #{report.id.substring(0, 8)}</p>
                         <p className="text-sm">Ngày in: {new Date().toLocaleDateString('en-GB')}</p>
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                    <div>
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Sản phẩm</span>
                        <span className="block font-bold text-lg">{report.tenThuongMai}</span>
                    </div>
                     <div>
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã SP</span>
                        <span className="block font-bold text-lg">{report.maSanPham}</span>
                    </div>
                     <div>
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Số lô</span>
                        <span className="block font-bold">{report.soLo}</span>
                    </div>
                     <div>
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Hạn dùng/NSX</span>
                        <span className="block font-bold">{report.maNgaySanXuat || '---'}</span>
                    </div>
                     <div className="col-span-2">
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Đơn vị sử dụng</span>
                        <span className="block font-bold">{report.donViSuDung}</span>
                    </div>
                </div>

                <div className="mb-6 border border-slate-300 rounded p-4">
                     <h3 className="font-bold uppercase mb-2 border-b border-slate-200 pb-1">Nội dung phản ánh</h3>
                     <p className="text-justify leading-relaxed">{report.noiDungPhanAnh}</p>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-4 text-center border-b border-slate-200 pb-6">
                     <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                         <span className="block text-xs uppercase font-bold text-slate-500">Số lượng nhập</span>
                         <span className="block text-xl font-bold">{report.soLuongDaNhap}</span>
                     </div>
                      <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                         <span className="block text-xs uppercase font-bold text-slate-500">Số lượng lỗi</span>
                         <span className="block text-xl font-bold">{report.soLuongLoi}</span>
                     </div>
                      <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                         <span className="block text-xs uppercase font-bold text-slate-500">Số lượng đổi</span>
                         <span className="block text-xl font-bold">{report.soLuongDoi}</span>
                     </div>
                </div>

                <div className="mb-8">
                     <h3 className="font-bold uppercase mb-2">Kết quả xử lý</h3>
                     <div className="mb-2">
                         <span className="font-bold text-sm uppercase text-slate-500 mr-2">Nguyên nhân:</span>
                         <span>{report.nguyenNhan || 'Đang chờ cập nhật'}</span>
                     </div>
                     <div>
                         <span className="font-bold text-sm uppercase text-slate-500 mr-2">Hướng khắc phục:</span>
                         <span>{report.huongKhacPhuc || 'Đang chờ cập nhật'}</span>
                     </div>
                </div>

                <div className="grid grid-cols-3 gap-8 text-center mt-12">
                     <div>
                         <p className="font-bold text-sm uppercase mb-12">Người lập phiếu</p>
                         <p className="text-sm italic">(Ký, họ tên)</p>
                     </div>
                      <div>
                         <p className="font-bold text-sm uppercase mb-12">Bộ phận Kỹ thuật</p>
                         <p className="text-sm italic">(Ký, họ tên)</p>
                     </div>
                      <div>
                         <p className="font-bold text-sm uppercase mb-12">Ban Giám Đốc</p>
                         <p className="text-sm italic">(Duyệt)</p>
                     </div>
                </div>
            </div>
      </div>
    </>
  );
};

export default DefectReportDetail;
