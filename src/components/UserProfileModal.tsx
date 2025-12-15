
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { XIcon, CheckCircleIcon, UserIcon, EyeIcon, EyeSlashIcon, ArrowUpTrayIcon, LockClosedIcon } from './Icons';

interface Props {
  currentUser: User;
  onSave: (user: User) => void;
  onClose: () => void;
}

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                const maxWidth = 400;
                const maxHeight = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(elem.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const UserProfileModal: React.FC<Props> = ({ currentUser, onSave, onClose }) => {
  const [formData, setFormData] = useState<User>({ ...currentUser, password: '' }); // Don't show current password
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp.");
        return;
    }

    const userToSave = { ...formData };
    
    // If password is blank, use the original currentUser password (don't overwrite with empty string)
    if (!userToSave.password) {
        userToSave.password = currentUser.password;
    }

    onSave(userToSave);
    onClose();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, avatarUrl: compressedBase64 }));
    } catch (e) {
        alert("Lỗi xử lý ảnh.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/60 animate-dialog-enter">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <UserIcon className="w-5 h-5 text-[#003DA5]" />
             Hồ sơ cá nhân
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-all active:scale-95">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden relative">
                        {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <UserIcon className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpTrayIcon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-[#003DA5] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                        <ArrowUpTrayIcon className="w-3 h-3" />
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                <p className="text-xs text-slate-400">Nhấn vào ảnh để thay đổi</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên đăng nhập <LockClosedIcon className="w-3 h-3 inline mb-0.5 ml-1 text-slate-400"/></label>
                    <input 
                        type="text" 
                        value={formData.username} 
                        readOnly 
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium text-sm focus:outline-none cursor-not-allowed"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vai trò <LockClosedIcon className="w-3 h-3 inline mb-0.5 ml-1 text-slate-400"/></label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm">
                        {formData.role}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ và tên</label>
                    <input 
                        type="text" 
                        value={formData.fullName || ''} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] outline-none transition-all"
                        placeholder="Nhập họ tên hiển thị..."
                    />
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đổi mật khẩu (Tùy chọn)</label>
                    <div className="space-y-3">
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#003DA5] outline-none transition-all"
                                placeholder="Mật khẩu mới..."
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer outline-none"
                            >
                                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                        {formData.password && (
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-800 font-medium text-sm focus:ring-2 outline-none transition-all ${formData.password !== confirmPassword ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-300 focus:ring-blue-500/20 focus:border-[#003DA5]'}`}
                                placeholder="Nhập lại mật khẩu mới..."
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all active:scale-95">
                    Hủy
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-[#003DA5] text-white font-bold rounded-xl text-sm hover:bg-[#002a70] shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Lưu hồ sơ
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
