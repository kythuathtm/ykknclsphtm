import React, { useState } from 'react';
import { UserRole, RoleConfig, RoleSettings, PermissionField } from '../types';
import { XIcon, CheckCircleIcon, PlusIcon, TrashIcon, PencilIcon } from './Icons';

interface Props {
  roleSettings: RoleSettings;
  onSave: (settings: RoleSettings) => void;
  onRenameRole: (oldName: string, newName: string) => Promise<void>;
  onClose: () => void;
}

const PermissionManagementModal: React.FC<Props> = ({ roleSettings, onSave, onRenameRole, onClose }) => {
  const [settings, setSettings] = useState<RoleSettings>(roleSettings);
  const [newRoleName, setNewRoleName] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);

  // State cho việc đổi tên
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const defectTypes = [
    'Lỗi Sản xuất',
    'Lỗi Nhà cung cấp',
    'Lỗi Hỗn hợp',
    'Lỗi Khác'
  ];
  
  const editableFieldOptions: { key: PermissionField; label: string }[] = [
      { key: 'general', label: 'Thông tin chung' },
      { key: 'soLuongDoi', label: 'SL Đổi' },
      { key: 'loaiLoi', label: 'Nguồn gốc lỗi' },
      { key: 'nguyenNhan', label: 'Nguyên nhân' },
      { key: 'huongKhacPhuc', label: 'Hướng khắc phục' },
      { key: 'trangThai', label: 'Trạng thái xử lý' },
      { key: 'ngayHoanThanh', label: 'Ngày hoàn thành' },
      { key: 'ngayDoiHang', label: 'Ngày đổi hàng' },
  ];

  const handleCheckboxChange = (role: string, field: keyof Omit<RoleConfig, 'viewableDefectTypes' | 'editableFields'>) => {
    setSettings(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: !prev[role][field]
      }
    }));
  };

  const handleDefectTypeChange = (role: string, type: string) => {
    setSettings(prev => {
        const currentTypes = prev[role].viewableDefectTypes;
        let newTypes: string[];

        if (type === 'All') {
            newTypes = currentTypes.includes('All') ? [] : ['All'];
        } else {
            if (currentTypes.includes('All')) {
                 newTypes = [type];
            } else {
                if (currentTypes.includes(type)) {
                    newTypes = currentTypes.filter(t => t !== type);
                } else {
                    newTypes = [...currentTypes, type];
                }
            }
        }
        
        return {
            ...prev,
            [role]: {
                ...prev[role],
                viewableDefectTypes: newTypes
            }
        };
    });
  };
  
  const handleEditableFieldChange = (role: string, field: PermissionField) => {
      setSettings(prev => {
          const currentFields = prev[role].editableFields || [];
          let newFields: PermissionField[];
          
          if (currentFields.includes(field)) {
              newFields = currentFields.filter(f => f !== field);
          } else {
              newFields = [...currentFields, field];
          }
          
          return {
              ...prev,
              [role]: {
                  ...prev[role],
                  editableFields: newFields
              }
          }
      });
  }

  const handleAddRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRoleName.trim()) return;
      if (settings[newRoleName.trim()]) {
          alert("Tên vai trò này đã tồn tại.");
          return;
      }

      setSettings(prev => ({
          ...prev,
          [newRoleName.trim()]: {
              canCreate: false,
              canViewDashboard: false,
              canDelete: false,
              viewableDefectTypes: [],
              editableFields: []
          }
      }));
      setNewRoleName('');
      setIsAddingRole(false);
  }

  const handleDeleteRole = (roleToDelete: string) => {
      if (Object.values(UserRole).includes(roleToDelete as any)) {
          alert("Không thể xóa vai trò mặc định của hệ thống.");
          return;
      }
      if (window.confirm(`Bạn có chắc muốn xóa vai trò "${roleToDelete}"? Cấu hình phân quyền cho vai trò này sẽ bị mất.`)) {
          setSettings(prev => {
              const newSettings = { ...prev };
              delete newSettings[roleToDelete];
              return newSettings;
          });
      }
  }

  // --- Logic Đổi tên vai trò ---
  const handleStartRename = (role: string) => {
      setEditingRole(role);
      setRenameValue(role);
  };

  const handleCancelRename = () => {
      setEditingRole(null);
      setRenameValue('');
  };

  const handleSaveRename = async () => {
      if (!editingRole) return;
      const newName = renameValue.trim();
      
      if (!newName) {
          alert("Tên vai trò không được để trống.");
          return;
      }
      if (newName !== editingRole && settings[newName]) {
          alert("Tên vai trò đã tồn tại.");
          return;
      }

      if (newName === editingRole) {
          handleCancelRename();
          return;
      }

      // 1. Calculate new settings state (remove old key, add new key with same config)
      const newSettings = { ...settings };
      const config = newSettings[editingRole];
      delete newSettings[editingRole];
      newSettings[newName] = config;

      setSettings(newSettings);

      // 2. Call parent handler to sync users immediately (update User documents)
      await onRenameRole(editingRole, newName);
      
      // 3. IMPORTANT: Save the new settings structure to DB immediately
      // This ensures that if the user refreshes, the new role key exists in settings to match the users' new role
      onSave(newSettings);

      handleCancelRename();
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-[1400px] rounded-none sm:rounded-xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Quản lý Vai trò & Phân quyền</h2>
             <p className="text-sm text-slate-500 mt-1">Thêm, sửa, xóa vai trò và cấu hình quyền hạn chi tiết</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all active:scale-95">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-4">
             {isAddingRole ? (
                 <form onSubmit={handleAddRole} className="flex items-center gap-2 animate-fade-in">
                      <input 
                        type="text" 
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Nhập tên vai trò..." 
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm"
                        autoFocus
                      />
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 active:scale-95"
                      >
                          Lưu
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingRole(false)}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 active:scale-95"
                      >
                          Hủy
                      </button>
                 </form>
             ) : (
                <button 
                    onClick={() => setIsAddingRole(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Thêm vai trò mới
                </button>
             )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white overflow-x-auto">
                <table 
                    className="min-w-full divide-y divide-slate-200"
                    style={{
                        fontFamily: 'var(--list-font, inherit)',
                        fontSize: 'var(--list-size, 1rem)'
                    }}
                >
                    <thead className="bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider w-64 sticky left-0 bg-slate-100 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]" style={{ fontSize: 'inherit' }}>Vai trò</th>
                            <th scope="col" className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider w-20" style={{ fontSize: 'inherit' }}>Thêm mới</th>
                            <th scope="col" className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider w-20" style={{ fontSize: 'inherit' }}>Xóa</th>
                            <th scope="col" className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider w-20" style={{ fontSize: 'inherit' }}>Báo cáo</th>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider min-w-[300px]" style={{ fontSize: 'inherit' }}>Các trường được phép chỉnh sửa</th>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider min-w-[250px]" style={{ fontSize: 'inherit' }}>Nguồn gốc lỗi được xem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {Object.keys(settings).map((role) => {
                            const isAdmin = role === UserRole.Admin;
                            const isSystemRole = Object.values(UserRole).includes(role as any);
                            const config = settings[role];
                            const isEditing = editingRole === role;
                            
                            return (
                                <tr key={role} className={`hover:bg-slate-50 transition-colors ${isAdmin ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 sticky left-0 bg-inherit z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] group" style={{ fontSize: 'inherit' }}>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="text" 
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    className="w-full px-2 py-1 border border-blue-400 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveRename} className="p-1 text-green-600 hover:bg-green-100 rounded"><CheckCircleIcon className="w-4 h-4"/></button>
                                                <button onClick={handleCancelRename} className="p-1 text-red-500 hover:bg-red-100 rounded"><XIcon className="w-4 h-4"/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span>{role} {isAdmin && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Full</span>}</span>
                                                {!isSystemRole && (
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleStartRename(role)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Đổi tên vai trò"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteRole(role)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Xóa vai trò này"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={config.canCreate} 
                                            onChange={() => handleCheckboxChange(role, 'canCreate')}
                                            disabled={isAdmin}
                                            className="h-5 w-5 accent-[#003DA5] cursor-pointer rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={config.canDelete || false} 
                                            onChange={() => handleCheckboxChange(role, 'canDelete')}
                                            disabled={isAdmin}
                                            className="h-5 w-5 accent-red-600 cursor-pointer rounded border-slate-300 focus:ring-red-500 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={config.canViewDashboard} 
                                            onChange={() => handleCheckboxChange(role, 'canViewDashboard')}
                                            disabled={isAdmin}
                                            className="h-5 w-5 accent-[#003DA5] cursor-pointer rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-slate-600" style={{ fontSize: 'inherit' }}>
                                        <div className="grid grid-cols-2 gap-2 gap-x-4">
                                            {editableFieldOptions.map(option => (
                                                <label key={option.key} className="inline-flex items-center cursor-pointer group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={(config.editableFields || []).includes(option.key)}
                                                        onChange={() => handleEditableFieldChange(role, option.key)}
                                                        disabled={isAdmin}
                                                        className="rounded border-slate-300 accent-[#003DA5] cursor-pointer shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                                                    />
                                                    <span className="ml-2 group-hover:text-slate-900 transition-colors" style={{ fontSize: '0.85em' }}>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600" style={{ fontSize: 'inherit' }}>
                                        <div className="space-y-2">
                                            <label className="inline-flex items-center mr-4 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={config.viewableDefectTypes.includes('All')}
                                                    onChange={() => handleDefectTypeChange(role, 'All')}
                                                    disabled={isAdmin}
                                                    className="rounded border-slate-300 accent-[#003DA5] cursor-pointer shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                                                />
                                                <span className="ml-2 font-semibold text-slate-700" style={{ fontSize: '0.85em' }}>Tất cả</span>
                                            </label>
                                            
                                            <div className={`grid grid-cols-1 gap-1 mt-1 transition-opacity ${config.viewableDefectTypes.includes('All') ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {defectTypes.map(type => (
                                                    <label key={type} className="inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            checked={config.viewableDefectTypes.includes(type)}
                                                            onChange={() => handleDefectTypeChange(role, type)}
                                                            disabled={isAdmin || config.viewableDefectTypes.includes('All')}
                                                            className="rounded border-slate-300 accent-[#003DA5] cursor-pointer shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                                                        />
                                                        <span className="ml-2" style={{ fontSize: '0.85em' }}>{type}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="flex justify-end items-center p-5 bg-white border-t border-slate-200 gap-3">
            <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                Hủy
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 flex items-center active:scale-95 active:translate-y-0">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Lưu cấu hình
            </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagementModal;