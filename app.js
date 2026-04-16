const VERSION = "4.0-MODULO-HEADER";
console.log("Versione App: " + VERSION);

const urlParams = new URLSearchParams(window.location.search);
const SHEET_ID = urlParams.get('id'); 
let appConfig = {};
let fullData = [];
let navigationStack = ['page-macro'];

// --- UTILITIES ---
function cleanString(val) {
    if (!val) return '';
    return String(val).trim().replace(/^["']|["']$/g, '').replace(/,+$/, '').trim();
}

function getVal(key, def) {
    const searchKey = key.toLowerCase().trim();
    for (let k in appConfig) {
        if (k.toLowerCase().trim() === searchKey) return appConfig[k] || def;
    }
    return def;
}

// Converte HEX + Opacità in RGBA per il CSS
function hexToRgba(hex, opacity) {
    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#')) {
        const h = hex.replace('#', '');
        r = parseInt(h.substring(0, 2), 16);
        g = parseInt(h.substring(2, 4), 16);
        b = parseInt(h.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// --- CONFIGURAZIONE ---
async function fetchConfig() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=config&t=${Date.now()}`;
    try {
        const response = await fetch(url);
        const csv = await response.text();
        const rows = csv.replace(/^\ufeff/, '').split(/\r?\n/).slice(1);
        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 2) {
                appConfig[cleanString(cols[0])] = cleanString(cols[1]);
            }
        });
        console.log("Config Caricato:", appConfig);
    } catch (e) { console.error("Errore Config:", e); }
}

function applyConfig() {
    const root = document.documentElement;

    // 1. LOGO (Modulo 1)
    const logoCont = document.getElementById('logo-container');
    const logoUrl = getVal('Logo_Image_URL', '');
    logoCont.style.justifyContent = getVal('Logo_Align', 'center') === 'left' ? 'flex-start' : (getVal('Logo_Align', 'center') === 'right' ? 'flex-end' : 'center');
    logoCont.style.marginTop = getVal('Logo_Margin_Top', '0px');
    logoCont.style.marginBottom = getVal('Logo_Margin_Bottom', '0px');
    if (logoUrl) {
        logoCont.innerHTML = `<img src="${logoUrl}" style="max-height:${getVal('Logo_Height', '60px')}; object-fit:contain;" onload="updateLayout()">`;
    }

    // 2. HEADER (Modulo 2)
    const hColor = getVal('Header_Color', '#ffffff');
    const hOpacity = getVal('Header_Opacity', '0.95');
    root.style.setProperty('--header-bg', hexToRgba(hColor, hOpacity));

    let shadowVal = 'none';
    const intensity = getVal('Header_Shadow_Intensity', 'medium').toLowerCase();
    if(intensity === 'light') shadowVal = '0 2px 8px rgba(0,0,0,0.05)';
    else if(intensity === 'medium') shadowVal = '0 4px 15px rgba(0,0,0,0.08)';
    else if(intensity === 'strong') shadowVal = '0 8px 25px rgba(0,0,0,0.15)';
    root.style.setProperty('--header-shadow', shadowVal);
}

// ... (Il resto delle funzioni fetchMenu, renderLevelX, showPage, updateLayout rimangono le stesse dell'ultima versione funzionante) ...

async function init() {
    if (!SHEET_ID) return;
    await fetchConfig();
    applyConfig();
    await fetchMenu();
}
init();
