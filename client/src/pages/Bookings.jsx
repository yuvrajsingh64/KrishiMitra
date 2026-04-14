import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Phone, Mail, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STEPS = ['pending', 'accepted', 'completed'];
const STATUS_LABELS = { pending: 'Requested', accepted: 'Accepted', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_COLORS = { pending: 'text-amber-400', accepted: 'text-blue-400', rejected: 'text-red-400', completed: 'text-emerald-400', cancelled: 'text-slate-400' };

function TimelineStepper({ status }) {
  const activeIndex = STATUS_STEPS.indexOf(status);
  const isRejected = status === 'rejected';

  return (
    <div className="flex items-center gap-0 mt-4">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= activeIndex && !isRejected;
        const isCurrent = i === activeIndex && !isRejected;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isRejected && i === 1
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : isActive
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-500'
              }`}>
                {isRejected && i === 1 ? <XCircle size={16} /> : isActive ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <p className={`text-[10px] mt-1 font-medium ${
                isRejected && i === 1 ? 'text-red-400' :
                isActive ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {isRejected && i === 1 ? 'Rejected' : STATUS_LABELS[step]}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-4 ${
                isRejected ? 'bg-red-500/30' :
                i < activeIndex ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const { user } = useAuth();
  const { t } = useTheme();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/api/bookings');
        setBookings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchBookings();
  }, [user]);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="text-amber-400" size={18} />;
      case 'accepted': return <CheckCircle2 className="text-blue-400" size={18} />;
      case 'completed': return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'rejected': return <XCircle className="text-red-400" size={18} />;
      default: return <Clock className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {t('myBookings')}
        </h1>
        <p className="text-slate-400 mt-2">{t('manageBookings') || 'Track your service requests and booking history.'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking, i) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-slate-700/50 overflow-hidden"
              >
                {/* Main Row */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => toggleExpand(booking._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      booking.status === 'accepted' ? 'bg-blue-500/10 text-blue-400' :
                      booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {getStatusIcon(booking.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-lg">{booking.service?.title || 'Unknown Service'}</h3>
                      <p className="text-sm text-slate-400">
                        {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-emerald-400">₹{booking.totalAmount}</p>
                      <div className="flex items-center gap-1 justify-end">
                        {getStatusIcon(booking.status)}
                        <span className={`text-xs font-medium capitalize ${STATUS_COLORS[booking.status]}`}>{booking.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                        booking.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        booking.paymentStatus === 'refunded' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <CreditCard size={10} className="inline mr-1" />
                        {booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'refunded' ? '↩ Refunded' : 'Unpaid'}
                      </span>
                      {expanded[booking._id] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expanded[booking._id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-700/50"
                    >
                      <div className="p-5 bg-slate-800/20">
                        {/* Timeline */}
                        <TimelineStepper status={booking.status} />

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Provider Details</h4>
                            <p className="text-sm text-slate-200 font-medium">{booking.provider?.name || 'Unknown Provider'}</p>
                            {booking.provider?.email && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Mail size={12} /> {booking.provider.email}</p>
                            )}
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h4 className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Service Info</h4>
                            <p className="text-sm text-slate-200 font-medium">{booking.service?.title}</p>
                            <p className="text-xs text-slate-400 mt-1">Category: {booking.service?.category || 'N/A'}</p>
                            <p className="text-xs text-slate-400">Location: {booking.service?.location || 'N/A'}</p>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-4 bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-1">Notes</p>
                            <p className="text-sm text-slate-300">{booking.notes}</p>
                          </div>
                        )}

                        {/* Pay Now button for unpaid bookings */}
                        {booking.paymentStatus !== 'paid' && booking.status !== 'rejected' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { data: orderData } = await api.post(
                                  '/api/payments/order',
                                  { bookingId: booking._id }
                                );

                                if (orderData.mode === 'demo') {
                                  await api.post('/api/payments/verify', {
                                    bookingId: booking._id,
                                    paymentId: orderData.paymentId,
                                    demoMode: true,
                                  });
                                  // Update local state
                                  setBookings(prev => prev.map(b => 
                                    b._id === booking._id ? { ...b, paymentStatus: 'paid' } : b
                                  ));
                                } else {
                                  const rzp = new window.Razorpay({
                                    key: orderData.keyId,
                                    amount: orderData.amount,
                                    currency: orderData.currency,
                                    name: 'Krishi Mitra',
                                    description: `${booking.service?.title} — Payment`,
                                    image: 'https://img.icons8.com/color/96/plant-under-sun.png',
                                    order_id: orderData.orderId,
                                    handler: async (response) => {
                                      await api.post('/api/payments/verify', {
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        bookingId: booking._id,
                                        paymentId: orderData.paymentId,
                                      });
                                      setBookings(prev => prev.map(b => 
                                        b._id === booking._id ? { ...b, paymentStatus: 'paid' } : b
                                      ));
                                    },
                                    prefill: { name: user?.name, email: user?.email, contact: user?.phone || '' },
                                    theme: { color: '#10b981', backdrop_color: 'rgba(15, 23, 42, 0.75)' },
                                    modal: { confirm_close: true },
                                    method: {
                                      upi: true, card: true, netbanking: true, wallet: true, paylater: true,
                                    },
                                  });
                                  rzp.on('payment.failed', (resp) => {
                                    alert(`Payment failed: ${resp.error.description}`);
                                  });
                                  rzp.open();
                                }
                              } catch (err) {
                                alert(err.response?.data?.message || 'Payment failed');
                              }
                            }}
                            className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard size={18} />
                            Pay ₹{booking.totalAmount} Now
                          </button>
                        )}
                        {booking.paymentStatus === 'paid' && (
                          <div className="mt-4 w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} /> Payment Complete
                          </div>
                        )}
                        {booking.paymentStatus === 'refunded' && (
                          <div className="mt-4 w-full py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                            ↩ ₹{booking.totalAmount} Refunded — Service was rejected by provider
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="glass p-8 rounded-2xl text-center border border-slate-700/50">
              <Calendar className="mx-auto text-slate-500 mb-3" size={48} />
              <p className="text-slate-400">{t('noBookingsFound') || 'No bookings found.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
