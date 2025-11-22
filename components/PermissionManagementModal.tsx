
import React, { useState } from 'react';
import { UserRole, RoleConfig, RoleSettings, PermissionField } from '../types';
import { XIcon, CheckCircleIcon } from './Icons';

interface Props {
  roleSettings: RoleSettings;
  onSave: (settings: RoleSettings) => void;
  onClose: () => void;
}

const PermissionManagementModal: React.FC<Props> = ({ roleSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<RoleSettings>(roleSettings);

  // Danh sách các loại lỗi để lựa chọn
  const defectTypes = [
    'Lỗi bộ phận sản xuất',
    'Lỗi Nhà cung cấp',
    'Lỗi vừa sản xuất vừa NCC',
    'Lỗi khác'
  ];
  
  const editableFieldOptions: { key: PermissionField; label: string }[] = [
      { key: 'general', label: 'Thông tin chung' },
      { key: 'soLuongDoi', label: 'SL Đổi' },
      { key: 'loaiLoi', label: 'Loại lỗi' },
      { key: 'nguyenNhan', label: 'Nguyên nhân' },
      { key: 'huongKhacPhuc', label: 'Hướng khắc phục' },
      { key: 'trangThai', label: 'Trạng thái' },
      { key: 'ngayHoanThanh', label: 'Ngày hoàn thành' },
  ];

  const handleCheckboxChange = (role: UserRole, field: keyof Omit<RoleConfig, 'viewableDefectTypes' | 'editableFields'>) => {
    setSettings(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: !prev[role][field]
      }
    }));
  };

  const handleDefectTypeChange = (role: UserRole, type: string) => {
    setSettings(prev => {
        const currentTypes = prev[role].viewableDefectTypes;
        let newTypes: string[];

        if (type === 'All') {
            // Nếu chọn 'All', nếu đang có thì bỏ, chưa có thì set chỉ 'All'
            newTypes = currentTypes.includes('All') ? [] : ['All'];
        } else {
            // Nếu đang chọn 'All', bỏ 'All' và thêm type mới
            if (currentTypes.includes('All')) {
                 newTypes = [type];
            } else {
                // Toggle type
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
  
  const handleEditableFieldChange = (role: UserRole, field: PermissionField) => {
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

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-[1400px] w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Phân quyền Hệ thống</h2>
             <p className="text-sm text-slate-500 mt-1">Cấu hình quyền hạn chi tiết cho từng nhóm người dùng</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-48 sticky left-0 bg-slate-100 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Vai trò</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Thêm mới</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Báo cáo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[300px]">Các trường được phép chỉnh sửa</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[250px]">Loại lỗi được xem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {Object.values(UserRole).map((role) => {
                            const isAdmin = role === UserRole.Admin;
                            const config = settings[role];
                            
                            return (
                                <tr key={role} className={`hover:bg-slate-50 transition-colors ${isAdmin ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 sticky left-0 bg-inherit z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                                        {role} {isAdmin && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Full</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={config.canCreate} 
                                            onChange={() => handleCheckboxChange(role, 'canCreate')}
                                            disabled={isAdmin}
                                            className="h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={config.canViewDashboard} 
                                            onChange={() => handleCheckboxChange(role, 'canViewDashboard')}
                                            disabled={isAdmin}
                                            className="h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="grid grid-cols-2 gap-2 gap-x-4">
                                            {editableFieldOptions.map(option => (
                                                <label key={option.key} className="inline-flex items-center cursor-pointer group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={(config.editableFields || []).includes(option.key)}
                                                        onChange={() => handleEditableFieldChange(role, option.key)}
                                                        disabled={isAdmin}
                                                        className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                                                    />
                                                    <span className="ml-2 text-xs group-hover:text-slate-900 transition-colors">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="space-y-2">
                                            <label className="inline-flex items-center mr-4 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={config.viewableDefectTypes.includes('All')}
                                                    onChange={() => handleDefectTypeChange(role, 'All')}
                                                    disabled={isAdmin}
                                                    className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                                                />
                                                <span className="ml-2 font-semibold text-slate-700 text-xs">Tất cả</span>
                                            </label>
                                            
                                            <div className={`grid grid-cols-1 gap-1 mt-1 transition-opacity ${config.viewableDefectTypes.includes('All') ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {defectTypes.map(type => (
                                                    <label key={type} className="inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            checked={config.viewableDefectTypes.includes(type)}
                                                            onChange={() => handleDefectTypeChange(role, type)}
                                                            disabled={isAdmin || config.viewableDefectTypes.includes('All')}
                                                            className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                                                        />
                                                        <span className="ml-2 text-xs">{type}</span>
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
            <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Hủy
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Lưu cấu hình
            </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagementModal;
