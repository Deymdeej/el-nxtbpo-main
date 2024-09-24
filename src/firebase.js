import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD4ZgbPlgVIQ0C4nXWdEmMMtTzaUuMSxBc",
    authDomain: "practice-nxtbpo.firebaseapp.com",
    projectId: "practice-nxtbpo",
    storageBucket: "practice-nxtbpo.appspot.com",
    messagingSenderId: "315527530355",
    appId: "1:315527530355:web:bd8efcfc4dd0a5b4cc2706",
    measurementId: "G-K29CMDK13V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
