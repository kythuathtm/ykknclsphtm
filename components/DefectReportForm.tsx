import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DefectReport, UserRole, PermissionField, Product } from '../types';
import { XIcon, CheckCircleIcon, TagIcon, WrenchIcon, LockClosedIcon, ShieldCheckIcon, ClipboardDocumentListIcon, CalendarIcon, BuildingStoreIcon, PlusIcon, TrashIcon } from './Icons';

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
    images: []
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<DefectReport, 'id'>, string>>>({});
  const [isProductInfoLocked, setIsProductInfoLocked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState(''); // State for new image input

  const productCodeInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleCloseAttempt = () => {
      if (isDirty) {
          if (window.confirm("Bạn có thông tin chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi?")) {
              onClose();
          }
      } else {
          onClose();
      }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              handleCloseAttempt();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              // Prevent submit if focus is on image input
              if (document.activeElement?.getAttribute('name') === 'imageUrlInput') return;
              
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeEvent);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isDirty]); 

  useEffect(() => {
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

  const availableLines = useMemo(() => {
      let filtered = products;
      if (formData.nhanHang && formData.nhanHang !== 'Khác') {
          filtered = products.filter(p => p.nhanHang === formData.nhanHang);
      }
      return Array.from(new Set(filtered.map(p => p.dongSanPham).filter(Boolean))).sort();
  }, [products, formData.nhanHang]);

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

    if (!formData.ngayPhanAnh) newErrors.ngayPhanAnh = "Vui lòng chọn ngày phản ánh";
    if (!formData.maSanPham?.trim()) newErrors.maSanPham = "Mã sản phẩm là bắt buộc";
    if (!formData.tenThuongMai?.trim()) newErrors.tenThuongMai = "Tên thương mại là bắt buộc";
    if (!formData.dongSanPham?.trim()) newErrors.dongSanPham = "Dòng sản phẩm là bắt buộc";
    if (!formData.nhanHang) newErrors.nhanHang = "Vui lòng chọn nhãn hàng";
    if (!formData.soLo?.trim()) newErrors.soLo = "Vui lòng nhập số lô";
    if (!formData.nhaPhanPhoi?.trim()) newErrors.nhaPhanPhoi = "Vui lòng nhập nhà phân phối";
    if (!formData.noiDungPhanAnh?.trim()) newErrors.noiDungPhanAnh = "Nội dung phản ánh không được để trống";
    if (!formData.loaiLoi) newErrors.loaiLoi = "Vui lòng chọn nguồn gốc lỗi";
    
    if (formData.trangThai === 'Hoàn thành') {
        if (!formData.ngayHoanThanh) newErrors.ngayHoanThanh = "Cần có ngày hoàn thành";
        if (!formData.nguyenNhan?.trim()) newErrors.nguyenNhan = "Phải nhập nguyên nhân khi hoàn thành";
        if (!formData.huongKhacPhuc?.trim()) newErrors.huongKhacPhuc = "Phải nhập hướng khắc phục khi hoàn thành";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const valStr = typeof value === 'string' ? value.trim() : value;
    
    let error = '';
    const requiredFields = ['maSanPham', 'tenThuongMai', 'dongSanPham', 'nhanHang', 'soLo', 'ngayPhanAnh', 'nhaPhanPhoi', 'noiDungPhanAnh', 'loaiLoi'];
    
    if (requiredFields.includes(name) && !valStr) {
         error = 'Trường này không được để trống';
    }
    
    if (formData.trangThai === 'Hoàn thành') {
         if (name === 'nguyenNhan' && !valStr) error = 'Bắt buộc khi hoàn thành';
         if (name === 'huongKhacPhuc' && !valStr) error = 'Bắt buộc khi hoàn thành';
         if (name === 'ngayHoanThanh' && !valStr) error = 'Bắt buộc khi hoàn thành';
    }

    setErrors(prev => {
        if (error) return { ...prev, [name]: error };
        const { [name as keyof typeof prev]: _, ...rest } = prev;
        return rest;
    });
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
          ...initialData,
          images: initialData.images || []
      });
      const product = products.find(p => p.maSanPham.toLowerCase() === initialData.maSanPham.toLowerCase());
      setIsProductInfoLocked(!!product && !initialData.id.startsWith('new_'));
    } else {
      setFormData(prev => ({ ...prev, ngayPhanAnh: getTodayDateString(), images: [] }));
      setIsProductInfoLocked(false);
    }
    setIsDirty(false); 
  }, [initialData, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setIsDirty(true); 

    setFormData(prev => {
        const newState = { ...prev };
        
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
        else if (name === 'dongSanPham') {
            newState.dongSanPham = value;
            newState.tenThietBi = '';
            newState.tenThuongMai = '';
            newState.maSanPham = '';
            setIsProductInfoLocked(false);
        }
        else if (name === 'tenThietBi') {
            newState.tenThietBi = value;
            newState.tenThuongMai = '';
            newState.maSanPham = '';
            setIsProductInfoLocked(false);
        }
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

  const handleAddImage = () => {
      if (newImageUrl.trim()) {
          setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), newImageUrl.trim()]
          }));
          setNewImageUrl('');
          setIsDirty(true);
      }
  };

  const handleRemoveImage = (index: number) => {
      setFormData(prev => ({
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== index)
      }));
      setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors = validate();
    if (Object.keys(currentErrors).length === 0) {
        if (formData.trangThai === 'Hoàn thành') {
            if (!window.confirm("Bạn đang chuyển trạng thái thành 'Hoàn thành'.\n\nHành động này xác nhận việc xử lý đã kết thúc và hồ sơ sẽ được lưu trữ. Bạn có chắc chắn muốn tiếp tục?")) {
                return;
            }
        }
        onSave({ ...formData, id: initialData?.id || '' });
    } else {
        const firstErrorKey = Object.keys(currentErrors)[0];
        const element = formRef.current?.querySelector(`[name="${firstErrorKey}"]`);
        
        if (element) {
            // Scroll with margin for sticky header
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            if (element instanceof HTMLElement) {
                element.focus();
            }
        }
    }
  };
  
  const getInputClasses = (fieldName: keyof Omit<DefectReport, 'id'>, isReadOnly: boolean = false) => {
    const base = "transition-all duration-200 mt-1 block w-full rounded-xl text-base py-2.5 px-3 border outline-none";
    const normal = "bg-white text-slate-800 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400 shadow-sm hover:border-blue-300";
    const errorClass = errors[fieldName] ? "border-red-500 ring-2 ring-red-500/10 bg-red-50 animate-shake" : "";
    
    const disabled = isFieldDisabled(fieldName) ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed shadow-none" : normal;
    const locked = isReadOnly ? "bg-blue-50/50 text-slate-700 border-blue-200 cursor-not-allowed focus:ring-0 shadow-inner" : "";
    
    if (isFieldDisabled(fieldName)) return `${base} ${disabled}`;
    if (isReadOnly) return `${base} ${locked}`;
    return `${base} ${normal} ${errorClass}`;
  };

  const ErrorMessage = ({ field }: { field: keyof Omit<DefectReport, 'id'> }) => {
      if (!errors[field]) return null;
      return (
        <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 animate-fade-in-up text-xs font-bold shadow-sm">
            <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
            <span>{errors[field]}</span>
        </div>
      );
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
      <div className="flex items-center gap-2 mb-5 pb-2 border-b border-slate-200">
          <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-200 shadow-sm">{icon}</div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-6xl rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up ring-1 ring-white/20">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur z-20">
          <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                  {initialData && !initialData.id.startsWith('new_') ? 'CHỈNH SỬA PHẢN ÁNH' : 'TẠO PHẢN ÁNH MỚI'}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">Vui lòng điền đầy đủ thông tin bắt buộc <span className="text-red-500">*</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded font-medium">ESC để đóng</span>
            <button onClick={handleCloseAttempt} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
                <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center justify-center animate-fade-in shadow-inner">
                <p className="text-sm font-bold text-red-600 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2" />
                    Vui lòng kiểm tra lại {Object.keys(errors).length} mục thông tin còn thiếu.
                </p>
            </div>
        )}

        <form id="report-form" ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-8 custom-scrollbar relative pb-28 sm:pb-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLUMN LEFT: PRODUCT INFO */}
            <div className="space-y-8">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <SectionHeader title="Thông tin Sản phẩm" icon={<TagIcon className="h-4 w-4" />} />
                    <div className="space-y-5">
                         <div>
                            <label className="block text-sm font-bold text-slate-700">Mã sản phẩm <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="maSanPham" 
                                ref={productCodeInputRef}
                                value={formData.maSanPham} 
                                onChange={handleChange} 
                                onBlur={handleBlur}
                                disabled={isFieldDisabled('maSanPham') || isProductInfoLocked}
                                className={getInputClasses('maSanPham', isProductInfoLocked)}
                                placeholder="Nhập mã hoặc chọn bên dưới..."
                                list="productCodes"
                                autoComplete="off"
                            />
                            <datalist id="productCodes">
                                {products.map(p => <option key={p.maSanPham} value={p.maSanPham}>{p.tenThuongMai}</option>)}
                            </datalist>
                            {isProductInfoLocked && !isFieldDisabled('maSanPham') && (
                                <p className="text-xs text-blue-500 mt-1 flex items-center"><LockClosedIcon className="w-3 h-3 mr-1"/>Tự động điền từ danh mục</p>
                            )}
                            <ErrorMessage field="maSanPham" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700">Tên thương mại <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="tenThuongMai" 
                                value={formData.tenThuongMai} 
                                onChange={handleChange}
                                onBlur={handleBlur} 
                                disabled={isFieldDisabled('tenThuongMai') || isProductInfoLocked}
                                className={getInputClasses('tenThuongMai', isProductInfoLocked)}
                                list="tradeNames"
                                autoComplete="off"
                            />
                             <datalist id="tradeNames">
                                {availableTradeNames.map(t => <option key={t} value={t} />)}
                            </datalist>
                            <ErrorMessage field="tenThuongMai" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Nhãn hàng <span className="text-red-500">*</span></label>
                                <select 
                                    name="nhanHang" 
                                    value={formData.nhanHang} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                    disabled={isFieldDisabled('nhanHang')}
                                    className={getInputClasses('nhanHang')}
                                >
                                    <option value="HTM">HTM</option>
                                    <option value="VMA">VMA</option>
                                    <option value="Khác">Khác</option>
                                </select>
                                <ErrorMessage field="nhanHang" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Dòng sản phẩm <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    name="dongSanPham" 
                                    value={formData.dongSanPham} 
                                    onChange={handleChange}
                                    onBlur={handleBlur} 
                                    disabled={isFieldDisabled('dongSanPham') || isProductInfoLocked}
                                    className={getInputClasses('dongSanPham', isProductInfoLocked)}
                                    list="lines"
                                    autoComplete="off"
                                />
                                <datalist id="lines">
                                    {availableLines.map(l => <option key={l} value={l} />)}
                                </datalist>
                                <ErrorMessage field="dongSanPham" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Tên thiết bị Y tế</label>
                            <input 
                                type="text" 
                                name="tenThietBi" 
                                value={formData.tenThietBi} 
                                onChange={handleChange}
                                onBlur={handleBlur} 
                                disabled={isFieldDisabled('tenThietBi') || isProductInfoLocked}
                                className={getInputClasses('tenThietBi', isProductInfoLocked)}
                                list="devices"
                                autoComplete="off"
                            />
                            <datalist id="devices">
                                {availableDeviceNames.map(d => <option key={d} value={d} />)}
                            </datalist>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Số lô <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    name="soLo" 
                                    value={formData.soLo} 
                                    onChange={handleChange}
                                    onBlur={handleBlur} 
                                    disabled={isFieldDisabled('soLo')}
                                    className={getInputClasses('soLo')}
                                />
                                <ErrorMessage field="soLo" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Mã NSX</label>
                                <input 
                                    type="text" 
                                    name="maNgaySanXuat" 
                                    value={formData.maNgaySanXuat} 
                                    onChange={handleChange}
                                    onBlur={handleBlur} 
                                    disabled={isFieldDisabled('maNgaySanXuat')}
                                    className={getInputClasses('maNgaySanXuat')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Nhà phân phối <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="nhaPhanPhoi" 
                                value={formData.nhaPhanPhoi} 
                                onChange={handleChange} 
                                onBlur={handleBlur}
                                disabled={isFieldDisabled('nhaPhanPhoi')}
                                className={getInputClasses('nhaPhanPhoi')}
                                list="distributors"
                            />
                            <datalist id="distributors">
                                {/* Can populate from existing data later */}
                            </datalist>
                            <ErrorMessage field="nhaPhanPhoi" />
                        </div>
                    </div>
                </section>
            </div>

            {/* COLUMN RIGHT: REPORT DETAILS & RESOLUTION */}
            <div className="space-y-8">
                 <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <SectionHeader title="Chi tiết Phản ánh" icon={<ClipboardDocumentListIcon className="h-4 w-4" />} />
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Ngày phản ánh <span className="text-red-500">*</span></label>
                                <input 
                                    type="date" 
                                    name="ngayPhanAnh" 
                                    value={formData.ngayPhanAnh} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                    disabled={isFieldDisabled('ngayPhanAnh')}
                                    className={getInputClasses('ngayPhanAnh')}
                                />
                                <ErrorMessage field="ngayPhanAnh" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Đơn vị sử dụng</label>
                                <input 
                                    type="text" 
                                    name="donViSuDung" 
                                    value={formData.donViSuDung} 
                                    onChange={handleChange}
                                    onBlur={handleBlur} 
                                    disabled={isFieldDisabled('donViSuDung')}
                                    className={getInputClasses('donViSuDung')}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700">Nguồn gốc lỗi <span className="text-red-500">*</span></label>
                            <select 
                                name="loaiLoi" 
                                value={formData.loaiLoi || ''} 
                                onChange={handleChange}
                                onBlur={handleBlur} 
                                disabled={isFieldDisabled('loaiLoi')}
                                className={getInputClasses('loaiLoi')}
                            >
                                <option value="" disabled>-- Chọn nguồn gốc --</option>
                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                <option value="Lỗi Khác">Lỗi Khác</option>
                            </select>
                            <ErrorMessage field="loaiLoi" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Nội dung phản ánh <span className="text-red-500">*</span></label>
                            <textarea 
                                name="noiDungPhanAnh" 
                                value={formData.noiDungPhanAnh} 
                                onChange={handleChange} 
                                onBlur={handleBlur}
                                disabled={isFieldDisabled('noiDungPhanAnh')}
                                className={getInputClasses('noiDungPhanAnh')}
                                rows={4}
                            />
                            <ErrorMessage field="noiDungPhanAnh" />
                        </div>
                        
                        {/* IMAGE PROOF SECTION */}
                        <div className="mt-4">
                             <label className="block text-sm font-bold text-slate-700 mb-2">Hình ảnh minh chứng</label>
                             <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    name="imageUrlInput"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="Dán đường dẫn ảnh (URL) vào đây..."
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddImage}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                             </div>
                             
                             {formData.images && formData.images.length > 0 && (
                                 <div className="grid grid-cols-4 gap-2 mt-2">
                                     {formData.images.map((img, idx) => (
                                         <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                                             <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                             <button 
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                             >
                                                 <XIcon className="w-3 h-3" />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>

                        {/* QUANTITY SUB-SECTION */}
                        <div className="pt-4 border-t border-slate-100">
                             <div className="flex items-center gap-2 mb-3">
                                 <BuildingStoreIcon className="w-4 h-4 text-slate-400" />
                                 <span className="text-xs font-bold text-slate-500 uppercase">Thông tin Số lượng</span>
                             </div>
                             <div className="grid grid-cols-3 gap-4">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đã nhập</label>
                                    <input 
                                        type="number" 
                                        name="soLuongDaNhap" 
                                        value={formData.soLuongDaNhap} 
                                        onChange={handleChange} 
                                        disabled={isFieldDisabled('soLuongDaNhap')}
                                        className={getInputClasses('soLuongDaNhap')}
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-red-500 uppercase mb-1">Lỗi</label>
                                    <input 
                                        type="number" 
                                        name="soLuongLoi" 
                                        value={formData.soLuongLoi} 
                                        onChange={handleChange} 
                                        disabled={isFieldDisabled('soLuongLoi')}
                                        className={getInputClasses('soLuongLoi')}
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-emerald-500 uppercase mb-1">Đổi</label>
                                    <input 
                                        type="number" 
                                        name="soLuongDoi" 
                                        value={formData.soLuongDoi} 
                                        onChange={handleChange} 
                                        disabled={isFieldDisabled('soLuongDoi')}
                                        className={getInputClasses('soLuongDoi')}
                                    />
                                 </div>
                             </div>
                             <div className="mt-3">
                                 <label className="block text-sm font-bold text-slate-700">Ngày đổi hàng</label>
                                 <input 
                                    type="date" 
                                    name="ngayDoiHang" 
                                    value={formData.ngayDoiHang || ''} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                    disabled={isFieldDisabled('ngayDoiHang')}
                                    className={getInputClasses('ngayDoiHang')}
                                />
                             </div>
                        </div>
                    </div>
                 </section>

                 <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="relative pl-2">
                        <SectionHeader title="Xử lý & Khắc phục" icon={<WrenchIcon className="h-4 w-4" />} />
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Nguyên nhân</label>
                                <textarea 
                                    name="nguyenNhan" 
                                    value={formData.nguyenNhan} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                    disabled={isFieldDisabled('nguyenNhan')}
                                    className={getInputClasses('nguyenNhan')}
                                    rows={3}
                                />
                                <ErrorMessage field="nguyenNhan" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700">Hướng khắc phục</label>
                                <textarea 
                                    name="huongKhacPhuc" 
                                    value={formData.huongKhacPhuc} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                    disabled={isFieldDisabled('huongKhacPhuc')}
                                    className={getInputClasses('huongKhacPhuc')}
                                    rows={3}
                                />
                                <ErrorMessage field="huongKhacPhuc" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">Trạng thái <span className="text-red-500">*</span></label>
                                    <select 
                                        name="trangThai" 
                                        value={formData.trangThai} 
                                        onChange={handleChange} 
                                        onBlur={handleBlur}
                                        disabled={isFieldDisabled('trangThai')}
                                        className={getInputClasses('trangThai')}
                                    >
                                        <option value="Mới">Mới</option>
                                        <option value="Đang xử lý">Đang xử lý</option>
                                        <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra nguyên nhân</option>
                                        <option value="Hoàn thành">Hoàn thành</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">Ngày hoàn thành</label>
                                    <input 
                                        type="date" 
                                        name="ngayHoanThanh" 
                                        value={formData.ngayHoanThanh || ''} 
                                        onChange={handleChange} 
                                        onBlur={handleBlur}
                                        disabled={isFieldDisabled('ngayHoanThanh')}
                                        className={getInputClasses('ngayHoanThanh')}
                                    />
                                    <ErrorMessage field="ngayHoanThanh" />
                                </div>
                            </div>
                        </div>
                    </div>
                 </section>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-white/95 backdrop-blur border-t border-slate-200 z-30 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button 
                type="button" 
                onClick={handleCloseAttempt} 
                className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
             >
                Hủy bỏ
             </button>
             <button 
                type="submit" 
                className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center"
             >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Lưu phản ánh
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DefectReportForm;