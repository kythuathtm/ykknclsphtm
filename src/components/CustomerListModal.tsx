
import React, { useRef, useState, useMemo } from 'react';
import { XIcon, ArrowUpTrayIcon, TrashIcon, PlusIcon, CheckCircleIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, BuildingStoreIcon, TagIcon, MapPinIcon, PhoneIcon, PencilIcon } from './Icons';
import * as XLSX from 'xlsx';
import { Customer } from '../types';

interface Props {
  customers: Customer[];
  onClose: () => void;
  onImport: (newCustomers: Customer[]) => void;
  onAdd: (customer: Customer) => void;
  onEdit: (originalMaKhachHang: string, customer: Customer) => Promise<boolean>;
  onDelete: (maKhachHang: string) => void;
  onDeleteAll: () => void;
}

const CustomerListModal: React.FC<Props> = ({ customers, onClose, onImport, onAdd, onEdit, onDelete, onDeleteAll }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Track which ID is being edited
  const [formData, setFormData] = useState<Customer>({
      maKhachHang: '',
      tenKhachHang: '',
      tinhThanh: '',
      diaChi: '',
      nguoiLienHe: '',
      soDienThoai: ''
  });

  const xlsxLib = (XLSX as any).default ?? XLSX;

  const handleDownloadTemplate = () => {
      const templateData = [
          {
              "Mã KH": "KH001",
              "Tên công ty": "Bệnh viện Đa Khoa Tỉnh A",
              "Tỉnh/Thành phố": "Hà Nội",
              "Địa chỉ": "Số 1, Đường X, Quận Y",
              "Người liên hệ": "Nguyễn Văn A",
              "SĐT": "0901234567"
          },
          {
              "Mã KH": "KH002",
              "Tên công ty": "Công ty TNHH Dược Phẩm B",
              "Tỉnh/Thành phố": "Hồ Chí Minh",
              "Địa chỉ": "",
              "Người liên hệ": "",
              "SĐT": ""
          }
      ];
      
      const worksheet = xlsxLib.utils.json_to_sheet(templateData);
      const workbook = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(workbook, worksheet, "DS_KhachHang");
      xlsxLib.writeFile(workbook, "Mau_Danh_Sach_Khach_Hang.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = event.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) return;

        try {
            const workbook = xlsxLib.read(new Uint8Array(data), { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = xlsxLib.utils.sheet_to_json(worksheet, { defval: '' });
            
            const newCustomers: Customer[] = [];

            jsonData.forEach((row: any) => {
                // Try to map common column names
                const maKhachHang = row['Mã KH'] || row['Mã khách hàng'] || row['Ma KH'] || row['Code'];
                const tenKhachHang = row['Tên công ty'] || row['Tên khách hàng'] || row['Ten KH'] || row['Name'];
                const tinhThanh = row['Tỉnh/Thành phố'] || row['Tỉnh'] || row['Thành phố'] || row['City'] || row['Province'];
                const diaChi = row['Địa chỉ'] || row['Dia chi'] || row['Address'];
                const nguoiLienHe = row['Người liên hệ'] || row['Nguoi lien he'] || row['Contact'];
                const soDienThoai = row['SĐT'] || row['SDT'] || row['Phone'] || row['Tel'];

                if (maKhachHang && tenKhachHang) {
                    newCustomers.push({
                        maKhachHang: String(maKhachHang).trim(),
                        tenKhachHang: String(tenKhachHang).trim(),
                        tinhThanh: String(tinhThanh || '').trim(),
                        diaChi: String(diaChi || '').trim(),
                        nguoiLienHe: String(nguoiLienHe || '').trim(),
                        soDienThoai: String(soDienThoai || '').trim()
                    });
                }
            });

            if (newCustomers.length > 0) {
                onImport(newCustomers);
            } else {
                alert("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra file Excel.");
            }

        } catch (error) {
            console.error("Lỗi import:", error);
            alert("Đã xảy ra lỗi khi đọc file.");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsArrayBuffer(file);
  };

  const openAddForm = () => {
      setFormData({ maKhachHang: '', tenKhachHang: '', tinhThanh: '', diaChi: '', nguoiLienHe: '', soDienThoai: '' });
      setEditingId(null);
      setIsFormOpen(true);
  };

  const openEditForm = (customer: Customer) => {
      setFormData({ ...customer });
      setEditingId(customer.maKhachHang);
      setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.maKhachHang || !formData.tenKhachHang) {
          alert("Vui lòng nhập Mã khách hàng và Tên công ty");
          return;
      }

      if (editingId) {
          // Edit Mode
          const success = await onEdit(editingId, formData);
          if (success) {
              setIsFormOpen(false);
              setEditingId(null);
          }
      } else {
          // Add Mode
          onAdd(formData);
          setFormData({ maKhachHang: '', tenKhachHang: '', tinhThanh: '', diaChi: '', nguoiLienHe: '', soDienThoai: '' });
          setIsFormOpen(false); // Optional: keep open or close
      }
  };

  const filteredCustomers = useMemo(() => {
      return customers.filter(c => 
          c.maKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) || 
          c.tenKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.tinhThanh.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [customers, searchTerm]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-6xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-black/5 shadow-2xl animate-dialog-enter">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 border-b border-slate-200 bg-white gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BuildingStoreIcon className="w-6 h-6 text-indigo-600"/>
                Danh sách Khách hàng
            </h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý đối tác và đơn vị sử dụng ({customers.length})</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95 sm:order-last">
                <XIcon className="h-6 w-6" />
            </button>
             
             <button 
                onClick={() => isFormOpen ? setIsFormOpen(false) : openAddForm()}
                className={`sm:hidden ml-auto flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${isFormOpen ? 'bg-slate-100 text-slate-700' : 'bg-indigo-600 text-white'}`}
             >
                {isFormOpen ? 'Đóng' : <PlusIcon className="h-5 w-5" />}
             </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row gap-3 items-center">
            <div className="relative flex-1 max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="Tìm kiếm mã, tên công ty, tỉnh..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 w-full border border-slate-300 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm outline-none"
                />
            </div>

            <div className="flex gap-2 w-full lg:w-auto justify-end overflow-x-auto pb-2 custom-scrollbar">
                 <button 
                    onClick={() => isFormOpen ? setIsFormOpen(false) : openAddForm()}
                    className={`hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${isFormOpen ? 'bg-white border border-slate-300 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                 >
                    {isFormOpen ? <XIcon className="h-5 w-5 mr-2" /> : <PlusIcon className="h-5 w-5 mr-2" />}
                    {isFormOpen ? 'Đóng form' : 'Thêm khách hàng'}
                 </button>

                 <div className="h-8 w-px bg-slate-300 mx-1"></div>

                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />

                 <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center px-3 py-2 bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    title="Tải file mẫu Excel"
                >
                    <ArrowDownTrayIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Mẫu</span>
                </button>

                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-3 py-2 bg-white border border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    title="Import từ file Excel"
                >
                    <ArrowUpTrayIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Import</span>
                </button>

                 {customers.length > 0 && (
                     <button 
                        onClick={onDeleteAll}
                        className="flex items-center px-3 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        title="Xóa TOÀN BỘ dữ liệu"
                     >
                        <TrashIcon className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Xóa hết</span>
                     </button>
                 )}
            </div>
        </div>

        {/* Add/Edit Form */}
        {isFormOpen && (
            <div className={`p-5 border-b border-indigo-100 animate-fade-in-up overflow-y-auto max-h-[40vh] sm:max-h-none shadow-inner ${editingId ? 'bg-amber-50/80' : 'bg-indigo-50/80'}`}>
                <h4 className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center ${editingId ? 'text-amber-700' : 'text-indigo-700'}`}>
                    {editingId ? <PencilIcon className="w-4 h-4 mr-2"/> : <PlusIcon className="w-4 h-4 mr-2"/>} 
                    {editingId ? 'Cập nhật thông tin khách hàng' : 'Nhập thông tin khách hàng mới'}
                </h4>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
                    <div className="sm:col-span-1">
                        <label className={`block text-xs font-bold mb-1.5 uppercase ${editingId ? 'text-amber-700' : 'text-indigo-700'}`}>Mã KH <span className="text-red-500">*</span></label>
                        <input 
                            type="text" required placeholder="VD: KH001"
                            value={formData.maKhachHang}
                            onChange={(e) => setFormData({...formData, maKhachHang: e.target.value})}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className={`block text-xs font-bold mb-1.5 uppercase ${editingId ? 'text-amber-700' : 'text-indigo-700'}`}>Tên công ty <span className="text-red-500">*</span></label>
                        <input 
                            type="text" required placeholder="Tên khách hàng..."
                            value={formData.tenKhachHang}
                            onChange={(e) => setFormData({...formData, tenKhachHang: e.target.value})}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                     <div className="sm:col-span-2">
                        <label className={`block text-xs font-bold mb-1.5 uppercase ${editingId ? 'text-amber-700' : 'text-indigo-700'}`}>Tỉnh/Thành phố</label>
                        <input 
                            type="text" placeholder="Tỉnh..."
                            value={formData.tinhThanh}
                            onChange={(e) => setFormData({...formData, tinhThanh: e.target.value})}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className={`block text-xs font-bold mb-1.5 uppercase ${editingId ? 'text-amber-700' : 'text-indigo-700'}`}>Địa chỉ</label>
                        <input 
                            type="text" placeholder="Địa chỉ chi tiết..."
                            value={formData.diaChi || ''}
                            onChange={(e) => setFormData({...formData, diaChi: e.target.value})}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={`block text-xs font-bold mb-1.5 uppercase ${editingId ? 'text-amber-700' : 'text-indigo-700'}`}>Người liên hệ</label>
                        <input 
                            type="text" placeholder="Tên người liên hệ..."
                            value={formData.nguoiLienHe || ''}
                            onChange={(e) => setFormData({...formData, nguoiLienHe: e.target.value})}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <button 
                            type="submit"
                            className={`w-full py-2.5 text-white rounded-xl shadow-lg transition-all flex items-center justify-center font-bold active:scale-95 ${editingId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> {editingId ? 'Cập nhật' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-0 sm:p-6 custom-scrollbar relative">
          {filteredCustomers.length > 0 ? (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl bg-white border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 table-fixed">
                        <thead className="bg-slate-50/80 backdrop-blur">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-28 text-xs sticky top-0 bg-slate-50 z-10">Mã KH</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-xs sticky top-0 bg-slate-50 z-10">Tên Công Ty</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-40 text-xs sticky top-0 bg-slate-50 z-10">Tỉnh/Thành</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-48 text-xs sticky top-0 bg-slate-50 z-10">Liên hệ</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase w-20 text-xs sticky top-0 bg-slate-50 z-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredCustomers.map((customer, index) => (
                                <tr key={`${customer.maKhachHang}-${index}`} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-4 py-3 align-top">
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-sm">{customer.maKhachHang}</span>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-bold text-slate-800 text-sm">{customer.tenKhachHang}</div>
                                        {customer.diaChi && <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {customer.diaChi}</div>}
                                    </td>
                                    <td className="px-4 py-3 align-top text-sm text-slate-600">{customer.tinhThanh}</td>
                                    <td className="px-4 py-3 align-top text-sm">
                                        <div className="text-slate-800 font-medium">{customer.nguoiLienHe}</div>
                                        {customer.soDienThoai && <div className="text-xs text-slate-500 flex items-center gap-1"><PhoneIcon className="w-3 h-3"/> {customer.soDienThoai}</div>}
                                    </td>
                                    <td className="px-4 py-3 align-top text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openEditForm(customer)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                                                title="Sửa"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(customer.maKhachHang)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                                title="Xóa"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden grid grid-cols-1 gap-3 p-4">
                    {filteredCustomers.map((customer, index) => (
                        <div key={`${customer.maKhachHang}-${index}`} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 relative">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-sm text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{customer.maKhachHang}</span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{customer.tinhThanh}</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 leading-snug">{customer.tenKhachHang}</h3>
                            {customer.diaChi && <div className="text-xs text-slate-500 flex items-start gap-1"><MapPinIcon className="w-3 h-3 mt-0.5 shrink-0"/> {customer.diaChi}</div>}
                            {(customer.nguoiLienHe || customer.soDienThoai) && (
                                <div className="mt-1 pt-2 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-600">
                                    {customer.nguoiLienHe && <span className="font-medium">{customer.nguoiLienHe}</span>}
                                    {customer.soDienThoai && <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3"/> {customer.soDienThoai}</span>}
                                </div>
                            )}
                            <div className="absolute bottom-3 right-3 flex gap-2">
                                <button 
                                    onClick={() => openEditForm(customer)}
                                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
                                >
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                <button 
                                    onClick={() => onDelete(customer.maKhachHang)}
                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-95"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Không tìm thấy khách hàng</h3>
                <p className="text-sm text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center p-4 bg-white border-t border-slate-200 text-xs text-slate-500">
            <div className="hidden sm:flex items-center gap-2">
                 <TagIcon className="w-3 h-3"/>
                 <span>File Excel cần có các cột: Mã KH, Tên công ty, Tỉnh/Thành phố.</span>
            </div>
            <button onClick={onClose} className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all active:scale-95">
                Đóng
            </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerListModal;
