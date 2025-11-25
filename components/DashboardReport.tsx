
import React, { useMemo } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, SparklesIcon, 
    QuestionMarkCircleIcon, CubeIcon, WrenchIcon, TruckIcon, ShoppingBagIcon,
    TagIcon, ArrowRightOnRectangleIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
}

const StatCard = ({ title, value, percentage, icon, onClick, colorClass }: any) => {
    return (
        <div 
            onClick={onClick}
            className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full min-h-[110px] group relative overflow-hidden active:scale-95"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500 ${colorClass.bg}`}></div>
            
            <div className="flex justify-between items-start z-10 mb-3">
                 <div className={`p-2 rounded-xl ${colorClass.bg} ${colorClass.text} transition-transform duration-300 group-hover:rotate-6 shadow-sm`}>
                    {React.cloneElement(icon, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
                 </div>
                 {percentage !== undefined && (
                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full ${colorClass.bg} ${colorClass.text}`}>
                        {percentage}%
                    </span>
                 )}
            </div>
            
            <div className="z-10 mt-auto">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
                    {value.toLocaleString('vi-VN')}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
            </div>
        </div>
    );
};

interface BrandData {
    name: string;
    reports: number;
    reportsPercent: string;
    exchange: number;
    exchangePercent: string;
    products: number;
    productsPercent: string;
}

const BrandPerformanceCard = ({ data, onClick }: { data: BrandData; onClick: () => void }) => {
    let theme = {
        border: 'border-slate-200',
        text: 'text-slate-700',
        bg: 'bg-slate-50',
        accent: 'text-slate-500',
        bar: 'bg-slate-500',
        lightBar: 'bg-slate-100',
        ring: 'hover:ring-slate-100'
    };
    
    if (data.name === 'HTM') {
        theme = { 
            border: 'border-blue-500', 
            text: 'text-blue-700', 
            bg: 'bg-blue-50', 
            accent: 'text-blue-600', 
            bar: 'bg-blue-500', 
            lightBar: 'bg-blue-100',
            ring: 'hover:ring-blue-100'
        };
    } else if (data.name === 'VMA') {
        theme = { 
            border: 'border-emerald-500', 
            text: 'text-emerald-700', 
            bg: 'bg-emerald-50', 
            accent: 'text-emerald-600', 
            bar: 'bg-emerald-500', 
            lightBar: 'bg-emerald-100',
            ring: 'hover:ring-emerald-100'
        };
    }

    const ProgressBar = ({ label, value, percent, colorClass }: any) => (
        <div className="w-full group/bar">
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover/bar:text-slate-600 transition-colors">{label}</span>
                <div className="text-right">
                     <span className={`text-sm font-bold ${theme.text} mr-1`}>{value}</span>
                     <span className="text-[10px] text-slate-400 font-medium">({percent}%)</span>
                </div>
            </div>
            <div className={`w-full h-2 rounded-full ${theme.lightBar} overflow-hidden`}>
                <div 
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
                    style={{ width: `${Math.min(parseFloat(percent), 100)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col rounded-2xl bg-white border-2 ${theme.border} shadow-sm hover:shadow-xl hover:-translate-y-1 hover:ring-4 ${theme.ring} transition-all duration-300 cursor-pointer overflow-hidden group h-full active:scale-[0.98]`}
        >
             <div className={`px-5 py-4 flex items-center justify-between border-b border-slate-100 ${theme.bg} transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ring-1 ring-black/5`}>
                        <TagIcon className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <h3 className={`text-xl font-black tracking-tight ${theme.text}`}>{data.name}</h3>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${theme.accent} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                    <span>Chi tiết</span>
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </div>
             </div>

             <div className="p-5 flex flex-col justify-center gap-6 flex-1 bg-white">
                 <ProgressBar label="Phản ánh" value={data.reports} percent={data.reportsPercent} colorClass={theme.bar} />
                 <ProgressBar label="Đổi hàng" value={data.exchange} percent={data.exchangePercent} colorClass="bg-rose-500" />
                 <ProgressBar label="Sản phẩm lỗi" value={data.products} percent={data.productsPercent} colorClass="bg-amber-400" />
             </div>
        </div>
    );
};

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect }) => {
  const stats = useMemo(() => {
    const total = reports.length;
    const totalExchange = reports.reduce((sum, r) => sum + (r.soLuongDoi || 0), 0);
    const totalUniqueProducts = new Set(reports.map(r => r.tenThuongMai + r.nhanHang)).size;
    
    // Total distinct products for "Sản phẩm lỗi" card (Global)
    const distinctDefectiveProducts = new Set(reports.map(r => r.tenThuongMai)).size;

    const calc = (filterFn: (r: DefectReport) => boolean) => {
        const count = reports.filter(filterFn).length;
        return { count, percent: total > 0 ? ((count / total) * 100).toFixed(1) : '0' };
    };

    const sNew = calc(r => r.trangThai === 'Mới');
    const sProcessing = calc(r => r.trangThai === 'Đang xử lý');
    const sUnknown = calc(r => r.trangThai === 'Chưa tìm ra nguyên nhân');
    const sCompleted = calc(r => r.trangThai === 'Hoàn thành');

    // Updated stats calculation with legacy support
    const dProduction = calc(r => r.loaiLoi === 'Lỗi Sản xuất' || (r.loaiLoi as any) === 'Lỗi bộ phận sản xuất');
    const dSupplier = calc(r => r.loaiLoi === 'Lỗi Nhà cung cấp');
    const dMixed = calc(r => r.loaiLoi === 'Lỗi Hỗn hợp' || (r.loaiLoi as any) === 'Lỗi vừa sản xuất vừa NCC');
    const dOther = calc(r => r.loaiLoi === 'Lỗi Khác' || (r.loaiLoi as any) === 'Lỗi khác');

    const brands = ['HTM', 'VMA'];
    const brandData = brands.map(brandName => {
        const brandReports = reports.filter(r => r.nhanHang === brandName);
        const rCount = brandReports.length;
        const eCount = brandReports.reduce((sum, r) => sum + (r.soLuongDoi || 0), 0);
        // Products count for this brand specifically
        const pCount = new Set(brandReports.map(r => r.tenThuongMai)).size;
        
        return {
            name: brandName,
            reports: rCount,
            reportsPercent: total > 0 ? ((rCount / total) * 100).toFixed(1) : '0',
            exchange: eCount,
            exchangePercent: totalExchange > 0 ? ((eCount / totalExchange) * 100).toFixed(1) : '0',
            products: pCount,
            productsPercent: distinctDefectiveProducts > 0 ? ((pCount / distinctDefectiveProducts) * 100).toFixed(1) : '0'
        };
    });
    
    // Add "Others" if any
    const otherReports = reports.filter(r => !brands.includes(r.nhanHang as string));
    if (otherReports.length > 0) {
         const rCount = otherReports.length;
         const eCount = otherReports.reduce((sum, r) => sum + (r.soLuongDoi || 0), 0);
         const pCount = new Set(otherReports.map(r => r.tenThuongMai)).size;
         brandData.push({
            name: 'Khác',
            reports: rCount,
            reportsPercent: total > 0 ? ((rCount / total) * 100).toFixed(1) : '0',
            exchange: eCount,
            exchangePercent: totalExchange > 0 ? ((eCount / totalExchange) * 100).toFixed(1) : '0',
            products: pCount,
            productsPercent: distinctDefectiveProducts > 0 ? ((pCount / distinctDefectiveProducts) * 100).toFixed(1) : '0'
         });
    }

    const productCounts: Record<string, number> = {};
    reports.forEach(r => { productCounts[r.tenThuongMai] = (productCounts[r.tenThuongMai] || 0) + 1; });
    const top5 = Object.keys(productCounts)
        .map(key => ({ name: key, quantity: productCounts[key] }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    return {
        total, 
        uniqueProducts: distinctDefectiveProducts,
        status: { sNew, sProcessing, sUnknown, sCompleted },
        defect: { dProduction, dSupplier, dMixed, dOther },
        brands: brandData,
        top5
    };
  }, [reports]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
             
             {/* SECTION 1: OVERVIEW & STATUS */}
             <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>Tổng quan
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard 
                        title="TỔNG PHẢN ÁNH" value={stats.total} 
                        colorClass={{bg: 'bg-indigo-100', text: 'text-indigo-600'}}
                        icon={<DocumentDuplicateIcon/>} onClick={() => onFilterSelect('all')}
                    />
                    <StatCard 
                        title="SẢN PHẨM LỖI" value={stats.uniqueProducts} 
                        colorClass={{bg: 'bg-cyan-100', text: 'text-cyan-600'}}
                        icon={<ShoppingBagIcon/>} onClick={() => onFilterSelect('all')}
                    />
                    <StatCard 
                        title="MỚI" value={stats.status.sNew.count} percentage={stats.status.sNew.percent} 
                        colorClass={{bg: 'bg-blue-100', text: 'text-blue-600'}}
                        icon={<SparklesIcon/>} onClick={() => onFilterSelect('status', 'Mới')}
                    />
                    <StatCard 
                        title="ĐANG XỬ LÝ" value={stats.status.sProcessing.count} percentage={stats.status.sProcessing.percent} 
                        colorClass={{bg: 'bg-amber-100', text: 'text-amber-600'}}
                        icon={<ClockIcon/>} onClick={() => onFilterSelect('status', 'Đang xử lý')}
                    />
                    <StatCard 
                        title="CHƯA RÕ NGUYÊN NHÂN" value={stats.status.sUnknown.count} percentage={stats.status.sUnknown.percent} 
                        colorClass={{bg: 'bg-purple-100', text: 'text-purple-600'}}
                        icon={<QuestionMarkCircleIcon/>} onClick={() => onFilterSelect('status', 'Chưa tìm ra nguyên nhân')}
                    />
                    <StatCard 
                        title="HOÀN THÀNH" value={stats.status.sCompleted.count} percentage={stats.status.sCompleted.percent} 
                        colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-600'}}
                        icon={<CheckCircleIcon/>} onClick={() => onFilterSelect('status', 'Hoàn thành')}
                    />
                </div>
             </div>

             {/* SECTION 2: DEFECT TYPES */}
             <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>Phân loại lỗi
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        title="LỖI SẢN XUẤT" value={stats.defect.dProduction.count} percentage={stats.defect.dProduction.percent} 
                        colorClass={{bg: 'bg-rose-100', text: 'text-rose-600'}}
                        icon={<WrenchIcon/>} onClick={() => onFilterSelect('defectType', 'Lỗi Sản xuất')}
                    />
                    <StatCard 
                        title="NHÀ CUNG CẤP" value={stats.defect.dSupplier.count} percentage={stats.defect.dSupplier.percent} 
                        colorClass={{bg: 'bg-orange-100', text: 'text-orange-600'}}
                        icon={<TruckIcon/>} onClick={() => onFilterSelect('defectType', 'Lỗi Nhà cung cấp')}
                    />
                    <StatCard 
                        title="LỖI HỖN HỢP" value={stats.defect.dMixed.count} percentage={stats.defect.dMixed.percent} 
                        colorClass={{bg: 'bg-fuchsia-100', text: 'text-fuchsia-600'}}
                        icon={<CubeIcon/>} onClick={() => onFilterSelect('defectType', 'Lỗi Hỗn hợp')}
                    />
                    <StatCard 
                        title="LỖI KHÁC" value={stats.defect.dOther.count} percentage={stats.defect.dOther.percent} 
                        colorClass={{bg: 'bg-slate-100', text: 'text-slate-600'}}
                        icon={<QuestionMarkCircleIcon/>} onClick={() => onFilterSelect('defectType', 'Lỗi Khác')}
                    />
                </div>
             </div>

             {/* SECTION 3: BRANDS & TOP PRODUCTS (EXPAND TO FILL) */}
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[300px]">
                  {/* Brand Performance - Expands vertically */}
                  <div className="lg:col-span-8 flex flex-col gap-3 h-full">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Hiệu suất Nhãn hàng
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            {stats.brands.map((brand, idx) => (
                                <BrandPerformanceCard key={idx} data={brand} onClick={() => onFilterSelect('brand', brand.name)} />
                            ))}
                        </div>
                  </div>

                  {/* Top Products - Expands vertically */}
                  <div className="lg:col-span-4 flex flex-col gap-3 h-full">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>Top 5 Sản phẩm lỗi
                        </h2>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col overflow-hidden h-full">
                             <div className="flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar pr-1">
                                {stats.top5.map((item, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => onFilterSelect('search', item.name)}
                                        className="flex items-center p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all border border-transparent hover:border-slate-100"
                                    >
                                        <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl text-sm font-black shadow-sm border mr-3 transition-transform group-hover:scale-110 ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                                index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                                                index === 2 ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                                'bg-white text-slate-400 border-slate-100'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                                {item.name}
                                            </p>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
                                                <div 
                                                    className="bg-blue-500 h-1.5 rounded-full opacity-60 group-hover:opacity-100 transition-all"
                                                    style={{ width: `${Math.min((item.quantity / (stats.top5[0]?.quantity || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg ml-3">
                                            {item.quantity}
                                        </span>
                                    </div>
                                ))}
                                {stats.top5.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <ShoppingBagIcon className="w-10 h-10 opacity-20" />
                                        <span className="text-sm font-medium italic">Chưa có dữ liệu</span>
                                    </div>
                                )}
                             </div>
                        </div>
                  </div>
             </div>
        </div>
    </div>
  );
}

export default DashboardReport;
