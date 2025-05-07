import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA2XjNtmmqJRspCWHo86i-2xyjd4KafjPw",
    authDomain: "iotdash-101f7.firebaseapp.com",
    projectId: "iotdash-101f7",
    storageBucket: "iotdash-101f7",
    messagingSenderId: "950951407999",
    appId: "1:950951407999:web:620f8426db9c733a14aa4a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // ✅ add this

export { app, db, auth }; // ✅ also export auth
