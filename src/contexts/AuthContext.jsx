import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../firebase/config';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components -- companion hook to AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/* ════════════════════════════════════════════════════════════
   AUTH PROVIDER
   ════════════════════════════════════════════════════════════ */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData]       = useState(null);
  const [loading, setLoading]         = useState(true);

  /* ── Listen to Firebase auth state changes ──────────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        // Load profile from Firestore — check doctors first, then patients
        try {
          const doctorSnap = await getDoc(doc(db, 'doctors', firebaseUser.uid));
          if (doctorSnap.exists()) {
            setUserData({ id: firebaseUser.uid, ...doctorSnap.data() });
          } else {
            const patientSnap = await getDoc(doc(db, 'patients', firebaseUser.uid));
            if (patientSnap.exists()) {
              setUserData({ id: firebaseUser.uid, ...patientSnap.data() });
            } else {
              setUserData(null);
            }
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          setUserData(null);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ── Doctor Signup ─────────────────────────────────────── */
  const doctorSignup = useCallback(async ({ email, password, name, specialization }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    const profile = {
      name,
      email,
      specialization,
      role: 'doctor',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'doctors', uid), profile);
    // userData will be set by onAuthStateChanged listener
    return { uid, email };
  }, []);

  /* ── Doctor Login ──────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { uid: credential.user.uid, email: credential.user.email };
  }, []);

  // Deprecated: Patients now login directly with Email + Password
  /* ── Logout ────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  /* ── Update user profile ─────────────────────────────────
     Handles:
       - password change (Firebase Auth)
       - Firestore profile fields (e.g. firstLogin flag)
  ─────────────────────────────────────────────────────────── */
  const updateUserProfile = useCallback(async (uid, updates) => {
    const { password: newPassword, ...firestoreUpdates } = updates;

    // Update password in Firebase Auth if provided
    if (newPassword && auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }

    // Update profile fields in Firestore
    if (Object.keys(firestoreUpdates).length > 0) {
      // Try doctors first, then patients
      const doctorRef = doc(db, 'doctors', uid);
      const doctorSnap = await getDoc(doctorRef);
      if (doctorSnap.exists()) {
        await updateDoc(doctorRef, firestoreUpdates);
      } else {
        await updateDoc(doc(db, 'patients', uid), firestoreUpdates);
      }

      // Keep local state in sync
      setUserData((prev) => (prev ? { ...prev, ...firestoreUpdates } : prev));
    }
  }, []);

  /* ── Get user profile by uid ───────────────────────────── */
  const getUserProfile = useCallback(async (uid) => {
    // Check doctors first
    const doctorSnap = await getDoc(doc(db, 'doctors', uid));
    if (doctorSnap.exists()) return { id: uid, ...doctorSnap.data() };

    const patientSnap = await getDoc(doc(db, 'patients', uid));
    if (patientSnap.exists()) return { id: uid, ...patientSnap.data() };

    return null;
  }, []);

  /* ── Create patient account (used by doctor) ────────────
     Uses the Firebase REST API to create a new user without
     modifying the current user session.
  ─────────────────────────────────────────────────────────── */
  const createPatientAccount = useCallback(async ({ email, password, profile }) => {
    try {
      console.log('[createPatientAccount] Creating Auth user via REST API...', { email });
      
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const apiError = errorData.error?.message || 'UNKNOWN_ERROR';
        console.error('[createPatientAccount] REST API Error:', apiError);
        
        const err = new Error(apiError);
        if (apiError === 'EMAIL_EXISTS') err.code = 'auth/email-already-in-use';
        else if (apiError === 'WEAK_PASSWORD') err.code = 'auth/weak-password';
        else if (apiError === 'OPERATION_NOT_ALLOWED') err.code = 'auth/operation-not-allowed';
        else err.code = 'auth/unknown';
        throw err;
      }

      const data = await response.json();
      const uid = data.localId;
      console.log('[createPatientAccount] Auth user created successfully:', uid);

      console.log('[createPatientAccount] Writing Firestore patient doc...', { uid });
      await setDoc(doc(db, 'patients', uid), {
        ...profile,
        role: 'patient',
        createdAt: serverTimestamp(),
      });
      console.log('[createPatientAccount] Firestore write OK');

      return uid;
    } catch (err) {
      console.error('[createPatientAccount] Failed:', err?.code, err?.message, err);
      throw err;
    }
  }, []);

  /* ── Get all patients for a doctor ─────────────────────── */
  const getPatientsForDoctor = useCallback(async (doctorId) => {
    if (!doctorId) return [];

    // Query patients whose authorizedDoctorIds flat array contains this doctor
    const q = query(
      collection(db, 'patients'),
      where('authorizedDoctorIds', 'array-contains', doctorId)
    );
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      const doctorsList = Array.isArray(data.authorizedDoctors) ? data.authorizedDoctors : [];
      const idList = Array.isArray(data.authorizedDoctorIds) ? data.authorizedDoctorIds : [];
      const onCareTeam =
        idList.includes(doctorId) || idList.some((id) => String(id) === String(doctorId));

      const doctorEntry = doctorsList.find(
        (e) => e?.doctorId === doctorId || String(e?.doctorId) === String(doctorId)
      );

      const inferredRole =
        data.primaryDoctorId === doctorId || String(data.primaryDoctorId) === String(doctorId)
          ? 'primary'
          : doctorEntry?.role || 'secondary';

      // If this doctor is on authorizedDoctorIds but the nested entry is missing or odd-shaped,
      // still treat as active so the dashboard lists them (rules already allowed the read).
      const accessStatus =
        doctorEntry?.accessStatus ?? (onCareTeam ? 'active' : 'unknown');

      return {
        id: d.id,
        ...data,
        accessStatus,
        doctorRole: inferredRole,
      };
    });
  }, []);

  /* ── Check if doctor has active access to a patient ────── */
  const checkDoctorAccess = useCallback(async (doctorId, patientUid) => {
    const snap = await getDoc(doc(db, 'patients', patientUid));
    if (!snap.exists()) return false;

    const { authorizedDoctors } = snap.data();
    if (!authorizedDoctors) return false;

    const entry = authorizedDoctors.find((d) => d.doctorId === doctorId);
    return entry?.accessStatus === 'active';
  }, []);

  /* ── Get all doctors for a patient ─────────────────────── */
  const getDoctorsForPatient = useCallback(async (patientUid) => {
    const snap = await getDoc(doc(db, 'patients', patientUid));
    if (!snap.exists()) return [];

    const { authorizedDoctors, primaryDoctorId } = snap.data();
    if (!authorizedDoctors) return [];

    // Fetch each doctor's profile
    const results = await Promise.all(
      authorizedDoctors.map(async (entry) => {
        const doctorSnap = await getDoc(doc(db, 'doctors', entry.doctorId));
        const doctorData = doctorSnap.exists() ? doctorSnap.data() : {};
        const role =
          entry.doctorId === primaryDoctorId ? 'primary' : entry.role || 'secondary';
        return {
          ...entry,
          role,
          name: doctorData.name || 'Unknown Doctor',
          email: doctorData.email || '',
          specialization: doctorData.specialization || '',
        };
      })
    );

    return results;
  }, []);

  /* ── Toggle doctor access (patient action) ─────────────── */
  const toggleDoctorAccess = useCallback(async (patientUid, doctorId) => {
    const patientRef = doc(db, 'patients', patientUid);
    const snap = await getDoc(patientRef);
    if (!snap.exists()) return null;

    const { authorizedDoctors, primaryDoctorId } = snap.data();
    if (!authorizedDoctors) return null;

    const updatedDoctors = authorizedDoctors.map((d) => {
      if (d.doctorId === doctorId && d.doctorId !== primaryDoctorId) {
        return {
          ...d,
          accessStatus: d.accessStatus === 'active' ? 'revoked' : 'active',
        };
      }
      return d;
    });

    const authorizedDoctorIds = updatedDoctors
      .filter((d) => d.accessStatus === 'active')
      .map((d) => d.doctorId);

    await updateDoc(patientRef, { authorizedDoctors: updatedDoctors, authorizedDoctorIds });

    // Update local state
    setUserData((prev) =>
      prev
        ? { ...prev, authorizedDoctors: updatedDoctors, authorizedDoctorIds }
        : prev
    );

    return updatedDoctors;
  }, []);

  /* ── Save a new report ─────────────────────────────────── */
  const saveReport = useCallback(async (patientId, reportData) => {
    const reportRef = await addDoc(
      collection(db, 'patients', patientId, 'reports'),
      {
        ...reportData,
        patientId,
        analyzedAt: serverTimestamp(),
      }
    );
    return reportRef.id;
  }, []);

  /* ── Get all reports for a patient ─────────────────────── */
  const getReportsForPatient = useCallback(async (patientId) => {
    const q = query(
      collection(db, 'patients', patientId, 'reports'),
      orderBy('analyzedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      // Convert Firestore Timestamp to ISO string for display
      analyzedAt: d.data().analyzedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }));
  }, []);

  /* ── Get a specific report by ID ───────────────────────── */
  const getReportById = useCallback(async (patientId, reportId) => {
    const snap = await getDoc(doc(db, 'patients', patientId, 'reports', reportId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      analyzedAt: data.analyzedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  }, []);

  /* ── Get notes for a report ────────────────────────────── */
  const getNotesForReport = useCallback(async (patientId, reportId) => {
    const q = query(
      collection(db, 'patients', patientId, 'reports', reportId, 'notes'),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }));
  }, []);

  /* ── Add a note to a report ────────────────────────────── */
  const addNoteToReport = useCallback(async (patientId, reportId, noteData) => {
    const noteRef = await addDoc(
      collection(db, 'patients', patientId, 'reports', reportId, 'notes'),
      {
        ...noteData,
        createdAt: serverTimestamp(),
      }
    );
    return { id: noteRef.id, ...noteData, createdAt: new Date().toISOString() };
  }, []);

  /* ── Context value ─────────────────────────────────────── */
  const value = {
    currentUser,
    userData,
    loading,
    doctorSignup,
    login,
    logout,
    updateUserProfile,
    getUserProfile,
    createPatientAccount,
    getPatientsForDoctor,
    checkDoctorAccess,
    getDoctorsForPatient,
    toggleDoctorAccess,
    saveReport,
    getReportsForPatient,
    getReportById,
    getNotesForReport,
    addNoteToReport,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
