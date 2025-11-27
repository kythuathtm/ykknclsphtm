


import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { XIcon, CheckCircleIcon, ArrowUpTrayIcon, TrashIcon } from './Icons';

interface Props {
  currentSettings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
  onClose: () => void;
}

const SystemSettingsModal: React.FC<Props> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings>(currentSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fontOptions = [
      { label: 'Arial (Mặc định)', value: "'Arial', sans-serif" },
      { label: 'Times New Roman', value: "'Times New Roman', serif" },
      { label: 'Tahoma', value: "'Tahoma', sans-serif" },
      { label: 'Verdana', value: "'Verdana', sans-serif" },
      { label: 'Courier New', value: "'Courier New', monospace" },
      { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
      { label: 'Roboto / Helvetica', value: "'Roboto', 'Helvetica', sans-serif" },
  ];

  const fontSizeOptions = [
      { label: 'Nhỏ (12px)', value: '12px' },
      { label: 'Trung bình (13px)', value: '13px' },
      { label: 'Lớn (14px)', value: '14px' },
      { label: 'Rất lớn (15px) (Mặc định)', value: '15px' },
      { label: 'Cực lớn (16px)', value: '16px' },
      { label: 'Khổng lồ (18px)', value: '18px' },
  ];

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white sm:rounded-2xl rounded-t-2xl w-full max-w-lg h-auto sm:h-auto flex flex-col overflow-hidden ring-1 ring-black/5 animate-fade-in-up pb-6 sm:pb-0">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800">Cấu hình Hệ thống</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-base font-normal shadow-sm"
                    placeholder="Nhập tên hiển thị trên tab trình duyệt..."
                />
            </div>
            
            {/* Company Name */}
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên công ty (Footer)</label>
                <input 
                    type="text" 
                    value={settings.companyName || ''}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-base font-normal shadow-sm"
                    placeholder="Công ty Cổ phần..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Font Selection */}
                <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">Font chữ hệ thống</label>
                     <select 
                        value={settings.fontFamily || "'Arial', sans-serif"}
                        onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-base font-normal shadow-sm cursor-pointer"
                     >
                         {fontOptions.map(font => (
                             <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                 {font.label}
                             </option>
                         ))}
                     </select>
                </div>
                
                {/* Font Size Selection */}
                <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">Kích thước chữ (Base)</label>
                     <select 
                        value={settings.baseFontSize || '15px'}
                        onChange={(e) => setSettings({...settings, baseFontSize: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-base font-normal shadow-sm cursor-pointer"
                     >
                         {fontSizeOptions.map(size => (
                             <option key={size.value} value={size.value}>
                                 {size.label}
                             </option>
                         ))}
                     </select>
                </div>
            </div>

            {/* Header Customization */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Tùy chỉnh Header</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Màu nền (Background)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={settings.headerBackgroundColor?.startsWith('#') ? settings.headerBackgroundColor : '#ffffff'}
                                onChange={(e) => setSettings({...settings, headerBackgroundColor: e.target.value})}
                                className="w-10 h-10 rounded cursor-pointer border-none p-0 shadow-sm"
                            />
                            <input 
                                type="text"
                                value={settings.headerBackgroundColor}
                                onChange={(e) => setSettings({...settings, headerBackgroundColor: e.target.value})}
                                className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500 uppercase"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Màu chữ (Text Color)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={settings.headerTextColor || '#0f172a'}
                                onChange={(e) => setSettings({...settings, headerTextColor: e.target.value})}
                                className="w-10 h-10 rounded cursor-pointer border-none p-0 shadow-sm"
                            />
                            <input 
                                type="text"
                                value={settings.headerTextColor}
                                onChange={(e) => setSettings({...settings, headerTextColor: e.target.value})}
                                className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500 uppercase"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => setSettings({ ...settings, headerBackgroundColor: 'rgba(255, 255, 255, 0.9)', headerTextColor: '#0f172a' })}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
                    >
                        Khôi phục mặc định (Trắng)
                    </button>
                </div>
            </div>

            <p className="text-xs text-slate-500">Cấu hình hiển thị sẽ được áp dụng thống nhất cho toàn bộ ứng dụng trên thiết bị này.</p>

            {/* Logo Upload */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Logo đăng nhập</label>
                <div className="flex items-start gap-4">
                    <div className="w-24 h-24 border border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden p-2 relative group shadow-sm">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-xs text-slate-400 font-medium">Mặc định</span>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                         <input 
                            type="file" 
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-all hover:border-blue-400 active:scale-95"
                        >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                            Tải ảnh lên
                        </button>
                        
                        {settings.logoUrl && (
                            <button 
                                onClick={() => setSettings({...settings, logoUrl: ''})}
                                className="w-full px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 flex items-center justify-center transition-all active:scale-95"
                            >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Khôi phục mặc định
                            </button>
                        )}
                        <p className="text-[11px] text-slate-500 leading-tight">
                            Định dạng: PNG, JPG.<br/>Kích thước: &lt; 500KB.<br/>Tỉ lệ: Vuông hoặc Chữ nhật đứng.
                        </p>
                    </div>
                </div>
            </div>

            {/* Background Settings */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Hình nền đăng nhập</label>
                <div className="flex gap-2 mb-3">
                    <button 
                        onClick={() => handleBackgroundTypeChange('default')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all active:scale-95 ${settings.backgroundType === 'default' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Mặc định (Hiệu ứng)
                    </button>
                     <button 
                        onClick={() => handleBackgroundTypeChange('image')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all active:scale-95 ${settings.backgroundType === 'image' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Ảnh tùy chỉnh (URL)
                    </button>
                </div>
                
                {settings.backgroundType === 'image' && (
                    <div className="animate-fade-in-up">
                        <input 
                            type="text" 
                            value={settings.backgroundValue}
                            onChange={(e) => setSettings({...settings, backgroundValue: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base font-normal bg-white shadow-sm"
                            placeholder="Dán đường dẫn ảnh (URL) vào đây..."
                        />
                        <p className="text-xs text-slate-500 mt-1">Ví dụ: https://i.ibb.co/...</p>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end items-center p-5 bg-white border-t border-slate-200 gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                Hủy
            </button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 flex items-center active:scale-95 active:translate-y-0">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Lưu thay đổi
            </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModal;