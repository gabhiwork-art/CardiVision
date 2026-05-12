import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Calendar, Users, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

function generatePatientId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000); // 5-digit
  return `PAT-${year}-${rand}`;
}

function generateTempPassword() {
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `ECG@${rand}`;
}

export default function AddPatientModal({ isOpen, onClose, onPatientCreated }) {
  const { createPatientAccount, currentUser } = useAuth();

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const resetForm = () => {
    setForm({ name: '', age: '', gender: '', email: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) return toast.error('Please enter patient name');
    if (!form.age || isNaN(form.age) || +form.age < 1 || +form.age > 150)
      return toast.error('Please enter a valid age');
    if (!form.gender) return toast.error('Please select gender');
    if (!form.email.trim() || !form.email.includes('@'))
      return toast.error('Please enter a valid email');

    setIsSubmitting(true);

    try {
      const patientId = generatePatientId();
      const tempPassword = generateTempPassword();
      const doctorId = currentUser.uid;

      const profile = {
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        contact: form.email.trim(),
        email: form.email.trim(),
        patientId,
        primaryDoctorId: doctorId,
        authorizedDoctors: [
          {
            doctorId,
            role: 'primary',
            accessStatus: 'active',
            addedAt: new Date().toISOString(),
          },
        ],
        // Flat array for Firestore array-contains queries
        authorizedDoctorIds: [doctorId],
        firstLogin: true,
      };

      const uid = await createPatientAccount({
        email: form.email.trim(),
        password: tempPassword,
        profile,
      });

      toast.success('Patient account created!');
      resetForm();

      onPatientCreated({
        uid,
        patientId,
        tempPassword,
        name: form.name.trim(),
        email: form.email.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        primaryDoctorId: doctorId,
        authorizedDoctorIds: [doctorId],
      });
    } catch (err) {
      console.error('Patient creation error:', err.code, err.message, err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('A patient with this email already exists');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Generated password is too weak');
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password sign-in is not enabled in Firebase Console');
      } else {
        toast.error(`Failed to create patient: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Add New Patient</h3>
                    <p className="text-xs text-slate-500">Create a patient account</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="patient-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="patient-name"
                      type="text"
                      value={form.name}
                      onChange={updateField('name')}
                      placeholder="Patient full name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                    />
                  </div>
                </div>

                {/* Age + Gender row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="patient-age" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Age
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="patient-age"
                        type="number"
                        min="1"
                        max="150"
                        value={form.age}
                        onChange={updateField('age')}
                        placeholder="Age"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="patient-gender" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        id="patient-gender"
                        value={form.gender}
                        onChange={updateField('gender')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all appearance-none"
                      >
                        <option value="" disabled>Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="patient-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="patient-email"
                      type="email"
                      value={form.email}
                      onChange={updateField('email')}
                      placeholder="patient@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                    />
                  </div>
                </div>

                {/* Info box */}
                <div className="bg-brand-50 rounded-xl p-3 flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-[10px] font-bold text-brand-600">i</span>
                  </div>
                  <p className="text-xs text-brand-700 leading-relaxed">
                    A unique Patient ID and temporary password will be auto-generated.
                    The patient must change their password on first login.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:from-brand-700 hover:to-brand-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Patient Account
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
