import React, { useState, useEffect, useRef } from 'react';
import { User, SystemSettings } from '../types';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon, CompanyLogo } from './Icons';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
  settings: SystemSettings;
}

const Login: React.FC<Props> = ({ onLogin, users, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
      const timer = setTimeout(() => {
          setIsLoaded(true);
          if (usernameRef.current) {
              usernameRef.current.focus();
          }
      }, 100); 
      return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
            setLoading(false);
        }
    }, 800);
  };

  const renderBackground = () => {
      // Dynamic background based on settings or default modern gradient
      if (settings.backgroundType === 'image' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                 <div className="absolute inset-0 bg-cover bg-center z-0 animate-pulse-slow transition-transform duration-[60s] hover:scale-110 ease-linear" style={{ backgroundImage: `url(${settings.backgroundValue})`, transform: 'scale(1.1)' }}></div>
                 <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[10px]"></div>
            </div>
          );
      }
      
      // Default Glassmorphism Background
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#e0e7ff]">
          {/* Animated Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-300/60 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-300/60 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[40%] left-[40%] w-[50vw] h-[50vw] bg-pink-300/60 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-800 font-sans selection:bg-[#003DA5] selection:text-white p-4 sm:p-6">
       {renderBackground()}
       
       {/* Main Card Container */}
       <div className={`relative z-10 w-full max-w-[1200px] transition-all duration-1000 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
        
        {/* Unified Glass Card */}
        <div className="bg-white/40 backdrop-blur-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.2)] rounded-[32px] border border-white/50 overflow-hidden flex flex-col lg:flex-row min-h-[700px] ring-1 ring-white/40">
            
            {/* --- LEFT PANEL: Branding (7/12) --- */}
            <div className="relative w-full lg:w-7/12 bg-[#003DA5]/90 text-white p-10 lg:p-14 flex flex-col justify-between overflow-hidden">
                
                {/* Decorative Background Elements for Left Panel */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#004dc7] to-[#001533] opacity-90 z-0"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0"></div>
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#C5003E]/40 rounded-full blur-3xl z-0 animate-pulse-slow"></div>
                
                {/* Content Layer */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                    
                    {/* 1. TOP: Logo */}
                    <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg p-1.5">
                             {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <CompanyLogo className="w-full h-full text-white" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Hệ thống quản lý</span>
                            <span className="text-2xl font-black uppercase tracking-tight leading-none">{settings.companyName || 'Logo'}</span>
                        </div>
                    </div>

                    {/* 2. MIDDLE: Hello, Welcome! */}
                    <div className="py-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <h1 className="text-6xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tighter drop-shadow-lg">
                            Hello,<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-white to-blue-200">Welcome!</span>
                        </h1>
                        <div className="w-24 h-2 bg-[#C5003E] rounded-full mt-8 shadow-lg shadow-red-900/20"></div>
                    </div>

                    {/* 3. BOTTOM: System Name & Footer */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <div className="mb-8">
                            <p className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-2 opacity-90">Hệ thống</p>
                            <p className="text-2xl lg:text-3xl font-black uppercase leading-tight tracking-wide max-w-lg">
                                THEO DÕI & XỬ LÝ KHIẾU NẠI<br/>
                                VỀ CHẤT LƯỢNG SẢN PHẨM
                            </p>
                        </div>
                        <div className="pt-6 border-t border-white/10">
                             <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
                                © 2025 {settings.companyName || 'Hồng Thiện Mỹ'}
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: Form (5/12) --- */}
            <div className="w-full lg:w-5/12 bg-white/60 backdrop-blur-xl p-8 lg:p-12 flex flex-col justify-center items-center relative border-l border-white/20">
                <div className="w-full max-w-xs sm:max-w-sm relative z-10">
                    
                    {/* Icon: Login (Circle Avatar Placeholder) */}
                    <div className="mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="w-32 h-32 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] border-4 border-white mx-auto group hover:scale-105 transition-transform duration-500">
                            <UserIcon className="w-14 h-14 text-slate-300 group-hover:text-[#003DA5] transition-colors duration-300" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        
                        {/* Inputs */}
                        <div className="space-y-4">
                            <div className="group">
                                <div className="relative transform transition-transform duration-300 group-focus-within:scale-[1.02]">
                                    <input 
                                        ref={usernameRef}
                                        type="text" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        className="block w-full px-5 py-4 bg-white/80 border border-white rounded-[20px] text-slate-800 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5]/50 shadow-sm hover:shadow-md transition-all text-center"
                                        placeholder="Tên đăng nhập"
                                        autoComplete="username"
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <div className="relative transform transition-transform duration-300 group-focus-within:scale-[1.02]">
                                    <input 
                                        type="showPassword"
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="block w-full px-5 py-4 bg-white/80 border border-white rounded-[20px] text-slate-800 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5]/50 shadow-sm hover:shadow-md transition-all text-center"
                                        placeholder="Mật khẩu"
                                        autoComplete="current-password"
                                        required 
                                        disabled={loading}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003DA5] p-2 rounded-xl hover:bg-slate-100/50 transition-all cursor-pointer outline-none active:scale-95" 
                                        title={showPassword ? "Ẩn" : "Hiện"}
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center gap-2 text-sm font-bold text-red-600 animate-shake backdrop-blur-sm shadow-sm text-center">
                                <span className="text-lg leading-none">⚠️</span>
                                <span className="leading-snug">{error}</span>
                            </div>
                        )}

                        {/* Button */}
                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full py-4 rounded-[20px] bg-white border border-slate-200 text-[#003DA5] text-sm font-black shadow-lg hover:shadow-xl hover:bg-[#003DA5] hover:text-white hover:border-[#003DA5] hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        ĐANG XỬ LÝ...
                                    </>
                                ) : (
                                    'ĐĂNG NHẬP HỆ THỐNG'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;