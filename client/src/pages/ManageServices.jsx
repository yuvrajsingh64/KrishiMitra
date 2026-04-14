import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Star, X, Package } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Machinery', 'Irrigation', 'Advanced', 'Pesticide', 'Labor', 'Transport'];

export default function ManageServices() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState({});

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', category: 'Machinery',
    price: '', priceUnit: 'hr', location: '', mobileNumber: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchServices = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/services/mine', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchServices();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.location) {
      setFormError('Title, price, and location are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await axios.post('http://localhost:5000/api/services', {
        ...form,
        price: Number(form.price)
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setForm({ title: '', description: '', category: 'Machinery', price: '', priceUnit: 'hr', location: '', mobileNumber: '' });
      setShowForm(false);
      await fetchServices();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await axios.delete(`http://localhost:5000/api/services/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      await fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Manage Services
          </h1>
          <p className="text-slate-400 mt-1">Add, view, and manage your agricultural service listings.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Service</>}
        </button>
      </div>

      {/* Add Service Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="glass p-6 rounded-2xl border border-slate-700/50 space-y-4 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-slate-100">New Service Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Service Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Tractor Plowing"
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 800"
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Price Unit</label>
                <select value={form.priceUnit} onChange={e => setForm({ ...form, priceUnit: e.target.value })}
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm">
                  <option value="hr">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="acre">Per Acre</option>
                  <option value="trip">Per Trip</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Location *</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Nagpur"
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Mobile Number *</label>
                <input type="tel" value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
            </div>
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
            <button type="submit" disabled={formLoading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50">
              {formLoading ? 'Creating...' : 'Create Service'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Services List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : services.length === 0 ? (
        <div className="glass p-10 rounded-2xl text-center border border-slate-700/50">
          <Package className="mx-auto text-slate-500 mb-3" size={48} />
          <p className="text-slate-400">You haven't added any services yet. Click "Add Service" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div key={service._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="glass p-5 rounded-2xl border border-slate-700/50 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-medium">{service.category}</span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  {service.rating || 0}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">{service.title}</h3>
              <div className="flex items-center gap-1 text-slate-400 text-sm mb-1">
                <MapPin size={14} /><span>{service.location}</span>
              </div>
              {service.mobileNumber && (
                <p className="text-xs text-slate-500 mb-3 flex-1">📞 {service.mobileNumber}</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
                <p className="font-bold text-emerald-400">₹{service.price}/{service.priceUnit}</p>
                <button
                  onClick={() => handleDelete(service._id)}
                  disabled={deleting[service._id]}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
