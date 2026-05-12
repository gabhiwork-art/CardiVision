import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Users, Activity, Stethoscope, Plus, User, ChevronRight, ChevronDown, ShieldOff, ShieldCheck, Crown, Search, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BackgroundDecoration from '../components/BackgroundDecoration';
import AddPatientModal from '../components/AddPatientModal';
import PatientCredCard from '../components/PatientCredCard';

export default function DoctorDashboard() {
  const { userData, logout, currentUser, getPatientsForDoctor } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [credentials, setCredentials]   = useState(null);
  const [patients, setPatients]         = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [expandedReports, setExpandedReports] = useState([]);
  const { getReportsForPatient } = useAuth();

  const loadPatients = useCallback(() => {
    if (!currentUser?.uid) return;
    getPatientsForDoctor(currentUser.uid)
      .then(setPatients)
      .catch((err) => {
        console.error('[DoctorDashboard] getPatientsForDoctor failed:', err?.code, err?.message, err);
        toast.error(
          err?.code === 'permission-denied'
            ? 'Could not load patients (permission denied). Deploy latest Firestore rules.'
            : 'Could not load patient list. See console for details.'
        );
      });
  }, [currentUser, getPatientsForDoctor]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const refreshPatients = loadPatients;

  /* ── Derived data ───────────────────────────────────────── */
  const activePatients  = patients.filter((p) => p.accessStatus === 'active');
  const revokedPatients = patients.filter((p) => p.accessStatus === 'revoked');

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q)
    );
  });

  /* ── Handlers ───────────────────────────────────────────── */
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handlePatientCreated = (creds) => {
    setShowAddModal(false);
    setCredentials(creds);

    // Optimistic row so the list updates even if the query is slow or rules lag
    if (currentUser?.uid && creds?.uid) {
      const optimistic = {
        id: creds.uid,
        name: creds.name,
        email: creds.email,
        patientId: creds.patientId,
        age: creds.age,
        gender: creds.gender,
        primaryDoctorId: creds.primaryDoctorId ?? currentUser.uid,
        authorizedDoctorIds: creds.authorizedDoctorIds ?? [currentUser.uid],
        accessStatus: 'active',
        doctorRole: 'primary',
      };
      setPatients((prev) => {
        const rest = prev.filter((p) => p.id !== optimistic.id);
        return [optimistic, ...rest];
      });
    }

    refreshPatients();
  };

  const handleRowClick = async (patient) => {
    if (patient.accessStatus !== 'active') {
      toast.error(`Access to ${patient.name} has been revoked by the patient`);
      return;
    }
    if (expandedPatientId === patient.id) {
      setExpandedPatientId(null);
    } else {
      setExpandedPatientId(patient.id);
      const reports = await getReportsForPatient(patient.id);
      setExpandedReports(reports);
    }
  };

  const handleAnalyzeEcg = (patient) => {
    navigate('/ecg', { state: { patient } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <BackgroundDecoration />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-slate-200/60">
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
                  <p className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">Doctor Dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-100">
                  <Stethoscope className="w-4 h-4 text-brand-500" />
                  <span className="text-sm font-medium text-brand-700">
                    {userData?.name || 'Doctor'}
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

        {/* Main content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Welcome, {userData?.name || 'Doctor'} 👋
            </h2>
            <p className="text-slate-500">
              {userData?.specialization || 'Specialization'} &bull; Manage your patients and analyze ECGs
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {[
              { icon: Users, label: 'Active Patients', value: String(activePatients.length), color: 'text-brand-600', bg: 'bg-brand-50' },
              { icon: ShieldOff, label: 'Revoked Access', value: String(revokedPatients.length), color: 'text-danger-600', bg: 'bg-danger-50' },
              { icon: Activity, label: 'ECGs Analyzed', value: '0', color: 'text-success-600', bg: 'bg-success-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Patients section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
          >
            {/* Section header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">My Patients</h3>
                <p className="text-sm text-slate-500">
                  {activePatients.length} active · {revokedPatients.length} revoked
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                {patients.length > 0 && (
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-52 pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                    />
                  </div>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:from-brand-700 hover:to-brand-600 transition-all duration-200 active:scale-[0.97] shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Patient
                </button>
              </div>
            </div>

            {patients.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium mb-1">No patients yet</p>
                <p className="text-sm text-slate-400 max-w-sm">
                  Click "Add Patient" to create a patient account and start analyzing ECGs.
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              /* No search results */
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Search className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No patients match "{searchQuery}"</p>
              </div>
            ) : (
              /* Patient list */
              <div className="divide-y divide-slate-100">
                {filteredPatients.map((patient, i) => {
                  const isActive = patient.accessStatus === 'active';
                  const isPrimary = patient.doctorRole === 'primary';
                  const isExpanded = expandedPatientId === patient.id;

                  return (
                    <motion.div
                      key={patient.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`transition-colors border-b border-slate-100 last:border-0 ${
                        isActive ? 'group' : 'bg-slate-50/40 opacity-70'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-4 px-6 py-4 cursor-pointer ${
                          isActive && !isExpanded ? 'hover:bg-slate-50/80' : ''
                        } ${isExpanded ? 'bg-slate-50/80' : ''}`}
                        onClick={() => isActive && handleRowClick(patient)}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-brand-50' : 'bg-slate-100'
                        }`}>
                          <User className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                              {patient.name}
                            </p>
                            {isPrimary && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                                <Crown className="w-2.5 h-2.5" />
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            <span className="font-mono font-medium text-brand-500">{patient.patientId}</span>
                            {' · '}
                            {patient.age}y · {patient.gender}
                          </p>
                        </div>

                        {/* Status */}
                        {isActive ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-100 text-success-700">
                              <ShieldCheck className="w-3 h-3" />
                              Active
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-brand-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-danger-100 text-danger-600 shrink-0">
                            <ShieldOff className="w-3 h-3" />
                            Revoked
                          </span>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-800">Past ECG Reports</h4>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAnalyzeEcg(patient); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-100 text-brand-700 text-xs font-semibold hover:bg-brand-200 transition-colors"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              Analyze New ECG
                            </button>
                          </div>
                          
                          {expandedReports.length === 0 ? (
                            <div className="text-center py-6 bg-white rounded-xl border border-slate-200 border-dashed">
                              <p className="text-sm text-slate-400">No reports found for this patient.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {expandedReports.map(report => (
                                <div
                                  key={report.id}
                                  onClick={(e) => { e.stopPropagation(); navigate(`/report/${patient.id}/${report.id}`); }}
                                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm cursor-pointer transition-all"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-brand-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">{report.condition}</p>
                                    <p className="text-xs text-slate-400">{new Date(report.analyzedAt).toLocaleString()}</p>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    report.severity === 'critical' ? 'bg-danger-100 text-danger-700' :
                                    report.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                                    'bg-success-100 text-success-700'
                                  }`}>
                                    {report.severity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPatientCreated={handlePatientCreated}
      />

      <AnimatePresence>
        {credentials && (
          <PatientCredCard
            credentials={credentials}
            onClose={() => { setCredentials(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
