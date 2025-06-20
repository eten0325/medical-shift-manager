// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // ここに先ほど取得した設定コードを貼り付け
  apiKey: "AIzaSyCwJyQ91X-y6bty4ONkP1xLaenKb12JxAg",
  authDomain: "STAFFSHIFT.firebaseapp.com",
  projectId: "staffshift-21705",
  storageBucket: "STAFFSHIFT.appspot.com",
  messagingSenderId: "1085721122741",
  appId: "1:1085721122741:web:7207793399d8e9ea3d6bfc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);