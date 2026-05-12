// ┌──────────────────────────────────────────────────────────────────┐
// │  Firebase Configuration                                          │
// │  Paste your project credentials below to connect the app.       │
// └──────────────────────────────────────────────────────────────────┘

import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';

// TODO: Replace these placeholder values with your real Firebase project config.
// Find them at: https://console.firebase.google.com → Project Settings → Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyD9JHbkwrekuASubTv-r4EQjROIgIsnAT8",
  authDomain: "cardiovision-a366d.firebaseapp.com",
  projectId: "cardiovision-a366d",
  storageBucket: "cardiovision-a366d.firebasestorage.app",
  messagingSenderId: "702282256898",
  appId: "1:702282256898:web:47cda416ed37311708cd1b",
  measurementId: "G-85JW68X2HX"
};

const app = initializeApp(firebaseConfig);

// Primary auth — explicit persistence so the doctor's session
// is never disrupted by the secondary app instance.
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

// Secondary app instance used ONLY for creating patient accounts.
// This prevents createUserWithEmailAndPassword from auto-signing-in
// the new patient and logging out the doctor.
const secondaryApp  = initializeApp(firebaseConfig, 'patient-creator');
export const secondaryAuth = initializeAuth(secondaryApp, {
  persistence: inMemoryPersistence,
});

export const db = getFirestore(app);
export default app;
