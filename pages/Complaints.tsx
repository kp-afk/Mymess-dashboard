
import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, Clock, Database } from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { db } from '../lib/firebase';

const StatusBadge = ({ status }: { status: ComplaintStatus }) => {
  const styles = {
    'Pending': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    'Resolved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
};

interface ComplaintsProps {
  liveComplaints: Complaint[];
}

export default function Complaints({ liveComplaints }: ComplaintsProps) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredComplaints = liveComplaints.filter(c => {
    const matchesFilter = filter === 'All' || c.status === filter;
    const matchesSearch = c.userName.toLowerCase().includes(search.toLowerCase()) || 
                         c.complaintText.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (id: string, next: ComplaintStatus) => {
    try {
      await db.collection("complaints").doc(id).update({
        status: next,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      if (err.code === 'permission-denied') {
        alert("ACCESS DENIED: You are not authorized to update complaints.\n\nPlease add your UID to the 'admins' collection in Firestore.");
      } else {
        alert("Failed to update status. Check console for details.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Complaints Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Live feed from Firestore <code>complaints/</code> collection.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-1 shadow-sm">
            {['All', 'Pending', 'In Progress', 'Resolved'].map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Pending</p>
            <p className="text-3xl font-black dark:text-white">{liveComplaints.filter(c => c.status === 'Pending').length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">In Progress</p>
            <p className="text-3xl font-black dark:text-white">{liveComplaints.filter(c => c.status === 'In Progress').length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Resolved</p>
            <p className="text-3xl font-black dark:text-white">{liveComplaints.filter(c => c.status === 'Resolved').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-700 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student or text..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white border dark:border-slate-600 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-700 px-4 py-2.5 rounded-xl border dark:border-slate-600">
             <Database size={16} /> Syncing
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {filteredComplaints.length > 0 ? filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center text-xs font-black">
                        {complaint.userName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold dark:text-slate-200 truncate">{complaint.userName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{complaint.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                      {complaint.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-xs">{complaint.complaintText}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={complaint.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {complaint.status !== 'Resolved' && (
                        <button 
                          onClick={() => handleStatusChange(complaint.id, 'Resolved')}
                          className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Resolve
                        </button>
                      )}
                      {complaint.status === 'Pending' && (
                        <button 
                          onClick={() => handleStatusChange(complaint.id, 'In Progress')}
                          className="px-3 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-600 hover:text-white dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-600 dark:hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Progress
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <Database size={32} className="mx-auto mb-2 opacity-10" />
                    <p className="font-medium uppercase text-xs tracking-widest">No complaints found matching criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
