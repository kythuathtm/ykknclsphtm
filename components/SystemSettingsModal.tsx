
import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { XIcon, CheckCircleIcon, ArrowUpTrayIcon } from './Icons';

interface Props {
  currentSettings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
  onClose: () => void;
}

const SystemSettingsModal: React.FC<Props> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings>(currentSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước (ví dụ < 500KB để tránh làm nặng Firestore)
    if (file.size > 500 * 1024) {
        alert('Kích thước ảnh logo nên nhỏ hơn 500KB để đảm bảo hiệu suất.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        setSettings(prev => ({ ...prev, logoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundTypeChange = (type: 'default' | 'image' | 'color') => {
      setSettings(prev => ({ ...prev, backgroundType: type }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden ring-1 ring-black/5">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800">Cấu hình Hệ thống</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-slate-50/50 overflow-y-auto max-h-[70vh]">
            {/* App Name */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên ứng dụng</label>
                <input 
                    type="text" 
                    value={settings.appName}
                    onChange={(e) => setSettings({...settings, appName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Nhập tên hiển thị trên tab trình duyệt..."
                />
            </div>

            {/* Logo Upload */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Logo đăng nhập</label>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-xs text-slate-400">No Logo</span>
                        )}
                    </div>
                    <div className="flex-1">
                         <input 
                            type="file" 
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm flex items-center"
                        >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                            Tải ảnh lên
                        </button>
                        <p className="text-xs text-slate-500 mt-2">Định dạng: PNG, JPG. Kích thước tối ưu: Vuông hoặc Ngang.</p>
                        {settings.logoUrl && (
                            <button 
                                onClick={() => setSettings({...settings, logoUrl: ''})}
                                className="text-xs text-red-600 hover:underline mt-1"
                            >
                                Xóa logo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Background Settings */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Hình nền đăng nhập</label>
                <div className="flex gap-2 mb-3">
                    <button 
                        onClick={() => handleBackgroundTypeChange('default')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border ${settings.backgroundType === 'default' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}
                    >
                        Mặc định (Hiệu ứng)
                    </button>
                     <button 
                        onClick={() => handleBackgroundTypeChange('image')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border ${settings.backgroundType === 'image' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}
                    >
                        Ảnh tùy chỉnh
                    </button>
                </div>
                
                {settings.backgroundType === 'image' && (
                    <div className="animate-fade-in-up">
                        <input 
                            type="text" 
                            value={settings.backgroundValue}
                            onChange={(e) => setSettings({...settings, backgroundValue: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                            placeholder="Dán đường dẫn ảnh (URL) vào đây..."
                        />
                        <p className="text-xs text-slate-500 mt-1">Ví dụ: https://i.ibb.co/...</p>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end items-center p-5 bg-white border-t border-slate-200 gap-3">
            <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Hủy
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Lưu thay đổi
            </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModal;
