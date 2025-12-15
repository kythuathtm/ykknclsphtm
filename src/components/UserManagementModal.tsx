
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole } from '../types';
import { XIcon, PlusIcon, PencilIcon, TrashIcon, UserIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, LockClosedIcon, MagnifyingGlassIcon, FunnelIcon } from './Icons';

interface Props {
  users: User[];
  onSaveUser: (user: User, isEdit: boolean) => void;
  onDeleteUser: (username: string) => void;
  onClose: () => void;
  availableRoles: string[]; // Dynamic roles from settings
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
                const maxWidth = 400; // Small size for avatar
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

const UserManagementModal: React.FC<Props> = ({ users, onSaveUser, onDeleteUser, onClose, availableRoles = [] }) => {
  const [formData, setFormData] = useState<User>({ username: '', fullName: '', role: UserRole.KyThuat, password: '', avatarUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Derived filtered users
  const filteredUsers = useMemo(() => {
      return users.filter(user => {
          const matchSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchRole = roleFilter === 'All' || user.role === roleFilter;
          return matchSearch && matchRole;
      });
  }, [users, searchTerm, roleFilter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
        alert("Vui lòng nhập tên đăng nhập.");
        return;
    }

    // New user validation
    if (!isEditing && !formData.password?.trim()) {
        alert("Vui lòng nhập mật khẩu.");
        return;
    }

    let userToSave = { ...formData, username: formData.username.trim() };

    // If editing and password field is empty, preserve the old password
    if (isEditing && !formData.password?.trim()) {
        const existingUser = users.find(u => u.username === formData.username);
        if (existingUser) {
            userToSave.password = existingUser.password;
        }
    }

    onSaveUser(userToSave, isEditing);
    
    // Reset Form
    handleCancelEdit();
  };

  const handleEditClick = (user: User) => {
      // Don't populate password field for security and to allow "leave blank to keep"
      setFormData({ ...user, password: '', avatarUrl: user.avatarUrl || '' });
      setIsEditing(true);
      setShowPassword(false);
      // Focus on Fullname field since Username is locked
      setTimeout(() => {
          const fullNameInput = document.getElementById('fullNameInput');
          if (fullNameInput) fullNameInput.focus();
      }, 100);
  };

  const handleDeleteClick = (username: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) {
          onDeleteUser(username);
          if (isEditing && formData.username === username) {
              handleCancelEdit();
          }
      }
  }

  const handleCancelEdit = () => {
      setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '', avatarUrl: '' });
      setIsEditing(false);
      setShowPassword(false);
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, avatarUrl: compressedBase64 }));
    } catch (e) {
        console.error("Avatar compression error", e);
        alert("Lỗi xử lý ảnh.");
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      {/* Glassmorphism Card */}
      <div className="bg-white/90 backdrop-blur-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-5xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden ring-1 ring-white/60 shadow-2xl animate-dialog-enter">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Quản lý Tài khoản</h2>
            <p className="text-sm text-slate-500 font-medium">Thêm, sửa và phân quyền người dùng hệ thống</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/60 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Form Area (Left) */}
            <div className={`p-6 border-b md:border-b-0 md:border-r border-slate-200/60 md:w-80 lg:w-96 flex-shrink-0 transition-colors duration-300 overflow-y-auto custom-scrollbar ${isEditing ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-bold flex items-center gap-2 uppercase tracking-wide ${isEditing ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {isEditing ? <PencilIcon className="w-4 h-4"/> : <PlusIcon className="w-4 h-4"/>}
                        {isEditing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                    </h3>
                    {isEditing && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-bold">
                            Đang sửa
                        </span>
                    )}
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4 mb-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
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
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Avatar</label>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                                >
                                    Upload
                                </button>
                                {formData.avatarUrl && (
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({...prev, avatarUrl: ''}))}
                                        className="px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm active:scale-95"
                                    >
                                        <XIcon className="w-4 h-4" />
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

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tên đăng nhập {isEditing && <LockClosedIcon className="w-3 h-3 inline text-slate-400 mb-0.5"/>}</label>
                        <input
                            ref={usernameInputRef}
                            type="text"
                            placeholder="VD: nguyen.van.a"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className={`w-full px-3 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 outline-none transition-all shadow-sm ${
                                isEditing 
                                ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' 
                                : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                            required
                            readOnly={isEditing}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Họ và tên</label>
                        <input
                            id="fullNameInput"
                            type="text"
                            placeholder="Tên hiển thị..."
                            value={formData.fullName || ''}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 shadow-sm outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={isEditing ? "(Để trống để giữ nguyên)" : "******"}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className={`w-full pl-3 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-blue-500 bg-white text-slate-800 shadow-sm outline-none transition-all ${isEditing ? 'focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400' : 'focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                required={!isEditing}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                        {isEditing && <p className="text-[10px] text-slate-400 mt-1 italic">* Nhập mật khẩu mới nếu muốn đổi, không thì để trống.</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Vai trò (Role)</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 shadow-sm outline-none cursor-pointer transition-all appearance-none"
                        >
                            {availableRoles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                        {isEditing ? (
                            <>
                                <button 
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex-1 py-2.5 border border-slate-300 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircleIcon className="w-4 h-4"/> Lưu thay đổi
                                </button>
                            </>
                        ) : (
                            <button 
                                type="submit"
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4"/> Thêm mới
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List Area (Right) */}
            <div className="flex-1 overflow-y-auto p-0 bg-slate-50/20 custom-scrollbar flex flex-col">
                {/* Search & Filter Toolbar */}
                <div className="p-4 bg-white/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            Danh sách ({users.length})
                        </h3>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-48 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                                />
                            </div>

                            {/* Role Filter */}
                            <div className="relative w-32 sm:w-40 group">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <FunnelIcon className="h-3 w-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all shadow-inner font-medium"
                                >
                                    <option value="All">Tất cả vai trò</option>
                                    {availableRoles.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-1">
                    <div className="overflow-hidden shadow-sm ring-1 ring-black/5 rounded-xl bg-white border border-slate-200">
                        <table 
                            className="min-w-full divide-y divide-slate-100"
                            style={{
                                fontFamily: 'var(--list-font, inherit)',
                                fontSize: 'var(--list-size, 1rem)'
                            }}
                        >
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider w-12">Avt</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider">User</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider hidden sm:table-cell">Họ tên</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-wider">Role</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Xử lý</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user, index) => {
                                    const isRoleValid = availableRoles.includes(user.role);
                                    const isBeingEdited = isEditing && formData.username === user.username;
                                    
                                    return (
                                        <tr key={index} className={`transition-colors ${isBeingEdited ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt="avt" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-500">{user.username.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-800">{user.username}</div>
                                                <div className="text-xs text-slate-500 sm:hidden">{user.fullName}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                                                <div className="text-sm font-medium text-slate-600">{user.fullName || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {isRoleValid ? (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${isBeingEdited ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                        {user.role}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                        {user.role} (Invalid)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-1">
                                                    <button 
                                                        onClick={() => handleEditClick(user)}
                                                        className={`p-1.5 rounded-lg transition-all active:scale-90 border ${isBeingEdited ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-300'}`}
                                                        title="Chỉnh sửa thông tin"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    {user.username.toLowerCase() !== 'admin' && (
                                                        <button 
                                                            onClick={() => handleDeleteClick(user.username)}
                                                            className="p-1.5 bg-white text-slate-400 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all active:scale-90"
                                                            title="Xóa tài khoản"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <MagnifyingGlassIcon className="h-8 w-8 mb-2 opacity-30" />
                                            <p className="text-sm font-bold">Không tìm thấy người dùng</p>
                                            <p className="text-xs">Thử thay đổi bộ lọc tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
