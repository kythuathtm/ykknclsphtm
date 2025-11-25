
import React from 'react';
import { DefectReport, UserRole } from '../types';
import { PencilIcon, TrashIcon, XIcon, WrenchIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon } from './Icons';

interface Props {
  report: DefectReport;
  onEdit: (report: DefectReport) => void;
  onDelete: (id: string) => void;
  permissions: { canEdit: boolean; canDelete: boolean };
  onClose: () => void;
  currentUserRole: UserRole;
}

interface DetailItemProps {
  label: string;
  value?: string | number | null;
  className?: string;
  fullWidth?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, className, fullWidth }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={fullWidth ? 'sm:col-span-2' : ''}>
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">{label}</dt>
            <dd className={`text-sm text-slate-800 break-words leading-relaxed ${className}`}>{value}</dd>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center">
            {icon ? <span className="bg-blue-100 text-blue-600 p-1 rounded-md mr-2">{icon}</span> : <span className="bg-blue-500 w-1.5 h-4 rounded-full mr-3"></span>}
            {title}
        </h4>
        {children}
    </div>
);


const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onDelete, permissions, onClose, currentUserRole }) => {
  
  // Check if current user role is allowed to see "Loại lỗi"
  const canSeeLoaiLoi = [
    UserRole.Admin,
    UserRole.TongGiamDoc,
    UserRole.CungUng,
    UserRole.KyThuat
  ].includes(currentUserRole);

  const getLoaiLoiClass = (loaiLoi: string) => {
    switch (loaiLoi) {
      case 'Lỗi bộ phận sản xuất':
      case 'Lỗi vừa sản xuất vừa NCC':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Lỗi Nhà cung cấp':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Lỗi khác':
        return 'bg-slate-50 text-slate-600 border border-slate-200';
      default:
        return 'text-slate-700';
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white/90 backdrop-blur-md flex justify-between items-start sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
                <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">{report.maSanPham}</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-medium text-slate-500">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">{report.tenThuongMai}</h3>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2 ml-4">
            {permissions.canEdit && (
              <button 
                onClick={() => onEdit(report)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
                title="Chỉnh sửa"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {permissions.canDelete && (
                <button 
                  onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
                          onDelete(report.id);
                      }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-95"
                  title="Xóa"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
            )}
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
              title="Đóng"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
      </div>
      
      <div className="px-4 sm:px-8 py-6 flex-1 overflow-y-auto bg-slate-50/50 space-y-6 custom-scrollbar">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Left Column: Customer Info */}
             <Section title="Thông tin Khách hàng & Phản ánh">
                <dl className="grid grid-cols-1 gap-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem 
                            label="Ngày tạo phiếu" 
                            value={report.ngayTao ? new Date(report.ngayTao).toLocaleDateString('en-GB') + ' ' + new Date(report.ngayTao).toLocaleTimeString('en-GB') : '-'} 
                            className="text-slate-500 text-xs"
                        />
                        <DetailItem label="Nhà phân phối" value={report.nhaPhanPhoi} />
                    </div>
                    <DetailItem label="Đơn vị sử dụng" value={report.donViSuDung} />
                    
                    <div className="mt-2 pt-4 border-t border-slate-100">
                        <DetailItem label="Nội dung phản ánh" value={report.noiDungPhanAnh} fullWidth className="text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100" />
                    </div>
                </dl>
             </Section>

             {/* Right Column: Product Info */}
             <Section title="Thông tin Sản phẩm Lỗi">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <DetailItem label="Dòng sản phẩm" value={report.dongSanPham} />
                    <DetailItem label="Nhãn hàng" value={report.nhanHang} className="font-semibold text-slate-700"/>
                    
                    <DetailItem label="Số lô" value={report.soLo} className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block"/>
                    <DetailItem label="Mã NSX" value={report.maNgaySanXuat} className="font-mono text-slate-600"/>
                </dl>
                
                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã nhập</p>
                        <p className="font-bold text-xl text-slate-700 mt-1">{report.soLuongDaNhap.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Lỗi</p>
                        <p className="font-bold text-xl text-red-600 mt-1">{report.soLuongLoi.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center shadow-sm">
                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Đổi</p>
                        <p className="font-bold text-xl text-green-600 mt-1">{report.soLuongDoi.toLocaleString('vi-VN')}</p>
                    </div>
                </div>
             </Section>
        </div>

        {/* Full Width Section: Resolution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center">
                <span className="bg-blue-100 text-blue-600 p-1 rounded-md mr-2"><ClipboardDocumentListIcon className="w-4 h-4" /></span>
                Kết quả Xử lý & Khắc phục
            </h4>
            
            {/* Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <DetailItem label="Trạng thái hiện tại" value={report.trangThai} className="font-medium"/>
                {report.trangThai === 'Hoàn thành' && (
                    <DetailItem 
                        label="Ngày hoàn thành" 
                        value={report.ngayHoanThanh ? new Date(report.ngayHoanThanh).toLocaleDateString('en-GB') : '---'} 
                        className="text-green-700 font-bold"
                    />
                )}
                {canSeeLoaiLoi && report.loaiLoi && (
                    <div className="sm:col-span-1">
                        <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Phân loại lỗi</dt>
                        <dd className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getLoaiLoiClass(report.loaiLoi)}`}>
                            {report.loaiLoi}
                        </dd>
                    </div>
                )}
            </div>

            {/* Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cause Card */}
                <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 flex flex-col h-full relative group hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <QuestionMarkCircleIcon className="w-5 h-5" />
                        </div>
                        <h5 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Nguyên nhân</h5>
                    </div>
                    <div className="flex-1 bg-white/80 border border-amber-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm">
                        {report.nguyenNhan || <span className="text-slate-400 italic">Chưa cập nhật thông tin nguyên nhân.</span>}
                    </div>
                </div>

                {/* Solution Card */}
                <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5 flex flex-col h-full relative group hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <WrenchIcon className="w-5 h-5" />
                        </div>
                        <h5 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Hướng khắc phục</h5>
                    </div>
                     <div className="flex-1 bg-white/80 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm">
                        {report.huongKhacPhuc || <span className="text-slate-400 italic">Chưa cập nhật hướng khắc phục.</span>}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </>
  );
};

export default React.memo(DefectReportDetail);
