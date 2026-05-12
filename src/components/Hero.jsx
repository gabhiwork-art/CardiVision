import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

const features = [
  { icon: Zap, label: 'Instant Results' },
  { icon: ShieldCheck, label: '95%+ Accuracy' },
  { icon: Sparkles, label: 'AI-Powered' },
];

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="text-center mb-10"
    >
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6"
      >
        <Sparkles className="w-4 h-4" />
        Powered by Deep Learning
      </motion.div>

      {/* Headline */}
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-4">
        Instant ECG{' '}
        <span className="text-gradient">Analysis</span>
      </h2>

      {/* Sub-headline */}
      <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
        Upload a 12-lead ECG image and our AI will classify cardiac conditions
        in seconds — with clinical-grade accuracy you can trust.
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {features.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600"
          >
            <Icon className="w-4 h-4 text-brand-500" />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
