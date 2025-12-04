
import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { XIcon, CheckCircleIcon, ArrowUpTrayIcon, TrashIcon, TagIcon, WrenchIcon, SparklesIcon, ShoppingBagIcon, ListBulletIcon, TableCellsIcon } from './Icons';

interface Props {
  currentSettings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
  onClose: () => void;
}

const SystemSettingsModal: React.FC<Props> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'header' | 'list'>('general');
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
      { label: 'Rất nhỏ (11px)', value: '11px' },
      { label: 'Nhỏ (12px)', value: '12px' },
      { label: 'Trung bình (13px)', value: '13px' },
      { label: 'Lớn (14px)', value: '14px' },
      { label: 'Tiêu chuẩn (15px)', value: '15px' },
      { label: 'Hơi lớn (16px)', value: '16px' },
      { label: 'Rất lớn (18px)', value: '18px' },
      { label: 'Cực lớn (20px)', value: '20px' },
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

  const FontSelector = ({ 
      label, 
      fontFamilyValue, 
      fontSizeValue, 
      onFontFamilyChange, 
      onFontSizeChange,
      defaultFamily = "'Inter', sans-serif",
      defaultSize = "15px"
  }: any) => (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-3">
          <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">{label}</h5>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phông chữ</label>
                  <select 
                      value={fontFamilyValue || defaultFamily}
                      onChange={(e) => onFontFamilyChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer"
                  >
                      {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cỡ chữ</label>
                  <select 
                      value={fontSizeValue || defaultSize}
                      onChange={(e) => onFontSizeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer"
                  >
                      {fontSizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
              </div>
          </div>
          <div className="mt-3 p-3 bg-white border border-slate-100 rounded-lg">
              <p className="text-slate-800" style={{ fontFamily: fontFamilyValue || defaultFamily, fontSize: fontSizeValue || defaultSize }}>
                  Mẫu hiển thị: Công ty Hồng Thiện Mỹ
              </p>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-5xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-white/20 shadow-2xl animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Cấu hình Hệ thống</h2>
            <p className="text-sm text-slate-500">Tùy chỉnh giao diện và thông tin hiển thị</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50 custom-scrollbar flex flex-col md:flex-row">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex-shrink-0">
                <div className="space-y-1">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <TagIcon className="w-5 h-5" /> Thông tin chung
                    </button>
                    <button 
                        onClick={() => setActiveTab('header')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'header' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <WrenchIcon className="w-5 h-5" /> Header & Tiêu đề
                    </button>
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <TableCellsIcon className="w-5 h-5" /> Bảng & Danh sách
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6">
                
                {/* TAB: GENERAL */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <SectionTitle title="Thông tin Công ty" icon={<TagIcon className="w-5 h-5" />} />
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên ứng dụng</label>
                                    <input 
                                        type="text" 
                                        value={settings.appName}
                                        onChange={(e) => setSettings({...settings, appName: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên công ty</label>
                                    <input 
                                        type="text" 
                                        value={settings.companyName}
                                        onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Logo hệ thống</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                                            {settings.logoUrl ? (
                                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xs text-slate-400">No Logo</span>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={logoInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => logoInputRef.current?.click()}
                                                className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                                            >
                                                <ArrowUpTrayIcon className="w-3 h-3 mr-1.5" /> Tải ảnh lên
                                            </button>
                                            {settings.logoUrl && (
                                                <button 
                                                    onClick={() => setSettings({...settings, logoUrl: ''})}
                                                    className="flex items-center px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 shadow-sm"
                                                >
                                                    <TrashIcon className="w-3 h-3 mr-1.5" /> Xóa
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <SectionTitle title="Giao diện Đăng nhập" icon={<SparklesIcon className="w-5 h-5" />} colorClass="bg-purple-100 text-purple-600" />
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kiểu nền</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {[
                                            { id: 'default', label: 'Mặc định' }, 
                                            { id: 'image', label: 'Hình ảnh' },
                                            { id: 'color', label: 'Màu sắc' }
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => handleBackgroundTypeChange(type.id as any)}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${settings.backgroundType === type.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {settings.backgroundType !== 'default' && (
                                    <div className="animate-fade-in-up">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            {settings.backgroundType === 'image' ? 'URL Hình nền' : 'Mã màu nền (Hex/RGB)'}
                                        </label>
                                        <input 
                                            type="text" 
                                            value={settings.backgroundValue}
                                            onChange={(e) => setSettings({...settings, backgroundValue: e.target.value})}
                                            placeholder={settings.backgroundType === 'image' ? 'https://example.com/bg.jpg' : '#f8fafc'}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <SectionTitle title="Phông chữ mặc định (Toàn hệ thống)" icon={<ListBulletIcon className="w-5 h-5" />} colorClass="bg-slate-100 text-slate-600" />
                            <FontSelector 
                                label="Cài đặt mặc định"
                                fontFamilyValue={settings.fontFamily}
                                fontSizeValue={settings.baseFontSize}
                                onFontFamilyChange={(val: string) => setSettings({...settings, fontFamily: val})}
                                onFontSizeChange={(val: string) => setSettings({...settings, baseFontSize: val})}
                                defaultSize="15px"
                            />
                        </div>
                    </div>
                )}

                {/* TAB: HEADER */}
                {activeTab === 'header' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <SectionTitle title="Tùy chỉnh Header" icon={<WrenchIcon className="w-5 h-5" />} colorClass="bg-orange-100 text-orange-600" />
                            
                            <FontSelector 
                                label="Phông chữ Header"
                                fontFamilyValue={settings.headerFontFamily}
                                fontSizeValue={settings.headerFontSize}
                                onFontFamilyChange={(val: string) => setSettings({...settings, headerFontFamily: val})}
                                onFontSizeChange={(val: string) => setSettings({...settings, headerFontSize: val})}
                                defaultSize="16px"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Màu nền Header</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={settings.headerBackgroundColor || '#ffffff'}
                                            onChange={(e) => setSettings({...settings, headerBackgroundColor: e.target.value})}
                                            className="h-10 w-12 p-1 rounded border border-slate-300 cursor-pointer bg-white"
                                        />
                                        <input 
                                            type="text"
                                            value={settings.headerBackgroundColor || ''}
                                            onChange={(e) => setSettings({...settings, headerBackgroundColor: e.target.value})}
                                            placeholder="rgba(255,255,255,0.9)"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-base outline-none bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Màu chữ Header</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={settings.headerTextColor || '#0f172a'}
                                            onChange={(e) => setSettings({...settings, headerTextColor: e.target.value})}
                                            className="h-10 w-12 p-1 rounded border border-slate-300 cursor-pointer bg-white"
                                        />
                                        <input 
                                            type="text"
                                            value={settings.headerTextColor || ''}
                                            onChange={(e) => setSettings({...settings, headerTextColor: e.target.value})}
                                            placeholder="#0f172a"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-base outline-none bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: LIST */}
                {activeTab === 'list' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <SectionTitle title="Cấu hình Danh sách & Bảng" icon={<TableCellsIcon className="w-5 h-5" />} colorClass="bg-purple-100 text-purple-600" />
                            <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                Áp dụng cho "Danh sách phản ánh", "Danh sách sản phẩm" và các bảng dữ liệu chính.
                            </p>
                            
                            <FontSelector 
                                label="Phông chữ & Cỡ chữ Danh sách"
                                fontFamilyValue={settings.listFontFamily}
                                fontSizeValue={settings.listFontSize}
                                onFontFamilyChange={(val: string) => setSettings({...settings, listFontFamily: val})}
                                onFontSizeChange={(val: string) => setSettings({...settings, listFontSize: val})}
                                defaultSize="15px"
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>

        <div className="flex justify-end p-4 bg-white border-t border-slate-100 gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                Hủy bỏ
            </button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-95 active:translate-y-0 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Lưu cấu hình
            </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModal;
