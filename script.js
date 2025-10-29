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
  getDocs,
  deleteDoc,
  query,
  orderBy
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
      // 🔐 Connexion anonyme (pas d’email)
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
const newListForm = document.getElementById("new-list-form");
const listNameInput = document.getElementById("list-name");
const listsContainer = document.getElementById("lists-container");

onAuthStateChanged(auth, async (user) => {
  if (window.location.pathname.includes("dashboard.html")) {
    if (!user) {
      window.location.href = "signup.html";
      return;
    }

    // 🔄 Afficher les wishlists existantes
    loadUserWishlists(user.uid);

    // 🆕 Création d'une nouvelle liste
    if (newListForm) {
      newListForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const listName = listNameInput.value.trim();
        if (!listName) return alert("Entre un nom pour ta wishlist !");
        try {
          await addDoc(collection(db, "wishlists"), {
            userId: user.uid,
            name: listName,
            createdAt: new Date(),
          });
          listNameInput.value = "";
          loadUserWishlists(user.uid);
        } catch (error) {
          console.error("Erreur création wishlist :", error);
        }
      });
    }

    // 🚪 Déconnexion
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "signup.html";
      });
    }
  }
});

// 🧾 Charger les wishlists de l'utilisateur
async function loadUserWishlists(userId) {
  listsContainer.innerHTML = "<p class='text-gray-400'>Chargement...</p>";
  const q = query(collection(db, "wishlists"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  listsContainer.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.userId === userId) {
      const card = document.createElement("div");
      card.className =
        "bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex justify-between items-center";
      card.innerHTML = `
        <p class="font-semibold">${data.name}</p>
        <button data-id="${docSnap.id}" class="delete-btn text-sm text-red-400 hover:text-red-500">🗑️</button>
      `;
      listsContainer.appendChild(card);
    }
  });

  // ❌ Supprimer une wishlist
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await deleteDoc(doc(db, "wishlists", id));
      loadUserWishlists(userId);
    });
  });
}

// ==========================
// 🏠 PAGE INDEX (index.html)
// ==========================
const exploreContainer = document.getElementById("explore-container");

if (exploreContainer) {
  // 🔍 Charger toutes les wishlists publiques
  loadPublicWishlists();
}

async function loadPublicWishlists() {
  exploreContainer.innerHTML =
    "<p class='text-gray-400'>Chargement des wishlists...</p>";
  const q = query(collection(db, "wishlists"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  exploreContainer.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className =
      "bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-lg hover:scale-105 transition";
    card.innerHTML = `
      <p class="font-semibold mb-1">${data.name}</p>
      <p class="text-sm text-gray-400">👤 ${data.userId.slice(0, 6)}...</p>
    `;
    exploreContainer.appendChild(card);
  });
}

