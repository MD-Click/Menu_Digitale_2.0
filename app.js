const VERSION = "5.1-SUBTITLE-FONT-UPDATE";
console.log("Versione App: " + VERSION);

const urlParams = new URLSearchParams(window.location.search);
const SHEET_ID = urlParams.get('id'); 
let appConfig = {};
let fullData = [];
let navigationStack = ['page-macro'];

let activeFilters = []; 
let currentMacroName = '';
let currentCategoryName = '';

// --- TRADUZIONE AUTOMATICA ---
function setupAutoTranslate() {
    const baseLang = 'it'; 
    const userLang = (navigator.language || navigator.userLanguage).slice(0, 2).toLowerCase();
    if (userLang !== baseLang) {
        const style = document.createElement('style');
        style.innerHTML = `.goog-te-banner-frame.skiptranslate { display: none !important; } body { top: 0px !important; } #goog-gt-tt { display: none !important; }`;
        document.head.appendChild(style);
        document.cookie = `googtrans=/${baseLang}/${userLang}; path=/`;
        const widgetDiv = document.createElement('div');
        widgetDiv.id = 'google_translate_element';
        widgetDiv.style.display = 'none';
        document.body.appendChild(widgetDiv);
        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({pageLanguage: baseLang, autoDisplay: false}, 'google_translate_element');
        };
        const script = document.createElement('script');
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);
    }
}

// --- UTILITIES ---
function escapeHTML(str) { return String(str || '').replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag)); }
function escapeJS(str) { return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"'); }
function cleanString(val) { return String(val || '').trim().replace(/^["']|["']$/g, '').replace(/,+$/, '').trim(); }

function safeParseCSVRow(str) {
    let arr = []; let quote = false; let cell = '';
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (c === '"' && str[i+1] === '"') { cell += '"'; i++; } 
        else if (c === '"') { quote = !quote; }
        else if (c === ',' && !quote) { arr.push(cell); cell = ''; }
        else { cell += c; }
    }
    arr.push(cell);
    return arr.map(x => cleanString(x));
}

function getVal(key, def) {
    const searchKey = key.toLowerCase().trim();
    for (let k in appConfig) {
        if (k.toLowerCase().trim() === searchKey) return appConfig[k] || def;
    }
    return def;
}

function isDataTruthy(val) { return ['TRUE', 'SI', 'SÌ', 'YES', '1', 'V', 'VERO'].includes(String(val || '').toUpperCase().trim()); }

function parseColor(colorVal, opacityVal = 1) {
    let op = parseFloat(opacityVal); if(isNaN(op)) op = 1; 
    let c = String(colorVal).trim(); if (!c) return `rgba(0,0,0,${op})`;
    if(/^[0-9A-Fa-f]{3,6}$/.test(c)) c = '#' + c;
    if (c.startsWith('#')) {
        let hex = c.replace('#', '');
        if(hex.length === 3) hex = hex.split('').map(x => x+x).join(''); 
        if(hex.length === 6) {
            let r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${op})`;
        }
    }
    return c; 
}

// --- CORE ---
async function init() {
    setupAutoTranslate();
    if (!SHEET_ID) return;
    await fetchConfig(); 
    applyConfig();       
    await fetchMenu();
}

async function fetchConfig() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=config&t=${Date.now()}`;
    try {
        const response = await fetch(url);
        let csv = await response.text();
        csv.replace(/^\ufeff/, '').split(/\r?\n/).slice(1).forEach(row => {
            const cols = safeParseCSVRow(row);
            if(cols.length >= 2) appConfig[cols[0]] = cols[1];
        });
    } catch(e) { console.error(e); }
}

function applyConfig() {
    const root = document.documentElement;

    // Header & Colori
    root.style.setProperty('--header-bg', parseColor(getVal('Header_Color', '#ffffff'), getVal('Header_Opacity', '0.95')));
    let shadow = 'none';
    const intensity = getVal('Header_Shadow_Intensity', 'medium').toLowerCase();
    if(intensity === 'light') shadow = '0 2px 8px rgba(0,0,0,0.05)';
    else if(intensity === 'medium') shadow = '0 4px 15px rgba(0,0,0,0.08)';
    else if(intensity === 'strong') shadow = '0 8px 25px rgba(0,0,0,0.15)';
    root.style.setProperty('--header-shadow', shadow);

    // Logo
    const logoCont = document.getElementById('logo-container');
    const logoUrl = getVal('Logo_Image_URL', '');
    logoCont.style.justifyContent = getVal('Logo_Align', 'center').toLowerCase() === 'left' ? 'flex-start' : (getVal('Logo_Align', 'center').toLowerCase() === 'right' ? 'flex-end' : 'center');
    logoCont.style.marginTop = getVal('Logo_Margin_Top', '0px');
    logoCont.style.marginBottom = getVal('Logo_Margin_Bottom', '0px');
    if (logoUrl) logoCont.innerHTML = `<img src="${escapeHTML(logoUrl)}" style="max-height:${getVal('Logo_Height', '60px')}; object-fit:contain;" onload="updateLayout()" translate="no">`;

    // Sottotitolo (Modulo 3.1 con Font)
    const subContainer = document.getElementById('subtitle-container');
    const subText = getVal('Subtitle_Text', '');
    if (subText !== '') {
        subContainer.style.display = 'block';
        subContainer.innerText = subText;
        subContainer.style.color = parseColor(getVal('Subtitle_Color', '#6b7280'));
        subContainer.style.fontSize = getVal('Subtitle_Size', '14px');
        subContainer.style.fontFamily = getVal('Subtitle_Font', 'sans-serif'); // <-- CABLAGGIO NUOVO
        subContainer.style.fontWeight = isDataTruthy(getVal('Subtitle_Bold', 'FALSE')) ? 'bold' : 'normal';
        subContainer.style.textAlign = getVal('Subtitle_Align', 'center').toLowerCase();
        subContainer.style.marginBottom = getVal('Subtitle_Margin_Bottom', '10px');
        updateLayout(); 
    } else {
        subContainer.style.display = 'none';
    }
}

function updateLayout() {
    setTimeout(() => {
        const header = document.getElementById('main-header'), subHeader = document.getElementById('sub-header'), mainContent = document.getElementById('main-content'), backBtn = document.getElementById('back-button');
        if (!header) return;
        const hHeight = header.offsetHeight || 100; 
        if (subHeader) subHeader.style.top = `${hHeight}px`;
        let totalH = hHeight;
        if (subHeader && subHeader.style.display !== 'none') totalH += subHeader.offsetHeight;
        if (mainContent) mainContent.style.paddingTop = `calc(${totalH}px + 20px)`;
        backBtn.style.top = `calc(${hHeight}px / 2 - 22px)`;
    }, 50); 
}

// (Le funzioni fetchMenu, renderLevelX e showPage rimangono invariate dalla v2.1)
// ... [Incolla qui le restanti funzioni del menu se necessario] ...

init();
