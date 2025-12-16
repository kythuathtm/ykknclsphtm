
import React, { useState, useEffect, useRef } from 'react';
import { DefectReport, UserRole, PermissionField, Product, Customer } from '../types';
import { XIcon, CheckCircleIcon, TagIcon, WrenchIcon, ClipboardDocumentListIcon, CalendarIcon, PlusIcon, UserIcon, ExclamationTriangleIcon, MapPinIcon, PhoneIcon, PhotoIcon } from './Icons';

interface Props {
  initialData: DefectReport | null;
  onSave: (report: DefectReport) => void;
  onClose: () => void;
  currentUserRole: UserRole;
  editableFields: PermissionField[];
  products: Product[];
  customers?: Customer[];
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
                const maxWidth = 1024;
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
                resolve(elem.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const DefectReportForm: React.FC<Props> = ({ initialData, onSave, onClose, currentUserRole, editableFields, products, customers = [] }) => {
  const [formData, setFormData] = useState<Omit<DefectReport, 'id'>>({
    ngayTao: new Date().toISOString(),
    ngayPhanAnh: getTodayDateString(),
    maSanPham: '', dongSanPham: '', tenThuongMai: '', tenThietBi: '', nhaPhanPhoi: '',
    donViSuDung: '', nguoiLienHe: '', soDienThoai: '',
    noiDungPhanAnh: '', images: [], soLo: '', hanDung: '', donViTinh: '',
    maNgaySanXuat: '', soLuongLoi: 0, soLuongDaNhap: 0, soLuongDoi: 0,
    ngayDoiHang: '', maVanDon: '', nguyenNhan: '', huongKhacPhuc: '',
    trangThai: 'Mới', mucDoUuTien: 'Trung bình', 
    loaiLoi: 'Lỗi Khác', nhanHang: 'HTM', activityLog: []
  });

  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  // Product Autocomplete
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData({...formData, maSanPham: value});
      
      if (value.length > 0) {
          const filtered = products.filter(p => 
              p.maSanPham.toLowerCase().includes(value.toLowerCase()) || 
              p.tenThuongMai.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 5);
          setSuggestions(filtered);
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
  };

  const selectProduct = (product: Product) => {
      setFormData(prev => ({
          ...prev,
          maSanPham: product.maSanPham,
          tenThuongMai: product.tenThuongMai,
          dongSanPham: product.dongSanPham,
          tenThietBi: product.tenThietBi || '',
          nhanHang: (product.nhanHang as any) || 'HTM',
          donViTinh: product.donViTinh || ''
      }));
      setShowSuggestions(false);
  };

  // Customer Autocomplete (Using 'nhaPhanPhoi' as the field to search customers)
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData({...formData, nhaPhanPhoi: value});

      if (value.length > 0) {
          const filtered = customers.filter(c => 
              c.tenKhachHang.toLowerCase().includes(value.toLowerCase()) || 
              c.maKhachHang.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 5);
          setCustomerSuggestions(filtered);
          setShowCustomerSuggestions(true);
      } else {
          setShowCustomerSuggestions(false);
      }
  };

  const selectCustomer = (customer: Customer) => {
      setFormData(prev => ({
          ...prev,
          nhaPhanPhoi: customer.tenKhachHang,
          donViSuDung: customer.diaChi || prev.donViSuDung, // Optional: auto-fill address to usage unit
          nguoiLienHe: customer.nguoiLienHe || prev.nguoiLienHe,
          soDienThoai: customer.soDienThoai || prev.soDienThoai
      }));
      setShowCustomerSuggestions(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
          try {
              const base64 = await compressImage(files[i]);
              newImages.push(base64);
          } catch (err) {
              console.error(err);
          }
      }
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...newImages] }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
      setFormData(prev => ({
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== index)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: initialData?.id || '', ...formData });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/60 animate-dialog-enter max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${initialData ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                 {initialData ? <WrenchIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
             </div>
             <div>
                 <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Cập nhật Phiếu' : 'Tạo Phiếu Mới'}</h2>
                 <p className="text-xs text-slate-500 font-medium">Điền đầy đủ thông tin bên dưới</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
            <form id="defectForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Basic Info */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-blue-500" /> Thông tin Sản phẩm & Khách hàng
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Product Search */}
                        <div className="relative z-10">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mã Sản phẩm <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={formData.maSanPham}
                                onChange={handleProductChange}
                                onFocus={() => formData.maSanPham && setShowSuggestions(true)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="Nhập mã sản phẩm..."
                                required
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto z-50">
                                    {suggestions.map((p) => (
                                        <li 
                                            key={p.maSanPham}
                                            onClick={() => selectProduct(p)}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        >
                                            <div className="font-bold text-sm text-slate-800">{p.maSanPham}</div>
                                            <div className="text-xs text-slate-500">{p.tenThuongMai}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tên thương mại</label>
                            <input 
                                type="text"
                                value={formData.tenThuongMai}
                                onChange={(e) => setFormData({...formData, tenThuongMai: e.target.value})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Customer Search */}
                        <div className="relative z-0">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nhà Phân Phối / Khách Hàng</label>
                            <input 
                                type="text"
                                value={formData.nhaPhanPhoi}
                                onChange={handleCustomerChange}
                                onFocus={() => formData.nhaPhanPhoi && setShowCustomerSuggestions(true)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                placeholder="Nhập tên khách hàng..."
                            />
                            {showCustomerSuggestions && customerSuggestions.length > 0 && (
                                <ul className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto z-50">
                                    {customerSuggestions.map((c) => (
                                        <li 
                                            key={c.maKhachHang}
                                            onClick={() => selectCustomer(c)}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        >
                                            <div className="font-bold text-sm text-slate-800">{c.tenKhachHang}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {c.tinhThanh}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Đơn vị sử dụng</label>
                            <input 
                                type="text"
                                value={formData.donViSuDung}
                                onChange={(e) => setFormData({...formData, donViSuDung: e.target.value})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Người liên hệ</label>
                                <input 
                                    type="text"
                                    value={formData.nguoiLienHe}
                                    onChange={(e) => setFormData({...formData, nguoiLienHe: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">SĐT</label>
                                <input 
                                    type="text"
                                    value={formData.soDienThoai}
                                    onChange={(e) => setFormData({...formData, soDienThoai: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Số lô</label>
                                <input 
                                    type="text"
                                    value={formData.soLo}
                                    onChange={(e) => setFormData({...formData, soLo: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Hạn dùng</label>
                                <input 
                                    type="date"
                                    value={formData.hanDung}
                                    onChange={(e) => setFormData({...formData, hanDung: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Issue Detail */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" /> Chi tiết Phản ánh
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nội dung phản ánh</label>
                            <textarea 
                                value={formData.noiDungPhanAnh}
                                onChange={(e) => setFormData({...formData, noiDungPhanAnh: e.target.value})}
                                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                                placeholder="Mô tả chi tiết vấn đề..."
                            />
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Hình ảnh đính kèm</label>
                            <div className="flex flex-wrap gap-3">
                                {formData.images && formData.images.map((img, idx) => (
                                    <div key={idx} className="relative w-24 h-24 group">
                                        <img src={img} alt="preview" className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" />
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                                >
                                    <PhotoIcon className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] font-bold">Thêm ảnh</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>

                        {/* Quantities */}
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">SL Đã nhập</label>
                                <input 
                                    type="number"
                                    value={formData.soLuongDaNhap}
                                    onChange={(e) => setFormData({...formData, soLuongDaNhap: Number(e.target.value)})}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase text-red-500">SL Lỗi</label>
                                <input 
                                    type="number"
                                    value={formData.soLuongLoi}
                                    onChange={(e) => setFormData({...formData, soLuongLoi: Number(e.target.value)})}
                                    className="w-full px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600 focus:ring-2 focus:border-red-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase text-emerald-600">SL Đổi</label>
                                <input 
                                    type="number"
                                    value={formData.soLuongDoi}
                                    onChange={(e) => setFormData({...formData, soLuongDoi: Number(e.target.value)})}
                                    className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-600 focus:ring-2 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Tracking & Processing Info (Renamed) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-purple-500" /> Thông tin Theo dõi & Xử lý
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Ngày phản ánh</label>
                            <input 
                                type="date"
                                value={formData.ngayPhanAnh}
                                onChange={(e) => setFormData({...formData, ngayPhanAnh: e.target.value})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mức độ ưu tiên</label>
                            <select 
                                value={formData.mucDoUuTien}
                                onChange={(e) => setFormData({...formData, mucDoUuTien: e.target.value as any})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="Thấp">Thấp</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Cao">Cao</option>
                                <option value="Khẩn cấp">Khẩn cấp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Trạng thái</label>
                            <select 
                                value={formData.trangThai}
                                onChange={(e) => setFormData({...formData, trangThai: e.target.value as any})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="Mới">Mới</option>
                                <option value="Đang tiếp nhận">Đang tiếp nhận</option>
                                <option value="Đang xác minh">Đang xác minh</option>
                                <option value="Đang xử lý">Đang xử lý</option>
                                <option value="Chưa tìm ra nguyên nhân">Chưa tìm ra nguyên nhân</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nguồn gốc lỗi</label>
                            <select 
                                value={formData.loaiLoi}
                                onChange={(e) => setFormData({...formData, loaiLoi: e.target.value as any})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="Lỗi Khác">Lỗi Khác</option>
                                <option value="Lỗi Sản xuất">Lỗi Sản xuất</option>
                                <option value="Lỗi Nhà cung cấp">Lỗi Nhà cung cấp</option>
                                <option value="Lỗi Hỗn hợp">Lỗi Hỗn hợp</option>
                            </select>
                        </div>
                    </div>
                </div>

            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 z-20">
            <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
            >
                Hủy bỏ
            </button>
            <button 
                type="submit" 
                form="defectForm"
                className="px-6 py-2.5 bg-[#003DA5] hover:bg-[#002a70] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center"
            >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {initialData ? 'Cập nhật' : 'Lưu phiếu'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DefectReportForm;
