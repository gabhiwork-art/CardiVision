import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, ScanLine, Cpu, Activity } from 'lucide-react';

const STEPS = [
  { icon: ScanLine, label: 'Scanning ECG waveform patterns...',  duration: 1000 },
  { icon: Brain,    label: 'AI analyzing cardiac features...',    duration: 1000 },
  { icon: Cpu,      label: 'Computing classification confidence...', duration: 800 },
  { icon: Activity, label: 'Finalizing diagnosis report...',      duration: 200 },
];

export default function ProcessingState({ previewUrl, fileName }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let t = 0;
    const total = STEPS.reduce((s, x) => s + x.duration, 0);
    const id = setInterval(() => {
      t += 50;
      setProgress(Math.min((t / total) * 100, 100));
      let c = 0;
      for (let i = 0; i < STEPS.length; i++) {
        c += STEPS[i].duration;
        if (t < c) { setStep(i); break; }
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  const Icon = STEPS[step]?.icon || Activity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
        {/* Preview with scan overlay */}
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {previewUrl && (
            <img src={previewUrl} alt="ECG" className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0">
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-scan shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            >
              <Icon className="w-8 h-8 text-brand-400" />
            </motion.div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Brain className="w-5 h-5 text-brand-600" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [.5, 0, .5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-xl border-2 border-brand-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Analyzing ECG Image</p>
              <p className="text-xs text-slate-400 truncate">{fileName || 'ecg-image.png'}</p>
            </div>
            <span className="text-sm font-bold text-brand-600 tabular-nums">{Math.round(progress)}%</span>
          </div>

          {/* Bar */}
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
              style={{ width: `${progress}%` }}
            />
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {STEPS.map(({ icon: I, label }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  i < step ? 'bg-success-100 text-success-600'
                  : i === step ? 'bg-brand-100 text-brand-600'
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : <I className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-sm ${i <= step ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{label}</span>
                {i === step && (
                  <motion.div animate={{ opacity: [.3, 1, .3] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-500 ml-auto" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
