
import React, { useState, useEffect, useRef } from 'react';
import { DefectReport, UserRole, PermissionField, Product } from '../types';
import { XIcon, CheckCircleIcon, TagIcon, UserIcon, WrenchIcon, QuestionMarkCircleIcon } from './Icons';

interface Props {
  initialData: DefectReport | null;
  onSave: (report: DefectReport) => void;
  onClose: () => void;
  currentUserRole: UserRole;
  editableFields: PermissionField[];
  products: Product[];
}

const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}

const DefectReportForm: React.FC<Props> = ({ initialData, onSave, onClose, currentUserRole, editableFields, products }) => {
  const [formData, setFormData] = useState<Omit<DefectReport, 'id'>>({
    ngayTao: new Date().toISOString(),
    ngayPhanAnh: getTodayDateString(),
    maSanPham: '', dongSanPham: '', tenThuongMai: '', nhaPhanPhoi: '',
    donViSuDung: '', noiDungPhanAnh: '', soLo: '', maNgaySanXuat: '',
    soLuongLoi: 0, soLuongDaNhap: 0, soLuongDoi: 0,
    nguyenNhan: '', huongKhacPhuc: '', trangThai: 'Mới',
    ngayHoanThanh: '', loaiLoi: '' as any, nhanHang: 'Khác', 
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<DefectReport, 'id'>, string>>>({});
  const [isProductInfoLocked, setIsProductInfoLocked] = useState(false);
  const productCodeInputRef = useRef<HTMLInputElement>(null);

  const isFieldDisabled = (fieldName: keyof Omit<DefectReport, 'id'>) => {
    if (!initialData) return false; 
    if (isProductInfoLocked && ['dongSanPham', 'tenThuongMai', 'nhanHang'].includes(fieldName)) return true;

    let permissionKey: PermissionField;
    if (['nguyenNhan'].includes(fieldName)) permissionKey = 'nguyenNhan';
    else if (['huongKhacPhuc'].includes(fieldName)) permissionKey = 'huongKhacPhuc';
    else if (['trangThai'].includes(fieldName)) permissionKey = 'trangThai';
    else if (['ngayHoanThanh'].includes(fieldName)) permissionKey = 'ngayHoanThanh';
    else if (['loaiLoi'].includes(fieldName)) permissionKey = 'loaiLoi';
    else if (['soLuongDoi'].includes(fieldName)) permissionKey = 'soLuongDoi';
    else permissionKey = 'general';

    return !editableFields.includes(permissionKey);
  };
  
  const validate = () => {
    const newErrors: Partial<Record<keyof Omit<DefectReport, 'id'>, string>> = {};
    if (!formData.ngayPhanAnh) newErrors.ngayPhanAnh = "Vui lòng chọn ngày phản ánh.";
    if (!formData.maSanPham) newErrors.maSanPham = "Mã sản phẩm là bắt buộc.";
    if (!formData.soLo) newErrors.soLo = "Vui lòng nhập số lô.";
    if (!formData.nhaPhanPhoi) newErrors.nhaPhanPhoi = "Vui lòng nhập nhà phân phối.";
    if (!formData.noiDungPhanAnh) newErrors.noiDungPhanAnh = "Nội dung phản ánh không được để trống.";
    if (!formData.loaiLoi) newErrors.loaiLoi = "Vui lòng chọn phân loại lỗi.";
    
    if (formData.trangThai === 'Hoàn thành') {
        if (!formData.ngayHoanThanh) newErrors.ngayHoanThanh = "Cần có ngày hoàn thành.";
        if (!formData.nguyenNhan || formData.nguyenNhan.trim() === '') newErrors.nguyenNhan = "Phải nhập nguyên nhân.";
        if (!formData.huongKhacPhuc || formData.huongKhacPhuc.trim() === '') newErrors.huongKhacPhuc = "Phải nhập hướng khắc phục.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const product = products.find(p => p.maSanPham.toLowerCase() === initialData.maSanPham.toLowerCase());
      setIsProductInfoLocked(!!product);
    } else {
      setFormData(prev => ({ ...prev, ngayPhanAnh: getTodayDateString() }));
      setIsProductInfoLocked(false);
      setTimeout(() => productCodeInputRef.current?.focus(), 100);
    }
  }, [initialData, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
        const newState = { ...prev };
        if (name === 'maSanPham') {
            const product = products.find(p => p.maSanPham.toLowerCase() === value.toLowerCase());
            if (product) {
                newState.maSanPham = product.maSanPham;
                newState.dongSanPham = product.dongSanPham;
                newState.tenThuongMai = product.tenThuongMai;
                if (product.nhanHang) newState.nhanHang = product.nhanHang as any;
                setIsProductInfoLocked(true);
            } else {
                newState.maSanPham = value;
                newState.dongSanPham = '';
                newState.tenThuongMai = '';
                newState.nhanHang = 'Khác';
                setIsProductInfoLocked(false);
            }
        } else if (name === 'trangThai') {
            newState.trangThai = value as any;
            if (value === 'Hoàn thành' && !newState.ngayHoanThanh) newState.ngayHoanThanh = getTodayDateString();
        } else {
            let processedValue: string | number = value;
            if (type === 'number') {
                processedValue = value === '' ? 0 : parseInt(value, 10);
                if (isNaN(processedValue) || processedValue < 0) processedValue = 0;
            }
            (newState as any)[name] = processedValue;
        }
        return newState;
    });

    if (errors[name as keyof typeof errors]) {
        setErrors(prev => {
            const newErrs = { ...prev };
            delete newErrs[name as keyof typeof errors];
            return newErrs;
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        if (formData.trangThai === 'Hoàn thành') {
            if (!window.confirm("Bạn đang chuyển trạng thái thành 'Hoàn thành'.\n\nHành động này xác nhận việc xử lý đã kết thúc và hồ sơ sẽ được lưu trữ. Bạn có chắc chắn muốn tiếp tục?")) {
                return;
            }
        }
        onSave({ ...formData, id: initialData?.id || '' });
    }
  };
  
  const getInputClasses = (fieldName: keyof Omit<DefectReport, 'id'>, isReadOnly: boolean = false) => {
    const base = "transition-all duration-200 mt-1 block w-full rounded-xl text-sm py-2.5 px-3 border shadow-sm outline-none";
    const normal = "bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400";
    const errorClass = errors[fieldName] ? "border-red-500 ring-2 ring-red-500/10 bg-red-50" : "";
    const disabled = isFieldDisabled(fieldName) ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed shadow-none" : normal;
    const readonly = isReadOnly ? "bg-slate-50 text-slate-600 border-slate-200 cursor-default focus:ring-0" : "";
    
    if (isFieldDisabled(fieldName)) return `${base} ${disabled}`;
    if (isReadOnly) return `${base} ${readonly}`;
    return `${base} ${normal} ${errorClass}`;
  };

  const ErrorMessage = ({ field }: { field: keyof Omit<DefectReport, 'id'> }) => {
      if (!errors[field]) return null;
      return <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>{errors[field]}</p>;
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
          <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase">{initialData ? 'CHỈNH SỬA PHẢN ÁNH' : 'TẠO PHẢN ÁNH MỚI'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Vui lòng điền đầy đủ thông tin bắt buộc (*)</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form id="report-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-slate-50/50" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            
            {/* LEFT COLUMN: Product & Customer */}
            <div className="md:col-span-7 space-y-8">
                 {/* Product Info */}
                 <section>
                    <SectionHeader title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4" />} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Mã sản phẩm <span className="text-red-500">*</span></label>
                            <input ref={productCodeInputRef} type="text" name="maSanPham" value={formData.maSanPham} onChange={handleChange} required placeholder="VD: AMX500" className={getInputClasses('maSanPham')} disabled={isFieldDisabled('maSanPham')}/>
                            <ErrorMessage field="maSanPham" />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Số lô <span className="text-red-500">*</span></label>
                            <input type="text" name="soLo" value={formData.soLo} onChange={handleChange} required className={getInputClasses('soLo')} disabled={isFieldDisabled('soLo')}/>
                            <ErrorMessage field="soLo" />
                        </div>
                        
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Tên thương mại</label>
                            <input type="text" name="tenThuongMai" value={formData.tenThuongMai} onChange={handleChange} readOnly={isProductInfoLocked || isFieldDisabled('tenThuongMai')} className={getInputClasses('tenThuongMai', isProductInfoLocked || isFieldDisabled('tenThuongMai'))}/>
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Dòng sản phẩm</label>
                            <input type="text" name="dongSanPham" value={formData.dongSanPham} onChange={handleChange} readOnly={isProductInfoLocked || isFieldDisabled('dongSanPham')} className={getInputClasses('dongSanPham', isProductInfoLocked || isFieldDisabled('dongSanPham'))}/>
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Nhãn hàng</label>
                            <select name="nhanHang" value={formData.nhanHang} onChange={handleChange} className={getInputClasses('nhanHang', isProductInfoLocked || isFieldDisabled('nhanHang'))} disabled={isProductInfoLocked || isFieldDisabled('nhanHang')}>
                                <option value="HTM">HTM</option>
                                <option value="VMA">VMA</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Mã NSX</label>
                            <input type="text" name="maNgaySanXuat" value={formData.maNgaySanXuat} onChange={handleChange} className={getInputClasses('maNgaySanXuat')} disabled={isFieldDisabled('maNgaySanXuat')}/>
                        </div>

                        {/* Quantities */}
                        <div className="sm:col-span-2 grid grid-cols-3 gap-3 pt-2">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 ml-1 mb-1">Đã nhập</label>
                                <input type="number" name="soLuongDaNhap" value={formData.soLuongDaNhap} onChange={handleChange} min="0" className={getInputClasses('soLuongDaNhap')} disabled={isFieldDisabled('soLuongDaNhap')}/>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-red-500 ml-1 mb-1">Lỗi</label>
                                <input type="number" name="soLuongLoi" value={formData.soLuongLoi} onChange={handleChange} min="0" className={getInputClasses('soLuongLoi')} disabled={isFieldDisabled('soLuongLoi')}/>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-green-600 ml-1 mb-1">Đổi</label>
                                <input type="number" name="soLuongDoi" value={formData.soLuongDoi} onChange={handleChange} min="0" className={getInputClasses('soLuongDoi')} disabled={isFieldDisabled('soLuongDoi')}/>
                             </div>
                        </div>
                    </div>
                 </section>

                 {/* Customer Info */}
                 <section>
                    <SectionHeader title="Thông tin Khách hàng & Phản ánh" icon={<UserIcon className="h-4 w-4" />} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-1">
                             <label className="block text-xs font-bold text-slate-700 ml-1">Ngày phản ánh <span className="text-red-500">*</span></label>
                             <input type="date" name="ngayPhanAnh" value={formData.ngayPhanAnh} onChange={handleChange} required className={getInputClasses('ngayPhanAnh')} disabled={isFieldDisabled('ngayPhanAnh')}/>
                             <ErrorMessage field="ngayPhanAnh" />
                        </div>
                        <div className="sm:col-span-1">
                             <label className="block text-xs font-bold text-slate-700 ml-1">Nhà phân phối <span className="text-red-500">*</span></label>
                             <input type="text" name="nhaPhanPhoi" value={formData.nhaPhanPhoi} onChange={handleChange} required className={getInputClasses('nhaPhanPhoi')} disabled={isFieldDisabled('nhaPhanPhoi')}/>
                             <ErrorMessage field="nhaPhanPhoi" />
                        </div>
                         <div className="sm:col-span-2">
                             <label className="block text-xs font-bold text-slate-700 ml-1">Đơn vị sử dụng</label>
                             <input type="text" name="donViSuDung" value={formData.donViSuDung} onChange={handleChange} className={getInputClasses('donViSuDung')} disabled={isFieldDisabled('donViSuDung')}/>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 ml-1">Nội dung phản ánh <span className="text-red-500">*</span></label>
                            <textarea name="noiDungPhanAnh" rows={3} value={formData.noiDungPhanAnh} onChange={handleChange} required className={getInputClasses('noiDungPhanAnh')} disabled={isFieldDisabled('noiDungPhanAnh')}></textarea>
                            <ErrorMessage field="noiDungPhanAnh" />
                        </div>
                    </div>
                 </section>
            </div>

            {/* RIGHT COLUMN: Resolution & Status */}
            <div className="md:col-span-5 space-y-8">
                 <section className="bg-slate-100 p-5 rounded-xl border border-slate-200">
                    <SectionHeader title="Phân tích & Xử lý" icon={<WrenchIcon className="h-4 w-4" />} />
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 ml-1">Phân loại lỗi <span className="text-red-500">*</span></label>
                            <select name="loaiLoi" value={formData.loaiLoi} onChange={handleChange} className={getInputClasses('loaiLoi')} required disabled={isFieldDisabled('loaiLoi')}>
                                <option value="" disabled>-- Chọn --</option>
                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                <option value="Lỗi Khác">Lỗi Khác</option>
                            </select>
                            <ErrorMessage field="loaiLoi" />
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-700 ml-1 flex justify-between">
                                Nguyên nhân {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea name="nguyenNhan" rows={4} value={formData.nguyenNhan} onChange={handleChange} className={getInputClasses('nguyenNhan')} placeholder="Mô tả nguyên nhân..." disabled={isFieldDisabled('nguyenNhan')}></textarea>
                            <ErrorMessage field="nguyenNhan" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 ml-1 flex justify-between">
                                Hướng khắc phục {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea name="huongKhacPhuc" rows={4} value={formData.huongKhacPhuc} onChange={handleChange} className={getInputClasses('huongKhacPhuc')} placeholder="Đề xuất xử lý..." disabled={isFieldDisabled('huongKhacPhuc')}></textarea>
                            <ErrorMessage field="huongKhacPhuc" />
                        </div>
                    </div>
                 </section>

                 <section className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <SectionHeader title="Trạng thái hồ sơ" icon={<CheckCircleIcon className="h-4 w-4" />} />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 ml-1">Trạng thái xử lý</label>
                            <select name="trangThai" value={formData.trangThai} onChange={handleChange} className={getInputClasses('trangThai')} disabled={isFieldDisabled('trangThai')}>
                                <option value="Mới">✨ Mới</option>
                                <option value="Đang xử lý">⏳ Đang xử lý</option>
                                <option value="Chưa tìm ra nguyên nhân">❓ Chưa rõ nguyên nhân</option>
                                <option value="Hoàn thành">✅ Hoàn thành</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-700 ml-1">
                                Ngày hoàn thành {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
                            </label>
                            <input 
                                type="date" 
                                name="ngayHoanThanh" 
                                value={formData.ngayHoanThanh || ''} 
                                onChange={handleChange} 
                                className={getInputClasses('ngayHoanThanh')}
                                disabled={isFieldDisabled('ngayHoanThanh') || (formData.trangThai !== 'Hoàn thành' && !formData.ngayHoanThanh)}
                            />
                            <ErrorMessage field="ngayHoanThanh" />
                        </div>
                    </div>
                 </section>
            </div>

          </div>
        </form>
        
        {/* Footer Actions */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-slate-200 gap-3">
          <div className="text-xs text-slate-400 italic hidden sm:block">Kiểm tra kỹ thông tin trước khi lưu.</div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                Hủy bỏ
            </button>
            <button 
                type="submit" 
                form="report-form" 
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center"
            >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {initialData ? 'CẬP NHẬT' : 'TẠO PHẢN ÁNH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectReportForm;
