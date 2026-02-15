
import React, { useState } from 'react';
import { Search, UserPlus, Mail, Trash2, Edit2 } from 'lucide-react';
import { User } from '../types';

interface UsersProps {
  liveUsers: User[];
  adminCount: number;
}

export default function UsersPage({ liveUsers, adminCount }: UsersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = liveUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">User Directory</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all registered students.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
          <UserPlus size={18} />
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm transition-colors">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Live Database Users</p>
            <p className="text-3xl font-black dark:text-white">{liveUsers.length}</p>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm transition-colors">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total RSVPs</p>
            <p className="text-3xl font-black dark:text-white">{liveUsers.reduce((s, u) => s + (u.totalRSVPs ?? 0), 0)}</p>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm transition-colors">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Admin Roles</p>
            <p className="text-3xl font-black dark:text-white">{adminCount}</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-700 flex items-center gap-4">
          <div className="relative flex-1">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by name or email..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white border-none rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
             />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50 dark:bg-slate-700/50 transition-colors">
                <tr className="border-b dark:border-slate-700">
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Student Info</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">RSVPs</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Ratings</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Last Active</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y dark:divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No users found in database.</td>
                  </tr>
                ) : filteredUsers.map(user => (
                   <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 transition-colors">
                               {user.name.charAt(0)}
                            </div>
                            <div>
                               <p className="text-sm font-bold dark:text-slate-200">{user.name}</p>
                               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                  <Mail size={10} /> {user.email}
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-sm font-bold dark:text-slate-200">{user.totalRSVPs}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-sm font-bold dark:text-slate-200">{user.totalRatings}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(user.lastActive).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-all"><Edit2 size={16} /></button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
