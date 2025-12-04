import React, { useRef, useState, useMemo } from 'react';
import { XIcon, ArrowUpTrayIcon, TrashIcon, PlusIcon, CheckCircleIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, FunnelIcon, CubeIcon, TagIcon } from './Icons';
import * as XLSX from 'xlsx';
import { Product } from '../types';

interface Props {
  products: Product[];
  onClose: () => void;
  onImport: (newProducts: Product[]) => void;
  onAdd: (product: Product) => void;
  onDelete: (maSanPham: string) => void;
  onDeleteAll: () => void;
  currentUserRole: string;
}

const ProductListModal: React.FC<Props> = ({ products, onClose, onImport, onAdd, onDelete, onDeleteAll, currentUserRole }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for search and manual add
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Product>({
      maSanPham: '',
      tenThuongMai: '',
      tenThietBi: '',
      dongSanPham: '',
      nhanHang: 'HTM',
      GPLH: ''
  });

  const handleDownloadTemplate = () => {
      const templateData = [
          {
              "Mã SP (Bắt buộc)": "SP001",
              "Tên thương mại (Bắt buộc)": "Kim lấy máu chân không",
              "Tên thiết bị": "Kim lấy máu",
              "Dòng sản phẩm": "Vật tư tiêu hao",
              "Nhãn hàng": "HTM",
              "GPLH": "12345/BYT-TB-CT"
          },
          {
              "Mã SP (Bắt buộc)": "SP002",
              "Tên thương mại (Bắt buộc)": "Ống nghiệm serum",
              "Tên thiết bị": "Ống nghiệm",
              "Dòng sản phẩm": "Ống nghiệm",
              "Nhãn hàng": "VMA",
              "GPLH": ""
          }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "MauNhapLieu");
      XLSX.writeFile(workbook, "Mau_Danh_Sach_San_Pham.xlsx");
  };

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
  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesSearch = 
            p.maSanPham.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.tenThuongMai.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.dongSanPham.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.GPLH.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesBrand = brandFilter === 'All' || 
                               (brandFilter === 'Khác' ? !['HTM', 'VMA'].includes(p.nhanHang || '') : p.nhanHang === brandFilter);

          return matchesSearch && matchesBrand;
      });
  }, [products, searchTerm, brandFilter]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-7xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-black/5 shadow-2xl animate-slide-up">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 border-b border-slate-200 bg-white gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CubeIcon className="w-6 h-6 text-[#003DA5]"/>
                Danh sách Sản phẩm
            </h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý cơ sở dữ liệu ({products.length} mã)</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95 sm:order-last">
                <XIcon className="h-6 w-6" />
            </button>
             
             {/* Mobile Add Button */}
             <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`sm:hidden ml-auto flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${isAdding ? 'bg-slate-100 text-slate-700' : 'bg-[#003DA5] text-white'}`}
             >
                {isAdding ? 'Đóng' : <PlusIcon className="h-5 w-5" />}
             </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row gap-3 items-center">
            {/* Search & Filter Group */}
            <div className="flex gap-2 w-full lg:w-auto flex-1">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm mã, tên..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-3 py-2 w-full border border-slate-300 rounded-xl text-base font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] shadow-sm outline-none"
                    />
                </div>
                <div className="relative w-32 sm:w-40">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <FunnelIcon className="h-4 w-4" />
                    </div>
                    <select 
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="pl-8 pr-8 py-2 w-full border border-slate-300 rounded-xl text-base font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] shadow-sm outline-none appearance-none bg-white cursor-pointer"
                    >
                        <option value="All">Tất cả hãng</option>
                        <option value="HTM">HTM</option>
                        <option value="VMA">VMA</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full lg:w-auto justify-end overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                 <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${isAdding ? 'bg-white border border-slate-300 text-slate-700' : 'bg-[#003DA5] text-white hover:bg-[#002a70]'}`}
                 >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {isAdding ? 'Đóng thêm mới' : 'Thêm sản phẩm'}
                 </button>

                 <div className="h-8 w-px bg-slate-300 mx-1"></div>

                 {/* Hidden File Input */}
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".xlsx, .xls"
                 />

                 <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center px-3 py-2 bg-white border border-slate-300 text-slate-600 hover:text-[#003DA5] hover:border-blue-300 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
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

                 {products.length > 0 && (
                     <button 
                        onClick={onDeleteAll}
                        className="flex items-center px-3 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        title="Xóa TOÀN BỘ dữ liệu sản phẩm"
                     >
                        <TrashIcon className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Xóa hết</span>
                     </button>
                 )}
            </div>
        </div>

        {/* Add New Product Form Area */}
        {isAdding && (
            <div className="p-5 bg-blue-50/80 border-b border-blue-100 animate-fade-in-up overflow-y-auto max-h-[40vh] sm:max-h-none shadow-inner">
                <h4 className="text-sm font-bold text-[#003DA5] uppercase tracking-wide mb-4 flex items-center">
                    <PlusIcon className="w-4 h-4 mr-2"/>
                    Nhập thông tin sản phẩm
                </h4>
                
                <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#003DA5] mb-1.5 uppercase">Mã SP <span className="text-red-500">*</span></label>
                        <input 
                            type="text" required placeholder="VD: SP001"
                            value={newProduct.maSanPham}
                            onChange={(e) => setNewProduct({...newProduct, maSanPham: e.target.value})}
                            className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-base font-medium focus:border-[#003DA5] focus:ring-2 focus:ring-blue-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#003DA5] mb-1.5 uppercase">Tên thương mại <span className="text-red-500">*</span></label>
                        <input 
                            type="text" required placeholder="Tên sản phẩm..."
                            value={newProduct.tenThuongMai}
                            onChange={(e) => setNewProduct({...newProduct, tenThuongMai: e.target.value})}
                            className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-base font-medium focus:border-[#003DA5] focus:ring-2 focus:ring-blue-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                     <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#003DA5] mb-1.5 uppercase">Tên thiết bị YT</label>
                        <input 
                            type="text" placeholder="Tên thiết bị..."
                            value={newProduct.tenThietBi}
                            onChange={(e) => setNewProduct({...newProduct, tenThietBi: e.target.value})}
                            className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-base font-medium focus:border-[#003DA5] focus:ring-2 focus:ring-blue-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#003DA5] mb-1.5 uppercase">Dòng sản phẩm</label>
                        <input 
                            type="text" placeholder="Loại..."
                            value={newProduct.dongSanPham}
                            onChange={(e) => setNewProduct({...newProduct, dongSanPham: e.target.value})}
                            className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-base font-medium focus:border-[#003DA5] focus:ring-2 focus:ring-blue-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                     <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#003DA5] mb-1.5 uppercase">Nhãn hàng</label>
                         <select 
                            value={newProduct.nhanHang} onChange={(e) => setNewProduct({...newProduct, nhanHang: e.target.value})}
                            className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-base font-medium focus:border-[#003DA5] focus:ring-2 focus:ring-blue-200 bg-white shadow-sm outline-none cursor-pointer"
                        >
                            <option value="HTM">HTM</option>
                            <option value="VMA">VMA</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#003DA5] mb-1.5 uppercase">GPLH</label>
                        <input 
                            type="text" placeholder="Số đăng ký..."
                            value={newProduct.GPLH}
                            onChange={(e) => setNewProduct({...newProduct, GPLH: e.target.value})}
                            className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-base font-medium focus:border-[#003DA5] focus:ring-2 focus:ring-blue-200 bg-white shadow-sm outline-none"
                        />
                    </div>
                    <div className="sm:col-span-5 hidden sm:block"></div>
                    <div className="sm:col-span-1 sm:col-start-6 mt-2 sm:mt-0">
                        <button 
                            type="submit"
                            className="w-full py-2.5 bg-[#003DA5] hover:bg-[#002a70] text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center font-bold active:scale-95"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Lưu
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Product List Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-0 sm:p-6 custom-scrollbar relative">
          
          {filteredProducts.length > 0 ? (
            <>
                {/* TABLE VIEW (Desktop) */}
                <div className="hidden md:block overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl bg-white border border-slate-200">
                    <table 
                        className="min-w-full divide-y divide-slate-200 table-fixed"
                        style={{
                            fontFamily: 'var(--list-font, inherit)',
                            fontSize: 'var(--list-size, 1rem)'
                        }}
                    >
                    <thead className="bg-slate-50/80 backdrop-blur">
                        <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-28 sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}>Mã SP</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}>Tên thương mại</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-48 sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}>Tên thiết bị YT</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-32 sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}>Dòng SP</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-24 sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}>Nhãn hàng</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-32 sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}>GPLH</th>
                        <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase w-16 sticky top-0 bg-slate-50 z-10" style={{ fontSize: 'inherit' }}></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {filteredProducts.map((product, index) => (
                        <tr key={`${product.maSanPham}-${index}`} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="px-4 py-3 align-top">
                                <span className="font-bold text-[#003DA5] bg-blue-50 px-2 py-0.5 rounded border border-blue-100" style={{ fontSize: 'inherit' }}>{product.maSanPham}</span>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <div className="font-medium text-slate-800 line-clamp-2" title={product.tenThuongMai} style={{ fontSize: 'inherit' }}>{product.tenThuongMai}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <div className="text-slate-500 line-clamp-1" title={product.tenThietBi} style={{ fontSize: 'inherit' }}>{product.tenThietBi}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <div className="text-slate-500 line-clamp-1" title={product.dongSanPham} style={{ fontSize: 'inherit' }}>{product.dongSanPham}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <span className={`px-2 py-1 rounded font-bold border ${
                                    product.nhanHang === 'HTM' ? 'bg-[#003DA5]/10 text-[#003DA5] border-[#003DA5]/20' :
                                    product.nhanHang === 'VMA' ? 'bg-[#009183]/10 text-[#009183] border-[#009183]/20' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`} style={{ fontSize: '0.85em' }}>
                                    {product.nhanHang || 'Khác'}
                                </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <div className="text-slate-400" style={{ fontSize: '0.85em' }}>{product.GPLH}</div>
                            </td>
                            <td className="px-4 py-3 align-top text-right">
                                <button 
                                    onClick={() => onDelete(product.maSanPham)}
                                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                    title="Xóa"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* CARD GRID VIEW (Mobile) */}
                <div className="md:hidden grid grid-cols-1 gap-3 p-4">
                    {filteredProducts.map((product, index) => (
                        <div key={`${product.maSanPham}-${index}`} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 relative">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-sm text-[#003DA5] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{product.maSanPham}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${
                                    product.nhanHang === 'HTM' ? 'bg-[#003DA5]/10 text-[#003DA5] border-[#003DA5]/20' :
                                    product.nhanHang === 'VMA' ? 'bg-[#009183]/10 text-[#009183] border-[#009183]/20' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {product.nhanHang || 'Khác'}
                                </span>
                            </div>
                            
                            <h3 className="text-sm font-bold text-slate-800 leading-snug">{product.tenThuongMai}</h3>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                {product.tenThietBi && <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate max-w-[150px]">{product.tenThietBi}</span>}
                                {product.dongSanPham && <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate">{product.dongSanPham}</span>}
                            </div>

                            {product.GPLH && <div className="text-[10px] text-slate-400 mt-1">GPLH: {product.GPLH}</div>}

                            <button 
                                onClick={() => onDelete(product.maSanPham)}
                                className="absolute bottom-3 right-3 p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-95"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Không tìm thấy sản phẩm</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc nhãn hàng.
                </p>
                {searchTerm || brandFilter !== 'All' ? (
                    <button 
                        onClick={() => { setSearchTerm(''); setBrandFilter('All'); }}
                        className="mt-4 px-4 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all"
                    >
                        Xóa bộ lọc
                    </button>
                ) : null}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center p-4 bg-white border-t border-slate-200 text-xs text-slate-500">
            <div className="hidden sm:flex items-center gap-2">
                 <TagIcon className="w-3 h-3"/>
                 <span>File Excel cần có các cột: Mã SP, Tên thương mại, Tên thiết bị, Dòng SP, Nhãn hàng, GPLH.</span>
            </div>
            <button onClick={onClose} className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all active:scale-95">
                Đóng
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListModal;