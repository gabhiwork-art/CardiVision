import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Activity, Heart, User, Stethoscope, ShieldCheck, ShieldOff, Crown, Clock, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BackgroundDecoration from '../components/BackgroundDecoration';

export default function PatientDashboard() {
  const { userData, logout, currentUser, getDoctorsForPatient, toggleDoctorAccess, getReportsForPatient } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [reports, setReports] = useState([]);

  /* ── Load data ────────────────────────────────────────────── */
  useEffect(() => {
    if (currentUser?.uid) {
      (async () => {
        try {
          const [docs, reps] = await Promise.all([
            getDoctorsForPatient(currentUser.uid),
            getReportsForPatient(currentUser.uid),
          ]);
          setDoctors(docs);
          setReports(reps);
        } catch (error) {
          console.error("Dashboard Load Error:", error);
          toast.error("Failed to load dashboard data: " + error.message);
        }
      })();
    }
  }, [currentUser, getDoctorsForPatient, getReportsForPatient]);

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleToggleAccess = async (doctorId, doctorName, isPrimary) => {
    if (isPrimary) {
      toast.error('Cannot revoke access from your primary doctor');
      return;
    }

    const updated = await toggleDoctorAccess(currentUser.uid, doctorId);
    if (updated) {
      const freshDoctors = await getDoctorsForPatient(currentUser.uid);
      setDoctors(freshDoctors);
      const entry = updated.find((d) => d.doctorId === doctorId);
      if (entry?.accessStatus === 'revoked') {
        toast.success(`Access revoked for ${doctorName}`);
      } else {
        toast.success(`Access restored for ${doctorName}`);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <BackgroundDecoration />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-lg shadow-brand-500/25">
                  <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                    Cardio<span className="text-gradient">Vision</span>{' '}
                    <span className="text-xs font-semibold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md ml-0.5">AI</span>
                  </h1>
                  <p className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">Patient Portal</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-50 border border-success-100">
                  <User className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-medium text-success-700">
                    {userData?.name || 'Patient'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Welcome, {userData?.name || 'Patient'} 👋
            </h2>
            <p className="text-slate-500">
              Patient ID:{' '}
              <span className="font-mono font-semibold text-brand-600">
                {userData?.patientId || '—'}
              </span>
            </p>
          </motion.div>

          {/* Info banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-800 mb-0.5">Read-Only Access</p>
              <p className="text-xs text-brand-600 leading-relaxed">
                You can view your ECG reports and manage which doctors have access to your data.
                Only your doctor can upload and analyze ECG reports.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── My Doctors ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">My Doctors</h3>
                    <p className="text-xs text-slate-500">Manage who can access your data</p>
                  </div>
                </div>
              </div>

              {doctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Stethoscope className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm">No doctors assigned yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {doctors.map((doc, i) => {
                    const isPrimary = doc.role === 'primary';
                    const isActive  = doc.accessStatus === 'active';

                    return (
                      <motion.div
                        key={doc.doctorId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-6 py-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-brand-50' : 'bg-slate-100'
                          }`}>
                            <Stethoscope className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-sm font-semibold truncate ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                {doc.name}
                              </p>
                              {isPrimary && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                                  <Crown className="w-3 h-3" />
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className={`text-xs ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                              {doc.specialization}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <p className="text-[10px] text-slate-400">
                                Added {new Date(doc.addedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Toggle */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-100 text-success-700">
                                <ShieldCheck className="w-3 h-3" />
                                Always Active
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleAccess(doc.doctorId, doc.name, isPrimary)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                  isActive
                                    ? 'bg-danger-50 text-danger-600 hover:bg-danger-100 border border-danger-200'
                                    : 'bg-success-50 text-success-600 hover:bg-success-100 border border-success-200'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <ShieldOff className="w-3.5 h-3.5" />
                                    Revoke Access
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Restore Access
                                  </>
                                )}
                              </button>
                            )}

                            {!isPrimary && (
                              <span className={`text-[10px] font-medium ${isActive ? 'text-success-500' : 'text-danger-500'}`}>
                                {isActive ? 'Can view your data' : 'Access revoked'}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* ── My Reports ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">My ECG Reports</h3>
                    <p className="text-xs text-slate-500">View your analysis results</p>
                  </div>
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Activity className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">No reports yet</p>
                  <p className="text-sm text-slate-400 max-w-xs">
                    When your doctor uploads and analyzes your ECG, the results will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <motion.div
                      key={report.id}
                      onClick={() => navigate(`/report/${currentUser.uid}/${report.id}`)}
                      className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{report.condition}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(report.analyzedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          report.severity === 'critical' ? 'bg-danger-100 text-danger-700' :
                          report.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-success-100 text-success-700'
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Patient info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6"
          >
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
              Your Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Patient ID', value: userData?.patientId || '—', mono: true },
                { label: 'Full Name', value: userData?.name || '—' },
                { label: 'Age', value: userData?.age ? `${userData.age} years` : '—' },
                { label: 'Gender', value: userData?.gender || '—' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">{label}</p>
                  <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono text-brand-600' : ''}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
