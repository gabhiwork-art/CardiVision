import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-400 flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-danger-400 fill-danger-400" /> using PyTorch &amp; React
          </p>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} CardioVision AI &mdash; For research purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
