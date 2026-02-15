
// Fix: Use compat version of Firebase to ensure compatibility with environments that might not fully support modular v9 exports.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyDN7ZJGWgdtrwYT78YFU8f_ldILsLgqNGA",
  authDomain: "mymess-7b167.firebaseapp.com",
  databaseURL: "https://mymess-7b167-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mymess-7b167",
  storageBucket: "mymess-7b167.firebasestorage.app",
  messagingSenderId: "60784874372",
  appId: "1:60784874372:android:40b04d659eee216bf303d1"
};

// Fix: Initialize Firebase using the compat pattern.
const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
export const auth = app.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const db = app.firestore();
export const rtdb = app.database();
