
import React, { useState, useEffect } from 'react';
import { User, SystemSettings } from '../types';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon } from './Icons';

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

  useEffect(() => { setIsLoaded(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ thông tin.');
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
    }, 500);
  };

  const renderBackground = () => {
      if (settings.backgroundType === 'image' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                 <div className="absolute inset-0 bg-cover bg-center z-0 animate-pulse-slow" style={{ backgroundImage: `url(${settings.backgroundValue})`, transform: 'scale(1.05)' }}></div>
                 <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"></div>
            </div>
          );
      }
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-50">
          {/* Animated Gradient Blobs */}
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-900">
       {renderBackground()}
       <style>{`
         .glass-card { 
            background: rgba(255, 255, 255, 0.7); 
            backdrop-filter: blur(25px); 
            -webkit-backdrop-filter: blur(25px); 
            border: 1px solid rgba(255, 255, 255, 0.8); 
            box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.1), 0 10px 30px -10px rgba(0, 0, 0, 0.05); 
         }
       `}</style>

      <div className={`relative z-10 w-full max-w-[440px] p-6 transition-all duration-1000 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="glass-card rounded-[2rem] p-8 sm:p-12">
            <div className="flex flex-col items-center text-center mb-10">
               {settings.logoUrl && (
                   <div className="mb-6 relative group cursor-pointer perspective-1000">
                       <div className="absolute -inset-6 bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition duration-700"></div>
                       <img src={settings.logoUrl} alt="Logo" className="relative h-28 object-contain drop-shadow-xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2" />
                   </div>
               )}
               {/* Fixed: Changed font-black to font-extrabold */}
               <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Xin chào!</h2>
               <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Hệ thống Theo dõi Phản ánh Chất lượng</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                            <UserIcon className="h-6 w-6 transition-transform group-focus-within:scale-110" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Tên đăng nhập" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="block w-full pl-12 pr-4 py-4 bg-white/60 border border-slate-200/60 rounded-2xl text-base font-bold text-slate-800 placeholder-slate-400/80 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm" 
                            required 
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                            <LockClosedIcon className="h-6 w-6 transition-transform group-focus-within:scale-110" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Mật khẩu" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="block w-full pl-12 pr-12 py-4 bg-white/60 border border-slate-200/60 rounded-2xl text-base font-bold text-slate-800 placeholder-slate-400/80 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm" 
                            required 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer outline-none active:scale-95 transform" 
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-sm font-bold text-rose-600 animate-slide-up shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>{error}
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold shadow-xl shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center relative overflow-hidden group">
                     <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                     {loading ? (
                         <>
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Đang đăng nhập...
                         </>
                     ) : (
                         <span className="flex items-center gap-2">
                            Đăng nhập hệ thống <ArrowRightOnRectangleIcon className="h-5 w-5 opacity-70" />
                         </span>
                     )}
                </button>
            </form>
        </div>
      </div>
      
      <div className="absolute bottom-6 w-full text-center z-10 p-4">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors cursor-default">
               Copyright © 2025 Công ty Cổ phần Vật tư Hồng Thiện Mỹ
           </p>
      </div>
    </div>
  );
};

export default Login;
