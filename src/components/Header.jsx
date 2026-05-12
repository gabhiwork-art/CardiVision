import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass border-b border-slate-200/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-lg shadow-brand-500/25">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 animate-pulse-ring opacity-0" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Cardio<span className="text-gradient">Vision</span>{' '}
                <span className="text-xs font-semibold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md ml-0.5">
                  AI
                </span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">
                Deep Learning ECG Analysis
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-2">
            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors px-3 py-2 rounded-lg hover:bg-brand-50"
            >
              How it works
            </a>
            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors px-3 py-2 rounded-lg hover:bg-brand-50"
            >
              About
            </a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
