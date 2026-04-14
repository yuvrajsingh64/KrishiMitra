import { motion } from 'framer-motion';
import { Activity, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProviderDashboard from './ProviderDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTheme();

  // If user is a provider, render the provider dashboard
  if (user?.role === 'provider') {
    return <ProviderDashboard />;
  }
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/api/bookings');
        setBookings(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) {
      fetchBookings();
    }
  }, [user]);

  const activeBookings = bookings.filter(b => b.status === 'accepted').length;
  const pendingRequests = bookings.filter(b => b.status === 'pending').length;
  const completedServices = bookings.filter(b => b.status === 'completed').length;
  const totalInvoices = bookings.length;

  const stats = [
    { label: t('activeBookings'), value: activeBookings, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { label: t('pendingRequests'), value: pendingRequests, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    { label: 'Completed Services', value: completedServices, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Total Invoices', value: totalInvoices, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  ];

  if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {t('welcome')}, {user?.name.split(' ')[0] || 'Guest'}
          </h2>
          <p className="text-slate-400 mt-1">{t('farmOverview')}</p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex items-center gap-2"><AlertCircle /> {error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass p-6 rounded-2xl flex items-center gap-4 border ${stat.bg}`}
                >
                  <div className={`p-4 rounded-xl bg-slate-800 ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-2 glass rounded-2xl border border-slate-700/50 p-6"
            >
              <h3 className="text-xl font-bold mb-4">{t('recentBookings')}</h3>
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <p className="text-slate-400 text-sm">{t('noRecentBookings')}</p>
                ) : (
                  bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center ${
                          booking.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-200">{booking.service?.title || 'Unknown Service'}</h4>
                          <p className="text-xs text-slate-400">
                            {user?.role === 'farmer' ? `Provider: ${booking.provider?.name}` : `Farmer: ${booking.farmer?.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium capitalize ${
                          booking.status === 'pending' ? 'text-amber-400' : 
                          booking.status === 'accepted' ? 'text-blue-400' : 'text-emerald-400'
                        }`}>
                          {booking.status}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl border border-slate-700/50 p-6"
            >
              <h3 className="text-xl font-bold mb-4">AI Advisory</h3>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                <p className="text-sm text-slate-300">
                  <span className="text-emerald-400 font-semibold block mb-1">Weather Alert</span>
                  Heavy rain expected this weekend. Avoid sowing new seeds until Monday.
                </p>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
                className="w-full py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium hover:bg-emerald-500/20 transition-all"
              >
                Open Chat Assistant
              </button>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
