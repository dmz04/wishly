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

// ensure only logged-in users can access dashboard; then load user's wishlists
onAuthStateChanged(auth, async (user) => {
  if (window.location.pathname.includes("dashboard.html")) {
    if (!user) {
      window.location.href = "signup.html";
      return;
    }

    // load wishlists for this user (non-realtime; refresh-based)
    await loadUserWishlists(user.uid);

    // create wishlist handler (only attach once)
    if (newListForm && !newListForm._attached) {
      newListForm._attached = true;
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
          await loadUserWishlists(user.uid);
        } catch (error) {
          console.error("Erreur création wishlist :", error);
          alert("Erreur création wishlist : " + error.message);
        }
      });
    }

    // logout
    if (logoutBtn && !logoutBtn._attached) {
      logoutBtn._attached = true;
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "signup.html";
      });
    }
  }
});

// ==========================
// 🧾 Load user wishlists (dashboard)
// ==========================
async function loadUserWishlists(userId) {
  if (!listsContainer) return;
  listsContainer.innerHTML = "<p class='text-gray-400'>Chargement...</p>";

  // load wishlists created by this user, newest first
  const q = query(collection(db, "wishlists"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  listsContainer.innerHTML = "";
  let found = false;

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    if (data.userId !== userId) continue;
    found = true;

    const wishlistId = docSnap.id;
    // create card
    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-4 space-y-3 shadow-md";

    // header with toggle
    const header = document.createElement("div");
    header.className = "flex justify-between items-center cursor-pointer";
    header.innerHTML = `<p class="font-semibold text-lg">${escapeHtml(data.name)}</p>
                        <div class="flex items-center gap-2">
                          <button data-id="${wishlistId}" class="delete-wishlist text-sm text-red-400 hover:text-red-500">🗑️</button>
                          <button class="toggle-items text-sm text-gray-300">Show</button>
                        </div>`;

    card.appendChild(header);

    // items container (hidden by default)
    const itemsContainer = document.createElement("div");
    itemsContainer.className = "items-container mt-3 hidden";

    // placeholder while loading items
    itemsContainer.innerHTML = `<p class="text-gray-400 italic">Aucun souhait encore 💭</p>`;
    card.appendChild(itemsContainer);

    // add item form
    const addForm = document.createElement("form");
    addForm.className = "add-item-form mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center";
    addForm.setAttribute("data-id", wishlistId);
    addForm.innerHTML = `
      <input name="name" type="text" placeholder="Item name" class="p-2 rounded-xl text-black" />
      <input name="price" type="text" placeholder="Price (ex: $49)" class="p-2 rounded-xl text-black" />
      <div class="flex gap-2">
        <input name="link" type="url" placeholder="Link (optional)" class="flex-grow p-2 rounded-xl text-black" />
        <button class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-white">Add</button>
      </div>
    `;
    // form is hidden initially (shows when toggled)
    addForm.style.display = "none";
    card.appendChild(addForm);

    listsContainer.appendChild(card);

    // attach toggle handler
    const toggleBtn = header.querySelector(".toggle-items");
    toggleBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const isHidden = itemsContainer.classList.contains("hidden");
      if (isHidden) {
        toggleBtn.textContent = "Hide";
        // fetch items and populate
        await loadItemsForWishlist(wishlistId, itemsContainer);
        itemsContainer.classList.remove("hidden");
        addForm.style.display = ""; // show form
      } else {
        toggleBtn.textContent = "Show";
        itemsContainer.classList.add("hidden");
        addForm.style.display = "none";
      }
    });

    // attach delete wishlist handler
    const deleteBtn = header.querySelector(".delete-wishlist");
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const confirmed = confirm("Supprimer cette wishlist ? Cette action est irréversible.");
      if (!confirmed) return;
      try {
        // delete all items subcollection first
        await deleteAllItemsInWishlist(wishlistId);
        // delete wishlist doc
        await deleteDoc(doc(db, "wishlists", wishlistId));
        await loadUserWishlists(userId);
      } catch (err) {
        console.error("Erreur suppression wishlist:", err);
        alert("Erreur suppression wishlist: " + err.message);
      }
    });

    // attach add item handler
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = addForm.getAttribute("data-id");
      const formData = new FormData(addForm);
      const name = (formData.get("name") || "").toString().trim();
      const price = (formData.get("price") || "").toString().trim();
      const link = (formData.get("link") || "").toString().trim();

      if (!name) return alert("Entrez le nom de l'item");
      try {
        // add item as subcollection under wishlist
        await addDoc(collection(db, "wishlists", id, "items"), {
          name,
          price,
          link,
          createdAt: new Date()
        });
        // reload items (and keep expanded)
        await loadItemsForWishlist(id, itemsContainer);
        addForm.querySelector('input[name="name"]').value = "";
        addForm.querySelector('input[name="price"]').value = "";
        addForm.querySelector('input[name="link"]').value = "";
      } catch (err) {
        console.error("Erreur ajout item:", err);
        alert("Erreur ajout item: " + err.message);
      }
    });
  }

  if (!found) {
    listsContainer.innerHTML = `<p class='text-gray-400 italic text-center'>You haven’t created any wishlists yet 💫</p>`;
  }
}

// ==========================
// 🔁 Load items for a wishlist (subcollection)
// ==========================
async function loadItemsForWishlist(wishlistId, container) {
  container.innerHTML = "<p class='text-gray-400 italic'>Chargement des items...</p>";
  const itemsQ = query(collection(db, "wishlists", wishlistId, "items"), orderBy("createdAt", "desc"));
  const itemsSnap = await getDocs(itemsQ);
  container.innerHTML = "";

  if (itemsSnap.empty) {
    container.innerHTML = `<p class="text-gray-500 italic">Aucun souhait encore 💭</p>`;
    return;
  }

  // list items
  itemsSnap.forEach((itemDoc) => {
    const it = itemDoc.data();
    const row = document.createElement("div");
    row.className = "flex justify-between items-center gap-4 py-2 border-b border-white/5";

    const left = document.createElement("div");
    left.className = "text-left";
    left.innerHTML = `<p class="text-gray-200 font-medium">${escapeHtml(it.name)}</p>
                      <p class="text-sm text-gray-400">${escapeHtml(it.price || "")}</p>
                      ${it.link ? `<a class="text-xs underline text-gray-300" href="${escapeHtmlAttr(it.link)}" target="_blank" rel="noopener noreferrer">Open link</a>` : ""}`;

    const right = document.createElement("div");
    const delBtn = document.createElement("button");
    delBtn.className = "text-red-400 hover:text-red-500";
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const confirmed = confirm("Supprimer cet item ?");
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, "wishlists", wishlistId, "items", itemDoc.id));
        // reload items
        await loadItemsForWishlist(wishlistId, container);
      } catch (err) {
        console.error("Erreur suppression item:", err);
        alert("Erreur suppression item: " + err.message);
      }
    });

    right.appendChild(delBtn);
    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

// ==========================
// 🔥 Utility: delete all items in wishlist before deleting wishlist
// ==========================
async function deleteAllItemsInWishlist(wishlistId) {
  const itemsQ = query(collection(db, "wishlists", wishlistId, "items"));
  const itemsSnap = await getDocs(itemsQ);
  const promises = itemsSnap.docs.map((d) => deleteDoc(doc(db, "wishlists", wishlistId, "items", d.id)));
  await Promise.all(promises);
}

// ==========================
// 🏠 PAGE INDEX (index.html) - show public wishlists and summary of items
// ==========================
const exploreContainer = document.getElementById("explore-container");
if (exploreContainer) {
  loadPublicWishlists();
}

async function loadPublicWishlists() {
  exploreContainer.innerHTML = "<p class='text-gray-400'>Chargement des wishlists...</p>";
  const q = query(collection(db, "wishlists"), orderBy("createdAt", "desc"));
  const wishSnap = await getDocs(q);
  exploreContainer.innerHTML = "";

  if (wishSnap.empty) {
    exploreContainer.innerHTML = `<p class="text-gray-400 italic text-center">No wishlists yet 💫</p>`;
    return;
  }

  for (const docSnap of wishSnap.docs) {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-lg hover:scale-105 transition";

    // get a preview of up to 3 items (non-blocking)
    const itemsQ = query(collection(db, "wishlists", docSnap.id, "items"), orderBy("createdAt", "desc"));
    const itemsSnap = await getDocs(itemsQ);

    const itemsHtml = itemsSnap.empty
      ? `<p class="text-gray-500 italic text-sm">No items yet 💭</p>`
      : Array.from(itemsSnap.docs).slice(0, 3).map(d => `<p class="text-gray-300 text-sm">• ${escapeHtml(d.data().name)}</p>`).join("");

    card.innerHTML = `
      <p class="font-semibold mb-1">${escapeHtml(data.name)}</p>
      ${itemsHtml}
    `;
    exploreContainer.appendChild(card);
  }
}

// ==========================
// 🔧 Helper: escape HTML (very small sanitizer)
// ==========================
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function escapeHtmlAttr(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

