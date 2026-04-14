import { Bell, Key, Layout, User, Save, Check, Eye, EyeOff, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Reusable Toggle Component
function Toggle({ enabled, onToggle, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-300 text-sm">{label}</span>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${
          enabled ? 'bg-emerald-500' : 'bg-slate-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggleTheme, language, setLanguage, t } = useTheme();

  // --- Profile State ---
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // --- Notification State (localStorage persisted) ---
  const [smsAlerts, setSmsAlerts] = useState(() => {
    return localStorage.getItem('km_smsAlerts') !== 'false';
  });
  const [emailReports, setEmailReports] = useState(() => {
    return localStorage.getItem('km_emailReports') === 'true';
  });
  const [bookingAlerts, setBookingAlerts] = useState(() => {
    return localStorage.getItem('km_bookingAlerts') !== 'false';
  });

  // Persist notification preferences
  useEffect(() => {
    localStorage.setItem('km_smsAlerts', smsAlerts);
    localStorage.setItem('km_emailReports', emailReports);
    localStorage.setItem('km_bookingAlerts', bookingAlerts);
  }, [smsAlerts, emailReports, bookingAlerts]);

  // --- Profile Update Handler ---
  const handleProfileSave = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError('Name and email are required.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    try {
      const { data } = await api.put(
        '/api/auth/profile',
        { name: profileName, email: profileEmail }
      );
      const updatedUser = { ...user, name: data.name, email: data.email };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // --- Password Change Handler ---
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: 'Please fill in all fields.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ text: '', type: '' });
    try {
      await api.put(
        '/api/auth/password',
        { currentPassword, newPassword }
      );
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.message || 'Failed to change password', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const cardAnim = (delay) => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4 }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {t('accountSettings')}
        </h1>
        <p className="text-slate-400 mt-2">{t('managePrefs')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* ── Profile Card ── */}
        <motion.div {...cardAnim(0)} className="glass p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-5">
            <User className="text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-100">{t('profile')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">{t('fullName')}</label>
              <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">{t('emailAddress')}</label>
              <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)}
                className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">{t('role')}</label>
              <div className="px-4 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-sm text-slate-300 capitalize">{user?.role || 'N/A'}</div>
            </div>
            {profileError && <p className="text-red-400 text-xs">{profileError}</p>}
            <button onClick={handleProfileSave} disabled={profileSaving}
              className={`w-full py-2.5 font-medium rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                profileSaved ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              } disabled:opacity-60`}>
              {profileSaved ? <><Check size={16} /> {t('profileSaved')}</>
               : profileSaving ? 'Saving...'
               : <><Save size={16} /> {t('saveProfile')}</>}
            </button>
          </div>
        </motion.div>

        {/* ── Preferences Card ── */}
        <motion.div {...cardAnim(0.1)} className="glass p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-5">
            <Layout className="text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-100">{t('preferences')}</h2>
          </div>
          <div className="space-y-5">
            <Toggle label={t('darkTheme')} enabled={isDark} onToggle={toggleTheme} />
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">{t('language')}</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-slate-800 text-sm text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी</option>
                <option value="Marathi">मराठी</option>
                <option value="Tamil">தமிழ்</option>
                <option value="Telugu">తెలుగు</option>
              </select>
            </div>
            <div className="pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-0.5">{t('selectedLanguage')}</p>
              <p className="text-emerald-400 text-sm font-medium">{language}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Notifications Card ── */}
        <motion.div {...cardAnim(0.2)} className="glass p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-100">{t('notifications')}</h2>
          </div>
          <div className="space-y-5">
            <Toggle label={t('smsAlerts')} enabled={smsAlerts} onToggle={() => setSmsAlerts(!smsAlerts)} />
            <Toggle label={t('emailReports')} enabled={emailReports} onToggle={() => setEmailReports(!emailReports)} />
            <Toggle label={t('bookingAlertsInApp')} enabled={bookingAlerts} onToggle={() => setBookingAlerts(!bookingAlerts)} />
            <div className="pt-3 border-t border-slate-700/50 text-xs text-slate-500">{t('autoSaved')}</div>
          </div>
        </motion.div>

        {/* ── Change Password Card ── */}
        <motion.div {...cardAnim(0.3)} className="glass p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-100">{t('changePassword')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">{t('currentPassword')}</label>
              <div className="relative">
                <input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
                <button onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">{t('newPassword')}</label>
              <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">{t('confirmNewPassword')}</label>
              <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-800/60 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
            </div>
            {passwordMsg.text && (
              <p className={`text-xs ${passwordMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{passwordMsg.text}</p>
            )}
            <button onClick={handlePasswordChange} disabled={passwordSaving}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {passwordSaving ? 'Updating...' : <><Key size={16} /> {t('updatePassword')}</>}
            </button>
          </div>
        </motion.div>

        {/* ── API Keys Card (Full Width) ── */}
        <motion.div {...cardAnim(0.4)} className="md:col-span-2 glass p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Key className="text-emerald-400" />
            <h2 className="text-xl font-semibold text-slate-100">{t('apiIntegrations')}</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5">{t('apiDescription')}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Gemini AI Key</label>
              <input type="password" value="AIzaSy...CN_4" disabled className="w-full bg-slate-800 text-slate-400 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none text-sm" />
              <p className="text-xs text-emerald-400 flex items-center gap-1"><Check size={12} /> {t('connectedActive')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Razorpay Key</label>
              <input type="password" value="rzp_test_stub" disabled className="w-full bg-slate-800 text-slate-400 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none text-sm" />
              <p className="text-xs text-amber-400 flex items-center gap-1">⚠ {t('testMode')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
