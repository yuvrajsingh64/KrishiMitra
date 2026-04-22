import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sprout, Mail, Lock, User, UserCog, ArrowRight, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export default function Register() {
  const [role, setRole] = useState('farmer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      return; // Don't submit without CAPTCHA
    }
    try {
      await register(name, email, password, role, captchaToken);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      // Reset captcha on error so user can retry
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Register Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Sprout size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
          <p className="text-slate-400 mt-2 text-center">Join Krishi Mitra today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 p-1 bg-slate-800/50 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex justify-center items-center gap-2 ${
                role === 'farmer' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User size={16} /> Farmer
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex justify-center items-center gap-2 ${
                role === 'provider' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCog size={16} /> Provider
            </button>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* reCAPTCHA Widget */}
          {RECAPTCHA_SITE_KEY && (
            <div className="flex justify-center py-2">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                theme="dark"
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (RECAPTCHA_SITE_KEY && !captchaToken)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4 relative overflow-hidden"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : (
              <>
                <span>Sign Up as {role === 'farmer' ? 'Farmer' : 'Provider'}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 font-medium hover:text-emerald-300 hover:underline transition-all">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
