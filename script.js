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
  updateDoc,
  arrayUnion,
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
      const userCred = await signInAnonymously(auth);
      const user = userCred.user;

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
            items: [],
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
        "bg-white/10 backdrop-blur-lg rounded-2xl p-4 space-y-3 shadow-md";
      card.innerHTML = `
        <div class="flex justify-between items-center">
          <p class="font-semibold">${data.name}</p>
          <button data-id="${docSnap.id}" class="delete-btn text-sm text-red-400 hover:text-red-500">🗑️</button>
        </div>

        <div class="items space-y-1 mt-3">
          ${
            data.items && data.items.length
              ? data.items.map((item) => `<p class="text-gray-300">• ${item}</p>`).join("")
              : `<p class="text-gray-500 italic">Aucun souhait encore 💭</p>`
          }
        </div>

        <form data-id="${docSnap.id}" class="add-item-form flex gap-2 mt-3">
          <input type="text" placeholder="Add item..." class="flex-grow rounded-lg p-2 text-black">
          <button class="bg-purple-600 hover:bg-purple-700 px-3 rounded-lg text-sm">+</button>
        </form>
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

  // ➕ Ajouter un item dans une wishlist
  document.querySelectorAll(".add-item-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = form.getAttribute("data-id");
      const input = form.querySelector("input");
      const item = input.value.trim();
      if (!item) return;
      await updateDoc(doc(db, "wishlists", id), {
        items: arrayUnion(item),
      });
      input.value = "";
      loadUserWishlists(userId);
    });
  });
}

// ==========================
// 🏠 PAGE INDEX (index.html)
// ==========================
const exploreContainer = document.getElementById("explore-container");

if (exploreContainer) {
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
      ${
        data.items && data.items.length
          ? data.items.map((item) => `<p class="text-gray-300 text-sm">• ${item}</p>`).join("")
          : `<p class="text-gray-500 italic text-sm">No items yet 💭</p>`
      }
    `;
    exploreContainer.appendChild(card);
  });
}

