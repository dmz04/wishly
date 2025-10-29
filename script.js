// ==========================
// 🔥 INITIALISATION FIREBASE
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBJ4g_rfs1aRtaIQLyr2Q6XCqw-fWnX4Fc",
  authDomain: "wishly-69749.firebaseapp.com",
  projectId: "wishly-69749",
  storageBucket: "wishly-69749.firebasestorage.app",
  messagingSenderId: "1050843898881",
  appId: "1:1050843898881:web:571a227a8e199439058c00",
  measurementId: "G-BL9W7H1VL2"
};

// --- INITIALISATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================
// ✨ PAGE SIGNUP (signup.html)
// ==========================
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();

    if (!username) {
      alert("Merci d’entrer un nom d’utilisateur !");
      return;
    }

    try {
      // 🔐 Connexion anonyme (pas d’email, pas de mot de passe)
      const userCred = await signInAnonymously(auth);
      const user = userCred.user;

      // 💾 Enregistre le pseudo dans Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        createdAt: new Date(),
      });

      alert("Bienvenue " + username + " !");
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("Erreur : " + error.message);
      console.error(error);
    }
  });
}

// ==========================
// 💜 PAGE DASHBOARD (dashboard.html)
// ==========================
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "signup.html";
  });
}

// ==========================
// 🏠 PAGE INDEX (index.html)
// ==========================
const exploreContainer = document.getElementById("explore-container");
if (exploreContainer) {
  // 🔍 Affichera les wishlists plus tard (quand les users les créeront)
  console.log("Page d'accueil chargée. Les wishlists apparaîtront ici bientôt !");
}

