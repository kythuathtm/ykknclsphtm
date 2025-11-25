
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { XIcon, PlusIcon, PencilIcon, TrashIcon } from './Icons';

interface Props {
  users: User[];
  onSaveUser: (user: User, isEdit: boolean) => void;
  onDeleteUser: (username: string) => void;
  onClose: () => void;
}

const UserManagementModal: React.FC<Props> = ({ users, onSaveUser, onDeleteUser, onClose }) => {
  const [formData, setFormData] = useState<User>({ username: '', fullName: '', role: UserRole.KyThuat, password: '' });
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username.trim() && formData.password?.trim()) {
      onSaveUser({ ...formData, username: formData.username.trim() }, isEditing);
      // Reset Form
      setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '' });
      setIsEditing(false);
    } else {
        alert("Vui lòng nhập tên đăng nhập và mật khẩu.");
    }
  };

  const handleEditClick = (user: User) => {
      setFormData({ ...user, password: user.password || '' });
      setIsEditing(true);
  };

  const handleDeleteClick = (username: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) {
          onDeleteUser(username);
          if (isEditing && formData.username === username) {
              setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '' });
              setIsEditing(false);
          }
      }
  }

  const handleCancelEdit = () => {
      setFormData({ username: '', fullName: '', role: UserRole.KyThuat, password: '' });
      setIsEditing(false);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800">Quản lý Tài khoản</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-2">{isEditing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tên đăng nhập</label>
                    <input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 ${isEditing ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'}`}
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Mật khẩu</label>
                    <input
                        type="text"
                        placeholder="******"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                        required
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Vai trò</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                    >
                        {Object.values(UserRole).map((role) => (
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

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Danh sách tài khoản ({users.length})</h3>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Họ và tên</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mật khẩu</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vai trò</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user, index) => (
                    <tr key={index} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900">{user.username}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{user.fullName || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">******</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
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
                ))}
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
