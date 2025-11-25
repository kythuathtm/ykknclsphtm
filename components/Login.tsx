
import React, { useState, useEffect } from 'react';
import { User, SystemSettings } from '../types';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CompanyLogo } from './Icons';

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

  useEffect(() => {
      // Trigger entrance animation on mount
      setIsLoaded(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for better UX feel
    setTimeout(() => {
        if (!username || !password) {
            setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
            setLoading(false);
            return;
        }

        const normalizedInput = username.trim().toLowerCase();
        const user = users.find(u => u.username.toLowerCase() === normalizedInput);

        if (user && user.password === password) {
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng.');
            setLoading(false);
        }
    }, 800);
  };

  // Logic hiển thị nền
  const renderBackground = () => {
      if (settings.backgroundType === 'image' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                 <div 
                    className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-[20s] ease-linear transform scale-105 hover:scale-110" 
                    style={{ backgroundImage: `url(${settings.backgroundValue})` }}
                 ></div>
                 <div className="absolute inset-0 bg-slate-900/40 z-0 backdrop-blur-[3px]"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20"></div>
            </div>
          );
      }
      
      // Default Modern Mesh Gradient
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-slate-50">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-pink-400/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-900">
       
       {renderBackground()}

       <style>{`
         @keyframes blob {
           0% { transform: translate(0px, 0px) scale(1); }
           33% { transform: translate(30px, -50px) scale(1.1); }
           66% { transform: translate(-20px, 20px) scale(0.9); }
           100% { transform: translate(0px, 0px) scale(1); }
         }
         .animate-blob { animation: blob 15s infinite alternate; }
         .animation-delay-2000 { animation-delay: 4s; }
         .animation-delay-4000 { animation-delay: 8s; }
         
         .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.9);
            box-shadow: 
                0 4px 6px -1px rgba(0, 0, 0, 0.05),
                0 20px 40px -10px rgba(0, 0, 0, 0.05),
                inset 0 0 0 1px rgba(255, 255, 255, 0.6);
         }
         
         .fade-in-section {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
         }
         .fade-in-section.visible {
            opacity: 1;
            transform: translateY(0);
         }
       `}</style>

      {/* --- Main Card --- */}
      <div className={`relative z-10 w-full max-w-[440px] p-6 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        <div className="glass-card rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-center text-center">
            
            {/* 1. Logo Section */}
            <div className={`mb-8 transition-all duration-700 delay-100 fade-in-section ${isLoaded ? 'visible' : ''}`}>
               <div className="relative group cursor-default">
                   {/* Glow Effect behind logo */}
                   <div className="absolute -inset-6 bg-blue-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                   
                   {settings.logoUrl ? (
                       <img 
                          src={settings.logoUrl} 
                          alt="App Logo" 
                          className="relative h-auto w-auto max-h-32 sm:max-h-40 max-w-[280px] object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
                       />
                   ) : (
                        <div className="relative p-2 transform group-hover:scale-105 transition-transform duration-300">
                            <CompanyLogo className="h-28 w-28 sm:h-32 sm:w-32 drop-shadow-xl" />
                        </div>
                   )}
               </div>
            </div>

            {/* 2. Welcome Text */}
            <div className={`w-full mb-8 space-y-1 transition-all duration-700 delay-200 fade-in-section ${isLoaded ? 'visible' : ''}`}>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    Xin chào! <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                </h2>
                <p className="text-slate-500 text-sm font-medium tracking-wide">Đăng nhập vào hệ thống</p>
                <style>{`@keyframes wave { 0% { transform: rotate(0deg); } 10% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 30% { transform: rotate(14deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } 60% { transform: rotate(0deg); } 100% { transform: rotate(0deg); } } .animate-wave { animation: wave 2.5s infinite; }`}</style>
            </div>
            
            {/* 3. Form */}
            <form onSubmit={handleSubmit} className={`w-full space-y-5 transition-all duration-700 delay-300 fade-in-section ${isLoaded ? 'visible' : ''}`}>
                <div className="space-y-4">
                    {/* Username Input */}
                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors z-10">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tên đăng nhập"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm group-hover:border-blue-300"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors z-10">
                            <LockClosedIcon className="h-5 w-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm group-hover:border-blue-300"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer z-10"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                                <EyeIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="animate-shake rounded-2xl bg-red-50 p-3 border border-red-100 flex items-center gap-3 shadow-sm">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold text-red-600 text-left flex-1">{error}</span>
                        <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } } .animate-shake { animation: shake 0.4s ease-in-out; }`}</style>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                    <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>

                    <div className="relative z-20 flex items-center justify-center">
                         {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Đang xác thực...</span>
                            </>
                        ) : (
                            <>
                                <span>Đăng nhập ngay</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </>
                        )}
                    </div>
                </button>
            </form>
        </div>
        
        {/* Footer */}
        <div className={`mt-8 text-center relative z-10 transition-all duration-700 delay-500 fade-in-section ${isLoaded ? 'visible' : ''}`}>
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-90 drop-shadow-sm">
                 © 2024 {settings.companyName || 'Công ty Cổ phần Vật tư Y tế Hồng Thiện Mỹ'}
             </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
