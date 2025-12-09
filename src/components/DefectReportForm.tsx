
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DefectReport, UserRole, PermissionField, Product } from '../types';
import { XIcon, CheckCircleIcon, TagIcon, WrenchIcon, LockClosedIcon, ShieldCheckIcon, ClipboardDocumentListIcon, CalendarIcon, BuildingStoreIcon, PlusIcon, TrashIcon, ArrowUpTrayIcon } from './Icons';

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

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                const maxWidth = 1024; // Max width for reasonable quality but low size
                const maxHeight = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG at 0.7 quality
                resolve(elem.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const DefectReportForm: React.FC<Props> = ({ initialData, onSave, onClose, currentUserRole, editableFields, products }) => {
  const [formData, setFormData] = useState<Omit<DefectReport, 'id'>>({
    ngayTao: new Date().toISOString(),
    ngayPhanAnh: getTodayDateString(),
    maSanPham: '', dongSanPham: '', tenThuongMai: '', tenThietBi: '', nhaPhanPhoi: '',
    donViSuDung: '', noiDungPhanAnh: '', soLo: '', maNgaySanXuat: '', hanDung: '', donViTinh: '',
    soLuongLoi: 0, soLuongDaNhap: 0, soLuongDoi: 0, ngayDoiHang: '',
    nguyenNhan: '', huongKhacPhuc: '', trangThai: 'Mới',
    ngayHoanThanh: '', 
    loaiLoi: '' as any, 
    nhanHang: 'HTM', 
    images: []
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<DefectReport, 'id'>, string>>>({});
  const [isProductInfoLocked, setIsProductInfoLocked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState(''); 
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              if (document.activeElement?.getAttribute('name') === 'imageUrlInput') return;
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeEvent);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isDirty]); 

  // Auto-set Status to 'Hoàn thành' if sufficient info provided
  useEffect(() => {
    if (
        formData.trangThai !== 'Hoàn thành' &&
        formData.nguyenNhan && formData.nguyenNhan.trim().length > 5 &&
        formData.huongKhacPhuc && formData.huongKhacPhuc.trim().length > 5 &&
        (formData.soLuongDoi > 0 || (formData.soLuongLoi > 0 && formData.huongKhacPhuc.toLowerCase().includes('không đổi')))
    ) {
        setFormData(prev => ({
            ...prev,
            trangThai: 'Hoàn thành',
            ngayHoanThanh: prev.ngayHoanThanh || getTodayDateString()
        }));
    }
  }, [formData.nguyenNhan, formData.huongKhacPhuc, formData.soLuongDoi, formData.soLuongLoi]);

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
    
    if (initialData.id?.startsWith('new_')) return false;

    if (isProductInfoLocked && ['dongSanPham', 'tenThuongMai', 'nhanHang', 'tenThietBi', 'donViTinh'].includes(fieldName)) return true;

    let permissionKey: PermissionField;
    if (['nguyenNhan'].includes(fieldName)) permissionKey = 'nguyenNhan';
    else if (['huongKhacPhuc'].includes(fieldName)) permissionKey = 'huongKhacPhuc';
    else if (['trangThai'].includes(fieldName)) permissionKey = 'trangThai';
    else if (['ngayHoanThanh'].includes(fieldName)) permissionKey = 'ngayHoanThanh';
    else if (['loaiLoi'].includes(fieldName)) permissionKey = 'loaiLoi';
    else if (['soLuongDoi'].includes(fieldName)) permissionKey = 'soLuongDoi';
    else if (['ngayDoiHang'].includes(fieldName)) permissionKey = 'ngayDoiHang';
    else permissionKey = 'general';

    return !editableFields.includes(permissionKey);
  };
  
  const validate = () => {
    const newErrors: Partial<Record<keyof Omit<DefectReport, 'id'>, string>> = {};

    if (!formData.ngayPhanAnh) newErrors.ngayPhanAnh = "Vui lòng chọn ngày khiếu nại";
    if (!formData.maSanPham?.trim()) newErrors.maSanPham = "Mã sản phẩm là bắt buộc";
    if (!formData.tenThuongMai?.trim()) newErrors.tenThuongMai = "Tên thương mại là bắt buộc";
    if (!formData.dongSanPham?.trim()) newErrors.dongSanPham = "Dòng sản phẩm là bắt buộc";
    if (!formData.nhanHang) newErrors.nhanHang = "Vui lòng chọn nhãn hàng";
    if (!formData.soLo?.trim()) newErrors.soLo = "Vui lòng nhập số lô";
    if (!formData.nhaPhanPhoi?.trim()) newErrors.nhaPhanPhoi = "Vui lòng nhập nhà phân phối";
    if (!formData.noiDungPhanAnh?.trim()) newErrors.noiDungPhanAnh = "Nội dung khiếu nại không được để trống";
    if (!formData.loaiLoi) newErrors.loaiLoi = "Vui lòng chọn nguồn gốc lỗi";
    
    if (formData.trangThai === 'Hoàn thành') {
        if (!formData.ngayHoanThanh) newErrors.ngayHoanThanh = "Cần có ngày hoàn thành khi trạng thái là Hoàn thành";
        if (!formData.nguyenNhan || formData.nguyenNhan.trim().length < 5) newErrors.nguyenNhan = "Phải nhập nguyên nhân chi tiết để hoàn thành";
        if (!formData.huongKhacPhuc || formData.huongKhacPhuc.trim().length < 5) newErrors.huongKhacPhuc = "Phải nhập hướng khắc phục chi tiết để hoàn thành";
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
         if (name === 'nguyenNhan' && (!valStr || valStr.length < 5)) error = 'Bắt buộc khi hoàn thành (tối thiểu 5 ký tự)';
         if (name === 'huongKhacPhuc' && (!valStr || valStr.length < 5)) error = 'Bắt buộc khi hoàn thành (tối thiểu 5 ký tự)';
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
          images: initialData.images || [],
          soLuongLoi: initialData.soLuongLoi || 0,
          soLuongDaNhap: initialData.soLuongDaNhap || 0,
          soLuongDoi: initialData.soLuongDoi || 0,
      });
      const product = products.find(p => p.maSanPham.toLowerCase() === initialData.maSanPham.toLowerCase());
      setIsProductInfoLocked(!!product && !initialData.id.startsWith('new_'));
    } else {
      setFormData(prev => ({ 
          ...prev, 
          ngayPhanAnh: getTodayDateString(), 
          images: [],
          loaiLoi: '' as any 
      }));
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
                newState.donViTinh = '';
                setIsProductInfoLocked(false);
            }
        }
        else if (name === 'dongSanPham') {
            newState.dongSanPham = value;
            newState.tenThietBi = '';
            newState.tenThuongMai = '';
            newState.maSanPham = '';
            newState.donViTinh = '';
            setIsProductInfoLocked(false);
        }
        else if (name === 'tenThietBi') {
            newState.tenThietBi = value;
            newState.tenThuongMai = '';
            newState.maSanPham = '';
            newState.donViTinh = '';
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
                newState.donViTinh = matches[0].donViTinh || '';
                if (matches[0].nhanHang) newState.nhanHang = matches[0].nhanHang as any;
                setIsProductInfoLocked(true);
            } else if (matches.length === 0 && isProductInfoLocked) {
                 newState.maSanPham = '';
                 newState.donViTinh = '';
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
                newState.donViTinh = product.donViTinh || '';
                if (product.nhanHang) newState.nhanHang = product.nhanHang as any;
                setIsProductInfoLocked(true);
            } else {
                if (isProductInfoLocked) {
                    setIsProductInfoLocked(false);
                    newState.donViTinh = '';
                }
            }
        } 
        else if (name === 'trangThai') {
            newState.trangThai = value as any;
            if (value === 'Hoàn thành' && !newState.ngayHoanThanh) newState.ngayHoanThanh = getTodayDateString();
        } else {
            let processedValue: string | number = value;
            if (type === 'number') {
                if (value === '') {
                    processedValue = 0;
                } else {
                    const parsed = parseFloat(value);
                    processedValue = isNaN(parsed) ? 0 : parsed;
                }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const compressedBase64 = await compressImage(file);
          setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), compressedBase64]
          }));
          setIsDirty(true);
      } catch (error) {
          console.error("Error compressing image:", error);
          alert("Không thể xử lý ảnh. Vui lòng thử ảnh khác.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (element instanceof HTMLElement) {
                element.focus();
            }
        }
    }
  };
  
  const getInputClasses = (fieldName: keyof Omit<DefectReport, 'id'>, isReadOnly: boolean = false) => {
    const base = "transition-all duration-200 mt-1 block w-full rounded-xl py-2.5 px-3 border outline-none font-medium";
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
      <div className="flex items-center gap-2 mb-5 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-blue-50 text-[#003DA5] rounded-lg">
              {icon}
          </div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h4>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
       <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-5xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-black/5 shadow-2xl animate-pop">
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
             <div>
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <ClipboardDocumentListIcon className="w-6 h-6 text-[#003DA5]"/>
                     {initialData ? 'Cập nhật Phiếu Khiếu nại' : 'Tạo Phiếu Khiếu nại Mới'}
                 </h2>
                 <p className="text-sm text-slate-500 mt-1">Vui lòng điền đầy đủ thông tin bắt buộc (*)</p>
             </div>
             <button onClick={handleCloseAttempt} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
                 <XIcon className="h-6 w-6" />
             </button>
          </div>

          {/* Form Content */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 custom-scrollbar">
               {/* Product Section */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 group transition-all hover:shadow-md">
                   <SectionHeader title="Thông tin Sản phẩm" icon={<TagIcon className="w-5 h-5"/>} />
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nhãn hàng <span className="text-red-500">*</span></label>
                            <select name="nhanHang" value={formData.nhanHang} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('nhanHang', isProductInfoLocked)} disabled={isFieldDisabled('nhanHang')}>
                                <option value="HTM">HTM</option>
                                <option value="VMA">VMA</option>
                                <option value="Khác">Khác</option>
                            </select>
                            <ErrorMessage field="nhanHang" />
                        </div>

                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dòng sản phẩm <span className="text-red-500">*</span></label>
                             <input list="dongSanPham-list" name="dongSanPham" value={formData.dongSanPham} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('dongSanPham', isProductInfoLocked)} disabled={isFieldDisabled('dongSanPham')} placeholder="Chọn hoặc nhập..." />
                             <datalist id="dongSanPham-list">{availableLines.map(v => <option key={v} value={v} />)}</datalist>
                             <ErrorMessage field="dongSanPham" />
                        </div>

                         <div className="lg:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên thiết bị y tế</label>
                             <input list="tenThietBi-list" name="tenThietBi" value={formData.tenThietBi || ''} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('tenThietBi', isProductInfoLocked)} disabled={isFieldDisabled('tenThietBi')} placeholder="VD: Ống nghiệm..." />
                             <datalist id="tenThietBi-list">{availableDeviceNames.map(v => <option key={v} value={v} />)}</datalist>
                        </div>
                        
                        <div className="lg:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên thương mại <span className="text-red-500">*</span></label>
                             <input list="tenThuongMai-list" name="tenThuongMai" value={formData.tenThuongMai} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('tenThuongMai', isProductInfoLocked)} disabled={isFieldDisabled('tenThuongMai')} placeholder="Nhập tên sản phẩm..." />
                             <datalist id="tenThuongMai-list">{availableTradeNames.map(v => <option key={v} value={v} />)}</datalist>
                             <ErrorMessage field="tenThuongMai" />
                        </div>

                         <div className="lg:col-span-1">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã sản phẩm <span className="text-red-500">*</span></label>
                             <input ref={productCodeInputRef} type="text" name="maSanPham" value={formData.maSanPham} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('maSanPham', isProductInfoLocked)} disabled={isFieldDisabled('maSanPham')} placeholder="Mã..." />
                             <ErrorMessage field="maSanPham" />
                        </div>
                        
                        <div className="lg:col-span-1">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đơn vị tính</label>
                             <input type="text" name="donViTinh" value={formData.donViTinh || ''} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('donViTinh', true)} readOnly />
                        </div>

                        <div className="lg:col-span-1">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số Lô <span className="text-red-500">*</span></label>
                             <input type="text" name="soLo" value={formData.soLo} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('soLo')} disabled={isFieldDisabled('soLo')} placeholder="VD: 010124..." />
                             <ErrorMessage field="soLo" />
                        </div>

                        <div className="lg:col-span-1">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã NSX</label>
                             <input type="text" name="maNgaySanXuat" value={formData.maNgaySanXuat} onChange={handleChange} className={getInputClasses('maNgaySanXuat')} disabled={isFieldDisabled('maNgaySanXuat')} />
                        </div>
                        
                        <div className="lg:col-span-1">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hạn dùng</label>
                             <input type="date" name="hanDung" value={formData.hanDung ? formData.hanDung.split('T')[0] : ''} onChange={handleChange} className={getInputClasses('hanDung')} disabled={isFieldDisabled('hanDung')} />
                        </div>
                   </div>
               </div>

               {/* Distribution Section */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 group transition-all hover:shadow-md">
                   <SectionHeader title="Thông tin Phân phối" icon={<BuildingStoreIcon className="w-5 h-5"/>} />
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nhà phân phối <span className="text-red-500">*</span></label>
                             <input type="text" name="nhaPhanPhoi" value={formData.nhaPhanPhoi} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('nhaPhanPhoi')} disabled={isFieldDisabled('nhaPhanPhoi')} placeholder="Tên NPP..." />
                             <ErrorMessage field="nhaPhanPhoi" />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đơn vị sử dụng</label>
                             <input type="text" name="donViSuDung" value={formData.donViSuDung} onChange={handleChange} className={getInputClasses('donViSuDung')} disabled={isFieldDisabled('donViSuDung')} placeholder="Bệnh viện / Phòng khám..." />
                        </div>
                   </div>
               </div>

               {/* Defect Details Section */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 group transition-all hover:shadow-md">
                   <SectionHeader title="Nội dung Khiếu nại" icon={<ShieldCheckIcon className="w-5 h-5"/>} />
                   <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày phản ánh <span className="text-red-500">*</span></label>
                                <input type="date" name="ngayPhanAnh" value={formData.ngayPhanAnh.split('T')[0]} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('ngayPhanAnh')} disabled={isFieldDisabled('ngayPhanAnh')} />
                                <ErrorMessage field="ngayPhanAnh" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nguồn gốc lỗi <span className="text-red-500">*</span></label>
                                <select name="loaiLoi" value={formData.loaiLoi} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('loaiLoi')} disabled={isFieldDisabled('loaiLoi')}>
                                    <option value="" disabled>-- Chọn loại lỗi --</option>
                                    <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                    <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                    <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                                    <option value="Lỗi Khác">Lỗi Khác</option>
                                </select>
                                <ErrorMessage field="loaiLoi" />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả nội dung <span className="text-red-500">*</span></label>
                             <textarea rows={4} name="noiDungPhanAnh" value={formData.noiDungPhanAnh} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('noiDungPhanAnh')} disabled={isFieldDisabled('noiDungPhanAnh')} placeholder="Mô tả chi tiết tình trạng..." />
                             <ErrorMessage field="noiDungPhanAnh" />
                        </div>

                        {/* Images Upload */}
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hình ảnh minh chứng</label>
                             <div className="flex flex-wrap gap-3">
                                 {formData.images && formData.images.map((img, idx) => (
                                     <div key={idx} className="relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden group/img">
                                         <img src={img} alt="evidence" className="w-full h-full object-cover" />
                                         <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                                             <TrashIcon className="w-3 h-3" />
                                         </button>
                                     </div>
                                 ))}
                                 
                                 <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer relative">
                                     <ArrowUpTrayIcon className="w-6 h-6 text-slate-400 mb-1" />
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">Upload</span>
                                     <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        accept="image/*"
                                     />
                                 </div>
                                 
                                 <div className="flex items-center gap-2 w-full mt-2">
                                     <input 
                                        type="text" 
                                        name="imageUrlInput"
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        placeholder="Hoặc dán URL ảnh..." 
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImage(); }}}
                                     />
                                     <button type="button" onClick={handleAddImage} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-600">Thêm</button>
                                 </div>
                             </div>
                        </div>
                   </div>
               </div>

               {/* Processing / Resolution Section */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 group transition-all hover:shadow-md border-l-4 border-l-emerald-500">
                   <SectionHeader title="Xử lý & Khắc phục" icon={<WrenchIcon className="w-5 h-5"/>} />
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số lượng đã nhập</label>
                             <input type="number" name="soLuongDaNhap" value={formData.soLuongDaNhap} onChange={handleChange} className={getInputClasses('soLuongDaNhap')} min={0} />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số lượng lỗi</label>
                             <input type="number" name="soLuongLoi" value={formData.soLuongLoi} onChange={handleChange} className={getInputClasses('soLuongLoi')} min={0} />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Số lượng đổi</label>
                             <input type="number" name="soLuongDoi" value={formData.soLuongDoi} onChange={handleChange} className={getInputClasses('soLuongDoi')} disabled={isFieldDisabled('soLuongDoi')} min={0} />
                        </div>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nguyên nhân <span className="text-xs text-slate-400 font-normal normal-case">(Bắt buộc nếu hoàn thành)</span></label>
                             <textarea rows={3} name="nguyenNhan" value={formData.nguyenNhan} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('nguyenNhan')} disabled={isFieldDisabled('nguyenNhan')} placeholder="Phân tích nguyên nhân..." />
                             <ErrorMessage field="nguyenNhan" />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Biện pháp khắc phục <span className="text-xs text-slate-400 font-normal normal-case">(Bắt buộc nếu hoàn thành)</span></label>
                             <textarea rows={3} name="huongKhacPhuc" value={formData.huongKhacPhuc} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('huongKhacPhuc')} disabled={isFieldDisabled('huongKhacPhuc')} placeholder="Hướng xử lý..." />
                             <ErrorMessage field="huongKhacPhuc" />
                        </div>
                   </div>
               </div>
               
               {/* Status Section */}
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trạng thái xử lý <span className="text-red-500">*</span></label>
                            <select name="trangThai" value={formData.trangThai} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('trangThai')} disabled={isFieldDisabled('trangThai')}>
                                <option value="Mới">Mới</option>
                                <option value="Đang tiếp nhận">Đang tiếp nhận</option>
                                <option value="Đang xác minh">Đang xác minh</option>
                                <option value="Đang xử lý">Đang xử lý</option>
                                <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra nguyên nhân</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày hoàn thành</label>
                            <input type="date" name="ngayHoanThanh" value={formData.ngayHoanThanh ? formData.ngayHoanThanh.split('T')[0] : ''} onChange={handleChange} onBlur={handleBlur} className={getInputClasses('ngayHoanThanh')} disabled={isFieldDisabled('ngayHoanThanh')} />
                            <ErrorMessage field="ngayHoanThanh" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày đổi hàng</label>
                            <input type="date" name="ngayDoiHang" value={formData.ngayDoiHang ? formData.ngayDoiHang.split('T')[0] : ''} onChange={handleChange} className={getInputClasses('ngayDoiHang')} disabled={isFieldDisabled('ngayDoiHang')} />
                        </div>
                    </div>
               </div>
          </form>
          
          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center z-10">
              <div className="text-xs text-slate-400 italic hidden sm:block">
                  * Các trường bắt buộc phải điền
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button onClick={handleCloseAttempt} type="button" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95 text-sm">
                      Hủy bỏ
                  </button>
                  <button onClick={handleSubmit} type="button" className="px-6 py-2.5 rounded-xl bg-[#003DA5] text-white font-bold hover:bg-[#002a70] shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center text-sm">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Lưu phiếu
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default DefectReportForm;
