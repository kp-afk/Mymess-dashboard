import React, { useState } from 'react';
import { Search, Mail, Trash2, Edit2, Users } from 'lucide-react';
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

  const totalRSVPs = liveUsers.reduce((s, u) => s + (u.totalRSVPs ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            User Directory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Registered students from Firebase RTDB
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Registered Users', value: liveUsers.length },
          { label: 'Total RSVPs',      value: totalRSVPs       },
          { label: 'Admin Roles',      value: adminCount       },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 transition-colors">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden transition-colors">

        {/* Search bar */}
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                {['Student', 'RSVPs', 'Ratings', 'Last Active', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Users size={28} className="mx-auto mb-2 text-zinc-200 dark:text-zinc-700" />
                    <p className="text-sm text-zinc-400">No users found.</p>
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  {/* Student info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{user.name}</p>
                        <p className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                          <Mail size={10} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* RSVPs */}
                  <td className="px-5 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {user.totalRSVPs}
                  </td>

                  {/* Ratings */}
                  <td className="px-5 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {user.totalRatings}
                  </td>

                  {/* Last active */}
                  <td className="px-5 py-3.5 text-xs text-zinc-400">
                    {new Date(user.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors">
                        <Trash2 size={14} />
                      </button>
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
