// Registrazione del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrato!'))
            .catch(err => console.log('Errore SW:', err));
    });
}

// Funzione per caricare il CSV esterno
async function loadExternalCSV(url) {
    try {
        const response = await fetch(url);
        const csvString = await response.text();
        
        // Parsing del CSV
        Papa.parse(csvString, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("Dati CSV caricati:", results.data);
                renderData(results.data);
            }
        });
    } catch (error) {
        console.error("Errore nel caricamento del CSV:", error);
    }
}

// Funzione di visualizzazione (placeholder)
function renderData(data) {
    const output = document.getElementById('output');
    output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// Esempio di utilizzo:
// loadExternalCSV('https://tuo-url.com/file.csv');
