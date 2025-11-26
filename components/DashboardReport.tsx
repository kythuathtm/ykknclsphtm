
import React, { useMemo, useState } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, SparklesIcon, 
    ShoppingBagIcon, TagIcon, XIcon, ListBulletIcon, BuildingStoreIcon, UserGroupIcon,
    TruckIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
  onSelectReport: (report: DefectReport) => void;
}

// --- COMPONENTS CON ---

// 1. StatCard (Gradient Design: Title TL, Icon TR, Value Center, % Bottom)
const StatCard = React.memo(({ title, value, percentage, icon, onClick, gradient, isActive, subLabel }: any) => {
    return (
        <div 
            onClick={onClick}
            className={`relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 h-full min-h-[160px] group overflow-hidden active:scale-[0.98] will-change-transform shadow-lg hover:shadow-xl bg-gradient-to-br ${gradient} ${isActive ? 'ring-4 ring-offset-2 ring-blue-300 transform -translate-y-1' : 'hover:-translate-y-1'}`}
        >
            {/* Background Effects */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-60"></div>

            {/* Top Row: Title Left, Icon Right */}
            <div className="flex justify-between items-start z-10 relative mb-2">
                 <p className="text-[11px] font-bold text-white/90 uppercase tracking-wider leading-tight max-w-[70%]">{title}</p>
                 <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white shadow-sm ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {React.cloneElement(icon, { className: "h-5 w-5" })}
                 </div>
            </div>
            
            {/* Center: Big Number */}
            <div className="z-10 flex-1 flex flex-col justify-center items-center">
                <h3 className="text-4xl font-bold text-white tracking-tight leading-none drop-shadow-sm">
                    {value.toLocaleString('vi-VN')}
                </h3>
                 {subLabel && <p className="text-xs text-white/80 font-bold mt-1">{subLabel}</p>}
            </div>
            
            {/* Bottom: Percentage */}
            <div className="z-10 mt-auto flex justify-center pt-2">
                 {percentage !== undefined && (
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-sm flex items-center gap-1">
                        {percentage}%
                    </span>
                 )}
            </div>
        </div>
    );
});

// 2. Status Donut Chart (1.2 Tình trạng xử lý)
const StatusDonutChart = ({ data, onFilter }: { data: any, onFilter: any }) => {
    // Calculate SVG paths
    const size = 160;
    const strokeWidth = 20;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercent = 0;
    
    // Order: Mới -> Đang xử lý -> Chưa rõ -> Hoàn thành
    const segments = [
        { key: 'sNew', label: 'Mới', color: '#3B82F6', count: data.sNew.count, percent: Number(data.sNew.percent), rawKey: 'Mới' },
        { key: 'sProcessing', label: 'Đang xử lý', color: '#F59E0B', count: data.sProcessing.count, percent: Number(data.sProcessing.percent), rawKey: 'Đang xử lý' },
        { key: 'sUnknown', label: 'Chưa rõ', color: '#8B5CF6', count: data.sUnknown.count, percent: Number(data.sUnknown.percent), rawKey: 'Chưa tìm ra nguyên nhân' },
        { key: 'sCompleted', label: 'Hoàn thành', color: '#10B981', count: data.sCompleted.count, percent: Number(data.sCompleted.percent), rawKey: 'Hoàn thành' },
    ].filter(s => s.count > 0); // Only render segments with data

    // If no data
    if (segments.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-soft">
                <ClockIcon className="h-10 w-10 mb-2 opacity-20"/>
                <span className="text-sm font-bold">Chưa có dữ liệu</span>
            </div>
        );
    }

    const totalCount = segments.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1.2. Tình trạng xử lý</h2>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-8">
                {/* SVG Chart */}
                <div className="relative w-40 h-40 shrink-0">
                     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                        {/* Background Circle */}
                        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#F1F5F9" strokeWidth={strokeWidth} />
                        
                        {/* Segments */}
                        {segments.map((seg, i) => {
                            const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
                            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                            accumulatedPercent += seg.percent;

                            return (
                                <circle
                                    key={i}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round" // Rounded edges
                                    className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                                    onClick={() => onFilter('status', seg.rawKey)}
                                >
                                    <title>{seg.label}: {seg.count} ({Math.round(seg.percent)}%)</title>
                                </circle>
                            );
                        })}
                     </svg>
                     {/* Center Text */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-xs text-slate-400 font-bold uppercase">Tổng</span>
                         <span className="text-2xl font-bold text-slate-700">
                             {totalCount}
                         </span>
                     </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {segments.map((seg) => (
                        <div 
                            key={seg.key} 
                            onClick={() => onFilter('status', seg.rawKey)}
                            className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group w-full"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: seg.color }}></span>
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{seg.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{seg.count}</span>
                                <span className="text-[10px] font-bold text-slate-400 w-8 text-right">({Math.round(seg.percent)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 3. Origin Bar Chart (1.3 Nguồn gốc lỗi)
const OriginBarChart = ({ data, onFilter }: { data: any, onFilter: any }) => {
    const categories = [
        { label: 'Sản xuất', count: data.dProduction.count, percent: Number(data.dProduction.percent), color: 'bg-rose-500', rawKey: 'Lỗi Sản xuất' },
        { label: 'Nhà cung cấp', count: data.dSupplier.count, percent: Number(data.dSupplier.percent), color: 'bg-orange-500', rawKey: 'Lỗi Nhà cung cấp' },
        { label: 'Hỗn hợp', count: data.dMixed.count, percent: Number(data.dMixed.percent), color: 'bg-fuchsia-500', rawKey: 'Lỗi Hỗn hợp' },
        { label: 'Khác', count: data.dOther.count, percent: Number(data.dOther.percent), color: 'bg-slate-500', rawKey: 'Lỗi Khác' },
    ];

    const maxCount = Math.max(...categories.map(c => c.count)) || 1;

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1.3. Nguồn gốc lỗi</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-5">
                {categories.map((cat, index) => (
                    <div 
                        key={index} 
                        onClick={() => onFilter('defectType', cat.rawKey)}
                        className="group cursor-pointer"
                    >
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{cat.label}</span>
                            <div className="flex gap-1 items-baseline">
                                <span className="text-sm font-bold text-slate-800">{cat.count}</span>
                                <span className="text-[10px] text-slate-400">({Math.round(cat.percent)}%)</span>
                            </div>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${cat.color} transition-all duration-700 ease-out group-hover:brightness-110 shadow-sm`}
                                style={{ width: `${(cat.count / maxCount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {categories.every(c => c.count === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                         <span className="text-sm font-bold italic">Chưa có dữ liệu</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. Brand Card (1.4 Nhãn hàng)
const BrandPerformanceCard = React.memo(({ data, onClick }: { data: any; onClick: () => void }) => {
    let theme = {
        border: 'border-slate-100',
        text: 'text-slate-700',
        bg: 'bg-slate-50',
        accent: 'text-slate-500',
        barMain: 'bg-slate-500',
        ring: 'hover:ring-slate-100'
    };
    
    if (data.name === 'HTM') {
        theme = { 
            border: 'border-blue-100', 
            text: 'text-blue-700', 
            bg: 'bg-blue-50/50', 
            accent: 'text-blue-600', 
            barMain: 'bg-blue-600', 
            ring: 'hover:ring-blue-100'
        };
    } else if (data.name === 'VMA') {
        theme = { 
            border: 'border-emerald-100', 
            text: 'text-emerald-700', 
            bg: 'bg-emerald-50/50', 
            accent: 'text-emerald-600', 
            barMain: 'bg-emerald-600', 
            ring: 'hover:ring-emerald-100'
        };
    }

    // Sub-stat Item
    const StatItem = ({ label, value, subValue, color }: any) => (
        <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 text-center">{label}</span>
            <span className={`text-xl font-bold ${color}`}>{value}</span>
            {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
        </div>
    );

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col rounded-2xl bg-white border ${theme.border} shadow-soft hover:shadow-lg hover:-translate-y-1 hover:ring-2 ${theme.ring} transition-all duration-300 cursor-pointer overflow-hidden group h-full active:scale-[0.98]`}
        >
             <div className={`px-5 py-3 border-b border-slate-50 ${theme.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5`}>
                        <TagIcon className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <h3 className={`text-lg font-bold tracking-tight ${theme.text}`}>{data.name}</h3>
                </div>
             </div>

             <div className="p-4 grid grid-cols-3 gap-3 bg-slate-50/30 flex-1">
                 <StatItem label="Phản ánh" value={data.reports} subValue={`${data.reportsPercent}%`} color={theme.text} />
                 <StatItem label="SP Lỗi" value={data.products} subValue="Mã" color="text-amber-600" />
                 <StatItem label="Đã đổi" value={data.exchange} subValue="Cái" color="text-rose-600" />
             </div>
        </div>
    );
});

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport }) => {
  const [activeFilter, setActiveFilter] = useState<{ type: 'status' | 'defectType' | 'all' | 'brand', value?: string } | null>(null);

  const stats = useMemo(() => {
    const total = reports.length;
    
    // Sets for counting UNIQUE entities (1.1.2, 1.1.3, 1.1.4)
    const uniqueProductsSet = new Set<string>(); // Sản phẩm lỗi (theo Tên TM)
    const uniqueSuppliersSet = new Set<string>(); // Nhà phân phối
    const uniqueUnitsSet = new Set<string>(); // Đơn vị sử dụng
    
    const counts = {
        sNew: 0, sProcessing: 0, sUnknown: 0, sCompleted: 0,
        dProduction: 0, dSupplier: 0, dMixed: 0, dOther: 0,
        // Brand logic
        brandHTM: { r: 0, e: 0, pSet: new Set<string>() },
        brandVMA: { r: 0, e: 0, pSet: new Set<string>() },
        brandOther: { r: 0, e: 0, pSet: new Set<string>() },
        productCounts: {} as Record<string, number>
    };

    for (const r of reports) {
        uniqueProductsSet.add(r.tenThuongMai);
        if (r.nhaPhanPhoi) uniqueSuppliersSet.add(r.nhaPhanPhoi.trim());
        if (r.donViSuDung) uniqueUnitsSet.add(r.donViSuDung.trim());

        // Top 5 calculation base
        counts.productCounts[r.tenThuongMai] = (counts.productCounts[r.tenThuongMai] || 0) + 1;

        // 1.2 Status
        if (r.trangThai === 'Mới') counts.sNew++;
        else if (r.trangThai === 'Đang xử lý') counts.sProcessing++;
        else if (r.trangThai === 'Chưa tìm ra nguyên nhân') counts.sUnknown++;
        else if (r.trangThai === 'Hoàn thành') counts.sCompleted++;

        // 1.3 Defect Type
        const l = (r.loaiLoi || '') as string;
        if (l === 'Lỗi Sản xuất' || l === 'Lỗi bộ phận sản xuất') counts.dProduction++;
        else if (l === 'Lỗi Nhà cung cấp') counts.dSupplier++;
        else if (l === 'Lỗi Hỗn hợp' || l === 'Lỗi vừa sản xuất vừa NCC') counts.dMixed++;
        else if (l === 'Lỗi Khác' || l === 'Lỗi khác') counts.dOther++;

        // 1.4 Brand Data Aggregation
        if (r.nhanHang === 'HTM') {
            counts.brandHTM.r++;
            counts.brandHTM.e += (r.soLuongDoi || 0);
            counts.brandHTM.pSet.add(r.tenThuongMai);
        } else if (r.nhanHang === 'VMA') {
            counts.brandVMA.r++;
            counts.brandVMA.e += (r.soLuongDoi || 0);
            counts.brandVMA.pSet.add(r.tenThuongMai);
        } else {
            counts.brandOther.r++;
            counts.brandOther.e += (r.soLuongDoi || 0);
            counts.brandOther.pSet.add(r.tenThuongMai);
        }
    }

    const getPct = (val: number, base: number) => base > 0 ? ((val / base) * 100).toFixed(1) : '0';

    const buildBrandStats = (name: string, data: typeof counts.brandHTM) => ({
        name,
        reports: data.r,
        reportsPercent: getPct(data.r, total),
        exchange: data.e,
        products: data.pSet.size, // Unique defective products for this brand
    });

    const brands = [
        buildBrandStats('HTM', counts.brandHTM),
        buildBrandStats('VMA', counts.brandVMA)
    ];
    if (counts.brandOther.r > 0) {
        brands.push(buildBrandStats('Khác', counts.brandOther));
    }

    // 1.5 Top 5 Products
    const top5 = Object.keys(counts.productCounts)
        .map(key => ({ name: key, quantity: counts.productCounts[key] }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    return {
        total,
        uniqueProducts: uniqueProductsSet.size,
        totalSuppliers: uniqueSuppliersSet.size,
        totalUnits: uniqueUnitsSet.size,
        status: {
            sNew: { count: counts.sNew, percent: getPct(counts.sNew, total) },
            sProcessing: { count: counts.sProcessing, percent: getPct(counts.sProcessing, total) },
            sUnknown: { count: counts.sUnknown, percent: getPct(counts.sUnknown, total) },
            sCompleted: { count: counts.sCompleted, percent: getPct(counts.sCompleted, total) }
        },
        defect: {
            dProduction: { count: counts.dProduction, percent: getPct(counts.dProduction, total) },
            dSupplier: { count: counts.dSupplier, percent: getPct(counts.dSupplier, total) },
            dMixed: { count: counts.dMixed, percent: getPct(counts.dMixed, total) },
            dOther: { count: counts.dOther, percent: getPct(counts.dOther, total) }
        },
        brands,
        top5
    };
  }, [reports]);

  const handleCardClick = (type: 'status' | 'defectType' | 'all' | 'brand', value?: string) => {
      setActiveFilter({ type, value });
  };

  const filteredReportsForTable = useMemo(() => {
      if (!activeFilter) return [];
      const result = reports.filter(r => {
          if (activeFilter.type === 'status') return r.trangThai === activeFilter.value;
          if (activeFilter.type === 'defectType') return r.loaiLoi === activeFilter.value;
          if (activeFilter.type === 'brand') return r.nhanHang === activeFilter.value;
          return true;
      });
      return result.slice(0, 100);
  }, [reports, activeFilter]);

  const totalFilteredCount = useMemo(() => {
      if (!activeFilter) return 0;
      return reports.filter(r => {
           if (activeFilter.type === 'status') return r.trangThai === activeFilter.value;
           if (activeFilter.type === 'defectType') return r.loaiLoi === activeFilter.value;
           if (activeFilter.type === 'brand') return r.nhanHang === activeFilter.value;
           return true;
      }).length;
  }, [reports, activeFilter]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 custom-scrollbar">
             
             {/* 1.1 TỔNG QUAN */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pl-1">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1.1. Tổng quan</h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        title="TỔNG PHẢN ÁNH" 
                        value={stats.total} 
                        gradient="from-blue-600 to-indigo-600"
                        icon={<DocumentDuplicateIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={activeFilter?.type === 'all'}
                    />
                    <StatCard 
                        title="SẢN PHẨM LỖI" 
                        value={stats.uniqueProducts} 
                        subLabel="Mã sản phẩm"
                        gradient="from-rose-500 to-pink-600"
                        icon={<ShoppingBagIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={false} 
                    />
                    <StatCard 
                        title="NHÀ PHÂN PHỐI" 
                        value={stats.totalSuppliers} 
                        gradient="from-orange-500 to-amber-500"
                        icon={<TruckIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={false} 
                    />
                    <StatCard 
                        title="ĐƠN VỊ SỬ DỤNG" 
                        value={stats.totalUnits} 
                        gradient="from-emerald-500 to-teal-500"
                        icon={<UserGroupIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={false} 
                    />
                </div>
             </div>

             {/* 1.2 & 1.3: CHART SECTION (NEW) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
                 {/* 1.2 Status Chart */}
                 <div className="h-full">
                     <StatusDonutChart data={stats.status} onFilter={handleCardClick} />
                 </div>
                 
                 {/* 1.3 Origin Chart */}
                 <div className="h-full">
                     <OriginBarChart data={stats.defect} onFilter={handleCardClick} />
                 </div>
             </div>

             {/* 1.4 & 1.5: NHÃN HÀNG & TOP SẢN PHẨM */}
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[350px]">
                  {/* 1.4 Nhãn hàng */}
                  <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                        <div className="flex items-center gap-3 pl-1">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1.4. Nhãn hàng</h2>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                            {stats.brands.map((brand, idx) => (
                                <BrandPerformanceCard key={idx} data={brand} onClick={() => handleCardClick('brand', brand.name)} />
                            ))}
                        </div>
                  </div>

                  {/* 1.5 Top 5 */}
                  <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                        <div className="flex items-center gap-3 pl-1">
                            <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1.5. Top 5 Sản phẩm lỗi</h2>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex-1 flex flex-col overflow-hidden h-full ring-1 ring-slate-50">
                             <div className="flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar pr-1">
                                {stats.top5.map((item, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => onFilterSelect('search', item.name)}
                                        className="flex items-center p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all border border-transparent hover:border-slate-200 active:scale-[0.98] will-change-transform"
                                    >
                                        <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shadow-sm border mr-3 transition-transform group-hover:scale-110 ${
                                                index === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-yellow-100' : 
                                                index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                                                index === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                                'bg-white text-slate-400 border-slate-100'
                                        }`}>
                                            <span className="font-bold">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                                {item.name}
                                            </p>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-blue-500 h-full rounded-full opacity-80 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                                    style={{ width: `${Math.min((item.quantity / (stats.top5[0]?.quantity || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md ml-3 border border-slate-200 min-w-[32px] text-center group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                            {item.quantity}
                                        </span>
                                    </div>
                                ))}
                                {stats.top5.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                        <ShoppingBagIcon className="w-12 h-12 opacity-20" />
                                        <span className="text-sm font-bold italic">Chưa có dữ liệu</span>
                                    </div>
                                )}
                             </div>
                        </div>
                  </div>
             </div>
        </div>

        {/* MODAL WINDOW FOR DRILL-DOWN LIST */}
        {activeFilter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up ring-1 ring-white/20">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
                                <ListBulletIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                                    DANH SÁCH CHI TIẾT
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-bold text-slate-500">Bộ lọc:</span>
                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase shadow-sm border border-blue-200">
                                        {activeFilter.value || 'TẤT CẢ'}
                                    </span>
                                    <span className="text-sm text-slate-300 mx-1">•</span>
                                    <span className="text-sm font-bold text-slate-700">
                                        {totalFilteredCount} kết quả
                                    </span>
                                    {totalFilteredCount > 100 && (
                                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-2 font-bold uppercase tracking-wide">
                                            100 mới nhất
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveFilter(null)} 
                            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Modal Content (Table) */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar p-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-50">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-32 tracking-wider">Ngày</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-40 tracking-wider">Mã SP</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Sản phẩm</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-48 tracking-wider">Phân loại lỗi</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-40 tracking-wider">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {filteredReportsForTable.map(r => (
                                        <tr 
                                            key={r.id} 
                                            onClick={() => onSelectReport(r)} 
                                            className="hover:bg-blue-50/50 cursor-pointer transition-colors group odd:bg-white even:bg-slate-50/30"
                                        >
                                            <td className="px-6 py-4 text-sm text-slate-600 font-bold whitespace-nowrap">
                                                {new Date(r.ngayPhanAnh).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap group-hover:text-blue-600 transition-colors">
                                                <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 group-hover:border-blue-200 group-hover:bg-white transition-colors shadow-sm">{r.maSanPham}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-bold leading-relaxed">
                                                {r.tenThuongMai}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap font-bold">
                                                {r.loaiLoi || <span className="text-slate-300 italic">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${r.trangThai === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : r.trangThai === 'Mới' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                    {r.trangThai.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReportsForTable.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                                <div className="flex flex-col items-center gap-3">
                                                    <ListBulletIcon className="w-12 h-12 opacity-10" />
                                                    <span className="font-bold">Không có dữ liệu cho bộ lọc này.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default React.memo(DashboardReport);
