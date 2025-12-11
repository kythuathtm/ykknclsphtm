
import React, { useState, useEffect, useRef } from 'react';
import { User, SystemSettings } from '../types';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CompanyLogo, ArrowRightIcon } from './Icons';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
  settings: SystemSettings;
}

const Login: React.FC<Props> = ({ onLogin, users, settings }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('app_saved_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('app_saved_username'));
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
      if (!username && usernameRef.current) {
          usernameRef.current.focus();
      }
      // Animation trigger on mount
      const timer = setTimeout(() => setIsLoaded(true), 100); 
      return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginProcess();
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
      e.preventDefault();
      alert("Vui lòng liên hệ bộ phận IT hoặc Quản trị viên để đặt lại mật khẩu.");
  };

  const handleLoginProcess = () => {
    setError('');
    setLoading(true);

    setTimeout(() => {
        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
            setLoading(false);
            return;
        }

        const normalizedInput = username.trim().toLowerCase();
        const user = users.find(u => u.username.toLowerCase() === normalizedInput);

        if (user && user.password === password) {
            if (rememberMe) {
                localStorage.setItem('app_saved_username', username.trim());
            } else {
                localStorage.removeItem('app_saved_username');
            }
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
            setLoading(false);
        }
    }, 800);
  };

  const renderBackground = () => {
      if (settings.backgroundType === 'image' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                 <div className="absolute inset-0 bg-cover bg-center z-0 animate-pulse-slow transition-transform duration-[60s] hover:scale-110 ease-linear" style={{ backgroundImage: `url(${settings.backgroundValue})`, transform: 'scale(1.1)' }}></div>
                 <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"></div>
            </div>
          );
      }
      
      if (settings.backgroundType === 'color' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundColor: settings.backgroundValue }}></div>
          );
      }
      
      // Modern Animated Mesh Gradient for Glassmorphism
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#f0f4f8]">
          {/* Abstract Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[40%] left-[40%] w-[60vw] h-[60vw] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>
          
          {/* Noise Texture Overlay for realism */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-800 font-sans selection:bg-[#003DA5] selection:text-white p-4 sm:p-6">
       {renderBackground()}
       
       <div className={`relative z-10 w-full max-w-[480px] transition-all duration-1000 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        
        {/* Glass Card */}
        <div className="bg-white/70 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-white/60 p-8 sm:p-12 ring-1 ring-white/50 relative overflow-hidden group">
            
            {/* Ambient light inside card */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* 1. Logo & Title Section */}
            <div className="flex flex-col items-center mb-8 animate-fade-in-up text-center" style={{ animationDelay: '100ms' }}>
                {/* Logo */}
                <div className="w-28 h-28 bg-white/90 rounded-[2rem] flex items-center justify-center border border-white shadow-xl shadow-indigo-500/10 p-5 transform group-hover:scale-105 transition-transform duration-500 mb-6 relative backdrop-blur-sm">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <CompanyLogo className="w-full h-full text-[#003DA5]" />
                    )}
                    {/* Inner sheen */}
                    <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/50 pointer-events-none bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
                </div>
                
                {/* WELCOME - Hiệu ứng Gradient (Đã bỏ animate-shimmer) */}
                <div className="mb-6 relative">
                    <p className="text-4xl sm:text-5xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-600 uppercase drop-shadow-sm">
                        WELCOME
                    </p>
                    {/* Glow effect phía sau chữ Welcome */}
                    <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full -z-10 scale-75"></div>
                </div>

                {/* Main Title Block */}
                <div className="space-y-1 relative flex flex-col items-center">
                    {/* Dòng "Hệ thống" dời xuống đây */}
                    <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase mb-2 opacity-80">
                        - HỆ THỐNG -
                    </p>

                    {/* Tiêu đề chính - Đồng nhất 1 màu */}
                    <div className="text-[#003DA5] space-y-1">
                        <h1 className="text-xl sm:text-2xl font-black uppercase leading-tight tracking-tight">
                            THEO DÕI XỬ LÝ KHIẾU NẠI
                        </h1>
                        <h2 className="text-xl sm:text-2xl font-black uppercase leading-none tracking-tight">
                            CHẤT LƯỢNG SẢN PHẨM
                        </h2>
                    </div>
                    
                    <div className="h-1 w-16 bg-[#003DA5]/20 rounded-full mt-5 mx-auto"></div>
                </div>
            </div>

            {/* 2. Form */}
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {error && (
                    <div className="p-4 rounded-2xl bg-red-50/90 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-3 animate-shake shadow-sm backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    {/* Username Input */}
                    <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-slate-400 group-focus-within/input:text-[#003DA5] transition-colors duration-300" />
                        </div>
                        <input
                            ref={usernameRef}
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-white/60 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5]/50 focus:bg-white/90 transition-all shadow-inner hover:bg-white/80"
                            placeholder="Tên đăng nhập"
                            disabled={loading}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within/input:text-[#003DA5] transition-colors duration-300" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-12 pr-12 py-4 bg-white/60 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5]/50 focus:bg-white/90 transition-all shadow-inner hover:bg-white/80"
                            placeholder="Mật khẩu"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors outline-none"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center cursor-pointer group select-none">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <div className="w-5 h-5 border-2 border-slate-300 rounded-lg transition-all peer-checked:bg-[#003DA5] peer-checked:border-[#003DA5] peer-checked:shadow-md peer-hover:border-blue-300 bg-white/80"></div>
                            <svg className="absolute w-3.5 h-3.5 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none scale-0 peer-checked:scale-100 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="ml-2.5 text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Ghi nhớ đăng nhập</span>
                    </label>
                    <a href="#" onClick={handleForgotPassword} className="text-xs font-bold text-[#003DA5] hover:text-blue-700 transition-colors hover:underline decoration-2 underline-offset-2">
                        Quên mật khẩu?
                    </a>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-900/20 text-sm font-bold text-white bg-gradient-to-r from-[#003DA5] to-blue-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 relative overflow-hidden group/btn hover:shadow-red-900/40"
                >
                    {/* Shiny Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out skew-x-12"></div>
                    
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="tracking-wide">ĐANG XỬ LÝ...</span>
                        </div>
                    ) : (
                        <span className="relative z-10 flex items-center gap-2 tracking-wide uppercase text-base">
                            ĐĂNG NHẬP HỆ THỐNG <ArrowRightIcon className="w-5 h-5 opacity-80 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                    )}
                </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200/50 text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">
                    &copy; {new Date().getFullYear()} <span className="text-[#003DA5]">Hồng Thiện Mỹ</span>. All rights reserved.
                </p>
            </div>
        </div>
       </div>
    </div>
  );
};

export default Login;
