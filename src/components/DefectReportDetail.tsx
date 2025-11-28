import React, { useState, useEffect, useRef } from 'react';
import { DefectReport, UserRole } from '../types';
import { PencilIcon, TrashIcon, XIcon, WrenchIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon, TagIcon, UserIcon, CheckCircleIcon, CalendarIcon, CompanyLogo, ListBulletIcon } from './Icons';
import { useReactToPrint } from 'react-to-print';

interface Props {
  report: DefectReport;
  onEdit: (report: DefectReport) => void;
  onUpdate: (id: string, updates: Partial<DefectReport>, msg?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  currentUserRole: UserRole;
}

const DetailItem = ({ label, value, className, fullWidth }: any) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</dt>
            <dd className={`text-base text-slate-800 break-words font-normal ${className}`}>{value}</dd>
        </div>
    );
};

const Section = ({ title, icon, children }: any) => (
    <div className="bg-white p-4 sm:p-6 rounded-none sm:rounded-2xl border-y sm:border border-slate-200 shadow-none sm:shadow-sm h-full flex flex-col">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <span className="p-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">{icon}</span>
            {title}
        </h4>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onUpdate, onDelete, permissions, onClose, currentUserRole }) => {
  const canSeeLoaiLoi = ([UserRole.Admin, UserRole.TongGiamDoc, UserRole.CungUng, UserRole.KyThuat] as string[]).includes(currentUserRole);
  
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
  
  // Use contentRef as required by newer react-to-print types where content is deprecated/removed
  const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Phieu_Phan_Anh_${report.maSanPham}_${report.id.slice(0, 6)}`,
      bodyClass: 'bg-white',
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

          const success = await onUpdate(report.id, updates, message);
          
          if (success) {
              setEditingSections({ nguyenNhan: false, huongKhacPhuc: false, soLuong: false });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsUpdating(false);
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

  return (
    <>
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-white flex justify-between items-start sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase shadow-sm">{report.maSanPham}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}
                </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight line-clamp-2">{report.tenThuongMai}</h3>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-4">
            <button onClick={() => handlePrint()} className="hidden sm:flex p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-200" title="In phiếu">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
            </button>
            {permissions.canEdit && (
              <button onClick={() => onEdit(report)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-blue-100" title="Chỉnh sửa toàn bộ">
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
      
      <div className="flex-1 overflow-y-auto bg-slate-50 p-0 sm:p-6 space-y-0 sm:space-y-6 custom-scrollbar pb-20 sm:pb-6">
        
        {/* TOP ROW: PRODUCT & CUSTOMER - Stack on mobile, grid on large */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 sm:gap-6 bg-slate-50 sm:bg-transparent">
             <Section title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4"/>}>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Dòng sản phẩm" value={report.dongSanPham} />
                    <DetailItem label="Nhãn hàng" value={report.nhanHang} className="font-semibold text-blue-600"/>
                    <DetailItem label="Tên thiết bị y tế" value={report.tenThietBi} fullWidth />
                    <DetailItem label="Số lô" value={report.soLo} className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit font-bold border border-slate-200"/>
                    <DetailItem label="Mã NSX" value={report.maNgaySanXuat}/>
                </dl>
                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-3 border border-slate-100 text-center shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Đã nhập</p>
                        <p className="font-bold text-xl text-slate-700 mt-1">{report.soLuongDaNhap}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center shadow-sm">
                        <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Lỗi</p>
                        <p className="font-bold text-xl text-red-600 mt-1">{report.soLuongLoi}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center shadow-sm">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Đổi</p>
                        <p className="font-bold text-xl text-emerald-600 mt-1">{report.soLuongDoi}</p>
                    </div>
                </div>
             </Section>
             
             {/* Spacing for mobile separation */}
             <div className="h-2 sm:hidden"></div>

             <Section title="Khách hàng & Phản ánh" icon={<UserIcon className="h-4 w-4"/>}>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Nhà phân phối" value={report.nhaPhanPhoi} fullWidth/>
                    <DetailItem label="Đơn vị sử dụng" value={report.donViSuDung} fullWidth/>
                    <div className="col-span-full mt-2">
                        <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nội dung phản ánh</dt>
                        <dd className="text-base text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed shadow-inner font-normal">
                            {report.noiDungPhanAnh}
                        </dd>
                    </div>
                    {report.images && report.images.length > 0 && (
                        <div className="col-span-full mt-4">
                             <dt className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hình ảnh minh chứng</dt>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                 {report.images.map((img, idx) => (
                                     <div key={idx} className="cursor-pointer group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100" onClick={() => setPreviewImage(img)}>
                                         <img src={img} alt="proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </dl>
             </Section>
        </div>

        {/* Spacing for mobile separation */}
        <div className="h-2 sm:hidden"></div>

        {/* BOTTOM ROW: PROCESSING (ACTIONABLE) */}
        <div className="bg-white sm:rounded-2xl rounded-none border-y sm:border border-slate-200 shadow-none sm:shadow-sm relative overflow-hidden">
             
             {/* Header */}
             <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 flex flex-col sm:flex-row justify-between sm:items-center relative z-10 gap-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
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
                                    className="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center"
                                    title="Chỉnh sửa tất cả các trường"
                                >
                                    <PencilIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Cập nhật
                                </button>
                            )}
                        </>
                     )}
                     <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ml-auto sm:ml-2 shadow-sm ${
                        report.trangThai === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        report.trangThai === 'Mới' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {report.trangThai.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Quick Edit Fields - Stack on mobile */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                 {/* Left: Input Areas */}
                 <div className="md:col-span-8 grid grid-cols-1 gap-4">
                      {/* Cause Input */}
                      <div 
                        className={`bg-amber-50/50 rounded-xl p-4 border border-amber-100 group ${!editingSections.nguyenNhan && permissions.canEdit ? 'cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all' : ''}`}
                        onClick={() => !editingSections.nguyenNhan && startEditing('nguyenNhan')}
                      >
                          <div className="flex items-center gap-2 mb-2 text-amber-700">
                                <QuestionMarkCircleIcon className="w-4 h-4" />
                                <label className="text-xs font-bold uppercase tracking-wide cursor-pointer">Nguyên nhân</label>
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
                              <p className={`text-base font-normal leading-relaxed ${quickUpdateData.nguyenNhan ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                  {quickUpdateData.nguyenNhan || 'Click để nhập nguyên nhân...'}
                              </p>
                          )}
                      </div>

                      {/* Solution Input */}
                      <div 
                        className={`bg-blue-50/50 rounded-xl p-4 border border-blue-100 group ${!editingSections.huongKhacPhuc && permissions.canEdit ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''}`}
                        onClick={() => !editingSections.huongKhacPhuc && startEditing('huongKhacPhuc')}
                      >
                          <div className="flex items-center gap-2 mb-2 text-blue-700">
                                <WrenchIcon className="w-4 h-4" />
                                <label className="text-xs font-bold uppercase tracking-wide cursor-pointer">Hướng khắc phục</label>
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
                               <p className={`text-base font-normal leading-relaxed ${quickUpdateData.huongKhacPhuc ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                  {quickUpdateData.huongKhacPhuc || 'Click để nhập hướng khắc phục...'}
                               </p>
                          )}
                      </div>
                 </div>

                 {/* Right: Metrics & Info */}
                 <div className="md:col-span-4 flex flex-col gap-4">
                      {/* Exchange Qty Input */}
                      <div 
                          className={`bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 flex flex-col gap-4 ${!editingSections.soLuong && permissions.canEdit ? 'cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all' : ''}`}
                          onClick={() => !editingSections.soLuong && startEditing('soLuong')}
                      >
                           <div className="flex flex-col items-center justify-center text-center">
                               <label className="text-xs font-bold text-emerald-600 uppercase mb-2 cursor-pointer tracking-wider">Số lượng đổi</label>
                               {editingSections.soLuong ? (
                                   <div className="flex items-center justify-center w-full">
                                       <input 
                                            type="number" 
                                            min="0"
                                            className="w-24 text-center text-3xl font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg py-1 focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm touch-manipulation"
                                            value={quickUpdateData.soLuongDoi}
                                            onChange={(e) => setQuickUpdateData({...quickUpdateData, soLuongDoi: Number(e.target.value)})}
                                            onClick={(e) => e.stopPropagation()} 
                                            autoFocus
                                       />
                                   </div>
                               ) : (
                                   <p className="text-4xl font-bold text-emerald-600">{report.soLuongDoi}</p>
                               )}
                           </div>
                           
                           {/* Date Exchange Field */}
                           <div className="border-t border-emerald-200/50 pt-3 mt-1">
                               <div className="flex items-center justify-center gap-2 mb-1 text-emerald-700">
                                   <CalendarIcon className="w-3.5 h-3.5" />
                                   <label className="text-xs font-bold uppercase cursor-pointer tracking-wide">Ngày đổi hàng</label>
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
                                    <span className="text-xs font-bold text-slate-400 uppercase">Ngày hoàn thành</span>
                                    <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                        {new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                           )}
                           {canSeeLoaiLoi && report.loaiLoi && (
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Nguồn gốc lỗi</span>
                                    {getLoaiLoiBadge(report.loaiLoi)}
                                </div>
                           )}
                      </div>
                 </div>
            </div>
        </div>

      </div>

      {/* Image Preview Modal */}
      {previewImage && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/20 hover:bg-white/40">
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