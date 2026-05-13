import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, LogIn, UserPlus, IdCard, Stethoscope, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import BackgroundDecoration from '../components/BackgroundDecoration';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' | 'patient'

  // Doctor form
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Patient form
  const [patientEmail, setPatientEmail]         = useState('');
  const [patientPassword, setPatientPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'       ? 'No account found with this email' :
        err.code === 'auth/wrong-password'        ? 'Incorrect password' :
        err.code === 'auth/invalid-credential'    ? 'Invalid email or password' :
        err.code === 'auth/too-many-requests'     ? 'Too many attempts. Try again later.' :
        err.code === 'auth/invalid-email'         ? 'Invalid email format' :
        'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    if (!patientEmail || !patientPassword) return toast.error('Please fill in all fields');

    setIsLoading(true);
    try {
      await login(patientEmail.trim(), patientPassword);
      toast.success('Logged in successfully!');
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'  ? 'No patient found with this email' :
        err.code === 'auth/invalid-credential'  ? 'Incorrect email or password' :
        'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'doctor',  label: 'Doctor',  icon: Stethoscope },
    { id: 'patient', label: 'Patient', icon: User },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <BackgroundDecoration />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-lg shadow-brand-500/25">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                Cardio<span className="text-gradient">Vision</span>{' '}
                <span className="text-xs font-semibold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md">AI</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 tracking-widest uppercase mt-0.5">
                Deep Learning ECG Analysis
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative ${
                    activeTab === id
                      ? 'text-brand-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {activeTab === id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
                {activeTab === 'doctor' ? 'Doctor Sign In' : 'Patient Portal'}
              </h2>
              <p className="text-sm text-slate-500 text-center mb-8">
                {activeTab === 'doctor'
                  ? 'Access your dashboard and manage patients'
                  : 'View your ECG reports and medical data'}
              </p>

              {/* Doctor Login Form */}
              {activeTab === 'doctor' && (
                <motion.form
                  key="doctor-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleDoctorLogin}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:from-brand-700 hover:to-brand-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* Patient Login Form */}
              {activeTab === 'patient' && (
                <motion.form
                  key="patient-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handlePatientLogin}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="patient-email-login" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        id="patient-email-login"
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="patient-password-login" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        id="patient-password-login"
                        type="password"
                        value={patientPassword}
                        onChange={(e) => setPatientPassword(e.target.value)}
                        placeholder="Temporary or your password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:from-brand-700 hover:to-brand-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        View My Reports
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                    <IdCard className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your registered email and temporary password were provided by your doctor.
                      You'll be asked to set a new password on first login.
                    </p>
                  </div>
                </motion.form>
              )}
            </div>

            {/* Footer — only for doctor tab */}
            {activeTab === 'doctor' && (
              <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100">
                <p className="text-sm text-center text-slate-500">
                  New doctor?{' '}
                  <Link
                    to="/signup"
                    className="font-semibold text-brand-600 hover:text-brand-700 transition-colors inline-flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Create an account
                  </Link>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
