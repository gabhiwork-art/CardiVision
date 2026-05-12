import { motion } from 'framer-motion';
import { Copy, Printer, CheckCircle2, Key, IdCard, User, Mail, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PatientCredCard({ credentials, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!credentials) return null;

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handlePrint = () => {
    const printContent = `
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         CardioVision AI — Patient Credentials
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      Patient Name:  ${credentials.name}
      Patient Email: ${credentials.email}
      Patient ID:    ${credentials.patientId}
      Temp Password: ${credentials.tempPassword}

      ⚠️  Please change your password on first login.
      🔗  Login at: ${window.location.origin}/login
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    const win = window.open('', '_blank', 'width=500,height=400');
    win.document.write(`
      <html><head><title>Patient Credentials</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 30px; background: #f8fafc; }
        pre { white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1e293b; }
      </style></head>
      <body><pre>${printContent}</pre></body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden"
      >
        {/* Success header */}
        <div className="bg-success-50 border-b border-success-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
              >
                <CheckCircle2 className="w-7 h-7 text-success-600" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-success-800">Patient Created!</h3>
                <p className="text-xs text-success-600">Save these credentials — password shown only once</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-success-400 hover:text-success-600 hover:bg-success-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Credentials */}
        <div className="p-6 space-y-3">
          {/* Patient name */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Patient Name</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{credentials.name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Email</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{credentials.email}</p>
            </div>
          </div>

          {/* Patient ID — copiable */}
          <div
            onClick={() => copyToClipboard(credentials.patientId, 'Patient ID')}
            className="flex items-center gap-3 px-4 py-3 bg-brand-50 rounded-xl border border-brand-100 cursor-pointer hover:bg-brand-100/60 transition-colors group"
          >
            <IdCard className="w-4 h-4 text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-brand-400 uppercase tracking-wider font-medium">Patient ID</p>
              <p className="text-base font-bold text-brand-700 font-mono tracking-wide">{credentials.patientId}</p>
            </div>
            {copiedField === 'Patient ID' ? (
              <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-brand-300 group-hover:text-brand-500 shrink-0 transition-colors" />
            )}
          </div>

          {/* Temp password — copiable */}
          <div
            onClick={() => copyToClipboard(credentials.tempPassword, 'Password')}
            className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <Key className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Temporary Password</p>
              <p className="text-base font-bold text-amber-700 font-mono tracking-wide">{credentials.tempPassword}</p>
            </div>
            {copiedField === 'Password' ? (
              <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-amber-300 group-hover:text-amber-500 shrink-0 transition-colors" />
            )}
          </div>

          {/* Warning */}
          <div className="bg-danger-50 rounded-xl p-3 flex items-start gap-2">
            <span className="text-danger-500 text-sm mt-0.5">⚠️</span>
            <p className="text-xs text-danger-700 leading-relaxed">
              <strong>This password will not be shown again.</strong> Please save or print these credentials
              before closing this window. The patient must change their password on first login.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:from-brand-700 hover:to-brand-600 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
