import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DefectReport, UserRole, PermissionField, Product } from '../types';
import { XIcon, CheckCircleIcon, TagIcon, UserIcon, WrenchIcon, CheckCircleIcon as StatusIcon } from './Icons';

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
    maSanPham: '', dongSanPham: '', tenThuongMai: '', tenThietBi: '', nhaPhanPhoi: '',
    donViSuDung: '', noiDungPhanAnh: '', soLo: '', maNgaySanXuat: '',
    soLuongLoi: 0, soLuongDaNhap: 0, soLuongDoi: 0, ngayDoiHang: '',
    nguyenNhan: '', huongKhacPhuc: '', trangThai: 'Mới',
    ngayHoanThanh: '', loaiLoi: '' as any, nhanHang: 'HTM', 
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<DefectReport, 'id'>, string>>>({});
  const [isProductInfoLocked, setIsProductInfoLocked] = useState(false);
  const productCodeInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts Handler
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Esc to Close
          if (e.key === 'Escape') {
              onClose();
          }
          // Ctrl + Enter to Save
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              // Trigger submit logic programmatically
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeEvent);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]); // Dependency on formData to ensure latest state is submitted

  // --- AUTO COMPLETE LOGIC ---
  useEffect(() => {
    // Logic: Có đầy đủ nguyên nhân + hướng khắc phục + số lượng đổi -> trạng thái chuyển thành Hoàn thành
    if (
        formData.nguyenNhan && formData.nguyenNhan.trim() !== '' &&
        formData.huongKhacPhuc && formData.huongKhacPhuc.trim() !== '' &&
        formData.soLuongDoi > 0 &&
        formData.trangThai !== 'Hoàn thành'
    ) {
        setFormData(prev => ({
            ...prev,
            trangThai: 'Hoàn thành',
            ngayHoanThanh: prev.ngayHoanThanh || getTodayDateString()
        }));
    }
  }, [formData.nguyenNhan, formData.huongKhacPhuc, formData.soLuongDoi]);

  // --- CASCADING SELECT LOGIC ---

  // 1. Lines based on Brand
  const availableLines = useMemo(() => {
      let filtered = products;
      if (formData.nhanHang && formData.nhanHang !== 'Khác') {
          filtered = products.filter(p => p.nhanHang === formData.nhanHang);
      }
      return Array.from(new Set(filtered.map(p => p.dongSanPham).filter(Boolean))).sort();
  }, [products, formData.nhanHang]);

  // 2. Devices based on Brand & Line
  const availableDeviceNames = useMemo(() => {
      let filtered = products;
      if (formData.nhanHang && formData.nhanHang !== 'Khác') {
          filtered = filtered.filter(p => p.nhanHang === formData.nhanHang);
      }
      if (formData.dongSanPham) {
          filtered = filtered.filter(p => p.dongSanPham === formData.dongSanPham);
      }
      return Array.from(new Set(filtered.map(p => p.tenThietBi).filter(Boolean))).sort();
  }, [products, formData.nhanHang, formData.dongSanPham]);

  // 3. Trade Names based on Brand, Line & Device
  const availableTradeNames = useMemo(() => {
      let filtered = products;
      if (formData.nhanHang && formData.nhanHang !== 'Khác') {
          filtered = filtered.filter(p => p.nhanHang === formData.nhanHang);
      }
      if (formData.dongSanPham) {
          filtered = filtered.filter(p => p.dongSanPham === formData.dongSanPham);
      }
      if (formData.tenThietBi) {
          filtered = filtered.filter(p => p.tenThietBi === formData.tenThietBi);
      }
      return Array.from(new Set(filtered.map(p => p.tenThuongMai).filter(Boolean))).sort();
  }, [products, formData.nhanHang, formData.dongSanPham, formData.tenThietBi]);

  const isFieldDisabled = (fieldName: keyof Omit<DefectReport, 'id'>) => {
    if (!initialData) return false; 
    
    // Allow unlocking product info if it's a new report (including duplicates)
    if (initialData.id?.startsWith('new_')) return false;

    if (isProductInfoLocked && ['dongSanPham', 'tenThuongMai', 'nhanHang', 'tenThietBi'].includes(fieldName)) return true;

    let permissionKey: PermissionField;
    if (['nguyenNhan'].includes(fieldName)) permissionKey = 'nguyenNhan';
    else if (['huongKhacPhuc'].includes(fieldName)) permissionKey = 'huongKhacPhuc';
    else if (['trangThai'].includes(fieldName)) permissionKey = 'trangThai';
    else if (['ngayHoanThanh'].includes(fieldName)) permissionKey = 'ngayHoanThanh';
    else if (['loaiLoi'].includes(fieldName)) permissionKey = 'loaiLoi';
    else if (['soLuongDoi', 'ngayDoiHang'].includes(fieldName)) permissionKey = 'soLuongDoi';
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
    
    // New Mandatory Fields
    if (!formData.tenThuongMai) newErrors.tenThuongMai = "Tên thương mại là bắt buộc.";
    if (!formData.dongSanPham) newErrors.dongSanPham = "Dòng sản phẩm là bắt buộc.";
    if (!formData.nhanHang) newErrors.nhanHang = "Nhãn hàng là bắt buộc.";
    
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
    }
  }, [initialData, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
        const newState = { ...prev };
        
        // 1. BRAND CHANGE -> Clear below
        if (name === 'nhanHang') {
            newState.nhanHang = value as any;
            if (value !== 'Khác') {
                newState.dongSanPham = '';
                newState.tenThietBi = '';
                newState.tenThuongMai = '';
                newState.maSanPham = '';
                setIsProductInfoLocked(false);
            }
        }
        // 2. LINE CHANGE -> Clear below
        else if (name === 'dongSanPham') {
            newState.dongSanPham = value;
            newState.tenThietBi = '';
            newState.tenThuongMai = '';
            newState.maSanPham = '';
            setIsProductInfoLocked(false);
        }
        // 3. DEVICE NAME CHANGE -> Clear below
        else if (name === 'tenThietBi') {
            newState.tenThietBi = value;
            newState.tenThuongMai = '';
            newState.maSanPham = '';
            setIsProductInfoLocked(false);
        }
        // 4. TRADE NAME CHANGE -> Find Code
        else if (name === 'tenThuongMai') {
            newState.tenThuongMai = value;
            
            const matches = products.filter(p => 
                (newState.nhanHang === 'Khác' || !p.nhanHang || p.nhanHang === newState.nhanHang) &&
                (!newState.dongSanPham || p.dongSanPham === newState.dongSanPham) &&
                (!newState.tenThietBi || p.tenThietBi === newState.tenThietBi) &&
                p.tenThuongMai.toLowerCase() === value.toLowerCase()
            );

            if (matches.length === 1) {
                newState.maSanPham = matches[0].maSanPham;
                newState.dongSanPham = matches[0].dongSanPham;
                newState.tenThietBi = matches[0].tenThietBi || '';
                if (matches[0].nhanHang) newState.nhanHang = matches[0].nhanHang as any;
                setIsProductInfoLocked(true);
            } else if (matches.length === 0 && isProductInfoLocked) {
                 newState.maSanPham = '';
                 setIsProductInfoLocked(false);
            }
        }
        // 5. CODE CHANGE (Manual) -> Reverse Fill
        else if (name === 'maSanPham') {
            newState.maSanPham = value;
            const product = products.find(p => p.maSanPham.toLowerCase() === value.toLowerCase());
            if (product) {
                newState.dongSanPham = product.dongSanPham;
                newState.tenThuongMai = product.tenThuongMai;
                newState.tenThietBi = product.tenThietBi || '';
                if (product.nhanHang) newState.nhanHang = product.nhanHang as any;
                setIsProductInfoLocked(true);
            } else {
                if (isProductInfoLocked) setIsProductInfoLocked(false);
            }
        } 
        else if (name === 'trangThai') {
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
    // Increased standard styling for all inputs: pure white background and shadow-sm for depth
    const base = "transition-all duration-200 mt-1 block w-full rounded-xl text-base py-2.5 px-3 border outline-none";
    const normal = "bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400 shadow-sm";
    const errorClass = errors[fieldName] ? "border-red-500 ring-2 ring-red-500/10 bg-red-50" : "";
    // Darker gray for disabled to contrast with the bright white active fields
    const disabled = isFieldDisabled(fieldName) ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed shadow-none" : normal;
    const readonly = isReadOnly ? "bg-slate-100 text-slate-600 border-slate-200 cursor-default focus:ring-0 shadow-none" : "";
    
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
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
          <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase">
                  {initialData && !initialData.id.startsWith('new_') ? 'CHỈNH SỬA PHẢN ÁNH' : 'TẠO PHẢN ÁNH MỚI'}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">Vui lòng điền đầy đủ thông tin bắt buộc <span className="text-red-500">*</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">ESC để đóng</span>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
                <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form id="report-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-slate-50/50" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            
            <div className="md:col-span-7 space-y-8">
                 <section>
                    <SectionHeader title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4" />} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         
                        <div className="sm:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Nhãn hàng <span className="text-red-500">*</span></label>
                            <select name="nhanHang" value={formData.nhanHang} onChange={handleChange} className={getInputClasses('nhanHang')} disabled={isFieldDisabled('nhanHang')}>
                                <option value="HTM">HTM</option>
                                <option value="VMA">VMA</option>
                                <option value="Khác">Khác</option>
                            </select>
                             <ErrorMessage field="nhanHang" />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Dòng sản phẩm <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="dongSanPham" 
                                list="product-lines"
                                value={formData.dongSanPham} 
                                onChange={handleChange} 
                                placeholder="Chọn dòng sản phẩm..."
                                className={getInputClasses('dongSanPham')} 
                                disabled={isFieldDisabled('dongSanPham')}
                            />
                            <datalist id="product-lines">
                                {availableLines.map((line, idx) => <option key={idx} value={line} />)}
                            </datalist>
                             <ErrorMessage field="dongSanPham" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Tên thiết bị y tế</label>
                            <input 
                                type="text" 
                                name="tenThietBi" 
                                list="device-names"
                                value={formData.tenThietBi || ''} 
                                onChange={handleChange} 
                                className={getInputClasses('tenThietBi', isFieldDisabled('tenThietBi'))}
                                placeholder="Chọn hoặc nhập tên thiết bị..."
                            />
                            <datalist id="device-names">
                                {availableDeviceNames.map((name, idx) => <option key={idx} value={name} />)}
                            </datalist>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Tên thương mại <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                list="trade-names"
                                name="tenThuongMai" 
                                value={formData.tenThuongMai} 
                                onChange={handleChange} 
                                className={getInputClasses('tenThuongMai', isFieldDisabled('tenThuongMai'))}
                                placeholder="Chọn tên sản phẩm..."
                            />
                            <datalist id="trade-names">
                                {availableTradeNames.map((name, idx) => <option key={idx} value={name} />)}
                            </datalist>
                            <ErrorMessage field="tenThuongMai" />
                        </div>

                         <div className="sm:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Mã sản phẩm <span className="text-red-500">*</span></label>
                            <input 
                                ref={productCodeInputRef} 
                                type="text" 
                                name="maSanPham" 
                                value={formData.maSanPham} 
                                onChange={handleChange} 
                                required 
                                placeholder="Tự động điền hoặc nhập tay" 
                                className={getInputClasses('maSanPham', isProductInfoLocked)} 
                                readOnly={isProductInfoLocked || isFieldDisabled('maSanPham')}
                            />
                            <ErrorMessage field="maSanPham" />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Số lô <span className="text-red-500">*</span></label>
                            <input type="text" name="soLo" value={formData.soLo} onChange={handleChange} required className={getInputClasses('soLo')} disabled={isFieldDisabled('soLo')}/>
                            <ErrorMessage field="soLo" />
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Mã NSX</label>
                            <input type="text" name="maNgaySanXuat" value={formData.maNgaySanXuat} onChange={handleChange} className={getInputClasses('maNgaySanXuat')} disabled={isFieldDisabled('maNgaySanXuat')}/>
                        </div>

                        <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                             <div>
                                <label className="block text-sm font-bold text-slate-500 ml-1 mb-1">Đã nhập</label>
                                <input type="number" name="soLuongDaNhap" value={formData.soLuongDaNhap} onChange={handleChange} min="0" className={getInputClasses('soLuongDaNhap')} disabled={isFieldDisabled('soLuongDaNhap')}/>
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-red-500 ml-1 mb-1">Lỗi</label>
                                <input type="number" name="soLuongLoi" value={formData.soLuongLoi} onChange={handleChange} min="0" className={getInputClasses('soLuongLoi')} disabled={isFieldDisabled('soLuongLoi')}/>
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-green-600 ml-1 mb-1">Đổi</label>
                                <input type="number" name="soLuongDoi" value={formData.soLuongDoi} onChange={handleChange} min="0" className={getInputClasses('soLuongDoi')} disabled={isFieldDisabled('soLuongDoi')}/>
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-green-600 ml-1 mb-1">Ngày đổi</label>
                                <input type="date" name="ngayDoiHang" value={formData.ngayDoiHang || ''} onChange={handleChange} className={getInputClasses('ngayDoiHang')} disabled={isFieldDisabled('ngayDoiHang')}/>
                             </div>
                        </div>
                    </div>
                 </section>

                 <section>
                    <SectionHeader title="Thông tin Khách hàng & Phản ánh" icon={<UserIcon className="h-4 w-4" />} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-1">
                             <label className="block text-sm font-bold text-slate-700 ml-1">Ngày phản ánh <span className="text-red-500">*</span></label>
                             <input type="date" name="ngayPhanAnh" value={formData.ngayPhanAnh} onChange={handleChange} required className={getInputClasses('ngayPhanAnh')} disabled={isFieldDisabled('ngayPhanAnh')}/>
                             <ErrorMessage field="ngayPhanAnh" />
                        </div>
                        <div className="sm:col-span-1">
                             <label className="block text-sm font-bold text-slate-700 ml-1">Nhà phân phối <span className="text-red-500">*</span></label>
                             <input type="text" name="nhaPhanPhoi" value={formData.nhaPhanPhoi} onChange={handleChange} required className={getInputClasses('nhaPhanPhoi')} disabled={isFieldDisabled('nhaPhanPhoi')}/>
                             <ErrorMessage field="nhaPhanPhoi" />
                        </div>
                         <div className="sm:col-span-2">
                             <label className="block text-sm font-bold text-slate-700 ml-1">Đơn vị sử dụng</label>
                             <input type="text" name="donViSuDung" value={formData.donViSuDung} onChange={handleChange} className={getInputClasses('donViSuDung')} disabled={isFieldDisabled('donViSuDung')}/>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Nội dung phản ánh <span className="text-red-500">*</span></label>
                            <textarea name="noiDungPhanAnh" rows={3} value={formData.noiDungPhanAnh} onChange={handleChange} required className={getInputClasses('noiDungPhanAnh')} disabled={isFieldDisabled('noiDungPhanAnh')}></textarea>
                            <ErrorMessage field="noiDungPhanAnh" />
                        </div>
                    </div>
                 </section>
            </div>

            <div className="md:col-span-5 space-y-8">
                 <section className="bg-slate-100 p-5 rounded-xl border border-slate-200">
                    <SectionHeader title="Phân tích & Xử lý" icon={<WrenchIcon className="h-4 w-4" />} />
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">Phân loại lỗi <span className="text-red-500">*</span></label>
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
                            <label className="block text-sm font-bold text-slate-700 ml-1 flex justify-between">
                                Nguyên nhân {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea name="nguyenNhan" rows={4} value={formData.nguyenNhan} onChange={handleChange} className={getInputClasses('nguyenNhan')} placeholder="Mô tả nguyên nhân..." disabled={isFieldDisabled('nguyenNhan')}></textarea>
                            <ErrorMessage field="nguyenNhan" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1 flex justify-between">
                                Hướng khắc phục {formData.trangThai === 'Hoàn thành' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea name="huongKhacPhuc" rows={4} value={formData.huongKhacPhuc} onChange={handleChange} className={getInputClasses('huongKhacPhuc')} placeholder="Đề xuất xử lý..." disabled={isFieldDisabled('huongKhacPhuc')}></textarea>
                            <ErrorMessage field="huongKhacPhuc" />
                        </div>
                    </div>
                 </section>

                 <section className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <SectionHeader title="Trạng thái hồ sơ" icon={<StatusIcon className="h-4 w-4" />} />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">Trạng thái xử lý</label>
                            <select name="trangThai" value={formData.trangThai} onChange={handleChange} className={getInputClasses('trangThai')} disabled={isFieldDisabled('trangThai')}>
                                <option value="Mới">✨ Mới</option>
                                <option value="Đang xử lý">⏳ Đang xử lý</option>
                                <option value="Chưa tìm ra nguyên nhân">❓ Chưa rõ nguyên nhân</option>
                                <option value="Hoàn thành">✅ Hoàn thành</option>
                            </select>
                            {formData.nguyenNhan && formData.huongKhacPhuc && formData.soLuongDoi > 0 && formData.trangThai === 'Hoàn thành' && (
                                <p className="text-xs text-emerald-600 mt-1 font-bold">✓ Tự động hoàn thành do đủ điều kiện</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">
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
        
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-slate-200 gap-3">
          <div className="text-xs text-slate-400 italic hidden sm:block">
              Phím tắt: <span className="font-bold border px-1 rounded">Ctrl + Enter</span> để Lưu, <span className="font-bold border px-1 rounded">Esc</span> để Thoát
          </div>
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
                {initialData && !initialData.id.startsWith('new_') ? 'CẬP NHẬT' : 'TẠO PHẢN ÁNH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectReportForm;