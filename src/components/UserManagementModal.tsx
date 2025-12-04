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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-3xl rounded-none sm:rounded-lg flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800">Quản lý Tài khoản</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-2">{isEditing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Avatar Section */}
                <div className="sm:col-span-12 flex items-center gap-4 mb-2 p-3 bg-white border border-slate-200 rounded-lg">
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
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ảnh đại diện</label>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs font-bold text-blue-600 hover:bg-blue-100 transition-all"
                            >
                                Chọn ảnh
                            </button>
                            {formData.avatarUrl && (
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, avatarUrl: ''}))}
                                    className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
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
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tên đăng nhập</label>
                    <input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className={`w-full px-3 py-2 border border-slate-300 rounded-md text-base font-normal focus:ring-blue-500 focus:border-blue-500 shadow-sm ${isEditing ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'}`}
                        required
                        readOnly={isEditing}
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Họ và tên</label>
                    <input
                        type="text"
                        placeholder="Họ tên hiển thị"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-base font-normal focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-sm"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Mật khẩu</label>
                    <input
                        type="text"
                        placeholder="******"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-base font-normal focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-sm"
                        required
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Vai trò</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-base font-normal focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-sm"
                    >
                        {availableRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-1 flex space-x-1">
                    <button 
                        type="submit"
                        className={`flex-1 inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-all active:scale-95 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        title={isEditing ? 'Lưu' : 'Thêm'}
                    >
                        {isEditing ? <PencilIcon className="h-4 w-4"/> : <PlusIcon className="h-4 w-4"/>}
                    </button>
                    {isEditing && (
                        <button 
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 inline-flex items-center justify-center px-2 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-all active:scale-95"
                            title="Hủy"
                        >
                            <XIcon className="h-4 w-4"/>
                        </button>
                    )}
                </div>
            </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Danh sách tài khoản ({users.length})</h3>
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table 
                className="min-w-full divide-y divide-slate-200"
                style={{
                    fontFamily: 'var(--list-font, inherit)',
                    fontSize: 'var(--list-size, 1rem)'
                }}
            >
                <thead className="bg-slate-100">
                <tr>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap w-16" style={{ fontSize: 'inherit' }}>Avatar</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Username</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Họ và tên</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Mật khẩu</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Vai trò</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ fontSize: 'inherit' }}>Thao tác</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user, index) => {
                    const isRoleValid = availableRoles.includes(user.role);
                    return (
                        <tr key={index} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="avt" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-500">{user.username.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-normal text-slate-900" style={{ fontSize: 'inherit' }}>{user.username}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-normal text-slate-700" style={{ fontSize: 'inherit' }}>{user.fullName || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-normal text-slate-500" style={{ fontSize: 'inherit' }}>******</td>
                        <td className="px-4 py-3 whitespace-nowrap font-normal text-slate-500" style={{ fontSize: 'inherit' }}>
                            {isRoleValid ? (
                                user.role
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
                                className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded hover:bg-blue-100 transition-all active:scale-90"
                                title="Sửa quyền / Đổi mật khẩu"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            {user.username.toLowerCase() !== 'admin' && (
                                <button 
                                    onClick={() => handleDeleteClick(user.username)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 transition-all active:scale-90"
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
        <div className="flex justify-end p-4 bg-white border-t border-slate-200">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all active:scale-95">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;