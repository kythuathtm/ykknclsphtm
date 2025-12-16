
import React, { useMemo, useState } from 'react';
import { DefectReport, User, SystemSettings } from '../types';
import { 
    CheckCircleIcon, ClockIcon, 
    ShoppingBagIcon, TagIcon, 
    ShieldCheckIcon,
    CubeIcon, ChartPieIcon, 
    InboxIcon, SparklesIcon,
    TableCellsIcon,
    BuildingStoreIcon,
    BarChartIcon,
    XIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    ExclamationCircleIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand' | 'month' | 'overdue', value?: string) => void;
  onSelectReport: (report: DefectReport) => void;
  onOpenAiAnalysis: () => void;
  isLoading?: boolean;
  currentUser?: User;
  systemSettings?: SystemSettings;
}

const COLORS = {
    PRIMARY: '#003DA5', 
    SUCCESS: '#10B981', 
    WARNING: '#F59E0B', 
    DANGER: '#EF4444',  
    VIOLET: '#8B5CF6',  
    TEAL: '#14B8A6',    
    SKY: '#0EA5E9',     
    ROSE: '#F43F5E',    
    SLATE: '#64748B',   
    INDIGO: '#6366F1',  
};

// --- SUB COMPONENTS ---

const BrandLogoHTM = ({ className = "w-10 h-10", textSize = "text-[10px]", imageUrl }: { className?: string, textSize?: string, imageUrl?: string }) => {
    if (imageUrl) {
        return (
            <div className={`${className} rounded-xl shadow-md border border-white/50 overflow-hidden bg-white/80 group-hover:scale-105 transition-transform`}>
                <img src={imageUrl} alt="HTM" className="w-full h-full object-contain p-1" />
            </div>
        );
    }
    return (
        <div className={`${className} bg-gradient-to-br from-[#003DA5] to-[#002a70] rounded-xl shadow-lg flex flex-col items-center justify-center text-white border border-white/20 relative overflow-hidden group-hover:scale-105 transition-transform`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <span className={`${textSize} font-black tracking-tighter leading-none relative z-10`}>HTM</span>
        </div>
    );
};

const BrandLogoVMA = ({ className = "w-10 h-10", textSize = "text-[10px]", imageUrl }: { className?: string, textSize?: string, imageUrl?: string }) => {
    if (imageUrl) {
        return (
            <div className={`${className} rounded-xl shadow-md border border-white/50 overflow-hidden bg-white/80 group-hover:scale-105 transition-transform`}>
                <img src={imageUrl} alt="VMA" className="w-full h-full object-contain p-1" />
            </div>
        );
    }
    return (
        <div className={`${className} bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl shadow-lg flex flex-col items-center justify-center text-white border border-white/20 relative overflow-hidden group-hover:scale-105 transition-transform`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <span className={`${textSize} font-black tracking-tighter leading-none relative z-10`}>VMA</span>
        </div>
    );
};

const BrandLogoETC = ({ className = "w-10 h-10", textSize = "text-[10px]" }: { className?: string, textSize?: string }) => (
    <div className={`${className} bg-slate-100/80 backdrop-blur-sm rounded-xl shadow-inner flex items-center justify-center text-slate-500 border border-white/50`}>
        <span className={`${textSize} font-bold tracking-tight`}>Khác</span>
    </div>
);

const CountUp = ({ value, suffix = "" }: { value: number, suffix?: string }) => <>{value.toLocaleString()}{suffix}</>;

const GlassCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`glass-panel rounded-[2rem] relative overflow-hidden transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:bg-white/90 hover:border-white/90 ${className}`}>
        {children}
    </div>
);

const KpiCard = ({ title, value, icon, subLabel, color, onClick, gradientFrom, gradientTo }: any) => (
    <button 
        onClick={onClick}
        className="group relative flex flex-col justify-between p-6 rounded-[2rem] glass-mirror transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full text-left overflow-hidden bg-white/60"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
            <div className={`p-3 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md transition-transform group-hover:scale-110 duration-300`} style={{ backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        <div className="relative z-10">
            <div className="text-3xl font-black text-slate-800 tracking-tight flex items-baseline gap-1 drop-shadow-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 transition-all">
                {value}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                {subLabel}
            </div>
        </div>
    </button>
);

const BrandStatRow = ({ brand, label, color, data, onClick, logoUrl }: any) => {
    const renderLogo = () => {
        if (brand === 'HTM') return <BrandLogoHTM className="w-12 h-12" textSize="text-xs" imageUrl={logoUrl} />;
        if (brand === 'VMA') return <BrandLogoVMA className="w-12 h-12" textSize="text-xs" imageUrl={logoUrl} />;
        return <BrandLogoETC className="w-12 h-12" textSize="text-[10px]" />;
    };

    return (
        <div onClick={onClick} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/80 hover:shadow-lg hover:border-white transition-all cursor-pointer group backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-3 sm:mb-0 relative z-10">
                {renderLogo()}
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <div className="h-1.5 w-16 rounded-full mt-1.5 opacity-20 relative overflow-hidden bg-slate-200">
                        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: color, width: '100%' }}></div>
                    </div>
                </div>
            </div>
            <div className="flex gap-6 sm:gap-10 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Số phiếu</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-700">{data.count}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/60 text-slate-500 border border-white/60 shadow-sm">{data.pct.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgressBarChart = ({ data, color, onBarClick }: { data: any[], color: string, onBarClick?: (label: string) => void }) => (
    <div className="space-y-5">
        {data.map((item, idx) => (
            <div key={idx} onClick={() => onBarClick && onBarClick(item.label)} className="group cursor-pointer">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#003DA5] transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color || color }}></span>
                        {item.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">{item.value}</span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-white/60 px-1.5 rounded border border-white/60 shadow-sm">({item.percentage.toFixed(1)}%)</span>
                    </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 box-shadow-inner">
                    <div className="h-full rounded-full relative shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out" style={{ width: `${item.percentage}%`, backgroundColor: item.color || color }}></div>
                </div>
            </div>
        ))}
        {data.length === 0 && <div className="text-center text-slate-400 text-xs py-8 font-medium">Chưa có dữ liệu</div>}
    </div>
);

// --- UPDATED TREND CHART (Dual Bar: New vs Resolved) ---
const TrackingTrendChart = ({ data, onBarClick }: { data: { month: string, newCount: number, resolvedCount: number }[], onBarClick?: (month: string) => void }) => {
    const max = Math.max(...data.map(d => Math.max(d.newCount, d.resolvedCount)), 1);
    
    return (
        <div className="w-full h-56 flex flex-col justify-end gap-2 pt-8 pb-2 px-2 select-none">
            {data.length > 0 ? (
                <div className="flex items-end justify-between h-full w-full gap-2 sm:gap-3">
                    {data.map((d, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative cursor-pointer" onClick={() => onBarClick && onBarClick(d.month)}>
                            <div className="w-full flex items-end justify-center gap-1 h-full relative">
                                {/* New Bar (Sky Blue) */}
                                <div className="w-3 sm:w-4 bg-sky-400 rounded-t-sm relative transition-all duration-300 hover:opacity-80" style={{ height: `${(d.newCount / max) * 100}%`, minHeight: d.newCount > 0 ? '4px' : '0' }}></div>
                                {/* Resolved Bar (Emerald Green) */}
                                <div className="w-3 sm:w-4 bg-emerald-500 rounded-t-sm relative transition-all duration-300 hover:opacity-80" style={{ height: `${(d.resolvedCount / max) * 100}%`, minHeight: d.resolvedCount > 0 ? '4px' : '0' }}></div>
                                
                                {/* Tooltip */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20 flex flex-col gap-1">
                                    <div className="flex justify-between gap-3"><span className="text-sky-300">Tiếp nhận:</span> <span>{d.newCount}</span></div>
                                    <div className="flex justify-between gap-3"><span className="text-emerald-300">Xử lý xong:</span> <span>{d.resolvedCount}</span></div>
                                </div>
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">{d.month}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-wider">Chưa có dữ liệu theo tháng</div>
            )}
        </div>
    );
};

const DataModal = ({ title, onClose, children }: { title: string, onClose: () => void, children?: React.ReactNode }) => (
    <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="glass-panel w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-pop bg-white/80">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/40 bg-white/30 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 text-[#003DA5] rounded-xl border border-blue-100 shadow-sm"><ShoppingBagIcon className="w-5 h-5"/></div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50/50 transition-all active:scale-95"><XIcon className="h-6 w-6" /></button>
            </div>
            <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-slate-50/30">{children}</div>
        </div>
    </div>
);

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport, onOpenAiAnalysis, isLoading, currentUser, systemSettings }) => {
    const [showDistributorModal, setShowDistributorModal] = useState(false);
    const [showBrandStatsModal, setShowBrandStatsModal] = useState(false);
    const [selectedBrandDetail, setSelectedBrandDetail] = useState<'All' | 'HTM' | 'VMA' | 'Khác'>('All');

    const getVietnameseDate = () => {
        const date = new Date();
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${days[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
    };

    const recentActivity = useMemo(() => {
        return reports.flatMap(r => {
                const logs = Array.isArray(r.activityLog) ? r.activityLog : [];
                return logs.map(log => ({ ...log, reportId: r.id, reportName: r.tenThuongMai, reportCode: r.maSanPham }));
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [reports]);

    const metrics = useMemo(() => {
        const totalReports = reports.length;
        const uniqueDistributors = new Set(reports.map(r => r.nhaPhanPhoi?.trim()).filter(Boolean)).size;
        const uniqueTotalSKUs = new Set(reports.map(r => r.maSanPham?.trim()).filter(Boolean)).size;
        const completedCount = reports.filter(r => r.trangThai === 'Hoàn thành').length;
        const completionRate = totalReports > 0 ? (completedCount / totalReports) * 100 : 0;
        
        const overdueCount = reports.filter(r => {
             if (r.trangThai === 'Hoàn thành' || !r.ngayPhanAnh) return false;
             try {
                 const start = new Date(r.ngayPhanAnh);
                 const end = new Date();
                 const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                 return diff > 7;
             } catch { return false; }
        }).length;

        const getBrandData = (brandName: string) => {
            const subset = reports.filter(r => r.nhanHang === brandName);
            const count = subset.length;
            const pct = totalReports > 0 ? (count / totalReports) * 100 : 0;
            const skus = new Set(subset.map(r => r.maSanPham?.trim()).filter(Boolean)).size;
            const skuPct = uniqueTotalSKUs > 0 ? (skus / uniqueTotalSKUs) * 100 : 0;
            return { count, pct, skuCount: skus, skuPct };
        };

        const brandStats = {
            HTM: getBrandData('HTM'),
            VMA: getBrandData('VMA'),
            Other: (() => {
                const subset = reports.filter(r => !['HTM', 'VMA'].includes(r.nhanHang));
                const count = subset.length;
                const pct = totalReports > 0 ? (count / totalReports) * 100 : 0;
                const skus = new Set(subset.map(r => r.maSanPham?.trim()).filter(Boolean)).size;
                const skuPct = uniqueTotalSKUs > 0 ? (skus / uniqueTotalSKUs) * 100 : 0;
                return { count, pct, skuCount: skus, skuPct };
            })()
        };

        const getOriginData = (brandFilter: 'All' | 'HTM' | 'VMA' | 'Khác') => {
            let subset = reports;
            if (brandFilter === 'HTM') subset = reports.filter(r => r.nhanHang === 'HTM');
            else if (brandFilter === 'VMA') subset = reports.filter(r => r.nhanHang === 'VMA');
            else if (brandFilter === 'Khác') subset = reports.filter(r => !['HTM', 'VMA'].includes(r.nhanHang));
            
            const total = subset.length;
            const counts: Record<string, number> = {};
            subset.forEach(r => { const origin = r.loaiLoi || 'Chưa phân loại'; counts[origin] = (counts[origin] || 0) + 1; });
            return Object.entries(counts).map(([key, value]) => ({
                label: key, value, percentage: total > 0 ? (value / total) * 100 : 0,
                color: key === 'Lỗi Sản xuất' ? COLORS.DANGER : key === 'Lỗi Nhà cung cấp' ? COLORS.WARNING : key === 'Lỗi Hỗn hợp' ? COLORS.VIOLET : COLORS.SLATE
            })).sort((a, b) => b.value - a.value);
        };

        const originData = { All: getOriginData('All'), HTM: getOriginData('HTM'), VMA: getOriginData('VMA'), Khác: getOriginData('Khác') };

        const statusCounts: Record<string, number> = {};
        reports.forEach(r => { statusCounts[r.trangThai] = (statusCounts[r.trangThai] || 0) + 1 });
        const statusColors: Record<string, string> = { 'Mới': '#3B82F6', 'Đang tiếp nhận': '#6366f1', 'Đang xác minh': '#06b6d4', 'Đang xử lý': COLORS.WARNING, 'Chưa tìm ra nguyên nhân': COLORS.ROSE, 'Hoàn thành': COLORS.SUCCESS };
        const statusData = Object.entries(statusCounts).map(([key, value]) => ({
            label: key, value, percentage: (value / totalReports) * 100, color: statusColors[key] || COLORS.SLATE
        })).sort((a, b) => b.value - a.value);

        const productCounts: Record<string, { count: number, name: string }> = {};
        reports.forEach(r => {
            const key = r.maSanPham || 'Unknown';
            if (!productCounts[key]) productCounts[key] = { count: 0, name: r.tenThuongMai || 'Không xác định' };
            productCounts[key].count += 1;
        });
        const topProducts = Object.entries(productCounts).map(([code, data]) => ({ code, name: data.name, count: data.count })).sort((a, b) => b.count - a.count).slice(0, 5);

        // Updated Monthly Stats Logic: Created vs Resolved
        const monthlyStats: Record<string, { new: number, resolved: number }> = {};
        reports.forEach(r => {
            // Count New Reports based on ngayPhanAnh
            if (r.ngayPhanAnh) {
                try {
                    const d = new Date(r.ngayPhanAnh);
                    if (!isNaN(d.getTime())) {
                        const key = `${('0' + (d.getMonth() + 1)).slice(-2)}/${d.getFullYear()}`;
                        if (!monthlyStats[key]) monthlyStats[key] = { new: 0, resolved: 0 };
                        monthlyStats[key].new++;
                    }
                } catch (e) {}
            }
            // Count Resolved Reports based on ngayHoanThanh
            if (r.trangThai === 'Hoàn thành' && r.ngayHoanThanh) {
                try {
                    const d = new Date(r.ngayHoanThanh);
                    if (!isNaN(d.getTime())) {
                        const key = `${('0' + (d.getMonth() + 1)).slice(-2)}/${d.getFullYear()}`;
                        if (!monthlyStats[key]) monthlyStats[key] = { new: 0, resolved: 0 };
                        monthlyStats[key].resolved++;
                    }
                } catch (e) {}
            }
        });

        const monthlyTrend = Object.entries(monthlyStats)
            .map(([month, data]) => {
                const [m, y] = month.split('/').map(Number);
                return { month, newCount: data.new, resolvedCount: data.resolved, dateVal: new Date(y, m - 1).getTime() };
            })
            .sort((a, b) => a.dateVal - b.dateVal)
            .slice(-12);

        return { totalReports, overdueCount, uniqueDistributors, uniqueTotalSKUs, completionRate, brandStats, originData, statusData, topProducts, monthlyTrend };
    }, [reports]);

    const brandDetailedStats = useMemo(() => {
        const brands = ['HTM', 'VMA', 'Khác'] as const;
        return brands.map(brand => {
            const subset = reports.filter(r => brand === 'Khác' ? !['HTM', 'VMA'].includes(r.nhanHang) : r.nhanHang === brand);
            const reportCount = subset.length;
            const skuCount = new Set(subset.map(r => r.maSanPham)).size;
            const completed = subset.filter(r => r.trangThai === 'Hoàn thành').length;
            const completionRate = reportCount > 0 ? (completed / reportCount) * 100 : 0;
            
            const statusCounts: Record<string, number> = {};
            subset.forEach(r => { statusCounts[r.trangThai] = (statusCounts[r.trangThai] || 0) + 1; });
            const statusData = Object.entries(statusCounts).map(([label, value]) => ({ label, value, percentage: reportCount > 0 ? (value / reportCount) * 100 : 0, color: label === 'Hoàn thành' ? COLORS.SUCCESS : COLORS.WARNING })).sort((a,b) => b.value - a.value);

            const originCounts: Record<string, number> = {};
            subset.forEach(r => { const o = r.loaiLoi || 'Chưa phân loại'; originCounts[o] = (originCounts[o] || 0) + 1; });
            const originData = Object.entries(originCounts).map(([label, value]) => ({ label, value, percentage: reportCount > 0 ? (value / reportCount) * 100 : 0, color: COLORS.SLATE })).sort((a,b) => b.value - a.value);

            const productCounts: Record<string, { count: number, name: string }> = {};
            subset.forEach(r => { const k = r.maSanPham || 'Unknown'; if (!productCounts[k]) productCounts[k] = { count: 0, name: r.tenThuongMai || '' }; productCounts[k].count++; if (r.tenThuongMai.length > productCounts[k].name.length) productCounts[k].name = r.tenThuongMai; });
            const topProducts = Object.entries(productCounts).map(([code, d]) => ({ code, name: d.name, count: d.count })).sort((a, b) => b.count - a.count).slice(0, 3);

            return { brand, reportCount, skuCount, completionRate, pctTotal: reports.length > 0 ? (reportCount / reports.length) * 100 : 0, statusData, originData, topProducts };
        });
    }, [reports]);

    const detailedChartData = useMemo(() => {
        const data = brandDetailedStats.find(b => b.brand === selectedBrandDetail);
        return data || { originData: [], statusData: [], topProducts: [] };
    }, [selectedBrandDetail, brandDetailedStats]);

    const distributorStats = useMemo(() => {
        const stats: Record<string, { name: string, reportCount: number, skus: Set<string>, exchangeCount: number }> = {};
        reports.forEach(r => {
            const name = r.nhaPhanPhoi || 'Không xác định';
            if (!stats[name]) stats[name] = { name, reportCount: 0, skus: new Set(), exchangeCount: 0 };
            stats[name].reportCount++;
            if (r.maSanPham) stats[name].skus.add(r.maSanPham);
            stats[name].exchangeCount += (r.soLuongDoi || 0);
        });
        return Object.values(stats).sort((a, b) => b.reportCount - a.reportCount);
    }, [reports]);

    return (
        <div className="flex flex-col h-full w-full bg-transparent p-6 lg:p-8 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 drop-shadow-sm">
                        Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003DA5] to-blue-500">{currentUser?.fullName || currentUser?.username}</span>
                        <span className="text-2xl animate-pulse">👋</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="p-1.5 bg-white/60 text-[#003DA5] rounded-lg border border-white shadow-sm backdrop-blur-sm"><CalendarIcon className="w-4 h-4" /></div>
                        <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">{getVietnameseDate()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onOpenAiAnalysis} className="group flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 border border-white/20 hover:shadow-indigo-500/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        <SparklesIcon className="w-4 h-4" /> <span className="text-sm font-bold relative z-10">Phân tích AI</span>
                    </button>
                    <button onClick={() => onFilterSelect('all')} className="flex items-center gap-2 glass-panel hover:bg-white/80 text-slate-700 px-5 py-3 rounded-2xl shadow-sm transition-all text-sm font-bold hover:shadow-md border border-white/60">
                        <TableCellsIcon className="w-4 h-4 text-slate-500" /> <span>Dữ liệu gốc</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                <KpiCard title="Tổng Phiếu" value={<CountUp value={metrics.totalReports} />} subValue="Hồ sơ ghi nhận" icon={<InboxIcon className="w-5 h-5"/>} color={COLORS.PRIMARY} gradientFrom="from-blue-50" gradientTo="to-indigo-50" onClick={() => onFilterSelect('all')} />
                <KpiCard title="Quá Hạn (>7 ngày)" value={<CountUp value={metrics.overdueCount} />} subValue="Cần xử lý gấp" icon={<ExclamationCircleIcon className="w-5 h-5"/>} color={COLORS.DANGER} gradientFrom="from-red-50" gradientTo="to-rose-50" onClick={() => onFilterSelect('overdue')} />
                <KpiCard title="Nhà Phân Phối" value={<CountUp value={metrics.uniqueDistributors} />} subValue="Có phát sinh lỗi" icon={<BuildingStoreIcon className="w-5 h-5"/>} color={COLORS.VIOLET} gradientFrom="from-violet-50" gradientTo="to-purple-50" onClick={() => setShowDistributorModal(true)} />
                <KpiCard title="Sản Phẩm (SKU)" value={<CountUp value={metrics.uniqueTotalSKUs} />} subValue="Mã hàng bị phản ánh" icon={<CubeIcon className="w-5 h-5"/>} color={COLORS.WARNING} gradientFrom="from-amber-50" gradientTo="to-yellow-50" onClick={() => onFilterSelect('search')} />
                <KpiCard title="Tỷ Lệ Hoàn Thành" value={<CountUp value={metrics.completionRate} suffix="%" />} subValue="Đã xử lý xong" icon={<CheckCircleIcon className="w-5 h-5"/>} color={COLORS.SUCCESS} gradientFrom="from-emerald-50" gradientTo="to-teal-50" onClick={() => onFilterSelect('status', 'Hoàn thành')} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <GlassCard className="p-8 flex flex-col xl:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100 shadow-sm"><BarChartIcon className="w-5 h-5" /></div>
                            <h3 className="font-bold text-slate-800 text-lg">Hiệu suất Xử lý (Tracking Flow)</h3>
                        </div>
                        <div className="flex gap-4 text-xs font-bold">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400"></span> Tiếp nhận</div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Hoàn thành</div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end">
                        <TrackingTrendChart data={metrics.monthlyTrend} onBarClick={(month) => onFilterSelect('month', month)} />
                    </div>
                </GlassCard>

                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shadow-sm"><ChartPieIcon className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-800 text-lg">Trạng thái Xử lý</h3>
                    </div>
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-40 h-40 flex-shrink-0">
                            <div className="w-full h-full rounded-full shadow-xl border-4 border-white/50" style={{ background: `conic-gradient(${metrics.statusData.length > 0 ? metrics.statusData.reduce((acc, item, idx) => { const prevDeg = idx === 0 ? 0 : metrics.statusData.slice(0, idx).reduce((sum, i) => sum + i.percentage, 0) * 3.6; const currentDeg = prevDeg + (item.percentage * 3.6); return acc + `${item.color} ${prevDeg}deg ${currentDeg}deg, `; }, '').slice(0, -2) : '#e2e8f0 0deg 360deg'})` }}></div>
                            <div className="absolute inset-0 m-auto w-24 h-24 bg-white/90 backdrop-blur rounded-full flex flex-col items-center justify-center shadow-inner border border-white/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng</span>
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">{metrics.totalReports}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-y-2 w-full">
                            {metrics.statusData.map((status, idx) => (
                                <div key={idx} onClick={() => onFilterSelect('status', status.label)} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 border border-white/50" style={{ backgroundColor: status.color }}></div>
                                        <span className="text-xs font-bold text-slate-600 truncate group-hover:text-slate-900">{status.label}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-800 bg-white/70 px-1.5 py-0.5 rounded shadow-sm border border-white">{status.percentage.toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Brand & Origin Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <GlassCard className="p-8 flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3 cursor-pointer group/title" onClick={() => setShowBrandStatsModal(true)}>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover/title:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"><ShoppingBagIcon className="w-5 h-5" /></div>
                            <h3 className="font-bold text-slate-800 text-lg group-hover/title:text-indigo-700 transition-colors">Thống kê Nhãn hàng</h3>
                        </div>
                        <button onClick={() => setShowBrandStatsModal(true)} className="text-xs font-bold text-[#003DA5] bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 border border-blue-100 shadow-sm">
                            Chi tiết <ArrowRightOnRectangleIcon className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 justify-center">
                        <BrandStatRow brand="HTM" label="HTM" color={COLORS.PRIMARY} data={metrics.brandStats.HTM} onClick={() => onFilterSelect('brand', 'HTM')} logoUrl={systemSettings?.brandLogos?.HTM} />
                        <BrandStatRow brand="VMA" label="VMA" color={COLORS.SUCCESS} data={metrics.brandStats.VMA} onClick={() => onFilterSelect('brand', 'VMA')} logoUrl={systemSettings?.brandLogos?.VMA} />
                        {metrics.brandStats.Other.count > 0 && <BrandStatRow brand="ETC" label="Khác" color={COLORS.SLATE} data={metrics.brandStats.Other} onClick={() => onFilterSelect('brand', 'Khác')} />}
                    </div>
                </GlassCard>

                <GlassCard className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm"><ShieldCheckIcon className="w-5 h-5" /></div>
                            <h3 className="font-bold text-slate-800 text-lg">Phân loại lỗi</h3>
                        </div>
                    </div>
                    <div className="mt-2 min-h-[200px]">
                        <ProgressBarChart data={metrics.originData['All']} color={COLORS.DANGER} onBarClick={(label) => onFilterSelect('defectType', label)} />
                    </div>
                </GlassCard>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                <GlassCard className="p-8 flex flex-col h-[400px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-100 shadow-sm"><ClockIcon className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-800 text-lg">Hoạt động gần đây</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((log, idx) => (
                                <div key={`${log.id}-${idx}`} onClick={() => onSelectReport(reports.find(r => r.id === log.reportId) as DefectReport)} className="flex gap-3 group cursor-pointer">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'comment' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-slate-300'} ring-4 ring-white/50`}></div>
                                    <div className="flex-1 min-w-0 pb-3 border-b border-slate-100/50 group-last:border-0 group-last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{log.reportName}</p>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-white/60 px-1.5 rounded">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100/50 px-1 rounded">{log.reportCode}</span>
                                            <span className="text-[10px] text-slate-500">•</span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase">{log.user}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 bg-white/40 p-2 rounded-lg italic border border-white/60">{log.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs"><InboxIcon className="w-8 h-8 mb-2 opacity-20"/> Chưa có hoạt động nào</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-8 flex flex-col h-[400px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm"><TagIcon className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-800 text-lg">Top 5 Sản phẩm bị phản ánh</h3>
                    </div>
                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {metrics.topProducts.map((prod, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/80 transition-all border border-white/50 hover:border-white shadow-sm group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/30' : 'bg-white border border-slate-200 text-slate-500'}`}>{idx + 1}</div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-extrabold text-[#003DA5] truncate bg-blue-50/50 px-1.5 rounded w-fit mb-0.5 border border-blue-100/50">{prod.code}</p>
                                        <p className="text-xs font-bold text-slate-700 line-clamp-1 leading-tight group-hover:text-slate-900" title={prod.name}>{prod.name}</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-slate-800 leading-none pl-4">{prod.count}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Modals */}
            {showDistributorModal && <DataModal title="Thống kê Nhà Phân Phối" onClose={() => setShowDistributorModal(false)}>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">STT</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà Phân Phối</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Số Phiếu</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-emerald-600 uppercase tracking-wider w-32">SL Đổi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-slate-100">
                        {distributorStats.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4 text-center text-sm font-medium text-slate-500">{idx + 1}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.name}</td>
                                <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">{item.reportCount}</td>
                                <td className="px-6 py-4 text-center text-sm font-bold text-emerald-600">{item.exchangeCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataModal>}

            {showBrandStatsModal && <DataModal title="Chi tiết Thống kê Nhãn hàng" onClose={() => setShowBrandStatsModal(false)}>
                <div className="p-6 space-y-8 bg-slate-50/30">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => setSelectedBrandDetail('All')} className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-lg flex flex-col gap-2 group relative overflow-hidden text-left glass-card ${selectedBrandDetail === 'All' ? 'ring-2 ring-indigo-500/50 bg-white/90 shadow-md' : 'hover:border-indigo-200'}`}>
                            <div className="flex justify-between items-center w-full"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shadow-sm">All</div><h4 className="font-bold text-slate-800 text-sm">Tất cả</h4></div>{selectedBrandDetail === 'All' && <CheckCircleIcon className="w-5 h-5 text-indigo-500" />}</div>
                            <div className="mt-2 w-full"><div className="flex justify-between items-end"><p className="text-2xl font-black text-slate-800">{metrics.totalReports}</p><span className="text-[10px] font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded shadow-sm border border-white/60">Tổng phiếu</span></div></div>
                        </button>
                        {brandDetailedStats.map((stat, idx) => {
                            const isSelected = selectedBrandDetail === stat.brand;
                            let logoUrl = undefined;
                            if (stat.brand === 'HTM') logoUrl = systemSettings?.brandLogos?.HTM;
                            if (stat.brand === 'VMA') logoUrl = systemSettings?.brandLogos?.VMA;
                            return (
                                <button key={idx} onClick={() => setSelectedBrandDetail(stat.brand as any)} className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-lg flex flex-col gap-2 group relative overflow-hidden text-left glass-card ${isSelected ? 'ring-2 ring-blue-500/50 bg-white/90 shadow-md' : 'hover:border-blue-200'}`}>
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            {stat.brand === 'HTM' ? <BrandLogoHTM className="w-8 h-8 rounded-lg shadow-sm" textSize="text-[8px]" imageUrl={logoUrl} /> : stat.brand === 'VMA' ? <BrandLogoVMA className="w-8 h-8 rounded-lg shadow-sm" textSize="text-[8px]" imageUrl={logoUrl} /> : <BrandLogoETC className="w-8 h-8 rounded-lg shadow-sm" textSize="text-[8px]" />}
                                            <h4 className="font-bold text-slate-800 text-sm">{stat.brand}</h4>
                                        </div>
                                        {isSelected && <CheckCircleIcon className="w-5 h-5 text-blue-500" />}
                                    </div>
                                    <div className="mt-2 w-full"><div className="flex justify-between items-end"><p className="text-2xl font-black text-slate-800">{stat.reportCount}</p><span className="text-[10px] font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded shadow-sm border border-white/60">{stat.pctTotal.toFixed(0)}%</span></div></div>
                                </button>
                            )
                        })}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <GlassCard className="p-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-6 flex justify-between items-center"><span className="flex items-center gap-2">Phân tích chi tiết ({selectedBrandDetail === 'All' ? 'Tổng hợp' : selectedBrandDetail})</span></h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div><div className="flex items-center gap-2 mb-4"><div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><ShieldCheckIcon className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-500 uppercase">Nguồn gốc lỗi</span></div><ProgressBarChart data={selectedBrandDetail === 'All' ? metrics.originData['All'] : detailedChartData.originData} color={COLORS.DANGER} /></div>
                                    <div><div className="flex items-center gap-2 mb-4"><div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><ClockIcon className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-500 uppercase">Trạng thái xử lý</span></div><ProgressBarChart data={selectedBrandDetail === 'All' ? metrics.statusData : detailedChartData.statusData} color={COLORS.WARNING} /></div>
                                </div>
                            </GlassCard>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <GlassCard className="p-6 h-full">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><ExclamationCircleIcon className="w-4 h-4 text-orange-500"/> Top Sản phẩm</h4>
                                <div className="space-y-3">
                                    {(selectedBrandDetail === 'All' ? metrics.topProducts : detailedChartData.topProducts).slice(0, 5).map((prod, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/50 hover:bg-white transition-colors group shadow-sm">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'}`}>{idx + 1}</div>
                                            <div className="min-w-0 flex-1"><div className="flex justify-between items-start"><p className="text-[10px] font-bold text-[#003DA5] bg-white px-1.5 rounded border border-slate-200 inline-block mb-1">{prod.code}</p><span className="text-xs font-black text-slate-800">{prod.count}</span></div><p className="text-xs font-medium text-slate-600 line-clamp-2 leading-tight group-hover:text-slate-900" title={prod.name}>{prod.name}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </DataModal>}
        </div>
    );
};

export default DashboardReport;
