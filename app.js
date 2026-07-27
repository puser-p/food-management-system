// Food Management System - JavaScript Application
// BCA Minor Project 2025

// =======================
// DATA STORAGE (localStorage)
// =======================

// Storage keys
const STORAGE_KEYS = {
    users:         'fms_users',
    foodItems:     'fms_foodItems',
    suppliers:     'fms_suppliers',
    haccpRecords:  'fms_haccpRecords',
    wastageRecords:'fms_wastageRecords',
    activities:    'fms_activities'
};

// Helpers: read / write localStorage
function storageGet(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
}
function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

// Save helpers – call these after every mutation
function saveUsers()         { storageSet(STORAGE_KEYS.users,          users); }
function saveFoodItems()     { storageSet(STORAGE_KEYS.foodItems,       foodItems); }
function saveSuppliers()     { storageSet(STORAGE_KEYS.suppliers,       suppliers); }
function saveHaccpRecords()  { storageSet(STORAGE_KEYS.haccpRecords,    haccpRecords); }
function saveWastageRecords(){ storageSet(STORAGE_KEYS.wastageRecords,  wastageRecords); }
function saveActivities()    { storageSet(STORAGE_KEYS.activities,      activities); }

// User authentication data
let users = storageGet(STORAGE_KEYS.users, [{username: 'admin', password: 'admin123', name: 'Administrator', email: 'admin@foodmanagement.com', role: 'Administrator'}]);
let currentUser = null;
let isLoggedIn = false;

// Application data arrays – loaded from localStorage (empty arrays = first run)
let foodItems      = storageGet(STORAGE_KEYS.foodItems,      []);
let suppliers      = storageGet(STORAGE_KEYS.suppliers,      []);
let haccpRecords   = storageGet(STORAGE_KEYS.haccpRecords,   []);
let wastageRecords = storageGet(STORAGE_KEYS.wastageRecords, []);
let activities     = storageGet(STORAGE_KEYS.activities,     []);

// Configuration arrays
let categories = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Beverages', 'Frozen', 'Others'];
let units = ['kg', 'liters', 'pieces', 'boxes'];
let storageLocations = ['Cold Storage A', 'Cold Storage B', 'Freezer A', 'Freezer B', 'Refrigerator 1', 'Refrigerator 2', 'Dry Storage', 'Pantry Shelf 1', 'Pantry Shelf 2', 'Pantry Shelf 3', 'Cool Storage'];
let inspectionAreas = ['Storage', 'Kitchen', 'Preparation', 'Serving', 'Cold Storage'];
let pestControlStatus = ['Clear', 'Minor Issues', 'Major Issues'];
let wastageReasons = ['Expired', 'Damaged', 'Spoiled', 'Over-preparation', 'Others'];
let haccpStatus = ['Passed', 'Failed', 'Needs Review'];

// Chart instances
let categoryChart = null;
let stockChart = null;
let supplierChart = null;
let wastageChart = null;
let wastageTimeChart = null;

// Pagination and filtering
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: null, direction: 'asc' };
let currentFilters = {};

// =======================
// INITIALIZATION
// =======================

document.addEventListener('DOMContentLoaded', function() {
    // Init features (dark mode) early so theme applies before render
    if (typeof initFeatures === 'function') initFeatures();
    initializeApp();
    // Load sample data only on first run (when no data exists in localStorage)
    if (foodItems.length === 0 && suppliers.length === 0) {
        loadSampleData();
    }
    setupEventListeners();
});

function initializeApp() {
    // Show login page initially
    showLoginPage();
    
    // Check if user is logged in (for development/testing)
    if (isLoggedIn) {
        showMainApp();
        updateDashboard();
    }
}

function loadSampleData() {
    // Sample food items
    foodItems = [
        {
            id: 1,
            name: "Fresh Tomatoes",
            category: "Vegetables",
            quantity: 45,
            unit: "kg",
            expiryDate: "2026-03-30",
            supplier: "Fresh Farm Supplies",
            purchasePrice: 40,
            storageLocation: "Cold Storage A",
            minimumStock: 20,
            dateAdded: "2026-03-05"
        },
        {
            id: 2,
            name: "Whole Milk",
            category: "Dairy",
            quantity: 8,
            unit: "liters",
            expiryDate: "2026-03-15",
            supplier: "Dairy Fresh Co",
            purchasePrice: 60,
            storageLocation: "Refrigerator 1",
            minimumStock: 10,
            dateAdded: "2026-03-10"
        },
        {
            id: 3,
            name: "Chicken Breast",
            category: "Meat",
            quantity: 25,
            unit: "kg",
            expiryDate: "2025-11-24",
            supplier: "Quality Meats Ltd",
            purchasePrice: 280,
            storageLocation: "Freezer B",
            minimumStock: 15,
            dateAdded: "2025-11-18"
        },
        {
            id: 4,
            name: "Basmati Rice",
            category: "Grains",
            quantity: 150,
            unit: "kg",
            expiryDate: "2027-01-30",
            supplier: "Grain Masters",
            purchasePrice: 80,
            storageLocation: "Dry Storage",
            minimumStock: 50,
            dateAdded: "2026-01-10"
        },
        {
            id: 5,
            name: "Orange Juice",
            category: "Beverages",
            quantity: 30,
            unit: "liters",
            expiryDate: "2026-09-19",
            supplier: "Beverage Solutions",
            purchasePrice: 120,
            storageLocation: "Cold Storage B",
            minimumStock: 20,
            dateAdded: "2026-02-19"
        },
        {
            id: 6,
            name: "Fresh Carrots",
            category: "Vegetables",
            quantity: 35,
            unit: "kg",
            expiryDate: "2026-03-05",
            supplier: "Fresh Farm Supplies",
            purchasePrice: 35,
            storageLocation: "Cold Storage A",
            minimumStock: 15,
            dateAdded: "2026-02-16"
        },
        {
            id: 7,
            name: "Cheddar Cheese",
            category: "Dairy",
            quantity: 12,
            unit: "kg",
            expiryDate: "2026-08-20",
            supplier: "Dairy Fresh Co",
            purchasePrice: 450,
            storageLocation: "Refrigerator 2",
            minimumStock: 8,
            dateAdded: "2026-02-17"
        },
        {
            id: 8,
            name: "Fresh Apples",
            category: "Fruits",
            quantity: 50,
            unit: "kg",
            expiryDate: "2026-04-10",
            supplier: "Fresh Farm Supplies",
            purchasePrice: 120,
            storageLocation: "Cool Storage",
            minimumStock: 25,
            dateAdded: "2026-03-14"
        },
        {
            id: 9,
            name: "Ground Beef",
            category: "Meat",
            quantity: 6,
            unit: "kg",
            expiryDate: "2027-01-23",
            supplier: "Quality Meats Ltd",
            purchasePrice: 320,
            storageLocation: "Freezer A",
            minimumStock: 10,
            dateAdded: "2026-02-21"
        },
        {
            id: 10,
            name: "Bread Loaves",
            category: "Others",
            quantity: 25,
            unit: "pieces",
            expiryDate: "2026-02-26",
            supplier: "Bakery Delights",
            purchasePrice: 45,
            storageLocation: "Pantry Shelf 3",
            minimumStock: 15,
            dateAdded: "2026-02-22"
        }
    ];
    
    // Sample suppliers
    suppliers = [
        {
            id: 1,
            name: "Fresh Farm Supplies",
            contactPerson: "Rajesh Kumar",
            phone: "+91-9876543210",
            email: "rajesh@freshfarm.com",
            address: "Plot 45, Agricultural Market, Mumbai",
            supplyCategory: ["Vegetables", "Fruits"],
            rating: 4.5,
            lastSupplyDate: "2026-03-12"
        },
        {
            id: 2,
            name: "Dairy Fresh Co",
            contactPerson: "Priya Sharma",
            phone: "+91-9876543211",
            email: "priya@dairyfresh.com",
            address: "Sector 12, Dairy Complex, Pune",
            supplyCategory: ["Dairy"],
            rating: 4.8,
            lastSupplyDate: "2026-03-02"
        },
        {
            id: 3,
            name: "Quality Meats Ltd",
            contactPerson: "Amit Patel",
            phone: "+91-9876543212",
            email: "amit@qualitymeats.com",
            address: "Zone 3, Meat Processing Unit, Delhi",
            supplyCategory: ["Meat"],
            rating: 4.3,
            lastSupplyDate: "2026-03-09"
        },
        {
            id: 4,
            name: "Grain Masters",
            contactPerson: "Suresh Reddy",
            phone: "+91-9876543213",
            email: "suresh@grainmasters.com",
            address: "Warehouse 8, Grain Market, Hyderabad",
            supplyCategory: ["Grains"],
            rating: 4.6,
            lastSupplyDate: "2026-03-15"
        },
        {
            id: 5,
            name: "Beverage Solutions",
            contactPerson: "Neha Singh",
            phone: "+91-9876543214",
            email: "neha@beveragesol.com",
            address: "Unit 5, Beverage Park, Bangalore",
            supplyCategory: ["Beverages"],
            rating: 4.4,
            lastSupplyDate: "2026-03-08"
        },
        {
            id: 6,
            name: "Bakery Delights",
            contactPerson: "Arun Mehta",
            phone: "+91-9876543215",
            email: "arun@bakerydelights.com",
            address: "Shop 12, Baker Street, Chennai",
            supplyCategory: ["Others"],
            rating: 4.2,
            lastSupplyDate: "2026-03-12"
        }
    ];
    
    // Sample HACCP records
    haccpRecords = [
        {
            id: 1,
            inspectionDate: "2026-02-20",
            inspectorName: "Dr. Meena Iyer",
            areaInspected: "Cold Storage",
            criticalControlPoint: "Temperature Maintenance",
            temperatureCheck: 4,
            hygieneRating: 5,
            pestControlStatus: "Clear",
            observations: "All refrigeration units maintaining proper temperature. No signs of contamination.",
            correctiveActions: "None required",
            status: "Passed"
        },
        {
            id: 2,
            inspectionDate: "2026-03-08",
            inspectorName: "Vikram Joshi",
            areaInspected: "Kitchen",
            criticalControlPoint: "Food Preparation Hygiene",
            temperatureCheck: 22,
            hygieneRating: 4,
            pestControlStatus: "Clear",
            observations: "Good hygiene practices observed. Minor improvement needed in waste disposal timing.",
            correctiveActions: "Increase frequency of waste disposal to every 2 hours",
            status: "Passed"
        },
        {
            id: 3,
            inspectionDate: "2026-03-05",
            inspectorName: "Dr. Kavita Desai",
            areaInspected: "Storage",
            criticalControlPoint: "Dry Storage Conditions",
            temperatureCheck: 25,
            hygieneRating: 3,
            pestControlStatus: "Minor Issues",
            observations: "Found evidence of minor pest activity near grain storage. Humidity levels acceptable.",
            correctiveActions: "Schedule immediate pest control treatment. Install additional traps.",
            status: "Needs Review"
        },
        {
            id: 4,
            inspectionDate: "2026-03-12",
            inspectorName: "Rahul Verma",
            areaInspected: "Preparation",
            criticalControlPoint: "Cross-Contamination Prevention",
            temperatureCheck: 23,
            hygieneRating: 5,
            pestControlStatus: "Clear",
            observations: "Excellent separation between raw and cooked food areas. Color-coded equipment properly maintained.",
            correctiveActions: "None required",
            status: "Passed"
        },
        {
            id: 5,
            inspectionDate: "2026-03-10",
            inspectorName: "Dr. Anjali Nair",
            areaInspected: "Serving",
            criticalControlPoint: "Hot Holding Temperature",
            temperatureCheck: 68,
            hygieneRating: 4,
            pestControlStatus: "Clear",
            observations: "Food holding temperatures within safe range. Staff following proper serving protocols.",
            correctiveActions: "None required",
            status: "Passed"
        }
    ];
    
    // Sample wastage records
    wastageRecords = [
        {
            id: 1,
            itemName: "Fresh Tomatoes",
            quantityWasted: 5,
            unit: "kg",
            wastageDate: "2026-02-19",
            reason: "Spoiled",
            costImpact: 200,
            notes: "Found mold on batch received last week"
        },
        {
            id: 2,
            itemName: "Whole Milk",
            quantityWasted: 3,
            unit: "liters",
            wastageDate: "2026-02-21",
            reason: "Expired",
            costImpact: 180,
            notes: "Passed expiry date, disposed as per protocol"
        },
        {
            id: 3,
            itemName: "Bread Loaves",
            quantityWasted: 8,
            unit: "pieces",
            wastageDate: "2026-02-28",
            reason: "Over-preparation",
            costImpact: 360,
            notes: "Excess production for event that was cancelled"
        },
        {
            id: 4,
            itemName: "Fresh Carrots",
            quantityWasted: 2,
            unit: "kg",
            wastageDate: "2026-02-17",
            reason: "Damaged",
            costImpact: 70,
            notes: "Physical damage during transport"
        }
    ];
    
    // Generate sample activities
    generateRecentActivities();
    
    // Persist sample data to localStorage
    saveFoodItems();
    saveSuppliers();
    saveHaccpRecords();
    saveWastageRecords();
    saveActivities();
}

function setupEventListeners() {
    // Safe helper — never throws if element is missing
    function on(id, event, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    }

    // Login / Register
    on('loginForm',    'submit', handleLogin);
    on('registerForm', 'submit', handleRegister);
    on('goToRegister', 'click', e => { e.preventDefault(); showRegisterPage(); });
    on('goToLogin',    'click', e => { e.preventDefault(); showLoginPage(); });

    // Auth
    on('logoutBtn', 'click', handleLogout);

    // Sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    on('sidebarToggle', 'click', toggleSidebar);

    // Modal
    on('closeModal', 'click', closeModal);
    const modal = document.getElementById('modal');
    if (modal) modal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

    // Toast
    on('closeToast', 'click', closeToast);

    // Add buttons
    on('addItemBtn',     'click', () => openAddItemModal());
    on('addSupplierBtn', 'click', () => openAddSupplierModal());
    on('addHaccpBtn',    'click', () => openAddHaccpModal());
    on('addWastageBtn',  'click', () => openAddWastageModal());

    // Search / filter
    on('inventorySearch', 'input',  filterInventory);
    on('categoryFilter',  'change', filterInventory);
    on('supplierSearch',  'input',  filterSuppliers);
    on('statusFilter',    'change', filterHaccp);
    on('dateFilter',      'change', filterHaccp);

    // Export
    on('exportInventoryBtn', 'click', exportInventoryCSV);

    // Settings
    on('backupDataBtn',  'click', backupData);
    on('restoreDataBtn', 'click', restoreData);

    // Report cards
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', function() {
            generateReport(this.dataset.report);
        });
    });

    // Sort headers
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.addEventListener('click', function() {
            handleSort(this.dataset.sort);
        });
    });
}

// =======================
// AUTHENTICATION
// =======================

function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showRegisterPage() {
    document.getElementById('registerPage').classList.remove('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    // Clear form & messages
    document.getElementById('registerForm').reset();
    document.getElementById('registerError').classList.add('hidden');
    document.getElementById('registerSuccess').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    populateCategoryFilter();
    populateSettingsProfile();
    updateDashboard();
    renderInventoryTable();
    renderSupplierTable();
    renderHaccpTable();
    renderWastageTable();
    initializeCharts();
    // Initialize smart alert system (isolated — won't break login if it errors)
    try {
        if (typeof initAlertSystem === 'function') initAlertSystem();
    } catch(e) { console.warn('Alert system init error:', e); }
    // Ask for notification permission
    try {
        if (typeof window._maybeShowNotifBanner === 'function') window._maybeShowNotifBanner();
    } catch(e) {}
}

function populateSettingsProfile() {
    if (!currentUser) return;
    document.getElementById('profileName').value     = currentUser.name     || '—';
    document.getElementById('profileUsername').value = currentUser.username  || '—';
    document.getElementById('profileEmail').value    = currentUser.email     || '—';
    document.getElementById('profileRole').value     = currentUser.role      || 'Administrator';
    // Update navbar welcome text
    document.getElementById('navWelcome').textContent = `Welcome, ${currentUser.name || currentUser.username}`;
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        isLoggedIn = true;
        showMainApp();
        showToast('Login successful! Welcome to Food Management System.', 'success');
        addActivity('User logged in', 'login');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('loginError').classList.add('hidden');
        }, 5000);
    }
}

function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    addActivity('User logged out', 'logout');
    showLoginPage();
    document.getElementById('loginForm').reset();
    showToast('Logged out successfully', 'info');
}

function handleRegister(e) {
    e.preventDefault();

    const name            = document.getElementById('regName').value.trim();
    const username        = document.getElementById('regUsername').value.trim();
    const email           = document.getElementById('regEmail').value.trim();
    const password        = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role            = document.getElementById('regRole').value;

    const errorEl   = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');

    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    // Validations
    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match. Please try again.';
        errorEl.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters long.';
        errorEl.classList.remove('hidden');
        return;
    }

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        errorEl.textContent = 'Username already exists. Please choose a different one.';
        errorEl.classList.remove('hidden');
        return;
    }

    if (users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
        errorEl.textContent = 'An account with this email already exists.';
        errorEl.classList.remove('hidden');
        return;
    }

    // Create new user
    const newUser = { username, password, name, email, role };
    users.push(newUser);
    saveUsers();

    successEl.classList.remove('hidden');
    addActivity('New user registered', 'add', name);

    // Auto-redirect to login after 1.5 seconds
    setTimeout(() => {
        showLoginPage();
        document.getElementById('username').value = username;
    }, 1500);
}

// =======================
// NAVIGATION
// =======================

function handleNavigation(e) {
    e.preventDefault();
    const targetPage = this.dataset.page;
    
    // Update active sidebar link
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    this.classList.add('active');
    
    // Show target page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(targetPage).classList.add('active');
    
    // Page-specific actions
    switch(targetPage) {
        case 'dashboard':
            updateDashboard();
            updateCharts();
            break;
        case 'inventory':
            renderInventoryTable();
            break;
        case 'suppliers':
            renderSupplierTable();
            break;
        case 'haccp':
            renderHaccpTable();
            break;
        case 'wastage':
            renderWastageTable();
            updateWastageCharts();
            if (typeof renderWastageAnalytics === 'function') renderWastageAnalytics();
            break;
        case 'reports':
            // Reports page loaded
            break;
        case 'settings':
            populateSettingsProfile();
            break;
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// =======================
// DASHBOARD FUNCTIONS
// =======================

function updateDashboard() {
    // Update metrics
    const totalItems = foodItems.length;
    const lowStockItems = foodItems.filter(item => item.quantity < item.minimumStock).length;
    const totalSuppliers = suppliers.length;
    const pendingInspections = haccpRecords.filter(record => record.status === 'Needs Review' || record.status === 'Failed').length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('lowStockAlerts').textContent = lowStockItems;
    document.getElementById('totalSuppliers').textContent = totalSuppliers;
    document.getElementById('pendingInspections').textContent = pendingInspections;
    
    // Update recent activities
    renderRecentActivities();

    // Refresh alert system
    if (typeof syncAlertBadge === 'function') syncAlertBadge();
    if (typeof renderDashboardAlertSummary === 'function') renderDashboardAlertSummary();
}

function generateRecentActivities() {
    activities = [
        { action: 'Added new food item', item: 'Bread Loaves', timestamp: new Date('2025-10-22'), type: 'add' },
        { action: 'Updated supplier information', item: 'Dairy Fresh Co', timestamp: new Date('2025-10-21'), type: 'update' },
        { action: 'Recorded wastage', item: 'Whole Milk - 3 liters', timestamp: new Date('2025-10-21'), type: 'wastage' },
        { action: 'Completed HACCP inspection', item: 'Cold Storage Area', timestamp: new Date('2025-10-20'), type: 'inspection' },
        { action: 'Low stock alert', item: 'Ground Beef - 6 kg remaining', timestamp: new Date('2025-10-19'), type: 'alert' }
    ];
    // Note: saveActivities() is called by the caller (loadSampleData) after this
}

function renderRecentActivities() {
    const container = document.getElementById('recentActivities');
    const recentActivities = activities.slice(0, 5);
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${
                    activity.type === 'add' ? 'fa-plus' :
                    activity.type === 'update' ? 'fa-edit' :
                    activity.type === 'wastage' ? 'fa-trash' :
                    activity.type === 'inspection' ? 'fa-clipboard-check' :
                    'fa-exclamation-triangle'
                }"></i>
            </div>
            <div class="activity-content">
                <p>${activity.action}: <strong>${activity.item}</strong></p>
                <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function addActivity(action, type, item = '') {
    const newActivity = {
        action: action,
        item: item,
        timestamp: new Date(),
        type: type
    };
    activities.unshift(newActivity);
    if (activities.length > 20) activities.pop(); // Keep only latest 20
    saveActivities();
    renderRecentActivities();
}

// =======================
// INVENTORY FUNCTIONS
// =======================

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    let filteredItems = getFilteredInventoryItems();
    
    // Apply sorting
    if (currentSort.field) {
        filteredItems.sort((a, b) => {
            let aVal = a[currentSort.field];
            let bVal = b[currentSort.field];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (currentSort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedItems.map(item => {
        const statusBadges = getItemStatusBadges(item);
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>${formatDate(item.expiryDate)}</td>
                <td>${item.supplier}</td>
                <td>${statusBadges}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn--edit" onclick="editItem(${item.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn action-btn--delete" onclick="deleteItem(${item.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    renderPagination(filteredItems.length, 'inventoryPagination');
}

function getFilteredInventoryItems() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    return foodItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                            item.supplier.toLowerCase().includes(searchTerm) ||
                            item.storageLocation.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
}

function getItemStatusBadges(item) {
    let badges = [];
    
    // Check for low stock
    if (item.quantity < item.minimumStock) {
        badges.push('<span class="badge badge--error">Low Stock</span>');
    }
    
    // Check for expiry
    const today = new Date();
    const expiryDate = new Date(item.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
        badges.push('<span class="badge badge--error">Expired</span>');
    } else if (daysUntilExpiry <= 7) {
        badges.push('<span class="badge badge--warning">Expiring Soon</span>');
    }
    
    return badges.join(' ') || '<span class="badge badge--success">Good</span>';
}

function filterInventory() {
    currentPage = 1; // Reset to first page when filtering
    renderInventoryTable();
}

function openAddItemModal(itemId = null) {
    const isEdit = itemId !== null;
    const item = isEdit ? foodItems.find(i => i.id == itemId) : null;
    
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Food Item' : 'Add Food Item';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <form id="itemForm">
            <input type="hidden" id="itemId" value="${isEdit ? item.id : ''}">
            
            <div class="form-group">
                <label class="form-label">Item Name *</label>
                <input type="text" id="itemName" class="form-control" value="${isEdit ? item.name : ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Category *</label>
                <select id="itemCategory" class="form-control" required>
                    <option value="">Select Category</option>
                    ${categories.map(cat => 
                        `<option value="${cat}" ${isEdit && item.category === cat ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Quantity *</label>
                <input type="number" id="itemQuantity" class="form-control" value="${isEdit ? item.quantity : ''}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Unit *</label>
                <select id="itemUnit" class="form-control" required>
                    <option value="">Select Unit</option>
                    ${units.map(unit => 
                        `<option value="${unit}" ${isEdit && item.unit === unit ? 'selected' : ''}>${unit}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Expiry Date *</label>
                <input type="date" id="itemExpiryDate" class="form-control" value="${isEdit ? item.expiryDate : ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Supplier *</label>
                <select id="itemSupplier" class="form-control" required>
                    <option value="">Select Supplier</option>
                    ${suppliers.map(supplier => 
                        `<option value="${supplier.name}" ${isEdit && item.supplier === supplier.name ? 'selected' : ''}>${supplier.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Purchase Price (₹) *</label>
                <input type="number" id="itemPrice" class="form-control" value="${isEdit ? item.purchasePrice : ''}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Storage Location *</label>
                <select id="itemStorage" class="form-control" required>
                    <option value="">Select Storage Location</option>
                    ${storageLocations.map(location => 
                        `<option value="${location}" ${isEdit && item.storageLocation === location ? 'selected' : ''}>${location}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Minimum Stock Level *</label>
                <input type="number" id="itemMinStock" class="form-control" value="${isEdit ? item.minimumStock : ''}" min="0" required placeholder="e.g. 10">
                <small class="form-hint">Alert triggers when stock falls to or below this level</small>
            </div>

            <div class="form-group">
                <label class="form-label">Maximum Stock Level</label>
                <input type="number" id="itemMaxStock" class="form-control" value="${isEdit && item.maximumStock ? item.maximumStock : ''}" min="0" placeholder="e.g. 100 (optional)">
                <small class="form-hint">Alert triggers when stock exceeds this level</small>
            </div>
            
            <div class="form-group">
                <button type="submit" class="btn btn--primary btn--full-width">
                    ${isEdit ? 'Update Item' : 'Add Item'}
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);
    showModal();
}

function handleItemSubmit(e) {
    e.preventDefault();
    
    const rawId   = document.getElementById('itemId').value;
    const isEdit  = rawId !== '';
    const itemId  = isEdit ? (isNaN(Number(rawId)) ? rawId : Number(rawId)) : Date.now();

    const formData = {
        id: itemId,
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        quantity: parseFloat(document.getElementById('itemQuantity').value),
        unit: document.getElementById('itemUnit').value,
        expiryDate: document.getElementById('itemExpiryDate').value,
        supplier: document.getElementById('itemSupplier').value,
        purchasePrice: parseFloat(document.getElementById('itemPrice').value),
        storageLocation: document.getElementById('itemStorage').value,
        minimumStock: parseInt(document.getElementById('itemMinStock').value) || 0,
        maximumStock: parseInt(document.getElementById('itemMaxStock').value) || 0,
        dateAdded: isEdit
            ? (foodItems.find(i => i.id == itemId) || {}).dateAdded || new Date().toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    };
    
    if (isEdit) {
        const index = foodItems.findIndex(i => i.id == itemId);
        if (index !== -1) {
            foodItems[index] = formData;
        }
        saveFoodItems();
        showToast('Food item updated successfully!', 'success');
        addActivity('Updated food item', 'update', formData.name);
    } else {
        foodItems.push(formData);
        saveFoodItems();
        showToast('Food item added successfully!', 'success');
        addActivity('Added new food item', 'add', formData.name);
    }
    
    closeModal();
    renderInventoryTable();
    updateDashboard();
    updateCharts();
}

function editItem(id) {
    openAddItemModal(id);
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        const item = foodItems.find(i => i.id == id);
        foodItems = foodItems.filter(i => i.id != id);
        saveFoodItems();
        showToast('Food item deleted successfully!', 'success');
        addActivity('Deleted food item', 'delete', item ? item.name : '');
        renderInventoryTable();
        updateDashboard();
        updateCharts();
    }
}

// =======================
// SUPPLIER FUNCTIONS
// =======================

function renderSupplierTable() {
    const tbody = document.getElementById('supplierTableBody');
    const searchTerm = document.getElementById('supplierSearch').value.toLowerCase();
    
    const filteredSuppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.contactPerson.toLowerCase().includes(searchTerm) ||
        supplier.phone.includes(searchTerm)
    );
    
    tbody.innerHTML = filteredSuppliers.map(supplier => `
        <tr>
            <td>${supplier.name}</td>
            <td>${supplier.contactPerson}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.supplyCategory.join(', ')}</td>
            <td>
                <div class="star-rating">
                    ${generateStarRating(supplier.rating)}
                </div>
            </td>
            <td>${formatDate(supplier.lastSupplyDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn--view" onclick="viewSupplier(${supplier.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn action-btn--edit" onclick="editSupplier(${supplier.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn action-btn--delete" onclick="deleteSupplier(${supplier.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt star"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star star empty"></i>';
    }
    return stars;
}

function filterSuppliers() {
    renderSupplierTable();
}

function openAddSupplierModal(supplierId = null) {
    const isEdit = supplierId !== null;
    const supplier = isEdit ? suppliers.find(s => s.id === supplierId) : null;
    
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Supplier' : 'Add Supplier';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <form id="supplierForm">
            <input type="hidden" id="supplierId" value="${isEdit ? supplier.id : ''}">
            
            <div class="form-group">
                <label class="form-label">Supplier Name *</label>
                <input type="text" id="supplierName" class="form-control" value="${isEdit ? supplier.name : ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Contact Person</label>
                <input type="text" id="supplierContact" class="form-control" value="${isEdit ? supplier.contactPerson : ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="supplierPhone" class="form-control" value="${isEdit ? supplier.phone : ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="supplierEmail" class="form-control" value="${isEdit ? supplier.email : ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Address</label>
                <textarea id="supplierAddress" class="form-control">${isEdit ? supplier.address : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Supply Categories</label>
                <select id="supplierCategories" class="form-control" multiple>
                    ${categories.map(cat => 
                        `<option value="${cat}" ${isEdit && supplier.supplyCategory.includes(cat) ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
                <small>Hold Ctrl to select multiple categories</small>
            </div>
            
            <div class="form-group">
                <label class="form-label">Rating (1-5)</label>
                <input type="number" id="supplierRating" class="form-control" value="${isEdit ? supplier.rating : 5}" min="1" max="5" step="0.1">
            </div>
            
            <div class="form-group">
                <label class="form-label">Last Supply Date</label>
                <input type="date" id="supplierLastSupply" class="form-control" value="${isEdit ? supplier.lastSupplyDate : ''}">
            </div>
            
            <div class="form-group">
                <button type="submit" class="btn btn--primary btn--full-width">
                    ${isEdit ? 'Update Supplier' : 'Add Supplier'}
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('supplierForm').addEventListener('submit', handleSupplierSubmit);
    showModal();
}

function handleSupplierSubmit(e) {
    e.preventDefault();
    
    const categoryOptions = document.getElementById('supplierCategories').selectedOptions;
    const selectedCategories = Array.from(categoryOptions).map(option => option.value);
    
    const formData = {
        id: document.getElementById('supplierId').value || Date.now(),
        name: document.getElementById('supplierName').value,
        contactPerson: document.getElementById('supplierContact').value,
        phone: document.getElementById('supplierPhone').value,
        email: document.getElementById('supplierEmail').value,
        address: document.getElementById('supplierAddress').value,
        supplyCategory: selectedCategories,
        rating: parseFloat(document.getElementById('supplierRating').value),
        lastSupplyDate: document.getElementById('supplierLastSupply').value
    };
    
    const isEdit = document.getElementById('supplierId').value !== '';
    
    if (isEdit) {
        const index = suppliers.findIndex(s => s.id == formData.id);
        suppliers[index] = formData;
        saveSuppliers();
        showToast('Supplier updated successfully!', 'success');
        addActivity('Updated supplier information', 'update', formData.name);
    } else {
        suppliers.push(formData);
        saveSuppliers();
        showToast('Supplier added successfully!', 'success');
        addActivity('Added new supplier', 'add', formData.name);
    }
    
    closeModal();
    renderSupplierTable();
    updateDashboard();
}

function viewSupplier(id) {
    const supplier = suppliers.find(s => s.id === id);
    
    document.getElementById('modalTitle').textContent = 'Supplier Details';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="supplier-details">
            <h4>${supplier.name}</h4>
            <p><strong>Contact Person:</strong> ${supplier.contactPerson || 'N/A'}</p>
            <p><strong>Phone:</strong> ${supplier.phone || 'N/A'}</p>
            <p><strong>Email:</strong> ${supplier.email || 'N/A'}</p>
            <p><strong>Address:</strong> ${supplier.address || 'N/A'}</p>
            <p><strong>Supply Categories:</strong> ${supplier.supplyCategory.join(', ')}</p>
            <p><strong>Rating:</strong> 
                <div class="star-rating">
                    ${generateStarRating(supplier.rating)}
                </div>
            </p>
            <p><strong>Last Supply Date:</strong> ${formatDate(supplier.lastSupplyDate)}</p>
        </div>
    `;
    
    showModal();
}

function editSupplier(id) {
    openAddSupplierModal(id);
}

function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        const supplier = suppliers.find(s => s.id === id);
        suppliers = suppliers.filter(s => s.id !== id);
        saveSuppliers();
        showToast('Supplier deleted successfully!', 'success');
        addActivity('Deleted supplier', 'delete', supplier.name);
        renderSupplierTable();
        updateDashboard();
    }
}

// =======================
// HACCP FUNCTIONS
// =======================

function renderHaccpTable() {
    const tbody = document.getElementById('haccpTableBody');
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredRecords = haccpRecords;
    
    if (statusFilter) {
        filteredRecords = filteredRecords.filter(record => record.status === statusFilter);
    }
    
    if (dateFilter) {
        filteredRecords = filteredRecords.filter(record => record.inspectionDate === dateFilter);
    }
    
    tbody.innerHTML = filteredRecords.map(record => `
        <tr>
            <td>${formatDate(record.inspectionDate)}</td>
            <td>${record.inspectorName}</td>
            <td>${record.areaInspected}</td>
            <td>${record.temperatureCheck}°C</td>
            <td>
                <div class="star-rating">
                    ${generateStarRating(record.hygieneRating)}
                </div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(record.status)}">
                    ${record.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn--view" onclick="viewHaccpRecord(${record.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn action-btn--edit" onclick="editHaccpRecord(${record.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn action-btn--delete" onclick="deleteHaccpRecord(${record.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Passed': return 'badge--success';
        case 'Failed': return 'badge--error';
        case 'Needs Review': return 'badge--warning';
        default: return 'badge--info';
    }
}

function filterHaccp() {
    renderHaccpTable();
}

function openAddHaccpModal(recordId = null) {
    const isEdit = recordId !== null;
    const record = isEdit ? haccpRecords.find(r => r.id === recordId) : null;
    
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit HACCP Record' : 'New HACCP Inspection';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <form id="haccpForm">
            <input type="hidden" id="haccpId" value="${isEdit ? record.id : ''}">
            
            <div class="form-group">
                <label class="form-label">Inspection Date *</label>
                <input type="date" id="haccpDate" class="form-control" value="${isEdit ? record.inspectionDate : new Date().toISOString().split('T')[0]}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Inspector Name *</label>
                <input type="text" id="haccpInspector" class="form-control" value="${isEdit ? record.inspectorName : ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Area Inspected *</label>
                <select id="haccpArea" class="form-control" required>
                    <option value="">Select Area</option>
                    ${inspectionAreas.map(area => 
                        `<option value="${area}" ${isEdit && record.areaInspected === area ? 'selected' : ''}>${area}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Critical Control Point *</label>
                <input type="text" id="haccpCCP" class="form-control" value="${isEdit ? record.criticalControlPoint : ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Temperature Check (°C) *</label>
                <input type="number" id="haccpTemp" class="form-control" value="${isEdit ? record.temperatureCheck : ''}" step="0.1" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Hygiene Rating (1-5) *</label>
                <input type="number" id="haccpHygiene" class="form-control" value="${isEdit ? record.hygieneRating : 5}" min="1" max="5" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Pest Control Status *</label>
                <select id="haccpPest" class="form-control" required>
                    <option value="">Select Status</option>
                    ${pestControlStatus.map(status => 
                        `<option value="${status}" ${isEdit && record.pestControlStatus === status ? 'selected' : ''}>${status}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Observations *</label>
                <textarea id="haccpObservations" class="form-control" required>${isEdit ? record.observations : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Corrective Actions Required</label>
                <textarea id="haccpActions" class="form-control">${isEdit ? record.correctiveActions : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Status *</label>
                <select id="haccpStatus" class="form-control" required>
                    <option value="">Select Status</option>
                    ${haccpStatus.map(status => 
                        `<option value="${status}" ${isEdit && record.status === status ? 'selected' : ''}>${status}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <button type="submit" class="btn btn--primary btn--full-width">
                    ${isEdit ? 'Update Record' : 'Create Record'}
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('haccpForm').addEventListener('submit', handleHaccpSubmit);
    showModal();
}

function handleHaccpSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: document.getElementById('haccpId').value || Date.now(),
        inspectionDate: document.getElementById('haccpDate').value,
        inspectorName: document.getElementById('haccpInspector').value,
        areaInspected: document.getElementById('haccpArea').value,
        criticalControlPoint: document.getElementById('haccpCCP').value,
        temperatureCheck: parseFloat(document.getElementById('haccpTemp').value),
        hygieneRating: parseInt(document.getElementById('haccpHygiene').value),
        pestControlStatus: document.getElementById('haccpPest').value,
        observations: document.getElementById('haccpObservations').value,
        correctiveActions: document.getElementById('haccpActions').value,
        status: document.getElementById('haccpStatus').value
    };
    
    const isEdit = document.getElementById('haccpId').value !== '';
    
    if (isEdit) {
        const index = haccpRecords.findIndex(r => r.id == formData.id);
        haccpRecords[index] = formData;
        saveHaccpRecords();
        showToast('HACCP record updated successfully!', 'success');
        addActivity('Updated HACCP record', 'update', formData.areaInspected);
    } else {
        haccpRecords.push(formData);
        saveHaccpRecords();
        showToast('HACCP record created successfully!', 'success');
        addActivity('Completed HACCP inspection', 'inspection', formData.areaInspected);
    }
    
    closeModal();
    renderHaccpTable();
    updateDashboard();
}

function viewHaccpRecord(id) {
    const record = haccpRecords.find(r => r.id === id);
    
    document.getElementById('modalTitle').textContent = 'HACCP Inspection Details';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="haccp-details">
            <h4>Inspection Report</h4>
            <p><strong>Date:</strong> ${formatDate(record.inspectionDate)}</p>
            <p><strong>Inspector:</strong> ${record.inspectorName}</p>
            <p><strong>Area Inspected:</strong> ${record.areaInspected}</p>
            <p><strong>Critical Control Point:</strong> ${record.criticalControlPoint}</p>
            <p><strong>Temperature Check:</strong> ${record.temperatureCheck}°C</p>
            <p><strong>Hygiene Rating:</strong> 
                <div class="star-rating">
                    ${generateStarRating(record.hygieneRating)}
                </div>
            </p>
            <p><strong>Pest Control Status:</strong> 
                <span class="badge ${record.pestControlStatus === 'Clear' ? 'badge--success' : record.pestControlStatus === 'Minor Issues' ? 'badge--warning' : 'badge--error'}">
                    ${record.pestControlStatus}
                </span>
            </p>
            <p><strong>Status:</strong> 
                <span class="badge ${getStatusBadgeClass(record.status)}">
                    ${record.status}
                </span>
            </p>
            <div style="margin-top: 20px;">
                <h5>Observations:</h5>
                <p>${record.observations}</p>
            </div>
            <div style="margin-top: 20px;">
                <h5>Corrective Actions:</h5>
                <p>${record.correctiveActions || 'None required'}</p>
            </div>
        </div>
    `;
    
    showModal();
}

function editHaccpRecord(id) {
    openAddHaccpModal(id);
}

function deleteHaccpRecord(id) {
    if (confirm('Are you sure you want to delete this HACCP record?')) {
        const record = haccpRecords.find(r => r.id === id);
        haccpRecords = haccpRecords.filter(r => r.id !== id);
        saveHaccpRecords();
        showToast('HACCP record deleted successfully!', 'success');
        addActivity('Deleted HACCP record', 'delete', record.areaInspected);
        renderHaccpTable();
        updateDashboard();
    }
}

// =======================
// WASTAGE FUNCTIONS
// =======================

function renderWastageTable() {
    const tbody = document.getElementById('wastageTableBody');
    
    tbody.innerHTML = wastageRecords.map(record => `
        <tr>
            <td>${formatDate(record.wastageDate)}</td>
            <td>${record.itemName}</td>
            <td>${record.quantityWasted} ${record.unit}</td>
            <td>${record.reason}</td>
            <td>₹${record.costImpact.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn--view" onclick="viewWastageRecord(${record.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn action-btn--edit" onclick="editWastageRecord(${record.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn action-btn--delete" onclick="deleteWastageRecord(${record.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddWastageModal(recordId = null) {
    const isEdit = recordId !== null;
    const record = isEdit ? wastageRecords.find(r => r.id === recordId) : null;
    
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Wastage Record' : 'Record Wastage';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <form id="wastageForm">
            <input type="hidden" id="wastageId" value="${isEdit ? record.id : ''}">
            
            <div class="form-group">
                <label class="form-label">Item Name *</label>
                <select id="wastageItem" class="form-control" required ${isEdit ? 'disabled' : ''}>
                    <option value="">Select Item</option>
                    ${foodItems.map(item => 
                        `<option value="${item.name}" data-price="${item.purchasePrice}" data-unit="${item.unit}" ${isEdit && record.itemName === item.name ? 'selected' : ''}>${item.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Quantity Wasted *</label>
                <input type="number" id="wastageQuantity" class="form-control" value="${isEdit ? record.quantityWasted : ''}" min="0.01" step="0.01" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Unit</label>
                <input type="text" id="wastageUnit" class="form-control" value="${isEdit ? record.unit : ''}" readonly>
            </div>
            
            <div class="form-group">
                <label class="form-label">Wastage Date *</label>
                <input type="date" id="wastageDate" class="form-control" value="${isEdit ? record.wastageDate : new Date().toISOString().split('T')[0]}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Reason *</label>
                <select id="wastageReason" class="form-control" required>
                    <option value="">Select Reason</option>
                    ${wastageReasons.map(reason => 
                        `<option value="${reason}" ${isEdit && record.reason === reason ? 'selected' : ''}>${reason}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Cost Impact (₹)</label>
                <input type="number" id="wastageCost" class="form-control" value="${isEdit ? record.costImpact : ''}" step="0.01" readonly>
            </div>
            
            <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea id="wastageNotes" class="form-control">${isEdit ? record.notes : ''}</textarea>
            </div>
            
            <div class="form-group">
                <button type="submit" class="btn btn--primary btn--full-width">
                    ${isEdit ? 'Update Record' : 'Record Wastage'}
                </button>
            </div>
        </form>
    `;
    
    // Auto-calculate cost impact
    const itemSelect = document.getElementById('wastageItem');
    const quantityInput = document.getElementById('wastageQuantity');
    const unitInput = document.getElementById('wastageUnit');
    const costInput = document.getElementById('wastageCost');
    
    function updateCostAndUnit() {
        const selectedOption = itemSelect.options[itemSelect.selectedIndex];
        if (selectedOption.value) {
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const unit = selectedOption.dataset.unit || '';
            const quantity = parseFloat(quantityInput.value) || 0;
            
            unitInput.value = unit;
            costInput.value = (price * quantity / selectedOption.dataset.unit === 'pieces' ? 1 : quantity).toFixed(2);
        }
    }
    
    itemSelect.addEventListener('change', updateCostAndUnit);
    quantityInput.addEventListener('input', updateCostAndUnit);
    
    // Initialize for edit mode
    if (isEdit) {
        updateCostAndUnit();
    }
    
    document.getElementById('wastageForm').addEventListener('submit', handleWastageSubmit);
    showModal();
}

function handleWastageSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: document.getElementById('wastageId').value || Date.now(),
        itemName: document.getElementById('wastageItem').value,
        quantityWasted: parseFloat(document.getElementById('wastageQuantity').value),
        unit: document.getElementById('wastageUnit').value,
        wastageDate: document.getElementById('wastageDate').value,
        reason: document.getElementById('wastageReason').value,
        costImpact: parseFloat(document.getElementById('wastageCost').value) || 0,
        notes: document.getElementById('wastageNotes').value
    };
    
    const isEdit = document.getElementById('wastageId').value !== '';
    
    if (isEdit) {
        const index = wastageRecords.findIndex(r => r.id == formData.id);
        wastageRecords[index] = formData;
        saveWastageRecords();
        if (typeof renderWastageAnalytics === 'function') renderWastageAnalytics();
        showToast('Wastage record updated successfully!', 'success');
        addActivity('Updated wastage record', 'update', formData.itemName);
    } else {
        wastageRecords.push(formData);
        saveWastageRecords();
        if (typeof renderWastageAnalytics === 'function') renderWastageAnalytics();
        showToast('Wastage recorded successfully!', 'success');
        addActivity('Recorded wastage', 'wastage', `${formData.itemName} - ${formData.quantityWasted} ${formData.unit}`);
    }
    
    closeModal();
    renderWastageTable();
    updateWastageCharts();
}

function viewWastageRecord(id) {
    const record = wastageRecords.find(r => r.id === id);
    
    document.getElementById('modalTitle').textContent = 'Wastage Record Details';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="wastage-details">
            <h4>Wastage Report</h4>
            <p><strong>Date:</strong> ${formatDate(record.wastageDate)}</p>
            <p><strong>Item:</strong> ${record.itemName}</p>
            <p><strong>Quantity Wasted:</strong> ${record.quantityWasted} ${record.unit}</p>
            <p><strong>Reason:</strong> ${record.reason}</p>
            <p><strong>Cost Impact:</strong> ₹${record.costImpact.toFixed(2)}</p>
            <div style="margin-top: 20px;">
                <h5>Notes:</h5>
                <p>${record.notes || 'No additional notes'}</p>
            </div>
        </div>
    `;
    
    showModal();
}

function editWastageRecord(id) {
    openAddWastageModal(id);
}

function deleteWastageRecord(id) {
    if (confirm('Are you sure you want to delete this wastage record?')) {
        const record = wastageRecords.find(r => r.id === id);
        wastageRecords = wastageRecords.filter(r => r.id !== id);
        saveWastageRecords();
        showToast('Wastage record deleted successfully!', 'success');
        addActivity('Deleted wastage record', 'delete', record.itemName);
        renderWastageTable();
        updateWastageCharts();
    }
}

// =======================
// CHARTS FUNCTIONS
// =======================

function initializeCharts() {
    updateCharts();
    updateWastageCharts();
}

function updateCharts() {
    updateCategoryChart();
    updateStockChart();
    updateSupplierChart();
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Prepare data
    const categoryData = {};
    categories.forEach(cat => categoryData[cat] = 0);
    foodItems.forEach(item => {
        categoryData[item.category] = (categoryData[item.category] || 0) + 1;
    });
    
    const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325'];
    
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                label: 'Number of Items',
                data: Object.values(categoryData),
                backgroundColor: chartColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateStockChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    // Destroy existing chart
    if (stockChart) {
        stockChart.destroy();
    }
    
    // Prepare data - showing low stock items
    const lowStockItems = foodItems.filter(item => item.quantity < item.minimumStock * 1.2);
    const labels = lowStockItems.map(item => item.name);
    const currentStock = lowStockItems.map(item => item.quantity);
    const minimumStock = lowStockItems.map(item => item.minimumStock);
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Stock',
                    data: currentStock,
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Minimum Stock',
                    data: minimumStock,
                    borderColor: '#DB4545',
                    backgroundColor: 'rgba(219, 69, 69, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateSupplierChart() {
    const ctx = document.getElementById('supplierChart').getContext('2d');
    
    // Destroy existing chart
    if (supplierChart) {
        supplierChart.destroy();
    }
    
    // Prepare data - count items by supplier
    const supplierData = {};
    suppliers.forEach(supplier => supplierData[supplier.name] = 0);
    foodItems.forEach(item => {
        if (supplierData.hasOwnProperty(item.supplier)) {
            supplierData[item.supplier]++;
        }
    });
    
    const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F', '#DB4545', '#D2BA4C'];
    
    supplierChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(supplierData),
            datasets: [{
                data: Object.values(supplierData),
                backgroundColor: chartColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateWastageCharts() {
    updateWastageByCategoryChart();
    updateWastageTimeChart();
}

function updateWastageByCategoryChart() {
    const ctx = document.getElementById('wastageChart');
    if (!ctx) return;
    
    const ctxElement = ctx.getContext('2d');
    
    // Destroy existing chart
    if (wastageChart) {
        wastageChart.destroy();
    }
    
    // Prepare data - group wastage by item category
    const wastageByCategory = {};
    categories.forEach(cat => wastageByCategory[cat] = 0);
    
    wastageRecords.forEach(record => {
        const item = foodItems.find(i => i.name === record.itemName);
        const category = item ? item.category : 'Others';
        wastageByCategory[category] = (wastageByCategory[category] || 0) + record.costImpact;
    });
    
    const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325'];
    
    wastageChart = new Chart(ctxElement, {
        type: 'doughnut',
        data: {
            labels: Object.keys(wastageByCategory).filter(key => wastageByCategory[key] > 0),
            datasets: [{
                data: Object.values(wastageByCategory).filter(val => val > 0),
                backgroundColor: chartColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateWastageTimeChart() {
    const ctx = document.getElementById('wastageTimeChart');
    if (!ctx) return;
    
    const ctxElement = ctx.getContext('2d');
    
    // Destroy existing chart
    if (wastageTimeChart) {
        wastageTimeChart.destroy();
    }
    
    // Prepare data - group wastage by month
    const wastageByMonth = {};
    wastageRecords.forEach(record => {
        const month = record.wastageDate.substring(0, 7); // YYYY-MM
        wastageByMonth[month] = (wastageByMonth[month] || 0) + record.costImpact;
    });
    
    const sortedMonths = Object.keys(wastageByMonth).sort();
    
    wastageTimeChart = new Chart(ctxElement, {
        type: 'line',
        data: {
            labels: sortedMonths.map(month => formatMonthYear(month)),
            datasets: [{
                label: 'Wastage Cost (₹)',
                data: sortedMonths.map(month => wastageByMonth[month]),
                borderColor: '#DB4545',
                backgroundColor: 'rgba(219, 69, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// =======================
// UTILITY FUNCTIONS
// =======================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatMonthYear(monthString) {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short'
    });
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

function handleSort(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Update sort icons
    document.querySelectorAll('[data-sort] i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentHeader = document.querySelector(`[data-sort="${field}"] i`);
    if (currentHeader) {
        currentHeader.className = currentSort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
    
    renderInventoryTable();
}

function renderPagination(totalItems, containerId) {
    const container = document.getElementById(containerId);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalItems = getFilteredInventoryItems().length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderInventoryTable();
    }
}

// =======================
// MODAL FUNCTIONS
// =======================

function showModal() {
    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =======================
// TOAST NOTIFICATIONS
// =======================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set message and style
    toastMessage.textContent = message;
    toast.className = `toast active ${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        closeToast();
    }, 5000);
}

function closeToast() {
    document.getElementById('toast').classList.remove('active');
}

// =======================
// EXPORT/IMPORT FUNCTIONS
// =======================

function exportInventoryCSV() {
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Expiry Date', 'Supplier', 'Price', 'Storage', 'Min Stock'];
    const csvContent = [
        headers.join(','),
        ...foodItems.map(item => [
            item.name,
            item.category,
            item.quantity,
            item.unit,
            item.expiryDate,
            item.supplier,
            item.purchasePrice,
            item.storageLocation,
            item.minimumStock
        ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'inventory.csv');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    showToast('Data exported successfully!', 'success');
}

function backupData() {
    const backupData = {
        foodItems,
        suppliers,
        haccpRecords,
        wastageRecords,
        activities,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `food-management-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Backup created successfully!', 'success');
}

function restoreData() {
    const fileInput = document.getElementById('restoreFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a backup file first.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // Restore data
            if (backupData.foodItems) foodItems = backupData.foodItems;
            if (backupData.suppliers) suppliers = backupData.suppliers;
            if (backupData.haccpRecords) haccpRecords = backupData.haccpRecords;
            if (backupData.wastageRecords) wastageRecords = backupData.wastageRecords;
            if (backupData.activities) activities = backupData.activities;
            
            // Persist restored data to localStorage
            saveFoodItems();
            saveSuppliers();
            saveHaccpRecords();
            saveWastageRecords();
            saveActivities();
            
            // Refresh all views
            updateDashboard();
            renderInventoryTable();
            renderSupplierTable();
            renderHaccpTable();
            renderWastageTable();
            updateCharts();
            updateWastageCharts();
            
            showToast('Data restored successfully!', 'success');
            addActivity('Data restored from backup', 'system');
        } catch (error) {
            showToast('Error reading backup file. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
}

// =======================
// REPORTS FUNCTIONS
// =======================

function generateReport(reportType) {
    const reportContent = document.getElementById('reportContent');
    const reportBody = document.getElementById('reportBody');
    const reportTitle = document.getElementById('reportTitle');
    
    let reportHTML = '';
    
    switch(reportType) {
        case 'inventory':
            reportTitle.textContent = 'Inventory Status Report';
            reportHTML = generateInventoryReport();
            break;
        case 'supplier':
            reportTitle.textContent = 'Supplier Performance Report';
            reportHTML = generateSupplierReport();
            break;
        case 'haccp':
            reportTitle.textContent = 'HACCP Compliance Summary';
            reportHTML = generateHaccpReport();
            break;
        case 'wastage':
            reportTitle.textContent = 'Wastage Analysis Report';
            reportHTML = generateWastageReport();
            break;
    }
    
    reportBody.innerHTML = reportHTML;
    reportContent.classList.remove('hidden');
    
    // Setup report action buttons
    document.getElementById('printReportBtn').onclick = () => window.print();
    document.getElementById('exportReportBtn').onclick = () => exportReport(reportType);
}

function generateInventoryReport() {
    const totalItems = foodItems.length;
    const lowStockItems = foodItems.filter(item => item.quantity < item.minimumStock);
    const expiringItems = foodItems.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });
    const expiredItems = foodItems.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        return expiryDate < today;
    });
    
    const totalValue = foodItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    
    return `
        <div class="report-section">
            <h4>Inventory Summary</h4>
            <div class="report-metrics">
                <div class="report-metric">
                    <span class="metric-label">Total Items:</span>
                    <span class="metric-value">${totalItems}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Total Value:</span>
                    <span class="metric-value">₹${totalValue.toFixed(2)}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Low Stock Items:</span>
                    <span class="metric-value">${lowStockItems.length}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Expiring Soon:</span>
                    <span class="metric-value">${expiringItems.length}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Expired Items:</span>
                    <span class="metric-value">${expiredItems.length}</span>
                </div>
            </div>
        </div>
        
        ${lowStockItems.length > 0 ? `
            <div class="report-section">
                <h4>Low Stock Alert</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Current Stock</th>
                            <th>Minimum Stock</th>
                            <th>Reorder Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStockItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>${item.minimumStock} ${item.unit}</td>
                                <td>${Math.max(item.minimumStock - item.quantity, item.minimumStock)} ${item.unit}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}
        
        ${expiringItems.length > 0 ? `
            <div class="report-section">
                <h4>Items Expiring Soon</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Expiry Date</th>
                            <th>Days Remaining</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expiringItems.map(item => {
                            const daysRemaining = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                            return `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity} ${item.unit}</td>
                                    <td>${formatDate(item.expiryDate)}</td>
                                    <td>${daysRemaining}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}
        
        <style>
            .report-section { margin-bottom: 30px; }
            .report-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
            .report-metric { display: flex; justify-content: space-between; padding: 12px; background: var(--color-bg-1); border-radius: 8px; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th, .report-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
            .report-table th { background-color: var(--color-bg-1); font-weight: 600; }
        </style>
    `;
}

function generateSupplierReport() {
    const avgRating = suppliers.reduce((sum, supplier) => sum + supplier.rating, 0) / suppliers.length;
    const supplierPerformance = suppliers.map(supplier => {
        const suppliedItems = foodItems.filter(item => item.supplier === supplier.name);
        return {
            ...supplier,
            itemCount: suppliedItems.length,
            totalValue: suppliedItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0)
        };
    }).sort((a, b) => b.totalValue - a.totalValue);
    
    return `
        <div class="report-section">
            <h4>Supplier Performance Summary</h4>
            <div class="report-metrics">
                <div class="report-metric">
                    <span class="metric-label">Total Suppliers:</span>
                    <span class="metric-value">${suppliers.length}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Average Rating:</span>
                    <span class="metric-value">${avgRating.toFixed(1)}/5.0</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Top Performer:</span>
                    <span class="metric-value">${supplierPerformance[0]?.name || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h4>Supplier Rankings</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Supplier Name</th>
                        <th>Items Supplied</th>
                        <th>Total Value</th>
                        <th>Rating</th>
                        <th>Last Supply</th>
                    </tr>
                </thead>
                <tbody>
                    ${supplierPerformance.map(supplier => `
                        <tr>
                            <td>${supplier.name}</td>
                            <td>${supplier.itemCount}</td>
                            <td>₹${supplier.totalValue.toFixed(2)}</td>
                            <td>${supplier.rating}/5.0</td>
                            <td>${formatDate(supplier.lastSupplyDate)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <style>
            .report-section { margin-bottom: 30px; }
            .report-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
            .report-metric { display: flex; justify-content: space-between; padding: 12px; background: var(--color-bg-1); border-radius: 8px; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th, .report-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
            .report-table th { background-color: var(--color-bg-1); font-weight: 600; }
        </style>
    `;
}

function generateHaccpReport() {
    const totalInspections = haccpRecords.length;
    const passedInspections = haccpRecords.filter(r => r.status === 'Passed').length;
    const failedInspections = haccpRecords.filter(r => r.status === 'Failed').length;
    const needsReview = haccpRecords.filter(r => r.status === 'Needs Review').length;
    const complianceRate = totalInspections > 0 ? (passedInspections / totalInspections * 100).toFixed(1) : 0;
    
    const recentInspections = haccpRecords.sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate)).slice(0, 10);
    
    return `
        <div class="report-section">
            <h4>HACCP Compliance Summary</h4>
            <div class="report-metrics">
                <div class="report-metric">
                    <span class="metric-label">Total Inspections:</span>
                    <span class="metric-value">${totalInspections}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Compliance Rate:</span>
                    <span class="metric-value">${complianceRate}%</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Passed:</span>
                    <span class="metric-value">${passedInspections}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Failed:</span>
                    <span class="metric-value">${failedInspections}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Needs Review:</span>
                    <span class="metric-value">${needsReview}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h4>Recent Inspections</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Inspector</th>
                        <th>Area</th>
                        <th>Status</th>
                        <th>Hygiene Rating</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentInspections.map(record => `
                        <tr>
                            <td>${formatDate(record.inspectionDate)}</td>
                            <td>${record.inspectorName}</td>
                            <td>${record.areaInspected}</td>
                            <td>
                                <span class="badge ${getStatusBadgeClass(record.status)}">
                                    ${record.status}
                                </span>
                            </td>
                            <td>${record.hygieneRating}/5</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <style>
            .report-section { margin-bottom: 30px; }
            .report-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
            .report-metric { display: flex; justify-content: space-between; padding: 12px; background: var(--color-bg-1); border-radius: 8px; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th, .report-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
            .report-table th { background-color: var(--color-bg-1); font-weight: 600; }
            .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
            .badge--success { background: rgba(33, 128, 141, 0.1); color: var(--color-success); }
            .badge--error { background: rgba(192, 21, 47, 0.1); color: var(--color-error); }
            .badge--warning { background: rgba(168, 75, 47, 0.1); color: var(--color-warning); }
        </style>
    `;
}

function generateWastageReport() {
    const totalWastage = wastageRecords.reduce((sum, record) => sum + record.quantityWasted, 0);
    const totalCost = wastageRecords.reduce((sum, record) => sum + record.costImpact, 0);
    const avgCostPerIncident = wastageRecords.length > 0 ? totalCost / wastageRecords.length : 0;
    
    // Group by reason
    const wastageByReason = {};
    wastageReasons.forEach(reason => wastageByReason[reason] = { count: 0, cost: 0 });
    wastageRecords.forEach(record => {
        if (wastageByReason[record.reason]) {
            wastageByReason[record.reason].count++;
            wastageByReason[record.reason].cost += record.costImpact;
        }
    });
    
    const topWastageReasons = Object.entries(wastageByReason)
        .filter(([reason, data]) => data.count > 0)
        .sort(([,a], [,b]) => b.cost - a.cost);
    
    return `
        <div class="report-section">
            <h4>Wastage Analysis Summary</h4>
            <div class="report-metrics">
                <div class="report-metric">
                    <span class="metric-label">Total Incidents:</span>
                    <span class="metric-value">${wastageRecords.length}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Total Cost Impact:</span>
                    <span class="metric-value">₹${totalCost.toFixed(2)}</span>
                </div>
                <div class="report-metric">
                    <span class="metric-label">Average Cost/Incident:</span>
                    <span class="metric-value">₹${avgCostPerIncident.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h4>Wastage by Reason</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Reason</th>
                        <th>Incidents</th>
                        <th>Total Cost</th>
                        <th>% of Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${topWastageReasons.map(([reason, data]) => `
                        <tr>
                            <td>${reason}</td>
                            <td>${data.count}</td>
                            <td>₹${data.cost.toFixed(2)}</td>
                            <td>${totalCost > 0 ? (data.cost / totalCost * 100).toFixed(1) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="report-section">
            <h4>Recent Wastage Records</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Reason</th>
                        <th>Cost Impact</th>
                    </tr>
                </thead>
                <tbody>
                    ${wastageRecords.slice(0, 10).map(record => `
                        <tr>
                            <td>${formatDate(record.wastageDate)}</td>
                            <td>${record.itemName}</td>
                            <td>${record.quantityWasted} ${record.unit}</td>
                            <td>${record.reason}</td>
                            <td>₹${record.costImpact.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <style>
            .report-section { margin-bottom: 30px; }
            .report-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
            .report-metric { display: flex; justify-content: space-between; padding: 12px; background: var(--color-bg-1); border-radius: 8px; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th, .report-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
            .report-table th { background-color: var(--color-bg-1); font-weight: 600; }
        </style>
    `;
}

function exportReport(reportType) {
    const reportTitle = document.getElementById('reportTitle').textContent;
    const reportBody = document.getElementById('reportBody');
    const reportContent = reportBody.outerHTML;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportTitle}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
                .metric-item { background: #f9f9f9; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>${reportTitle}</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            ${reportContent}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Report exported successfully!', 'success');
}

// Make functions available globally for onclick handlers
window.editItem = editItem;
window.deleteItem = deleteItem;
window.viewSupplier = viewSupplier;
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;
window.viewHaccpRecord = viewHaccpRecord;
window.editHaccpRecord = editHaccpRecord;
window.deleteHaccpRecord = deleteHaccpRecord;
window.viewWastageRecord = viewWastageRecord;
window.editWastageRecord = editWastageRecord;
window.deleteWastageRecord = deleteWastageRecord;
window.changePage = changePage;

// Console message for demo
console.log('🍽️ Food Management System v1.0 - BCA Minor Project 2025');
console.log('📧 Demo Credentials: admin / admin123');
console.log('💾 Data is persisted in localStorage — survives page refresh!');
console.log('🚀 All features are fully functional!');
