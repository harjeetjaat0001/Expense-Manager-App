// 1. Data Store karne ke liye Array (LocalStorage se read karega)
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// 2. DOM Elements Selection
const txForm = document.getElementById('tx-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');

const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const netBalanceEl = document.getElementById('net-balance');

const chartContainer = document.getElementById('chart');
const txList = document.getElementById('tx-list');
const filterMonth = document.getElementById('filter-month');
const filterCategory = document.getElementById('filter-category');

// Aaj ki date default set karna
if (dateInput) {
  dateInput.value = new Date().toISOString().split('T')[0];
}

// 3. LocalStorage mein Data Save karna
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// 4. Form Submit Event (Naya Transaction Add Karna)
if (txForm) {
  txForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTx = {
      id: Date.now(),
      desc: descInput.value.trim(),
      amount: parseFloat(amountInput.value),
      type: typeInput.value,
      category: categoryInput.value,
      date: dateInput.value
    };

    transactions.unshift(newTx); // Naye transaction ko sabse aage add kiya
    saveTransactions();
    updateApp();

    // Form Inputs Reset
    descInput.value = '';
    amountInput.value = '';
  });
}

// 5. Transaction Delete Function
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  updateApp();
}

// Global Scope me Expose karna taaki HTML onclick button se call ho sake
window.deleteTransaction = deleteTransaction;

// 6. Summary Calculation (Total Income, Expense, Balance)
function updateSummary() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const net = income - expenses;

  if (totalIncomeEl) totalIncomeEl.textContent = `$${income.toFixed(2)}`;
  if (totalExpensesEl) totalExpensesEl.textContent = `$${expenses.toFixed(2)}`;
  if (netBalanceEl) netBalanceEl.textContent = `$${net.toFixed(2)}`;
}

// 7. Expenses by Category Graph Render Function
function updateChart() {
  if (!chartContainer) return;

  const categories = ['food', 'transport', 'fun', 'others'];
  const catColors = {
    food: '#ff7675',
    transport: '#74b9ff',
    fun: '#a29bfe',
    others: '#ffeaa7'
  };

  let maxExpense = 0;
  const categoryTotals = {};

  // Category-wise totals calculate karna (Case-Insensitive)
  categories.forEach(cat => {
    const total = transactions
      .filter(t => t.type === 'expense' && t.category && t.category.toLowerCase() === cat)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    categoryTotals[cat] = total;
    if (total > maxExpense) maxExpense = total;
  });

  chartContainer.innerHTML = '';

  // Category Rows & Progress Bars Inject karna
  categories.forEach(cat => {
    const amount = categoryTotals[cat];
    const percentage = maxExpense > 0 ? (amount / maxExpense) * 100 : 0;

    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <span class="chart-label">${cat}</span>
      <div class="chart-track">
        <div class="chart-bar" style="width: ${percentage}%; background-color: ${catColors[cat]};"></div>
      </div>
      <span class="chart-value">$${amount.toFixed(2)}</span>
    `;
    chartContainer.appendChild(row);
  });
}

// 8. Transaction History List Render Function (With Filter Support)
function updateList() {
  if (!txList) return;

  const monthVal = filterMonth ? filterMonth.value : '';
  const catVal = filterCategory ? filterCategory.value.toLowerCase() : 'all';

  const filtered = transactions.filter(tx => {
    const matchesMonth = monthVal ? tx.date.startsWith(monthVal) : true;
    const matchesCategory = catVal !== 'all' ? tx.category.toLowerCase() === catVal : true;
    return matchesMonth && matchesCategory;
  });

  txList.innerHTML = '';

  if (filtered.length === 0) {
    txList.innerHTML = '<li style="padding: 15px; color: #888; text-align: center;">No transactions found.</li>';
    return;
  }

  // Latest entries upar dikhane ke liye sort
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    const isExpense = tx.type === 'expense';

    li.innerHTML = `
      <div>
        <strong>${tx.desc}</strong><br>
        <small style="color:#777">${tx.date} &hearts; ${tx.category}</small>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight:bold; color: ${isExpense ? 'var(--expense)' : 'var(--income)'}">
          ${isExpense ? '-' : '+'}$${Number(tx.amount).toFixed(2)}
        </span>
        <button class="delete-btn" onclick="deleteTransaction(${tx.id})">✕</button>
      </div>
    `;
    txList.appendChild(li);
  });
}

// 9. Filter Control Event Listeners
if (filterMonth) filterMonth.addEventListener('input', updateList);
if (filterCategory) filterCategory.addEventListener('change', updateList);

// 10. Master App Update Function
function updateApp() {
  updateSummary();
  updateChart();
  updateList();
}

// Initial Launch
updateApp();