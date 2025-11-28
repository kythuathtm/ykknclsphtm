
import React, { useState, useRef, useEffect } from 'react';
import { User, SystemSettings, UserRole } from '../types';
import { 
  BarChartIcon, CalendarIcon, ListBulletIcon, ChartPieIcon, 
  ArrowDownTrayIcon, Cog8ToothIcon, ShieldCheckIcon, 
  TableCellsIcon, UserGroupIcon, ArrowRightOnRectangleIcon 
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
  onLogout: () => void;
  onOpenPermissionModal: () => void;
  onOpenProductModal: () => void;
  onOpenUserModal: () => void;
  onOpenSystemSettingsModal: () => void;
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
  onLogout, 
  onOpenPermissionModal, 
  onOpenProductModal, 
  onOpenUserModal, 
  onOpenSystemSettingsModal
}) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
              setIsAdminMenuOpen(false);
          }
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setIsProfileMenuOpen(false);
          }
      };
      if (isAdminMenuOpen || isProfileMenuOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isAdminMenuOpen, isProfileMenuOpen]);

  const getUserInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <header 
        className="backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 transition-all shadow-sm"
        style={{
            backgroundColor: systemSettings.headerBackgroundColor || 'rgba(255, 255, 255, 0.8)',
            color: systemSettings.headerTextColor || '#0f172a'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
               <BarChartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            
            {/* Desktop Title: 2 Lines with Hierarchy */}
            <div className="hidden md:flex flex-col justify-center">
               <span className="text-xs font-bold opacity-60 uppercase tracking-widest mb-0.5">
                 CÔNG TY CỔ PHẦN VẬT TƯ Y TẾ HỒNG THIỆN MỸ
               </span>
               <span className="text-lg lg:text-xl font-extrabold uppercase tracking-tight leading-none">
                 THEO DÕI PHẢN ÁNH CHẤT LƯỢNG SẢN PHẨM
               </span>
            </div>
            
            {/* Mobile Title Fallback */}
            <div className="md:hidden flex flex-col justify-center">
               <span className="text-[10px] font-bold opacity-60 uppercase tracking-wide mb-0.5">HTM JSC</span>
               <span className="text-sm font-bold uppercase leading-none">
                 THEO DÕI LỖI SP
               </span>
            </div>

            {isLoadingReports && <span className="text-xs text-blue-500 animate-pulse ml-2 font-semibold">● Loading...</span>}
          </div>

          {canViewDashboard && (
             <div className="flex items-center gap-1 sm:gap-3">
                 <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm px-2 py-1.5 flex items-center active:scale-95 transition-transform">
                    <CalendarIcon className="h-4 w-4 text-slate-500 mr-1 opacity-70" />
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="text-xs sm:text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer hover:text-blue-600 appearance-none pr-1"
                    >
                        <option value="All">Tất cả</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
                 
                 <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${currentView === 'list' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Danh sách"
                    >
                        <ListBulletIcon className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Danh sách</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${currentView === 'dashboard' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        title="Báo cáo"
                    >
                        <ChartPieIcon className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Báo cáo</span>
                    </button>
                </div>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
                {currentView === 'list' && (
                    <button onClick={onExport} className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center" title="Xuất Excel">
                        <ArrowDownTrayIcon className="h-5 w-5 sm:mr-2 text-slate-500" /><span className="hidden sm:inline">Xuất</span>
                    </button>
                )}
                {currentUser.role === UserRole.Admin && (
                    <div className="relative" ref={adminMenuRef}>
                        <button onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border active:scale-95 ${isAdminMenuOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:text-blue-600 opacity-80 hover:opacity-100'}`}>
                            <Cog8ToothIcon className={`h-5 w-5 ${isAdminMenuOpen ? 'animate-spin-slow' : ''}`} /><span className="hidden sm:inline text-sm font-bold">Cài đặt</span>
                        </button>
                        {isAdminMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up origin-top-right text-slate-900">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quản trị hệ thống</p></div>
                                <button onClick={() => { onOpenPermissionModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><ShieldCheckIcon className="h-5 w-5 mr-3 text-slate-400" />Phân quyền</button>
                                <button onClick={() => { onOpenProductModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><TableCellsIcon className="h-5 w-5 mr-3 text-slate-400" />Danh sách sản phẩm</button>
                                <button onClick={() => { onOpenUserModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><UserGroupIcon className="h-5 w-5 mr-3 text-slate-400" />Quản lý người dùng</button>
                                <button onClick={() => { onOpenSystemSettingsModal(); setIsAdminMenuOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><Cog8ToothIcon className="h-5 w-5 mr-3 text-slate-400" />Cấu hình / Cài đặt web</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="relative ml-1" ref={profileMenuRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="focus:outline-none transition-transform active:scale-95" title="Thông tin tài khoản">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md border-2 border-white ring-2 ring-transparent hover:ring-blue-200 transition-all text-sm">{getUserInitials(currentUser.fullName || currentUser.username)}</div>
                </button>
                {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up origin-top-right text-slate-900">
                        <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-sm font-bold text-slate-800 capitalize truncate">{currentUser.fullName || currentUser.username}</p>
                            <p className="text-xs font-normal text-slate-500 mt-0.5">{currentUser.role}</p>
                        </div>
                        <div className="py-1">
                            <button onClick={onLogout} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"><ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />Đăng xuất</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>
  );
};
