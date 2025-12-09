import React, { useState, useRef, useEffect } from 'react';
import { User, SystemSettings, UserRole } from '../types';
import { 
  BarChartIcon, CalendarIcon, ListBulletIcon, ChartPieIcon, 
  ArrowDownTrayIcon, Cog8ToothIcon, ShieldCheckIcon, 
  TableCellsIcon, UserGroupIcon, ArrowRightOnRectangleIcon, CompanyLogo, BellIcon,
  ArrowUpTrayIcon, DocumentDuplicateIcon, CloudSlashIcon, ArrowDownIcon,
  CheckCircleIcon, ExclamationCircleIcon, SparklesIcon, ClockIcon, ChatBubbleOvalLeftEllipsisIcon
} from './Icons';

interface HeaderProps {
  currentUser: User;
  systemSettings: SystemSettings;
  isLoadingReports: boolean;
  canViewDashboard: boolean;
  currentView: 'list' | 'dashboard';
  setCurrentView: (view: 'list' | 'dashboard') => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  availableYears: string[];
  onExport: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  canImport: boolean;
  onLogout: () => void;
  onOpenPermissionModal: () => void;
  onOpenProductModal: () => void;
  onOpenUserModal: () => void;
  onOpenSystemSettingsModal: () => void;
  onToggleChat: () => void;
  isOffline?: boolean;
}

interface Notification {
    id: number;
    type: 'info' | 'alert' | 'success';
    text: string;
    time: string;
    read: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser, 
  systemSettings, 
  isLoadingReports, 
  canViewDashboard,
  currentView, 
  setCurrentView, 
  yearFilter, 
  setYearFilter, 
  availableYears,
  onExport,
  onImport,
  onDownloadTemplate,
  canImport,
  onLogout, 
  onOpenPermissionModal, 
  onOpenProductModal, 
  onOpenUserModal, 
  onOpenSystemSettingsModal,
  onToggleChat,
  isOffline
}) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Mock Data cho thông báo
  const [notifications, setNotifications] = useState<Notification[]>([
      { id: 1, type: 'info', text: 'Hệ thống đã được cập nhật phiên bản mới 1.2.0.', time: 'Vừa xong', read: false },
      { id: 2, type: 'alert', text: 'Có 3 phiếu quá hạn xử lý cần kiểm tra ngay.', time: '1 giờ trước', read: false },
      { id: 3, type: 'success', text: 'Đồng bộ dữ liệu sản phẩm hoàn tất.', time: '2 giờ trước', read: true },
      { id: 4, type: 'info', text: 'Chào mừng bạn quay trở lại làm việc.', time: '5 giờ trước', read: true },
  ]);

  const adminMenuRef = useRef<HTMLDivElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Xử lý click outside để đóng các menu
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) setIsAdminMenuOpen(false);
          if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) setIsDataMenuOpen(false);
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false);
          if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) setIsNotifOpen(false);
      };
      
      // Chỉ add listener khi có ít nhất 1 menu đang mở
      if (isAdminMenuOpen || isProfileMenuOpen || isDataMenuOpen || isNotifOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAdminMenuOpen, isProfileMenuOpen, isDataMenuOpen, isNotifOpen]);

  const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getUserInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

  // Common Dropdown Style classes
  const dropdownClasses = "absolute right-0 top-full mt-3 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 ring-1 ring-slate-200/50 py-2 z-50 animate-fade-in-up origin-top-right overflow-hidden";

  return (
    <header 
        className="backdrop-blur-xl border-b border-white/40 sticky top-0 z-40 transition-all shadow-sm"
        style={{
            backgroundColor: systemSettings.headerBackgroundColor || 'rgba(255, 255, 255, 0.85)',
            color: systemSettings.headerTextColor || '#0f172a',
            fontFamily: 'var(--header-font, inherit)'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between gap-4">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 group cursor-pointer" onClick={() => window.location.reload()}>
            {systemSettings.logoUrl ? (
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src={systemSettings.logoUrl} alt="Logo" className="h-10 w-auto object-contain flex-shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-105" />
                </div>
            ) : (
                <div className="w-11 h-11 rounded-2xl shadow-lg shadow-blue-600/10 flex-shrink-0 bg-gradient-to-br from-white to-blue-50 border border-white flex items-center justify-center overflow-hidden relative z-10 group-hover:shadow-blue-600/20 transition-all duration-300 group-hover:-translate-y-0.5">
                   <CompanyLogo className="h-7 w-7 text-[#003DA5]" />
                </div>
            )}
            
            <div className="hidden md:flex flex-col justify-center">
               <div className="flex flex-col w-max">
                   {systemSettings.companyName.includes('HỒNG THIỆN MỸ') ? (
                       <div className="flex items-center gap-1.5 leading-none whitespace-nowrap" style={{ fontSize: 'var(--header-size, 1.1rem)' }}>
                           <span className="font-bold uppercase tracking-tight text-[#003DA5]">CÔNG TY CỔ PHẦN VẬT TƯ Y TẾ</span>
                           <span className="font-bold uppercase tracking-tight text-[#C5003E]">HỒNG THIỆN MỸ</span>
                       </div>
                   ) : (
                       <div className="font-bold uppercase tracking-tight leading-none text-slate-800 group-hover:text-[#003DA5] transition-colors duration-300 whitespace-nowrap" style={{ fontSize: 'var(--header-size, 1.1rem)' }}>
                         {systemSettings.companyName || 'HỒNG THIỆN MỸ'}
                       </div>
                   )}
                   <div className="w-full mt-1">
                        <div className="font-bold text-slate-400 uppercase group-hover:text-slate-400 transition-colors">
                            {systemSettings.appName || 'QUALITY MANAGEMENT SYSTEM'}
                        </div>
                   </div>
               </div>
            </div>
            
            {/* Mobile Branding */}
            <div className="md:hidden flex flex-col justify-center items-start">
               {systemSettings.companyName.includes('HỒNG THIỆN MỸ') ? (
                   <>
                       <span className="font-bold uppercase leading-none text-[#003DA5] text-xs">VẬT TƯ</span>
                       <span className="font-bold text-[#C5003E] uppercase tracking-wide text-xs">HỒNG THIỆN MỸ</span>
                   </>
               ) : (
                   <>
                       <span className="font-bold uppercase leading-none text-slate-800 text-sm">HTM JSC</span>
                       <span className="font-bold text-[#003DA5] uppercase tracking-wide text-[0.6rem]">QMS</span>
                   </>
               )}
            </div>

            {isLoadingReports && (
                <div className="hidden sm:flex items-center gap-2 ml-3 bg-blue-50/80 backdrop-blur text-blue-600 px-3 py-1.5 rounded-full border border-blue-100/50 animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-[0.6rem] font-bold uppercase tracking-wide">Syncing...</span>
                </div>
            )}
          </div>

          {/* Right: Actions & Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* View Switcher - Modern Pill Style */}
            {canViewDashboard && (
                <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`relative flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 gap-2 ${
                            currentView === 'list' 
                            ? 'bg-white text-[#003DA5] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                        }`}
                    >
                        <ListBulletIcon className="h-4 w-4" /> 
                        <span>Danh sách</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`relative flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 gap-2 ${
                            currentView === 'dashboard' 
                            ? 'bg-white text-[#003DA5] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                        }`}
                    >
                        <ChartPieIcon className="h-4 w-4" /> 
                        <span>Báo cáo</span>
                    </button>
                </div>
            )}

            {/* Year Filter */}
            {canViewDashboard && (
                <div className="hidden xl:flex relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-hover:text-[#003DA5] transition-colors">
                        <CalendarIcon className="h-4 w-4" />
                    </div>
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="bg-white/60 hover:bg-white border border-slate-200/60 text-slate-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] block w-full pl-9 pr-8 py-2 cursor-pointer hover:border-slate-300 transition-all outline-none appearance-none shadow-sm backdrop-blur-sm"
                    >
                        <option value="All">Tất cả năm</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                        <ArrowDownIcon className="h-3 w-3" />
                    </div>
                </div>
            )}

            <div className="h-6 w-px bg-slate-200/60 hidden sm:block"></div>

            {/* Icons Group */}
            <div className="flex items-center gap-2">
                
                {/* Offline Badge */}
                {isOffline && (
                    <button 
                        onClick={onOpenSystemSettingsModal}
                        className="hidden lg:flex items-center px-3 py-2 bg-red-50/80 border border-red-200 rounded-xl text-xs font-bold text-red-600 gap-2 cursor-pointer hover:bg-red-100 transition-all shadow-sm animate-pulse backdrop-blur-sm" 
                    >
                        <CloudSlashIcon className="w-4 h-4" />
                        <span>Offline</span>
                    </button>
                )}

                {/* AI Chat Button - NEW */}
                <button 
                    onClick={onToggleChat}
                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border bg-white/60 hover:bg-white border-slate-200/60 text-slate-500 hover:text-[#003DA5] hover:border-slate-300 shadow-sm"
                    title="Trợ lý AI"
                >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                </button>

                {/* Notification Center */}
                <div className="relative" ref={notifMenuRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border relative ${isNotifOpen ? 'bg-blue-50 border-blue-200 text-[#003DA5]' : 'bg-white/60 hover:bg-white border-slate-200/60 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm'}`}
                        title="Thông báo"
                    >
                        <BellIcon className={`h-5 w-5 ${unreadCount > 0 ? 'animate-shake' : ''}`} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm px-0.5 animate-zoom-in">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className={`${dropdownClasses} w-80 sm:w-96 py-0`}>
                            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông báo</span>
                                    {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">{unreadCount} mới</span>}
                                </div>
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-[#003DA5] hover:text-blue-700 hover:underline transition-colors disabled:opacity-50 disabled:no-underline"
                                    disabled={unreadCount === 0}
                                >
                                    Đánh dấu tất cả đã đọc
                                </button>
                            </div>
                            
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer group flex gap-3 items-start relative ${notif.read ? 'opacity-70 bg-transparent' : 'bg-blue-50/20'}`}
                                        >
                                            {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#003DA5]"></div>}
                                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white ${
                                                notif.type === 'alert' ? 'bg-red-100 text-red-600' : 
                                                notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {notif.type === 'alert' ? <ExclamationCircleIcon className="w-4 h-4" /> : 
                                                 notif.type === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : 
                                                 <SparklesIcon className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-snug transition-colors line-clamp-2 ${notif.read ? 'text-slate-600 font-medium' : 'text-slate-800 font-bold'}`}>
                                                    {notif.text}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <ClockIcon className="w-3 h-3 text-slate-400"/>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{notif.time}</p>
                                                </div>
                                            </div>
                                            {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ring-2 ring-white"></div>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-inner">
                                            <BellIcon className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-xs font-bold">Không có thông báo mới</p>
                                        <p className="text-[10px] opacity-60 mt-1">Bạn đã cập nhật tất cả thông tin.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-2 bg-slate-50/50 border-t border-slate-100 text-center backdrop-blur">
                                <button className="text-xs font-bold text-slate-500 hover:text-[#003DA5] transition-colors py-1 w-full rounded-lg hover:bg-slate-100">
                                    Xem lịch sử thông báo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Tools Menu */}
                {currentView === 'list' && (
                    <div className="relative" ref={dataMenuRef}>
                        <button 
                            onClick={() => setIsDataMenuOpen(!isDataMenuOpen)} 
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${isDataMenuOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white/60 hover:bg-white border-slate-200/60 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm'}`}
                            title="Công cụ dữ liệu"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        
                        {isDataMenuOpen && (
                            <div className={`${dropdownClasses} w-64`}>
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Excel Tools</p>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    <button onClick={() => { onExport(); setIsDataMenuOpen(false); }} className="flex w-full items-center px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-[#003DA5] rounded-xl transition-colors text-left group">
                                        <div className="p-1.5 bg-blue-100/50 text-blue-600 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors shadow-sm"><ArrowDownTrayIcon className="h-4 w-4" /></div>
                                        <span>Xuất dữ liệu (.xlsx)</span>
                                    </button>
                                    {canImport && (
                                        <>
                                            <button onClick={() => { onDownloadTemplate(); setIsDataMenuOpen(false); }} className="flex w-full items-center px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#003DA5] rounded-xl transition-colors text-left group">
                                                <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg mr-3 group-hover:bg-slate-200 transition-colors shadow-sm"><DocumentDuplicateIcon className="h-4 w-4" /></div>
                                                <span>Tải file mẫu</span>
                                            </button>
                                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                            <button onClick={() => { onImport(); setIsDataMenuOpen(false); }} className="flex w-full items-center px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
                                                <div className="p-1.5 bg-emerald-100/50 text-emerald-600 rounded-lg mr-3 group-hover:bg-emerald-200 transition-colors shadow-sm"><ArrowUpTrayIcon className="h-4 w-4" /></div>
                                                <span>Nhập Excel (Import)</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Admin Settings Menu */}
                {currentUser.role === UserRole.Admin && (
                    <div className="relative" ref={adminMenuRef}>
                        <button onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border ${isAdminMenuOpen ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white/60 hover:bg-white border-slate-200/60 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm'}`} title="Cài đặt">
                            <Cog8ToothIcon className={`h-5 w-5 transition-transform duration-500 ${isAdminMenuOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {isAdminMenuOpen && (
                            <div className={`${dropdownClasses} w-72`}>
                                <div className="px-4 py-2 border-b border-slate-100 mb-1 bg-orange-50/30 backdrop-blur-sm">
                                    <p className="text-[0.65rem] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                        <Cog8ToothIcon className="w-3 h-3" /> System Control
                                    </p>
                                </div>
                                <div className="flex flex-col p-1 space-y-0.5">
                                    <button onClick={() => { onOpenPermissionModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center justify-start px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-[#003DA5] transition-colors text-left group">
                                        <div className="p-1.5 bg-blue-100/50 text-blue-500 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors shadow-sm"><ShieldCheckIcon className="h-4 w-4" /></div>
                                        <span>Phân quyền & Vai trò</span>
                                    </button>
                                    <button onClick={() => { onOpenProductModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center justify-start px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-colors text-left group">
                                        <div className="p-1.5 bg-violet-100/50 text-violet-500 rounded-lg mr-3 group-hover:bg-violet-200 transition-colors shadow-sm"><TableCellsIcon className="h-4 w-4" /></div>
                                        <span>Danh mục sản phẩm</span>
                                    </button>
                                    <button onClick={() => { onOpenUserModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center justify-start px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left group">
                                        <div className="p-1.5 bg-emerald-100/50 text-emerald-500 rounded-lg mr-3 group-hover:bg-emerald-200 transition-colors shadow-sm"><UserGroupIcon className="h-4 w-4" /></div>
                                        <span>Quản lý người dùng</span>
                                    </button>
                                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                    <button onClick={() => { onOpenSystemSettingsModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center justify-start px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors text-left group">
                                        <div className="p-1.5 bg-orange-100/50 text-orange-500 rounded-lg mr-3 group-hover:bg-orange-200 transition-colors shadow-sm"><Cog8ToothIcon className="h-4 w-4" /></div>
                                        <span>Cấu hình hệ thống</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Profile Menu */}
            <div className="relative pl-3 border-l border-slate-200/60 ml-1" ref={profileMenuRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="focus:outline-none transition-transform active:scale-95 block group" title="Thông tin tài khoản">
                    {currentUser.avatarUrl ? (
                        <div className="relative">
                            <img 
                                src={currentUser.avatarUrl} 
                                alt="Avatar" 
                                className="h-10 w-10 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-transparent group-hover:ring-blue-100 transition-all"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#003DA5] to-indigo-600 text-white flex items-center justify-center font-bold shadow-md border-2 border-white ring-2 ring-transparent group-hover:ring-blue-200 transition-all text-sm relative">
                            {getUserInitials(currentUser.fullName || currentUser.username)}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                    )}
                </button>
                {isProfileMenuOpen && (
                    <div className={`${dropdownClasses} w-72 mt-4`}>
                        <div className="px-6 py-6 border-b border-slate-100 text-center flex flex-col items-center bg-gradient-to-b from-blue-50/30 to-transparent">
                            {currentUser.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg mb-3" />
                            ) : (
                               <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-[#003DA5] font-black text-3xl shadow-lg border-4 border-white mb-3">
                                  {getUserInitials(currentUser.fullName || currentUser.username)}
                                </div>
                            )}
                            <div className="min-w-0 flex-1 w-full">
                                <p className="text-lg font-bold text-slate-800 capitalize truncate" title={currentUser.fullName || currentUser.username}>{currentUser.fullName || currentUser.username}</p>
                                <p className="text-[0.65rem] font-bold text-blue-600 mt-1 uppercase tracking-wide bg-blue-50 px-3 py-1 rounded-full inline-block border border-blue-100 shadow-sm">{currentUser.role}</p>
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            <button className="flex w-full items-center justify-start px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#003DA5] transition-colors text-left group">
                                <div className="p-2 bg-slate-100 rounded-xl mr-3 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <UserGroupIcon className="h-4 w-4" />
                                </div>
                                <span>Hồ sơ cá nhân</span>
                            </button>
                            <button onClick={onLogout} className="flex w-full items-center justify-start px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left group">
                                <div className="p-2 bg-red-50 rounded-xl mr-3 text-red-500 group-hover:bg-red-100 transition-colors">
                                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                </div>
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                        <div className="bg-slate-50 py-2 text-center border-t border-slate-100 backdrop-blur-sm">
                            <p className="text-[0.6rem] text-slate-400 font-medium">Phiên bản 1.2.0</p>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>
  );
};