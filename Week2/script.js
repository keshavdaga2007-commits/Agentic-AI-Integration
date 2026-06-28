// ── State ──────────────────────────────────────────────
let tasks = [];
let currentFilter = "all";
let taskIdCounter = 1;

// ── Element references ────────────────────────────────
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const emptyState = document.getElementById("emptyState");
const notification = document.getElementById("notification");
const filterButtons = document.querySelectorAll(".filter-btn");

// ── Notifications ──────────────────────────────────────
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = "notification show " + type;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 2500);
}

// ── Add task ───────────────────────────────────────────
taskForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const value = taskInput.value.trim();

  if (value === "") {
    taskInput.classList.add("input-error");
    showNotification("Task can't be empty.", "error");

    setTimeout(() => {
      taskInput.classList.remove("input-error");
    }, 1500);

    return;
  }

  const newTask = {
    id: taskIdCounter++,
    text: value,
    completed: false,
  };

  tasks.push(newTask);
  taskInput.value = "";

  showNotification("Task added.", "success");
  renderTasks();
});

// ── Toggle complete ────────────────────────────────────
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }
}

// ── Delete task ────────────────────────────────────────
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  showNotification("Task deleted.", "success");
  renderTasks();
}

// ── Edit task ──────────────────────────────────────────
function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const updated = prompt("Edit task:", task.text);

  if (updated === null) return; // cancelled

  const trimmed = updated.trim();

  if (trimmed === "") {
    showNotification("Task can't be empty.", "error");
    return;
  }

  task.text = trimmed;
  showNotification("Task updated.", "success");
  renderTasks();
}

// ── Filters ────────────────────────────────────────────
filterButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

function getFilteredTasks() {
  if (currentFilter === "active") {
    return tasks.filter((t) => !t.completed);
  }
  if (currentFilter === "completed") {
    return tasks.filter((t) => t.completed);
  }
  return tasks;
}

// ── Render ─────────────────────────────────────────────
function renderTasks() {
  const filtered = getFilteredTasks();

  taskList.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "No tasks yet. Add one above to get started.";
  } else if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "No tasks in this view.";
  } else {
    emptyState.classList.add("hidden");
  }

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} />
      <span class="task-text"></span>
      <div class="task-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // Set text safely (avoids HTML injection from user input)
    li.querySelector(".task-text").textContent = task.text;

    li.querySelector(".task-checkbox").addEventListener("click", () => toggleTask(task.id));
    li.querySelector(".edit-btn").addEventListener("click", () => editTask(task.id));
    li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  taskCount.textContent = `${activeCount} of ${tasks.length} task${tasks.length !== 1 ? "s" : ""} left`;
}

// ── Initial render ─────────────────────────────────────
renderTasks();
