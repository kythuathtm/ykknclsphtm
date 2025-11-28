import React, { useMemo, useState } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, SparklesIcon, 
    ShoppingBagIcon, TagIcon, XIcon, ListBulletIcon, UserGroupIcon,
    TruckIcon, ChartPieIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
  onSelectReport: (report: DefectReport) => void;
}

// --- COMPONENTS ---

// 1. StatCard (Redesigned: Clean, Big Number, Icon Accent with Glass Texture)
const StatCard = React.memo(({ title, value, percentage, icon, onClick, gradient, isActive, subLabel, className }: any) => {
    return (
        <div 
            onClick={onClick}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 h-full min-h-[160px] group overflow-hidden active:scale-[0.98] shadow-soft hover:shadow-xl bg-gradient-to-br ${gradient} ${isActive ? 'ring-4 ring-offset-2 ring-blue-300' : ''} ${className || ''}`}
        >
            {/* Background Decor - Glassmorphism Texture */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiLz4KPC9zdmc+')] mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <p className="text-xs font-bold text-white/90 uppercase tracking-widest mb-1 drop-shadow-sm">{title}</p>
                        {subLabel && <span className="text-[10px] font-bold text-white/80 bg-black/10 px-2 py-0.5 rounded w-fit backdrop-blur-sm">{subLabel}</span>}
                    </div>
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/20 text-white transform group-hover:rotate-12 transition-transform duration-300">
                        {React.cloneElement(icon, { className: "h-6 w-6" })}
                    </div>
                </div>

                <div className="flex items-end justify-between mt-4">
                    <h3 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-none drop-shadow-md">
                        {value.toLocaleString('vi-VN')}
                    </h3>
                    {percentage !== undefined && (
                        <div className="flex items-center bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 mb-1 shadow-sm">
                            <span className="text-sm font-bold text-white">{percentage}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

// 2. Status Donut Chart (Trạng thái xử lý - No 'Total' text)
const StatusDonutChart = ({ data, onFilter }: { data: any, onFilter: any }) => {
    const size = 180;
    const strokeWidth = 22;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;
    
    const segments = [
        { key: 'sNew', label: 'Mới', color: '#3B82F6', count: data.sNew.count, percent: Number(data.sNew.percent), rawKey: 'Mới' },
        { key: 'sProcessing', label: 'Đang xử lý', color: '#F59E0B', count: data.sProcessing.count, percent: Number(data.sProcessing.percent), rawKey: 'Đang xử lý' },
        { key: 'sUnknown', label: 'Chưa rõ', color: '#8B5CF6', count: data.sUnknown.count, percent: Number(data.sUnknown.percent), rawKey: 'Chưa tìm ra nguyên nhân' },
        { key: 'sCompleted', label: 'Hoàn thành', color: '#10B981', count: data.sCompleted.count, percent: Number(data.sCompleted.percent), rawKey: 'Hoàn thành' },
    ].filter(s => s.count > 0);

    const totalCount = segments.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                    <ClockIcon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">TRẠNG THÁI XỬ LÝ</h2>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-8">
                <div className="relative w-48 h-48 shrink-0 group">
                     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-lg">
                        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#F8FAFC" strokeWidth={strokeWidth} />
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
                                    strokeLinecap="round"
                                    className="transition-all duration-300 hover:opacity-80 cursor-pointer hover:stroke-[24]"
                                    onClick={() => onFilter('status', seg.rawKey)}
                                >
                                    <title>{seg.label}: {seg.count} ({Math.round(seg.percent)}%)</title>
                                </circle>
                            );
                        })}
                     </svg>
                     {/* Center Number ONLY */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-6xl font-extrabold text-slate-800 leading-none tracking-tight">
                             {totalCount}
                         </span>
                     </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto flex-1">
                    {segments.map((seg) => (
                        <div 
                            key={seg.key} 
                            onClick={() => onFilter('status', seg.rawKey)}
                            className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group w-full border border-transparent hover:border-slate-200 active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: seg.color }}></span>
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{seg.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-extrabold text-slate-800">{seg.count}</span>
                                <span className="text-xs font-bold text-slate-400 min-w-[35px] text-right bg-slate-100 px-1.5 py-0.5 rounded">
                                    {Math.round(seg.percent)}%
                                </span>
                            </div>
                        </div>
                    ))}
                    {segments.length === 0 && (
                        <div className="text-center text-slate-400 italic text-sm py-4">Chưa có dữ liệu</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 3. Origin Bar Chart (Nguồn gốc lỗi)
const OriginBarChart = ({ data, onFilter }: { data: any, onFilter: any }) => {
    const categories = [
        { label: 'Sản xuất', count: data.dProduction.count, percent: Number(data.dProduction.percent), color: 'bg-rose-500', barColor: 'bg-rose-500', rawKey: 'Lỗi Sản xuất' },
        { label: 'Nhà cung cấp', count: data.dSupplier.count, percent: Number(data.dSupplier.percent), color: 'bg-orange-500', barColor: 'bg-orange-500', rawKey: 'Lỗi Nhà cung cấp' },
        { label: 'Hỗn hợp', count: data.dMixed.count, percent: Number(data.dMixed.percent), color: 'bg-fuchsia-500', barColor: 'bg-fuchsia-500', rawKey: 'Lỗi Hỗn hợp' },
        { label: 'Khác', count: data.dOther.count, percent: Number(data.dOther.percent), color: 'bg-slate-500', barColor: 'bg-slate-500', rawKey: 'Lỗi Khác' },
    ];

    const maxCount = Math.max(...categories.map(c => c.count)) || 1;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                    <ChartPieIcon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">NGUỒN GỐC LỖI</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-6">
                {categories.map((cat, index) => (
                    <div 
                        key={index} 
                        onClick={() => onFilter('defectType', cat.rawKey)}
                        className="group cursor-pointer"
                    >
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-sm ${cat.barColor}`}></span>
                                {cat.label}
                            </span>
                            <div className="flex gap-2 items-baseline">
                                <span className="text-xl font-extrabold text-slate-800">{cat.count}</span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                    {Math.round(cat.percent)}%
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-50 relative">
                            <div 
                                className={`h-full rounded-full ${cat.color} transition-all duration-1000 ease-out group-hover:brightness-110 shadow-sm relative overflow-hidden`}
                                style={{ width: `${(cat.count / maxCount) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
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

// 4. Brand Card (Redesigned: 3 Columns)
const BrandPerformanceCard = React.memo(({ data, onClick }: { data: any; onClick: () => void }) => {
    let theme = {
        border: 'border-slate-100',
        text: 'text-slate-700',
        bg: 'bg-slate-50',
        accent: 'text-slate-500',
        subText: 'text-slate-500',
        ring: 'hover:ring-slate-200'
    };
    
    if (data.name === 'HTM') {
        theme = { 
            border: 'border-blue-100', 
            text: 'text-blue-700', 
            bg: 'bg-blue-50', 
            accent: 'text-blue-600', 
            subText: 'text-blue-500',
            ring: 'hover:ring-blue-200'
        };
    } else if (data.name === 'VMA') {
        theme = { 
            border: 'border-emerald-100', 
            text: 'text-emerald-700', 
            bg: 'bg-emerald-50', 
            accent: 'text-emerald-600', 
            subText: 'text-emerald-500',
            ring: 'hover:ring-emerald-200'
        };
    }

    const StatColumn = ({ title, value, percent, colorClass }: any) => (
        <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/50 transition-colors">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{title}</span>
            <span className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${colorClass} leading-tight`}>{value}</span>
            <span className="text-xs font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-full mt-1 shadow-sm">
                {percent}%
            </span>
        </div>
    );

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col rounded-2xl bg-white border ${theme.border} shadow-soft hover:shadow-xl hover:-translate-y-1 hover:ring-2 ${theme.ring} transition-all duration-300 cursor-pointer overflow-hidden group h-full active:scale-[0.98]`}
        >
             <div className={`px-5 py-4 border-b border-white ${theme.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5`}>
                        <TagIcon className={`h-6 w-6 ${theme.accent}`} />
                    </div>
                    <h3 className={`text-xl font-extrabold tracking-tight ${theme.text} uppercase`}>{data.name}</h3>
                </div>
                <div className="p-1.5 rounded-lg bg-white/50 hover:bg-white transition-colors">
                    <ListBulletIcon className={`h-5 w-5 ${theme.subText}`} />
                </div>
             </div>

             <div className="p-4 grid grid-cols-3 gap-0 divide-x divide-slate-100 flex-1 items-center">
                 <StatColumn title="Phản ánh" value={data.reports} percent={data.reportsPercent} colorClass={theme.text} />
                 <StatColumn title="SP Lỗi" value={data.products} percent={data.productsPercent} colorClass="text-amber-600" />
                 <StatColumn title="Đã đổi" value={data.exchange} percent={data.exchangePercent} colorClass="text-rose-600" />
             </div>
        </div>
    );
});

// Helper for list view table
const SimpleListView = ({ title, data, type }: { title: string, data: { name: string, count: number }[], type: 'Product' | 'Supplier' | 'Unit' }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-50 h-full flex flex-col">
            <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{title}</h3>
                <span className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 shadow-sm flex items-center gap-2">
                    Tổng: <span className="text-lg font-extrabold text-blue-600">{data.length}</span>
                </span>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-16">STT</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tên {type === 'Product' ? 'Sản phẩm' : type === 'Supplier' ? 'Nhà phân phối' : 'Đơn vị'}</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Số phản ánh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                        {data.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-400 font-bold">{idx + 1}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.name}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-sm font-extrabold rounded-md border border-slate-200 min-w-[40px] text-center">
                                        {item.count}
                                    </span>
                                </td>
                            </tr>
                        ))}
                         {data.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic text-sm">Chưa có dữ liệu</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport }) => {
  const [activeFilter, setActiveFilter] = useState<{ type: 'status' | 'defectType' | 'all' | 'brand' | 'productList' | 'supplierList' | 'unitList', value?: string } | null>(null);

  const stats = useMemo(() => {
    const totalReports = reports.length;
    
    // Global Totals
    let totalExchange = 0;
    const globalProductSet = new Set<string>();

    reports.forEach(r => {
        totalExchange += (r.soLuongDoi || 0);
        if(r.maSanPham) globalProductSet.add(r.maSanPham);
    });
    const totalUniqueProducts = globalProductSet.size;

    // Counters for Lists (Name -> Count)
    const productCounts: Record<string, number> = {};
    const supplierCounts: Record<string, number> = {};
    const unitCounts: Record<string, number> = {};
    
    const counts = {
        sNew: 0, sProcessing: 0, sUnknown: 0, sCompleted: 0,
        dProduction: 0, dSupplier: 0, dMixed: 0, dOther: 0,
        // Brand logic
        brandHTM: { r: 0, e: 0, pSet: new Set<string>() },
        brandVMA: { r: 0, e: 0, pSet: new Set<string>() },
        brandOther: { r: 0, e: 0, pSet: new Set<string>() },
    };

    for (const r of reports) {
        // Aggregate for lists
        if (r.tenThuongMai) productCounts[r.tenThuongMai] = (productCounts[r.tenThuongMai] || 0) + 1;
        if (r.nhaPhanPhoi) supplierCounts[r.nhaPhanPhoi] = (supplierCounts[r.nhaPhanPhoi] || 0) + 1;
        if (r.donViSuDung) unitCounts[r.donViSuDung] = (unitCounts[r.donViSuDung] || 0) + 1;

        // 1.2 Status
        if (r.trangThai === 'Mới') counts.sNew++;
        else if (r.trangThai === 'Đang xử lý') counts.sProcessing++;
        else if (r.trangThai === 'Chưa tìm ra nguyên nhân') counts.sUnknown++;
        else if (r.trangThai === 'Hoàn thành') counts.sCompleted++;

        // 1.3 Defect Type (Updated Nomenclature: Nguồn gốc lỗi)
        const l = (r.loaiLoi || '') as string;
        if (l === 'Lỗi Sản xuất' || l === 'Lỗi bộ phận sản xuất') counts.dProduction++;
        else if (l === 'Lỗi Nhà cung cấp') counts.dSupplier++;
        else if (l === 'Lỗi Hỗn hợp' || l === 'Lỗi vừa sản xuất vừa NCC') counts.dMixed++;
        else if (l === 'Lỗi Khác' || l === 'Lỗi khác') counts.dOther++;

        // 1.4 Brand Data Aggregation
        if (r.nhanHang === 'HTM') {
            counts.brandHTM.r++;
            counts.brandHTM.e += (r.soLuongDoi || 0);
            if(r.maSanPham) counts.brandHTM.pSet.add(r.maSanPham);
        } else if (r.nhanHang === 'VMA') {
            counts.brandVMA.r++;
            counts.brandVMA.e += (r.soLuongDoi || 0);
            if(r.maSanPham) counts.brandVMA.pSet.add(r.maSanPham);
        } else {
            counts.brandOther.r++;
            counts.brandOther.e += (r.soLuongDoi || 0);
            if(r.maSanPham) counts.brandOther.pSet.add(r.maSanPham);
        }
    }

    // Transform Counts to Arrays for Lists
    const productList = Object.entries(productCounts).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count);
    const supplierList = Object.entries(supplierCounts).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count);
    const unitList = Object.entries(unitCounts).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count);

    const getPct = (val: number, base: number) => base > 0 ? ((val / base) * 100).toFixed(1) : '0';

    const buildBrandStats = (name: string, data: typeof counts.brandHTM) => ({
        name,
        reports: data.r,
        reportsPercent: getPct(data.r, totalReports),
        exchange: data.e,
        exchangePercent: getPct(data.e, totalExchange),
        products: data.pSet.size, // Unique defective products for this brand
        productsPercent: getPct(data.pSet.size, totalUniqueProducts)
    });

    const brands = [
        buildBrandStats('HTM', counts.brandHTM),
        buildBrandStats('VMA', counts.brandVMA)
    ];
    if (counts.brandOther.r > 0) {
        brands.push(buildBrandStats('Khác', counts.brandOther));
    }

    // 1.5 Top 5 Products (reuse productList)
    const top5 = productList.slice(0, 5).map(p => ({ name: p.name, quantity: p.count }));

    return {
        total: totalReports,
        uniqueProducts: productList.length, // Unique Product Names reported
        totalSuppliers: supplierList.length,
        totalUnits: unitList.length,
        lists: {
            products: productList,
            suppliers: supplierList,
            units: unitList
        },
        status: {
            sNew: { count: counts.sNew, percent: getPct(counts.sNew, totalReports) },
            sProcessing: { count: counts.sProcessing, percent: getPct(counts.sProcessing, totalReports) },
            sUnknown: { count: counts.sUnknown, percent: getPct(counts.sUnknown, totalReports) },
            sCompleted: { count: counts.sCompleted, percent: getPct(counts.sCompleted, totalReports) }
        },
        defect: {
            dProduction: { count: counts.dProduction, percent: getPct(counts.dProduction, totalReports) },
            dSupplier: { count: counts.dSupplier, percent: getPct(counts.dSupplier, totalReports) },
            dMixed: { count: counts.dMixed, percent: getPct(counts.dMixed, totalReports) },
            dOther: { count: counts.dOther, percent: getPct(counts.dOther, totalReports) }
        },
        brands,
        top5
    };
  }, [reports]);

  const handleCardClick = (type: 'status' | 'defectType' | 'all' | 'brand' | 'productList' | 'supplierList' | 'unitList', value?: string) => {
      if (type === 'all') {
          onFilterSelect('all'); 
      } else {
          setActiveFilter({ type, value });
      }
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

  // Determine Modal Content based on filter type
  const renderModalContent = () => {
      if (!activeFilter) return null;

      if (activeFilter.type === 'productList') {
          return <SimpleListView title="Danh sách Sản phẩm lỗi" data={stats.lists.products} type="Product" />;
      }
      if (activeFilter.type === 'supplierList') {
          return <SimpleListView title="Danh sách Nhà phân phối phản ánh" data={stats.lists.suppliers} type="Supplier" />;
      }
      if (activeFilter.type === 'unitList') {
          return <SimpleListView title="Danh sách Đơn vị sử dụng" data={stats.lists.units} type="Unit" />;
      }

      // Default: Report List Table (for Status, Origin, Brand drilldown)
      return (
        <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-50">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 w-32 tracking-wider">Ngày</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 w-40 tracking-wider">Mã SP</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider">Tên Sản phẩm</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 w-48 tracking-wider">Nguồn gốc lỗi</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 w-40 tracking-wider">Trạng thái xử lý</th>
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
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${r.trangThai === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : r.trangThai === 'Mới' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
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
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
         {/* Added pb-24 to handle mobile navigation */}
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 custom-scrollbar pb-24 md:pb-8">
             
             {/* 1.1 TỔNG QUAN */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pl-1">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">1.1. TỔNG QUAN</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="TỔNG PHẢN ÁNH" 
                        value={stats.total} 
                        gradient="from-blue-600 to-indigo-600"
                        icon={<DocumentDuplicateIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={false}
                        className="hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
                    />
                    <StatCard 
                        title="SẢN PHẨM LỖI" 
                        value={stats.uniqueProducts} 
                        subLabel="Mã sản phẩm"
                        gradient="from-rose-500 to-pink-600"
                        icon={<ShoppingBagIcon/>} 
                        onClick={() => handleCardClick('productList')}
                        isActive={false} 
                    />
                    <StatCard 
                        title="NHÀ PHÂN PHỐI" 
                        value={stats.totalSuppliers} 
                        gradient="from-orange-500 to-amber-500"
                        icon={<TruckIcon/>} 
                        onClick={() => handleCardClick('supplierList')}
                        isActive={false} 
                    />
                    <StatCard 
                        title="ĐƠN VỊ SỬ DỤNG" 
                        value={stats.totalUnits} 
                        gradient="from-emerald-500 to-teal-500"
                        icon={<UserGroupIcon/>} 
                        onClick={() => handleCardClick('unitList')}
                        isActive={false} 
                    />
                </div>
             </div>

             {/* 1.2 & 1.3: CHART SECTION */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
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
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">1.4. NHÃN HÀNG</h2>
                        </div>
                        <div className="flex flex-col gap-5 flex-1">
                            {stats.brands.map((brand, idx) => (
                                <BrandPerformanceCard key={idx} data={brand} onClick={() => handleCardClick('brand', brand.name)} />
                            ))}
                        </div>
                  </div>

                  {/* 1.5 Top 5 */}
                  <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                        <div className="flex items-center gap-3 pl-1">
                            <div className="w-1.5 h-6 bg-yellow-500 rounded-full"></div>
                            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">1.5. TOP 5 SP LỖI</h2>
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
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-5xl bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up ring-1 ring-white/20">
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
                                        {activeFilter.value || (
                                            activeFilter.type === 'productList' ? 'SẢN PHẨM LỖI' :
                                            activeFilter.type === 'supplierList' ? 'NHÀ PHÂN PHỐI' :
                                            activeFilter.type === 'unitList' ? 'ĐƠN VỊ SỬ DỤNG' : 'TẤT CẢ'
                                        )}
                                    </span>
                                    {['status', 'defectType', 'brand'].includes(activeFilter.type) && (
                                        <>
                                            <span className="text-sm text-slate-300 mx-1">•</span>
                                            <span className="text-sm font-bold text-slate-700">
                                                {totalFilteredCount} kết quả
                                            </span>
                                        </>
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

                    {/* Modal Content */}
                    {renderModalContent()}
                </div>
            </div>
        )}
    </div>
  );
}

export default React.memo(DashboardReport);