
import React, { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
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
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div 
                    className="absolute inset-0 bg-cover bg-center z-0" 
                    style={{ backgroundImage: `url(${settings.backgroundValue})` }}
                 ></div>
                 <div className="absolute inset-0 bg-slate-900/30 z-0 backdrop-blur-[2px]"></div>
            </div>
          );
      }
      // Default Animated
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid Pattern - Subtle Grey */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6 }}></div>
          
          {/* Floating Blobs - Pastel Colors */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-[600px] h-[600px] bg-pink-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-4000"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-[#f8fafc]">
       
       {renderBackground()}

       <style>{`
         @keyframes blob {
           0% { transform: translate(0px, 0px) scale(1); }
           33% { transform: translate(30px, -50px) scale(1.1); }
           66% { transform: translate(-20px, 20px) scale(0.9); }
           100% { transform: translate(0px, 0px) scale(1); }
         }
         .animate-blob { animation: blob 10s infinite; }
         .animation-delay-2000 { animation-delay: 2s; }
         .animation-delay-4000 { animation-delay: 4s; }
       `}</style>

      {/* --- Main Card --- */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Glassmorphism Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/80 p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-500 ring-1 ring-white/50">
            
            {/* Logo Section with Glow */}
            <div className="mb-8 relative group">
               <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white">
                   {settings.logoUrl ? (
                       <img 
                          src={settings.logoUrl} 
                          alt="App Logo" 
                          className="h-auto w-auto max-h-32 sm:max-h-40 max-w-[280px] object-contain"
                       />
                   ) : (
                        // Fallback to default Logo_HTM.png if exists, else Component
                        <img 
                            src="Logo_HTM.png" 
                            alt="Default Logo" 
                            className="h-auto w-auto max-h-32 sm:max-h-40 max-w-[280px] object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'; // Hide broken image
                                // Fallback to SVG Component would require more complex logic here, 
                                // simpler to just rely on the uploaded one or default file.
                            }}
                        />
                   )}
               </div>
            </div>

            <div className="w-full mb-8 space-y-2">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Xin chào! 👋</h2>
                <p className="text-slate-500 text-sm font-medium">Đăng nhập vào {settings.appName}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="w-full space-y-5">
                <div className="text-left space-y-4">
                    {/* Username Input */}
                    <div className="group relative">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block group-focus-within:text-blue-600 transition-colors">Tên đăng nhập</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200/70 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="group relative">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block group-focus-within:text-blue-600 transition-colors">Mật khẩu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <LockClosedIcon className="h-5 w-5" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-12 py-3 bg-white/70 border border-slate-200/70 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
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
                </div>

                {error && (
                    <div className="animate-pulse rounded-xl bg-red-50 p-3 border border-red-100 flex items-start gap-3 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold text-red-600 text-left">{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center group"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang đăng nhập...</span>
                        </div>
                    ) : (
                        <span className="flex items-center">
                            Đăng nhập ngay
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    )}
                </button>
            </form>
        </div>
        
        <div className="mt-8 text-center relative z-10">
             <p className="text-xs font-medium text-slate-400">© 2024 {settings.appName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
