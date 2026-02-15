
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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList },
  { id: 'ratings', label: 'Ratings', icon: Star },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => auth.signOut();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <Dashboard 
          liveAttendance={attendanceCount} 
          activeMealInfo={activeMealInfo}
          complaintsCount={complaints.length} 
          complaints={complaints} 
          ratings={ratings}
          usersCount={users.length} 
          recentActivities={recentActivities}
          dailyStats={dailyStats}
        />;
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
      case 'ratings': return <Ratings liveRatings={ratings} />;
      case 'complaints': return <Complaints liveComplaints={complaints} />;
      case 'users': return <UsersPage liveUsers={users} adminCount={adminCount} />;
      case 'reports': return <Reports complaints={complaints} ratings={ratings} users={users} dailyStats={dailyStats} attendanceByMeal={attendanceByMeal} activeMealInfo={activeMealInfo} />;
      default: 
        return <Dashboard 
          liveAttendance={attendanceCount} 
          activeMealInfo={activeMealInfo}
          complaintsCount={complaints.length} 
          complaints={complaints} 
          ratings={ratings}
          usersCount={users.length}
          recentActivities={recentActivities}
          dailyStats={dailyStats}
        />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r dark:border-slate-700 transition-all duration-300 z-50 overflow-hidden flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-blue-600 p-2 rounded-lg text-white shrink-0"><ClipboardList size={24} /></div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight dark:text-white">MyMess</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded lg:flex hidden dark:text-slate-400"><Menu size={20} /></button>
        </div>
        <nav className="flex-1 mt-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActivePage(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <item.icon size={22} className="shrink-0" />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t dark:border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} flex flex-col h-screen`}>
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b dark:border-slate-700 flex items-center justify-between px-8 sticky top-0 z-40 transition-colors">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize dark:text-white">{activePage}</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" />
              Live
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
          {dataLoading ? (
            <div className="h-full flex items-center justify-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : renderPage()}
        </div>
      </main>
    </div>
  );
}
