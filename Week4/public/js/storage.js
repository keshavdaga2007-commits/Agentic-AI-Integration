// storage.js
// Include this file in every HTML page using:
// <script src="js/storage.js"></script>
// Then call these functions directly from your own JS.

const STORAGE_KEY = "ft_transactions";
const SETTINGS_KEY = "ft_settings";

// Returns all transactions as an array
function getTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Adds one transaction. Pass an object like:
// { description, amount, type: "income"/"expense", category, date }
function addTransaction(transaction) {
  const transactions = getTransactions();
  transaction.id = Date.now();
  transactions.push(transaction);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Deletes a transaction by its id
function deleteTransaction(id) {
  const filtered = getTransactions().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Deletes ALL transactions (use on settings/reset page)
function clearTransactions() {
  localStorage.removeItem(STORAGE_KEY);
}

// Returns current balance (income minus expenses)
function getBalance() {
  return getTransactions().reduce((total, t) => {
    return t.type === "income" ? total + t.amount : total - t.amount;
  }, 0);
}

// Returns total income
function getTotalIncome() {
  return getTransactions()
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

// Returns total expenses
function getTotalExpenses() {
  return getTransactions()
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

// Returns expenses grouped by category, e.g. { Food: 1200, Rent: 8000 }
// Useful for drawing charts on the reports page
function getCategoryTotals() {
  const totals = {};
  getTransactions()
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
  return totals;
}

// Returns saved settings (budget goal, currency, dark mode preference)
function getSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : { budget: 0, currency: "₹", darkMode: false };
}

// Saves settings object back to localStorage
function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
