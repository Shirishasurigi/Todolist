// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBv58zOZJf5VKF30qm_74_cShgFE4-pQE0",
  authDomain: "todolist-49753.firebaseapp.com",
  projectId: "todolist-49753",
  storageBucket: "todolist-49753.appspot.com",
  messagingSenderId: "514280220962",
  appId: "1:514280220962:web:d9b629b0f823a696aa9d7b",
  measurementId: "G-FCFR1RTY11"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const userEmailSpan = document.getElementById("userEmail");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loader = document.getElementById("loader");

const todoModal = document.getElementById("todoModal");
const closeModalBtn = document.getElementById("closeModal");
const addBtn = document.getElementById("addBtn");

const dailyList = document.getElementById("dailyList");
const repeatingList = document.getElementById("repeatingList");
const specifiedList = document.getElementById("specifiedList");

const logoutBtn = document.getElementById("logoutBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsDropdown = document.getElementById("settingsDropdown");

// Auth State Listener
auth.onAuthStateChanged(user => {
  if (user) {
    authSection.style.display = "none";
    dashboard.style.display = "block";
    userEmailSpan.textContent = user.email;
    loadTodos();
  } else {
    authSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

// Signup Function
function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  loader.style.display = "block";
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      loader.style.display = "none";
      alert("Account created!");
    })
    .catch(error => {
      loader.style.display = "none";
      alert(error.message);
    });
}

// Login Function
function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  loader.style.display = "block";
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loader.style.display = "none";
    })
    .catch(error => {
      loader.style.display = "none";
      alert(error.message);
    });
}

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Add Task
function addTodo() {
  const taskText = document.getElementById("todoInput").value;
  const taskType = document.getElementById("taskType").value;

  if (taskText.trim() === "") {
    alert("Please enter a task.");
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  db.collection("todos").add({
    uid: user.uid,
    text: taskText,
    type: taskType,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    completed: false,                
    lastCompletedDate: null
  }).then(() => {
    document.getElementById("todoInput").value = "";
    todoModal.classList.add("hidden");
    loadTodos();
  }).catch(err => {
    console.error("Error adding task:", err);
  });
}

// Load Tasks
function loadTodos() {
  const user = auth.currentUser;
  if (!user) return;

  dailyList.innerHTML = "";
  repeatingList.innerHTML = "";
  specifiedList.innerHTML = "";

  db.collection("todos")
    .where("uid", "==", user.uid)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const id = doc.id;
        const task = doc.data();

        // --- Reset DAILY tasks if a new day has started ---
        if (task.type === "daily" && task.completed) {
          const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
          const last = task.lastCompletedDate || null;
          if (last !== today) {
            // Reset in Firestore
            db.collection("todos").doc(id).update({
              completed: false,
              lastCompletedDate: null
            });
            // Reflect immediately in UI object
            task.completed = false;
            task.lastCompletedDate = null;
          }
        }

        // --- Build list item ---
        const li = document.createElement("li");
        li.className = "todo-item";
        if (task.completed) li.classList.add("completed");

        const textSpan = document.createElement("span");
        textSpan.textContent = task.text;

        // ✅ Complete / Undo
        const completeBtn = document.createElement("button");
        completeBtn.textContent = task.completed ? "↩️ Undo" : "✅";
        completeBtn.title = task.completed ? "Mark as not completed" : "Mark as completed";
        completeBtn.addEventListener("click", () => toggleComplete(id, task));

        // 🗑 Delete
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.title = "Delete task";
        delBtn.addEventListener("click", () => deleteTask(id));

        li.appendChild(textSpan);
        li.appendChild(completeBtn);
        li.appendChild(delBtn);

        // --- Append to the correct container ---
        if (task.type === "daily") {
          dailyList.appendChild(li);
        } else if (task.type === "repeating") {
          repeatingList.appendChild(li);
        } else {
          specifiedList.appendChild(li);
        }
      });
    })
    .catch(error => {
      console.error("Error loading todos:", error);
    });
}

function toggleComplete(id, task) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const willComplete = !task.completed;

  const updates = {
    completed: willComplete
  };

  // For DAILY tasks, record the date when completing; clear it when undoing
  if (task.type === "daily") {
    updates.lastCompletedDate = willComplete ? today : null;
  }

  db.collection("todos").doc(id).update(updates).then(loadTodos);
}

function deleteTask(id) {
  if (confirm("Delete this task?")) {
    db.collection("todos").doc(id).delete().then(loadTodos);
  }
}

// Show/Hide Modal
addBtn.addEventListener("click", () => {
  todoModal.classList.remove("hidden");
  document.getElementById("todoInput").focus();
});
closeModalBtn.addEventListener("click", () => {
  document.getElementById("todoInput").value = "";
  todoModal.classList.add("hidden");
});

// Settings Dropdown
settingsBtn.addEventListener("click", () => {
  settingsDropdown.classList.toggle("hidden");
});

// Profile Placeholder
function showProfile() {
  alert("Profile feature coming soon.");
}

// Dark Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}
