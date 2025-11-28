import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { XIcon, CheckCircleIcon, ArrowUpTrayIcon, TrashIcon, TagIcon, WrenchIcon, SparklesIcon, ShoppingBagIcon } from './Icons';

interface Props {
  currentSettings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
  onClose: () => void;
}

const SystemSettingsModal: React.FC<Props> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings>(currentSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fontOptions = [
      { label: 'Inter (Mặc định)', value: "'Inter', sans-serif" },
      { label: 'Arial', value: "'Arial', sans-serif" },
      { label: 'Times New Roman', value: "'Times New Roman', serif" },
      { label: 'Tahoma', value: "'Tahoma', sans-serif" },
      { label: 'Verdana', value: "'Verdana', sans-serif" },
      { label: 'Courier New', value: "'Courier New', monospace" },
      { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
      { label: 'Roboto', value: "'Roboto', sans-serif" },
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

  const SectionTitle = ({ title, icon, colorClass = "bg-blue-100 text-blue-600" }: { title: string, icon: React.ReactNode, colorClass?: string }) => (
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <div className={`p-1.5 rounded-lg ${colorClass}`}>
              {icon}
          </div>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h4>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-white/20 shadow-2xl animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Cấu hình Hệ thống</h2>
            <p className="text-sm text-slate-500">Tùy chỉnh giao diện và thông tin chung</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. General Info */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <SectionTitle title="Thông tin chung" icon={<TagIcon className="h-4 w-4" />} colorClass="bg-indigo-100 text-indigo-600" />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên ứng dụng (Tab Browser)</label>
                            <input 
                                type="text" 
                                value={settings.appName}
                                onChange={(e) => setSettings({...settings, appName: e.target.value})}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white text-sm font-medium transition-all"
                                placeholder="VD: Theo dõi lỗi SP"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên công ty (Footer/Header)</label>
                            <input 
                                type="text" 
                                value={settings.companyName || ''}
                                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white text-sm font-medium transition-all"
                                placeholder="VD: Công ty Cổ phần..."
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Typography */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <SectionTitle title="Phông chữ & Hiển thị" icon={<WrenchIcon className="h-4 w-4" />} colorClass="bg-emerald-100 text-emerald-600" />
                    <div className="space-y-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Font chữ hệ thống</label>
                             <div className="relative">
                                <select 
                                    value={settings.fontFamily || "'Inter', sans-serif"}
                                    onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white text-sm font-medium appearance-none cursor-pointer"
                                >
                                    {fontOptions.map(font => (
                                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                            {font.label} - Mẫu chữ ABC
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                </div>
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kích thước chữ cơ bản</label>
                             <div className="relative">
                                <select 
                                    value={settings.baseFontSize || '15px'}
                                    onChange={(e) => setSettings({...settings, baseFontSize: e.target.value})}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white text-sm font-medium appearance-none cursor-pointer"
                                >
                                    {fontSizeOptions.map(size => (
                                        <option key={size.value} value={size.value}>
                                            {size.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 3. Header Styling */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-pink-100 text-pink-600"><SparklesIcon className="h-4 w-4" /></div>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tùy chỉnh Header</h4>
                        </div>
                        <button 
                            onClick={() => setSettings({ ...settings, headerBackgroundColor: 'rgba(255, 255, 255, 0.9)', headerTextColor: '#0f172a' })}
                            className="text-xs font-bold text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                            Khôi phục mặc định
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Background Color */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Màu nền Header</label>
                            <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-xl bg-slate-50">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-1 ring-slate-200 shadow-sm flex-shrink-0">
                                    <input 
                                        type="color" 
                                        value={settings.headerBackgroundColor?.startsWith('#') ? settings.headerBackgroundColor : '#ffffff'}
                                        onChange={(e) => setSettings({...settings, headerBackgroundColor: e.target.value})}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0"
                                    />
                                </div>
                                <input 
                                    type="text"
                                    value={settings.headerBackgroundColor}
                                    onChange={(e) => setSettings({...settings, headerBackgroundColor: e.target.value})}
                                    className="flex-1 bg-transparent border-none text-sm font-mono text-slate-700 focus:ring-0 uppercase placeholder-slate-400"
                                    placeholder="#FFFFFF hoặc rgba(...)"
                                />
                            </div>
                        </div>

                        {/* Text Color */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Màu chữ Header</label>
                            <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-xl bg-slate-50">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-1 ring-slate-200 shadow-sm flex-shrink-0">
                                    <input 
                                        type="color" 
                                        value={settings.headerTextColor || '#0f172a'}
                                        onChange={(e) => setSettings({...settings, headerTextColor: e.target.value})}
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0"
                                    />
                                </div>
                                <input 
                                    type="text"
                                    value={settings.headerTextColor}
                                    onChange={(e) => setSettings({...settings, headerTextColor: e.target.value})}
                                    className="flex-1 bg-transparent border-none text-sm font-mono text-slate-700 focus:ring-0 uppercase placeholder-slate-400"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Preview Area */}
                    <div className="mt-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Xem trước</span>
                        <div 
                            className="w-full h-12 rounded-lg shadow-sm flex items-center justify-center font-bold text-sm transition-all"
                            style={{ backgroundColor: settings.headerBackgroundColor, color: settings.headerTextColor }}
                        >
                            THEO DÕI PHẢN ÁNH CHẤT LƯỢNG
                        </div>
                    </div>
                </div>

                {/* 4. Branding & Login */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                    <SectionTitle title="Thương hiệu & Đăng nhập" icon={<ShoppingBagIcon className="h-4 w-4" />} colorClass="bg-amber-100 text-amber-600" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Logo Doanh nghiệp</label>
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                                    {settings.logoUrl ? (
                                        <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium text-center px-1">Chưa có logo</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input 
                                        type="file" 
                                        ref={logoInputRef}
                                        onChange={handleLogoUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button 
                                        onClick={() => logoInputRef.current?.click()}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-all active:scale-95"
                                    >
                                        <ArrowUpTrayIcon className="h-3.5 w-3.5 mr-2" />
                                        Tải ảnh lên (Max 500KB)
                                    </button>
                                    
                                    {settings.logoUrl && (
                                        <button 
                                            onClick={() => setSettings({...settings, logoUrl: ''})}
                                            className="w-full px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 flex items-center justify-center transition-all active:scale-95"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5 mr-2" />
                                            Xóa Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Background Settings */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hình nền trang đăng nhập</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                                <button 
                                    onClick={() => handleBackgroundTypeChange('default')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.backgroundType === 'default' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mặc định
                                </button>
                                <button 
                                    onClick={() => handleBackgroundTypeChange('image')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.backgroundType === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-normal bg-white shadow-sm"
                                        placeholder="Dán đường dẫn ảnh (URL) vào đây..."
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 italic">Khuyên dùng ảnh chất lượng cao, tối màu.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div className="flex justify-end items-center px-6 py-4 bg-white border-t border-slate-100 gap-3">
            <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm hover:shadow">
                Hủy bỏ
            </button>
            <button onClick={handleSave} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 flex items-center active:scale-95 active:translate-y-0">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Lưu cấu hình
            </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModal;