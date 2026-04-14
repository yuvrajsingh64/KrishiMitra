import { motion } from 'framer-motion';
import { Sprout, ArrowRight, Shield, Bot, Calendar, MapPin, Star, ChevronRight, Tractor, Droplets, Compass, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../config/api';

const iconMap = { Tractor, Compass, Droplets };

export default function LandingPage() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get('/api/services')
      .then(res => setServices(res.data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0f172a]/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-400">
            <Sprout size={28} /> Krishi Mitra
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-300 hover:text-white px-4 py-2 transition-colors">
              Login
            </Link>
            <Link to="/register" className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-medium transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background blurs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Sprout size={16} /> India's Smart Agriculture Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Empowering Farmers with
              <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
                Smart Technology
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Book trusted agricultural services, get AI-powered crop advice, and manage your farm — all in one platform. 
              Join thousands of farmers already growing smarter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="group w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
                Start Free Today <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2">
                Already a member? Login
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: 'Active Farmers', value: '10,000+' },
              { label: 'Service Providers', value: '500+' },
              { label: 'Bookings Done', value: '25,000+' },
              { label: 'AI Queries', value: '1M+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything Your Farm Needs</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete ecosystem connecting farmers with verified service providers and intelligent farming tools.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: 'Easy Booking', desc: 'Book tractor plowing, irrigation setup, drone seeding, and more — with just one click. Track every booking in real-time.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { icon: Bot, title: 'AI Crop Advisor', desc: 'Ask our AI assistant about crops, weather, pest control, and soil health. Powered by cutting-edge Gemini AI.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { icon: Shield, title: 'Trusted Providers', desc: 'Every service provider is verified with direct contact numbers. Know exactly who you\'re hiring for your farm.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`p-8 rounded-2xl border ${feat.bg} backdrop-blur-sm hover:scale-[1.02] transition-transform cursor-default`}>
                  <div className={`w-14 h-14 rounded-xl ${feat.bg} flex items-center justify-center mb-5 ${feat.color}`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Services Preview ── */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Services</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Browse agricultural services from verified providers across India.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.length > 0 ? services.map((service, i) => {
              const Icon = iconMap[service.iconName] || Tractor;
              return (
                <motion.div key={service._id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-slate-800 border border-slate-700 ${service.colorClass || 'text-emerald-400'}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                      <Star size={12} className="text-amber-400 fill-amber-400" /> {service.rating || 4.5}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">{service.title}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-sm mb-4">
                    <MapPin size={14} /> {service.location}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                    <div>
                      <p className="text-xs text-slate-500">Provider</p>
                      <p className="text-sm font-medium text-slate-300">{service.provider?.name || 'Verified Provider'}</p>
                    </div>
                    <p className="font-bold text-emerald-400">₹{service.price}/{service.priceUnit}</p>
                  </div>
                </motion.div>
              );
            }) : (
              /* Placeholder cards when services haven't loaded */
              [1,2,3].map(i => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4"></div>
                  <div className="h-5 bg-slate-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-6"></div>
                  <div className="h-px bg-slate-700 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
                    <div className="h-4 bg-emerald-500/20 rounded w-1/4"></div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-10">
            <Link to="/register" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              View All Services <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Smarter?</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
              Join Krishi Mitra today and experience the future of agriculture. It's free to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                Create Free Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="px-8 py-4 text-slate-300 hover:text-white font-medium transition-colors">
                Already have an account?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="about" className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <Sprout size={24} /> Krishi Mitra
            </div>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Smart Agriculture Platform — Connecting Farmers with Technology
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800 my-6" />

          {/* Contact / Developer row */}
          <div className="flex flex-col items-center gap-5">
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Developed & Maintained by Yuvraj Singh</p>

            <div className="flex items-center gap-5">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/yuvrajsingh64/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="group w-11 h-11 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-[#0A66C2] hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/yuvrajxsingh/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group w-11 h-11 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>

              {/* Email */}
              <a
                href="mailto:mr.yuvrajsinghh@gmail.com"
                aria-label="Email"
                className="group w-11 h-11 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all duration-300"
              >
                <Mail size={20} />
              </a>
            </div>

            <p className="text-slate-600 text-xs mt-2">© 2026 Krishi Mitra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
