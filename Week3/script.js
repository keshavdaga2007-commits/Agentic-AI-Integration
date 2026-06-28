// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
const API_KEY = "AQ.Ab8RN6JC69YTP0gsByJKTHoy8im9f4Z0ZVJq8KPqu3_vv4jqBA";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// ── State ──────────────────────────────────────────────────
let tasks = [];
let currentFilter = "all";
let taskIdCounter = 1;

// ── Element refs ───────────────────────────────────────────
const goalInput    = document.getElementById("goalInput");
const generateBtn  = document.getElementById("generateBtn");
const loadingState = document.getElementById("loadingState");
const aiResults    = document.getElementById("aiResults");
const aiTaskList   = document.getElementById("aiTaskList");
const aiError      = document.getElementById("aiError");

const taskForm   = document.getElementById("taskForm");
const taskInput  = document.getElementById("taskInput");
const taskList   = document.getElementById("taskList");
const taskCount  = document.getElementById("taskCount");
const emptyState = document.getElementById("emptyState");
const notification = document.getElementById("notification");

// ── Generate tasks from Gemini ─────────────────────────────
async function generateTasks() {
  const goal = goalInput.value.trim();

  if (!goal) {
    goalInput.focus();
    return;
  }

  // Reset UI
  aiError.classList.add("hidden");
  aiResults.classList.add("hidden");
  loadingState.classList.remove("hidden");
  generateBtn.disabled = true;

  const prompt = `You are a task planning assistant. 
Break down the following goal into 5 to 8 clear, actionable tasks.
Goal: "${goal}"
Return ONLY a JSON object. No explanation, no markdown, no extra text.
The JSON must follow this exact structure:
{
  "tasks": [
    {
      "task_name": "string",
      "priority": "High" | "Medium" | "Low",
      "estimated_time": "string (e.g. 30 minutes, 2 hours)"
    }
  ]
}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              tasks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    task_name:      { type: "STRING" },
                    priority:       { type: "STRING" },
                    estimated_time: { type: "STRING" }
                  }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No response from Gemini.");

    const parsed = JSON.parse(text);
    const generatedTasks = parsed.tasks;

    if (!generatedTasks || generatedTasks.length === 0) {
      throw new Error("Gemini returned an empty task list. Try rephrasing your goal.");
    }

    renderAITasks(generatedTasks);

  } catch (err) {
    aiError.textContent = `Something went wrong: ${err.message}`;
    aiError.classList.remove("hidden");
  } finally {
    loadingState.classList.add("hidden");
    generateBtn.disabled = false;
  }
}

// ── Render AI-generated tasks ──────────────────────────────
function renderAITasks(generatedTasks) {
  aiTaskList.innerHTML = "";

  generatedTasks.forEach((task, index) => {
    const card = document.createElement("div");
    card.className = "ai-task-card";
    card.dataset.index = index;

    const priorityClass = {
      "High":   "priority-high",
      "Medium": "priority-medium",
      "Low":    "priority-low"
    }[task.priority] || "priority-medium";

    card.innerHTML = `
      <div class="ai-task-left">
        <div class="ai-task-name"></div>
        <div class="ai-task-meta">
          <span class="priority-tag ${priorityClass}">${task.priority}</span>
          <span class="ai-task-time">⏱ ${task.estimated_time}</span>
        </div>
      </div>
      <button class="btn-add-task" onclick="addAITask(this, '${index}')">+ Add</button>
    `;

    // Set text safely
    card.querySelector(".ai-task-name").textContent = task.task_name;

    // Store task data on element
    card.dataset.taskName = task.task_name;

    aiTaskList.appendChild(card);
  });

  aiResults.classList.remove("hidden");
}

// ── Add AI task to the manual list ────────────────────────
function addAITask(btn, index) {
  if (btn.classList.contains("added")) return;

  const card = document.querySelector(`.ai-task-card[data-index="${index}"]`);
  const taskName = card.dataset.taskName;

  addTaskToList(taskName);

  btn.textContent = "✓ Added";
  btn.classList.add("added");
  card.classList.add("added");

  showNotification(`"${taskName}" added to your tasks.`, "success");
}

// ── Allow Enter key to trigger generate ───────────────────
goalInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") generateTasks();
});

// ── Manual task form ───────────────────────────────────────
function addTask(e) {
  e.preventDefault();
  const value = taskInput.value.trim();

  if (!value) {
    taskInput.classList.add("input-error");
    showNotification("Task can't be empty.", "error");
    setTimeout(() => taskInput.classList.remove("input-error"), 1500);
    return;
  }

  addTaskToList(value);
  taskInput.value = "";
  showNotification("Task added.", "success");
}

function addTaskToList(text) {
  tasks.push({ id: taskIdCounter++, text, completed: false });
  renderTasks();
}

// ── Toggle / Edit / Delete ─────────────────────────────────
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.completed = !task.completed; renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  showNotification("Task deleted.", "success");
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const updated = prompt("Edit task:", task.text);
  if (updated === null) return;

  const trimmed = updated.trim();
  if (!trimmed) { showNotification("Task can't be empty.", "error"); return; }

  task.text = trimmed;
  showNotification("Task updated.", "success");
  renderTasks();
}

// ── Filters ────────────────────────────────────────────────
function setFilter(btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.filter;
  renderTasks();
}

function getFilteredTasks() {
  if (currentFilter === "active")    return tasks.filter(t => !t.completed);
  if (currentFilter === "completed") return tasks.filter(t => t.completed);
  return tasks;
}

// ── Render task list ───────────────────────────────────────
function renderTasks() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.textContent = "No tasks yet.";
    emptyState.classList.remove("hidden");
  } else if (filtered.length === 0) {
    emptyState.textContent = "No tasks in this view.";
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filtered.forEach(task => {
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

    li.querySelector(".task-text").textContent = task.text;
    li.querySelector(".task-checkbox").addEventListener("click", () => toggleTask(task.id));
    li.querySelector(".edit-btn").addEventListener("click",      () => editTask(task.id));
    li.querySelector(".delete-btn").addEventListener("click",    () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  const activeCount = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${activeCount} of ${tasks.length} task${tasks.length !== 1 ? "s" : ""} left`;
}

// ── Notification ───────────────────────────────────────────
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = "notification show " + type;
  setTimeout(() => notification.classList.remove("show"), 2500);
}

// ── Init ───────────────────────────────────────────────────
renderTasks();
