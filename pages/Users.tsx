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
    <div
      style={{ fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace" }}
      className="space-y-4"
    >

      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b border-[#1f1f1f] pb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#555] uppercase mb-1">Directory</div>
          <h1 className="text-2xl text-[#e8e8e8] tracking-tight">Users</h1>
        </div>
        <div className="text-[10px] text-[#444] tabular-nums">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Registered', value: liveUsers.length, color: '#38bdf8' },
          { label: 'Total RSVPs', value: totalRSVPs, color: '#f59e0b' },
          { label: 'Admins', value: adminCount, color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-[#1a1a1a] bg-[#0d0d0d] p-4">
            <div className="text-[10px] tracking-[0.2em] text-[#555] uppercase mb-2">{label}</div>
            <div className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="border border-[#1a1a1a] bg-[#0d0d0d]">

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-3">
          <Search size={13} className="text-[#444] shrink-0" />
          <input
            type="text"
            placeholder="search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[#ccc] placeholder:text-[#333] outline-none"
          />
          {searchTerm && (
            <span className="text-[10px] text-[#555] tabular-nums">
              {filteredUsers.length}/{liveUsers.length}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#141414]">
                {['Student', 'RSVPs', 'Ratings', 'Complaints', 'Last Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] tracking-[0.2em] text-[#444] uppercase font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Users size={24} className="mx-auto mb-3 text-[#222]" />
                    <p className="text-[12px] text-[#444]">No users found.</p>
                  </td>
                </tr>
              ) : filteredUsers.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b border-[#111] hover:bg-[#0f0f0f] transition-colors"
                >
                  {/* Student */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center text-[11px] font-bold text-[#f59e0b] shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] text-[#ccc]">{user.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-[#444] mt-0.5">
                          <Mail size={9} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* RSVPs */}
                  <td className="px-4 py-3.5 text-[13px] font-bold tabular-nums text-[#38bdf8]">
                    {user.totalRSVPs}
                  </td>

                  {/* Ratings */}
                  <td className="px-4 py-3.5 text-[13px] font-bold tabular-nums text-[#f59e0b]">
                    {user.totalRatings}
                  </td>

                  {/* Complaints */}
                  <td className="px-4 py-3.5 text-[13px] font-bold tabular-nums text-[#f87171]">
                    {user.totalComplaints || 0}
                  </td>

                  {/* Last active */}
                  <td className="px-4 py-3.5 text-[11px] text-[#555] tabular-nums">
                    {new Date(user.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-[#444] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 border border-transparent hover:border-[#f59e0b]/20 transition-all">
                        <Edit2 size={13} />
                      </button>
                      <button className="p-1.5 text-[#444] hover:text-red-500 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#111] flex items-center justify-between">
          <span className="text-[9px] text-[#333] tracking-widest uppercase">
            Firebase RTDB · Realtime
          </span>
          <span className="text-[9px] text-[#333] tabular-nums">
            {filteredUsers.length} records
          </span>
        </div>
      </div>
    </div>
  );
}
