/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppUser } from '../types';
import { KeyRound, User as UserIcon, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface LoginProps {
  users: AppUser[];
  onLogin: (user: AppUser, rememberMe: boolean) => void;
}

export default function Login({ users, onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    const foundUser = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      setError('');
      onLogin(foundUser, rememberMe);
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة، يرجى المحاولة مجدداً');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-980 flex flex-col justify-center items-center p-4">
      
      {/* حاوية اللوغو والترحيب */}
      <div className="mb-6 text-center animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-3 border border-emerald-450">
          <TrendingUp className="w-8 h-8 text-emerald-950" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">نظــام الـدواجن الرقميَّـة</h1>
        <p className="text-xs text-emerald-350 font-medium mt-1">منصة الإدارة والمحاسبة الذكية للمزارع والمداجن</p>
      </div>

      {/* بطاقة تسجيل الدخول الزجاجية */}
      <div className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 text-right text-white">
        <h2 className="text-base sm:text-lg font-bold text-white border-b border-white/10 pb-3 mb-5 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-400" />
          <span>بوابة الدخول الموحدة للموظفين</span>
        </h2>

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">اسم المستخدم</label>
            <div className="relative">
              <span className="absolute right-3 top-3 text-white/40">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                required
                placeholder="أدخل اسم غرفتك أو حسابك"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl pr-10 pl-3 py-3 transition-colors text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">كلمة المرور المعتمدة</label>
            <div className="relative">
              <span className="absolute right-3 top-3 text-white/40">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl pr-10 pl-3 py-3 transition-colors text-right font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 py-1 select-none">
            <input
              id="chk-login-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 bg-white/5 border border-white/20 rounded cursor-pointer"
            />
            <label htmlFor="chk-login-remember" className="text-[11px] text-white/70 cursor-pointer font-medium hover:text-white transition-colors">
              حفظ معلومات الدخول تلقائياً (تجنب إعادة الطلب عند تحديث الصفحة)
            </label>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-emerald-950 font-bold text-xs rounded-xl border-0 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/20"
          >
            <span>مصادقة الدخول والبدء كفريق</span>
          </button>
        </form>

      </div>

      <p className="text-[10px] text-white/30 text-center mt-6">
        يتم مطابقة البيانات عبر مخدم قاعدة بيانات MySQL الآمنة.
      </p>
    </div>
  );
}
