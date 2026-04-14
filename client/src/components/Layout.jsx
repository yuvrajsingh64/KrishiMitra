import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Calendar, Settings, LogOut, Sprout, Menu, Package, ClipboardList, Sun, Moon, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) {
      socket.emit('join', user._id);

      socket.on('new_bookingRequest', (data) => {
        alert(`🔔 New Booking: ${data.message}`);
      });

      socket.on('booking_statusUpdated', (data) => {
        alert(`📝 Update: ${data.message}`);
      });
    }

    return () => {
      socket.off('new_bookingRequest');
      socket.off('booking_statusUpdated');
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based navigation
  const farmerLinks = [
    { name: t('dashboard'), path: '/dashboard', icon: Home },
    { name: t('services'), path: '/services', icon: Compass },
    { name: t('myBookings'), path: '/bookings', icon: Calendar },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const providerLinks = [
    { name: t('dashboard'), path: '/dashboard', icon: Home },
    { name: 'Manage Services', path: '/manage-services', icon: Package },
    { name: 'Booking Requests', path: '/booking-requests', icon: ClipboardList },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const navLinks = user?.role === 'provider' ? providerLinks : farmerLinks;

  return (
    <div className={`flex h-screen text-slate-50 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-[#f0fdf4]'}`}>
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-slate-700 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-center h-16 border-b border-slate-700/50">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-400">
            <Sprout size={28} />
            <span>Krishi Mitra</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button onClick={handleLogout} className="flex items-center w-full gap-3 px-4 py-3 text-red-400 rounded-lg transition-colors hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 glass border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 rounded-md lg:hidden text-slate-400 hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold hidden sm:block">
              {navLinks.find(link => link.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Homepage Button */}
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700' 
                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
              }`}
              title="Go to Homepage"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">Homepage</span>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center ${
                isDark ? 'bg-slate-700' : 'bg-emerald-200'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className={`absolute w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isDark 
                  ? 'translate-x-0.5 bg-slate-900 text-yellow-400' 
                  : 'translate-x-7 bg-white text-amber-500'
              }`}>
                {isDark ? <Moon size={14} /> : <Sun size={14} />}
              </div>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-medium ${isDark ? '' : 'text-slate-800'}`}>{user ? user.name : 'Raj Kumar'}</p>
                <p className="text-xs text-emerald-500 flex justify-end capitalize">{user ? user.role : 'Farmer'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold uppercase">
                {user ? user.name.substring(0, 2) : 'RK'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto p-4 md:p-6 transition-colors duration-300 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f0fdf4]'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
