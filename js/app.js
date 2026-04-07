// ==========================================
// CONFIGURAZIONE MASTER
// Metti qui l'ID del tuo foglio Google di Test. 
const DEFAULT_SHEET_ID = 'INSERISCI_QUI_IL_TUO_ID_VERO'; 
// ==========================================

let sheetId;
let macroSection, dishesSection, btnBack, filtersSection;

// Tutto il codice si avvia solo quando la pagina è caricata al 100%
document.addEventListener("DOMContentLoaded", () => {
  
  // Estrazione ID
  const urlParams = new URLSearchParams(window.location.search);
  sheetId = urlParams.get('id') || DEFAULT_SHEET_ID;

  // Collegamento elementi HTML
  macroSection = document.getElementById("macro-section");
  dishesSection = document.getElementById("dishes-section");
  btnBack = document.getElementById("btn-back");
  filtersSection = document.getElementById("filters-section");

  // Attivazione Bottoni Macro (Sicura)
  document.getElementById("macro-cibo").addEventListener("click", (e) => {
    e.preventDefault();
    filtraPerMacro('CIBO');
  });
  
  document.getElementById("macro-bevande").addEventListener("click", (e) => {
    e.preventDefault();
    filtraPerMacro('BEVANDA');
  });

  // Attivazione Filtri
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      this.classList.toggle("active");
      applicaFiltri();
    });
  });

  // Attivazione Tasto Indietro
  btnBack.addEventListener("click", goBack);

  // Caricamento Menu
  caricaMenuDalCSV();
});

// --- MOTORE DATI: FETCH DINAMICO DEL CSV ---
async function caricaMenuDalCSV() {
  if (!sheetId || sheetId === 'INSERISCI_QUI_IL_TUO_ID_VERO') {
    dishesSection.innerHTML = "<p style='text-align:center; padding:20px; font-weight:bold;'>Errore: Manca l'ID del database. Inseriscilo in app.js o nel link.</p>";
    macroSection.classList.add("hidden");
    return;
  }

  const dynamicCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  try {
    const response = await fetch(dynamicCsvUrl); 
    if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
    
    const csvTesto = await response.text();
    const menuDati = convertiCSVInJSON(csvTesto);
    generaHTMLPiatti(menuDati);
    
    goBack(); // Resetta la vista alla home per sicurezza
  } catch (error) {
    console.error("Errore fatale:", error);
    dishesSection.innerHTML = "<p style='text-align:center; padding:20px;'>Impossibile caricare il menu. Controlla che il foglio sia condiviso pubblicamente.</p>";
    macroSection.classList.add("hidden");
  }
}

// Funzioni di conversione e parsing (Intatte)
function convertiCSVInJSON(csvText) {
  const righe = csvText.split(/\r\n|\n/);
  if (righe.length < 2) return [];
  const headers = parseCSVLine(righe[0]);
  const risultato = [];

  for (let i = 1; i < righe.length; i++) {
    if (!righe[i].trim()) continue;
    const valori = parseCSVLine(righe[i]);
    const oggettoPiatto = {};
    headers.forEach((header, index) => {
      oggettoPiatto[header.trim()] = valori[index] ? valori[index].trim() : "";
    });
    risultato.push(oggettoPiatto);
  }
  return risultato;
}

function parseCSVLine(testo) {
  let risultati = [''], i = 0, p = '', s = true;
  for (let l = testo.length; i < l; i++) {
    let c = testo[i];
    if (c === '"') { s = !s; if (p === '"') { risultati[risultati.length - 1] += '"'; p = '-'; } else p = c; } 
    else if (c === ',' && s) { c = ''; risultati.push(''); p = c; } 
    else { risultati[risultati.length - 1] += c; p = c; }
  }
  return risultati;
}

function generaHTMLPiatti(datiMenu) {
  dishesSection.innerHTML = '';

  datiMenu.forEach(piatto => {
    if (piatto.Attivo && piatto.Attivo.toUpperCase() === "NO") return;

    const isGF = (piatto['Senza Glutine'] && piatto['Senza Glutine'].toUpperCase() === "SI") ? "true" : "false";
    const isVeg = (piatto.Vegetariano && piatto.Vegetariano.toUpperCase() === "SI") ? "true" : "false";
    const isNA = (piatto.Analcolico && piatto.Analcolico.toUpperCase() === "SI") ? "true" : "false";

    const allergeniTesto = piatto.Allerg_IT ? `Allergeni: ${piatto.Allerg_IT}` : "";
    const prezzoFormattato = piatto.Prezzo ? `€ ${piatto.Prezzo}` : "";

    const cardHTML = `
      <div class="dish-card hidden" 
           data-macro="${piatto.Macro}" 
           data-gf="${isGF}" data-veg="${isVeg}" data-na="${isNA}">
        <h3 class="dish-name">${piatto.Nome_IT}</h3>
        ${piatto.Desc_IT ? `<p class="dish-desc">${piatto.Desc_IT}</p>` : ''}
        ${allergeniTesto ? `<p class="dish-allerg">${allergeniTesto}</p>` : ''}
        <div class="dish-price">${prezzoFormattato}</div>
      </div>`;
    dishesSection.insertAdjacentHTML('beforeend', cardHTML);
  });
}

// --- LOGICA VISTE E FILTRI ---

function filtraPerMacro(macroSelezionata) {
  // 1. Nascondo Macro
  macroSection.classList.add("hidden");
  // 2. Mostro Filtri e Tasto Indietro
  filtersSection.classList.remove("hidden");
  btnBack.classList.remove("hidden");
  
  // 3. Mostro solo i piatti della macro scelta
  const allDishes = document.querySelectorAll(".dish-card");
  allDishes.forEach(dish => {
    if (dish.getAttribute("data-macro") === macroSelezionata) {
      dish.classList.remove("hidden-by-macro");
      dish.classList.remove("hidden"); 
    } else {
      dish.classList.add("hidden-by-macro");
      dish.classList.add("hidden");
    }
  });
  
  applicaFiltri(); 
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  // 1. Mostro Macro
  macroSection.classList.remove("hidden");
  // 2. Nascondo Filtri e Tasto Indietro
  filtersSection.classList.add("hidden");
  btnBack.classList.add("hidden");
  
  // 3. Nascondo tutti i piatti
  document.querySelectorAll(".dish-card").forEach(dish => {
    dish.classList.add("hidden");
  });

  // 4. Resetto lo stato dei bottoni filtro così è pulito per la prossima volta
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
}

function applicaFiltri() {
  const activeFilters = Array.from(document.querySelectorAll(".filter-btn.active")).map(btn => btn.getAttribute("data-filter"));
  const allDishes = document.querySelectorAll(".dish-card:not(.hidden-by-macro)"); 

  allDishes.forEach(dish => {
    let showDish = true;
    if (activeFilters.length > 0) {
      activeFilters.forEach(filter => {
        if (dish.getAttribute(`data-${filter}`) !== "true") showDish = false;
      });
    }
    
    if (showDish) {
      dish.style.display = "flex"; 
    } else {
      dish.style.display = "none";
    }
  });
}

// --- TASTO TORNA SU ---
window.onscroll = function() {
  const btnTop = document.getElementById("btn-top");
  // Evita errori se btnTop non esiste ancora
  if(!btnTop) return; 

  if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
    btnTop.classList.remove("hidden");
  } else {
    btnTop.classList.add("hidden");
  }
};

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
