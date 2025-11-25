import React, { useMemo, useState } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, SparklesIcon, 
    QuestionMarkCircleIcon, CubeIcon, WrenchIcon, TruckIcon, ShoppingBagIcon,
    TagIcon, ArrowRightOnRectangleIcon, XIcon, ListBulletIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
  onSelectReport: (report: DefectReport) => void;
}

const StatCard = React.memo(({ title, value, percentage, icon, onClick, colorClass, isActive }: any) => {
    return (
        <div 
            onClick={onClick}
            className={`flex flex-col justify-between p-5 rounded-2xl bg-white border cursor-pointer hover:-translate-y-1 transition-all duration-300 h-full min-h-[120px] group relative overflow-hidden active:scale-[0.97] will-change-transform ${isActive ? `ring-2 ring-offset-2 ${colorClass.border} border-transparent shadow-lg` : 'border-slate-100 shadow-soft hover:shadow-md'}`}
        >
            <div className={`absolute -top-4 -right-4 w-28 h-28 rounded-full opacity-[0.08] group-hover:scale-150 transition-transform duration-700 ease-out ${colorClass.bg}`}></div>
            
            <div className="flex justify-between items-start z-10 mb-4">
                 <div className={`p-2.5 rounded-2xl ${colorClass.bg} ${colorClass.text} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                    {React.cloneElement(icon, { className: "h-6 w-6" })}
                 </div>
                 {percentage !== undefined && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorClass.bg} ${colorClass.text}`}>
                        {percentage}%
                    </span>
                 )}
            </div>
            
            <div className="z-10 mt-auto">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-slate-900 transition-colors">
                    {value.toLocaleString('vi-VN')}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
            </div>
        </div>
    );
});

const BrandPerformanceCard = React.memo(({ data, onClick }: { data: any; onClick: () => void }) => {
    let theme = {
        border: 'border-slate-100',
        text: 'text-slate-700',
        bg: 'bg-slate-50',
        accent: 'text-slate-500',
        bar: 'bg-slate-500',
        lightBar: 'bg-slate-100',
        ring: 'hover:ring-slate-100'
    };
    
    if (data.name === 'HTM') {
        theme = { 
            border: 'border-blue-100', 
            text: 'text-blue-700', 
            bg: 'bg-blue-50/50', 
            accent: 'text-blue-600', 
            bar: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
            lightBar: 'bg-blue-50',
            ring: 'hover:ring-blue-100'
        };
    } else if (data.name === 'VMA') {
        theme = { 
            border: 'border-emerald-100', 
            text: 'text-emerald-700', 
            bg: 'bg-emerald-50/50', 
            accent: 'text-emerald-600', 
            bar: 'bg-gradient-to-r from-emerald-500 to-teal-500', 
            lightBar: 'bg-emerald-50',
            ring: 'hover:ring-emerald-100'
        };
    }

    const ProgressBar = ({ label, value, percent, colorClass }: any) => (
        <div className="w-full group/bar">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide group-hover/bar:text-slate-600 transition-colors">{label}</span>
                <div className="text-right">
                     <span className={`text-sm font-bold ${theme.text} mr-1`}>{value}</span>
                     <span className="text-xs text-slate-400 font-medium">({percent}%)</span>
                </div>
            </div>
            <div className={`w-full h-2.5 rounded-full ${theme.lightBar} overflow-hidden ring-1 ring-inset ring-black/5`}>
                <div 
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                    style={{ width: `${Math.min(parseFloat(percent), 100)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col rounded-2xl bg-white border ${theme.border} shadow-soft hover:shadow-lg hover:-translate-y-1 hover:ring-4 ${theme.ring} transition-all duration-300 cursor-pointer overflow-hidden group h-full active:scale-[0.98] will-change-transform`}
        >
             <div className={`px-5 py-4 flex items-center justify-between border-b border-slate-50 ${theme.bg} transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5`}>
                        <TagIcon className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <h3 className={`text-xl font-black tracking-tight ${theme.text}`}>{data.name}</h3>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${theme.accent} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-white px-2 py-1 rounded-full shadow-sm`}>
                    <span>Chi tiết</span>
                    <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                </div>
             </div>

             <div className="p-5 flex flex-col justify-center gap-6 flex-1 bg-white">
                 <ProgressBar label="Phản ánh" value={data.reports} percent={data.reportsPercent} colorClass={theme.bar} />
                 <ProgressBar label="Đổi hàng" value={data.exchange} percent={data.exchangePercent} colorClass="bg-gradient-to-r from-rose-400 to-rose-600" />
                 <ProgressBar label="Sản phẩm lỗi" value={data.products} percent={data.productsPercent} colorClass="bg-gradient-to-r from-amber-300 to-amber-500" />
             </div>
        </div>
    );
});

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport }) => {
  const [activeFilter, setActiveFilter] = useState<{ type: 'status' | 'defectType' | 'all' | 'brand', value?: string } | null>(null);

  const stats = useMemo(() => {
    const total = reports.length;
    let totalExchange = 0;
    const uniqueProductsSet = new Set<string>();
    
    const counts = {
        sNew: 0, sProcessing: 0, sUnknown: 0, sCompleted: 0,
        dProduction: 0, dSupplier: 0, dMixed: 0, dOther: 0,
        brandHTM: { r: 0, e: 0, pSet: new Set<string>() },
        brandVMA: { r: 0, e: 0, pSet: new Set<string>() },
        brandOther: { r: 0, e: 0, pSet: new Set<string>() },
        productCounts: {} as Record<string, number>
    };

    for (const r of reports) {
        totalExchange += (r.soLuongDoi || 0);
        uniqueProductsSet.add(r.tenThuongMai);
        counts.productCounts[r.tenThuongMai] = (counts.productCounts[r.tenThuongMai] || 0) + 1;

        if (r.trangThai === 'Mới') counts.sNew++;
        else if (r.trangThai === 'Đang xử lý') counts.sProcessing++;
        else if (r.trangThai === 'Chưa tìm ra nguyên nhân') counts.sUnknown++;
        else if (r.trangThai === 'Hoàn thành') counts.sCompleted++;

        const l = (r.loaiLoi || '') as string;
        if (l === 'Lỗi Sản xuất' || l === 'Lỗi bộ phận sản xuất') counts.dProduction++;
        else if (l === 'Lỗi Nhà cung cấp') counts.dSupplier++;
        else if (l === 'Lỗi Hỗn hợp' || l === 'Lỗi vừa sản xuất vừa NCC') counts.dMixed++;
        else if (l === 'Lỗi Khác' || l === 'Lỗi khác') counts.dOther++;

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
        exchangePercent: getPct(data.e, totalExchange),
        products: data.pSet.size,
        productsPercent: getPct(data.pSet.size, uniqueProductsSet.size)
    });

    const brands = [
        buildBrandStats('HTM', counts.brandHTM),
        buildBrandStats('VMA', counts.brandVMA)
    ];
    if (counts.brandOther.r > 0) {
        brands.push(buildBrandStats('Khác', counts.brandOther));
    }

    const top5 = Object.keys(counts.productCounts)
        .map(key => ({ name: key, quantity: counts.productCounts[key] }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    return {
        total,
        uniqueProducts: uniqueProductsSet.size,
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
         <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar">
             
             {/* SECTION 1: OVERVIEW & STATUS */}
             <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>Tổng quan
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
                    <StatCard 
                        title="TỔNG PHẢN ÁNH" value={stats.total} 
                        colorClass={{bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-400'}}
                        icon={<DocumentDuplicateIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={activeFilter?.type === 'all'}
                    />
                    <StatCard 
                        title="SẢN PHẨM LỖI" value={stats.uniqueProducts} 
                        colorClass={{bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-400'}}
                        icon={<ShoppingBagIcon/>} 
                        onClick={() => handleCardClick('all')}
                        isActive={false} 
                    />
                    <StatCard 
                        title="MỚI" value={stats.status.sNew.count} percentage={stats.status.sNew.percent} 
                        colorClass={{bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-400'}}
                        icon={<SparklesIcon/>} 
                        onClick={() => handleCardClick('status', 'Mới')}
                        isActive={activeFilter?.value === 'Mới'}
                    />
                    <StatCard 
                        title="ĐANG XỬ LÝ" value={stats.status.sProcessing.count} percentage={stats.status.sProcessing.percent} 
                        colorClass={{bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-400'}}
                        icon={<ClockIcon/>} 
                        onClick={() => handleCardClick('status', 'Đang xử lý')}
                        isActive={activeFilter?.value === 'Đang xử lý'}
                    />
                    <StatCard 
                        title="CHƯA RÕ NGUYÊN NHÂN" value={stats.status.sUnknown.count} percentage={stats.status.sUnknown.percent} 
                        colorClass={{bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-400'}}
                        icon={<QuestionMarkCircleIcon/>} 
                        onClick={() => handleCardClick('status', 'Chưa tìm ra nguyên nhân')}
                        isActive={activeFilter?.value === 'Chưa tìm ra nguyên nhân'}
                    />
                    <StatCard 
                        title="HOÀN THÀNH" value={stats.status.sCompleted.count} percentage={stats.status.sCompleted.percent} 
                        colorClass={{bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-400'}}
                        icon={<CheckCircleIcon/>} 
                        onClick={() => handleCardClick('status', 'Hoàn thành')}
                        isActive={activeFilter?.value === 'Hoàn thành'}
                    />
                </div>
             </div>

             {/* SECTION 2: DEFECT TYPES */}
             <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>Phân loại lỗi
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <StatCard 
                        title="LỖI SẢN XUẤT" value={stats.defect.dProduction.count} percentage={stats.defect.dProduction.percent} 
                        colorClass={{bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-400'}}
                        icon={<WrenchIcon/>} 
                        onClick={() => handleCardClick('defectType', 'Lỗi Sản xuất')}
                        isActive={activeFilter?.value === 'Lỗi Sản xuất'}
                    />
                    <StatCard 
                        title="NHÀ CUNG CẤP" value={stats.defect.dSupplier.count} percentage={stats.defect.dSupplier.percent} 
                        colorClass={{bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-400'}}
                        icon={<TruckIcon/>} 
                        onClick={() => handleCardClick('defectType', 'Lỗi Nhà cung cấp')}
                        isActive={activeFilter?.value === 'Lỗi Nhà cung cấp'}
                    />
                    <StatCard 
                        title="LỖI HỖN HỢP" value={stats.defect.dMixed.count} percentage={stats.defect.dMixed.percent} 
                        colorClass={{bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-400'}}
                        icon={<CubeIcon/>} 
                        onClick={() => handleCardClick('defectType', 'Lỗi Hỗn hợp')}
                        isActive={activeFilter?.value === 'Lỗi Hỗn hợp'}
                    />
                    <StatCard 
                        title="LỖI KHÁC" value={stats.defect.dOther.count} percentage={stats.defect.dOther.percent} 
                        colorClass={{bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-400'}}
                        icon={<QuestionMarkCircleIcon/>} 
                        onClick={() => handleCardClick('defectType', 'Lỗi Khác')}
                        isActive={activeFilter?.value === 'Lỗi Khác'}
                    />
                </div>
             </div>

             {/* SECTION 3: BRANDS & TOP PRODUCTS */}
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[300px]">
                  <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>Hiệu suất Nhãn hàng
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                            {stats.brands.map((brand, idx) => (
                                <BrandPerformanceCard key={idx} data={brand} onClick={() => handleCardClick('brand', brand.name)} />
                            ))}
                        </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>Top 5 Sản phẩm lỗi
                        </h2>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex-1 flex flex-col overflow-hidden h-full">
                             <div className="flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar pr-1">
                                {stats.top5.map((item, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => onFilterSelect('search', item.name)}
                                        className="flex items-center p-3 rounded-2xl hover:bg-slate-50 cursor-pointer group transition-all border border-transparent hover:border-slate-100 active:scale-[0.98] will-change-transform"
                                    >
                                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-sm font-black shadow-sm border mr-4 transition-transform group-hover:scale-110 group-hover:rotate-6 ${
                                                index === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-yellow-100' : 
                                                index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                                                index === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                                'bg-white text-slate-400 border-slate-100'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                                {item.name}
                                            </p>
                                            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                                                <div 
                                                    className="bg-blue-500 h-2 rounded-full opacity-80 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                                    style={{ width: `${Math.min((item.quantity / (stats.top5[0]?.quantity || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg ml-3 border border-slate-200">
                                            {item.quantity}
                                        </span>
                                    </div>
                                ))}
                                {stats.top5.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                        <ShoppingBagIcon className="w-12 h-12 opacity-20" />
                                        <span className="text-sm font-medium italic">Chưa có dữ liệu</span>
                                    </div>
                                )}
                             </div>
                        </div>
                  </div>
             </div>
        </div>

        {/* MODAL WINDOW FOR DRILL-DOWN LIST */}
        {activeFilter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md transition-opacity">
                <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up ring-1 ring-white/20">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                                <ListBulletIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    DANH SÁCH CHI TIẾT
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-medium text-slate-500">Bộ lọc:</span>
                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase shadow-sm">
                                        {activeFilter.value || 'TẤT CẢ'}
                                    </span>
                                    <span className="text-sm text-slate-300 mx-1">•</span>
                                    <span className="text-sm font-bold text-slate-700">
                                        {totalFilteredCount} kết quả
                                    </span>
                                    {totalFilteredCount > 100 && (
                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 ml-2 font-semibold">
                                            (Hiển thị 100 mới nhất)
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
                    <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-32 tracking-wider">Ngày</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-40 tracking-wider">Mã SP</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Sản phẩm</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-48 tracking-wider">Phân loại lỗi</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-40 tracking-wider">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredReportsForTable.map(r => (
                                    <tr 
                                        key={r.id} 
                                        onClick={() => onSelectReport(r)} 
                                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                            {new Date(r.ngayPhanAnh).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap group-hover:text-blue-600 transition-colors">
                                            {r.maSanPham}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                                            {r.tenThuongMai}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                            {r.loaiLoi || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${r.trangThai === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : r.trangThai === 'Mới' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {r.trangThai}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReportsForTable.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                            <div className="flex flex-col items-center gap-3">
                                                <ListBulletIcon className="w-10 h-10 opacity-20" />
                                                Không có dữ liệu cho bộ lọc này.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default React.memo(DashboardReport);