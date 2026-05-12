import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, FileUp } from 'lucide-react';

export default function UploadZone({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div
        id="upload-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`
          relative group cursor-pointer
          w-full max-w-2xl mx-auto
          rounded-2xl border-2 border-dashed
          transition-all duration-300 ease-out
          ${
            isDragging
              ? 'border-brand-400 bg-brand-50/80 shadow-xl shadow-brand-500/10 scale-[1.02]'
              : 'border-slate-300 bg-white hover:border-brand-300 hover:bg-brand-50/30 hover:shadow-lg hover:shadow-brand-500/5'
          }
        `}
      >
        {/* Inner Content */}
        <div className="flex flex-col items-center justify-center py-16 px-6">
          {/* Icon Container */}
          <div
            className={`
              relative flex items-center justify-center w-20 h-20 rounded-2xl mb-6
              transition-all duration-300
              ${
                isDragging
                  ? 'bg-brand-100 shadow-lg shadow-brand-500/20'
                  : 'bg-slate-100 group-hover:bg-brand-100 group-hover:shadow-md group-hover:shadow-brand-500/10'
              }
            `}
          >
            <Upload
              className={`w-8 h-8 transition-colors duration-300 ${
                isDragging ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500'
              }`}
            />
            {/* Floating icons */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2"
            >
              <div className="w-8 h-8 rounded-lg bg-white shadow-md border border-slate-100 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-brand-500" />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-2 -left-2"
            >
              <div className="w-7 h-7 rounded-lg bg-white shadow-md border border-slate-100 flex items-center justify-center">
                <FileUp className="w-3.5 h-3.5 text-brand-400" />
              </div>
            </motion.div>
          </div>

          {/* Text */}
          <p className="text-lg font-semibold text-slate-700 mb-1">
            {isDragging ? 'Drop your ECG image here' : 'Drag & drop your ECG image'}
          </p>
          <p className="text-sm text-slate-400 mb-5">
            Supports PNG, JPG, JPEG — up to 10MB
          </p>

          {/* Browse Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:from-brand-700 hover:to-brand-600 transition-all duration-200 active:scale-[0.97]"
          >
            <Upload className="w-4 h-4" />
            Browse Files
          </button>
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
          id="ecg-file-input"
        />

        {/* Hover glow effect */}
        <div
          className={`
            absolute inset-0 rounded-2xl pointer-events-none
            transition-opacity duration-300
            ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
          style={{
            background:
              'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.04), transparent 40%)',
          }}
        />
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-slate-400 mt-4">
        Your images are processed locally and never stored on our servers.
      </p>
    </motion.div>
  );
}
