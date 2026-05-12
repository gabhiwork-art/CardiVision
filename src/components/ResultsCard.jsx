import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, XCircle, RotateCcw,
  Heart, FileText, Clock, TrendingUp, Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  normal: {
    icon: CheckCircle2,
    color: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-200',
    barColor: 'from-success-500 to-success-400',
    badgeBg: 'bg-success-100',
    badgeText: 'text-success-700',
    label: 'Normal',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    barColor: 'from-amber-500 to-amber-400',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    label: 'Attention Required',
  },
  critical: {
    icon: XCircle,
    color: 'text-danger-600',
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    barColor: 'from-danger-500 to-danger-400',
    badgeBg: 'bg-danger-100',
    badgeText: 'text-danger-700',
    label: 'Critical Finding',
  },
};

export default function ResultsCard({ result, previewUrl, fileName, onReset, patient }) {
  const cfg = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.normal;
  const StatusIcon = cfg.icon;
  const { saveReport, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!patient || !currentUser) return;
    setIsSaving(true);
    try {
      const reportId = await saveReport(patient.id, {
        condition: result.condition,
        confidence: result.confidence,
        severity: result.severity,
        description: result.description,
        analyzedBy: currentUser.uid,
      });
      toast.success('Report saved to patient record');
      navigate(`/report/${patient.id}/${reportId}`);
    } catch {
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 border ${cfg.border} overflow-hidden`}>
        {/* Status banner */}
        <div className={`${cfg.bg} px-6 py-4 border-b ${cfg.border}`}>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <StatusIcon className={`w-7 h-7 ${cfg.color}`} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-slate-500">Analysis completed successfully</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
              {result.confidence}% Confident
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Main result */}
          <div className="flex gap-5 mb-6">
            {/* ECG Thumbnail */}
            <div className="shrink-0 w-28 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              {previewUrl && (
                <img src={previewUrl} alt="ECG" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Predicted Condition</p>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{result.condition}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{result.description}</p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Confidence Score</span>
              <span className={`text-lg font-bold ${cfg.color}`}>{result.confidence}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor}`}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: FileText, label: 'File', value: fileName || 'ecg.png' },
              { icon: Clock, label: 'Time', value: '~3 sec' },
              { icon: TrendingUp, label: 'Model', value: 'ResNet-50' },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <I className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 rounded-xl p-3 mb-6 flex items-start gap-2">
            <Heart className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Disclaimer:</span> This AI prediction is for research and educational purposes only. Always consult a qualified cardiologist for clinical decisions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors ${patient ? '' : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 border-none'}`}
            >
              <RotateCcw className="w-4 h-4" />
              Scan Another
            </motion.button>
            
            {patient && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save to Patient Record
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
