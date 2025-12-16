
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
                 <div className="absolute inset-0 bg-sky-900/30 backdrop-blur-[4px]"></div>
            </div>
          );
      }
      if (settings.backgroundType === 'color' && settings.backgroundValue) {
          return <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundColor: settings.backgroundValue }}></div>;
      }
      // Sophisticated Mesh Gradient
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-50">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-400/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-400/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] bg-pink-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-800 font-sans selection:bg-sky-200 selection:text-blue-900 p-4 sm:p-6 transition-colors">
       {renderBackground()}
       
       <div className={`relative z-10 w-full max-w-5xl transition-all duration-1000 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
        
        {/* Main Mirror Card */}
        <div className="glass-mirror rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row min-h-[600px] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.3)]">
            
            {/* Left Side: Brand */}
            <div className="md:w-1/2 relative overflow-hidden flex flex-col items-center justify-center p-12 text-center text-white">
                
                {/* Dynamic Gradient Background for Left Side */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                
                {/* Glowing Orbs */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/30 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {/* Glass Logo Box */}
                    <div className="w-40 h-40 glass-panel rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 group hover:scale-105 transition-transform duration-500 relative">
                         <div className="absolute inset-0 bg-white/10 rounded-[2rem] blur-sm"></div>
                         {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-28 h-28 object-contain drop-shadow-xl relative z-10" />
                         ) : (
                            <CompanyLogo className="w-24 h-24 text-white drop-shadow-xl relative z-10" />
                         )}
                    </div>

                    <h1 className="text-3xl font-black uppercase tracking-tight leading-snug mb-4 text-shadow-sm px-4 drop-shadow-lg">
                        {settings.companyName || 'CÔNG TY CỔ PHẦN VẬT TƯ Y TẾ HỒNG THIỆN MỸ'}
                    </h1>
                    <div className="w-20 h-1.5 bg-white/40 rounded-full mb-6 backdrop-blur-md shadow-sm"></div>
                    <p className="text-blue-50 text-sm font-semibold opacity-90 max-w-xs leading-relaxed tracking-wide drop-shadow-md bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                        {settings.appName || 'Hệ thống Quản lý Chất lượng (QMS)'}
                    </p>
                </div>
                
                <div className="mt-auto relative z-10 opacity-70 text-[10px] uppercase tracking-[0.3em] font-bold pt-8 text-blue-100 drop-shadow">
                    Trusted System
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="md:w-1/2 p-10 sm:p-16 flex flex-col justify-center relative bg-white/40 backdrop-blur-md">
                
                <div className="max-w-[340px] mx-auto w-full relative z-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight drop-shadow-sm">Xin chào,</h2>
                        <p className="text-slate-600 font-medium">Vui lòng đăng nhập để tiếp tục.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 glass-panel bg-red-50/50 border-red-200 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold animate-shake shadow-lg">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Tài khoản</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-600 transition-colors z-10">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <input
                                    ref={usernameRef}
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white/90 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-inner hover:bg-white/80"
                                    placeholder="Tên đăng nhập"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Mật khẩu</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-600 transition-colors z-10">
                                    <LockClosedIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white/90 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-inner hover:bg-white/80"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none active:scale-90 z-10"
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
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer transition-transform group-active:scale-95 accent-blue-600 bg-white/50"
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
                            className={`w-full py-4 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all shadow-xl shadow-blue-500/30 active:scale-[0.98] flex justify-center items-center group relative overflow-hidden mt-6 border border-white/20 ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                            {/* Shiny effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                            
                            {loading ? (
                                <span className="flex items-center gap-2 relative z-10">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 relative z-10 tracking-wide uppercase">
                                    Đăng nhập <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
