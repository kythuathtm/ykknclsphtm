
import React, { useState, useEffect, useRef } from 'react';
import { User, SystemSettings } from '../types';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CompanyLogo } from './Icons';

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
      const timer = setTimeout(() => setIsLoaded(true), 100); 
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
                 <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"></div>
            </div>
          );
      }
      
      if (settings.backgroundType === 'color' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundColor: settings.backgroundValue }}></div>
          );
      }
      
      // Modern Animated Mesh Gradient
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#f8fafc]">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50"></div>
          {/* Animated Blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[30%] left-[30%] w-[60vw] h-[60vw] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-800 font-sans selection:bg-[#003DA5] selection:text-white p-4 sm:p-6">
       {renderBackground()}
       
       <div className={`relative z-10 w-full max-w-[400px] transition-all duration-1000 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-2xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] rounded-[2rem] border border-white/60 p-8 sm:p-10 ring-1 ring-white/60 relative overflow-hidden">
            
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-xl shadow-blue-900/5 mb-5 p-4 transform hover:scale-105 transition-transform duration-500">
                     {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <CompanyLogo className="w-full h-full text-[#003DA5]" />
                    )}
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center">
                    {settings.companyName || 'Hồng Thiện Mỹ'}
                </h1>
                <p className="text-sm font-semibold text-slate-500 mt-1 text-center max-w-[260px] leading-relaxed tracking-wide opacity-80">
                    {settings.appName || 'Quản lý chất lượng sản phẩm'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="space-y-4">
                    <div className="group relative transition-all duration-300 focus-within:scale-[1.02]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#003DA5] transition-colors" />
                        </div>
                        <input 
                            ref={usernameRef}
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5] transition-all shadow-sm"
                            placeholder="Tên đăng nhập"
                            autoComplete="username"
                            required 
                            disabled={loading}
                        />
                    </div>

                    <div className="group relative transition-all duration-300 focus-within:scale-[1.02]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#003DA5] transition-colors" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#003DA5] transition-all shadow-sm"
                            placeholder="Mật khẩu"
                            autoComplete="current-password"
                            required 
                            disabled={loading}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003DA5] p-2 rounded-lg hover:bg-slate-50 transition-all cursor-pointer outline-none active:scale-95" 
                            title={showPassword ? "Ẩn" : "Hiện"}
                            disabled={loading}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shadow-sm ${rememberMe ? 'bg-[#003DA5] border-[#003DA5]' : 'border-slate-300 bg-white group-hover:border-[#003DA5]'}`}>
                            {rememberMe && <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                        <span className={`text-xs font-bold transition-colors ${rememberMe ? 'text-[#003DA5]' : 'text-slate-500 group-hover:text-[#003DA5]'}`}>Ghi nhớ đăng nhập</span>
                    </label>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-xs font-bold text-red-600 animate-shake shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1 flex-shrink-0"></span>
                        <span>{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3.5 rounded-xl bg-[#003DA5] text-white text-sm font-black shadow-lg shadow-blue-900/20 hover:bg-[#002a70] hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest active:scale-[0.98] active:translate-y-0 relative overflow-hidden group"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </span>
                    {/* Hover Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
                </button>
            </form>
            
            <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-60">
                    © 2025 Internal System
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
