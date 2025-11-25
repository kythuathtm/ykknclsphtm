
import React, { useState, useEffect, useRef } from 'react';
import { DefectReport, UserRole, PermissionField, Product } from '../types';
import { XIcon, CheckCircleIcon } from './Icons';

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
    ngayTao: new Date().toISOString(), // Initialize
    ngayPhanAnh: getTodayDateString(),
    maSanPham: '',
    dongSanPham: '',
    tenThuongMai: '',
    nhaPhanPhoi: '',
    donViSuDung: '',
    noiDungPhanAnh: '',
    soLo: '',
    maNgaySanXuat: '',
    soLuongLoi: 0,
    soLuongDaNhap: 0,
    soLuongDoi: 0,
    nguyenNhan: '',
    huongKhacPhuc: '',
    trangThai: 'Mới',
    ngayHoanThanh: '',
    loaiLoi: '' as any,
    nhanHang: 'Khác', 
  });
  
  // Changed errors to store messages strings instead of booleans
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<DefectReport, 'id'>, string>>>({});
  const [isProductInfoLocked, setIsProductInfoLocked] = useState(false);
  const productCodeInputRef = useRef<HTMLInputElement>(null);

  const isFieldDisabled = (fieldName: keyof Omit<DefectReport, 'id'>) => {
    if (!initialData) return false; 
    
    if (isProductInfoLocked && ['dongSanPham', 'tenThuongMai', 'nhanHang'].includes(fieldName)) {
        return true;
    }

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
    
    // Validation for "Hoàn thành" status
    if (formData.trangThai === 'Hoàn thành') {
        if (!formData.ngayHoanThanh) {
            newErrors.ngayHoanThanh = "Cần có ngày hoàn thành khi trạng thái là Hoàn thành.";
        }
        if (!formData.nguyenNhan || formData.nguyenNhan.trim() === '') {
            newErrors.nguyenNhan = "Phải nhập nguyên nhân để hoàn thành báo cáo.";
        }
        if (!formData.huongKhacPhuc || formData.huongKhacPhuc.trim() === '') {
            newErrors.huongKhacPhuc = "Phải nhập hướng khắc phục để hoàn thành báo cáo.";
        }
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
      setFormData({
        ngayTao: new Date().toISOString(),
        ngayPhanAnh: getTodayDateString(),
        maSanPham: '', dongSanPham: '', tenThuongMai: '', nhaPhanPhoi: '',
        donViSuDung: '', noiDungPhanAnh: '', soLo: '', maNgaySanXuat: '',
        soLuongLoi: 0, soLuongDaNhap: 0, soLuongDoi: 0,
        nguyenNhan: '', huongKhacPhuc: '', trangThai: 'Mới',
        ngayHoanThanh: '',
        loaiLoi: '' as any,
        nhanHang: 'Khác',
      });
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
                if (product.nhanHang) {
                    newState.nhanHang = product.nhanHang as any;
                }
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
            if (value === 'Hoàn thành' && !newState.ngayHoanThanh) {
                newState.ngayHoanThanh = getTodayDateString();
            }
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

    // Clear specific error when user types
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
        onSave({ ...formData, id: initialData?.id || '' });
    } else {
        // Optional: Scroll to top or first error could be implemented here
    }
  };
  
  const getInputClasses = (fieldName: keyof Omit<DefectReport, 'id'>, isReadOnly: boolean = false) => {
    const base = "transition-all duration-200 mt-1 block w-full border rounded-xl shadow-sm sm:text-sm py-2.5 px-3";
    const normal = "bg-white text-slate-900 border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400";
    const errorClass = errors[fieldName] ? "border-red-500 ring-1 ring-red-500/20 bg-red-50" : "";
    const disabled = isFieldDisabled(fieldName) ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed shadow-none" : normal;
    const readonly = isReadOnly ? "bg-slate-50 text-slate-600 border-slate-200 cursor-default focus:ring-0" : "";
    
    if (isFieldDisabled(fieldName)) return `${base} ${disabled}`;
    if (isReadOnly) return `${base} ${readonly}`;
    return `${base} ${normal} ${errorClass}`;
  };

  const ErrorMessage = ({ field }: { field: keyof Omit<DefectReport, 'id'> }) => {
      if (!errors[field]) return null;
      return <p className="mt-1 text-xs font-medium text-red-500 animate-pulse">{errors[field]}</p>;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      {/* Modal Container: Bottom sheet on mobile, centered card on desktop */}
      <div className="bg-white w-full max-w-6xl h-[96vh] sm:h-auto sm:max-h-[95vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5 transition-transform duration-300 transform translate-y-0">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">{initialData ? 'Chỉnh sửa Báo cáo' : 'Tạo Báo cáo Mới'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <form id="report-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-x-8 gap-y-4 sm:gap-y-5">
            
            {/* SECTION 1: THÔNG TIN PHẢN ÁNH */}
            <div className="md:col-span-6 text-sm font-bold text-blue-600 uppercase tracking-wide border-b border-blue-100 pb-2 mb-2">1. Thông tin phản ánh</div>
            
            <div className="md:col-span-2">
              <label htmlFor="ngayPhanAnh" className="block text-sm font-semibold text-slate-700">Ngày phản ánh <span className="text-red-500">*</span></label>
              <input type="date" name="ngayPhanAnh" value={formData.ngayPhanAnh} onChange={handleChange} required className={getInputClasses('ngayPhanAnh')} disabled={isFieldDisabled('ngayPhanAnh')}/>
              <ErrorMessage field="ngayPhanAnh" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="maSanPham" className="block text-sm font-semibold text-slate-700">Mã sản phẩm <span className="text-red-500">*</span></label>
              <input ref={productCodeInputRef} type="text" name="maSanPham" value={formData.maSanPham} onChange={handleChange} required placeholder="VD: AMX500" className={getInputClasses('maSanPham')} disabled={isFieldDisabled('maSanPham')}/>
              <ErrorMessage field="maSanPham" />
            </div>
             <div className="md:col-span-2">
              <label htmlFor="loaiLoi" className="block text-sm font-semibold text-slate-700">Loại lỗi <span className="text-red-500">*</span></label>
              <select name="loaiLoi" value={formData.loaiLoi} onChange={handleChange} className={getInputClasses('loaiLoi')} required disabled={isFieldDisabled('loaiLoi')}>
                <option value="" disabled>-- Chọn loại lỗi --</option>
                <option value="Lỗi bộ phận sản xuất">Lỗi bộ phận sản xuất</option>
                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                <option value="Lỗi vừa sản xuất vừa NCC">Lỗi vừa sản xuất vừa NCC</option>
                <option value="Lỗi khác">Lỗi khác</option>
              </select>
              <ErrorMessage field="loaiLoi" />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="dongSanPham" className="block text-sm font-semibold text-slate-700">Dòng sản phẩm</label>
              <input type="text" name="dongSanPham" value={formData.dongSanPham} onChange={handleChange} readOnly={isProductInfoLocked || isFieldDisabled('dongSanPham')} className={getInputClasses('dongSanPham', isProductInfoLocked || isFieldDisabled('dongSanPham'))}/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="tenThuongMai" className="block text-sm font-semibold text-slate-700">Tên thương mại</label>
              <input type="text" name="tenThuongMai" value={formData.tenThuongMai} onChange={handleChange} readOnly={isProductInfoLocked || isFieldDisabled('tenThuongMai')} className={getInputClasses('tenThuongMai', isProductInfoLocked || isFieldDisabled('tenThuongMai'))}/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="nhanHang" className="block text-sm font-semibold text-slate-700">Nhãn hàng</label>
               <select name="nhanHang" value={formData.nhanHang} onChange={handleChange} className={getInputClasses('nhanHang', isProductInfoLocked || isFieldDisabled('nhanHang'))} disabled={isProductInfoLocked || isFieldDisabled('nhanHang')}>
                 <option value="HTM">HTM</option>
                 <option value="VMA">VMA</option>
                 <option value="Khác">Khác</option>
              </select>
            </div>

             <div className="md:col-span-2">
              <label htmlFor="soLo" className="block text-sm font-semibold text-slate-700">Số lô <span className="text-red-500">*</span></label>
              <input type="text" name="soLo" value={formData.soLo} onChange={handleChange} required className={getInputClasses('soLo')} disabled={isFieldDisabled('soLo')}/>
              <ErrorMessage field="soLo" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="maNgaySanXuat" className="block text-sm font-semibold text-slate-700">Mã ngày sản xuất</label>
              <input type="text" name="maNgaySanXuat" value={formData.maNgaySanXuat} onChange={handleChange} className={getInputClasses('maNgaySanXuat')} disabled={isFieldDisabled('maNgaySanXuat')}/>
            </div>
            <div className="hidden md:block md:col-span-2"></div>

             <div className="md:col-span-2">
              <label htmlFor="soLuongDaNhap" className="block text-sm font-semibold text-slate-700">SL Đã nhập</label>
              <input type="number" name="soLuongDaNhap" value={formData.soLuongDaNhap} onChange={handleChange} min="0" className={getInputClasses('soLuongDaNhap')} disabled={isFieldDisabled('soLuongDaNhap')}/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="soLuongLoi" className="block text-sm font-semibold text-slate-700">SL Lỗi</label>
              <input type="number" name="soLuongLoi" value={formData.soLuongLoi} onChange={handleChange} min="0" className={getInputClasses('soLuongLoi')} disabled={isFieldDisabled('soLuongLoi')}/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="soLuongDoi" className="block text-sm font-semibold text-slate-700">SL Đổi</label>
              <input type="number" name="soLuongDoi" value={formData.soLuongDoi} onChange={handleChange} min="0" className={getInputClasses('soLuongDoi')} disabled={isFieldDisabled('soLuongDoi')}/>
            </div>

            {/* SECTION 2: THÔNG TIN KHÁCH HÀNG */}
            <div className="md:col-span-6 text-sm font-bold text-blue-600 uppercase tracking-wide border-b border-blue-100 pb-2 mb-2 mt-2">2. Thông tin khách hàng</div>
            
             <div className="md:col-span-3">
              <label htmlFor="nhaPhanPhoi" className="block text-sm font-semibold text-slate-700">Nhà phân phối <span className="text-red-500">*</span></label>
              <input type="text" name="nhaPhanPhoi" value={formData.nhaPhanPhoi} onChange={handleChange} required className={getInputClasses('nhaPhanPhoi')} disabled={isFieldDisabled('nhaPhanPhoi')}/>
              <ErrorMessage field="nhaPhanPhoi" />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="donViSuDung" className="block text-sm font-semibold text-slate-700">Đơn vị sử dụng</label>
              <input type="text" name="donViSuDung" value={formData.donViSuDung} onChange={handleChange} className={getInputClasses('donViSuDung')} disabled={isFieldDisabled('donViSuDung')}/>
            </div>

            <div className="md:col-span-6">
              <label htmlFor="noiDungPhanAnh" className="block text-sm font-semibold text-slate-700">Nội dung phản ánh <span className="text-red-500">*</span></label>
              <textarea name="noiDungPhanAnh" rows={3} value={formData.noiDungPhanAnh} onChange={handleChange} required className={getInputClasses('noiDungPhanAnh')} disabled={isFieldDisabled('noiDungPhanAnh')}></textarea>
              <ErrorMessage field="noiDungPhanAnh" />
            </div>

            {/* SECTION 3: XỬ LÝ & KẾT QUẢ */}
            <div className="md:col-span-6 text-sm font-bold text-blue-600 uppercase tracking-wide border-b border-blue-100 pb-2 mb-2 mt-2">3. Xử lý & Kết quả</div>

            <div className="md:col-span-6">
              <label htmlFor="nguyenNhan" className="block text-sm font-semibold text-slate-700">
                Nguyên nhân {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
              </label>
              <textarea name="nguyenNhan" rows={2} value={formData.nguyenNhan} onChange={handleChange} className={getInputClasses('nguyenNhan')} placeholder="Cần nhập để hoàn thành báo cáo" disabled={isFieldDisabled('nguyenNhan')}></textarea>
              <ErrorMessage field="nguyenNhan" />
            </div>
            <div className="md:col-span-6">
              <label htmlFor="huongKhacPhuc" className="block text-sm font-semibold text-slate-700">
                Hướng khắc phục {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
              </label>
              <textarea name="huongKhacPhuc" rows={2} value={formData.huongKhacPhuc} onChange={handleChange} className={getInputClasses('huongKhacPhuc')} placeholder="Cần nhập để hoàn thành báo cáo" disabled={isFieldDisabled('huongKhacPhuc')}></textarea>
              <ErrorMessage field="huongKhacPhuc" />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="trangThai" className="block text-sm font-semibold text-slate-700">Trạng thái</label>
              <select name="trangThai" value={formData.trangThai} onChange={handleChange} className={getInputClasses('trangThai')} disabled={isFieldDisabled('trangThai')}>
                <option value="Mới">Mới</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra nguyên nhân</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
            
            <div className="md:col-span-3">
                <label htmlFor="ngayHoanThanh" className="block text-sm font-semibold text-slate-700">
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
        </form>
        <div className="flex justify-end items-center px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 gap-3 flex-shrink-0 pb-6 sm:pb-4">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            form="report-form" 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md active:scale-95 flex items-center"
          >
             <CheckCircleIcon className="w-5 h-5 mr-2" />
            {initialData ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefectReportForm;
