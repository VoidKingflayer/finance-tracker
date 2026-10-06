/**
 * ФинТрекер — Мобильное приложение (iPhone 15 & Samsung S25 Ultra)
 * Мультивалютный учет доходов и расходов: GEL (₾), USD ($), RUB (₽)
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const STORAGE_KEYS = {
    TRANSACTIONS: 'ft_transactions_data',
    CATEGORIES: 'ft_categories_data',
    RATES: 'ft_exchange_rates',
    THEME: 'ft_theme_mode',
    CONSOLIDATED_CURR: 'ft_consolidated_currency'
  };

  const CURRENCY_SYMBOLS = {
    GEL: '₾',
    USD: '$',
    RUB: '₽'
  };

  const DEFAULT_RATES = {
    GEL_PER_USD: 2.72, // 1 USD = 2.72 GEL
    RUB_PER_USD: 92.50 // 1 USD = 92.50 RUB
  };

  const DEFAULT_CATEGORIES = [
    // Расходы
    { id: 'cat_food', name: 'Еда и продукты', type: 'expense', icon: '🍔', color: '#f97316', isDefault: true },
    { id: 'cat_communal', name: 'Коммуналка и жилье', type: 'expense', icon: '🏠', color: '#3b82f6', isDefault: true },
    { id: 'cat_transport', name: 'Транспорт и авто', type: 'expense', icon: '🚗', color: '#06b6d4', isDefault: true },
    { id: 'cat_cafe', name: 'Кафе и рестораны', type: 'expense', icon: '☕', color: '#ec4899', isDefault: true },
    { id: 'cat_health', name: 'Здоровье и аптека', type: 'expense', icon: '💊', color: '#10b981', isDefault: true },
    { id: 'cat_fun', name: 'Развлечения и отдых', type: 'expense', icon: '🎮', color: '#8b5cf6', isDefault: true },
    { id: 'cat_shopping', name: 'Покупки и одежда', type: 'expense', icon: '🛍️', color: '#eab308', isDefault: true },
    { id: 'cat_comm', name: 'Связь и интернет', type: 'expense', icon: '📱', color: '#6366f1', isDefault: true },
    { id: 'cat_other_exp', name: 'Прочие расходы', type: 'expense', icon: '📦', color: '#64748b', isDefault: true },

    // Доходы
    { id: 'cat_salary', name: 'Зарплата', type: 'income', icon: '💰', color: '#10b981', isDefault: true },
    { id: 'cat_freelance', name: 'Фриланс и проекты', type: 'income', icon: '💻', color: '#3b82f6', isDefault: true },
    { id: 'cat_invest', name: 'Инвестиции', type: 'income', icon: '📈', color: '#8b5cf6', isDefault: true },
    { id: 'cat_gift', name: 'Подарки', type: 'income', icon: '🎁', color: '#ec4899', isDefault: true },
    { id: 'cat_other_inc', name: 'Другой доход', type: 'income', icon: '💵', color: '#14b8a6', isDefault: true }
  ];

  const DEMO_TRANSACTIONS = [
    {
      id: 'tx_demo_1',
      type: 'income',
      amount: 4500,
      currency: 'GEL',
      categoryId: 'cat_salary',
      date: getOffsetDateString(0),
      note: 'Основная зарплата'
    },
    {
      id: 'tx_demo_2',
      type: 'expense',
      amount: 230,
      currency: 'GEL',
      categoryId: 'cat_communal',
      date: getOffsetDateString(0),
      note: 'Коммуналка (свет, вода, газ)'
    },
    {
      id: 'tx_demo_3',
      type: 'expense',
      amount: 145.50,
      currency: 'GEL',
      categoryId: 'cat_food',
      date: getOffsetDateString(-1),
      note: 'Carrefour продукты'
    },
    {
      id: 'tx_demo_4',
      type: 'income',
      amount: 1200,
      currency: 'USD',
      categoryId: 'cat_freelance',
      date: getOffsetDateString(-2),
      note: 'Оплата за разработку сайта'
    },
    {
      id: 'tx_demo_5',
      type: 'expense',
      amount: 45,
      currency: 'USD',
      categoryId: 'cat_comm',
      date: getOffsetDateString(-2),
      note: 'ChatGPT & Claude'
    },
    {
      id: 'tx_demo_6',
      type: 'income',
      amount: 45000,
      currency: 'RUB',
      categoryId: 'cat_other_inc',
      date: getOffsetDateString(-3),
      note: 'Перевод от заказчика'
    },
    {
      id: 'tx_demo_7',
      type: 'expense',
      amount: 8500,
      currency: 'RUB',
      categoryId: 'cat_shopping',
      date: getOffsetDateString(-4),
      note: 'Заказ Ozon'
    }
  ];

  function getOffsetDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  // --- State ---
  let transactions = [];
  let categories = [];
  let rates = { ...DEFAULT_RATES };
  let currentTxType = 'expense';
  let currentTxCurrency = 'GEL';
  let consolidatedCurrency = 'USD';
  let currentTheme = 'dark';
  let activeScreenId = 'screenHome';

  // --- DOM Elements ---
  const el = {
    // Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    metaThemeColor: document.getElementById('metaThemeColor'),

    // Bottom Navigation
    navTabs: document.querySelectorAll('.nav-tab-item'),
    screens: document.querySelectorAll('.screen-view'),
    openAddTxModalBtn: document.getElementById('openAddTxModalBtn'),

    // Wallet Carousel
    walletScrollTrack: document.getElementById('walletScrollTrack'),
    carouselDots: document.getElementById('carouselDots'),

    // Currency Balances
    netGel: document.getElementById('netGel'),
    incomeGel: document.getElementById('incomeGel'),
    expenseGel: document.getElementById('expenseGel'),

    netUsd: document.getElementById('netUsd'),
    incomeUsd: document.getElementById('incomeUsd'),
    expenseUsd: document.getElementById('expenseUsd'),

    netRub: document.getElementById('netRub'),
    incomeRub: document.getElementById('incomeRub'),
    expenseRub: document.getElementById('expenseRub'),

    consolidatedTotal: document.getElementById('consolidatedTotal'),
    consolidatedCurrencySelect: document.getElementById('consolidatedCurrencySelect'),
    consolidatedRateNote: document.getElementById('consolidatedRateNote'),

    // Home Screen Actions & Recent
    homeAddExpenseBtn: document.getElementById('homeAddExpenseBtn'),
    homeAddIncomeBtn: document.getElementById('homeAddIncomeBtn'),
    homeRatesBtn: document.getElementById('homeRatesBtn'),
    homeGoAnalyticsBtn: document.getElementById('homeGoAnalyticsBtn'),
    homeGoHistoryBtn: document.getElementById('homeGoHistoryBtn'),
    homeTxCount: document.getElementById('homeTxCount'),
    homeRecentTxList: document.getElementById('homeRecentTxList'),
    homeMiniDonutChart: document.getElementById('homeMiniDonutChart'),
    homeTopCatsList: document.getElementById('homeTopCatsList'),
    demoDataHint: document.getElementById('demoDataHint'),
    loadDemoDataBtn: document.getElementById('loadDemoDataBtn'),

    // History Screen
    historyCounterBadge: document.getElementById('historyCounterBadge'),
    historySearchInput: document.getElementById('historySearchInput'),
    filterTypeSelect: document.getElementById('filterTypeSelect'),
    filterCurrencySelect: document.getElementById('filterCurrencySelect'),
    filterCategorySelect: document.getElementById('filterCategorySelect'),
    transactionsList: document.getElementById('transactionsList'),

    // Analytics Screen
    analyticsCurrencySelect: document.getElementById('analyticsCurrencySelect'),
    categoryDonutChart: document.getElementById('categoryDonutChart'),
    chartExpenseTotal: document.getElementById('chartExpenseTotal'),
    chartLegendList: document.getElementById('chartLegendList'),

    // Categories Screen
    openAddCategoryBtn: document.getElementById('openAddCategoryBtn'),
    categoryTagsContainer: document.getElementById('categoryTagsContainer'),

    // Settings Screen Items
    installPwaBtn: document.getElementById('installPwaBtn'),
    settingsRatesBtn: document.getElementById('settingsRatesBtn'),
    downloadBackupBtn: document.getElementById('downloadBackupBtn'),
    importFileBtn: document.getElementById('importFileBtn'),
    importFileInput: document.getElementById('importFileInput'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),

    // Sheet: Add Transaction
    addTxModal: document.getElementById('addTxModal'),
    transactionForm: document.getElementById('transactionForm'),
    segmentButtons: document.querySelectorAll('.segment-btn'),
    currPills: document.querySelectorAll('.mcurr-pill'),
    txAmount: document.getElementById('txAmount'),
    txAmountCurrencySymbol: document.getElementById('txAmountCurrencySymbol'),
    txCategory: document.getElementById('txCategory'),
    txDate: document.getElementById('txDate'),
    txNote: document.getElementById('txNote'),
    quickAmtChips: document.querySelectorAll('.quick-amt-chip'),
    quickAddCatSheetBtn: document.getElementById('quickAddCatSheetBtn'),

    // Sheet: Add Category
    categoryModal: document.getElementById('categoryModal'),
    addCategoryForm: document.getElementById('addCategoryForm'),
    newCatName: document.getElementById('newCatName'),
    newCatType: document.getElementById('newCatType'),
    newCatIcon: document.getElementById('newCatIcon'),
    newCatColor: document.getElementById('newCatColor'),

    // Sheet: Rates
    ratesModal: document.getElementById('ratesModal'),
    ratesForm: document.getElementById('ratesForm'),
    rateGel: document.getElementById('rateGel'),
    rateRub: document.getElementById('rateRub'),
    resetRatesBtn: document.getElementById('resetRatesBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  // --- Initializer ---
  function init() {
    loadStateFromStorage();
    initTheme();
    initDates();
    setupEventListeners();
    setupCarouselTracking();
    renderCategoryDropdowns();
    renderAll();
  }

  // --- Storage ---
  function loadStateFromStorage() {
    try {
      const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      transactions = savedTx ? JSON.parse(savedTx) : [];

      const savedCat = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      categories = savedCat ? JSON.parse(savedCat) : [...DEFAULT_CATEGORIES];

      const savedRates = localStorage.getItem(STORAGE_KEYS.RATES);
      rates = savedRates ? { ...DEFAULT_RATES, ...JSON.parse(savedRates) } : { ...DEFAULT_RATES };

      const savedConsolidated = localStorage.getItem(STORAGE_KEYS.CONSOLIDATED_CURR);
      if (savedConsolidated) {
        consolidatedCurrency = savedConsolidated;
        el.consolidatedCurrencySelect.value = consolidatedCurrency;
      }
    } catch (e) {
      console.error('Ошибка загрузки данных из LocalStorage:', e);
      transactions = [];
      categories = [...DEFAULT_CATEGORIES];
      rates = { ...DEFAULT_RATES };
    }
  }

  function saveStateToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
      localStorage.setItem(STORAGE_KEYS.CONSOLIDATED_CURR, consolidatedCurrency);
    } catch (e) {
      console.error('Ошибка сохранения данных:', e);
      showToast('Ошибка сохранения данных', 'error');
    }
  }

  // --- Theme Handling ---
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') {
      currentTheme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      currentTheme = 'light';
    } else {
      currentTheme = 'dark';
    }
    applyTheme(currentTheme);
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (el.metaThemeColor) {
      el.metaThemeColor.setAttribute('content', theme === 'dark' ? '#080c14' : '#f4f6fa');
    }
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    drawCharts();
  }

  function initDates() {
    const today = new Date().toISOString().split('T')[0];
    el.txDate.value = today;
  }

  // --- Navigation & Tabs ---
  function switchScreen(screenId) {
    activeScreenId = screenId;
    el.screens.forEach(screen => {
      screen.classList.toggle('active', screen.id === screenId);
    });

    el.navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.screen === screenId);
    });

    if (screenId === 'screenAnalytics') {
      updateAnalytics();
    } else if (screenId === 'screenHistory') {
      renderTransactionsList();
    } else if (screenId === 'screenCategories') {
      renderCategoryCards();
    } else if (screenId === 'screenHome') {
      updateBalanceCards();
      renderHomeRecent();
      renderHomeMiniAnalytics();
    }
  }

  // --- Carousel Tracking ---
  function setupCarouselTracking() {
    const track = el.walletScrollTrack;
    const dots = el.carouselDots.querySelectorAll('.dot');
    if (!track || dots.length === 0) return;

    track.addEventListener('scroll', () => {
      const scrollLeft = track.scrollLeft;
      const cardWidth = track.offsetWidth * 0.88;
      const activeIndex = Math.min(
        dots.length - 1,
        Math.max(0, Math.round(scrollLeft / (cardWidth + 12)))
      );

      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIndex);
      });
    }, { passive: true });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme Switcher
    el.themeToggleBtn.addEventListener('click', toggleTheme);

    // Navigation Tabs
    el.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchScreen(tab.dataset.screen));
    });

    // Shortcuts from Home screen
    el.homeGoAnalyticsBtn.addEventListener('click', () => switchScreen('screenAnalytics'));
    el.homeGoHistoryBtn.addEventListener('click', () => switchScreen('screenHistory'));

    // Open Add Transaction Sheet
    el.openAddTxModalBtn.addEventListener('click', () => {
      setFormType('expense');
      openSheet(el.addTxModal);
    });

    el.homeAddExpenseBtn.addEventListener('click', () => {
      setFormType('expense');
      openSheet(el.addTxModal);
    });

    el.homeAddIncomeBtn.addEventListener('click', () => {
      setFormType('income');
      openSheet(el.addTxModal);
    });

    el.homeRatesBtn.addEventListener('click', () => {
      openRatesModal();
    });

    // Quick Add Category from sheet
    el.quickAddCatSheetBtn.addEventListener('click', () => {
      closeSheet(el.addTxModal);
      openSheet(el.categoryModal);
    });

    el.openAddCategoryBtn.addEventListener('click', () => {
      openSheet(el.categoryModal);
    });

    // Form Type Segment Buttons
    el.segmentButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setFormType(btn.dataset.type);
      });
    });

    // Form Currency Pills
    el.currPills.forEach(pill => {
      pill.addEventListener('click', () => {
        el.currPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const radio = pill.querySelector('input');
        radio.checked = true;
        currentTxCurrency = radio.value;
        el.txAmountCurrencySymbol.textContent = CURRENCY_SYMBOLS[currentTxCurrency];
      });
    });

    // Quick Increment Chips
    el.quickAmtChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const delta = parseFloat(chip.dataset.amt) || 0;
        const currentVal = parseFloat(el.txAmount.value) || 0;
        el.txAmount.value = (currentVal + delta).toFixed(2).replace(/\.00$/, '');
      });
    });

    // Form Submit
    el.transactionForm.addEventListener('submit', handleAddTransaction);

    // Demo Data
    el.loadDemoDataBtn.addEventListener('click', () => {
      transactions = [...DEMO_TRANSACTIONS];
      saveStateToStorage();
      renderAll();
      showToast('Примеры записей загружены!', 'success');
    });

    // Consolidated Currency Select
    el.consolidatedCurrencySelect.addEventListener('change', (e) => {
      consolidatedCurrency = e.target.value;
      saveStateToStorage();
      updateBalanceCards();
      renderHomeMiniAnalytics();
      if (activeScreenId === 'screenAnalytics') updateAnalytics();
    });

    // History Filters & Search
    el.historySearchInput.addEventListener('input', renderTransactionsList);
    el.filterTypeSelect.addEventListener('change', renderTransactionsList);
    el.filterCurrencySelect.addEventListener('change', renderTransactionsList);
    el.filterCategorySelect.addEventListener('change', renderTransactionsList);

    // Analytics Currency Select
    el.analyticsCurrencySelect.addEventListener('change', updateAnalytics);

    // Modal Close buttons & Backdrop tap
    document.querySelectorAll('.sheet-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.dataset.close;
        if (modalId) closeSheet(document.getElementById(modalId));
      });
    });

    document.querySelectorAll('.mobile-sheet-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeSheet(backdrop);
      });
    });

    // Category Modal Form
    el.addCategoryForm.addEventListener('submit', handleAddCategory);

    // Emoji bubbles
    document.querySelectorAll('.emoji-bubble').forEach(b => {
      b.addEventListener('click', () => {
        el.newCatIcon.value = b.textContent;
      });
    });

    // Color dots
    document.querySelectorAll('.cp-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        el.newCatColor.value = dot.dataset.color;
      });
    });

    // Settings screen actions
    if (el.installPwaBtn) {
      el.installPwaBtn.addEventListener('click', handleInstallPWA);
    }
    el.settingsRatesBtn.addEventListener('click', openRatesModal);
    el.downloadBackupBtn.addEventListener('click', handleDownloadBackup);
    el.importFileBtn.addEventListener('click', () => el.importFileInput.click());
    el.importFileInput.addEventListener('change', handleImportBackup);
    el.exportCsvBtn.addEventListener('click', handleExportCSV);
    el.clearAllDataBtn.addEventListener('click', handleClearAllData);

    // Rates Form
    el.ratesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const gelVal = parseFloat(el.rateGel.value);
      const rubVal = parseFloat(el.rateRub.value);
      if (gelVal > 0 && rubVal > 0) {
        rates.GEL_PER_USD = gelVal;
        rates.RUB_PER_USD = rubVal;
        saveStateToStorage();
        closeSheet(el.ratesModal);
        updateBalanceCards();
        renderHomeMiniAnalytics();
        if (activeScreenId === 'screenAnalytics') updateAnalytics();
        showToast('Курсы валют сохранены', 'success');
      }
    });

    el.resetRatesBtn.addEventListener('click', () => {
      rates = { ...DEFAULT_RATES };
      el.rateGel.value = rates.GEL_PER_USD;
      el.rateRub.value = rates.RUB_PER_USD;
      saveStateToStorage();
      updateBalanceCards();
      renderHomeMiniAnalytics();
      showToast('Курсы сброшены по умолчанию', 'info');
    });
  }

  function setFormType(type) {
    currentTxType = type;
    el.segmentButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.type === type);
    });
    renderCategoryDropdowns();
  }

  // --- Sheet Helpers ---
  function openSheet(modal) {
    if (!modal) return;
    modal.classList.add('open');
  }

  function closeSheet(modal) {
    if (!modal) return;
    modal.classList.remove('open');
  }

  function openRatesModal() {
    el.rateGel.value = rates.GEL_PER_USD;
    el.rateRub.value = rates.RUB_PER_USD;
    openSheet(el.ratesModal);
  }

  // --- Transaction Actions ---
  function handleAddTransaction(e) {
    e.preventDefault();
    const amountVal = parseFloat(el.txAmount.value);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Введите корректную сумму', 'error');
      return;
    }

    const categoryId = el.txCategory.value;
    if (!categoryId) {
      showToast('Выберите тему / категорию', 'error');
      return;
    }

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: currentTxType,
      amount: amountVal,
      currency: currentTxCurrency,
      categoryId: categoryId,
      date: el.txDate.value || getOffsetDateString(0),
      note: el.txNote.value.trim()
    };

    transactions.unshift(newTx);
    saveStateToStorage();

    // Reset amount and note
    el.txAmount.value = '';
    el.txNote.value = '';
    closeSheet(el.addTxModal);

    renderAll();
    showToast(
      `${newTx.type === 'expense' ? 'Расход' : 'Доход'} записан: ${formatCurrencyAmount(newTx.amount, newTx.currency)}`,
      'success'
    );
  }

  function deleteTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (confirm(`Удалить запись на сумму ${formatCurrencyAmount(tx.amount, tx.currency)}?`)) {
      transactions = transactions.filter(t => t.id !== id);
      saveStateToStorage();
      renderAll();
      showToast('Запись удалена', 'info');
    }
  }

  // --- Categories Management ---
  function handleAddCategory(e) {
    e.preventDefault();
    const name = el.newCatName.value.trim();
    if (!name) {
      showToast('Введите название темы', 'error');
      return;
    }

    const type = el.newCatType.value;
    const icon = el.newCatIcon.value.trim() || '🏷️';
    const color = el.newCatColor.value || '#3b82f6';

    const newCat = {
      id: 'cat_' + Date.now(),
      name: name,
      type: type,
      icon: icon,
      color: color,
      isDefault: false
    };

    categories.push(newCat);
    saveStateToStorage();

    el.newCatName.value = '';
    renderCategoryDropdowns();
    renderCategoryCards();
    closeSheet(el.categoryModal);

    showToast(`Тема «${newCat.name}» создана!`, 'success');
  }

  function deleteCategory(catId) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const usedCount = transactions.filter(t => t.categoryId === catId).length;
    let msg = `Удалить тему «${cat.name}»?`;
    if (usedCount > 0) {
      msg += `\nВнимание: к этой теме привязано записей: ${usedCount}.`;
    }

    if (confirm(msg)) {
      categories = categories.filter(c => c.id !== catId);
      saveStateToStorage();
      renderCategoryDropdowns();
      renderCategoryCards();
      renderAll();
      showToast(`Тема «${cat.name}» удалена`, 'info');
    }
  }

  function renderCategoryDropdowns() {
    const formCats = categories.filter(c => c.type === currentTxType || c.type === 'both');
    el.txCategory.innerHTML = formCats.map(cat => `
      <option value="${cat.id}">${cat.icon} ${escapeHtml(cat.name)}</option>
    `).join('');

    const currentFilterVal = el.filterCategorySelect.value;
    el.filterCategorySelect.innerHTML = '<option value="ALL">Все темы</option>' + categories.map(cat => `
      <option value="${cat.id}">${cat.icon} ${escapeHtml(cat.name)}</option>
    `).join('');
    if (currentFilterVal) {
      el.filterCategorySelect.value = currentFilterVal;
    }
  }

  function renderCategoryCards() {
    el.categoryTagsContainer.innerHTML = categories.map(cat => {
      const typeLabel = cat.type === 'expense' ? 'Расход' : (cat.type === 'income' ? 'Доход' : 'Оба типа');
      return `
        <div class="cat-mobile-card">
          <div class="cmc-left">
            <span class="cmc-icon">${cat.icon}</span>
            <div class="cmc-info">
              <span class="cmc-name">${escapeHtml(cat.name)}</span>
              <span class="cmc-type">${typeLabel}</span>
            </div>
          </div>
          ${!cat.isDefault ? `<button class="cmc-del-btn" data-id="${cat.id}" title="Удалить">&times;</button>` : ''}
        </div>
      `;
    }).join('');

    el.categoryTagsContainer.querySelectorAll('.cmc-del-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
  }

  // --- Rendering All Views ---
  function renderAll() {
    updateBalanceCards();
    renderHomeRecent();
    renderHomeMiniAnalytics();
    renderTransactionsList();
    renderCategoryCards();
    updateAnalytics();

    // Toggle demo CTA
    if (transactions.length === 0) {
      el.demoDataHint.style.display = 'flex';
    } else {
      el.demoDataHint.style.display = 'none';
    }
  }

  function updateBalanceCards() {
    const totals = {
      GEL: { income: 0, expense: 0, net: 0 },
      USD: { income: 0, expense: 0, net: 0 },
      RUB: { income: 0, expense: 0, net: 0 }
    };

    transactions.forEach(t => {
      if (totals[t.currency]) {
        if (t.type === 'income') totals[t.currency].income += t.amount;
        else totals[t.currency].expense += t.amount;
      }
    });

    ['GEL', 'USD', 'RUB'].forEach(curr => {
      totals[curr].net = totals[curr].income - totals[curr].expense;
    });

    // Update GEL Card
    renderCardValues(el.netGel, el.incomeGel, el.expenseGel, totals.GEL.net, totals.GEL.income, totals.GEL.expense, 'GEL');

    // Update USD Card
    renderCardValues(el.netUsd, el.incomeUsd, el.expenseUsd, totals.USD.net, totals.USD.income, totals.USD.expense, 'USD');

    // Update RUB Card
    renderCardValues(el.netRub, el.incomeRub, el.expenseRub, totals.RUB.net, totals.RUB.income, totals.RUB.expense, 'RUB');

    // Consolidated Net
    const gelInUsd = totals.GEL.net / (rates.GEL_PER_USD || 2.72);
    const usdInUsd = totals.USD.net;
    const rubInUsd = totals.RUB.net / (rates.RUB_PER_USD || 92.5);
    const totalNetUsd = gelInUsd + usdInUsd + rubInUsd;

    let consolidatedFinal = 0;
    if (consolidatedCurrency === 'USD') consolidatedFinal = totalNetUsd;
    else if (consolidatedCurrency === 'GEL') consolidatedFinal = totalNetUsd * rates.GEL_PER_USD;
    else if (consolidatedCurrency === 'RUB') consolidatedFinal = totalNetUsd * rates.RUB_PER_USD;

    el.consolidatedTotal.textContent = formatCurrencyAmount(consolidatedFinal, consolidatedCurrency);
    el.consolidatedTotal.className = 'wcard-balance total-highlight ' + (consolidatedFinal >= 0 ? 'positive' : 'negative');
    el.consolidatedRateNote.textContent = `1$ ≈ ${rates.GEL_PER_USD} ₾ | 1$ ≈ ${rates.RUB_PER_USD} ₽`;
  }

  function renderCardValues(netElem, incElem, expElem, net, inc, exp, curr) {
    netElem.textContent = formatCurrencyAmount(net, curr);
    netElem.className = 'wcard-balance ' + (net > 0 ? 'positive' : (net < 0 ? 'negative' : ''));
    incElem.textContent = '+' + formatCurrencyAmount(inc, curr);
    expElem.textContent = '-' + formatCurrencyAmount(exp, curr);
  }

  // --- Home Screen Specific Rendering ---
  function renderHomeRecent() {
    el.homeTxCount.textContent = transactions.length;

    const recent = transactions.slice(0, 4);
    if (recent.length === 0) {
      el.homeRecentTxList.innerHTML = `
        <div class="empty-state" style="padding:20px 0;">
          <p>Пока нет операций</p>
        </div>
      `;
      return;
    }

    el.homeRecentTxList.innerHTML = recent.map(t => renderTxItemHtml(t)).join('');
    attachDeleteHandlers(el.homeRecentTxList);
  }

  function renderHomeMiniAnalytics() {
    const expenseMap = getExpensesNormalized();
    const sorted = Object.values(expenseMap).sort((a, b) => b.amount - a.amount);
    const top3 = sorted.slice(0, 3);

    if (top3.length === 0) {
      el.homeTopCatsList.innerHTML = `
        <div style="font-size:0.8rem; color:var(--text-muted);">
          Нет расходов за период
        </div>
      `;
    } else {
      const activeSym = CURRENCY_SYMBOLS[consolidatedCurrency];
      el.homeTopCatsList.innerHTML = top3.map(item => `
        <div class="mini-cat-row">
          <span class="mini-cat-name">${item.icon} ${escapeHtml(item.name)}</span>
          <span class="mini-cat-amount">${formatNumber(item.amount)} ${activeSym}</span>
        </div>
      `).join('');
    }

    drawDonut(el.homeMiniDonutChart, sorted, 130, 130, 45);
  }

  // --- History Screen Specific Rendering ---
  function renderTransactionsList() {
    const searchQuery = el.historySearchInput.value.toLowerCase().trim();
    const typeFilter = el.filterTypeSelect.value;
    const currencyFilter = el.filterCurrencySelect.value;
    const categoryFilter = el.filterCategorySelect.value;

    const filtered = transactions.filter(t => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      if (currencyFilter !== 'ALL' && t.currency !== currencyFilter) return false;
      if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) return false;

      if (searchQuery) {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name.toLowerCase() : '';
        const note = (t.note || '').toLowerCase();
        const amtStr = t.amount.toString();
        if (!catName.includes(searchQuery) && !note.includes(searchQuery) && !amtStr.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    el.historyCounterBadge.textContent = `${filtered.length} из ${transactions.length}`;

    if (filtered.length === 0) {
      el.transactionsList.innerHTML = `
        <div class="empty-state">
          <p>Операций не найдено</p>
        </div>
      `;
      return;
    }

    el.transactionsList.innerHTML = filtered.map(t => renderTxItemHtml(t)).join('');
    attachDeleteHandlers(el.transactionsList);
  }

  function renderTxItemHtml(t) {
    const cat = categories.find(c => c.id === t.categoryId) || {
      name: 'Без категории',
      icon: '🏷️',
      color: '#94a3b8'
    };

    const isExpense = t.type === 'expense';
    const sign = isExpense ? '−' : '+';
    const dateFormatted = formatDateHuman(t.date);

    return `
      <div class="mobile-tx-item" data-id="${t.id}">
        <div class="mtx-left">
          <div class="mtx-icon-box" style="border: 1px solid ${cat.color}45; background:${cat.color}15">
            <span>${cat.icon}</span>
          </div>
          <div class="mtx-texts">
            <div class="mtx-title-row">
              <span class="mtx-category-name">${escapeHtml(cat.name)}</span>
              <span class="mtx-currency-chip">${t.currency}</span>
            </div>
            ${t.note ? `<span class="mtx-note">${escapeHtml(t.note)}</span>` : ''}
            <span class="mtx-date">${dateFormatted}</span>
          </div>
        </div>
        <div class="mtx-right">
          <span class="mtx-amount ${isExpense ? 'expense' : 'income'}">
            ${sign}${formatCurrencyAmount(t.amount, t.currency)}
          </span>
          <button class="mtx-delete-touch-btn" data-id="${t.id}" title="Удалить">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function attachDeleteHandlers(container) {
    container.querySelectorAll('.mtx-delete-touch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTransaction(btn.dataset.id);
      });
    });
  }

  // --- Analytics Screen Rendering ---
  let mainChartCache = [];

  function updateAnalytics() {
    const selectedCurr = el.analyticsCurrencySelect.value;
    const expenseMap = getExpensesNormalized(selectedCurr);
    const sorted = Object.values(expenseMap).sort((a, b) => b.amount - a.amount);
    mainChartCache = sorted;

    const totalExpense = sorted.reduce((sum, item) => sum + item.amount, 0);
    const targetSymbol = selectedCurr === 'ALL' ? CURRENCY_SYMBOLS[consolidatedCurrency] : CURRENCY_SYMBOLS[selectedCurr];

    el.chartExpenseTotal.textContent = `${formatNumber(totalExpense)} ${targetSymbol}`;

    if (sorted.length === 0) {
      el.chartLegendList.innerHTML = `
        <div style="font-size:0.84rem; color:var(--text-muted); text-align:center; padding:16px;">
          Нет данных о расходах
        </div>
      `;
    } else {
      el.chartLegendList.innerHTML = sorted.map(item => {
        const percent = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
        return `
          <div class="breakdown-row">
            <div class="breakdown-left">
              <span class="bdot" style="background:${item.color}"></span>
              <span>${item.icon}</span>
              <span>${escapeHtml(item.name)}</span>
            </div>
            <div class="breakdown-right">
              <span class="breakdown-percent">${percent}%</span>
              <span class="breakdown-sum">${formatNumber(item.amount)} ${targetSymbol}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    drawDonut(el.categoryDonutChart, sorted, 200, 200, 70);
  }

  function getExpensesNormalized(filterCurr = 'ALL') {
    const expenseMap = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
      let amt = 0;
      if (filterCurr === 'ALL') {
        let inUsd = 0;
        if (t.currency === 'USD') inUsd = t.amount;
        else if (t.currency === 'GEL') inUsd = t.amount / rates.GEL_PER_USD;
        else if (t.currency === 'RUB') inUsd = t.amount / rates.RUB_PER_USD;

        if (consolidatedCurrency === 'USD') amt = inUsd;
        else if (consolidatedCurrency === 'GEL') amt = inUsd * rates.GEL_PER_USD;
        else if (consolidatedCurrency === 'RUB') amt = inUsd * rates.RUB_PER_USD;
      } else {
        if (t.currency === filterCurr) amt = t.amount;
      }

      if (amt > 0) {
        if (!expenseMap[t.categoryId]) {
          const cat = categories.find(c => c.id === t.categoryId) || {
            name: 'Прочее',
            icon: '🏷️',
            color: '#94a3b8'
          };
          expenseMap[t.categoryId] = {
            id: t.categoryId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            amount: 0
          };
        }
        expenseMap[t.categoryId].amount += amt;
      }
    });

    return expenseMap;
  }

  function drawDonut(canvas, dataItems, width, height, innerR) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 8;
    const total = dataItems.reduce((acc, cur) => acc + cur.amount, 0);

    if (total === 0 || dataItems.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.arc(centerX, centerY, innerR, 2 * Math.PI, 0, true);
      ctx.fillStyle = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    dataItems.forEach(segment => {
      const sliceAngle = (segment.amount / total) * (2 * Math.PI);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerR, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = segment.color || '#6366f1';
      ctx.fill();

      ctx.strokeStyle = currentTheme === 'dark' ? '#111827' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });
  }

  function drawCharts() {
    renderHomeMiniAnalytics();
    if (activeScreenId === 'screenAnalytics') updateAnalytics();
  }

  // --- Export / Import Backup ---
  function handleDownloadBackup() {
    const backupData = {
      app: 'FinanceTracker_Mobile_GEL_USD_RUB',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      rates: rates,
      categories: categories,
      transactions: transactions
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Резервная копия сохранена в файл JSON', 'success');
  }

  function handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
          throw new Error('Неверная структура файла');
        }

        transactions = data.transactions;
        categories = data.categories;
        if (data.rates) rates = { ...DEFAULT_RATES, ...data.rates };

        saveStateToStorage();
        renderCategoryDropdowns();
        renderCategoryCards();
        renderAll();
        showToast('Данные успешно восстановлены!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Ошибка при чтении файла бэкапа', 'error');
      } finally {
        el.importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleExportCSV() {
    if (transactions.length === 0) {
      showToast('Нет записей для экспорта', 'error');
      return;
    }

    const headers = ['ID', 'Дата', 'Тип', 'Сумма', 'Валюта', 'Тема', 'Комментарий'];
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name : 'Без категории';
      const typeStr = t.type === 'income' ? 'Доход' : 'Расход';
      const cleanNote = (t.note || '').replace(/"/g, '""');

      return [
        t.id,
        t.date,
        typeStr,
        t.amount,
        t.currency,
        `"${catName}"`,
        `"${cleanNote}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_mobile_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Таблица CSV экспортирована', 'success');
  }

  function handleClearAllData() {
    if (confirm('ВНИМАНИЕ: Стереть все операции и категории?')) {
      transactions = [];
      categories = [...DEFAULT_CATEGORIES];
      rates = { ...DEFAULT_RATES };
      saveStateToStorage();
      renderCategoryDropdowns();
      renderCategoryCards();
      renderAll();
      showToast('Все данные очищены', 'info');
    }
  }

  // --- Formatting & Toast Utilities ---
  function formatCurrencyAmount(num, currency) {
    const formatted = formatNumber(num);
    const sym = CURRENCY_SYMBOLS[currency] || currency;

    if (currency === 'USD') {
      return num < 0 ? `-$${formatNumber(Math.abs(num))}` : `$${formatted}`;
    }
    return `${formatted} ${sym}`;
  }

  function formatNumber(val) {
    if (isNaN(val)) return '0.00';
    return Number(val).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDateHuman(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-16px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 2800);
  }

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  function handleInstallPWA() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      showToast('Приложение уже установлено на телефоне!', 'success');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          showToast('Приложение установлено!', 'success');
        }
        deferredPrompt = null;
      });
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('📲 Чтобы установить на iPhone:\n\n1. Нажмите иконку «Поделиться» (квадрат со стрелкой вверх ⬆️) в меню Safari.\n2. Выберите «На экран "Домой"» 📲.\n3. Нажмите «Добавить».');
    } else {
      alert('📲 Чтобы установить на телефон:\n\nОткройте меню браузера (три точки ⋮) и нажмите «Установить приложение» или «Добавить на главный экран».');
    }
  }

  // Регистрация Service Worker для PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('PWA Service Worker register:', err);
      });
    });
  }

  // Launch on DOM Ready
  window.addEventListener('DOMContentLoaded', init);
})();
