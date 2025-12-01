
import React, { useMemo, useState } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, 
    ShoppingBagIcon, TagIcon, ListBulletIcon,
    FunnelIcon, ShieldCheckIcon, ArrowUpIcon, ArrowDownIcon,
    CubeIcon, ChartPieIcon, UserGroupIcon,
    InboxIcon, TruckIcon, SparklesIcon, WrenchIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
  onSelectReport: (report: DefectReport) => void;
  isLoading?: boolean;
}

// --- BRAND CONSTANTS ---
const BRAND = {
    BLUE: '#003DA5', // HTM & Primary
    RED: '#C5003E',  // Alert & Defects
    GREEN: '#009183', // VMA & Success
    AMBER: '#F59E0B', // Warning/Processing
    SLATE: '#64748B', // Neutral
};

// --- HELPER FUNCTIONS ---

const parseDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return { year: y, month: m - 1, day: d }; 
};

// Generate data for sparklines
const getSparklineData = (reports: DefectReport[], mode: 'ticket' | 'qty' | 'exchange', monthsBack: number = 6) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const data = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;
        while (targetMonth < 0) {
            targetMonth += 12;
            targetYear -= 1;
        }

        let val = 0;
        reports.forEach(r => {
            if (!r.ngayPhanAnh) return;
            const d = parseDate(r.ngayPhanAnh);
            if (!d) return;
            
            if (d.month === targetMonth && d.year === targetYear) {
                if (mode === 'ticket') val += 1;
                else if (mode === 'qty') val += (r.soLuongLoi || 0);
                else if (mode === 'exchange') val += (r.soLuongDoi || 0);
            }
        });
        data.push(val);
    }
    return data;
};

const calculateTrend = (reports: DefectReport[], mode: 'qty' | 'ticket' | 'exchange') => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentVal = 0;
    let lastVal = 0;

    reports.forEach(r => {
        if (!r.ngayPhanAnh) return;
        const d = parseDate(r.ngayPhanAnh);
        if (!d) return;

        let val = 0;
        if (mode === 'qty') val = (r.soLuongLoi || 0);
        else if (mode === 'exchange') val = (r.soLuongDoi || 0);
        else val = 1;
        
        if (d.month === currentMonth && d.year === currentYear) currentVal += val;
        if (d.month === lastMonth && d.year === lastMonthYear) lastVal += val;
    });

    const diff = currentVal - lastVal;
    const percent = lastVal > 0 ? ((diff / lastVal) * 100).toFixed(1) : (diff > 0 ? '100' : '0');
    
    return {
        value: currentVal,
        diff,
        percent: Number(percent),
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
        sparkline: getSparklineData(reports, mode)
    };
};

// --- SUB-COMPONENTS ---

// 1. Sparkline SVG
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = 0;
    const width = 100;
    const height = 40;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-50">
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// 2. KPI Card
const KpiCard = ({ title, value, subValue, trend, icon, colorHex, onClick, trendInverse = false }: any) => {
    const isUp = trend.trend === 'up';
    const isNeutral = trend.trend === 'neutral';
    
    // For metrics like "Time" or "Defects", Up might be bad.
    const isPositive = trendInverse ? !isUp : isUp;
    
    // Determine trend color
    let trendColorClass = 'text-slate-400 bg-slate-100';
    if (!isNeutral) {
        if (isPositive) trendColorClass = 'text-emerald-600 bg-emerald-50';
        else trendColorClass = 'text-rose-600 bg-rose-50';
    }

    const TrendIcon = isUp ? ArrowUpIcon : ArrowDownIcon;

    return (
        <div onClick={onClick} className={`relative bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 group cursor-pointer overflow-hidden hover:-translate-y-1`}>
            {/* Background Decoration */}
            <div 
                className="absolute -top-6 -right-6 w-32 h-32 opacity-[0.05] rounded-full transition-transform group-hover:scale-110 blur-xl"
                style={{ backgroundColor: colorHex }}
            ></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div 
                    className="p-3 rounded-2xl bg-opacity-10 text-opacity-100 ring-1 ring-inset ring-black/5"
                    style={{ backgroundColor: `${colorHex}15`, color: colorHex }}
                >
                    {React.cloneElement(icon, { className: "h-6 w-6" })}
                </div>
                {/* Sparkline in top right */}
                <div className="w-24 h-10">
                     <Sparkline data={trend.sparkline} color={colorHex} />
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</h3>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{title}</p>
                    {!isNeutral && (
                        <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendColorClass}`}>
                            <TrendIcon className="w-3 h-3" />
                            {Math.abs(trend.percent)}%
                        </div>
                    )}
                </div>
                {subValue && <p className="text-[11px] font-medium text-slate-500 mt-2">{subValue}</p>}
            </div>
        </div>
    );
};

// 3. Donut Chart
const DonutChart = ({ data, colors, centerLabel, centerValue, onClickSlice }: any) => {
    const total = data.reduce((acc: number, item: any) => acc + item.value, 0);
    let cumulativeAngle = 0;
    
    // Config
    const size = 180;
    const strokeWidth = 22; // Slightly thinner for elegance
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    if (total === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-slate-300">
            <ChartPieIcon className="w-10 h-10 mb-2 opacity-30"/>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Chưa có dữ liệu</span>
        </div>
    );

    return (
        <div className="flex flex-row items-center gap-6 h-full justify-center w-full px-2">
            <div className="relative w-44 h-44 flex-shrink-0 group/chart">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-md">
                    {data.map((item: any, index: number) => {
                        const percent = item.value / total;
                        const strokeDasharray = `${percent * circumference} ${circumference}`;
                        const rotateAngle = (cumulativeAngle / total) * 360;
                        cumulativeAngle += item.value;
                        
                        return (
                            <circle
                                key={index}
                                r={radius}
                                cx={center}
                                cy={center}
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={0} // Offset is handled by rotation
                                transform={`rotate(${rotateAngle} ${center} ${center})`}
                                className="transition-all duration-300 hover:opacity-80 cursor-pointer hover:stroke-[24]"
                                onClick={() => onClickSlice && onClickSlice(item.label)}
                            >
                                <title>{item.label}: {item.value}</title>
                            </circle>
                        );
                    })}
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{centerValue || total}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{centerLabel}</span>
                </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-2 min-w-[120px]">
                {data.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-colors" onClick={() => onClickSlice && onClickSlice(item.label)}>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-black/5 flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></span>
                            <span className="font-semibold text-slate-600 group-hover:text-slate-900 truncate max-w-[90px]" title={item.label}>{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md text-[10px] ml-2">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. Enhanced Trend Chart (Curved Area)
const TrendChart = ({ data, label, color = "#003DA5" }: any) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-300 text-xs font-medium">Chưa có dữ liệu</div>;

    const maxVal = Math.max(...data.map((d: any) => d.count), 5) * 1.2;
    const height = 220;
    const width = 800;
    const paddingX = 20;

    const getX = (i: number) => paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const getY = (v: number) => height - (v / maxVal) * height;

    // Smooth bezier curve generation
    let dPath = `M ${getX(0)} ${getY(data[0].count)}`;
    for (let i = 0; i < data.length - 1; i++) {
        const x0 = getX(i);
        const y0 = getY(data[i].count);
        const x1 = getX(i + 1);
        const y1 = getY(data[i + 1].count);
        
        // Control points
        const cp1x = x0 + (x1 - x0) * 0.5;
        const cp1y = y0;
        const cp2x = x1 - (x1 - x0) * 0.5;
        const cp2y = y1;
        
        dPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }
    
    // Close area for fill
    const areaPath = `${dPath} L ${width - paddingX} ${height} L ${paddingX} ${height} Z`;

    return (
        <div className="w-full h-full relative flex flex-col">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" onMouseLeave={() => setHoverIndex(null)}>
                <defs>
                    <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                
                {/* Horizontal Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line key={t} x1={0} y1={height * t} x2={width} y2={height * t} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                <path d={areaPath} fill={`url(#grad-${label})`} className="transition-all duration-300" />
                <path d={dPath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

                {/* Interactive Points */}
                {data.map((d: any, i: number) => {
                    const x = getX(i);
                    const y = getY(d.count);
                    const isHover = hoverIndex === i;
                    
                    return (
                        <g key={i}>
                            {/* Invisible hit area */}
                            <rect 
                                x={x - (width/data.length)/2} y={0} width={width/data.length} height={height} 
                                fill="transparent" 
                                onMouseEnter={() => setHoverIndex(i)}
                                style={{cursor: 'pointer'}}
                            />
                            
                            {/* Dot */}
                            <circle 
                                cx={x} cy={y} r={isHover ? 6 : 3} 
                                fill="white" stroke={color} strokeWidth={isHover ? 3 : 2} 
                                className="transition-all duration-200"
                                style={{ opacity: isHover ? 1 : 0 }}
                            />
                            
                            {/* Vertical Line */}
                            {isHover && (
                                <line x1={x} y1={y} x2={x} y2={height} stroke={color} strokeWidth="1" strokeDasharray="3 3" />
                            )}
                        </g>
                    )
                })}
            </svg>
            
            {/* Enhanced Tooltip */}
            {hoverIndex !== null && data[hoverIndex] && (
                <div 
                    className="absolute top-0 transform -translate-x-1/2 -translate-y-6 bg-slate-800/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-xl shadow-xl pointer-events-none transition-all z-20 flex flex-col items-center border border-slate-700/50"
                    style={{ left: `${(hoverIndex / (data.length - 1)) * 100}%` }}
                >
                    <span className="font-bold text-[10px] text-slate-300 uppercase tracking-widest mb-0.5">Tháng {data[hoverIndex].month}</span>
                    <span className="text-lg font-bold leading-none">{data[hoverIndex].count.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">{label}</span></span>
                    
                    {/* Tiny Triangle */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/90"></div>
                </div>
            )}

            <div className="flex justify-between mt-3 border-t border-slate-100 pt-3">
                {data.map((d: any, i: number) => (
                    <div key={i} className={`text-[10px] font-bold uppercase text-center flex-1 transition-colors ${hoverIndex === i ? 'scale-110 font-black' : 'text-slate-400'}`} style={{ color: hoverIndex === i ? color : undefined }}>T{d.month}</div>
                ))}
            </div>
        </div>
    );
};

// 5. Recent Activity List
const RecentActivityList = ({ reports, onSelect }: { reports: DefectReport[], onSelect: (r: DefectReport) => void }) => {
    const recent = reports.slice(0, 7);
    if (recent.length === 0) return <div className="text-center text-slate-400 text-xs py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">Chưa có hoạt động nào.</div>;

    return (
        <div className="space-y-3">
            {recent.map((r, i) => {
                const isResolved = r.trangThai === 'Hoàn thành';
                return (
                    <div key={r.id} onClick={() => onSelect(r)} className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer group transition-all rounded-xl border border-transparent hover:border-slate-100 hover:shadow-sm">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-inset ring-white ${isResolved ? 'bg-emerald-50 text-[#009183]' : 'bg-blue-50 text-[#003DA5]'}`}>
                            {isResolved ? <CheckCircleIcon className="w-5 h-5"/> : <WrenchIcon className="w-5 h-5"/>}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-start mb-0.5">
                                <span className="text-sm font-bold text-slate-700 truncate group-hover:text-[#003DA5] transition-colors leading-tight block pr-2">{r.tenThuongMai}</span>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">{new Date(r.ngayPhanAnh).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-mono bg-slate-50 px-1.5 rounded border border-slate-100 group-hover:border-slate-200 transition-colors">{r.maSanPham}</span>
                                <span className={`text-[10px] font-bold px-1.5 rounded-full ${isResolved ? 'text-[#009183] bg-emerald-50' : 'text-[#003DA5] bg-blue-50'}`}>
                                    {r.trangThai}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport, isLoading }) => {
  const [viewMode, setViewMode] = useState<'service' | 'production'>('service');
  const [prodMetric, setProdMetric] = useState<'defect' | 'exchange' | 'ratio'>('defect');

  // --- DATA PROCESSING (Memoized) ---
  const stats = useMemo(() => {
      // Initialize counters
      let totalTickets = 0, totalDefectQty = 0, totalExchangeQty = 0;
      let resolvedCount = 0, agingTickets = 0;
      
      const distMap = new Map();
      const prodMap = new Map();
      
      const statusCounts = { 'Mới': 0, 'Đang xử lý': 0, 'Chưa tìm ra nguyên nhân': 0, 'Hoàn thành': 0 };
      const sourceCounts = { 'Sản xuất': 0, 'NCC': 0, 'Hỗn hợp': 0, 'Khác': 0 };
      // New: Detailed completion stats for Service
      let completedWithExchange = 0;
      let completedNoExchange = 0;

      // New: SKU Tracking per brand
      const brandCounts = { 
          'HTM': { t: 0, q: 0, e: 0, skus: new Set<string>() }, 
          'VMA': { t: 0, q: 0, e: 0, skus: new Set<string>() } 
      };
      
      const uniqueSKUs = new Set<string>();

      const monthlyTicket = Array(12).fill(0);
      const monthlyDefect = Array(12).fill(0);
      const monthlyExchange = Array(12).fill(0);

      const today = new Date();
      const currentYear = today.getFullYear();

      reports.forEach(r => {
          // Basic Stats
          totalTickets++;
          const dQty = r.soLuongLoi || 0;
          const eQty = r.soLuongDoi || 0;
          totalDefectQty += dQty;
          totalExchangeQty += eQty;

          // Status & Source
          if (statusCounts[r.trangThai] !== undefined) statusCounts[r.trangThai]++;
          
          if (r.trangThai === 'Hoàn thành') {
              resolvedCount++;
              if (eQty > 0) completedWithExchange++;
              else completedNoExchange++;
          }

          let src = 'Khác';
          if (r.loaiLoi?.includes('Sản xuất')) src = 'Sản xuất';
          else if (r.loaiLoi?.includes('Nhà cung cấp')) src = 'NCC';
          else if (r.loaiLoi?.includes('Hỗn hợp')) src = 'Hỗn hợp';
          sourceCounts[src as keyof typeof sourceCounts]++;

          // Brand logic
          const brand = r.nhanHang === 'HTM' || r.nhanHang === 'VMA' ? r.nhanHang : 'HTM'; 
          if (brandCounts[brand]) {
              brandCounts[brand].t++;
              brandCounts[brand].q += dQty;
              brandCounts[brand].e += eQty;
              if (r.maSanPham) brandCounts[brand].skus.add(r.maSanPham);
          }

          // SKU Logic
          if (r.maSanPham) {
              uniqueSKUs.add(r.maSanPham);
              const p = prodMap.get(r.maSanPham) || { code: r.maSanPham, name: r.tenThuongMai, ticket: 0, defect: 0, exchange: 0 };
              p.ticket++; p.defect += dQty; p.exchange += eQty;
              prodMap.set(r.maSanPham, p);
          }

          // Safe Date Parsing
          const createdDate = parseDate(r.ngayPhanAnh);
          
          // Distributors
          if (r.nhaPhanPhoi) {
              distMap.set(r.nhaPhanPhoi, (distMap.get(r.nhaPhanPhoi) || 0) + 1);
          }

          // Aging Tickets (Active & > 7 days)
          if (r.trangThai !== 'Hoàn thành' && r.ngayPhanAnh && createdDate) {
              const start = new Date(createdDate.year, createdDate.month, createdDate.day);
              const age = Math.ceil(Math.abs(today.getTime() - start.getTime()) / (86400000));
              if (age > 7) agingTickets++;
          }

          // Monthly Trend (Current Year)
          if (createdDate && createdDate.year === currentYear) {
              const m = createdDate.month;
              monthlyTicket[m]++;
              monthlyDefect[m] += dQty;
              monthlyExchange[m] += eQty;
          }
      });

      // Trends
      const trendTicket = calculateTrend(reports, 'ticket');
      const trendDefect = calculateTrend(reports, 'qty');
      const trendExchange = calculateTrend(reports, 'exchange');

      // Top Lists
      const topProducts = Array.from(prodMap.values());
      const topProductsByTicket = [...topProducts].sort((a,b) => b.ticket - a.ticket).slice(0, 5);
      const topProductsByDefect = [...topProducts].sort((a,b) => b.defect - a.defect).slice(0, 10); // For Pareto
      
      // Calculate Pareto Cumulative
      let cumDefect = 0;
      const paretoData = topProductsByDefect.map(p => {
          cumDefect += p.defect;
          return { ...p, cumPercent: (cumDefect / totalDefectQty) * 100 };
      });

      // Format for Donut Charts
      // Updated Service Donut: Detailed Status with Specific Colors
      const donutStatusData = [
          { label: 'Mới', value: statusCounts['Mới'] },
          { label: 'Đang xử lý', value: statusCounts['Đang xử lý'] },
          { label: 'Chưa rõ NN', value: statusCounts['Chưa tìm ra nguyên nhân'] },
          { label: 'Hoàn thành (Đổi)', value: completedWithExchange },
          { label: 'Hoàn thành (Không đổi)', value: completedNoExchange },
      ].filter(d => d.value > 0);

      // Colors mapped to status: Blue(New), Amber(Processing), Slate(Pending), Red(Exchange), Green(NoExchange)
      const donutStatusColors = [BRAND.BLUE, BRAND.AMBER, BRAND.SLATE, BRAND.RED, BRAND.GREEN];

      const donutSourceData = [
          { label: 'Sản xuất', value: sourceCounts['Sản xuất'] },
          { label: 'NCC', value: sourceCounts['NCC'] },
          { label: 'Hỗn hợp', value: sourceCounts['Hỗn hợp'] },
          { label: 'Khác', value: sourceCounts['Khác'] },
      ].filter(d => d.value > 0);

      return {
          totalTickets, totalDefectQty, totalExchangeQty,
          totalUniqueSKUs: uniqueSKUs.size,
          agingTickets,
          trendTicket, trendDefect, trendExchange,
          statusCounts, sourceCounts, brandCounts,
          topProductsByTicket, paretoData,
          chartTicket: monthlyTicket.map((v, i) => ({ month: i + 1, count: v })),
          chartDefect: monthlyDefect.map((v, i) => ({ month: i + 1, count: v })),
          chartExchange: monthlyExchange.map((v, i) => ({ month: i + 1, count: v })),
          chartRatio: monthlyDefect.map((d, i) => ({ month: i + 1, count: d > 0 ? (monthlyExchange[i] / d) * 100 : 0 })),
          uniqueDistributors: distMap.size,
          exchangeRate: totalDefectQty > 0 ? ((totalExchangeQty/totalDefectQty)*100).toFixed(1) : 0,
          donutStatusData,
          donutStatusColors,
          donutSourceData
      };
  }, [reports]);

  if (isLoading) return (
      <div className="p-6 space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 w-1/4 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar pb-24">
            
            {/* HEADER & SWITCHER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {viewMode === 'service' ? 'Tổng quan Dịch vụ' : 'Chất lượng Sản xuất'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#009183] animate-pulse shadow-[0_0_8px_rgba(0,145,131,0.5)]"></span>
                        Cập nhật theo thời gian thực
                    </p>
                </div>
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    <button 
                        onClick={() => setViewMode('service')}
                        className={`flex items-center px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'service' ? 'bg-[#003DA5] text-white shadow-md shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        <UserGroupIcon className="w-4 h-4 mr-2" /> Dịch vụ
                    </button>
                    <button 
                        onClick={() => setViewMode('production')}
                        className={`flex items-center px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'production' ? 'bg-[#C5003E] text-white shadow-md shadow-rose-900/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        <CubeIcon className="w-4 h-4 mr-2" /> Sản xuất
                    </button>
                </div>
            </div>

            {/* KPI CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {viewMode === 'service' ? (
                    <>
                        <KpiCard 
                            title="TỔNG PHIẾU" value={stats.totalTickets} trend={stats.trendTicket} 
                            icon={<InboxIcon/>} colorHex={BRAND.BLUE} 
                            onClick={() => onFilterSelect('all')}
                        />
                        <KpiCard 
                            title="NHÀ PHÂN PHỐI" value={stats.uniqueDistributors} subValue="Đã phản ánh" trend={stats.trendTicket}
                            icon={<TruckIcon/>} colorHex={BRAND.BLUE} 
                        />
                        <KpiCard 
                            title="MẶT HÀNG LỖI (SKU)" value={stats.totalUniqueSKUs} subValue="Số mã sản phẩm bị lỗi"
                            trend={stats.trendTicket} 
                            icon={<TagIcon/>} colorHex={BRAND.RED}
                            trendInverse={true}
                        />
                        <KpiCard 
                            title="TỶ LỆ HOÀN THÀNH" value={`${((stats.statusCounts['Hoàn thành']/stats.totalTickets)*100 || 0).toFixed(0)}%`} 
                            trend={stats.trendTicket} 
                            icon={<CheckCircleIcon/>} colorHex={BRAND.GREEN} 
                            onClick={() => onFilterSelect('status', 'Hoàn thành')}
                        />
                    </>
                ) : (
                    <>
                        <KpiCard 
                            title="SẢN LƯỢNG LỖI" value={stats.totalDefectQty.toLocaleString()} trend={stats.trendDefect} 
                            icon={<CubeIcon/>} colorHex={BRAND.RED} trendInverse={true}
                        />
                        <KpiCard 
                            title="SẢN LƯỢNG ĐỔI" value={stats.totalExchangeQty.toLocaleString()} trend={stats.trendExchange} 
                            icon={<ShoppingBagIcon/>} colorHex={BRAND.BLUE} trendInverse={true}
                        />
                        <KpiCard 
                            title="TỶ LỆ ĐỔI / LỖI" value={`${stats.exchangeRate}%`} subValue="Mức độ nghiêm trọng" 
                            trend={{trend: 'neutral', percent: 0, sparkline: []}} 
                            icon={<ChartPieIcon/>} colorHex={BRAND.AMBER} 
                        />
                        <KpiCard 
                            title="ĐÃ KHẮC PHỤC" value={(stats.totalDefectQty - stats.totalExchangeQty).toLocaleString()} subValue="Sửa chữa thành công" 
                            trend={{trend: 'up', percent: 0, sparkline: []}} 
                            icon={<WrenchIcon/>} colorHex={BRAND.GREEN} 
                        />
                    </>
                )}
            </div>

            {/* --- ADAPTIVE CONTENT LAYOUT --- */}
            
            {viewMode === 'service' ? (
                <>
                    {/* SERVICE: Row 2 - Breakdown & Rankings */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. Brand Stats */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 text-[#003DA5] rounded-2xl"><TagIcon className="w-5 h-5"/></div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Thống kê Nhãn hàng</h3>
                                </div>
                            </div>
                            <div className="space-y-4 flex-1">
                                {['HTM', 'VMA'].map(brand => {
                                    const bStats = stats.brandCounts[brand as 'HTM'|'VMA'];
                                    const pct = stats.totalTickets ? (bStats.t / stats.totalTickets) * 100 : 0;
                                    const isHTM = brand === 'HTM';
                                    
                                    // Custom colors based on Brand Identity
                                    const styles = isHTM ? {
                                        bg: 'bg-[#003DA5]',
                                        text: 'text-[#003DA5]',
                                        lightBg: 'bg-[#003DA5]/5',
                                        border: 'border-[#003DA5]/20',
                                        hover: 'group-hover:text-[#003DA5]'
                                    } : {
                                        bg: 'bg-[#009183]',
                                        text: 'text-[#009183]',
                                        lightBg: 'bg-[#009183]/5',
                                        border: 'border-[#009183]/20',
                                        hover: 'group-hover:text-[#009183]'
                                    };

                                    return (
                                        <div key={brand} onClick={() => onFilterSelect('brand', brand)} className={`p-5 border rounded-2xl hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${styles.lightBg} ${styles.border}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full ${styles.bg}`}></span>
                                                    <span className={`font-black text-xl ${styles.text}`}>{brand}</span>
                                                </div>
                                                <span className="text-xs font-black bg-white px-2 py-1 rounded-lg text-slate-500 shadow-sm">{pct.toFixed(0)}%</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-2.5 bg-white/50 rounded-full mb-4 overflow-hidden border border-white/50">
                                                <div className={`h-full ${styles.bg} rounded-full transition-all duration-1000`} style={{width: `${pct}%`}}></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white rounded-xl p-2 text-center shadow-sm">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Phiếu</span>
                                                    <span className="block text-lg font-black text-slate-700">{bStats.t}</span>
                                                </div>
                                                <div className="bg-white rounded-xl p-2 text-center shadow-sm">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">SKU Lỗi</span>
                                                    <span className="block text-lg font-black text-slate-700">{bStats.skus.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* 2. Status Donut */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl"><FunnelIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Tiến độ xử lý</h3>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                <DonutChart 
                                    data={stats.donutStatusData} 
                                    colors={stats.donutStatusColors} 
                                    centerLabel="Tổng"
                                />
                            </div>
                        </div>

                        {/* 3. Top Products */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-rose-50 text-[#C5003E] rounded-2xl"><ShieldCheckIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Top Sự cố (Tần suất)</h3>
                            </div>
                            <div className="space-y-4">
                                {stats.topProductsByTicket.map((p, idx) => (
                                    <div key={idx} onClick={() => onFilterSelect('search', p.code)} className="flex items-start gap-4 cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-colors relative overflow-hidden">
                                        {/* Rank Badge */}
                                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-black border-2 transition-transform group-hover:scale-110 shadow-sm z-10 ${
                                            idx === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                            idx === 1 ? 'bg-slate-200 text-slate-600 border-slate-300' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                            'bg-white text-slate-400 border-slate-100'
                                        }`}>
                                            {idx+1}
                                        </div>
                                        <div className="flex-1 min-w-0 z-10">
                                            {/* CHANGED: Trade Name First (Bold), Code Second (Small) */}
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-700 truncate group-hover:text-[#C5003E] transition-colors" title={p.name}>{p.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-100 px-1.5 rounded w-fit mt-0.5">{p.code}</span>
                                                </div>
                                                <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600 whitespace-nowrap shadow-sm">{p.ticket} phiếu</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                                <div className={`h-full rounded-full ${idx === 0 ? 'bg-[#C5003E]' : 'bg-slate-300'}`} style={{width: `${(p.ticket / stats.topProductsByTicket[0].ticket)*100}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SERVICE: Row 3 - Trends & Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[420px]">
                        {/* 1. Trend Chart (Takes 2 cols) */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-50 text-[#003DA5] rounded-2xl"><ClockIcon className="w-5 h-5"/></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Xu hướng khiếu nại</h3>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Số lượng phiếu phản ánh trong năm</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[220px]"><TrendChart data={stats.chartTicket} label="Phiếu" color={BRAND.BLUE} /></div>
                        </div>

                        {/* 2. Recent Activity (Takes 1 col) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-teal-50 text-[#009183] rounded-2xl"><SparklesIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Hoạt động mới</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-2">
                                <RecentActivityList reports={reports} onSelect={onSelectReport} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* PRODUCTION: Row 2 - Main Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[450px]">
                        {/* Left: Trend Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-50 text-[#C5003E] rounded-2xl"><ClockIcon className="w-5 h-5"/></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Biểu đồ Xu hướng</h3>
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Theo dõi biến động số lượng</p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {['defect', 'exchange', 'ratio'].map(m => (
                                        <button 
                                            key={m} onClick={() => setProdMetric(m as any)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${prodMetric === m ? 'bg-white text-[#C5003E] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {m === 'defect' ? 'Lỗi' : m === 'exchange' ? 'Đổi' : '% Đổi'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 min-h-[280px]">
                                <TrendChart 
                                    data={prodMetric === 'defect' ? stats.chartDefect : prodMetric === 'exchange' ? stats.chartExchange : stats.chartRatio}
                                    label={prodMetric === 'defect' ? 'SP Lỗi' : prodMetric === 'exchange' ? 'SP Đổi' : '% Đổi'}
                                    color={prodMetric === 'defect' ? BRAND.RED : prodMetric === 'exchange' ? BRAND.BLUE : BRAND.AMBER}
                                />
                            </div>
                        </div>

                        {/* Right: Source Donut */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-orange-50 text-[#F59E0B] rounded-2xl"><ShieldCheckIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Nguyên nhân (Phiếu)</h3>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[280px]">
                                <DonutChart 
                                    data={stats.donutSourceData}
                                    colors={[BRAND.RED, BRAND.AMBER, BRAND.BLUE, BRAND.SLATE]} 
                                    centerLabel="Tổng"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PRODUCTION: Row 3 - Pareto */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-amber-50 text-[#F59E0B] rounded-2xl"><ChartPieIcon className="w-5 h-5"/></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Biểu đồ Pareto (Sản phẩm lỗi)</h3>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Top 10 sản phẩm đóng góp nhiều nhất vào tổng lỗi</p>
                            </div>
                        </div>
                        {/* Improved Pareto Visual */}
                        <div className="h-72 w-full relative group px-2">
                            {stats.paretoData.length > 0 ? (
                                <div className="flex h-full items-end gap-2 sm:gap-4 relative z-10">
                                    {stats.paretoData.map((p, i) => (
                                        <div key={i} className="flex-1 flex flex-col justify-end items-center group/bar relative h-full">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-3 opacity-0 group-hover/bar:opacity-100 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl z-20 pointer-events-none transition-all transform -translate-x-1/2 left-1/2 min-w-[120px] text-center">
                                                <div className="font-bold text-amber-400 mb-1">{p.code}</div>
                                                <div className="text-slate-300">Lỗi: <span className="text-white font-bold">{p.defect}</span></div>
                                                <div className="text-slate-300">Tích lũy: <span className="text-white font-bold">{p.cumPercent.toFixed(1)}%</span></div>
                                                {/* Arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                            </div>
                                            
                                            {/* Bar */}
                                            <div 
                                                className="w-full rounded-t-lg transition-all relative cursor-pointer shadow-sm hover:shadow-md" 
                                                style={{height: `${(p.defect / stats.paretoData[0].defect) * 80}%`, backgroundColor: BRAND.RED }}
                                                onClick={() => onFilterSelect('search', p.code)}
                                            ></div>
                                            
                                            {/* Label */}
                                            <span className="text-[10px] font-bold text-slate-500 mt-3 truncate w-full text-center group-hover/bar:text-[#C5003E] transition-colors">{p.code}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 font-medium">Chưa có dữ liệu</div>
                            )}
                            
                            {/* Trend Line Overlay (Pareto Curve) */}
                            {stats.paretoData.length > 0 && (
                                <svg className="absolute inset-0 w-full h-[85%] pointer-events-none overflow-visible z-20" style={{top: 0}}>
                                    <defs>
                                        <filter id="shadow">
                                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                                        </filter>
                                    </defs>
                                    <polyline 
                                        points={stats.paretoData.map((p, i) => {
                                            const x = (i / stats.paretoData.length) * 100 + (50/stats.paretoData.length); // Centered percent
                                            const y = 100 - p.cumPercent;
                                            return `${x}%,${y}%`
                                        }).join(' ')}
                                        fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 4"
                                        style={{filter: 'url(#shadow)'}}
                                    />
                                    {stats.paretoData.map((p, i) => {
                                        const x = (i / stats.paretoData.length) * 100 + (50/stats.paretoData.length);
                                        const y = 100 - p.cumPercent;
                                        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r="4" fill="#F59E0B" stroke="white" strokeWidth="2" />
                                    })}
                                </svg>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    </div>
  );
}

export default React.memo(DashboardReport);
