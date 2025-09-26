const categories = {
    'Canal+ Channels': ['Canal+'],
    'Eleven Sports Channels': ['Eleven Sports'],
    'Polsat Sport Channels': ['Polsat Sport', 'Polsat Sport Fight', 'Polsat Sport Premium'],
    'Inne Kanały': ['TVP', 'MOTOWIZJA', 'Eurosport']
};

let channelLookupById = {};
let firstClickTracker = new Set();

const adLink = 'https://www.revenuecpmgate.com/edh6fisc?key=0c99a1d5fe8ce628e3dcaa38ebc0d01b';

const EXPIRY_DATE = new Date('2025-10-16T13:25:34');

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function checkExpiry() {
    const now = new Date();
    if (now > EXPIRY_DATE) {
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                color: #ff4444;
                font-family: Arial, sans-serif;
                text-align: center;
            ">
                <div style="
                    background: rgba(255, 68, 68, 0.1);
                    border: 2px solid #ff4444;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    box-shadow: 0 0 50px rgba(255, 68, 68, 0.3);
                    animation: pulse 2s infinite;
                ">
                    <h1 style="
                        font-size: 48px;
                        margin: 0 0 20px 0;
                        text-shadow: 0 0 20px #ff4444;
                    ">STRONA WYGASŁA</h1>
                    <p style="
                        font-size: 24px;
                        margin: 0 0 20px 0;
                        opacity: 0.9;
                    ">Dostęp do zawixChannels wygasł dnia:</p>
                    <p style="
                        font-size: 32px;
                        margin: 0;
                        font-weight: bold;
                        text-shadow: 0 0 10px #ff4444;
                    ">${EXPIRY_DATE.toLocaleDateString('pl-PL')} ${EXPIRY_DATE.toLocaleTimeString('pl-PL')}</p>
                </div>
                <style>
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                </style>
            </div>
        `;
        return true;
    }
    return false;
}

function initializeChannelLookup() {
    Object.entries(channelsData).forEach(([id, channelArray]) => {
        channelLookupById[id] = channelArray[0];
    });
}

function getQualityClass(quality) {
    const q = quality.toUpperCase();
    if (q.includes('ULTRA')) return 'quality-uhd';
    if (q.includes('SUPER')) return 'quality-shd';
    if (q.includes('HD')) return 'quality-hd';
    return 'quality-sd';
}

function categorizeChannel(channelName) {
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => channelName.includes(keyword))) {
            return category;
        }
    }
    return 'Inne Kanały';
}

function playChannel(channelId, channelName, url, event) {
    event.stopPropagation();
    
    if (checkExpiry()) return;
    
    if (!firstClickTracker.has(channelId)) {
        firstClickTracker.add(channelId);
        window.open(adLink, '_blank');
        return;
    }
    
    history.pushState({channelId: channelId, channelName: channelName, url: url}, channelName, `/${channelId}`);
    showPlayer(url, channelName);
}

function showPlayer(url, channelName) {
    if (checkExpiry()) return;
    
    const mainView = document.getElementById('mainView');
    const playerView = document.getElementById('playerView');
    const playerContainer = document.getElementById('playerContainer');
    
    mainView.classList.add('hidden');
    playerView.classList.add('active');
    
    const iframeHtml = `
        <iframe 
            src="${url}" 
            allowfullscreen 
            frameborder="0"
            allow="autoplay; encrypted-media; fullscreen"
            style="width: 100%; height: 100%; border: none;">
        </iframe>
    `;
    
    playerContainer.innerHTML = iframeHtml;
    document.title = `${channelName} - zawixChannels`;
    
    const iframe = playerContainer.querySelector('iframe');
    iframe.addEventListener('error', function() {
        console.log('Błąd ładowania iframe, próba otwarcia w nowym oknie...');
        openInNewWindow(url, channelName);
    });
    
    setTimeout(() => {
        try {
            if (!iframe.contentDocument && !iframe.contentWindow) {
                console.log('Iframe nie załadował się poprawnie, otwieranie w nowym oknie...');
                openInNewWindow(url, channelName);
            }
        } catch (e) {
        }
    }, 3000);
}

function goBack() {
    if (checkExpiry()) return;
    
    const mainView = document.getElementById('mainView');
    const playerView = document.getElementById('playerView');
    const playerContainer = document.getElementById('playerContainer');
    
    mainView.classList.remove('hidden');
    playerView.classList.remove('active');
    playerContainer.innerHTML = '';
    
    history.pushState({}, 'zawixChannels', '/');
    document.title = 'zawixChannels';
}

function handlePopState(event) {
    if (checkExpiry()) return;
    
    const path = window.location.pathname;
    
    if (path === '/' || path === '') {
        goBack();
    } else if (path === '/channels') {
        window.location.href = '/channels.html';
    } else {
        const channelId = path.substring(1);
        const channel = channelLookupById[channelId];
        
        if (channel && firstClickTracker.has(channelId)) {
            showPlayer(channel.url1, channel.name);
        } else {
            goBack();
        }
    }
}

function getAvailableUrls(channel) {
    const urls = [];
    for (let i = 1; i <= 10; i++) {
        const urlKey = `url${i}`;
        if (channel[urlKey]) {
            urls.push({key: urlKey, url: channel[urlKey], number: i});
        }
    }
    return urls;
}

function renderChannels(filteredData = null) {
    if (checkExpiry()) return;
    
    const container = document.getElementById('channelsContainer');
    const dataToRender = filteredData || channelsData;
    
    const groupedChannels = {};
    
    Object.entries(dataToRender).forEach(([id, channelArray]) => {
        channelArray.forEach(channel => {
            const category = categorizeChannel(channel.name);
            if (!groupedChannels[category]) {
                groupedChannels[category] = [];
            }
            groupedChannels[category].push({...channel, id: id});
        });
    });

    let html = '';
    Object.entries(groupedChannels).forEach(([category, channels]) => {
        html += `
            <div class="category">
                <h2 class="category-title">${category}</h2>
                <div class="channels-grid">
        `;
        
        channels.forEach(channel => {
            const availableUrls = getAvailableUrls(channel);
            const escapedChannelName = escapeHtml(channel.name);
            const escapedChannelId = escapeHtml(channel.id);
            
            html += `
                <div class="channel-card">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-info">
                        <span class="language">${channel.language}</span>
                        <span class="quality-badge ${getQualityClass(channel.quality)}">${channel.quality}</span>
                    </div>
                    <div class="channel-buttons">
                        <button class="play-button" onclick="playChannel('${escapedChannelId}', '${escapedChannelName}', '${availableUrls[0]?.url || ''}', event)">Oglądaj na żywo</button>
                        <div class="url-buttons">
            `;
            
            if (availableUrls.length === 0) {
                html += `<div class="no-channel-bar">Brak kanału</div>`;
            } else {
                for (let i = 0; i < availableUrls.length; i++) {
                    if (i > 0 && i % 5 === 0) {
                        html += `</div><div class="url-buttons">`;
                    }
                    const urlData = availableUrls[i];
                    const escapedUrl = escapeHtml(urlData.url);
                    html += `<button class="url-btn" onclick="playChannel('${escapedChannelId}', '${escapedChannelName}', '${escapedUrl}', event)">SRV ${urlData.number}</button>`;
                }
            }
            
            html += `
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function filterChannels() {
    if (checkExpiry()) return;
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        renderChannels();
        return;
    }
    const filtered = {};
    Object.entries(channelsData).forEach(([id, channelArray]) => {
        const matchingChannels = channelArray.filter(channel => 
            channel.name.toLowerCase().includes(searchTerm)
        );
        if (matchingChannels.length > 0) {
            filtered[id] = matchingChannels;
        }
    });
    renderChannels(filtered);
}

function openInNewWindow(url, channelName) {
    if (checkExpiry()) return;
    
    const newWindow = window.open('', '_blank', 'width=1920,height=1080,scrollbars=yes,resizable=yes');
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${channelName}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        background: #000; 
                        overflow: hidden; 
                        font-family: Arial, sans-serif;
                    }
                    iframe { 
                        width: 100vw; 
                        height: 100vh; 
                        border: none; 
                        display: block;
                    }
                    .error-msg {
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 18px;
                    }
                </style>
            </head>
            <body>
                <iframe 
                    src="${url}" 
                    allowfullscreen
                    allow="autoplay; encrypted-media; fullscreen; payment; geolocation; microphone; camera"
                    referrerpolicy="no-referrer-when-downgrade"
                    onerror="document.body.innerHTML='<div class=&quot;error-msg&quot;>Błąd ładowania strumienia. Spróbuj odświeżyć stronę.</div>'">
                </iframe>
            </body>
            </html>
        `);
        newWindow.document.close();
    } else {
        alert('Zablokowano wyskakujące okno. Proszę pozwolić na wyskakujące okna dla tej strony.');
    }
}

function goToAdminPanel() {
    if (checkExpiry()) return;
    
    window.location.href = '/channels';
}

document.addEventListener('DOMContentLoaded', function() {
    if (checkExpiry()) return;
    
    setTimeout(() => {
        if (typeof window.channelsData !== 'undefined') {
            initializeChannelLookup();
            renderChannels();
        } else {
            const container = document.getElementById('channelsContainer');
            container.innerHTML = `
                <div class="loading">
                    <p>Błąd ładowania danych kanałów. Sprawdź plik channels.js</p>
                </div>
            `;
        }
    }, 200);
    
    window.addEventListener('popstate', handlePopState);
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '' && currentPath !== '/channels') {
        const channelId = currentPath.substring(1);
        setTimeout(() => {
            const channel = channelLookupById[channelId];
            if (channel && firstClickTracker.has(channelId)) {
                showPlayer(channel.url1, channel.name);
            } else {
                history.replaceState({}, 'zawixChannels', '/');
            }
        }, 300);
    }
    
    document.getElementById('searchInput').addEventListener('input', filterChannels);
    
    setInterval(checkExpiry, 60000);
});