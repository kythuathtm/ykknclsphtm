
import React, { useMemo, useState, useEffect } from 'react';
import { DefectReport } from '../types';
import { 
    CheckCircleIcon, ClockIcon, 
    ShoppingBagIcon, TagIcon, 
    FunnelIcon, ShieldCheckIcon, ArrowUpIcon, ArrowDownIcon,
    CubeIcon, ChartPieIcon, UserGroupIcon,
    InboxIcon, TruckIcon, SparklesIcon, WrenchIcon,
    TableCellsIcon, XIcon, ArrowRightOnRectangleIcon, EyeIcon
} from './Icons';

interface Props {
  reports: DefectReport[];
  onFilterSelect: (filterType: 'status' | 'defectType' | 'all' | 'search' | 'brand', value?: string) => void;
  onSelectReport: (report: DefectReport) => void;
  isLoading?: boolean;
}

// --- BRAND PALETTE (Color System) ---
const BRAND = {
    PRIMARY: '#003DA5', // HTM Blue
    SUCCESS: '#009183', // VMA Green
    DANGER: '#C5003E',  // Alert Red
    DANGER_LIGHT: '#f43f5e', // Rose-500
    WARNING: '#F59E0B', // Amber
    INFO: '#3B82F6',    // Sky Blue
    CYAN: '#06b6d4',    // Cyan (For Verifying)
    VIOLET: '#8B5CF6',  // Violet
    INDIGO: '#6366F1',  // Indigo
    SLATE: '#64748B',   // Slate
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

// SVG Curve Generator
const getSmoothPath = (points: {x: number, y: number}[]) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) * 0.4;
        const cp1y = p0.y;
        const cp2x = p1.x - (p1.x - p0.x) * 0.4;
        const cp2y = p1.y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
};

// --- ANIMATION COMPONENTS ---

// Animated Counter (0 -> Value)
const CountUp = ({ value, duration = 1200, className = "" }: { value: string | number, duration?: number, className?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) || 0 : value;
    const isPercentage = typeof value === 'string' && value.includes('%');
    
    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            // Ease-out cubic function
            const ease = 1 - Math.pow(1 - percentage, 3); 
            
            setDisplayValue(numericValue * ease);

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(numericValue);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [numericValue, duration]);

    const formatted = isPercentage 
        ? `${displayValue.toFixed(0)}%` 
        : Math.ceil(displayValue).toLocaleString('en-US');

    return <span className={className}>{formatted}</span>;
};

// --- VISUAL COMPONENTS ---

// Sparkline Chart (Mini chart on cards)
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = 0;
    const width = 100;
    const height = 35;
    
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((val - min) / (max - min)) * height
    }));

    const pathD = getSmoothPath(points);

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height + 4}`} className="overflow-visible">
            <defs>
                <linearGradient id={`grad-spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${pathD} L ${width} ${height} L 0 ${height} Z`} fill={`url(#grad-spark-${color.replace('#', '')})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="2.5" fill="white" stroke={color} strokeWidth="2" />
        </svg>
    );
};

// Premium KPI Card - Layout & Effects Optimized
const KpiCard = ({ title, value, subValue, trend, icon, colorHex, onClick, trendInverse = false, delayIndex = 0 }: any) => {
    const isUp = trend.trend === 'up';
    const isNeutral = trend.trend === 'neutral';
    const isPositive = trendInverse ? !isUp : isUp;
    
    let trendColorClass = 'text-slate-400 bg-slate-100 border-slate-200';
    let TrendIcon = isUp ? ArrowUpIcon : ArrowDownIcon;
    
    if (!isNeutral) {
        if (isPositive) trendColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-100';
        else trendColorClass = 'text-rose-700 bg-rose-50 border-rose-100';
    }

    return (
        <div 
            onClick={onClick} 
            className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out cursor-pointer overflow-hidden hover:-translate-y-1.5 h-full flex flex-col justify-between animate-fade-in-up fill-mode-backwards"
            style={{ animationDelay: `${delayIndex * 100}ms` }}
        >
            {/* Top Accent Bar (Animated) */}
            <div 
                className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ 
                    background: `linear-gradient(90deg, transparent, ${colorHex}, transparent)` 
                }}
            ></div>

            {/* Background Blob - Subtle glow */}
            <div 
                className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none" 
                style={{ backgroundColor: colorHex }}
            ></div>

            {/* Content Layout */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header: Title Left, Icon Right */}
                <div className="flex justify-between items-start mb-3">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-tight mt-1">{title}</p>
                    
                    <div 
                        className="p-2.5 rounded-xl transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:rotate-3 ring-1 ring-inset ring-white/50"
                        style={{ backgroundColor: `${colorHex}10`, color: colorHex }}
                    >
                        {React.cloneElement(icon, { className: "h-5 w-5" })}
                    </div>
                </div>
                
                {/* Body: Big Value */}
                <div className="mb-4">
                    <h3 
                        className="text-[2.5rem] leading-none font-black text-slate-800 tracking-tight tabular-nums transition-all duration-300 group-hover:scale-105 origin-left"
                    >
                        <CountUp value={value} />
                    </h3>
                </div>
                
                {/* Footer: Trend/SubValue (Left) + Sparkline (Right) */}
                <div className="flex items-end justify-between mt-auto gap-2">
                    <div className="flex flex-col justify-end gap-1.5 min-w-0">
                         {/* Trend Badge */}
                        {!isNeutral && (
                            <div className={`flex items-center w-fit gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${trendColorClass}`}>
                                <TrendIcon className="w-3 h-3 stroke-[3px]" />
                                {Math.abs(trend.percent)}%
                            </div>
                        )}
                        {/* SubValue */}
                        {subValue && (
                            <p className="text-[11px] font-semibold text-slate-400/90 truncate" title={subValue}>
                                {subValue}
                            </p>
                        )}
                    </div>
                    
                    {/* Sparkline */}
                    <div className="w-24 h-10 opacity-50 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0 flex-shrink-0">
                         <Sparkline data={trend.sparkline} color={colorHex} />
                    </div>
                </div>
            </div>

            {/* Interaction Cue: Arrow slides in from right */}
            {onClick && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2 translate-x-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-2 rounded-full text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
            )}
        </div>
    );
};

// Donut Chart - Fixed & Animated
const DonutChart = ({ data, colors, centerLabel, onClickSlice }: any) => {
    const total = data.reduce((acc: number, item: any) => acc + item.value, 0);
    const [hoveredSlice, setHoveredSlice] = useState<any | null>(null);
    
    // Config
    const size = 200;
    const strokeWidth = 20; 
    const hoverStrokeWidth = 26;
    const radius = 70; 
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const activeItem = hoveredSlice || { label: centerLabel, value: total };
    
    // Offset calculation
    let cumulativePercent = 0;

    if (total === 0) return (
        <div className="flex flex-col items-center justify-center h-56 text-slate-300">
            <div className="p-4 bg-slate-50 rounded-full mb-3"><ChartPieIcon className="w-8 h-8 opacity-40"/></div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Chưa có dữ liệu</span>
        </div>
    );

    return (
        <div className="flex flex-row items-center gap-6 h-full justify-center w-full select-none">
            <div className="relative w-[200px] h-[200px] flex-shrink-0 animate-pop">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-lg overflow-visible">
                    {data.map((item: any, index: number) => {
                        if (item.value === 0) return null;
                        const percent = item.value / total;
                        const strokeDasharray = `${percent * circumference} ${circumference}`;
                        const strokeDashoffset = -cumulativePercent * circumference;
                        cumulativePercent += percent;
                        const isHovered = hoveredSlice?.label === item.label;
                        
                        return (
                            <circle
                                key={index}
                                r={radius}
                                cx={center}
                                cy={center}
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth={isHovered ? hoverStrokeWidth : strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="butt" 
                                className="transition-all duration-300 ease-out cursor-pointer"
                                style={{ 
                                    opacity: hoveredSlice ? (isHovered ? 1 : 0.3) : 1,
                                    filter: isHovered ? 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' : 'none'
                                }}
                                onMouseEnter={() => setHoveredSlice(item)}
                                onMouseLeave={() => setHoveredSlice(null)}
                                onClick={() => onClickSlice && onClickSlice(item.label)}
                            />
                        );
                    })}
                    
                    {/* Separator Lines */}
                    {data.length > 1 && data.map((item: any, index: number) => {
                         if (item.value === 0) return null;
                         const currentPercent = data.slice(0, index + 1).reduce((sum: number, i: any) => sum + i.value, 0) / total;
                         const angle = currentPercent * 360; 
                         const rad = angle * (Math.PI / 180);
                         const innerR = radius - strokeWidth/2 - 2;
                         const outerR = radius + strokeWidth/2 + 2;
                         const x1 = center + innerR * Math.cos(rad);
                         const y1 = center + innerR * Math.sin(rad);
                         const x2 = center + outerR * Math.cos(rad);
                         const y2 = center + outerR * Math.sin(rad);
                         
                         return <line key={`sep-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" strokeLinecap="round" className="pointer-events-none" />;
                    })}
                </svg>
                
                {/* Center Text Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800 tracking-tight tabular-nums transition-all duration-300 transform scale-100">
                        {hoveredSlice ? activeItem.value.toLocaleString() : <CountUp value={activeItem.value} />}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-2 text-center line-clamp-1 mt-1 max-w-[120px]">
                        {activeItem.label}
                    </span>
                    {hoveredSlice && (
                        <div className="mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm transition-all animate-fade-in-up" style={{ backgroundColor: colors[data.indexOf(hoveredSlice) % colors.length] }}>
                            {((hoveredSlice.value / total) * 100).toFixed(1)}%
                        </div>
                    )}
                </div>
            </div>
            
            {/* Legend Right Side */}
            <div className="flex flex-col gap-2 min-w-[120px]">
                {data.map((item: any, index: number) => (
                    <div 
                        key={index} 
                        className={`flex items-center justify-between text-xs cursor-pointer p-1.5 rounded-lg transition-all border border-transparent animate-fade-in-up ${hoveredSlice?.label === item.label ? 'bg-slate-50 border-slate-200 shadow-sm scale-105' : 'hover:bg-slate-50/50'}`} 
                        style={{ animationDelay: `${index * 100}ms` }}
                        onMouseEnter={() => setHoveredSlice(item)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => onClickSlice && onClickSlice(item.label)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: colors[index % colors.length] }}></span>
                            <span className={`font-semibold transition-colors truncate max-w-[90px] ${hoveredSlice?.label === item.label ? 'text-slate-900' : 'text-slate-500'}`}>{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-700 ml-2 tabular-nums">{((item.value / total) * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Trend Chart - Interactive Cursor
const TrendChart = ({ data, label, color = BRAND.PRIMARY }: any) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-wide">Chưa có dữ liệu</div>;

    const maxVal = Math.max(...data.map((d: any) => d.count), 5) * 1.1;
    const height = 240;
    const width = 800;
    const paddingX = 30;
    const paddingY = 20;
    const chartHeight = height - paddingY * 2;

    const getX = (i: number) => paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const getY = (v: number) => height - paddingY - (v / maxVal) * chartHeight;

    const points = data.map((d: any, i: number) => ({ x: getX(i), y: getY(d.count) }));
    const dPath = getSmoothPath(points);
    const areaPath = `${dPath} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

    return (
        <div className="w-full h-full relative flex flex-col group/chart animate-fade-in">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" onMouseLeave={() => setHoverIndex(null)}>
                <defs>
                    <linearGradient id={`grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const y = paddingY + chartHeight * t;
                    return <line key={t} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />;
                })}

                <path d={areaPath} fill={`url(#grad-${label.replace(/\s/g, '')})`} className="transition-all duration-500" />
                <path d={dPath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

                {/* Interaction Overlay */}
                {data.map((d: any, i: number) => {
                    const { x, y } = points[i];
                    const isHover = hoverIndex === i;
                    
                    return (
                        <g key={i}>
                            {/* Hit Area Rect */}
                            <rect 
                                x={x - (width/data.length)/2} y={0} width={width/data.length} height={height} 
                                fill="transparent" 
                                onMouseEnter={() => setHoverIndex(i)}
                                style={{cursor: 'crosshair'}}
                            />
                            
                            {/* Active Cursor Line */}
                            {isHover && (
                                <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke={color} strokeWidth="1" strokeDasharray="3 3" className="opacity-50" />
                            )}

                            {/* Data Point Dot */}
                            <circle 
                                cx={x} cy={y} r={isHover ? 6 : 3.5} 
                                fill="white" stroke={color} strokeWidth={isHover ? 3 : 2} 
                                className="transition-all duration-200 shadow-sm"
                                style={{ opacity: isHover ? 1 : (i === data.length -1 ? 1 : 0) }} // Always show last dot
                            />
                        </g>
                    )
                })}
            </svg>
            
            {/* Modern Tooltip */}
            {hoverIndex !== null && data[hoverIndex] && (
                <div 
                    className={`absolute top-0 pointer-events-none transition-all duration-200 z-20 flex flex-col
                        ${hoverIndex === 0 ? 'translate-x-2 items-start' : 
                          hoverIndex === data.length - 1 ? '-translate-x-[105%] items-end' : 
                          '-translate-x-1/2 items-center'}
                    `}
                    style={{ left: `${(getX(hoverIndex) / width) * 100}%` }}
                >
                    <div className="bg-white/95 backdrop-blur-md border border-slate-100 text-slate-800 p-2.5 rounded-xl shadow-xl flex flex-col min-w-[90px] ring-1 ring-black/5 transform -translate-y-2">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Tháng {data[hoverIndex].month}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black leading-none tracking-tight" style={{ color: color }}>
                                {data[hoverIndex].count.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{label}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between px-4 mt-2 border-t border-slate-100 pt-2">
                {data.map((d: any, i: number) => (
                    <div key={i} className={`text-[10px] font-bold uppercase text-center flex-1 transition-colors duration-200 ${hoverIndex === i ? 'text-slate-800 scale-110' : 'text-slate-400'}`}>
                        T{d.month}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 5. Pareto Chart (Gradient Bars + Neon Line + Fix Tooltip)
const ParetoChart = ({ data, onSelect }: { data: any[], onSelect: (code: string) => void }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-wide">Chưa có dữ liệu phân tích</div>;

    const width = 800;
    const height = 320;
    const padding = { top: 30, right: 40, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxDefect = Math.max(...data.map(d => d.defect)) || 1;
    const barWidth = (chartWidth / data.length) * 0.55;
    
    const linePoints = data.map((d, i) => {
        const x = padding.left + (i * (chartWidth / data.length)) + (chartWidth / data.length) / 2;
        const y = padding.top + chartHeight - (d.cumPercent / 100) * chartHeight;
        return {x, y};
    });
    
    const linePath = getSmoothPath(linePoints);

    return (
        <div className="w-full h-full relative group/pareto animate-fade-in">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" onMouseLeave={() => setHoverIndex(null)}>
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND.DANGER_LIGHT} />
                        <stop offset="100%" stopColor={BRAND.DANGER} />
                    </linearGradient>
                    <filter id="shadowBar" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={BRAND.DANGER} floodOpacity="0.3" />
                    </filter>
                    <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                         <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line key={t} x1={padding.left} y1={padding.top + chartHeight * t} x2={width - padding.right} y2={padding.top + chartHeight * t} stroke="#f1f5f9" strokeWidth="1" />
                ))}

                {/* Bars */}
                {data.map((d, i) => {
                    const barHeight = (d.defect / maxDefect) * chartHeight;
                    const x = padding.left + (i * (chartWidth / data.length)) + (chartWidth / data.length - barWidth) / 2;
                    const y = padding.top + chartHeight - barHeight;
                    const isHover = hoverIndex === i;

                    return (
                        <g key={`bar-${i}`} onClick={() => onSelect(d.code)} className="cursor-pointer">
                            <rect 
                                x={x} y={y} width={barWidth} height={barHeight} 
                                fill="url(#barGradient)" rx="4"
                                opacity={hoverIndex !== null && !isHover ? 0.4 : 1}
                                className="transition-all duration-200"
                                filter={isHover ? "url(#shadowBar)" : ""}
                            />
                            {/* Hit Area */}
                            <rect 
                                x={padding.left + (i * (chartWidth / data.length))} y={padding.top} 
                                width={chartWidth / data.length} height={chartHeight} 
                                fill="transparent" onMouseEnter={() => setHoverIndex(i)}
                            />
                        </g>
                    );
                })}

                {/* Cumulative Line */}
                <path d={linePath} fill="none" stroke={BRAND.WARNING} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" filter="url(#glowLine)" />
                
                {/* Dots */}
                {linePoints.map((p, i) => (
                    <circle 
                        key={`dot-${i}`} cx={p.x} cy={p.y} r={hoverIndex === i ? 6 : 4} 
                        fill="white" stroke={BRAND.WARNING} strokeWidth="2" 
                        className="transition-all duration-200 pointer-events-none shadow-sm"
                    />
                ))}

                {/* X Axis */}
                {data.map((d, i) => {
                    const x = padding.left + (i * (chartWidth / data.length)) + (chartWidth / data.length) / 2;
                    const isHover = hoverIndex === i;
                    return (
                        <text 
                            key={`label-${i}`} x={x} y={height - 15} textAnchor="middle" 
                            fill={isHover ? BRAND.PRIMARY : BRAND.SLATE} 
                            fontWeight={isHover ? "900" : "600"} fontSize="11"
                            className="uppercase transition-colors select-none"
                        >
                            {d.code}
                        </text>
                    )
                })}
            </svg>

            {/* Floating Tooltip */}
            {hoverIndex !== null && data[hoverIndex] && (
                <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl border border-white/60 text-slate-800 p-4 rounded-2xl shadow-2xl z-30 pointer-events-none min-w-[220px] animate-fade-in-up"
                >
                    <div className="font-black text-slate-800 mb-3 text-sm border-b border-slate-100 pb-2 truncate">{data[hoverIndex].name}</div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">Số lượng lỗi</span>
                            <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{data[hoverIndex].defect}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">Tích lũy</span>
                            <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{data[hoverIndex].cumPercent.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 6. Recent Activity List
const RecentActivityList = ({ reports, onSelect }: { reports: DefectReport[], onSelect: (r: DefectReport) => void }) => {
    const recent = reports.slice(0, 7);
    if (recent.length === 0) return <div className="text-center text-slate-400 text-xs py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">Chưa có hoạt động nào.</div>;

    return (
        <div className="space-y-3" style={{ fontFamily: 'var(--list-font, inherit)' }}>
            {recent.map((r, i) => {
                const isResolved = r.trangThai === 'Hoàn thành';
                return (
                    <div key={r.id} onClick={() => onSelect(r)} className="flex items-center gap-4 p-3 hover:bg-slate-50 cursor-pointer group transition-all rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-sm active:scale-95 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-black/5 transition-colors ${isResolved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isResolved ? <CheckCircleIcon className="w-5 h-5"/> : <WrenchIcon className="w-5 h-5"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700 truncate group-hover:text-[#003DA5] transition-colors" style={{ fontSize: 'var(--list-size, 0.75rem)' }}>{r.maSanPham}</span>
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{new Date(r.ngayPhanAnh).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate group-hover:text-slate-700 transition-colors" style={{ fontSize: 'var(--list-size, 0.7rem)' }}>
                                {r.tenThuongMai}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- MODAL COMPONENTS ---

// Updated DrillDownModal with Row Click support
const DrillDownModal = ({ title, data, type, onClose, onRowClick }: { title: string, data: any[], type: 'distributor' | 'product', onClose: () => void, onRowClick?: (item: any) => void }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-pop ring-1 ring-white/20">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all active:scale-95">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    <table className="w-full text-left border-collapse" style={{ fontFamily: 'var(--list-font, inherit)', fontSize: 'var(--list-size, 1rem)' }}>
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center" style={{ fontSize: 'inherit' }}>#</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider" style={{ fontSize: 'inherit' }}>{type === 'distributor' ? 'Nhà phân phối' : 'Sản phẩm'}</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right" style={{ fontSize: 'inherit' }}>Số phiếu</th>
                                {type === 'distributor' && (
                                    <>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right" style={{ fontSize: 'inherit' }}>Số SKU</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right" style={{ fontSize: 'inherit' }}>Hoàn thành</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length > 0 ? data.map((item, idx) => (
                                <tr 
                                    key={idx} 
                                    className={`hover:bg-slate-50/80 transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    <td className="p-4 text-slate-400 text-center" style={{ fontSize: 'inherit' }}>{idx + 1}</td>
                                    <td className="p-4">
                                        <div className={`font-bold transition-colors ${onRowClick ? 'text-slate-800 group-hover:text-blue-700' : 'text-slate-800'}`} style={{ fontSize: 'inherit' }}>
                                            {type === 'distributor' ? item.name : item.name}
                                        </div>
                                        {type === 'product' && <div className="text-xs text-slate-400 font-bold mt-0.5">{item.code}</div>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                                            {item.totalTickets}
                                        </span>
                                    </td>
                                    {type === 'distributor' && (
                                        <>
                                            <td className="p-4 text-right">
                                                <span className="font-bold text-slate-600" style={{ fontSize: 'inherit' }}>{item.uniqueSKUs}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${item.completionRate === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                                            style={{ width: `${item.completionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${item.completionRate === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                        {item.completionRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Detailed Report List Modal (Drill Down Level 2)
const DetailedReportListModal = ({ title, reports, onClose, onSelectReport }: { title: string, reports: DefectReport[], onClose: () => void, onSelectReport: (r: DefectReport) => void }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-pop ring-1 ring-white/20">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1">Tổng cộng: <span className="font-bold text-slate-800">{reports.length}</span> phiếu</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all active:scale-95">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-slate-50">
                    <table className="w-full text-left border-collapse" style={{ fontFamily: 'var(--list-font, inherit)', fontSize: 'var(--list-size, 1rem)' }}>
                        <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-4 w-12 text-center bg-slate-50/50" style={{ fontSize: 'inherit' }}>#</th>
                                <th className="p-4 w-32 bg-slate-50/50" style={{ fontSize: 'inherit' }}>Ngày</th>
                                <th className="p-4 w-32 bg-slate-50/50" style={{ fontSize: 'inherit' }}>Mã SP</th>
                                <th className="p-4 bg-slate-50/50" style={{ fontSize: 'inherit' }}>Tên sản phẩm & Lỗi</th>
                                <th className="p-4 w-36 bg-slate-50/50 text-right" style={{ fontSize: 'inherit' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {reports.map((r, idx) => (
                                <tr key={r.id} onClick={() => onSelectReport(r)} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                                    <td className="p-4 text-center text-slate-400 font-bold" style={{ fontSize: 'inherit' }}>{idx + 1}</td>
                                    <td className="p-4 text-slate-600 font-medium" style={{ fontSize: 'inherit' }}>
                                        {new Date(r.ngayPhanAnh).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs">
                                            {r.maSanPham}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 mb-1 leading-snug line-clamp-1" style={{ fontSize: 'inherit' }}>{r.tenThuongMai}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1 italic">{r.noiDungPhanAnh}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase whitespace-nowrap ${
                                            r.trangThai === 'Mới' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            r.trangThai === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {r.trangThai}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

const DashboardReport: React.FC<Props> = ({ reports, onFilterSelect, onSelectReport, isLoading }) => {
  const [viewMode, setViewMode] = useState<'service' | 'production'>('service');
  const [prodMetric, setProdMetric] = useState<'defect' | 'exchange' | 'ratio'>('defect');
  
  // State for Modal
  const [activeModal, setActiveModal] = useState<'none' | 'distributor' | 'product'>('none');
  const [selectedDistributorForDetail, setSelectedDistributorForDetail] = useState<string | null>(null);
  const [selectedBrandForDetail, setSelectedBrandForDetail] = useState<string | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<string | null>(null);

  // Calculate Data (Memoized)
  const stats = useMemo(() => {
      let totalTickets = 0, totalDefectQty = 0, totalExchangeQty = 0;
      const distMap = new Map<string, { total: number, completed: number, skus: Set<string> }>();
      const prodMap = new Map();
      const statusCounts = { 'Mới': 0, 'Đang tiếp nhận': 0, 'Đang xác minh': 0, 'Đang xử lý': 0, 'Chưa tìm ra nguyên nhân': 0, 'Hoàn thành': 0 };
      const sourceCounts = { 'Sản xuất': 0, 'NCC': 0, 'Hỗn hợp': 0, 'Khác': 0 };
      let completedWithExchange = 0;
      let completedNoExchange = 0;
      const brandCounts = { 'HTM': { t: 0, q: 0, e: 0, skus: new Set<string>() }, 'VMA': { t: 0, q: 0, e: 0, skus: new Set<string>() } };
      const uniqueSKUs = new Set<string>();
      const monthlyTicket = Array(12).fill(0);
      const monthlyDefect = Array(12).fill(0);
      const monthlyExchange = Array(12).fill(0);
      const today = new Date();
      const currentYear = today.getFullYear();

      const getSparklineData = (mode: 'ticket' | 'qty' | 'exchange', monthsBack: number = 6) => {
        const data = [];
        const currentM = today.getMonth();
        const currentY = today.getFullYear();
        for (let i = monthsBack - 1; i >= 0; i--) {
            let tm = currentM - i;
            let ty = currentY;
            while (tm < 0) { tm += 12; ty -= 1; }
            let val = 0;
            reports.forEach(r => {
                if (!r.ngayPhanAnh) return;
                const d = parseDate(r.ngayPhanAnh);
                if (!d) return;
                if (d.month === tm && d.year === ty) {
                    if (mode === 'ticket') val += 1;
                    else if (mode === 'qty') val += (r.soLuongLoi || 0);
                    else if (mode === 'exchange') val += (r.soLuongDoi || 0);
                }
            });
            data.push(val);
        }
        return data;
      };

      const calculateTrend = (mode: 'qty' | 'ticket' | 'exchange') => {
        const cm = today.getMonth();
        const cy = today.getFullYear();
        const lm = cm === 0 ? 11 : cm - 1;
        const ly = cm === 0 ? cy - 1 : cy;
        let cVal = 0, lVal = 0;
        reports.forEach(r => {
            if (!r.ngayPhanAnh) return;
            const d = parseDate(r.ngayPhanAnh);
            if (!d) return;
            let val = mode === 'qty' ? (r.soLuongLoi||0) : mode === 'exchange' ? (r.soLuongDoi||0) : 1;
            if (d.month === cm && d.year === cy) cVal += val;
            if (d.month === lm && d.year === ly) lVal += val;
        });
        const diff = cVal - lVal;
        let percent = lVal > 0 ? Number(((diff / lVal) * 100).toFixed(1)) : (cVal > 0 ? 100 : 0);
        return {
            value: cVal, diff, percent,
            trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
            sparkline: getSparklineData(mode)
        };
      };

      reports.forEach(r => {
          totalTickets++;
          const dQty = r.soLuongLoi || 0;
          const eQty = r.soLuongDoi || 0;
          totalDefectQty += dQty;
          totalExchangeQty += eQty;
          if (statusCounts[r.trangThai] !== undefined) statusCounts[r.trangThai]++;
          if (r.trangThai === 'Hoàn thành') {
              if (eQty > 0) completedWithExchange++; else completedNoExchange++;
          }
          let src = 'Khác';
          if (r.loaiLoi?.includes('Sản xuất')) src = 'Sản xuất';
          else if (r.loaiLoi?.includes('Nhà cung cấp')) src = 'NCC';
          else if (r.loaiLoi?.includes('Hỗn hợp')) src = 'Hỗn hợp';
          sourceCounts[src as keyof typeof sourceCounts]++;
          
          const brand = r.nhanHang === 'HTM' || r.nhanHang === 'VMA' ? r.nhanHang : 'HTM'; 
          if (brandCounts[brand]) {
              brandCounts[brand].t++; brandCounts[brand].q += dQty; brandCounts[brand].e += eQty;
              if (r.maSanPham) brandCounts[brand].skus.add(r.maSanPham);
          }
          
          // Product Map
          if (r.maSanPham) {
              uniqueSKUs.add(r.maSanPham);
              let p = prodMap.get(r.maSanPham);
              if (!p) {
                  // Normalize brand for product categorization
                  const normalizedBrand = (r.nhanHang === 'HTM' || r.nhanHang === 'VMA') ? r.nhanHang : 'HTM';
                  p = { 
                      code: r.maSanPham, 
                      name: r.tenThuongMai, 
                      ticket: 0, 
                      defect: 0, 
                      exchange: 0,
                      brand: normalizedBrand 
                  };
                  prodMap.set(r.maSanPham, p);
              }
              p.ticket++; 
              p.defect += dQty; 
              p.exchange += eQty;
          }
          
          const createdDate = parseDate(r.ngayPhanAnh);
          
          // Distributor Map Aggregation
          if (r.nhaPhanPhoi) {
              const dName = r.nhaPhanPhoi.trim();
              if (!distMap.has(dName)) {
                  distMap.set(dName, { total: 0, completed: 0, skus: new Set() });
              }
              const dStats = distMap.get(dName)!;
              dStats.total++;
              if (r.trangThai === 'Hoàn thành') dStats.completed++;
              if (r.maSanPham) dStats.skus.add(r.maSanPham);
          }

          if (createdDate && createdDate.year === currentYear) {
              const m = createdDate.month;
              monthlyTicket[m]++; monthlyDefect[m] += dQty; monthlyExchange[m] += eQty;
          }
      });

      // Prepare lists for modals
      const distributorStats = Array.from(distMap.entries()).map(([name, val]) => ({
          name,
          totalTickets: val.total,
          uniqueSKUs: val.skus.size,
          completionRate: val.total > 0 ? (val.completed / val.total) * 100 : 0
      })).sort((a, b) => b.totalTickets - a.totalTickets);

      const productStats = Array.from(prodMap.values()).map((p: any) => ({
          code: p.code,
          name: p.name,
          totalTickets: p.ticket,
          brand: p.brand
      })).sort((a: any, b: any) => b.totalTickets - a.totalTickets);

      const trendTicket = calculateTrend('ticket');
      const trendDefect = calculateTrend('qty');
      const trendExchange = calculateTrend('exchange');
      const topProducts = Array.from(prodMap.values());
      const topProductsByTicket = [...topProducts].sort((a,b) => b.ticket - a.ticket).slice(0, 5);
      const topProductsByDefect = [...topProducts].sort((a,b) => b.defect - a.defect).slice(0, 10);
      let cumDefect = 0;
      const paretoData = topProductsByDefect.map(p => {
          cumDefect += p.defect;
          return { ...p, cumPercent: (cumDefect / totalDefectQty) * 100 };
      });

      const donutStatusData = [
          { label: 'Mới', value: statusCounts['Mới'] },
          { label: 'Đang tiếp nhận', value: statusCounts['Đang tiếp nhận'] },
          { label: 'Đang xác minh', value: statusCounts['Đang xác minh'] },
          { label: 'Đang xử lý', value: statusCounts['Đang xử lý'] },
          { label: 'Chưa rõ NN', value: statusCounts['Chưa tìm ra nguyên nhân'] },
          { label: 'HT (Đổi)', value: completedWithExchange },
          { label: 'HT (Không đổi)', value: completedNoExchange },
      ].filter(d => d.value > 0);
      const donutStatusColors = [BRAND.INFO, BRAND.INDIGO, BRAND.CYAN, BRAND.WARNING, BRAND.VIOLET, BRAND.DANGER, BRAND.SUCCESS];

      const donutSourceData = [
          { label: 'Sản xuất', value: sourceCounts['Sản xuất'] },
          { label: 'NCC', value: sourceCounts['NCC'] },
          { label: 'Hỗn hợp', value: sourceCounts['Hỗn hợp'] },
          { label: 'Khác', value: sourceCounts['Khác'] },
      ].filter(d => d.value > 0);

      return {
          totalTickets, totalDefectQty, totalExchangeQty, totalUniqueSKUs: uniqueSKUs.size,
          trendTicket, trendDefect, trendExchange,
          statusCounts, sourceCounts, brandCounts,
          topProductsByTicket, paretoData,
          chartTicket: monthlyTicket.map((v, i) => ({ month: i + 1, count: v })),
          chartDefect: monthlyDefect.map((v, i) => ({ month: i + 1, count: v })),
          chartExchange: monthlyExchange.map((v, i) => ({ month: i + 1, count: v })),
          chartRatio: monthlyDefect.map((d, i) => ({ month: i + 1, count: d > 0 ? (monthlyExchange[i] / d) * 100 : 0 })),
          uniqueDistributors: distMap.size,
          exchangeRate: totalDefectQty > 0 ? ((totalExchangeQty/totalDefectQty)*100).toFixed(1) : 0,
          donutStatusData, donutStatusColors, donutSourceData,
          distributorStats,
          productStats
      };
  }, [reports]);

  if (isLoading) return (
      <div className="p-6 space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 w-1/4 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-36 bg-slate-200 rounded-3xl"></div>)}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 font-sans relative">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar pb-24">
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight animate-fade-in-up">
                        {viewMode === 'service' ? 'Tổng quan Dịch vụ' : 'Chất lượng Sản xuất'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        Cập nhật theo thời gian thực
                    </p>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <button 
                        onClick={() => setViewMode('service')}
                        className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'service' ? 'bg-[#003DA5] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        <UserGroupIcon className="w-4 h-4 mr-2" /> Dịch vụ
                    </button>
                    <button 
                        onClick={() => setViewMode('production')}
                        className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'production' ? 'bg-[#C5003E] text-white shadow-lg shadow-rose-900/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        <CubeIcon className="w-4 h-4 mr-2" /> Sản xuất
                    </button>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {viewMode === 'service' ? (
                    <>
                        <KpiCard title="TỔNG PHIẾU" value={stats.totalTickets} trend={stats.trendTicket} icon={<InboxIcon/>} colorHex={BRAND.PRIMARY} onClick={() => onFilterSelect('all')} delayIndex={0} />
                        
                        {/* OPEN DISTRIBUTOR MODAL */}
                        <KpiCard 
                            title="NHÀ PHÂN PHỐI" 
                            value={stats.uniqueDistributors} 
                            subValue="Đã khiếu nại" 
                            trend={stats.trendTicket} 
                            icon={<TruckIcon/>} 
                            colorHex={BRAND.INDIGO} 
                            onClick={() => setActiveModal('distributor')} 
                            delayIndex={1}
                        />
                        
                        {/* OPEN PRODUCT MODAL */}
                        <KpiCard 
                            title="SẢN PHẨM LỖI" 
                            value={stats.totalUniqueSKUs} 
                            subValue="Số mã sản phẩm" 
                            trend={stats.trendTicket} 
                            icon={<TagIcon/>} 
                            colorHex={BRAND.VIOLET} 
                            trendInverse={true} 
                            onClick={() => setActiveModal('product')} 
                            delayIndex={2}
                        />
                        
                        <KpiCard title="TỶ LỆ HOÀN THÀNH" value={`${((stats.statusCounts['Hoàn thành']/stats.totalTickets)*100 || 0).toFixed(0)}%`} trend={stats.trendTicket} icon={<CheckCircleIcon/>} colorHex={BRAND.SUCCESS} onClick={() => onFilterSelect('status', 'Hoàn thành')} delayIndex={3} />
                    </>
                ) : (
                    <>
                        <KpiCard title="SL LỖI" value={stats.totalDefectQty} trend={stats.trendDefect} icon={<CubeIcon/>} colorHex={BRAND.DANGER} trendInverse={true} onClick={() => onFilterSelect('all')} delayIndex={0} />
                        <KpiCard title="SL ĐỔI" value={stats.totalExchangeQty} trend={stats.trendExchange} icon={<ShoppingBagIcon/>} colorHex={BRAND.INFO} trendInverse={true} onClick={() => onFilterSelect('all')} delayIndex={1} />
                        <KpiCard title="TỶ LỆ ĐỔI/LỖI" value={`${stats.exchangeRate}%`} subValue="Mức độ nghiêm trọng" trend={{trend: 'neutral', percent: 0, sparkline: []}} icon={<ChartPieIcon/>} colorHex={BRAND.WARNING} onClick={() => onFilterSelect('all')} delayIndex={2} />
                        <KpiCard title="ĐÃ KHẮC PHỤC" value={stats.totalDefectQty - stats.totalExchangeQty} subValue="Sửa chữa thành công" trend={{trend: 'up', percent: 0, sparkline: []}} icon={<WrenchIcon/>} colorHex={BRAND.SUCCESS} onClick={() => onFilterSelect('status', 'Hoàn thành')} delayIndex={3} />
                    </>
                )}
            </div>

            {/* CONTENT AREA */}
            {viewMode === 'service' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Brand Stats */}
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><TagIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Thống kê Nhãn hàng</h3>
                            </div>
                            <div className="space-y-4">
                                {['HTM', 'VMA'].map(brand => {
                                    const bStats = stats.brandCounts[brand as 'HTM'|'VMA'];
                                    const pct = stats.totalTickets ? (bStats.t / stats.totalTickets) * 100 : 0;
                                    const color = brand === 'HTM' ? BRAND.PRIMARY : BRAND.SUCCESS;
                                    return (
                                        <div key={brand} onClick={() => setSelectedBrandForDetail(brand)} className="relative p-5 border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group overflow-hidden bg-white hover:-translate-y-0.5">
                                            <div className="flex justify-between items-center mb-3 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                                                    <span className="font-black text-xl text-slate-800">{brand}</span>
                                                </div>
                                                <span className="text-xs font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-500">{pct.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden relative z-10">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                                <div className="text-center">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Phiếu</span>
                                                    <span className="block text-lg font-black text-slate-700"><CountUp value={bStats.t} /></span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">SKU Lỗi</span>
                                                    <span className="block text-lg font-black text-slate-700"><CountUp value={bStats.skus.size} /></span>
                                                </div>
                                            </div>
                                            {/* Decoration */}
                                            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.08] blur-xl group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: color }}></div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Status Donut */}
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up flex flex-col" style={{ animationDelay: '500ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><FunnelIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Tiến độ xử lý</h3>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                <DonutChart 
                                    data={stats.donutStatusData} 
                                    colors={stats.donutStatusColors} 
                                    centerLabel="Tổng"
                                    onClickSlice={(label: string) => onFilterSelect('status', label === 'Chưa rõ NN' ? 'Chưa tìm ra nguyên nhân' : label.replace(/ \(.*\)/, ''))}
                                />
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ShieldCheckIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Top Sự cố (Tần suất)</h3>
                            </div>
                            <div className="space-y-3">
                                {stats.topProductsByTicket.map((p, idx) => (
                                    <div key={idx} onClick={() => onFilterSelect('search', p.code)} className="flex items-center gap-4 cursor-pointer group p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-black shadow-sm transition-transform group-hover:scale-110 ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {idx+1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors" title={p.name}>{p.name}</span>
                                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{p.ticket} phiếu</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{width: `${(p.ticket / stats.topProductsByTicket[0].ticket)*100}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[420px]">
                        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up flex flex-col" style={{ animationDelay: '700ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><ClockIcon className="w-5 h-5"/></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Xu hướng khiếu nại</h3>
                                    <p className="text-xs font-medium text-slate-400">Số lượng phiếu theo tháng</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[220px]"><TrendChart data={stats.chartTicket} label="Phiếu" color={BRAND.PRIMARY} /></div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up flex flex-col" style={{ animationDelay: '800ms' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><SparklesIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Hoạt động mới</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-2"><RecentActivityList reports={reports} onSelect={onSelectReport} /></div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[450px]">
                        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up flex flex-col" style={{ animationDelay: '400ms' }}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ClockIcon className="w-5 h-5"/></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Xu hướng Số lượng</h3>
                                        <p className="text-xs font-medium text-slate-400">Biến động sản phẩm lỗi/đổi</p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {['defect', 'exchange', 'ratio'].map(m => (
                                        <button 
                                            key={m} onClick={() => setProdMetric(m as any)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${prodMetric === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                                    color={prodMetric === 'defect' ? BRAND.DANGER : prodMetric === 'exchange' ? BRAND.INFO : BRAND.WARNING}
                                />
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up flex flex-col" style={{ animationDelay: '500ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><TableCellsIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Phân loại Nguyên nhân</h3>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[280px]">
                                <DonutChart 
                                    data={stats.donutSourceData}
                                    colors={[BRAND.DANGER, BRAND.WARNING, BRAND.INDIGO, BRAND.SLATE]} 
                                    centerLabel="Tổng"
                                    onClickSlice={(label: string) => onFilterSelect('defectType', label === 'NCC' ? 'Lỗi Nhà cung cấp' : label === 'Sản xuất' ? 'Lỗi Sản xuất' : label === 'Hỗn hợp' ? 'Lỗi Hỗn hợp' : 'Lỗi Khác')}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><ChartPieIcon className="w-5 h-5"/></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Biểu đồ Pareto (80/20)</h3>
                                    <p className="text-xs font-medium text-slate-400">Top sản phẩm đóng góp nhiều nhất vào tổng lỗi</p>
                                </div>
                            </div>
                            <div className="h-72 w-full px-2">
                                <ParetoChart data={stats.paretoData} onSelect={(code) => onFilterSelect('search', code)} />
                            </div>
                        </div>

                        {/* Brand Stats for Production */}
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-card hover:shadow-lg transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><TagIcon className="w-5 h-5"/></div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Thống kê Nhãn hàng</h3>
                            </div>
                            <div className="space-y-4">
                                {['HTM', 'VMA'].map(brand => {
                                    const bStats = stats.brandCounts[brand as 'HTM'|'VMA'];
                                    const totalQ = stats.totalDefectQty || 1;
                                    const pct = (bStats.q / totalQ) * 100;
                                    const color = brand === 'HTM' ? BRAND.PRIMARY : BRAND.SUCCESS;
                                    return (
                                        <div key={brand} onClick={() => setSelectedBrandForDetail(brand)} className="relative p-5 border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group overflow-hidden bg-white hover:-translate-y-0.5">
                                            <div className="flex justify-between items-center mb-3 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                                                    <span className="font-black text-xl text-slate-800">{brand}</span>
                                                </div>
                                                <span className="text-xs font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-500">{pct.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden relative z-10">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                                <div className="text-center">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Lỗi</span>
                                                    <span className="block text-lg font-black text-slate-700"><CountUp value={bStats.q} /></span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Đổi</span>
                                                    <span className="block text-lg font-black text-slate-700"><CountUp value={bStats.e} /></span>
                                                </div>
                                            </div>
                                            {/* Decoration */}
                                            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.08] blur-xl group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: color }}></div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* --- MODAL OVERLAYS --- */}
        {activeModal === 'distributor' && !selectedDistributorForDetail && (
            <DrillDownModal 
                title="Thống kê Nhà phân phối" 
                data={stats.distributorStats} 
                type="distributor" 
                onClose={() => setActiveModal('none')} 
                onRowClick={(item) => setSelectedDistributorForDetail(item.name)}
            />
        )}

        {selectedDistributorForDetail && (
            <DetailedReportListModal 
                title={`Chi tiết: ${selectedDistributorForDetail}`} 
                reports={reports.filter(r => r.nhaPhanPhoi === selectedDistributorForDetail)}
                onClose={() => setSelectedDistributorForDetail(null)}
                onSelectReport={onSelectReport}
            />
        )}
        
        {activeModal === 'product' && (
            <DrillDownModal 
                title="Danh sách Sản phẩm lỗi" 
                data={stats.productStats} 
                type="product" 
                onClose={() => setActiveModal('none')} 
            />
        )}

        {selectedBrandForDetail && (
            <DrillDownModal 
                title={`Sản phẩm lỗi - Nhãn hàng ${selectedBrandForDetail}`}
                data={stats.productStats.filter(p => p.brand === selectedBrandForDetail)}
                type="product"
                onClose={() => setSelectedBrandForDetail(null)}
                onRowClick={(item) => setSelectedProductForDetail(item.code)}
            />
        )}

        {selectedProductForDetail && (
            <DetailedReportListModal 
                title={`Chi tiết mã: ${selectedProductForDetail}`}
                reports={reports.filter(r => r.maSanPham === selectedProductForDetail)}
                onClose={() => setSelectedProductForDetail(null)}
                onSelectReport={onSelectReport}
            />
        )}
    </div>
  );
}

export default React.memo(DashboardReport);