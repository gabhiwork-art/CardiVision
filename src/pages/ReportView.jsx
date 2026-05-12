import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle,
  FileText, ArrowLeft, Send, Lock, Globe, User, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import BackgroundDecoration from '../components/BackgroundDecoration';

const SEVERITY_CONFIG = {
  normal: {
    icon: CheckCircle2,
    color: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-200',
    badgeBg: 'bg-success-100',
    badgeText: 'text-success-700',
    label: 'Normal',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    label: 'Attention Required',
  },
  critical: {
    icon: XCircle,
    color: 'text-danger-600',
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    badgeBg: 'bg-danger-100',
    badgeText: 'text-danger-700',
    label: 'Critical Finding',
  },
};

export default function ReportView() {
  // The route passes /:patientId/:reportId so both are available
  const { patientId, id: reportId } = useParams();
  const navigate  = useNavigate();

  const { getReportById, getNotesForReport, currentUser, userData, addNoteToReport } = useAuth();

  const [report, setReport]     = useState(null);
  const [notes, setNotes]       = useState([]);
  const [loadingReport, setLoadingReport] = useState(true);
  const [newNote, setNewNote]   = useState('');
  const [visibility, setVisibility] = useState('shared');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve patientId: prefer route param, fall back to report.patientId or current patient
  const resolvedPatientId = patientId || userData?.id;

  /* ── Load report & notes ─────────────────────────────────── */
  const loadData = useCallback(async () => {
    if (!resolvedPatientId || !reportId) {
      setLoadingReport(false);
      return;
    }
    setLoadingReport(true);
    try {
      const [r, n] = await Promise.all([
        getReportById(resolvedPatientId, reportId),
        getNotesForReport(resolvedPatientId, reportId),
      ]);
      if (!r) {
        toast.error('Report not found');
        navigate(-1);
        return;
      }
      setReport(r);
      setNotes(n);
    } catch (err) {
      console.error('ReportView loadData:', err);
      toast.error('Failed to load report');
      navigate(-1);
    } finally {
      setLoadingReport(false);
    }
  }, [resolvedPatientId, reportId, getReportById, getNotesForReport, navigate]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  /* ── Add note ────────────────────────────────────────────── */
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      const saved = await addNoteToReport(resolvedPatientId, reportId, {
        content: newNote.trim(),
        authorId: currentUser.uid,
        authorName: userData.name || 'Doctor',
        visibility,
      });
      toast.success('Note added');
      setNewNote('');
      setNotes((prev) => [...prev, saved]);
    } catch {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Derived ─────────────────────────────────────────────── */
  const isDoctor = userData?.role === 'doctor';

  const visibleNotes = notes.filter((n) => {
    if (n.visibility === 'shared') return true;
    if (isDoctor && n.authorId === currentUser?.uid) return true;
    return false;
  });

  /* ── Loading state ───────────────────────────────────────── */
  if (loadingReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading report…</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const cfg = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.normal;
  const StatusIcon = cfg.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <BackgroundDecoration />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* Top bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Report ID:</span>
                <span className="font-mono text-slate-700">{reportId}</span>
              </div>
              <button
                onClick={loadData}
                title="Refresh"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Report Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 border ${cfg.border} overflow-hidden`}
          >
            <div className={`${cfg.bg} px-6 py-4 border-b ${cfg.border} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-7 h-7 ${cfg.color}`} />
                <div>
                  <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-slate-500">
                    Analyzed on {new Date(report.analyzedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
                {report.confidence}% Confident
              </span>
            </div>

            <div className="p-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{report.condition}</h2>
              <p className="text-slate-600 leading-relaxed text-sm mb-6">{report.description}</p>

              <div className="flex items-center gap-4 border-t border-slate-100 pt-6 mt-6">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">
                    Patient ID: <span className="font-mono">{resolvedPatientId}</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-800">Clinical Notes</h3>
              {!isDoctor && (
                <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Shared notes only
                </span>
              )}
            </div>

            <div className="p-6 space-y-6">
              {visibleNotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No notes added to this report yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleNotes.map((note) => (
                    <div key={note.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-xs font-bold text-brand-600">
                          {note.authorName?.charAt(0) ?? 'D'}
                        </span>
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-sm p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-800">{note.authorName}</p>
                          <div className="flex items-center gap-2">
                            {note.visibility === 'private' ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" /> Private
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">
                                <Globe className="w-3 h-3" /> Shared
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Form — Doctors only */}
              {isDoctor && (
                <form onSubmit={handleAddNote} className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Add a Note</h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-400 transition-all">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type your clinical notes here…"
                      className="w-full p-4 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none min-h-[100px]"
                    />
                    <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            value="shared"
                            checked={visibility === 'shared'}
                            onChange={() => setVisibility('shared')}
                            className="text-brand-600 focus:ring-brand-500 w-4 h-4"
                          />
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Shared (Patient can see)
                          </span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={visibility === 'private'}
                            onChange={() => setVisibility('private')}
                            className="text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private (Only you)
                          </span>
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !newNote.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Post Note
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
