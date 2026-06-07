/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppUser, UserPermissions } from '../types';
import { 
  UserPlus2, 
  Trash2, 
  Key, 
  Shield, 
  UserCheck, 
  AlertCircle, 
  Edit3, 
  CheckSquare, 
  XSquare, 
  RefreshCw,
  Lock
} from 'lucide-react';

interface UserManagerProps {
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (user: AppUser) => void;
}

export default function UserManager({ users, currentUser, onAddUser, onDeleteUser, onUpdateUser }: UserManagerProps) {
  // حالات غرس مستخدم جديد
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'viewer'>('viewer');
  
  // صلاحيات دقيقة للمستخدم الجديد
  const [permissions, setPermissions] = useState<UserPermissions>({
    canManageCycles: false,
    canManageExpenses: false,
    canManageMortalities: true,
    canManageSales: false,
    canManageUsers: false,
  });

  // حالة التعديل لمستخدم قائم
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'viewer'>('viewer');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    canManageCycles: false,
    canManageExpenses: false,
    canManageMortalities: false,
    canManageSales: false,
    canManageUsers: false,
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // تغيير الصلاحيات الافتراضية تلقائياً عند تغيير نوع الحساب لتسهيل العمل
  useEffect(() => {
    if (role === 'admin') {
      setPermissions({
        canManageCycles: true,
        canManageExpenses: true,
        canManageMortalities: true,
        canManageSales: true,
        canManageUsers: true,
      });
    } else if (role === 'manager') {
      setPermissions({
        canManageCycles: true,
        canManageExpenses: true,
        canManageMortalities: true,
        canManageSales: true,
        canManageUsers: false,
      });
    } else {
      setPermissions({
        canManageCycles: false,
        canManageExpenses: false,
        canManageMortalities: true,
        canManageSales: false,
        canManageUsers: false,
      });
    }
  }, [role]);

  // تحديث الصلاحيات التلقائية للمستخدم الجاري تعديله عند تغيير مستواه
  useEffect(() => {
    if (!editingUser) return;
    if (editRole === 'admin') {
      setEditPermissions({
        canManageCycles: true,
        canManageExpenses: true,
        canManageMortalities: true,
        canManageSales: true,
        canManageUsers: true,
      });
    } else if (editRole === 'manager') {
      setEditPermissions({
        canManageCycles: true,
        canManageExpenses: true,
        canManageMortalities: true,
        canManageSales: true,
        canManageUsers: false,
      });
    } else {
      setEditPermissions({
        canManageCycles: false,
        canManageExpenses: false,
        canManageMortalities: true,
        canManageSales: false,
        canManageUsers: false,
      });
    }
  }, [editRole]);

  // تقديم طلب الإضافة
  const handleAddNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName || !username || !password) {
      setError('الرجاء تعبئة كافة حقول الملف الشخصي للمستخدم الجديد');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase().trim())) {
      setError('اسم المستخدم هذا محجوز لزميل آخر بالفعل، اختر اسماً فريداً');
      return;
    }

    onAddUser({
      fullName: fullName.trim(),
      username: username.toLowerCase().trim(),
      password: password,
      role,
      permissions
    });

    setSuccessMsg('تم إضافة الموظف الجديد بنجاح ومنحه الصلاحيات المحددة.');
    
    // تفريغ الحقول ومسح المدخلات
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('viewer');
  };

  // تفعيل وضعية تعديل موظف قائم
  const startEditing = (user: AppUser) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setEditPermissions(user.permissions || {
      canManageCycles: user.role === 'admin' || user.role === 'manager',
      canManageExpenses: user.role === 'admin' || user.role === 'manager',
      canManageMortalities: true,
      canManageSales: user.role === 'admin' || user.role === 'manager',
      canManageUsers: user.role === 'admin',
    });
    setError('');
    setSuccessMsg('');
  };

  // تقديم طلب الحفظ والتعديل
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editFullName || !editUsername || !editPassword) {
      setError('الرجاء تعبئة كافة البيانات الأساسية للموظف للتعديل');
      return;
    }

    // التحقق من تكرار اسم المستخدم مع مستخدم آخر
    if (users.some(u => u.id !== editingUser?.id && u.username.toLowerCase() === editUsername.toLowerCase().trim())) {
      setError('اسم المستخدم هذا محجوز لموظف آخر، يرجى كتابة اسم مستخدم فريد');
      return;
    }

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        fullName: editFullName.trim(),
        username: editUsername.toLowerCase().trim(),
        password: editPassword,
        role: editRole,
        permissions: editPermissions
      });

      setSuccessMsg(`تم تحديث بيانات حساب الموظف "${editFullName}" وصلاحياته بنجاح.`);
      setEditingUser(null);
    }
  };

  const getRoleLabel = (r: 'admin' | 'manager' | 'viewer') => {
    switch (r) {
      case 'admin':
        return { text: 'مدير عام', style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
      case 'manager':
        return { text: 'مشرف فني', style: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
      case 'viewer':
        return { text: 'مراقب عام', style: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    }
  };

  // اختصار لتحديث الصلاحيات المفردة للمستخدم الجديد
  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // اختصار لتحديث الصلاحيات المفردة للمستخدم المُعدل
  const toggleEditPermission = (key: keyof UserPermissions) => {
    setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="user-manager-panel">
      
      {/* نجاح الإدخال أو التنبيهات العامة */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
          <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الجانبي: استمارة الإضافة أو التعديل */}
        <div className="space-y-6">
          
          {editingUser ? (
            /* نموذج تعديل المستخدم القائم */
            <div className="glass-card rounded-2xl p-5 text-white border border-amber-500/30 shadow-xl">
              <h2 className="text-sm font-bold text-amber-300 flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <span className="flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5" />
                  <span>تعديل حساب موظف قائم</span>
                </span>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded cursor-pointer text-white"
                >
                  إلغاء التعديل
                </button>
              </h2>

              {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-305 mb-1">الاسم الكامل للموظف</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-305 mb-1">اسم المستخدم للدخول (إنجليزي)</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-305 mb-1">تعديل كلمة المرور</label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-305 mb-1.5">مستوى الصلاحية المبدئي</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 bg-slate-900 cursor-pointer"
                  >
                    <option value="viewer">مراقب عام (تخصيص حر)</option>
                    <option value="manager">مشرف فني (تخصيص حر)</option>
                    <option value="admin">مدير عام كامل الصلاحيات</option>
                  </select>
                </div>

                {/* مربعات تحديد الصلاحيات الفرعية أثناء التعديل */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2.5">
                  <p className="text-[11px] font-bold text-amber-400 mb-1 leading-relaxed">تخصيص نوافذ الوصول لهذا الحساب:</p>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={editPermissions.canManageCycles}
                      onChange={() => toggleEditPermission('canManageCycles')}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>لوحة الأفواج والدورات المحاسبية</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={editPermissions.canManageExpenses}
                      onChange={() => toggleEditPermission('canManageExpenses')}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>إدخال فواتير المصاريف والنفقات</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={editPermissions.canManageMortalities}
                      onChange={() => toggleEditPermission('canManageMortalities')}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>رصد وفيات الدواجن الوفيات (النفوق)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={editPermissions.canManageSales}
                      onChange={() => toggleEditPermission('canManageSales')}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>تسويق وعقود مبيعات اللحم</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={editPermissions.canManageUsers}
                      onChange={() => toggleEditPermission('canManageUsers')}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>صلاحيات الموظفين وإضافة الحسابات</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-450 border-0 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>حفظ وإقرار التعديلات للموظف</span>
                </button>
              </form>
            </div>
          ) : (
            /* نموذج غرس مستخدم جديد */
            <div className="glass-card rounded-2xl p-5 text-white border border-white/10 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3" id="add-user-title">
                <UserPlus2 className="w-4.5 h-4.5 text-emerald-450" />
                <span>إضافة موظف وتحديد صلاحياته</span>
              </h2>

              {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddNewUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-350 mb-1">الاسم الكامل للزميل / الموظف</label>
                  <input
                    id="user-add-fullname"
                    type="text"
                    required
                    placeholder="مثال: المهندس وائل القاط"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3 py-2.5 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-350 mb-1">اسم الدخول الفريد (بالإنجليزي)</label>
                  <input
                    id="user-add-username"
                    type="text"
                    required
                    placeholder="مثال: salem99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3 py-2.5 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-350 mb-1">تعيين كلمة مرور أولية</label>
                  <input
                    id="user-add-password"
                    type="text"
                    required
                    placeholder="رقم أو كلمة سر"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3 py-2.5 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-350 mb-1.5">مستوى الصلاحية الافتراضية</label>
                  <select
                    id="user-add-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3 py-2.5 transition-colors bg-slate-900 cursor-pointer"
                  >
                    <option value="viewer">مراقب عام (صلاحية تصفح وقراءة فقط)</option>
                    <option value="manager">مشرف فني (إدخال كامل و إدارة الأفواج)</option>
                    <option value="admin">مدير عام كامل الصلاحيات لجميع الأقسام</option>
                  </select>
                </div>

                {/* جزء تحديد الصلاحيات حسب رغبة المدير */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2.5">
                  <p className="text-[11px] font-bold text-emerald-300 mb-1 leading-relaxed">تخصيص نوافذ الوصول للموظف الجديد:</p>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={permissions.canManageCycles}
                      onChange={() => togglePermission('canManageCycles')}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>لوحة الأفواج والدورات المحاسبية</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={permissions.canManageExpenses}
                      onChange={() => togglePermission('canManageExpenses')}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>إدخال فواتير المصاريف والنفقات</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={permissions.canManageMortalities}
                      onChange={() => togglePermission('canManageMortalities')}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>رصد وفيات الدواجن الوفيات (النفوق)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={permissions.canManageSales}
                      onChange={() => togglePermission('canManageSales')}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>تسويق وعقود مبيعات اللحم</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
                    <input 
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={() => togglePermission('canManageUsers')}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>صلاحيات الموظفين وإضافة الحسابات</span>
                  </label>
                </div>

                <button
                  id="btn-submit-new-user"
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 border-0 text-emerald-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2 shadow-lg shadow-emerald-500/10"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تسجيل الموظف ومنح الصلاحيات</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* الكشف العام لمستخدمي النظام وصلاحياتهم */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl">
          <div>
            <div className="border-b border-white/10 pb-3 mb-5 text-right flex items-center justify-between">
              <div>
                <h2 className="text-md font-bold text-white flex items-center gap-2 justify-start">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span>فريق العمل المعتمدين وصلاحياتهم الدقيقة</span>
                </h2>
                <p className="text-[11px] text-white/60 mt-1">توضح القائمة الموظفين، كلمات مرورهم ونطاق وصولهم المحدد داخل نظام المدجنة.</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {users.map(user => {
                const label = getRoleLabel(user.role);
                const isSelf = user.id === currentUser.id;
                
                // جلب الصلاحيات التفصيلية
                const p = user.permissions || {
                  canManageCycles: user.role === 'admin' || user.role === 'manager',
                  canManageExpenses: user.role === 'admin' || user.role === 'manager',
                  canManageMortalities: true,
                  canManageSales: user.role === 'admin' || user.role === 'manager',
                  canManageUsers: user.role === 'admin',
                };

                return (
                  <div 
                    key={user.id}
                    className="p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-all text-right flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${user.role === 'admin' ? 'bg-emerald-400' : user.role === 'manager' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-500/20">أنت حالياً</span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 mt-1">
                          <span className="font-mono">اسم المستخدم: {user.username}</span>
                          <span>•</span>
                          <span className="font-mono flex items-center gap-1">
                            <Lock className="w-3 h-3 text-white/40" />
                            كلمة المرور: {user.password}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${label.style}`}>
                          {label.text}
                        </span>

                        {/* زر التعديل وتغيير كلمات السر والصلاحيات */}
                        <button
                          onClick={() => startEditing(user)}
                          className="p-2 text-white/70 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors border-0 cursor-pointer"
                          title="تعديل حساب هذا الموظف وصلاحياته"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* لا يمكن إطلاقاً للمستخدم حذف نفسه */}
                        <button
                          disabled={isSelf}
                          onClick={() => onDeleteUser(user.id)}
                          className={`p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors border-0 ${
                            isSelf ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={isSelf ? 'لا يمكنك حذف حسابك الشخصي النشط' : 'حذف حساب هذا الموظف'}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* بار عرض الصلاحيات كشارات ملونة لتسهيل مراجعتها */}
                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${p.canManageCycles ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/5 text-white/30 border-white/5'}`}>
                        إدارة الأفواج: {p.canManageCycles ? '✔️' : '❌'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${p.canManageExpenses ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/5 text-white/30 border-white/5'}`}>
                        إدخال فواتير ومصاريف: {p.canManageExpenses ? '✔️' : '❌'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${p.canManageMortalities ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/5 text-white/30 border-white/5'}`}>
                        رصد النفوق: {p.canManageMortalities ? '✔️' : '❌'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${p.canManageSales ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/5 text-white/30 border-white/5'}`}>
                        تفويت مبيع دجاج: {p.canManageSales ? '✔️' : '❌'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${p.canManageUsers ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/5 text-white/30 border-white/5'}`}>
                        إدارة الموظفين: {p.canManageUsers ? '✔️' : '❌'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40 leading-relaxed text-right flex gap-1.5 items-start">
            <Key className="w-3.5 h-3.5 shrink-0 text-emerald-450 mt-0.5" />
            <p>
              * حماية وثوقية المداجن: يضمن لك محرك الصلاحيات تخصيص أفرع الوصول لأي حساب بنقرات بسيطة. اضغط على أيقونة التعديل الصفراء لتغيير كلمة مرور زميلك أو تدوير صلاحياته بحرية كاملة.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
