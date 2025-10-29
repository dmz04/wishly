// --- IMPORT FIREBASE MODULES ---
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --- GET FIREBASE INSTANCES FROM window ---
const auth = window.app ? getAuth(window.app) : null;
const db = window.app ? getFirestore(window.app) : null;

// --- SIGN UP / LOGIN ---
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      const email = `${username}@wishly.app`; // hidden email, used only for Firebase

      // Try to sign in; if user not found, create new account
      await signInWithEmailAndPassword(auth, email, password).catch(async (error) => {
        if (error.code === "auth/user-not-found") {
          await createUserWithEmailAndPassword(auth, email, password);

          // Save username in Firestore
          const userDocRef = doc(db, "users", username);
          await setDoc(userDocRef, {
            username: username,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw error;
        }
      });

      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  });
}

// --- LOGOUT ---
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "signup.html";
  });
}

// --- CREATE NEW WISHLIST ---
const newListForm = document.getElementById("new-list-form");
if (newListForm) {
  newListForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const listName = document.getElementById("list-name").value.trim();
    if (!listName) return alert("Please enter a wishlist name.");

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login first.");
        return;
      }

      // Get username from Firestore
      const usernameKey = user.email.split("@")[0];
      const userDoc = await getDoc(doc(db, "users", usernameKey));
      const username = userDoc.exists() ? userDoc.data().username : "Unknown";

      await addDoc(collection(db, "wishlists"), {
        name: listName,
        owner: username, // use username instead of email
        createdAt: new Date().toISOString()
      });

      document.getElementById("list-name").value = "";
      alert("Wishlist created!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error creating wishlist: " + error.message);
    }
  });
}

// --- DISPLAY ALL WISHLISTS ON INDEX PAGE ---
const exploreContainer = document.getElementById("explore-container");
if (exploreContainer) {
  const q = query(collection(db, "wishlists"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  exploreContainer.innerHTML = "";

  if (snapshot.empty) {
    exploreContainer.innerHTML =
      `<p class="text-gray-400 italic w-full">No wishlists yet 💫</p>`;
  } else {
    snapshot.forEach((doc) => {
      const data = doc.data();
      exploreContainer.innerHTML += `
        <div class="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20">
          <h4 class="text-lg font-semibold text-white/90 group-hover:text-purple-400 transition">${data.name}</h4>
          <p class="text-sm text-gray-400 mt-2">by ${data.owner}</p>
        </div>
      `;
    });
  }
}

