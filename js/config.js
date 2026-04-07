// Funzione per caricare i Google Fonts dinamicamente
function loadGoogleFont(fontName) {
    if (!fontName) return;
    const fontId = 'font-' + fontName.replace(/\s+/g, '-').toLowerCase();
    
    if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
        document.head.appendChild(link);
    }
}

window.AppEngine = {
    state: {
        layoutMode: 'MACRO',
    },

    applyEngineSettings: function(configData) {
        const root = document.documentElement;

        // 1. MOTORE LAYOUT E SFONDO
        this.state.layoutMode = configData['Layout_Mode'] || 'MACRO';
        
        const bgType = configData['App_Bg_Type'];
        if (bgType === 'COLOR') {
            root.style.setProperty('--app-bg-color', configData['App_Bg_Color']);
            root.style.setProperty('--app-bg-image', 'none');
        } else if (bgType === 'IMAGE') {
            root.style.setProperty('--app-bg-image', `url('${configData['App_Bg_Image']}')`);
            root.style.setProperty('--app-bg-position', configData['App_Bg_Image_Pos']);
            root.style.setProperty('--app-bg-size', configData['App_Bg_Image_Size']);
            root.style.setProperty('--app-bg-color', configData['App_Bg_Color']);
        }

        // 2. BRAND E HEADER
        loadGoogleFont(configData['Font_Main']);
        loadGoogleFont(configData['Subtitle_Font']);
        loadGoogleFont(configData['Iva_Text_Font']);

        root.style.setProperty('--font-main', `'${configData['Font_Main']}', sans-serif`);
        root.style.setProperty('--subtitle-font', `'${configData['Subtitle_Font']}', sans-serif`);
        root.style.setProperty('--subtitle-color', configData['Subtitle_Color']);
        root.style.setProperty('--subtitle-size', configData['Subtitle_Size']);
        root.style.setProperty('--subtitle-margin', configData['Subtitle_Margin']);
        
        root.style.setProperty('--iva-font', `'${configData['Iva_Text_Font']}', sans-serif`);
        root.style.setProperty('--iva-color', configData['Iva_Text_Color']);
        root.style.setProperty('--iva-size', configData['Iva_Text_Size']);

        const logoContainer = document.getElementById('logo-container');
        logoContainer.innerHTML = ''; // Pulizia preventiva

        if (configData['Logo_Type'] && configData['Logo_Type'].toUpperCase() === 'IMAGE') {
            root.style.setProperty('--logo-img-size', configData['Logo_Img_Size']);
            logoContainer.innerHTML = `<img src="${configData['Logo_URL']}" alt="Logo Menu" style="width: var(--logo-img-size); max-width: 100%; height: auto;">`;
        } else {
            root.style.setProperty('--logo-text-color', configData['Logo_Text_Color']);
            root.style.setProperty('--logo-text-size', configData['Logo_Text_Size']);
            logoContainer.innerHTML = `<h1 class="logo-text-element">${configData['Logo_Text']}</h1>`;
        }

        if (configData['App_Subtitle']) {
            const subtitleEl = document.createElement('div');
            subtitleEl.className = 'subtitle-element';
            subtitleEl.innerText = configData['App_Subtitle'];
            subtitleEl.style.textAlign = configData['Subtitle_Align'] || 'center';
            logoContainer.appendChild(subtitleEl);
        }

        // 3. IVA / PIÈ DI PAGINA
        const footerEl = document.getElementById('app-footer');
        if (configData['IVA_Type'] && configData['IVA_Type'].toUpperCase() === 'SI') {
            footerEl.innerText = configData['IVA_Text'];
            const alignParts = (configData['Iva_Text_Align'] || 'center').split(',');
            footerEl.style.textAlign = alignParts[0].trim();
            footerEl.classList.remove('hidden');
        } else {
            footerEl.classList.add('hidden');
        }
    }
};
