// --- UTILITAIRES ---
const getUsers = () => JSON.parse(localStorage.getItem("wishlyUsers") || "[]");
const saveUsers = (data) => localStorage.setItem("wishlyUsers", JSON.stringify(data));

// --- SIGNUP / LOGIN ---
if (document.getElementById("signup-form")) {
  document.getElementById("signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("email").value.trim(); // champ renommé username
    const pass = document.getElementById("password").value.trim();

    if (!username || !pass) return alert("Fill all fields");

    let users = getUsers();
    let existing = users.find((u) => u.username === username);

    if (!existing) {
      users.push({ username, pass, wishlists: [] });
      saveUsers(users);
      alert("Account created!");
    } else if (existing.pass !== pass) {
      return alert("Wrong password!");
    }

    localStorage.setItem("activeUser", username);
    window.location.href = "dashboard.html";
  });
}

// --- DASHBOARD ---
if (document.getElementById("new-list-form")) {
  const username = localStorage.getItem("activeUser");
  if (!username) window.location.href = "signup.html";

  let users = getUsers();
  let user = users.find((u) => u.username === username);

  const form = document.getElementById("new-list-form");
  const nameInput = document.getElementById("list-name");
  const container = document.getElementById("lists-container");
  const logout = document.getElementById("logout");

  // --- Boutons logout et suppression de compte ---
  const header = document.querySelector("header");
  const deleteAccountBtn = document.createElement("button");
  deleteAccountBtn.textContent = "Delete Account";
  deleteAccountBtn.className = "text-sm bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl ml-3";
  header.appendChild(deleteAccountBtn);

  logout.addEventListener("click", () => {
    localStorage.removeItem("activeUser");
    window.location.href = "signup.html";
  });

  deleteAccountBtn.addEventListener("click", () => {
    if (confirm("Delete your account and all wishlists?")) {
      let users = getUsers().filter((u) => u.username !== username);
      saveUsers(users);
      localStorage.removeItem("activeUser");
      window.location.href = "signup.html";
    }
  });

  // --- Afficher les listes ---
  const renderLists = () => {
    container.innerHTML = "";
    user.wishlists.forEach((list, idx) => {
      const div = document.createElement("div");
      div.className = "bg-white/10 border border-white/10 rounded-2xl p-5 shadow-lg relative";

      div.innerHTML = `
        <button data-del-list="${idx}" class="absolute top-3 right-3 text-red-400 hover:text-red-600 text-lg">✖</button>
        <h3 class="font-bold text-lg text-purple-300 mb-3">${list.name}</h3>
        <ul class="space-y-1 text-gray-200 mb-3">
          ${list.items
            .map(
              (i, j) =>
                `<li class="flex justify-between items-center">• ${i}
                  <button data-del-item="${idx}-${j}" class="text-red-400 hover:text-red-600 text-sm ml-2">✖</button>
                </li>`
            )
            .join("")}
        </ul>
        <form data-index="${idx}" class="add-item-form flex gap-2">
          <input type="text" placeholder="Add item..." class="flex-grow p-2 rounded-xl text-black" />
          <button class="bg-purple-600 hover:bg-purple-700 px-3 rounded-xl">Add</button>
        </form>
      `;
      container.appendChild(div);
    });
  };

  // --- Créer une nouvelle liste ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!nameInput.value.trim()) return;
    user.wishlists.push({ name: nameInput.value.trim(), items: [] });
    nameInput.value = "";
    saveUsers(users);
    renderLists();
  });

  // --- Supprimer une wishlist entière OU un article ---
  container.addEventListener("click", (e) => {
    // Supprimer une wishlist
    if (e.target.dataset.delList !== undefined) {
      const index = e.target.dataset.delList;
      if (confirm("Delete this wishlist?")) {
        user.wishlists.splice(index, 1);
        saveUsers(users);
        renderLists();
      }
    }

    // Supprimer un article
    if (e.target.dataset.delItem !== undefined) {
      const [listIdx, itemIdx] = e.target.dataset.delItem.split("-").map(Number);
      user.wishlists[listIdx].items.splice(itemIdx, 1);
      saveUsers(users);
      renderLists();
    }
  });

  // --- Ajouter un article ---
  container.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!e.target.classList.contains("add-item-form")) return;
    const idx = e.target.dataset.index;
    const input = e.target.querySelector("input");
    if (!input.value.trim()) return;
    user.wishlists[idx].items.push(input.value.trim());
    input.value = "";
    saveUsers(users);
    renderLists();
  });

  renderLists();
}

// --- EXPLORE ---
if (document.getElementById("explore-container")) {
  const container = document.getElementById("explore-container");
  const users = getUsers();

  users.forEach((u) => {
    u.wishlists.forEach((list) => {
      const div = document.createElement("div");
      div.className = "bg-white/10 border border-white/10 rounded-2xl p-5 shadow-lg";
      div.innerHTML = `
        <h3 class="font-bold text-lg text-purple-300 mb-1">${list.name}</h3>
        <p class="text-xs text-gray-400 mb-2">by ${u.username}</p>
        <ul class="text-sm text-gray-200 space-y-1">
          ${list.items.map((i) => `<li>• ${i}</li>`).join("")}
        </ul>
      `;
      container.appendChild(div);
    });
  });
}
