
import React from 'react';
import { DefectReport, UserRole } from '../types';
import { PencilIcon, TrashIcon, XIcon, WrenchIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon, TagIcon, UserIcon } from './Icons';

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
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</dt>
            <dd className={`text-base text-slate-800 break-words font-medium ${className}`}>{value}</dd>
        </div>
    );
};

const Section = ({ title, icon, children }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-md">{icon}</span>
            {title}
        </h4>
        {children}
    </div>
);

const DefectReportDetail: React.FC<Props> = ({ report, onEdit, onDelete, permissions, onClose, currentUserRole }) => {
  const canSeeLoaiLoi = [UserRole.Admin, UserRole.TongGiamDoc, UserRole.CungUng, UserRole.KyThuat].includes(currentUserRole);

  const getLoaiLoiBadge = (loaiLoi: string) => {
    let style = 'bg-slate-100 text-slate-600 border-slate-200';
    if (loaiLoi === 'Lỗi Hỗn hợp') style = 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
    else if (loaiLoi === 'Lỗi Sản xuất') style = 'bg-rose-100 text-rose-700 border-rose-200';
    else if (loaiLoi === 'Lỗi Nhà cung cấp') style = 'bg-orange-100 text-orange-700 border-orange-200';
    
    return <span className={`px-2 py-1 rounded-md text-sm font-bold border ${style}`}>{loaiLoi}</span>;
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-start sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{report.maSanPham}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500">{new Date(report.ngayPhanAnh).toLocaleDateString('en-GB')}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{report.tenThuongMai}</h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {permissions.canEdit && (
              <button onClick={() => onEdit(report)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95" title="Chỉnh sửa">
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {permissions.canDelete && (
                <button onClick={() => { if (window.confirm('Xóa phản ánh này?')) onDelete(report.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95" title="Xóa">
                  <TrashIcon className="h-5 w-5" />
                </button>
            )}
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all active:scale-95">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 custom-scrollbar">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Section title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4"/>}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Dòng sản phẩm" value={report.dongSanPham} />
                    <DetailItem label="Nhãn hàng" value={report.nhanHang} className="font-semibold"/>
                    <DetailItem label="Tên thiết bị y tế" value={report.tenThietBi} fullWidth />
                    <DetailItem label="Số lô" value={report.soLo} className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit font-bold"/>
                    <DetailItem label="Mã NSX" value={report.maNgaySanXuat}/>
                </dl>
                <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Đã nhập</p>
                        <p className="font-bold text-xl text-slate-700 mt-1">{report.soLuongDaNhap}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
                        <p className="text-xs font-bold text-red-400 uppercase">Lỗi</p>
                        <p className="font-bold text-xl text-red-600 mt-1">{report.soLuongLoi}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                        <p className="text-xs font-bold text-emerald-400 uppercase">Đổi</p>
                        <p className="font-bold text-xl text-emerald-600 mt-1">{report.soLuongDoi}</p>
                    </div>
                </div>
             </Section>

             <Section title="Khách hàng & Phản ánh" icon={<UserIcon className="h-4 w-4"/>}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Nhà phân phối" value={report.nhaPhanPhoi} fullWidth/>
                    <DetailItem label="Đơn vị sử dụng" value={report.donViSuDung} fullWidth/>
                    <div className="col-span-full mt-2">
                        <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nội dung phản ánh</dt>
                        <dd className="text-base text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                            {report.noiDungPhanAnh}
                        </dd>
                    </div>
                </dl>
             </Section>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><ClipboardDocumentListIcon className="w-5 h-5" /></span>
                KẾT QUẢ XỬ LÝ
            </h4>
            
            <div className="flex flex-wrap gap-6 mb-8 items-center">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Trạng thái</span>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ${
                        report.trangThai === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        report.trangThai === 'Mới' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                        'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                        {report.trangThai}
                    </span>
                </div>
                {report.ngayHoanThanh && (
                    <div>
                         <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Ngày hoàn thành</span>
                         <span className="text-base font-bold text-slate-700">{new Date(report.ngayHoanThanh).toLocaleDateString('en-GB')}</span>
                    </div>
                )}
                {canSeeLoaiLoi && report.loaiLoi && (
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Phân loại lỗi</span>
                        {getLoaiLoiBadge(report.loaiLoi)}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3 text-amber-800">
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <h5 className="text-sm font-bold uppercase">Nguyên nhân</h5>
                    </div>
                    <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {report.nguyenNhan || <span className="text-slate-400 italic">Chưa có thông tin.</span>}
                    </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3 text-blue-800">
                        <WrenchIcon className="w-5 h-5" />
                        <h5 className="text-sm font-bold uppercase">Hướng khắc phục</h5>
                    </div>
                    <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {report.huongKhacPhuc || <span className="text-slate-400 italic">Chưa có thông tin.</span>}
                    </p>
                </div>
            </div>
        </div>

      </div>
    </>
  );
};

export default DefectReportDetail;
