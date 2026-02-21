import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, MessageSquare, Star, ClipboardList, Settings,
  Moon, Sun, Menu, LogOut
} from 'lucide-react';
import { auth } from './lib/firebase';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Ratings from './pages/Ratings';
import Complaints from './pages/Complaints';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { useFirebaseData } from './hooks/useFirebaseData';

// ─── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList   },
  { id: 'ratings',    label: 'Ratings',    icon: Star            },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare   },
  { id: 'users',      label: 'Users',      icon: Users           },
  { id: 'reports',    label: 'Reports',    icon: ClipboardList   },
  { id: 'settings',   label: 'Settings',   icon: Settings        },
];

// ─── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-500" />
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser]     = useState<any>(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [activePage, setActivePage]       = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode]       = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const {
    attendanceCount,
    attendanceByMeal,
    attendanceUserIds,
    activeMealInfo,
    complaints,
    ratings,
    users,
    adminCount,
    recentActivities,
    dailyStats,
    loading: dataLoading
  } = useFirebaseData(currentUser?.uid || null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleLogout = () => auth.signOut();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            liveAttendance={attendanceCount}
            activeMealInfo={activeMealInfo}
            complaintsCount={complaints.length}
            complaints={complaints}
            ratings={ratings}
            usersCount={users.length}
            recentActivities={recentActivities}
            dailyStats={dailyStats}
          />
        );
      case 'attendance':
        return (
          <Attendance
            liveAttendance={attendanceCount}
            attendanceByMeal={attendanceByMeal}
            activeMealInfo={activeMealInfo}
            attendeeUserIds={attendanceUserIds}
            users={users}
          />
        );
      case 'ratings':    return <Ratings liveRatings={ratings} />;
      case 'complaints': return <Complaints liveComplaints={complaints} />;
      case 'users':      return <UsersPage liveUsers={users} adminCount={adminCount} />;
      case 'reports':
        return (
          <Reports
            complaints={complaints}
            ratings={ratings}
            users={users}
            dailyStats={dailyStats}
            attendanceByMeal={attendanceByMeal}
            activeMealInfo={activeMealInfo}
          />
        );
      default:
        return (
          <Dashboard
            liveAttendance={attendanceCount}
            activeMealInfo={activeMealInfo}
            complaintsCount={complaints.length}
            complaints={complaints}
            ratings={ratings}
            usersCount={users.length}
            recentActivities={recentActivities}
            dailyStats={dailyStats}
          />
        );
    }
  };

  // ── Auth loading ─────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
        <Spinner />
      </div>
    );
  }

  if (!currentUser) return <Login />;

  // ── Sidebar width token ───────────────────────────────────────────────────────

  const sidebarW = isSidebarOpen ? 'w-56' : 'w-14';
  const mainML   = isSidebarOpen ? 'ml-56' : 'ml-14';

  // ── Shell ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">

      {/* ── Sidebar ── */}
      <aside className={`
        ${sidebarW} fixed left-0 top-0 h-full z-50
        flex flex-col
        bg-zinc-950 dark:bg-zinc-900
        border-r border-zinc-800
        transition-all duration-200 overflow-hidden
      `}>

        {/* Wordmark */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded bg-indigo-600">
              <ClipboardList size={14} className="text-white" />
            </div>
            {isSidebarOpen && (
              <span className="text-[15px] font-semibold tracking-tight text-white whitespace-nowrap">
                MyMess
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex shrink-0 p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={`
                  group w-full flex items-center gap-3 px-2.5 py-2 rounded-md
                  text-[13px] font-medium transition-colors duration-150
                  ${active
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }
                `}
              >
                <Icon size={16} className="shrink-0" />
                {isSidebarOpen && (
                  <span className="whitespace-nowrap">{label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 px-2 pb-4 border-t border-zinc-800 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <LogOut size={16} className="shrink-0" />
            {isSidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col h-screen ${mainML} transition-all duration-200`}>

        {/* Header */}
        <header className="
          h-14 shrink-0
          flex items-center justify-between
          px-8
          bg-white dark:bg-zinc-900
          border-b border-zinc-100 dark:border-zinc-800
          sticky top-0 z-40
          transition-colors
        ">
          {/* Left: page title + live pill */}
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold capitalize tracking-tight text-zinc-900 dark:text-zinc-100">
              {activePage}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Live
              </span>
            </span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                {currentUser?.email?.charAt(0)}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 transition-colors">
          <div className="p-8 h-full">
            {dataLoading ? <Spinner /> : renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
