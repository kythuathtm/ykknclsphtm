
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { XIcon, PlusIcon, PencilIcon, TrashIcon, UserIcon } from './Icons';

interface Props {
  users: User[];
  onSaveUser: (user: User, isEdit: boolean) => void;
  onDeleteUser: (username: string) => void;
  onClose: () => void;
  availableRoles: string[]; // Dynamic roles from settings
}

const UserManagementModal: React.FC<Props> = ({ users, onSaveUser, onDeleteUser, onClose, availableRoles = [] }) => {
  const [formData, setFormData] = useState<User>({ username: '', fullName: '', role: UserRole.KyThuat, password: '', avatarUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username.trim() && formData.password?.trim()) {
      onSaveUser({ ...formData, username: formData.username.trim() }, isEditing);
      // Reset Form
      setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '', avatarUrl: '' });
      setIsEditing(false);
    } else {
        alert("Vui lòng nhập tên đăng nhập và mật khẩu.");
    }
  };

  const handleEditClick = (user: User) => {
      setFormData({ ...user, password: user.password || '', avatarUrl: user.avatarUrl || '' });
      setIsEditing(true);
  };

  const handleDeleteClick = (username: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) {
          onDeleteUser(username);
          if (isEditing && formData.username === username) {
              setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '', avatarUrl: '' });
              setIsEditing(false);
          }
      }
  }

  const handleCancelEdit = () => {
      setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '', avatarUrl: '' });
      setIsEditing(false);
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
        alert('Kích thước ảnh nên nhỏ hơn 500KB.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      {/* Glassmorphism Card */}
      <div className="bg-white/85 backdrop-blur-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-3xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-white/60 shadow-2xl animate-pop">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200/60 bg-white/40 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Quản lý Tài khoản</h2>
            <p className="text-xs text-slate-500 font-medium">Thêm và phân quyền người dùng hệ thống</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/60 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form Area */}
        <div className="p-5 bg-slate-50/40 border-b border-slate-200/60 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {isEditing ? 'Chỉnh sửa thông tin' : 'Thêm tài khoản mới'}
            </h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                {/* Avatar Section */}
                <div className="sm:col-span-12 flex items-center gap-4 mb-2 p-3 bg-white/60 border border-white/50 rounded-xl shadow-sm">
                    <div className="relative w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                        {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <UserIcon className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Ảnh đại diện</label>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-blue-50/80 border border-blue-100 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-100 transition-all shadow-sm"
                            >
                                Chọn ảnh
                            </button>
                            {formData.avatarUrl && (
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, avatarUrl: ''}))}
                                    className="px-3 py-1.5 bg-red-50/80 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm"
                                >
                                    Xóa
                                </button>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Username</label>
                    <input
                        type="text"
                        placeholder="VD: nv.a"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className={`w-full px-3 py-2.5 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm outline-none transition-all ${isEditing ? 'bg-slate-100/50 text-slate-500 cursor-not-allowed' : 'bg-white/70 text-slate-800'}`}
                        required
                        readOnly={isEditing}
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Họ và tên</label>
                    <input
                        type="text"
                        placeholder="Họ tên hiển thị"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-3 py-2.5 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/70 text-slate-800 shadow-sm outline-none transition-all"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mật khẩu</label>
                    <input
                        type="text"
                        placeholder="******"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2.5 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/70 text-slate-800 shadow-sm outline-none transition-all"
                        required
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Vai trò</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                        className="w-full px-3 py-2.5 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/70 text-slate-800 shadow-sm outline-none cursor-pointer transition-all"
                    >
                        {availableRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-1 flex space-x-1">
                    <button 
                        type="submit"
                        className={`flex-1 inline-flex items-center justify-center h-[42px] border border-transparent text-sm font-bold rounded-xl text-white transition-all shadow-md active:scale-95 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
                        title={isEditing ? 'Lưu thay đổi' : 'Thêm mới'}
                    >
                        {isEditing ? <PencilIcon className="h-5 w-5"/> : <PlusIcon className="h-5 w-5"/>}
                    </button>
                    {isEditing && (
                        <button 
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 inline-flex items-center justify-center h-[42px] border border-slate-200/80 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            title="Hủy"
                        >
                            <XIcon className="h-5 w-5"/>
                        </button>
                    )}
                </div>
            </form>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/20">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-500" />
              Danh sách tài khoản <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-600">{users.length}</span>
          </h3>
          <div className="overflow-hidden shadow-sm ring-1 ring-black/5 md:rounded-xl bg-white/60 backdrop-blur-sm border border-white/40">
            <table 
                className="min-w-full divide-y divide-slate-200/60"
                style={{
                    fontFamily: 'var(--list-font, inherit)',
                    fontSize: 'var(--list-size, 1rem)'
                }}
            >
                <thead className="bg-slate-50/80 backdrop-blur-md">
                <tr>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap w-16" style={{ fontSize: 'inherit' }}>Avatar</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Username</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Họ và tên</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Mật khẩu</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Vai trò</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Thao tác</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 bg-transparent">
                {users.map((user, index) => {
                    const isRoleValid = availableRoles.includes(user.role);
                    return (
                        <tr key={index} className={`transition-colors hover:bg-blue-50/40 ${index % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/20'}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="avt" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-500">{user.username.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800" style={{ fontSize: 'inherit' }}>{user.username}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700" style={{ fontSize: 'inherit' }}>{user.fullName || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-normal text-slate-400 tracking-widest font-sans" style={{ fontSize: 'inherit' }}>******</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ fontSize: 'inherit' }}>
                            {isRoleValid ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50/80 text-blue-700 border border-blue-100/50">
                                    {user.role}
                                </span>
                            ) : (
                                <span className="text-red-500 font-bold flex items-center gap-1">
                                    {user.role} 
                                    <span className="text-[10px] bg-red-100 px-1 rounded border border-red-200">Invalid</span>
                                </span>
                            )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                                onClick={() => handleEditClick(user)}
                                className="text-slate-400 hover:text-blue-600 mr-2 p-1.5 rounded-lg hover:bg-blue-50 transition-all active:scale-90"
                                title="Sửa quyền / Đổi mật khẩu"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            {user.username.toLowerCase() !== 'admin' && (
                                <button 
                                    onClick={() => handleDeleteClick(user.username)}
                                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all active:scale-90"
                                    title="Xóa tài khoản"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 bg-white/40 border-t border-slate-200/60 backdrop-blur-md">
          <button onClick={onClose} className="bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold py-2 px-6 rounded-xl shadow-sm transition-all active:scale-95">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
