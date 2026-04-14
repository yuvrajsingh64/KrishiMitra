import { motion } from 'framer-motion';
import { Search, Filter, Tractor, Compass, Droplets, MapPin, Star, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const iconMap = {
  Tractor,
  Compass,
  Droplets
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { t } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Machinery', 'Irrigation', 'Advanced', 'Pesticide', 'Labor', 'Transport'];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/api/services');
        setServices(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Client-side filtering
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.provider?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || service.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const [bookingStatus, setBookingStatus] = useState({});

  const openRazorpayCheckout = (orderData, bookingData) => {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Krishi Mitra',
      description: `${bookingData.serviceName} — ${orderData.booking?.provider || 'Service Provider'}`,
      image: 'https://img.icons8.com/color/96/plant-under-sun.png',
      order_id: orderData.orderId,

      // ── All Payment Methods Enabled ──
      config: {
        display: {
          blocks: {
            upi: { name: 'UPI Payment', instruments: [{ method: 'upi' }] },
            card: { name: 'Card Payment', instruments: [{ method: 'card' }] },
            netbanking: { name: 'Net Banking', instruments: [{ method: 'netbanking' }] },
            wallet: { name: 'Wallets', instruments: [{ method: 'wallet' }] },
          },
          sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
          preferences: { show_default_blocks: true },
        },
      },

      handler: async (response) => {
        // Payment success — verify on backend
        try {
          await api.post('/api/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingData.bookingId,
            paymentId: orderData.paymentId,
          });
          setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: 'paid' }));
          setTimeout(() => setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: null })), 4000);
        } catch (err) {
          console.error('Payment verify failed:', err);
          setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: 'success' }));
          setTimeout(() => setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: null })), 3000);
        }
      },

      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },

      notes: {
        service: bookingData.serviceName,
        booking_id: bookingData.bookingId,
      },

      theme: {
        color: '#10b981',
        backdrop_color: 'rgba(15, 23, 42, 0.75)',
      },

      modal: {
        confirm_close: true,
        ondismiss: () => {
          setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: 'success' }));
          setTimeout(() => setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: null })), 3000);
        },
      },

      // Method preferences
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        paylater: true,
        emi: false,
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      console.error('Payment failed:', response.error);
      setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: 'error' }));
      alert(`Payment failed: ${response.error.description}`);
      setTimeout(() => setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: null })), 3000);
    });
    rzp.open();
  };

  const handleDemoPayment = async (orderData, bookingData) => {
    try {
      await api.post('/api/payments/verify', {
        bookingId: bookingData.bookingId,
        paymentId: orderData.paymentId,
        demoMode: true,
      });
      setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: 'paid' }));
      setTimeout(() => setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: null })), 4000);
    } catch (err) {
      console.error('Demo payment failed:', err);
      setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: 'success' }));
      setTimeout(() => setBookingStatus(prev => ({ ...prev, [bookingData.serviceId]: null })), 3000);
    }
  };

  const handleBook = async (serviceId, price, serviceName) => {
    try {
      setBookingStatus(prev => ({ ...prev, [serviceId]: 'loading' }));
      
      // Step 1: Create booking
      const { data: booking } = await api.post(
        '/api/bookings', 
        { 
          serviceId, 
          scheduledDate: new Date(Date.now() + 86400000),
          notes: 'Standard Booking',
          totalAmount: price
        },
      );

      // Step 2: Create payment order
      const { data: orderData } = await api.post(
        '/api/payments/order',
        { bookingId: booking._id },
      );

      const bookingData = { bookingId: booking._id, serviceId, serviceName };

      // Step 3: Open payment
      if (orderData.mode === 'demo') {
        // Demo mode — simulate instant payment
        await handleDemoPayment(orderData, bookingData);
      } else {
        // Real Razorpay checkout
        openRazorpayCheckout(orderData, bookingData);
        setBookingStatus(prev => ({ ...prev, [serviceId]: 'paying' }));
      }
    } catch (err) {
      setBookingStatus(prev => ({ ...prev, [serviceId]: 'error' }));
      alert(err.response?.data?.message || 'Error occurred while booking');
      setTimeout(() => {
        setBookingStatus(prev => ({ ...prev, [serviceId]: null }));
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">{t('discoverServices')}</h2>
          <p className="text-slate-400 mt-1">{t('findServices')}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('searchServices')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm"
            />
          </div>
          <select 
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
            className="bg-slate-800 text-sm text-slate-300 px-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex gap-2"><AlertCircle /> {error}</div>
      ) : filteredServices.length === 0 ? (
        <div className="p-8 text-center text-slate-400 glass rounded-2xl">
          {searchTerm || activeCategory !== 'All' 
            ? 'No services match your search. Try adjusting your filters.'
            : 'No services found. Providers haven\'t added any yet.'
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const Icon = iconMap[service.iconName] || Tractor;
            return (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-5 rounded-2xl border border-slate-700/50 group hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-slate-800/80 border border-slate-700 ${service.colorClass}`}>
                    <Icon size={24} />
                  </div>
                  <div className="bg-slate-800/80 px-2 py-1 rounded-md flex items-center gap-1 border border-slate-700">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold">{service.rating}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{service.title}</h3>
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1 mb-2">
                  <MapPin size={14} />
                  <span>{service.location}</span>
                </div>
                {service.mobileNumber && (
                  <p className="text-xs text-slate-500 mb-4 flex-1">📞 {service.mobileNumber}</p>
                )}
                {!service.mobileNumber && <div className="mb-4 flex-1" />}
                <div className="flex justify-between items-center pt-4 border-t border-slate-700/50 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Provider</p>
                    <p className="font-medium text-sm text-slate-300">{service.provider?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="font-bold text-emerald-400">₹{service.price}/{service.priceUnit}</p>
                  </div>
                </div>
                
                {(!user || user.role === 'farmer') && (
                  <button 
                    onClick={() => {
                      if (!user) {
                        alert('Please login as a Farmer to book this service!');
                        return;
                      }
                      const st = bookingStatus[service._id];
                      if (!st || st === 'error') {
                        handleBook(service._id, service.price, service.title);
                      }
                    }}
                    disabled={['loading', 'success', 'paid', 'paying'].includes(bookingStatus[service._id])}
                    className={`w-full py-2.5 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                      bookingStatus[service._id] === 'paid'
                        ? 'bg-emerald-600 text-white cursor-not-allowed'
                        : bookingStatus[service._id] === 'success' 
                        ? 'bg-blue-600 text-white cursor-not-allowed'
                        : bookingStatus[service._id] === 'loading' || bookingStatus[service._id] === 'paying'
                        ? 'bg-slate-700 text-slate-300 cursor-wait'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {bookingStatus[service._id] === 'paid' 
                      ? '✓ Booked & Paid!'
                      : bookingStatus[service._id] === 'success' 
                      ? '✓ Booked (Unpaid)'
                      : bookingStatus[service._id] === 'paying'
                      ? '💳 Processing Payment...'
                      : bookingStatus[service._id] === 'loading'
                      ? 'Booking...'
                      : `Book & Pay ₹${service.price}`
                    }
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
