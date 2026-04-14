import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle, DollarSign, XCircle, AlertCircle, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { t } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchBookings();
  }, [user]);

  const handleStatusUpdate = async (bookingId, status) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: status }));
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // Refresh bookings list
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
  const rejectedBookings = bookings.filter(b => b.status === 'rejected');
  const totalEarnings = bookings.filter(b => b.status === 'accepted').reduce((sum, b) => sum + b.totalAmount, 0);

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { label: 'Pending Requests', value: pendingBookings.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    { label: 'Accepted', value: acceptedBookings.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Total Earnings', value: `₹${totalEarnings}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  ];

  if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {t('welcome')}, {user?.name.split(' ')[0] || 'Provider'}
        </h2>
        <p className="text-slate-400 mt-1">Manage incoming booking requests and track your earnings.</p>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex items-center gap-2"><AlertCircle /> {error}</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`glass p-6 rounded-2xl flex items-center gap-4 border ${stat.bg}`}>
                  <div className={`p-4 rounded-xl bg-slate-800 ${stat.color}`}><Icon size={24} /></div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pending Requests Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="text-amber-400" size={22} /> Pending Booking Requests
              {pendingBookings.length > 0 && (
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{pendingBookings.length}</span>
              )}
            </h3>
            <div className="space-y-3">
              {pendingBookings.length === 0 ? (
                <p className="text-slate-400 text-sm">No pending requests. You're all caught up! 🎉</p>
              ) : (
                pendingBookings.map((booking) => (
                  <div key={booking._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm uppercase">
                        {booking.farmer?.name?.substring(0, 2) || 'FK'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">{booking.service?.title || 'Unknown Service'}</h4>
                        <p className="text-xs text-slate-400">
                          Farmer: <span className="text-slate-300">{booking.farmer?.name}</span> • {new Date(booking.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">₹{booking.totalAmount}</span>
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'accepted')}
                        disabled={!!actionLoading[booking._id]}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> {actionLoading[booking._id] === 'accepted' ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                        disabled={!!actionLoading[booking._id]}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-1 border border-red-500/30"
                      >
                        <XCircle size={14} /> {actionLoading[booking._id] === 'rejected' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* All Bookings History */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold mb-4">All Bookings</h3>
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <p className="text-slate-400 text-sm">No bookings yet. Your services are waiting for farmers!</p>
              ) : (
                bookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                        booking.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                        booking.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {booking.farmer?.name?.substring(0, 2) || 'FK'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">{booking.service?.title || 'Unknown'}</h4>
                        <p className="text-xs text-slate-400">
                          {booking.farmer?.name} • {new Date(booking.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-400 font-bold">₹{booking.totalAmount}</p>
                      <p className={`text-xs font-medium capitalize ${
                        booking.status === 'pending' ? 'text-amber-400' :
                        booking.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'
                      }`}>{booking.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
