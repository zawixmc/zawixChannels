const categories = {
    'Canal+ Channels': ['Canal+'],
    'Eleven Sports Channels': ['Eleven Sports'],
    'Polsat Sport Channels': ['Polsat Sport', 'Polsat Sport Fight', 'Polsat Sport Premium'],
    'Inne Kanały': ['TVP', 'MOTOWIZJA', 'Eurosport']
};

let channelLookupById = {};
let firstClickTracker = new Set();

const adLink = 'https://www.profitableratecpm.com/edh6fisc?key=0c99a1d5fe8ce628e3dcaa38ebc0d01b';

function initializeChannelLookup() {
    Object.entries(channelsData).forEach(([id, channelArray]) => {
        channelLookupById[id] = channelArray[0];
    });
}

function getQualityClass(quality) {
    const q = quality.toUpperCase();
    if (q.includes('ULTRA')) return 'quality-uhd';
    if (q.includes('FULL')) return 'quality-fhd';
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
    if (!firstClickTracker.has(channelId)) {
        firstClickTracker.add(channelId);
        window.open(adLink, '_blank');
        return;
    }
    
    history.pushState({channelId: channelId, channelName: channelName, url: url}, channelName, `/${channelId}`);
    showPlayer(url, channelName);
}

function showPlayer(url, channelName) {
    const mainView = document.getElementById('mainView');
    const playerView = document.getElementById('playerView');
    const playerContainer = document.getElementById('playerContainer');
    
    mainView.classList.add('hidden');
    playerView.classList.add('active');
    
    // Różne sposoby ładowania w zależności od URL
    let iframeHtml = '';
    
    if (url.includes('thedaddy.top')) {
        // Dla linków z thedaddy.top - próba z różnymi parametrami
        iframeHtml = `
            <iframe 
                src="${url}" 
                allowfullscreen 
                frameborder="0"
                allow="autoplay; encrypted-media; fullscreen"
                referrerpolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                style="width: 100%; height: 100%; border: none;">
            </iframe>
        `;
    } else {
        // Dla innych linków standardowe iframe
        iframeHtml = `<iframe src="${url}" allowfullscreen frameborder="0"></iframe>`;
    }
    
    playerContainer.innerHTML = iframeHtml;
    document.title = `${channelName} - zawixChannels`;
}

function goBack() {
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
    const path = window.location.pathname;
    
    if (path === '/' || path === '') {
        goBack();
    } else {
        const channelId = path.substring(1);
        const channel = channelLookupById[channelId];
        
        if (channel && firstClickTracker.has(channelId)) {
            showPlayer(channel.url, channel.name);
        } else {
            goBack();
        }
    }
}

function renderChannels(filteredData = null) {
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
            html += `
                <div class="channel-card" onclick="playChannel('${channel.id}', '${channel.name}', '${channel.url}', event)">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-info">
                        <span class="language">${channel.language}</span>
                        <span class="quality-badge ${getQualityClass(channel.quality)}">${channel.quality}</span>
                    </div>
                    <button class="play-button">Oglądaj na żywo</button>
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

// Funkcja do otwierania linku w nowym oknie jako fallback
function openInNewWindow(url, channelName) {
    const newWindow = window.open('', '_blank', 'width=1920,height=1080');
    newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${channelName}</title>
            <style>
                body { margin: 0; padding: 0; background: #000; }
                iframe { width: 100vw; height: 100vh; border: none; }
            </style>
        </head>
        <body>
            <iframe src="${url}" allowfullscreen></iframe>
        </body>
        </html>
    `);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeChannelLookup();
    
    window.addEventListener('popstate', handlePopState);
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '') {
        const channelId = currentPath.substring(1);
        const channel = channelLookupById[channelId];
        
        if (channel && firstClickTracker.has(channelId)) {
            showPlayer(channel.url, channel.name);
        } else {
            history.replaceState({}, 'zawixChannels', '/');
        }
    }

    setTimeout(() => {
        renderChannels();
    }, 1000);
    
    document.getElementById('searchInput').addEventListener('input', filterChannels);
});