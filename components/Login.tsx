
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
    }, 600);
  };

  const renderBackground = () => {
      if (settings.backgroundType === 'image' && settings.backgroundValue) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                 <div className="absolute inset-0 bg-cover bg-center z-0 scale-105" style={{ backgroundImage: `url(${settings.backgroundValue})` }}></div>
                 <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
            </div>
          );
      }
      return (
       <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-slate-50">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-200/40 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>
       </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans text-slate-900">
       {renderBackground()}
       <style>{`
         @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
         .animate-blob { animation: blob 10s infinite alternate; }
         .animation-delay-4000 { animation-delay: 4s; }
         .glass-effect { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); }
       `}</style>

      <div className={`relative z-10 w-full max-w-[420px] p-4 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="glass-effect rounded-3xl p-8 sm:p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
               <div className="mb-6 relative group">
                   <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   {settings.logoUrl ? (
                       <img src={settings.logoUrl} alt="Logo" className="relative h-24 object-contain drop-shadow-sm" />
                   ) : (
                        <CompanyLogo className="relative h-24 w-24 drop-shadow-md" />
                   )}
               </div>
               <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">Xin chào! 👋</h2>
               <p className="text-slate-500 text-sm font-medium">Đăng nhập để tiếp tục</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><UserIcon className="h-5 w-5" /></div>
                        <input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><LockClosedIcon className="h-5 w-5" /></div>
                        <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors" tabIndex={-1}>
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-xs font-bold text-red-600 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{error}
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                     {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>
        </div>
      </div>
      
      <div className="absolute bottom-6 w-full text-center z-10 p-4">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
               Copyright © 2025 Công ty Cổ phần Vật tư Hồng Thiện Mỹ
           </p>
      </div>
    </div>
  );
};

export default Login;
