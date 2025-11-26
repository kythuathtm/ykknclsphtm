
import React, { useState } from 'react';
import { DefectReport, UserRole } from '../types';
import { PencilIcon, TrashIcon, XIcon, WrenchIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon, TagIcon, UserIcon, CheckCircleIcon, CalendarIcon } from './Icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Props {
  report: DefectReport;
  onEdit: (report: DefectReport) => void;
  onDelete: (id: string) => void;
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  currentUserRole: UserRole;
}

const DetailItem = ({ label, value, className, fullWidth }: any) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</dt>
            <dd className={`text-base text-slate-800 break-words font-medium ${className}`}>{value}</dd>
        </div>
    );
};

const Section = ({ title, icon, children }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <span className="p-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">{icon}</span>
            {title}
        </h4>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onDelete, permissions, onClose, currentUserRole }) => {
  const canSeeLoaiLoi = ([UserRole.Admin, UserRole.TongGiamDoc, UserRole.CungUng, UserRole.KyThuat] as string[]).includes(currentUserRole);
  
  const [quickUpdateData, setQuickUpdateData] = useState({
      nguyenNhan: report.nguyenNhan || '',
      huongKhacPhuc: report.huongKhacPhuc || '',
      soLuongDoi: report.soLuongDoi || 0,
      ngayDoiHang: report.ngayDoiHang || ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingQuickAction, setIsEditingQuickAction] = useState(false);

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
          const reportRef = doc(db, "reports", report.id);
          const updates: any = {
              nguyenNhan: quickUpdateData.nguyenNhan,
              huongKhacPhuc: quickUpdateData.huongKhacPhuc,
              soLuongDoi: Number(quickUpdateData.soLuongDoi),
              ngayDoiHang: quickUpdateData.ngayDoiHang
          };

          // Logic: Auto-complete if everything is filled
          if (updates.nguyenNhan && updates.huongKhacPhuc && updates.soLuongDoi > 0 && report.trangThai !== 'Hoàn thành') {
              updates.trangThai = 'Hoàn thành';
              updates.ngayHoanThanh = new Date().toISOString().split('T')[0];
              alert("Đã cập nhật thông tin và chuyển trạng thái sang HOÀN THÀNH do đủ điều kiện.");
          } else {
              alert("Đã cập nhật thông tin xử lý.");
          }

          await updateDoc(reportRef, updates);
          setIsEditingQuickAction(false);
      } catch (e) {
          console.error(e);
          alert("Lỗi khi cập nhật");
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
      setIsEditingQuickAction(false);
  };
  
  const enableEditMode = () => {
      if (!isEditingQuickAction && permissions.canEdit) {
          setIsEditingQuickAction(true);
      }
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-start sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase shadow-sm">{report.maSanPham}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}
                </span>
            </div>
            {/* Changed from font-black to font-bold for better rendering */}
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{report.tenThuongMai}</h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
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
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all active:scale-95">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6 custom-scrollbar">
        
        {/* TOP ROW: PRODUCT & CUSTOMER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Section title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4"/>}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Dòng sản phẩm" value={report.dongSanPham} />
                    <DetailItem label="Nhãn hàng" value={report.nhanHang} className="font-semibold text-blue-600"/>
                    <DetailItem label="Tên thiết bị y tế" value={report.tenThietBi} fullWidth />
                    <DetailItem label="Số lô" value={report.soLo} className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit font-bold border border-slate-200"/>
                    <DetailItem label="Mã NSX" value={report.maNgaySanXuat}/>
                </dl>
                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-3 border border-slate-100 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Đã nhập</p>
                        {/* Changed font-black to font-bold */}
                        <p className="font-bold text-xl text-slate-700 mt-1">{report.soLuongDaNhap}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Lỗi</p>
                        {/* Changed font-black to font-bold */}
                        <p className="font-bold text-xl text-red-600 mt-1">{report.soLuongLoi}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Đổi</p>
                        {/* Changed font-black to font-bold */}
                        <p className="font-bold text-xl text-emerald-600 mt-1">{report.soLuongDoi}</p>
                    </div>
                </div>
             </Section>

             <Section title="Khách hàng & Phản ánh" icon={<UserIcon className="h-4 w-4"/>}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Nhà phân phối" value={report.nhaPhanPhoi} fullWidth/>
                    <DetailItem label="Đơn vị sử dụng" value={report.donViSuDung} fullWidth/>
                    <div className="col-span-full mt-2">
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nội dung phản ánh</dt>
                        <dd className="text-base text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed shadow-inner">
                            {report.noiDungPhanAnh}
                        </dd>
                    </div>
                </dl>
             </Section>
        </div>

        {/* BOTTOM ROW: PROCESSING (ACTIONABLE) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             
             {/* Header */}
             <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 flex justify-between items-center relative z-10">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><ClipboardDocumentListIcon className="w-5 h-5" /></span>
                    Xử lý & Khắc phục
                </h4>
                <div className="flex gap-3 items-center">
                     {report.trangThai !== 'Hoàn thành' && permissions.canEdit && (
                        <>
                            {isEditingQuickAction ? (
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
                                    onClick={enableEditMode}
                                    className="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center"
                                >
                                    <PencilIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Cập nhật
                                </button>
                            )}
                        </>
                     )}
                     <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ml-2 shadow-sm ${
                        report.trangThai === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        report.trangThai === 'Mới' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {report.trangThai.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Quick Edit Fields */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                 {/* Left: Input Areas */}
                 <div className="md:col-span-8 grid grid-cols-1 gap-4">
                      {/* Cause & Solution Inputs */}
                      <div 
                        className={`bg-amber-50/50 rounded-xl p-4 border border-amber-100 group ${!isEditingQuickAction && permissions.canEdit ? 'cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all' : ''}`}
                        onClick={enableEditMode}
                      >
                          <div className="flex items-center gap-2 mb-2 text-amber-700">
                                <QuestionMarkCircleIcon className="w-4 h-4" />
                                <label className="text-xs font-bold uppercase tracking-wide cursor-pointer">Nguyên nhân</label>
                          </div>
                          {isEditingQuickAction ? (
                              <textarea 
                                className="w-full bg-white border border-amber-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none resize-none shadow-sm"
                                rows={3}
                                placeholder="Nhập nguyên nhân..."
                                value={quickUpdateData.nguyenNhan}
                                onChange={(e) => setQuickUpdateData({...quickUpdateData, nguyenNhan: e.target.value})}
                              />
                          ) : (
                              <p className={`text-sm leading-relaxed ${quickUpdateData.nguyenNhan ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                  {quickUpdateData.nguyenNhan || 'Click để nhập nguyên nhân...'}
                              </p>
                          )}
                      </div>

                      <div 
                        className={`bg-blue-50/50 rounded-xl p-4 border border-blue-100 group ${!isEditingQuickAction && permissions.canEdit ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''}`}
                        onClick={enableEditMode}
                      >
                          <div className="flex items-center gap-2 mb-2 text-blue-700">
                                <WrenchIcon className="w-4 h-4" />
                                <label className="text-xs font-bold uppercase tracking-wide cursor-pointer">Hướng khắc phục</label>
                          </div>
                          {isEditingQuickAction ? (
                               <textarea 
                                className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none shadow-sm"
                                rows={3}
                                placeholder="Nhập hướng xử lý..."
                                value={quickUpdateData.huongKhacPhuc}
                                onChange={(e) => setQuickUpdateData({...quickUpdateData, huongKhacPhuc: e.target.value})}
                              />
                          ) : (
                               <p className={`text-sm leading-relaxed ${quickUpdateData.huongKhacPhuc ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                  {quickUpdateData.huongKhacPhuc || 'Click để nhập hướng khắc phục...'}
                               </p>
                          )}
                      </div>
                 </div>

                 {/* Right: Metrics & Info */}
                 <div className="md:col-span-4 flex flex-col gap-4">
                      {/* Exchange Qty Input */}
                      <div 
                          className={`bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 flex flex-col gap-4 ${!isEditingQuickAction && permissions.canEdit ? 'cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all' : ''}`}
                          onClick={enableEditMode}
                      >
                           <div className="flex flex-col items-center justify-center text-center">
                               <label className="text-[10px] font-bold text-emerald-600 uppercase mb-2 cursor-pointer tracking-wider">Số lượng đổi</label>
                               {isEditingQuickAction ? (
                                   <div className="flex items-center justify-center w-full">
                                       <input 
                                            type="number" 
                                            min="0"
                                            // Fixed: Changed from font-black to font-bold
                                            className="w-24 text-center text-3xl font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg py-1 focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm"
                                            value={quickUpdateData.soLuongDoi}
                                            onChange={(e) => setQuickUpdateData({...quickUpdateData, soLuongDoi: Number(e.target.value)})}
                                            onClick={(e) => e.stopPropagation()} 
                                       />
                                   </div>
                               ) : (
                                   // Fixed: Changed from font-black to font-bold
                                   <p className="text-4xl font-bold text-emerald-600">{report.soLuongDoi}</p>
                               )}
                           </div>
                           
                           {/* Date Exchange Field */}
                           <div className="border-t border-emerald-200/50 pt-3 mt-1">
                               <div className="flex items-center justify-center gap-2 mb-1 text-emerald-700">
                                   <CalendarIcon className="w-3.5 h-3.5" />
                                   <label className="text-[10px] font-bold uppercase cursor-pointer tracking-wide">Ngày đổi hàng</label>
                               </div>
                               {isEditingQuickAction ? (
                                   <input 
                                        type="date"
                                        className="w-full text-center text-sm font-bold text-emerald-800 bg-white border border-emerald-200 rounded-lg py-1.5 focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm"
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
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày hoàn thành</span>
                                    <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                        {new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                           )}
                           {canSeeLoaiLoi && report.loaiLoi && (
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Phân loại lỗi</span>
                                    {getLoaiLoiBadge(report.loaiLoi)}
                                </div>
                           )}
                      </div>
                 </div>
            </div>
        </div>

      </div>
    </>
  );
};

export default DefectReportDetail;
