import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { Server } from 'lucide-react';

/* ── Existing components (UNTOUCHED) ─────────────────────── */
import Header from './components/Header';
import Hero from './components/Hero';
import UploadZone from './components/UploadZone';
import ProcessingState from './components/ProcessingState';
import ResultsCard from './components/ResultsCard';
import Footer from './components/Footer';
import BackgroundDecoration from './components/BackgroundDecoration';

/* ── New pages ───────────────────────────────────────────── */
import LoginPage from './pages/LoginPage';
import DoctorSignupPage from './pages/DoctorSignupPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReportView from './pages/ReportView';
import ProtectedRoute from './components/ProtectedRoute';

/* ─────────────────────────────────────────────────────────────
   ML API Configuration
   ───────────────────────────────────────────────────────────── */
const API_BASE = 'https://abhijeet24121-reportsvisionmlserver.hf.space';

// Map API predicted_class → human-readable condition name
const CLASS_LABELS = {
  'Normal':                'Normal Sinus Rhythm',
  'Myocardial_Infarction': 'Myocardial Infarction',
  'History_of_MI':         'History of Myocardial Infarction',
  'Abnormal_Heartbeat':    'Abnormal Heartbeat',
};

// Map API predicted_class → severity level for UI styling
const CLASS_SEVERITY = {
  'Normal':                'normal',
  'Myocardial_Infarction': 'critical',
  'History_of_MI':         'warning',
  'Abnormal_Heartbeat':    'warning',
};

// Map API predicted_class → clinical description
const CLASS_DESCRIPTIONS = {
  'Normal':
    'The ECG shows a normal sinus rhythm with regular P waves, consistent PR intervals, and narrow QRS complexes. No abnormalities detected.',
  'Myocardial_Infarction':
    'ST-segment elevation detected, consistent with an acute myocardial infarction. Immediate clinical correlation and intervention is recommended.',
  'History_of_MI':
    'ECG patterns suggest a previous myocardial infarction. Pathological Q waves and T-wave inversions are present. Follow-up cardiac evaluation is recommended.',
  'Abnormal_Heartbeat':
    'Irregular cardiac rhythm detected. The ECG shows deviations from normal sinus rhythm that warrant further clinical evaluation and monitoring.',
};

/* ─────────────────────────────────────────────────────────────
   ECG Analysis Page — now powered by real ML API
   ───────────────────────────────────────────────────────────── */
function EcgAnalysisPage() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [apiError, setApiError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'waking', 'offline'

  // Ping the ML Server to check if it's awake
  useEffect(() => {
    let isMounted = true;
    
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (!isMounted) return;
        
        if (res.ok) {
          setServerStatus('online');
        } else if (res.status === 503) {
          setServerStatus('waking');
        } else {
          setServerStatus('offline');
        }
      } catch (err) {
        if (isMounted) setServerStatus('offline');
      }
    };

    checkHealth();
    // Re-check every 15 seconds if it's waking up
    const interval = setInterval(() => {
      if (serverStatus !== 'online') {
        checkHealth();
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [serverStatus]);

  // Get patient context if navigated from doctor dashboard
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state?.patient || null;

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadedFile(file);
    setPhase('processing');
    setResult(null);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 503) {
        throw new Error('The ML Server is currently waking up from sleep. Please wait a few seconds and try again.');
      }
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      // data = { predicted_class, confidence, all_probabilities, inference_time_ms }

      const predictedClass = data.predicted_class;
      const confidencePercent = Math.round(data.confidence * 100);

      setResult({
        condition:   CLASS_LABELS[predictedClass]       || predictedClass.replace(/_/g, ' '),
        confidence:  confidencePercent,
        severity:    CLASS_SEVERITY[predictedClass]      || 'warning',
        description: CLASS_DESCRIPTIONS[predictedClass]  || `Detected: ${predictedClass}. Please consult a cardiologist for detailed interpretation.`,
        allProbabilities: data.all_probabilities,
        inferenceTimeMs:  data.inference_time_ms,
      });
      setPhase('results');
    } catch (err) {
      console.error('ECG analysis failed:', err);
      setApiError(err.message || 'Analysis failed');
      setPhase('idle');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setPhase('idle');
  }, [previewUrl]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <BackgroundDecoration />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* Patient context and Server Status banner */}
        <div className="bg-brand-50 border-b border-brand-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {patient ? (
                <p className="text-sm text-brand-700 border-r border-brand-200 pr-4">
                  Analyzing ECG for{' '}
                  <strong className="font-semibold">{patient.name}</strong>
                  <span className="font-mono text-brand-500 ml-1.5 text-xs">({patient.patientId})</span>
                </p>
              ) : null}
              
              {/* ML Server Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-brand-200 shadow-sm">
                <Server className={`w-3.5 h-3.5 ${
                  serverStatus === 'online' ? 'text-success-500' :
                  serverStatus === 'waking' ? 'text-amber-500 animate-pulse' :
                  'text-slate-400'
                }`} />
                <span className={`text-[10px] font-bold tracking-wider uppercase ${
                  serverStatus === 'online' ? 'text-success-700' :
                  serverStatus === 'waking' ? 'text-amber-700' :
                  'text-slate-500'
                }`}>
                  {serverStatus === 'online' ? 'ML Server Online' :
                   serverStatus === 'waking' ? 'Waking ML Server...' :
                   serverStatus === 'checking' ? 'Checking ML Server...' :
                   'ML Server Offline'}
                </span>
                {serverStatus === 'online' && (
                  <span className="relative flex h-2 w-2 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/doctor')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <div key="idle" className="w-full max-w-3xl mx-auto">
                <Hero />
                <UploadZone onFileSelect={handleFileSelect} />
                {apiError && (
                  <div className="mt-4 bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-danger-500 text-lg mt-0.5">⚠</span>
                    <div>
                      <p className="text-sm font-semibold text-danger-700">Analysis Failed</p>
                      <p className="text-xs text-danger-600 mt-0.5">{apiError}. The ML server may be starting up — please try again in a moment.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {phase === 'processing' && (
              <ProcessingState
                key="processing"
                previewUrl={previewUrl}
                fileName={uploadedFile?.name}
              />
            )}
            {phase === 'results' && result && (
              <ResultsCard
                key="results"
                result={result}
                previewUrl={previewUrl}
                fileName={uploadedFile?.name}
                onReset={handleReset}
                patient={patient}
              />
            )}
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Smart redirect: send logged-in users to their dashboard
   ───────────────────────────────────────────────────────────── */
function AuthRedirect({ children }) {
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && userData) {
      if (userData.role === 'doctor') navigate('/doctor', { replace: true });
      else if (userData.role === 'patient') {
        // First-time patient → force password reset
        if (userData.firstLogin) navigate('/reset-password', { replace: true });
        else navigate('/patient', { replace: true });
      }
    }
  }, [loading, currentUser, userData, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If already logged in, the useEffect above will redirect
  if (currentUser && userData) return null;

  return children;
}

/* ─────────────────────────────────────────────────────────────
   Patient guard: redirect to reset-password if firstLogin
   ───────────────────────────────────────────────────────────── */
function PatientDashboardGuard() {
  const { userData } = useAuth();
  if (userData?.firstLogin) return <Navigate to="/reset-password" replace />;
  return <PatientDashboard />;
}

/* ─────────────────────────────────────────────────────────────
   App Router
   ───────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      {/* Root: Login page (redirect if already logged in) */}
      <Route path="/" element={
        <AuthRedirect><LoginPage /></AuthRedirect>
      } />
      <Route path="/login" element={
        <AuthRedirect><LoginPage /></AuthRedirect>
      } />
      <Route path="/signup" element={
        <AuthRedirect><DoctorSignupPage /></AuthRedirect>
      } />

      {/* Protected: Doctor dashboard */}
      <Route path="/doctor" element={
        <ProtectedRoute allowedRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      } />

      {/* Protected: ECG Analysis tool (doctors only) */}
      <Route path="/ecg" element={
        <ProtectedRoute allowedRole="doctor">
          <EcgAnalysisPage />
        </ProtectedRoute>
      } />

      {/* Protected: Patient first-login password reset */}
      <Route path="/reset-password" element={
        <ProtectedRoute allowedRole="patient">
          <ResetPasswordPage />
        </ProtectedRoute>
      } />

      {/* Protected: Patient dashboard (read-only) — redirect if firstLogin */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRole="patient">
          <PatientDashboardGuard />
        </ProtectedRoute>
      } />

      {/* Protected: Report view (both doctors and patients) */}
      <Route path="/report/:patientId/:id" element={
        <ProtectedRoute allowedRole={['doctor', 'patient']}>
          <ReportView />
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

