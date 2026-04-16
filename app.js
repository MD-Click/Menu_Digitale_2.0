const VERSION = "6.1-RESTORED";
console.log("App Version: " + VERSION);

const urlParams = new URLSearchParams(window.location.search);
const SHEET_ID = urlParams.get('id'); 
let appConfig = {};
let fullData = [];
let navigationStack = ['page-macro'];

// --- UTILITIES ---
function cleanString(val) { return String(val || '').trim().replace(/^["']|["']$/g, '').replace(/,+$/, '').trim(); }
function escapeHTML(str) { return String(str || '').replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":"&#39;",'"':'&quot;'}[t] || t)); }

function safeParseCSVRow(str) {
    let arr = []; let quote = false; let cell = '';
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (c === '"' && str[i+1] === '"') { cell += '"'; i++; } 
        else if (c === '"') { quote = !quote; }
        else if (c === ',' && !quote) { arr.push(cell); cell = ''; }
        else { cell += c; }
    }
    arr.push(cell); return arr.map(x => cleanString(x));
}

function getVal(key, def) {
    const searchKey = key.toLowerCase().trim();
    for (let k in appConfig) if (k.toLowerCase().trim() === searchKey) return appConfig[k] || def;
    return def;
}

function parseColor(colorVal, opacityVal = 1) {
    let op = parseFloat(opacityVal); if(isNaN(op)) op = 1; 
    let c = String(colorVal).trim(); if (!c) return `rgba(255,255,255,${op})`;
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
        csv.replace(/^\ufeff/, '').split(/\r?\n/).forEach(row => {
            const cols = safeParseCSVRow(row);
            if(cols.length >= 2) {
                // Se la riga non è l'intestazione, caricala
                if(cols[0].toLowerCase() !== 'property') appConfig[cols[0]] = cols[1];
            }
        });
        console.log("Dati letti dal foglio:", appConfig);
    } catch(e) { console.error("Errore Config:", e); }
}

function applyConfig() {
    const root = document.documentElement;

    // Header & Colori
    root.style.setProperty('--header-bg', parseColor(getVal('Header_Color', '#ffffff'), getVal('Header_Opacity', '0.95')));
    
    // Tasto Indietro
    root.style.setProperty('--back-bg', parseColor(getVal('Back_Btn_Bg', '#111827')));
    root.style.setProperty('--back-color', parseColor(getVal('Back_Btn_Color', '#ffffff')));

    // Logo
    const logoCont = document.getElementById('logo-container');
    const logoUrl = getVal('Logo_Image_URL', '');
    const align = getVal('Logo_Align', 'center').toLowerCase();
    logoCont.style.justifyContent = align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center');
    logoCont.style.marginTop = getVal('Logo_Margin_Top', '0px');
    logoCont.style.marginBottom = getVal('Logo_Margin_Bottom', '0px');
    
    if (logoUrl) {
        logoCont.innerHTML = `<img src="${logoUrl}" id="app-logo" style="max-height:${getVal('Logo_Height', '60px')}; object-fit:contain;" onload="updateLayout()">`;
    }

    // Sottotitolo
    const sub = document.getElementById('subtitle-container');
    const text = getVal('Subtitle_Text', '');
    if (text) {
        sub.style.display = 'block';
        sub.innerText = text;
        sub.style.color = parseColor(getVal('Subtitle_Color', '#6b7280'));
        sub.style.fontSize = getVal('Subtitle_Size', '14px');
        sub.style.textAlign = getVal('Subtitle_Align', 'center').toLowerCase();
        sub.style.marginBottom = getVal('Subtitle_Margin_Bottom', '10px');
    }
    updateLayout();
}

function updateLayout() {
    const header = document.getElementById('main-header');
    const main = document.getElementById('main-content');
    const back = document.getElementById('back-button');
    if (!header || !main) return;

    const hHeight = header.offsetHeight;
    main.style.paddingTop = (hHeight + 20) + "px";

    const pos = getVal('Back_Btn_Position', 'top').toLowerCase();
    if (pos === 'top') back.style.top = "25px";
    else if (pos === 'center') back.style.top = (hHeight / 2 - 22) + "px";
}

// --- MENU RENDERING (Base 6.1) ---
async function fetchMenu() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=menu&t=${Date.now()}`;
    try {
        const res = await fetch(url);
        const csv = await res.text();
        const rows = csv.split(/\r?\n/);
        for(let i=1; i<rows.length; i++){
            const c = safeParseCSVRow(rows[i]);
            if(c.length >= 3 && c[0]) fullData.push({ macro: c[0], cat: c[1], name: c[2], desc: c[3], price: c[5], photo: c[11] });
        }
        document.getElementById('loading-screen').classList.add('hidden');
        renderLevel1();
    } catch(e) { console.error(e); }
}

function renderLevel1() {
    const container = document.getElementById('macro-layout-container');
    const macros = [...new Set(fullData.map(i => i.macro))];
    container.innerHTML = '';
    macros.forEach(m => {
        container.innerHTML += `<div onclick="renderLevel2('${m}')" class="macro-card"><div class="macro-overlay"></div><span class="macro-text-inside">${m}</span></div>`;
    });
    showPage('page-macro');
}

function renderLevel2(m) {
    const container = document.getElementById('page-categories');
    const cats = [...new Set(fullData.filter(i => i.macro === m).map(i => i.cat))];
    container.innerHTML = '';
    cats.forEach(c => {
        container.innerHTML += `<div onclick="renderLevel3('${m}','${c}')" class="menu-card"><strong>${c}</strong></div>`;
    });
    navigationStack.push('page-categories');
    showPage('page-categories');
}

function renderLevel3(m, c) {
    const container = document.getElementById('page-items');
    container.innerHTML = '';
    const items = fullData.filter(i => i.macro === m && i.cat === c);
    items.forEach(i => {
        container.innerHTML += `<div class="menu-card item-card"><div><strong>${i.name}</strong><br><small>${i.desc}</small><br><span style="color:#4f46e5">${i.price}</span></div>${i.photo ? `<img src="${i.photo}" class="item-photo">` : ''}</div>`;
    });
    navigationStack.push('page-items');
    showPage('page-items');
}

function showPage(p) {
    ['page-macro','page-categories','page-items'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(p).classList.remove('hidden');
    const back = document.getElementById('back-button');
    p === 'page-macro' ? back.classList.remove('active') : back.classList.add('active');
    updateLayout();
}

function goBack() { if(navigationStack.length > 1) { navigationStack.pop(); showPage(navigationStack[navigationStack.length-1]); } }

init();
