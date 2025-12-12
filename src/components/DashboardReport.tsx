
import React, { useMemo, useState, useEffect } from 'react';
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
    UserIcon,
    PencilIcon,
    ChatBubbleLeftIcon,
    PlusIcon
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

// --- COLOR PALETTE ---
const COLORS = {
    PRIMARY: '#003DA5', // HTM Blue
    SUCCESS: '#059669', // Emerald (VMA)
    WARNING: '#D97706', // Amber
    DANGER: '#DC2626',  // Red
    VIOLET: '#7C3AED',  // Violet
    TEAL: '#0D9488',    // Teal
    SLATE: '#64748B',   // Slate
};

// --- LOGO COMPONENTS ---
const BrandLogoHTM = ({ className = "w-10 h-10", textSize = "text-[10px]", imageUrl }: { className?: string, textSize?: string, imageUrl?: string }) => {
    if (imageUrl) {
        return (
            <div className={`${className} rounded-xl shadow-md border border-slate-200 overflow-hidden bg-white group-hover:scale-105 transition-transform`}>
                <img src={imageUrl} alt="HTM" className="w-full h-full object-contain p-1" />
            </div>
        );
    }
    return (
        <div className={`${className} bg-gradient-to-br from-[#003DA5] to-[#002a70] rounded-xl shadow-md flex flex-col items-center justify-center text-white border border-blue-800/20 relative overflow-hidden group-hover:scale-105 transition-transform`}>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 rounded-full blur-sm"></div>
            <span className={`${textSize} font-black tracking-tighter leading-none relative z-10`}>HTM</span>
            <div className="h-[2px] w-1/2 bg-red-500 mt-0.5 rounded-full relative z-10"></div>
        </div>
    );
};

const BrandLogoVMA = ({ className = "w-10 h-10", textSize = "text-[10px]", imageUrl }: { className?: string, textSize?: string, imageUrl?: string }) => {
    if (imageUrl) {
        return (
            <div className={`${className} rounded-xl shadow-md border border-slate-200 overflow-hidden bg-white group-hover:scale-105 transition-transform`}>
                <img src={imageUrl} alt="VMA" className="w-full h-full object-contain p-1" />
            </div>
        );
    }
    return (
        <div className={`${className} bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl shadow-md flex flex-col items-center justify-center text-white border border-emerald-800/20 relative overflow-hidden group-hover:scale-105 transition-transform`}>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/10 rounded-full blur-sm"></div>
            <span className={`${textSize} font-black tracking-tighter leading-none relative z-10`}>VMA</span>
            <div className="h-[2px] w-1/2 bg-yellow-400 mt-0.5 rounded-full relative z-10"></div>
        </div>
    );
};

const BrandLogoETC = ({ className = "w-10 h-10", textSize = "text-[10px]" }: { className?: string, textSize?: string }) => (
    <div className={`${className} bg-slate-100 rounded-xl shadow-inner flex items-center justify-center text-slate-500 border border-slate-200`}>
        <span className={`${textSize} font-bold tracking-tight`}>Khác</span>
    </div>
);

// --- ANIMATED COUNT COMPONENT ---
const CountUp = ({ value, duration = 1000, suffix = "" }: { value: number, duration?: number, suffix?: string }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        let totalMilSec = duration;
        let incrementTime = (totalMilSec / end) * 5; 

        // fallback for large numbers
        if (incrementTime < 5) incrementTime = 10; 
        
        const timer = setInterval(() => {
            start += Math.ceil(end / (totalMilSec / 10)); // increment
            if (start >= end) {
                start = end;
                clearInterval(timer);
            }
            setDisplay(start);
        }, 10);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <>{display.toLocaleString()}{suffix}</>;
};

// --- SUB-COMPONENTS ---

const GlassCard = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => (
    <div 
        className={`bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] relative overflow-hidden animate-slide-up ring-1 ring-white/40 ${className}`}
        style={{ animationDelay: `${delay}ms` }}
    >
        {children}
    </div>
);

const KpiCard = ({ title, value, icon, subLabel, color, onClick, delay }: any) => (
    <button 
        onClick={onClick}
        className="group relative flex flex-col justify-between p-6 rounded-[2rem] bg-white/40 backdrop-blur-lg border border-white/60 hover:bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 w-full text-left overflow-hidden ring-1 ring-white/50 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-opacity group-hover:opacity-40`} style={{ backgroundColor: color }}></div>
        
        <div className="flex items-center gap-3 relative z-10 mb-4">
            <div className={`p-2.5 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md`} style={{ backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        
        <div className="relative z-10">
            <div className="text-3xl font-black text-slate-800 tracking-tight flex items-baseline gap-1 drop-shadow-sm">
                {value}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 opacity-80">{subLabel}</div>
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
        <div 
            onClick={onClick}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/30 border border-white/50 hover:bg-white/60 hover:border-white/80 transition-all cursor-pointer group backdrop-blur-sm"
        >
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                {renderLogo()}
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <div className="h-1 w-12 rounded-full mt-1.5 opacity-30" style={{ backgroundColor: color }}></div>
                </div>
            </div>
            
            <div className="flex gap-6 sm:gap-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Số phiếu</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-700">{data.count}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/50 text-slate-500 border border-white/50 backdrop-blur-sm">
                            {data.pct.toFixed(1)}%
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-col border-l border-slate-300/30 pl-6 sm:pl-10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sản phẩm (SKU)</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-700">{data.skuCount}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/50 text-slate-500 border border-white/50 backdrop-blur-sm">
                            {data.skuPct.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgressBarChart = ({ data, color, onBarClick }: { data: any[], color: string, onBarClick?: (label: string) => void }) => (
    <div className="space-y-5">
        {data.map((item, idx) => (
            <div key={idx} onClick={() => onBarClick && onBarClick(item.label)} className="group animate-fade-in cursor-pointer" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#003DA5] transition-colors">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">{item.value}</span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-white/50 px-1 rounded backdrop-blur-sm">({item.percentage.toFixed(1)}%)</span>
                    </div>
                </div>
                <div className="h-2.5 w-full bg-slate-100/50 rounded-full overflow-hidden shadow-inner border border-white/30 backdrop-blur-sm">
                    <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color || color }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>
                    </div>
                </div>
            </div>
        ))}
        {data.length === 0 && <div className="text-center text-slate-400 text-xs py-8 font-medium">Chưa có dữ liệu cho bộ lọc này</div>}
    </div>
);

const MonthlyTrendChart = ({ data, onBarClick }: { data: { month: string, count: number }[], onBarClick?: (month: string) => void }) => {
    const max = Math.max(...data.map(d => d.count), 1);
    
    return (
        <div className="w-full h-56 flex flex-col justify-end gap-2 pt-8 pb-2 px-2 select-none">
            {data.length > 0 ? (
                <div className="flex items-end justify-between h-full w-full gap-2 sm:gap-4">
                    {data.map((d, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                            {/* Bar container */}
                            <div 
                                onClick={() => onBarClick && onBarClick(d.month)}
                                className="w-full relative flex items-end justify-center h-full rounded-t-xl bg-slate-50/30 hover:bg-slate-50/60 transition-colors cursor-pointer overflow-visible backdrop-blur-sm"
                            >
                                {/* The Bar */}
                                <div 
                                    className="w-2/3 max-w-[40px] bg-gradient-to-t from-[#003DA5] to-blue-400 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out relative shadow-lg group-hover:shadow-blue-500/30"
                                    style={{ height: `${(d.count / max) * 100}%`, minHeight: '4px' }}
                                >
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 transform translate-y-2 group-hover:translate-y-0">
                                    {d.count} Phiếu
                                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                </div>
                            </div>
                            
                            {/* Label */}
                            <div className="mt-2 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors text-center w-full truncate">
                                {d.month}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-wider">
                    Chưa có dữ liệu theo tháng
                </div>
            )}
        </div>
    );
};

// --- DATA MODAL COMPONENT ---
interface DataModalProps {
    title: string;
    onClose: () => void;
    children?: React.ReactNode;
}

const DataModal = ({ title, onClose, children }: DataModalProps) => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-opacity animate-fade-in">
        <div className="bg-white/80 backdrop-blur-2xl w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in ring-1 ring-white/60 border border-white/40">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-lg sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#003DA5] rounded-xl border border-blue-100">
                        <ShoppingBagIcon className="w-5 h-5"/>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all active:scale-95 border border-transparent hover:border-red-100">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-[#f8fafc]/50">
                {children}
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport, onOpenAiAnalysis, isLoading, currentUser, systemSettings }) => {
    
    const [showDistributorModal, setShowDistributorModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showBrandStatsModal, setShowBrandStatsModal] = useState(false);
    const [selectedBrandDetail, setSelectedBrandDetail] = useState<'All' | 'HTM' | 'VMA' | 'Khác'>('All');

    const getVietnameseDate = () => {
        const date = new Date();
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${days[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
    };

    // Calculate recent activity
    const recentActivity = useMemo(() => {
        return reports
            .flatMap(r => (r.activityLog || []).map(log => ({
                ...log,
                reportId: r.id,
                reportName: r.tenThuongMai,
                reportCode: r.maSanPham
            })))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [reports]);

    // DATA CALCULATION
    const metrics = useMemo(() => {
        const totalReports = reports.length;
        const uniqueDistributors = new Set(reports.map(r => r.nhaPhanPhoi?.trim()).filter(Boolean)).size;
        const uniqueTotalSKUs = new Set(reports.map(r => r.maSanPham?.trim()).filter(Boolean)).size;
        const completedCount = reports.filter(r => r.trangThai === 'Hoàn thành').length;
        const completionRate = totalReports > 0 ? (completedCount / totalReports) * 100 : 0;
        
        // Overdue Calculation
        const overdueCount = reports.filter(r => {
             if (r.trangThai === 'Hoàn thành') return false;
             if (!r.ngayPhanAnh) return false;
             try {
                 const start = new Date(r.ngayPhanAnh);
                 const end = new Date();
                 const diffTime = Math.abs(end.getTime() - start.getTime());
                 const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 return days > 7;
             } catch { return false; }
        }).length;

        // Helper for Brand Stats
        const getBrandData = (brandName: string) => {
            const subset = reports.filter(r => r.nhanHang === brandName);
            const count = subset.length;
            const pct = totalReports > 0 ? (count / totalReports) * 100 : 0;
            const skus = new Set(subset.map(r => r.maSanPham?.trim()).filter(Boolean)).size;
            // SKU Percentage based on TOTAL unique SKUs in the system (filtered)
            const skuPct = uniqueTotalSKUs > 0 ? (skus / uniqueTotalSKUs) * 100 : 0;
            return { count, pct, skuCount: skus, skuPct };
        };

        // Brand Stats
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

        // Error Origin Data Generator
        const getOriginData = (brandFilter: 'All' | 'HTM' | 'VMA' | 'Khác') => {
            let subset = reports;
            if (brandFilter === 'HTM') subset = reports.filter(r => r.nhanHang === 'HTM');
            else if (brandFilter === 'VMA') subset = reports.filter(r => r.nhanHang === 'VMA');
            else if (brandFilter === 'Khác') subset = reports.filter(r => !['HTM', 'VMA'].includes(r.nhanHang));
            
            const total = subset.length;
            const counts: Record<string, number> = {};
            
            subset.forEach(r => {
                const origin = r.loaiLoi || 'Chưa phân loại';
                counts[origin] = (counts[origin] || 0) + 1;
            });

            return Object.entries(counts).map(([key, value]) => ({
                label: key,
                value,
                percentage: total > 0 ? (value / total) * 100 : 0,
                color: key === 'Lỗi Sản xuất' ? COLORS.DANGER : 
                       key === 'Lỗi Nhà cung cấp' ? COLORS.WARNING : 
                       key === 'Lỗi Hỗn hợp' ? COLORS.VIOLET : COLORS.SLATE
            })).sort((a, b) => b.value - a.value);
        };

        const originData = {
            All: getOriginData('All'),
            HTM: getOriginData('HTM'),
            VMA: getOriginData('VMA'),
            Khác: getOriginData('Khác'),
        };

        // Status Distribution
        const statusCounts: Record<string, number> = {};
        reports.forEach(r => { statusCounts[r.trangThai] = (statusCounts[r.trangThai] || 0) + 1 });
        const statusColors: Record<string, string> = {
            'Mới': '#3B82F6', // Blue
            'Đang tiếp nhận': '#6366f1', // Indigo
            'Đang xác minh': '#06b6d4', // Cyan
            'Đang xử lý': COLORS.WARNING,
            'Chưa tìm ra nguyên nhân': COLORS.VIOLET,
            'Hoàn thành': COLORS.SUCCESS
        };
        const statusData = Object.entries(statusCounts).map(([key, value]) => ({
            label: key,
            value,
            percentage: (value / totalReports) * 100,
            color: statusColors[key] || COLORS.SLATE
        })).sort((a, b) => b.value - a.value);

        // Top 5 Products
        const productCounts: Record<string, { count: number, name: string }> = {};
        reports.forEach(r => {
            const key = r.maSanPham || 'Unknown';
            if (!productCounts[key]) {
                productCounts[key] = { count: 0, name: r.tenThuongMai || 'Không xác định' };
            }
            productCounts[key].count += 1;
        });
        const topProducts = Object.entries(productCounts)
            .map(([code, data]) => ({ code, name: data.name, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Monthly Trend
        const monthlyStats: Record<string, number> = {};
        reports.forEach(r => {
            if (!r.ngayPhanAnh) return;
            try {
                const date = new Date(r.ngayPhanAnh);
                // Format: MM/YYYY
                if (!isNaN(date.getTime())) {
                    const key = `${('0' + (date.getMonth() + 1)).slice(-2)}/${date.getFullYear()}`;
                    monthlyStats[key] = (monthlyStats[key] || 0) + 1;
                }
            } catch (e) {}
        });

        const monthlyTrend = Object.entries(monthlyStats)
            .map(([month, count]) => {
                const [m, y] = month.split('/').map(Number);
                return { month, count, dateVal: new Date(y, m - 1).getTime() };
            })
            .sort((a, b) => a.dateVal - b.dateVal)
            .slice(-12); // Last 12 months

        return {
            totalReports,
            overdueCount,
            uniqueDistributors,
            uniqueTotalSKUs,
            completionRate,
            brandStats,
            originData,
            statusData,
            topProducts,
            monthlyTrend
        };
    }, [reports]);

    // --- Detailed Brand Stats Calculation for Modal ---
    const brandDetailedStats = useMemo(() => {
        const brands = ['HTM', 'VMA', 'Khác'] as const;
        const totalReports = reports.length;

        return brands.map(brand => {
            const subset = reports.filter(r => brand === 'Khác' ? !['HTM', 'VMA'].includes(r.nhanHang) : r.nhanHang === brand);
            const reportCount = subset.length;
            const skuCount = new Set(subset.map(r => r.maSanPham)).size;
            
            // Completion Rate
            const completed = subset.filter(r => r.trangThai === 'Hoàn thành').length;
            const completionRate = reportCount > 0 ? (completed / reportCount) * 100 : 0;

            // Origins
            const originCounts: Record<string, number> = {};
            subset.forEach(r => {
                const o = r.loaiLoi || 'Chưa phân loại';
                originCounts[o] = (originCounts[o] || 0) + 1;
            });
            const originData = Object.entries(originCounts).map(([label, value]) => ({
                label, value, percentage: reportCount > 0 ? (value / reportCount) * 100 : 0,
                color: label === 'Lỗi Sản xuất' ? COLORS.DANGER : label === 'Lỗi Nhà cung cấp' ? COLORS.WARNING : COLORS.VIOLET
            })).sort((a,b) => b.value - a.value);

            // Statuses
            const statusCounts: Record<string, number> = {};
            subset.forEach(r => {
                statusCounts[r.trangThai] = (statusCounts[r.trangThai] || 0) + 1;
            });
            const statusData = Object.entries(statusCounts).map(([label, value]) => ({
                label, value, percentage: reportCount > 0 ? (value / reportCount) * 100 : 0,
                color: label === 'Hoàn thành' ? COLORS.SUCCESS : label === 'Mới' ? '#3B82F6' : COLORS.WARNING
            })).sort((a,b) => b.value - a.value);

            // Top Products for this brand
            const productCounts: Record<string, { count: number, name: string }> = {};
            subset.forEach(r => {
                const key = r.maSanPham || 'Unknown';
                if (!productCounts[key]) productCounts[key] = { count: 0, name: r.tenThuongMai || '' };
                productCounts[key].count++;
                if (r.tenThuongMai && r.tenThuongMai.length > productCounts[key].name.length) productCounts[key].name = r.tenThuongMai;
            });
            const topProducts = Object.entries(productCounts)
                .map(([code, d]) => ({ code, name: d.name, count: d.count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3); // Take top 3

            return {
                brand,
                reportCount,
                skuCount,
                completionRate,
                pctTotal: totalReports > 0 ? (reportCount / totalReports) * 100 : 0,
                reportsPerSku: skuCount > 0 ? (reportCount / skuCount) : 0,
                originData,
                statusData,
                topProducts
            };
        });
    }, [reports]);

    // Data for the detailed chart in modal (for specific brand selection)
    const detailedChartData = useMemo(() => {
        const data = brandDetailedStats.find(b => b.brand === selectedBrandDetail);
        return data || { originData: [], statusData: [], topProducts: [] };
    }, [selectedBrandDetail, brandDetailedStats]);


    // --- Modal Data Aggregation ---
    const distributorStats = useMemo(() => {
        const stats: Record<string, { name: string, reportCount: number, skus: Set<string>, exchangeCount: number }> = {};
        reports.forEach(r => {
            const name = r.nhaPhanPhoi || 'Không xác định';
            if (!stats[name]) {
                stats[name] = { name, reportCount: 0, skus: new Set(), exchangeCount: 0 };
            }
            stats[name].reportCount++;
            if (r.maSanPham) stats[name].skus.add(r.maSanPham);
            stats[name].exchangeCount += (r.soLuongDoi || 0);
        });
        return Object.values(stats).sort((a, b) => b.reportCount - a.reportCount);
    }, [reports]);

    const productStats = useMemo(() => {
        const stats: Record<string, { code: string, name: string, reportCount: number, exchangeCount: number }> = {};
        reports.forEach(r => {
            const code = r.maSanPham || 'Unknown';
            if (!stats[code]) {
                stats[code] = { code, name: r.tenThuongMai || '', reportCount: 0, exchangeCount: 0 };
            }
            stats[code].reportCount++;
            stats[code].exchangeCount += (r.soLuongDoi || 0);
            if (r.tenThuongMai && r.tenThuongMai.length > stats[code].name.length) {
                stats[code].name = r.tenThuongMai;
            }
        });
        return Object.values(stats).sort((a, b) => b.reportCount - a.reportCount);
    }, [reports]);

    return (
        <div className="flex flex-col h-full w-full bg-transparent p-6 lg:p-8 overflow-y-auto custom-scrollbar">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 drop-shadow-sm">
                        Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003DA5] to-blue-600">{currentUser?.fullName || currentUser?.username}</span>
                        <span className="text-2xl animate-pulse">👋</span>
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <div className="p-1.5 bg-blue-50 text-[#003DA5] rounded-lg border border-blue-100">
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            {getVietnameseDate()}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onOpenAiAnalysis}
                        className="group flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 border border-white/20 hover:shadow-indigo-500/50"
                    >
                        <SparklesIcon className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-bold">Phân tích AI</span>
                    </button>
                    
                    <button 
                        onClick={() => onFilterSelect('all')}
                        className="flex items-center gap-2 bg-white/40 hover:bg-white/70 text-slate-700 px-5 py-3 rounded-2xl border border-white/60 shadow-sm transition-all text-sm font-bold hover:shadow-md backdrop-blur-md"
                    >
                        <TableCellsIcon className="w-4 h-4 text-slate-500" />
                        <span>Dữ liệu gốc</span>
                    </button>
                </div>
            </div>

            {/* 1. KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                <KpiCard 
                    title="Tổng Phiếu" 
                    value={<CountUp value={metrics.totalReports} />}
                    subValue="Hồ sơ ghi nhận"
                    icon={<InboxIcon className="w-5 h-5"/>}
                    color={COLORS.PRIMARY}
                    onClick={() => onFilterSelect('all')}
                    delay={0}
                />
                {/* NEW OVERDUE KPI CARD */}
                <KpiCard 
                    title="Quá Hạn (>7 ngày)" 
                    value={<CountUp value={metrics.overdueCount} />}
                    subValue="Chưa hoàn thành"
                    icon={<ExclamationCircleIcon className="w-5 h-5"/>}
                    color={COLORS.DANGER}
                    onClick={() => onFilterSelect('overdue')}
                    delay={50}
                />
                <KpiCard 
                    title="Nhà Phân Phối" 
                    value={<CountUp value={metrics.uniqueDistributors} />}
                    subValue="Có phát sinh lỗi"
                    icon={<BuildingStoreIcon className="w-5 h-5"/>}
                    color={COLORS.VIOLET}
                    onClick={() => setShowDistributorModal(true)}
                    delay={100}
                />
                <KpiCard 
                    title="Sản Phẩm (SKU)" 
                    value={<CountUp value={metrics.uniqueTotalSKUs} />}
                    subValue="Mã hàng bị phản ánh"
                    icon={<CubeIcon className="w-5 h-5"/>}
                    color={COLORS.WARNING}
                    onClick={() => setShowProductModal(true)}
                    delay={200}
                />
                <KpiCard 
                    title="Tỷ Lệ Hoàn Thành" 
                    value={<CountUp value={metrics.completionRate} suffix="%" />}
                    subValue="Đã xử lý xong"
                    icon={<CheckCircleIcon className="w-5 h-5"/>}
                    color={COLORS.SUCCESS}
                    onClick={() => onFilterSelect('status', 'Hoàn thành')}
                    delay={300}
                />
            </div>

            {/* 2. Monthly Trend & Status (NEW LAYOUT) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Monthly Trend Chart */}
                <GlassCard className="p-8 flex flex-col xl:col-span-2" delay={400}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-[#003DA5] rounded-xl">
                            <BarChartIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Số lỗi theo tháng</h3>
                    </div>
                    <div className="flex-1 flex items-end">
                        <MonthlyTrendChart 
                            data={metrics.monthlyTrend} 
                            onBarClick={(month) => onFilterSelect('month', month)}
                        />
                    </div>
                </GlassCard>

                {/* Status Distribution */}
                <GlassCard className="p-8" delay={500}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <ChartPieIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Trạng thái Xử lý</h3>
                    </div>
                    
                    <div className="flex flex-col items-center gap-6">
                        {/* Donut Chart */}
                        <div className="relative w-40 h-40 flex-shrink-0">
                            <div 
                                className="w-full h-full rounded-full shadow-inner"
                                style={{ 
                                    background: `conic-gradient(${
                                        metrics.statusData.length > 0 
                                        ? metrics.statusData.reduce((acc, item, idx) => {
                                            const prevDeg = idx === 0 ? 0 : metrics.statusData.slice(0, idx).reduce((sum, i) => sum + i.percentage, 0) * 3.6;
                                            const currentDeg = prevDeg + (item.percentage * 3.6);
                                            return acc + `${item.color} ${prevDeg}deg ${currentDeg}deg, `;
                                        }, '').slice(0, -2) 
                                        : '#e2e8f0 0deg 360deg'
                                    })` 
                                }}
                            ></div>
                            <div className="absolute inset-0 m-auto w-24 h-24 bg-white/80 backdrop-blur-xl rounded-full flex flex-col items-center justify-center shadow-lg border border-white/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng</span>
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">{metrics.totalReports}</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-1 gap-y-2 w-full">
                            {metrics.statusData.map((status, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => onFilterSelect('status', status.label)}
                                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-2 h-2 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: status.color }}></div>
                                        <span className="text-xs font-bold text-slate-600 truncate group-hover:text-slate-900">{status.label}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-800 bg-white/50 px-1.5 py-0.5 rounded shadow-sm border border-slate-200/50 backdrop-blur-sm">
                                        {status.percentage.toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* 3. Brand Stats & Error Origin Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* Brand Statistics */}
                <GlassCard className="p-8 flex flex-col" delay={600}>
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div 
                            className="flex items-center gap-3 cursor-pointer group/title"
                            onClick={() => setShowBrandStatsModal(true)}
                        >
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover/title:bg-indigo-100 transition-colors">
                                <ShoppingBagIcon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg group-hover/title:text-indigo-700 transition-colors">Thống kê theo Nhãn hàng</h3>
                        </div>
                        <button 
                            onClick={() => setShowBrandStatsModal(true)}
                            className="text-xs font-bold text-[#003DA5] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
                        >
                            Chi tiết <ArrowRightOnRectangleIcon className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-4 flex-1 justify-center">
                        <BrandStatRow 
                            brand="HTM" 
                            label="HTM" 
                            color={COLORS.PRIMARY} 
                            data={metrics.brandStats.HTM} 
                            onClick={() => onFilterSelect('brand', 'HTM')}
                            logoUrl={systemSettings?.brandLogos?.HTM}
                        />
                        <BrandStatRow 
                            brand="VMA" 
                            label="VMA" 
                            color={COLORS.SUCCESS} 
                            data={metrics.brandStats.VMA} 
                            onClick={() => onFilterSelect('brand', 'VMA')}
                            logoUrl={systemSettings?.brandLogos?.VMA}
                        />
                        {metrics.brandStats.Other.count > 0 && (
                            <BrandStatRow 
                                brand="ETC" 
                                label="Khác" 
                                color={COLORS.SLATE} 
                                data={metrics.brandStats.Other} 
                                onClick={() => onFilterSelect('brand', 'Khác')}
                            />
                        )}
                    </div>
                </GlassCard>

                {/* Error Origin - ONLY TOTAL (Removed Tabs) */}
                <GlassCard className="p-8" delay={700}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">Nguồn gốc Lỗi (Tổng hợp)</h3>
                        </div>
                    </div>
                    <div className="mt-2 min-h-[200px]">
                        <ProgressBarChart 
                            data={metrics.originData['All']} 
                            color={COLORS.DANGER}
                            onBarClick={(label) => onFilterSelect('defectType', label)} 
                        />
                    </div>
                </GlassCard>
            </div>

            {/* 4. Recent Activity & Top Products Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                {/* Recent Activity Feed - NEW TRACKING FEATURE */}
                <GlassCard className="p-8 flex flex-col h-[400px]" delay={750}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <ClockIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Hoạt động gần đây</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((log, idx) => (
                                <div key={`${log.id}-${idx}`} onClick={() => onSelectReport(reports.find(r => r.id === log.reportId) as DefectReport)} className="flex gap-3 group cursor-pointer">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'comment' ? 'bg-blue-400' : 'bg-slate-300'} ring-4 ring-white shadow-sm`}></div>
                                    <div className="flex-1 min-w-0 pb-3 border-b border-slate-100 group-last:border-0 group-last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {log.reportName}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-1.5 rounded">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">{log.reportCode}</span>
                                            <span className="text-[10px] text-slate-500">•</span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase">{log.user}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 bg-slate-50/50 p-1.5 rounded-lg italic">
                                            {log.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                                <InboxIcon className="w-8 h-8 mb-2 opacity-20"/>
                                Chưa có hoạt động nào
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Top Products */}
                <GlassCard className="p-8 flex flex-col h-[400px]" delay={800}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <TagIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Top 5 Sản phẩm bị phản ánh</h3>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {metrics.topProducts.map((prod, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-all border border-white/50 shadow-sm group backdrop-blur-sm">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-extrabold text-[#003DA5] truncate bg-blue-50/50 px-1.5 rounded w-fit mb-0.5 border border-blue-100/50">{prod.code}</p>
                                        <p className="text-xs font-bold text-slate-700 line-clamp-1 leading-tight group-hover:text-slate-900" title={prod.name}>{prod.name}</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-slate-800 leading-none pl-4">{prod.count}</span>
                            </div>
                        ))}
                        {metrics.topProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm font-bold opacity-50">
                                Chưa có dữ liệu
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* --- DETAILS MODALS --- */}
            {showDistributorModal && (
                <DataModal title="Thống kê Nhà Phân Phối" onClose={() => setShowDistributorModal(false)}>
                    <table className="min-w-full divide-y divide-slate-200/50">
                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">STT</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà Phân Phối</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Số Phiếu</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Số SP (SKU)</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-emerald-600 uppercase tracking-wider w-32">SL Đổi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-slate-100/50">
                            {distributorStats.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500 text-center">{idx + 1}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 text-center">{item.reportCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 text-center">{item.skus.size}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-center">{item.exchangeCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DataModal>
            )}

            {showProductModal && (
                <DataModal title="Thống kê theo Sản Phẩm (SKU)" onClose={() => setShowProductModal(false)}>
                    <table className="min-w-full divide-y divide-slate-200/50">
                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">STT</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Mã SP</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Thương Mại</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Số Phiếu</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-emerald-600 uppercase tracking-wider w-32">SL Đổi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-slate-100/50">
                            {productStats.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500 text-center">{idx + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#003DA5]">{item.code}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 text-center">{item.reportCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-center">{item.exchangeCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DataModal>
            )}

            {showBrandStatsModal && (
                <DataModal title="Chi tiết Thống kê Nhãn hàng" onClose={() => setShowBrandStatsModal(false)}>
                    <div className="p-6 space-y-8 bg-slate-50/30">
                        {/* 1. Brand Selector Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* All Card */}
                            <button 
                                onClick={() => setSelectedBrandDetail('All')}
                                className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-lg flex flex-col gap-2 group relative overflow-hidden text-left ${selectedBrandDetail === 'All' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shadow-sm">All</div>
                                        <h4 className="font-bold text-slate-800 text-sm">Tất cả</h4>
                                    </div>
                                    {selectedBrandDetail === 'All' && <CheckCircleIcon className="w-5 h-5 text-indigo-500" />}
                                </div>
                                <div className="mt-2 w-full">
                                    <div className="flex justify-between items-end">
                                        <p className="text-2xl font-black text-slate-800">{metrics.totalReports}</p>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded shadow-sm border border-slate-100">Tổng phiếu</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-full"></div>
                                    </div>
                                </div>
                            </button>

                            {/* Brand Cards */}
                            {brandDetailedStats.map((stat, idx) => {
                                const isSelected = selectedBrandDetail === stat.brand;
                                let logoUrl = undefined;
                                if (stat.brand === 'HTM') logoUrl = systemSettings?.brandLogos?.HTM;
                                if (stat.brand === 'VMA') logoUrl = systemSettings?.brandLogos?.VMA;

                                return (
                                    <button 
                                        key={idx} 
                                        onClick={() => setSelectedBrandDetail(stat.brand as any)}
                                        className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-lg flex flex-col gap-2 group relative overflow-hidden text-left ${isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20 shadow-md' : 'bg-white border-slate-200 hover:border-blue-200'}`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-3">
                                                {stat.brand === 'HTM' ? <BrandLogoHTM className="w-8 h-8 rounded-lg shadow-sm" textSize="text-[8px]" imageUrl={logoUrl} /> :
                                                 stat.brand === 'VMA' ? <BrandLogoVMA className="w-8 h-8 rounded-lg shadow-sm" textSize="text-[8px]" imageUrl={logoUrl} /> :
                                                 <BrandLogoETC className="w-8 h-8 rounded-lg shadow-sm" textSize="text-[8px]" />}
                                                <h4 className="font-bold text-slate-800 text-sm">{stat.brand}</h4>
                                            </div>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        
                                        <div className="mt-2 w-full">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-2xl font-black text-slate-800">{stat.reportCount}</p>
                                                    <span className="text-xs font-bold text-slate-400">/ {stat.skuCount} SKU</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded shadow-sm border border-slate-100">{stat.pctTotal.toFixed(0)}%</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stat.completionRate}%` }}></div>
                                                </div>
                                                <span className="text-[9px] font-bold text-emerald-600">{stat.completionRate.toFixed(0)}% xong</span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* 2. Content Area based on Selection */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Left: Charts (Origin & Status) */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Visual Comparison (Only for All) */}
                                {selectedBrandDetail === 'All' && (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                                            <BarChartIcon className="w-4 h-4 text-blue-500"/> So sánh Trực quan
                                        </h4>
                                        <div className="flex items-end justify-center gap-12 h-40 px-8">
                                            {brandDetailedStats.map((stat, idx) => {
                                                const maxVal = Math.max(...brandDetailedStats.map(s => s.reportCount));
                                                const height = maxVal > 0 ? (stat.reportCount / maxVal) * 100 : 0;
                                                let logoUrl = undefined;
                                                if (stat.brand === 'HTM') logoUrl = systemSettings?.brandLogos?.HTM;
                                                if (stat.brand === 'VMA') logoUrl = systemSettings?.brandLogos?.VMA;

                                                return (
                                                    <div key={idx} className="flex flex-col items-center gap-3 w-24 group">
                                                        <div className="w-full bg-slate-100 rounded-t-xl relative flex items-end justify-center h-full overflow-hidden">
                                                            <div 
                                                                className={`w-full absolute bottom-0 transition-all duration-1000 ease-out ${
                                                                    stat.brand === 'HTM' ? 'bg-[#003DA5]' : 
                                                                    stat.brand === 'VMA' ? 'bg-[#059669]' : 'bg-slate-400'
                                                                }`}
                                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                                            ></div>
                                                            <span className="relative z-10 text-white font-bold text-lg mb-2 drop-shadow-md">{stat.reportCount}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            {stat.brand === 'HTM' ? <BrandLogoHTM className="w-10 h-10 shadow-sm" textSize="text-[10px]" imageUrl={logoUrl} /> :
                                                             stat.brand === 'VMA' ? <BrandLogoVMA className="w-10 h-10 shadow-sm" textSize="text-[10px]" imageUrl={logoUrl} /> :
                                                             <BrandLogoETC className="w-10 h-10 shadow-sm" textSize="text-[10px]" />}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Drill Down Charts */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-700 mb-6 flex justify-between items-center">
                                        <span className="flex items-center gap-2">
                                            {selectedBrandDetail !== 'All' && (
                                                selectedBrandDetail === 'HTM' ? <BrandLogoHTM className="w-6 h-6 rounded-md" textSize="text-[6px]" imageUrl={systemSettings?.brandLogos?.HTM} /> :
                                                selectedBrandDetail === 'VMA' ? <BrandLogoVMA className="w-6 h-6 rounded-md" textSize="text-[6px]" imageUrl={systemSettings?.brandLogos?.VMA} /> :
                                                <BrandLogoETC className="w-6 h-6 rounded-md" textSize="text-[6px]" />
                                            )}
                                            Phân tích chi tiết ({selectedBrandDetail === 'All' ? 'Tổng hợp' : selectedBrandDetail})
                                        </span>
                                        {selectedBrandDetail !== 'All' && (
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold">
                                                {brandDetailedStats.find(b => b.brand === selectedBrandDetail)?.reportCount} phiếu
                                            </span>
                                        )}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><ShieldCheckIcon className="w-4 h-4" /></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase">Nguồn gốc lỗi</span>
                                            </div>
                                            <ProgressBarChart 
                                                data={selectedBrandDetail === 'All' ? metrics.originData['All'] : detailedChartData.originData} 
                                                color={COLORS.DANGER} 
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><ClockIcon className="w-4 h-4" /></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase">Trạng thái xử lý</span>
                                            </div>
                                            <ProgressBarChart 
                                                data={selectedBrandDetail === 'All' ? metrics.statusData : detailedChartData.statusData} 
                                                color={COLORS.WARNING} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Top Products & Insights */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
                                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <ExclamationCircleIcon className="w-4 h-4 text-orange-500"/>
                                        {selectedBrandDetail === 'All' ? 'Top Sản phẩm (Chung)' : `Top Sản phẩm (${selectedBrandDetail})`}
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {(selectedBrandDetail === 'All' ? metrics.topProducts : detailedChartData.topProducts).slice(0, 5).map((prod, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition-colors group">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-[10px] font-bold text-[#003DA5] bg-white px-1.5 rounded border border-slate-200 inline-block mb-1">{prod.code}</p>
                                                        <span className="text-xs font-black text-slate-800">{prod.count}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-tight group-hover:text-slate-900" title={prod.name}>{prod.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(selectedBrandDetail === 'All' ? metrics.topProducts : detailedChartData.topProducts).length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-xs italic">Chưa có dữ liệu</div>
                                        )}
                                    </div>

                                    {/* Mini Insight */}
                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin nhanh</h5>
                                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <SparklesIcon className="w-3 h-3 text-blue-600" />
                                                <span className="text-xs font-bold text-blue-700">Nguyên nhân chính</span>
                                            </div>
                                            <p className="text-xs text-blue-800/80 leading-relaxed">
                                                {(() => {
                                                    const data = selectedBrandDetail === 'All' ? metrics.originData['All'] : detailedChartData.originData;
                                                    if (data.length > 0) return `${data[0].label} chiếm tỷ trọng cao nhất (${data[0].percentage.toFixed(0)}%).`;
                                                    return "Chưa đủ dữ liệu để phân tích.";
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DataModal>
            )}

        </div>
    );
};

export default DashboardReport;
