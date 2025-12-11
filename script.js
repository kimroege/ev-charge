// Global state
let allTranslations = {};
let currentLanguage = 'en';
let presets = {};
let priceChartInstance = null;

// DOM Elements Cache
const elements = {
    settingsModal: () => document.getElementById('settingsModal'),
    presetSelect: () => document.getElementById('presetSelect'),
    carList: () => document.getElementById('carList'),
    taxRefundCheckbox: () => document.getElementById('taxRefundCheckbox'),
    showGraphCheckbox: () => document.getElementById('showGraphCheckbox'),
    chargeForm: () => document.getElementById('chargeForm'),
    priceResult: () => document.getElementById('priceResult'),
    bestStartTime: () => document.getElementById('bestStartTime'),
    priceDetails: () => document.getElementById('priceDetails'),
    graphContainer: () => document.getElementById('graphContainer'),
    result: () => document.getElementById('result'),
    resultValue: () => document.getElementById('resultValue'),
    resultDetails: () => document.getElementById('resultDetails'),
    languageSelect: () => document.getElementById('languageSelect'),
    carNameInput: () => document.getElementById('carNameInput'),
    batteryCapacity: () => document.getElementById('batteryCapacity'),
    chargePower: () => document.getElementById('chargePower'),
    chargeEfficiency: () => document.getElementById('chargeEfficiency'),
    currentSoc: () => document.getElementById('currentSoc'),
    targetSoc: () => document.getElementById('targetSoc')
};

// Initialize
function init() {
    // Use external translations if available
    if (typeof translations !== 'undefined') {
        allTranslations = translations;
    } else {
        console.error('Translations not loaded');
        // Fallback for critical UI if needed, but sticking to structure
        allTranslations = {}; 
    }

    detectLanguage();
    loadPresetsFromStorage();
    setupEventListeners();
}

function setupEventListeners() {
    // Settings Modal
    document.querySelector('.settings-btn').addEventListener('click', openSettings);
    elements.settingsModal().addEventListener('click', closeSettings);
    document.querySelector('.close-modal').addEventListener('click', toggleSettings);
    
    // Inputs
    elements.presetSelect().addEventListener('change', loadPreset);
    elements.languageSelect().addEventListener('change', changeLanguage);
    elements.taxRefundCheckbox().addEventListener('change', saveTaxRefundSetting);
    elements.showGraphCheckbox().addEventListener('change', saveGraphSetting);
    document.getElementById('btnSave').addEventListener('click', savePreset);
    
    // Form
    elements.chargeForm().addEventListener('submit', calculateChargingTime);
}

// Modal functions
function openSettings() {
    elements.settingsModal().classList.add('show');
    updateCarList();
}

function toggleSettings() {
    const modal = elements.settingsModal();
    modal.classList.toggle('show');
}

function closeSettings(event) {
    if (event.target === elements.settingsModal()) {
        elements.settingsModal().classList.remove('show');
    }
}

// Load presets from LocalStorage
function loadPresetsFromStorage() {
    const storedPresets = localStorage.getItem('evChargePresets');
    if (storedPresets) {
        try {
            presets = JSON.parse(storedPresets);
        } catch (e) {
            console.error("Failed to parse presets", e);
            presets = {};
        }
    }
    updatePresetDropdown();
    updateCarList();

    const storedTaxRefund = localStorage.getItem('evChargeTaxRefund');
    if (storedTaxRefund === 'true') {
        elements.taxRefundCheckbox().checked = true;
    }

    const storedShowGraph = localStorage.getItem('evChargeShowGraph');
    if (storedShowGraph === 'true') {
        elements.showGraphCheckbox().checked = true;
    }
}

function saveTaxRefundSetting() {
    localStorage.setItem('evChargeTaxRefund', elements.taxRefundCheckbox().checked);
}

function saveGraphSetting() {
    localStorage.setItem('evChargeShowGraph', elements.showGraphCheckbox().checked);
}

function savePresetsToStorage() {
    localStorage.setItem('evChargePresets', JSON.stringify(presets));
    updatePresetDropdown();
    updateCarList();
}

function updatePresetDropdown() {
    const select = elements.presetSelect();
    const currentVal = select.value;
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};
    
    select.innerHTML = `<option value="" id="optionCustom">${t.optionCustom || '-- Custom / New --'}</option>`;
    
    Object.keys(presets).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    if (presets[currentVal]) {
        select.value = currentVal;
    }
}

function updateCarList() {
    const list = elements.carList();
    list.innerHTML = '';
    
    Object.keys(presets).sort().forEach(name => {
        const item = document.createElement('li');
        item.className = 'car-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'car-name';
        nameSpan.textContent = name;
        
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-icon';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = () => deletePreset(name); // Keep inline for closure convenience or refactor
        
        item.appendChild(nameSpan);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    });
}

function loadPreset() {
    const name = elements.presetSelect().value;
    
    if (name && presets[name]) {
        const p = presets[name];
        elements.batteryCapacity().value = p.batteryCapacity;
        elements.chargePower().value = p.chargePower;
        if (p.chargeEfficiency) {
            elements.chargeEfficiency().value = p.chargeEfficiency;
        }
    }
}

function savePreset() {
    const name = elements.carNameInput().value.trim();
    const batteryCapacity = elements.batteryCapacity().value;
    const chargePower = elements.chargePower().value;
    const chargeEfficiency = elements.chargeEfficiency().value;
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};

    if (!name) {
        alert(t.msgEnterName || "Please enter a car name");
        return;
    }

    presets[name] = {
        batteryCapacity,
        chargePower,
        chargeEfficiency
    };

    savePresetsToStorage();
    
    elements.presetSelect().value = name;
    elements.carNameInput().value = '';
    alert(t.msgSaved || "Preset saved!");
    toggleSettings();
}

function deletePreset(name) {
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};
    const msg = t.msgDeleted ? t.msgDeleted.replace('!', '') : 'Preset deleted';

    if (confirm(`${msg}? "${name}"`)) {
        delete presets[name];
        savePresetsToStorage();
        
        if (elements.presetSelect().value === name) {
            elements.presetSelect().value = "";
            elements.batteryCapacity().value = "77";
            elements.chargePower().value = "11";
            elements.chargeEfficiency().value = "90";
        }
    }
}

function detectLanguage() {
    const browserLang = navigator.language.toLowerCase().split('-')[0];
    currentLanguage = (allTranslations && allTranslations[browserLang]) ? browserLang : 'en';
    elements.languageSelect().value = currentLanguage;
    updateUI();
}

function changeLanguage() {
    currentLanguage = elements.languageSelect().value;
    updateUI();
    updatePresetDropdown(); 
    updateCarList();
}

function updateUI() {
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};
    
    // Text Content Updates
    const updates = {
        'title': t.title,
        'subtitle': t.subtitle,
        'modalTitle': t.modalTitle,
        'labelLanguage': t.labelLanguage,
        'labelSavePreset': t.labelSavePreset,
        'labelManageCars': t.labelManageCars,
        'labelTaxRefund': t.labelTaxRefund,
        'labelShowGraph': t.labelShowGraph,
        'labelCurrentSoc': t.labelCurrentSoc,
        'labelTargetSoc': t.labelTargetSoc,
        'labelBatteryCapacity': t.labelBatteryCapacity,
        'labelChargePower': t.labelChargePower,
        'labelChargeEfficiency': t.labelChargeEfficiency,
        'calculateBtn': t.calculateBtn,
        'resultLabel': t.resultLabel,
        'btnSave': t.btnSave
    };

    for (const [id, text] of Object.entries(updates)) {
        const el = document.getElementById(id);
        if (el && text) el.textContent = text;
    }

    // Special cases
    const customOption = document.getElementById('optionCustom');
    if(customOption && t.optionCustom) customOption.textContent = t.optionCustom;
    
    const carInput = elements.carNameInput();
    if (carInput && t.placeholderCarName) carInput.placeholder = t.placeholderCarName;
    
    if(t.title) document.title = t.title;
}

async function fetchAndCalculatePrices(hoursNeeded, energyNeeded) {
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};
    const priceResultDiv = elements.priceResult();
    
    try {
        priceResultDiv.style.display = 'block';
        elements.bestStartTime().textContent = "Loading...";
        elements.priceDetails().textContent = "";

        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = 'https://billigkwh.dk/api/Priser/HentPriser?sted=DK1&netselskab=n1_c&produkt=norlys_flexel';
        
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        const allPrices = processPriceData(data);
        
        calculateBestTime(allPrices, hoursNeeded, energyNeeded);

    } catch (error) {
        console.error("Fetch error:", error);
        elements.bestStartTime().textContent = "Error";
        elements.priceDetails().textContent = t.fetchError || "Could not fetch prices";
    }
}

function processPriceData(data) {
    const allPrices = [];
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const applyTaxRefund = elements.taxRefundCheckbox().checked;
    const taxRefundAmount = 0.895;
    const taxRefundEndDate = new Date('2026-01-01T00:00:00');

    data.forEach(dayData => {
        const date = new Date(dayData.dato);
        dayData.priser.forEach((price, hourIndex) => {
            const priceTime = new Date(date);
            priceTime.setHours(hourIndex);
            
            if (priceTime >= currentHour) {
                let finalPrice = price;
                if (applyTaxRefund && priceTime < taxRefundEndDate) {
                    finalPrice -= taxRefundAmount;
                }
                allPrices.push({ time: priceTime, price: finalPrice });
            }
        });
    });
    return allPrices;
}

function calculateBestTime(allPrices, hoursNeeded, energyNeeded) {
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};
    const slotsNeeded = Math.ceil(hoursNeeded);
    
    if (allPrices.length < slotsNeeded) {
        elements.bestStartTime().textContent = "Not enough data";
        elements.priceDetails().textContent = "Check back later";
        return;
    }

    let bestStartIndex = 0;
    let minTotalCost = Infinity;

    for (let i = 0; i <= allPrices.length - slotsNeeded; i++) {
        let currentTotal = 0;
        for (let j = 0; j < slotsNeeded; j++) {
            currentTotal += allPrices[i + j].price;
        }

        if (currentTotal < minTotalCost) {
            minTotalCost = currentTotal;
            bestStartIndex = i;
        }
    }

    const bestStart = allPrices[bestStartIndex];
    const avgPrice = minTotalCost / slotsNeeded;
    const totalEstimatedCost = avgPrice * energyNeeded;

    const startTimeStr = bestStart.time.toLocaleTimeString(currentLanguage, { hour: '2-digit', minute: '2-digit', hour12: false });
    elements.bestStartTime().textContent = `Start: ${startTimeStr}`;
    elements.priceDetails().textContent = 
        `${t.avgPrice || 'Avg Price'}: ${avgPrice.toFixed(2)} DKK/kWh | ${t.totalCost || 'Est. Cost'}: ${totalEstimatedCost.toFixed(2)} DKK`;

    renderChart(allPrices, bestStartIndex, slotsNeeded);
}

function renderChart(allPrices, bestStartIndex, slotsNeeded) {
    const showGraph = elements.showGraphCheckbox().checked;
    const graphContainer = elements.graphContainer();
    
    if (!showGraph || allPrices.length === 0) {
        graphContainer.style.display = 'none';
        return;
    }

    graphContainer.style.display = 'block';
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (priceChartInstance) {
        priceChartInstance.destroy();
    }

    const labels = allPrices.map(p => p.time.toLocaleTimeString(currentLanguage, { hour: '2-digit', minute: '2-digit', hour12: false }));
    const prices = allPrices.map(p => p.price);
    
    const bgColors = prices.map((_, index) => {
        return (index >= bestStartIndex && index < bestStartIndex + slotsNeeded)
            ? 'rgba(75, 192, 192, 0.8)'
            : 'rgba(201, 203, 207, 0.5)';
    });

    priceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price (DKK/kWh)',
                data: prices,
                backgroundColor: bgColors,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => context.parsed.y.toFixed(2) + ' DKK'
                    }
                }
            }
        }
    });
}

function calculateChargingTime(event) {
    event.preventDefault();

    const currentSoc = parseFloat(elements.currentSoc().value);
    const targetSoc = parseFloat(elements.targetSoc().value);
    const batteryCapacity = parseFloat(elements.batteryCapacity().value);
    const chargePower = parseFloat(elements.chargePower().value);
    const chargeEfficiency = parseFloat(elements.chargeEfficiency().value);
    const t = allTranslations[currentLanguage] || allTranslations['en'] || {};

    if (targetSoc <= currentSoc) {
        alert(t.errorInvalidRange || "Target charge must be higher than current charge");
        elements.targetSoc().classList.add('error');
        setTimeout(() => elements.targetSoc().classList.remove('error'), 500);
        return;
    }

    if (isNaN(currentSoc) || isNaN(targetSoc) || isNaN(batteryCapacity) || isNaN(chargePower) || isNaN(chargeEfficiency) ||
        currentSoc < 0 || targetSoc > 100 || batteryCapacity <= 0 || chargePower <= 0 || chargeEfficiency <= 0 || chargeEfficiency > 100) {
        alert(t.errorInvalidValues || "Please check your input values");
        return;
    }

    const energyNeeded = (batteryCapacity * (targetSoc - currentSoc)) / 100;
    const effectiveChargePower = chargePower * (chargeEfficiency / 100);
    const timeInHours = energyNeeded / effectiveChargePower;
    
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);

    let timeText = '';
    const tHours = t.hours || 'hours';
    const tMinutes = t.minutes || 'minutes';
    const tAnd = t.and || 'and';

    if (hours > 0 && minutes > 0) {
        timeText = `${hours} ${tHours} ${tAnd} ${minutes} ${tMinutes}`;
    } else if (hours > 0) {
        timeText = `${hours} ${tHours}`;
    } else {
        timeText = `${minutes} ${tMinutes}`;
    }

    elements.resultValue().textContent = timeText;
    elements.resultDetails().textContent = `${t.energyNeeded || 'Energy needed'}: ${energyNeeded.toFixed(2)} kWh`;
    
    const resultDiv = elements.result();
    resultDiv.classList.add('show');
    
    fetchAndCalculatePrices(timeInHours, energyNeeded);
    
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
