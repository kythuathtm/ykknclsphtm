
import React, { useRef, useState } from 'react';
import { XIcon, ArrowUpTrayIcon, TrashIcon, PlusIcon, CheckCircleIcon } from './Icons';
import * as XLSX from 'xlsx';
import { Product } from '../types';

interface Props {
  products: Product[];
  onClose: () => void;
  onImport: (newProducts: Product[]) => void;
  onAdd: (product: Product) => void;
  onDelete: (maSanPham: string) => void;
  currentUserRole: string;
}

const ProductListModal: React.FC<Props> = ({ products, onClose, onImport, onAdd, onDelete, currentUserRole }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for search and manual add
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Product>({
      maSanPham: '',
      tenThuongMai: '',
      tenThietBi: '',
      dongSanPham: '',
      nhanHang: 'HTM',
      GPLH: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) return;

        try {
            // Read the Excel file
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const newProducts: Product[] = [];

            jsonData.forEach((row: any) => {
                // Map common header names to our data structure
                const keys = Object.keys(row);
                const getVal = (keywords: string[]) => {
                    const key = keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
                    return key ? row[key] : '';
                };

                const maSanPham = getVal(['Mã SP', 'Mã sản phẩm', 'Code', 'Ma San Pham']);
                const tenThuongMai = getVal(['Tên TM', 'Tên thương mại', 'Name', 'Ten Thuong Mai']);
                const tenThietBi = getVal(['Tên TB', 'Tên thiết bị', 'Device Name', 'Ten Thiet Bi']);
                const dongSanPham = getVal(['Dòng SP', 'Dòng sản phẩm', 'Type', 'Dong San Pham']);
                const nhanHang = getVal(['Nhãn hàng', 'Nhan Hang', 'Brand']);
                const gplh = getVal(['GPLH', 'Số đăng ký', 'SDK', 'Registration']);

                if (maSanPham && tenThuongMai) {
                    newProducts.push({
                        maSanPham: String(maSanPham).trim(),
                        tenThuongMai: String(tenThuongMai).trim(),
                        tenThietBi: String(tenThietBi || '').trim(),
                        dongSanPham: String(dongSanPham || '').trim(),
                        nhanHang: nhanHang ? String(nhanHang).trim() : 'HTM',
                        GPLH: String(gplh || '').trim()
                    });
                }
            });

            if (newProducts.length > 0) {
                onImport(newProducts);
            } else {
                alert("Không tìm thấy dữ liệu sản phẩm hợp lệ. Vui lòng kiểm tra tiêu đề cột (Mã SP, Tên thương mại...).");
            }

        } catch (error) {
            console.error("Lỗi đọc file:", error);
            alert("Đã xảy ra lỗi khi đọc file Excel.");
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleManualAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProduct.maSanPham || !newProduct.tenThuongMai) {
          alert("Vui lòng nhập Mã sản phẩm và Tên thương mại");
          return;
      }
      onAdd(newProduct);
      setNewProduct({ maSanPham: '', tenThuongMai: '', tenThietBi: '', dongSanPham: '', nhanHang: 'HTM', GPLH: '' });
      setIsAdding(false); // Close form after add
  };

  // Filter products
  const filteredProducts = products.filter(p => 
      p.maSanPham.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.tenThuongMai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dongSanPham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.GPLH.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[1400px] w-full max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Danh sách Sản phẩm</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý cơ sở dữ liệu ({products.length} mã)</p>
          </div>
          <div className="flex items-center space-x-2">
             <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-64"
             />

             {/* Hidden File Input */}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".xlsx, .xls"
             />
             
             <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${isAdding ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'}`}
             >
                <PlusIcon className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">{isAdding ? 'Đóng' : 'Thêm'}</span>
             </button>

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all ml-2 active:scale-95">
                <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Add New Product Form Area */}
        {isAdding && (
            <div className="p-5 bg-blue-50 border-b border-blue-100 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Thêm sản phẩm mới</h4>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all self-start sm:self-auto"
                        title="Import từ file Excel"
                    >
                        <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
                        Hoặc Import Excel
                    </button>
                </div>
                
                <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-blue-700 mb-1">Mã sản phẩm *</label>
                        <input 
                            type="text" required placeholder="VD: SP001"
                            value={newProduct.maSanPham}
                            onChange={(e) => setNewProduct({...newProduct, maSanPham: e.target.value})}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-blue-700 mb-1">Tên thương mại *</label>
                        <input 
                            type="text" required placeholder="Tên sản phẩm"
                            value={newProduct.tenThuongMai}
                            onChange={(e) => setNewProduct({...newProduct, tenThuongMai: e.target.value})}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500"
                        />
                    </div>
                     <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-blue-700 mb-1">Tên thiết bị YT</label>
                        <input 
                            type="text" placeholder="Tên thiết bị"
                            value={newProduct.tenThietBi}
                            onChange={(e) => setNewProduct({...newProduct, tenThietBi: e.target.value})}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-blue-700 mb-1">Dòng sản phẩm</label>
                        <input 
                            type="text" placeholder="Loại"
                            value={newProduct.dongSanPham}
                            onChange={(e) => setNewProduct({...newProduct, dongSanPham: e.target.value})}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500"
                        />
                    </div>
                     <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-blue-700 mb-1">Nhãn hàng</label>
                         <select 
                            value={newProduct.nhanHang} onChange={(e) => setNewProduct({...newProduct, nhanHang: e.target.value})}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500"
                        >
                            <option value="HTM">HTM</option>
                            <option value="VMA">VMA</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-blue-700 mb-1">GPLH</label>
                        <input 
                            type="text" placeholder="Số đăng ký"
                            value={newProduct.GPLH}
                            onChange={(e) => setNewProduct({...newProduct, GPLH: e.target.value})}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-1 sm:col-start-6">
                        <button 
                            type="submit"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center justify-center font-bold"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Product Table */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
          <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl bg-white border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24 sticky top-0 bg-slate-50 z-10">Mã SP</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-48 sticky top-0 bg-slate-50 z-10">Tên thương mại</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-40 sticky top-0 bg-slate-50 z-10">Tên thiết bị YT</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32 sticky top-0 bg-slate-50 z-10">Dòng SP</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24 sticky top-0 bg-slate-50 z-10">Nhãn hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32 sticky top-0 bg-slate-50 z-10">GPLH</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase w-16 sticky top-0 bg-slate-50 z-10">Xóa</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredProducts.map((product, index) => (
                  <tr key={`${product.maSanPham}-${index}`} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-4 py-3 text-sm font-mono font-bold text-slate-600 align-top">{product.maSanPham}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-normal break-words align-top">{product.tenThuongMai}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-normal break-words align-top">{product.tenThietBi}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-normal break-words align-top">{product.dongSanPham}</td>
                    <td className="px-4 py-3 text-sm align-top">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                            product.nhanHang === 'HTM' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            product.nhanHang === 'VMA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                            {product.nhanHang || 'Khác'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono text-xs align-top">{product.GPLH}</td>
                    <td className="px-4 py-3 text-right text-sm align-top">
                        <button 
                            onClick={() => onDelete(product.maSanPham)}
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Xóa"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                            {searchTerm ? 'Không tìm thấy sản phẩm nào.' : 'Danh sách trống.'}
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-white border-t border-slate-200 text-xs text-slate-500">
            <div className="hidden sm:block">
                 * File Excel cần có các cột: Mã SP, Tên thương mại, Tên thiết bị, Dòng SP, Nhãn hàng, GPLH.
            </div>
            <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-6 rounded-xl shadow-sm transition-all active:scale-95">
                Đóng
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListModal;
