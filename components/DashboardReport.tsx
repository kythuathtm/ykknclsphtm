
import React, { useMemo } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, SparklesIcon, 
    QuestionMarkCircleIcon, CubeIcon, WrenchIcon, TruckIcon, ShoppingBagIcon,
    TagIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
}

// --- Color Themes ---
type ColorTheme = {
    bg: string;
    border: string;
    textTitle: string;
    textValue: string;
    iconBg: string;
    iconColor: string;
    percentage: string;
};

const themes: Record<string, ColorTheme> = {
    indigo: { bg: 'bg-indigo-50/50', border: 'border-indigo-100', textTitle: 'text-indigo-600', textValue: 'text-indigo-900', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', percentage: 'text-indigo-600' },
    cyan:   { bg: 'bg-cyan-50/50', border: 'border-cyan-100', textTitle: 'text-cyan-600', textValue: 'text-cyan-900', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', percentage: 'text-cyan-600' },
    blue:   { bg: 'bg-blue-50/50', border: 'border-blue-100', textTitle: 'text-blue-600', textValue: 'text-blue-900', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', percentage: 'text-blue-600' },
    amber:  { bg: 'bg-amber-50/50', border: 'border-amber-100', textTitle: 'text-amber-600', textValue: 'text-amber-900', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', percentage: 'text-amber-600' },
    purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', textTitle: 'text-purple-600', textValue: 'text-purple-900', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', percentage: 'text-purple-600' },
    green:  { bg: 'bg-emerald-50/50', border: 'border-emerald-100', textTitle: 'text-emerald-600', textValue: 'text-emerald-900', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', percentage: 'text-emerald-600' },
    rose:   { bg: 'bg-rose-50/50', border: 'border-rose-100', textTitle: 'text-rose-600', textValue: 'text-rose-900', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', percentage: 'text-rose-600' },
    orange: { bg: 'bg-orange-50/50', border: 'border-orange-100', textTitle: 'text-orange-600', textValue: 'text-orange-900', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', percentage: 'text-orange-600' },
    fuchsia:{ bg: 'bg-fuchsia-50/50', border: 'border-fuchsia-100', textTitle: 'text-fuchsia-600', textValue: 'text-fuchsia-900', iconBg: 'bg-fuchsia-100', iconColor: 'text-fuchsia-600', percentage: 'text-fuchsia-600' },
    slate:  { bg: 'bg-slate-50/50', border: 'border-slate-200', textTitle: 'text-slate-500', textValue: 'text-slate-800', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', percentage: 'text-slate-600' },
};

// --- Helper Components ---

// StatCard for Section 1 & 2
const StatCard = ({ title, value, percentage, icon, onClick, themeKey = 'slate' }: any) => {
    const theme = themes[themeKey];
    return (
        <div 
            onClick={onClick}
            className={`flex flex-col justify-between p-3 rounded-xl border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full group relative overflow-hidden ${theme.bg} ${theme.border}`}
        >
            <div className="flex justify-between items-start z-10 h-full">
                 <div className="flex flex-col justify-between min-w-0 h-full">
                    <p className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-1 truncate ${theme.textTitle}`}>{title}</p>
                    <div className="flex items-baseline gap-1.5 mt-auto">
                        <h3 className={`text-2xl sm:text-3xl font-black leading-none tracking-tight ${theme.textValue}`}>
                            {value.toLocaleString('vi-VN')}
                        </h3>
                        {percentage !== undefined && (
                            <span className={`text-[10px] lg:text-[11px] font-bold ${theme.percentage} opacity-80`}>
                                {percentage}%
                            </span>
                        )}
                    </div>
                 </div>
                 <div className={`p-1.5 lg:p-2 rounded-lg shadow-sm flex-shrink-0 ${theme.iconBg} ${theme.iconColor} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    {React.cloneElement(icon, { className: "h-4 w-4 lg:h-5 lg:w-5" })}
                 </div>
            </div>
        </div>
    );
};

// Brand Centric Card for Section 3
interface BrandData {
    name: string;
    reports: number;
    reportsPercent: string;
    exchange: number;
    exchangePercent: string;
    products: number;
    productsPercent: string;
}

interface BrandPerformanceCardProps {
    data: BrandData;
    onClick: () => void;
}

const BrandPerformanceCard: React.FC<BrandPerformanceCardProps> = ({ data, onClick }) => {
    // Determine styles based on Brand Name
    let styles = {
        borderColor: 'border-slate-200',
        titleColor: 'text-slate-700',
        headerBg: 'bg-slate-50',
        iconBg: 'bg-slate-200 text-slate-600',
        accentColor: 'text-slate-500',
        barColor: 'bg-slate-500',
        lightBg: 'bg-white'
    };
    
    if (data.name === 'HTM') {
        styles = { 
            borderColor: 'border-blue-500', 
            titleColor: 'text-blue-700', 
            headerBg: 'bg-gradient-to-r from-blue-50 to-white', 
            iconBg: 'bg-blue-100 text-blue-600',
            accentColor: 'text-blue-600',
            barColor: 'bg-blue-500',
            lightBg: 'bg-blue-50'
        };
    } else if (data.name === 'VMA') {
        styles = { 
            borderColor: 'border-emerald-500', 
            titleColor: 'text-emerald-700', 
            headerBg: 'bg-gradient-to-r from-emerald-50 to-white', 
            iconBg: 'bg-emerald-100 text-emerald-600',
            accentColor: 'text-emerald-600',
            barColor: 'bg-emerald-500',
            lightBg: 'bg-emerald-50'
        };
    }

    const MetricSection = ({ label, value, percent, className = "", valueSize = "text-3xl" }: any) => (
        <div className={`flex flex-col items-center justify-center h-full w-full group-hover:bg-slate-50/30 transition-colors duration-300 p-2 ${className}`}>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">{label}</p>
            <div className="flex flex-col items-center">
                <span className={`${valueSize} lg:text-5xl font-black tracking-tighter ${styles.titleColor} leading-none mb-1`}>
                    {value.toLocaleString('vi-VN')}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.lightBg} ${styles.accentColor} border border-current/10`}>
                    {percent}%
                </span>
            </div>
        </div>
    );

    return (
        <div 
            onClick={onClick}
            className={`relative flex flex-col h-full rounded-2xl border-[3px] ${styles.borderColor} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white overflow-hidden group`}
        >
             {/* Header */}
             <div className={`px-4 py-3 flex-none flex items-center justify-between border-b border-slate-100 ${styles.headerBg}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${styles.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                        <TagIcon className="h-5 w-5" />
                    </div>
                    <h3 className={`text-xl font-black tracking-tight ${styles.titleColor}`}>{data.name}</h3>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/60 px-2 py-1 rounded-md border border-slate-200/50 backdrop-blur-sm">
                    Hiệu suất
                </div>
             </div>

             {/* Body - Layout: Top Row (1 col), Bottom Row (2 cols) */}
             <div className="flex-1 flex flex-col bg-white min-h-0 divide-y divide-slate-100">
                 {/* Top Row: Total Reports (Takes ~50% height) */}
                 <div className="flex-1 w-full">
                     <MetricSection label="Số báo cáo" value={data.reports} percent={data.reportsPercent} valueSize="text-4xl" />
                 </div>
                 
                 {/* Bottom Row: Exchange & Product Count (Takes ~50% height, split horizontally) */}
                 <div className="flex-1 flex divide-x divide-slate-100">
                     <div className="flex-1">
                         <MetricSection label="Đổi hàng" value={data.exchange} percent={data.exchangePercent} valueSize="text-2xl sm:text-3xl" />
                     </div>
                     <div className="flex-1">
                         <MetricSection label="Sản phẩm lỗi" value={data.products} percent={data.productsPercent} valueSize="text-2xl sm:text-3xl" />
                     </div>
                 </div>
             </div>
        </div>
    );
};

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect }) => {

  // --- Statistics Logic ---
  const stats = useMemo(() => {
    const total = reports.length;
    const totalExchange = reports.reduce((sum, r) => sum + (r.soLuongDoi || 0), 0);
    const totalUniqueProducts = new Set(reports.map(r => r.tenThuongMai + r.nhanHang)).size;
    const uniqueProducts = new Set(reports.map(r => r.tenThuongMai)).size;

    // Helper to get count and percent
    const calc = (filterFn: (r: DefectReport) => boolean) => {
        const count = reports.filter(filterFn).length;
        return {
            count,
            percent: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
        };
    };

    // Section 1: Status
    const sNew = calc(r => r.trangThai === 'Mới');
    const sProcessing = calc(r => r.trangThai === 'Đang xử lý');
    const sUnknown = calc(r => r.trangThai === 'Chưa tìm ra nguyên nhân');
    const sCompleted = calc(r => r.trangThai === 'Hoàn thành');

    // Section 2: Defect Types
    const dProduction = calc(r => r.loaiLoi === 'Lỗi bộ phận sản xuất');
    const dSupplier = calc(r => r.loaiLoi === 'Lỗi Nhà cung cấp');
    const dMixed = calc(r => r.loaiLoi === 'Lỗi vừa sản xuất vừa NCC');
    const dOther = calc(r => r.loaiLoi === 'Lỗi khác');

    // Section 3: Brand Analysis
    const brands = ['HTM', 'VMA']; // Explicitly show these two first
    const brandData = brands.map(brandName => {
        const brandReports = reports.filter(r => r.nhanHang === brandName);
        
        const rCount = brandReports.length;
        const eCount = brandReports.reduce((sum, r) => sum + (r.soLuongDoi || 0), 0);
        const pCount = new Set(brandReports.map(r => r.tenThuongMai)).size;

        return {
            name: brandName,
            reports: rCount,
            reportsPercent: total > 0 ? ((rCount / total) * 100).toFixed(1) : '0',
            exchange: eCount,
            exchangePercent: totalExchange > 0 ? ((eCount / totalExchange) * 100).toFixed(1) : '0',
            products: pCount,
            productsPercent: totalUniqueProducts > 0 ? ((pCount / totalUniqueProducts) * 100).toFixed(1) : '0'
        };
    });
    
    // Handle 'Other' brands if any
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
            productsPercent: totalUniqueProducts > 0 ? ((pCount / totalUniqueProducts) * 100).toFixed(1) : '0'
         });
    }


    // Section 4: Top 5 Products
    const productCounts: Record<string, number> = {};
    reports.forEach(r => {
        productCounts[r.tenThuongMai] = (productCounts[r.tenThuongMai] || 0) + 1;
    });
    const top5 = Object.keys(productCounts)
        .map(key => ({ name: key, quantity: productCounts[key] }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    return {
        total,
        uniqueProducts,
        status: { sNew, sProcessing, sUnknown, sCompleted },
        defect: { dProduction, dSupplier, dMixed, dOther },
        brands: brandData,
        top5
    };
  }, [reports]);

  return (
    <div className="flex flex-col h-full p-3 lg:p-4 gap-3 lg:gap-4 bg-slate-100 overflow-y-auto font-sans text-slate-900">
         
         {/* --- ROW 1: THỐNG KÊ CHUNG --- */}
         <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center px-1">
                <span className="bg-blue-600 text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold mr-2 shadow-sm">1</span>
                THỐNG KÊ CHUNG
            </h2>
            {/* Auto-resize Grid: 2 cols on mobile, 3 on tablet, 6 on large screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatCard 
                    title="Tổng báo cáo" value={stats.total} themeKey="indigo"
                    icon={<DocumentDuplicateIcon/>} 
                    onClick={() => onFilterSelect('all')}
                />
                <StatCard 
                    title="SP Lỗi" value={stats.uniqueProducts} themeKey="cyan"
                    icon={<ShoppingBagIcon/>} 
                    onClick={() => onFilterSelect('all')}
                />
                <StatCard 
                    title="Mới" value={stats.status.sNew.count} percentage={stats.status.sNew.percent} themeKey="blue"
                    icon={<SparklesIcon/>} 
                    onClick={() => onFilterSelect('status', 'Mới')}
                />
                <StatCard 
                    title="Đang xử lý" value={stats.status.sProcessing.count} percentage={stats.status.sProcessing.percent} themeKey="amber"
                    icon={<ClockIcon/>} 
                    onClick={() => onFilterSelect('status', 'Đang xử lý')}
                />
                <StatCard 
                    title="Chưa rõ" value={stats.status.sUnknown.count} percentage={stats.status.sUnknown.percent} themeKey="purple"
                    icon={<QuestionMarkCircleIcon/>} 
                    onClick={() => onFilterSelect('status', 'Chưa tìm ra nguyên nhân')}
                />
                <StatCard 
                    title="Hoàn thành" value={stats.status.sCompleted.count} percentage={stats.status.sCompleted.percent} themeKey="green"
                    icon={<CheckCircleIcon/>} 
                    onClick={() => onFilterSelect('status', 'Hoàn thành')}
                />
            </div>
         </div>

         {/* --- ROW 2: THỐNG KÊ THEO LOẠI LỖI --- */}
         <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center px-1">
                <span className="bg-blue-600 text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold mr-2 shadow-sm">2</span>
                THỐNG KÊ THEO LOẠI LỖI
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-full">
                <StatCard 
                    title="Sản xuất" value={stats.defect.dProduction.count} percentage={stats.defect.dProduction.percent} themeKey="rose"
                    icon={<WrenchIcon/>} 
                    onClick={() => onFilterSelect('defectType', 'Lỗi bộ phận sản xuất')}
                />
                <StatCard 
                    title="Nhà cung cấp" value={stats.defect.dSupplier.count} percentage={stats.defect.dSupplier.percent} themeKey="orange"
                    icon={<TruckIcon/>} 
                    onClick={() => onFilterSelect('defectType', 'Lỗi Nhà cung cấp')}
                />
                <StatCard 
                    title="SX & NCC" value={stats.defect.dMixed.count} percentage={stats.defect.dMixed.percent} themeKey="fuchsia"
                    icon={<CubeIcon/>} 
                    onClick={() => onFilterSelect('defectType', 'Lỗi vừa sản xuất vừa NCC')}
                />
                <StatCard 
                    title="Khác" value={stats.defect.dOther.count} percentage={stats.defect.dOther.percent} themeKey="slate"
                    icon={<QuestionMarkCircleIcon/>} 
                    onClick={() => onFilterSelect('defectType', 'Lỗi khác')}
                />
            </div>
         </div>

         {/* --- ROW 3: THỐNG KÊ THEO NHÃN HÀNG & TOP 5 --- */}
         <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-4 pb-4">
              
              {/* --- SECTION 3: THỐNG KÊ THEO NHÃN HÀNG --- */}
              <div className="lg:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center mb-3 px-1 flex-shrink-0">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold mr-2 shadow-sm">3</span>
                        THỐNG KÊ THEO NHÃN HÀNG
                    </h2>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[240px] lg:min-h-0">
                        {stats.brands.map((brand, idx) => (
                            <BrandPerformanceCard 
                                key={idx} 
                                data={brand} 
                                onClick={() => onFilterSelect('brand', brand.name)} 
                            />
                        ))}
                        {stats.brands.length === 0 && <div className="text-center text-slate-400 col-span-2 self-center">Chưa có dữ liệu nhãn hàng</div>}
                    </div>
              </div>

              {/* --- SECTION 4: TOP 5 SẢN PHẨM LỖI --- */}
              <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[300px] lg:min-h-0">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center mb-3 px-1 flex-shrink-0">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold mr-2 shadow-sm">4</span>
                        TOP 5 SẢN PHẨM LỖI
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                         <div className="space-y-2">
                            {stats.top5.map((item, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => onFilterSelect('search', item.name)}
                                    className="flex items-center p-2.5 rounded-xl hover:bg-blue-50 cursor-pointer group transition-all duration-200 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-slate-50/30"
                                >
                                    <div className="flex-shrink-0 mr-3">
                                         <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-sm border ${
                                             index === 0 ? 'bg-yellow-400 text-yellow-900 border-yellow-300' : 
                                             index === 1 ? 'bg-slate-300 text-slate-800 border-slate-300' : 
                                             index === 2 ? 'bg-orange-400 text-orange-900 border-orange-300' : 
                                             'bg-white text-slate-500 border-slate-200'
                                         }`}>
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors" title={item.name}>
                                            {item.name}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-xs font-extrabold border border-red-100">
                                            {item.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {stats.top5.length === 0 && (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Chưa có dữ liệu thống kê</div>
                            )}
                         </div>
                    </div>
              </div>
         </div>
    </div>
  );
}

export default DashboardReport;
