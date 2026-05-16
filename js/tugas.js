// State & Local Storage
let transactions = JSON.parse(localStorage.getItem('bookstore_data')) || [];
let customCategories = JSON.parse(localStorage.getItem('custom_categories')) || [];
const LIMIT = 1000000;
const MAX_PRICE = 999999999;
const MIN_PRICE = 20000;
const MAX_ITEMS = 100;
let isSorted = false;
let currentMonth = new Date();

// Default Categories
const defaultCategories = [
    { name: 'Fiksi', emoji: '📖' },
    { name: 'Non-Fiksi', emoji: '📚' },
    { name: 'Alat Tulis', emoji: '✏️' }
];

// DOM Elements
const form = document.getElementById('expense-form');
const list = document.getElementById('transaction-list');
const totalDisplay = document.getElementById('total-balance');
const limitWarning = document.getElementById('limit-warning');
const themeBtn = document.getElementById('theme-toggle');
const sortSelect = document.getElementById('sort-select');
const clearBtn = document.getElementById('clear-btn');
const itemCountDisplay = document.getElementById('item-count');
const avgPriceDisplay = document.getElementById('avg-price');
const categorySelect = document.getElementById('category');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoryModal = document.getElementById('category-modal');
const saveCategoryBtn = document.getElementById('save-category');
const cancelCategoryBtn = document.getElementById('cancel-category');
const closeModalBtn = document.getElementById('close-modal');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthDisplay = document.getElementById('current-month');
const monthlySummary = document.getElementById('monthly-summary');

// Initialize Chart
let myChart;

function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const allCategories = [...defaultCategories, ...customCategories];
    const labels = allCategories.map(c => `${c.emoji} ${c.name}`);
    const colors = ['#667eea', '#764ba2', '#f093fb', '#ff6b6b', '#fbbf24', '#51cf66'];
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: allCategories.map(c => 0),
                backgroundColor: colors.slice(0, allCategories.length),
                borderColor: 'var(--card-bg)',
                borderWidth: 3,
                hoverOffset: 12,
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 14, weight: '700' },
                        color: 'var(--text-color)',
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return 'Rp ' + context.parsed.toLocaleString('id-ID');
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: false,
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    });
}

initChart();

// Notification Function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load Categories
function loadCategories() {
    categorySelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
    
    defaultCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.emoji} ${cat.name}`;
        categorySelect.appendChild(option);
    });
    
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.emoji} ${cat.name}`;
        categorySelect.appendChild(option);
    });
}

// Add Custom Category
function openCategoryModal() {
    categoryModal.classList.remove('hidden');
}

function closeCategoryModal() {
    categoryModal.classList.add('hidden');
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-emoji').value = '';
}

function saveCustomCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    const emoji = document.getElementById('new-category-emoji').value.trim() || '📦';
    
    if (!name) {
        showNotification('Nama kategori tidak boleh kosong!', 'error');
        return;
    }
    
    if (customCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Kategori sudah ada!', 'error');
        return;
    }
    
    customCategories.push({ name, emoji });
    localStorage.setItem('custom_categories', JSON.stringify(customCategories));
    loadCategories();
    initChart();
    closeCategoryModal();
    showNotification(`Kategori "${name}" berhasil ditambahkan!`, 'success');
}

// Update UI
function updateUI() {
    list.innerHTML = '';
    let total = 0;
    let counts = {};
    let itemCount = transactions.length;
    
    const allCategories = [...defaultCategories, ...customCategories];
    allCategories.forEach(c => counts[c.name] = 0);
    
    if (itemCount === 0) {
        list.innerHTML = '<p class="empty-state">Belum ada data. Tambahkan stok baru!</p>';
    } else {
        transactions.forEach((t, index) => {
            total += t.amount;
            if (counts.hasOwnProperty(t.category)) {
                counts[t.category] += t.amount;
            }
            
            const item = document.createElement('div');
            item.className = 'item';
            item.style.animationDelay = `${index * 0.05}s`;
            const emoji = getCategoryEmoji(t.category);
            item.innerHTML = `
                <div class="item-info">
                    <strong>${t.name}</strong>
                    <small>${emoji} ${t.category} • Rp ${t.amount.toLocaleString('id-ID')}</small>
                </div>
                <div class="item-actions">
                    <button class="delete-btn" onclick="deleteItem(${index})">Hapus</button>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    totalDisplay.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    itemCountDisplay.innerText = `${itemCount}/${MAX_ITEMS}`;
    
    const avgPrice = itemCount > 0 ? Math.round(total / itemCount) : 0;
    avgPriceDisplay.innerText = `Rp ${avgPrice.toLocaleString('id-ID')}`;
    
    if(total > LIMIT) {
        limitWarning.classList.remove('hidden');
        totalDisplay.style.color = '#ff6b6b';
    } else {
        limitWarning.classList.add('hidden');
        totalDisplay.style.color = 'white';
    }
    
    if(itemCount >= MAX_ITEMS - 10 && itemCount < MAX_ITEMS) {
        if(!limitWarning.classList.contains('hidden')) {
            limitWarning.innerText = `⚠️ Melebihi Limit Anggaran! (${MAX_ITEMS - itemCount} slot tersisa)`;
        } else {
            limitWarning.classList.remove('hidden');
            limitWarning.innerText = `⚠️ Mendekati batas maksimal barang! (${MAX_ITEMS - itemCount} slot tersisa)`;
            limitWarning.style.color = '#fbbf24';
        }
    } else if(itemCount >= MAX_ITEMS) {
        limitWarning.classList.remove('hidden');
        limitWarning.innerText = `⚠️ Sudah mencapai batas maksimal ${MAX_ITEMS} barang!`;
        limitWarning.style.color = '#ff6b6b';
    }
    
    // Update Chart
    const chartData = allCategories.map(c => counts[c.name] || 0);
    myChart.data.datasets[0].data = chartData;
    myChart.update();
    
    localStorage.setItem('bookstore_data', JSON.stringify(transactions));
}

function getCategoryEmoji(category) {
    const allCategories = [...defaultCategories, ...customCategories];
    const cat = allCategories.find(c => c.name === category);
    return cat ? cat.emoji : '📦';
}

function addItem(e) {
    e.preventDefault();
    const name = document.getElementById('item-name').value.trim();
    const amountInput = document.getElementById('amount').value.trim();
    const category = document.getElementById('category').value;
    
    if(!name) {
        showNotification('Nama barang tidak boleh kosong!', 'error');
        return;
    }
    
    const amount = parseInt(amountInput.replace(/\D/g, ''));
    
    if(!amountInput || isNaN(amount)) {
        showNotification('Harga harus berupa angka!', 'error');
        return;
    }
    
    if(amount < MIN_PRICE) {
        showNotification(`Harga minimal Rp ${MIN_PRICE.toLocaleString('id-ID')}!`, 'error');
        return;
    }
    
    if(amount > MAX_PRICE) {
        showNotification(`Harga maksimal Rp ${MAX_PRICE.toLocaleString('id-ID')}!`, 'error');
        return;
    }
    
    if(!category) {
        showNotification('Pilih kategori terlebih dahulu!', 'error');
        return;
    }
    
    if(transactions.length >= MAX_ITEMS) {
        showNotification(`Maksimal ${MAX_ITEMS} barang! Hapus beberapa barang terlebih dahulu.`, 'warning');
        return;
    }
    
    transactions.push({ 
        name, 
        amount, 
        category,
        date: new Date().toLocaleDateString('id-ID'),
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    });
    form.reset();
    updateUI();
    showNotification(`${name} berhasil ditambahkan!`, 'success');
    document.getElementById('item-name').blur();
}

window.deleteItem = function(index) {
    const itemName = transactions[index].name;
    if(confirm('Yakin ingin menghapus item ini?')) {
        transactions.splice(index, 1);
        updateUI();
        showNotification(`${itemName} berhasil dihapus!`, 'success');
    }
}

function clearAllItems() {
    if(transactions.length === 0) {
        showNotification('Tidak ada data untuk dihapus', 'error');
        return;
    }
    if(confirm(`Yakin ingin menghapus semua ${transactions.length} item?`)) {
        transactions = [];
        updateUI();
        showNotification('Semua data berhasil dihapus!', 'success');
    }
}

// Sort Transactions
function sortTransactions(sortType) {
    switch(sortType) {
        case 'date':
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'amount-desc':
            transactions.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            transactions.sort((a, b) => a.amount - b.amount);
            break;
        case 'category':
            transactions.sort((a, b) => a.category.localeCompare(b.category));
            break;
    }
    updateUI();
}

// Monthly Summary
function updateMonthlySummary() {
    const monthTransactions = transactions.filter(t => 
        t.month === currentMonth.getMonth() && 
        t.year === currentMonth.getFullYear()
    );
    
    const allCategories = [...defaultCategories, ...customCategories];
    const monthlyCounts = {};
    let monthlyTotal = 0;
    
    allCategories.forEach(c => monthlyCounts[c.name] = 0);
    
    monthTransactions.forEach(t => {
        if (monthlyCounts.hasOwnProperty(t.category)) {
            monthlyCounts[t.category] += t.amount;
        }
        monthlyTotal += t.amount;
    });
    
    currentMonthDisplay.innerText = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    if (monthTransactions.length === 0) {
        monthlySummary.innerHTML = '<p class="empty-state">Tidak ada data untuk bulan ini</p>';
        return;
    }
    
    monthlySummary.innerHTML = '';
    
    allCategories.forEach((cat, index) => {
        if (monthlyCounts[cat.name] > 0) {
            const card = document.createElement('div');
            card.className = 'monthly-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <div class="monthly-card-title">${cat.emoji} ${cat.name}</div>
                <div class="monthly-card-value">Rp ${monthlyCounts[cat.name].toLocaleString('id-ID')}</div>
                <div class="monthly-card-count">${monthTransactions.filter(t => t.category === cat.name).length} item</div>
            `;
            monthlySummary.appendChild(card);
        }
    });
    
    const totalCard = document.createElement('div');
    totalCard.className = 'monthly-card';
    totalCard.style.animationDelay = `${allCategories.length * 0.1}s`;
    totalCard.innerHTML = `
        <div class="monthly-card-title">💰 Total Bulan Ini</div>
        <div class="monthly-card-value">Rp ${monthlyTotal.toLocaleString('id-ID')}</div>
        <div class="monthly-card-count">${monthTransactions.length} item</div>
    `;
    monthlySummary.appendChild(totalCard);
}

// Tab Navigation
function switchTab(tabName) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'monthly') {
        updateMonthlySummary();
    }
}

// Theme Toggle
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    themeBtn.innerText = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', newTheme);
    
    const themeName = isDark ? 'Mode Terang' : 'Mode Gelap';
    showNotification(`Beralih ke ${themeName}`, 'success');
    
    if(myChart) {
        myChart.options.plugins.legend.labels.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        myChart.update();
    }
}

// Load theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeBtn.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Event Listeners
form.addEventListener('submit', addItem);
themeBtn.addEventListener('click', toggleTheme);
sortSelect.addEventListener('change', (e) => sortTransactions(e.target.value));
clearBtn.addEventListener('click', clearAllItems);
addCategoryBtn.addEventListener('click', openCategoryModal);
saveCategoryBtn.addEventListener('click', saveCustomCategory);
cancelCategoryBtn.addEventListener('click', closeCategoryModal);
closeModalBtn.addEventListener('click', closeCategoryModal);
tabBtns.forEach(btn => btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab)));
prevMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateMonthlySummary();
});
nextMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateMonthlySummary();
});

// Initialize
loadTheme();
loadCategories();
updateUI();
