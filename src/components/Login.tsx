
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
                 <div className="absolute inset-0 bg-sky-900/20 backdrop-blur-[2px]"></div>
            </div>
          );
      }
      if (settings.backgroundType === 'color' && settings.backgroundValue) {
          return <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundColor: settings.backgroundValue }}></div>;
      }
      // Light Blue / Airy Gradient Background
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-50">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-sky-200/40 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-200/30 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-800 font-sans selection:bg-sky-200 selection:text-blue-900 p-4 sm:p-6 transition-colors">
       {renderBackground()}
       
       <div className={`relative z-10 w-full max-w-5xl transition-all duration-1000 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        
        {/* Main Glass Card - 50/50 Split */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(14,165,233,0.15)] border border-white/40 overflow-hidden flex flex-col md:flex-row min-h-[600px] ring-1 ring-white/50">
            
            {/* Left Side: Brand (Sky Blue Gradient) */}
            <div className="md:w-1/2 relative overflow-hidden flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {/* Glass Logo Box */}
                    <div className="w-40 h-40 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-xl border border-white/30 mb-8 ring-1 ring-white/20 group hover:scale-105 transition-transform duration-500">
                         {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-28 h-28 object-contain drop-shadow-lg" />
                         ) : (
                            <CompanyLogo className="w-24 h-24 text-white drop-shadow-lg" />
                         )}
                    </div>

                    <h1 className="text-2xl font-black uppercase tracking-tight leading-snug mb-4 text-shadow-sm px-4">
                        {settings.companyName || 'CÔNG TY CỔ PHẦN VẬT TƯ Y TẾ HỒNG THIỆN MỸ'}
                    </h1>
                    <div className="w-16 h-1 bg-white/40 rounded-full mb-6"></div>
                    <p className="text-blue-50 text-sm font-medium opacity-95 max-w-xs leading-relaxed tracking-wide">
                        {settings.appName || 'Hệ thống Quản lý Chất lượng (QMS)'}
                    </p>
                </div>
                
                <div className="mt-auto relative z-10 opacity-50 text-[10px] uppercase tracking-[0.2em] font-bold pt-8 text-blue-50">
                    Trusted System
                </div>
            </div>

            {/* Right Side: Form (Frosted Glass Effect) */}
            <div className="md:w-1/2 p-10 sm:p-16 flex flex-col justify-center relative bg-white/30 backdrop-blur-xl border-l border-white/20">
                
                {/* Internal shine/highlight */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none"></div>

                <div className="max-w-[340px] mx-auto w-full relative z-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Xin chào,</h2>
                        <p className="text-slate-500 font-medium">Vui lòng đăng nhập để tiếp tục.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3.5 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold animate-shake shadow-sm">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Tài khoản</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <input
                                    ref={usernameRef}
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white/70 border border-white/50 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:bg-white/90"
                                    placeholder="Tên đăng nhập"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Mật khẩu</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <LockClosedIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 bg-white/70 border border-white/50 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:bg-white/90"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none active:scale-90"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 px-1">
                            <label className="flex items-center cursor-pointer group select-none">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer transition-transform group-active:scale-95 accent-blue-600"
                                />
                                <span className="ml-2.5 text-xs font-bold text-slate-600 group-hover:text-blue-700 transition-colors">Ghi nhớ</span>
                            </label>

                            <a href="#" onClick={handleForgotPassword} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors hover:underline">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] flex justify-center items-center group relative overflow-hidden mt-4 ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                            {/* Shiny effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                            
                            {loading ? (
                                <span className="flex items-center gap-2 relative z-10">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 relative z-10 tracking-wide">
                                    ĐĂNG NHẬP <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
       </div>
    </div>
  );
};

export default Login;
