let isLoggedIn = false;
let currentEditingChannel = null;
let channelLookupById = {};

const categories = {
    'Canal+ Channels': ['Canal+'],
    'Eleven Sports Channels': ['Eleven Sports'],
    'Polsat Sport Channels': ['Polsat Sport', 'Polsat Sport Fight', 'Polsat Sport Premium'],
    'Inne Kanały': ['TVP', 'MOTOWIZJA', 'Eurosport']
};

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error('Błąd zapisywania do localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.error('Błąd odczytywania z localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Błąd usuwania z localStorage:', error);
        return false;
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initializeChannelLookup() {
    if (typeof window.channelsData !== 'undefined') {
        Object.entries(channelsData).forEach(([id, channelArray]) => {
            channelLookupById[id] = channelArray[0];
        });
    }
}

function checkLoginStatus() {
    const loginStatus = getFromLocalStorage('channelsAdminLoggedIn');
    const loginTimestamp = getFromLocalStorage('channelsAdminLoginTime');
    
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000;
    
    if (loginStatus === 'true' && loginTimestamp) {
        const timeDiff = currentTime - parseInt(loginTimestamp);
        if (timeDiff < sessionDuration) {
            isLoggedIn = true;
            showAdminView();
            return true;
        } else {
            logout();
            return false;
        }
    }
    
    showLoginView();
    return false;
}

function showLoginView() {
    const loginView = document.getElementById('loginView');
    const adminView = document.getElementById('adminView');
    
    if (loginView) loginView.classList.remove('hidden');
    if (adminView) adminView.classList.add('hidden');
}

function showAdminView() {
    const loginView = document.getElementById('loginView');
    const adminView = document.getElementById('adminView');
    
    if (loginView) loginView.classList.add('hidden');
    if (adminView) adminView.classList.remove('hidden');
    
    setTimeout(() => {
        renderChannels();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.removeEventListener('input', filterChannels);
            searchInput.addEventListener('input', filterChannels);
        }
    }, 100);
}

function login(event) {
    event.preventDefault();
    
    const loginInput = document.getElementById('loginInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('loginError');
    
    if (!loginInput || !passwordInput || !errorDiv) {
        console.error('Nie znaleziono elementów logowania');
        return;
    }
    
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (login === 'admin' && password === 'Kzawix11') {
        isLoggedIn = true;
        const currentTime = Date.now();
        
        if (saveToLocalStorage('channelsAdminLoggedIn', 'true') && 
            saveToLocalStorage('channelsAdminLoginTime', currentTime.toString())) {
            
            errorDiv.textContent = '';
            showAdminView();
        } else {
            errorDiv.textContent = 'Błąd zapisywania sesji. Spróbuj ponownie.';
        }
    } else {
        errorDiv.textContent = 'Nieprawidłowy login lub hasło';
    }
}

function logout() {
    isLoggedIn = false;
    
    removeFromLocalStorage('channelsAdminLoggedIn');
    removeFromLocalStorage('channelsAdminLoginTime');
    
    showLoginView();
    
    const loginInput = document.getElementById('loginInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('loginError');
    
    if (loginInput) loginInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorDiv) errorDiv.textContent = '';
}

function goToHome() {
    if (isLoggedIn) {
        saveToLocalStorage('channelsAdminLoggedIn', 'true');
        saveToLocalStorage('channelsAdminLoginTime', Date.now().toString());
    }
    window.location.href = '../index.html';
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

function openEditModal(channelId) {
    if (!isLoggedIn) return;
    
    const channel = channelLookupById[channelId];
    if (!channel) return;
    
    currentEditingChannel = { id: channelId, data: {...channel} };
    
    const modalTitle = document.getElementById('modalTitle');
    const channelNameInput = document.getElementById('channelNameInput');
    
    if (modalTitle) modalTitle.textContent = `Edytowanie Kanału ${channel.name}`;
    if (channelNameInput) channelNameInput.value = channel.name;
    
    renderUrlFields(channel);
    
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.classList.remove('hidden');
}

function renderUrlFields(channel) {
    const urlsContainer = document.getElementById('urlsContainer');
    if (!urlsContainer) return;
    
    urlsContainer.innerHTML = '';
    
    const urls = [];
    for (let i = 1; i <= 10; i++) {
        const urlKey = `url${i}`;
        if (channel[urlKey]) {
            urls.push({key: urlKey, url: channel[urlKey], number: i});
        }
    }
    
    if (urls.length === 0) {
        urls.push({key: 'url1', url: '', number: 1});
    }
    
    urls.forEach(urlData => {
        const urlFieldHtml = `
            <div class="url-field" data-url-key="${urlData.key}">
                <label>URL ${urlData.number}:</label>
                <div class="url-input-group">
                    <input type="text" class="form-input url-input" value="${escapeHtml(urlData.url)}" data-url-key="${urlData.key}">
                    <button class="delete-url-btn" onclick="removeUrlField('${urlData.key}')" ${urls.length <= 1 ? 'disabled' : ''}>🗑️</button>
                </div>
            </div>
        `;
        urlsContainer.insertAdjacentHTML('beforeend', urlFieldHtml);
    });
}

function addUrlField() {
    const urlsContainer = document.getElementById('urlsContainer');
    if (!urlsContainer) return;
    
    const existingFields = urlsContainer.querySelectorAll('.url-field');
    
    let nextNumber = 1;
    for (let i = 1; i <= 10; i++) {
        const exists = Array.from(existingFields).some(field => 
            field.dataset.urlKey === `url${i}`
        );
        if (!exists) {
            nextNumber = i;
            break;
        }
    }
    
    if (nextNumber > 10) return;
    
    const urlFieldHtml = `
        <div class="url-field" data-url-key="url${nextNumber}">
            <label>URL ${nextNumber}:</label>
            <div class="url-input-group">
                <input type="text" class="form-input url-input" value="" data-url-key="url${nextNumber}">
                <button class="delete-url-btn" onclick="removeUrlField('url${nextNumber}')">🗑️</button>
            </div>
        </div>
    `;
    urlsContainer.insertAdjacentHTML('beforeend', urlFieldHtml);
    
    updateDeleteButtons();
}

function removeUrlField(urlKey) {
    const field = document.querySelector(`[data-url-key="${urlKey}"]`);
    if (field) {
        field.remove();
        updateDeleteButtons();
    }
}

function updateDeleteButtons() {
    const urlFields = document.querySelectorAll('.url-field');
    const deleteButtons = document.querySelectorAll('.delete-url-btn');
    
    deleteButtons.forEach(btn => {
        btn.disabled = urlFields.length <= 1;
    });
}

function saveChannel() {
    if (!currentEditingChannel) return;
    
    const channelNameInput = document.getElementById('channelNameInput');
    if (!channelNameInput) return;
    
    const channelName = channelNameInput.value.trim();
    if (!channelName) {
        alert('Nazwa kanału nie może być pusta');
        return;
    }
    
    const urlInputs = document.querySelectorAll('.url-input');
    const hasEmptyUrl = Array.from(urlInputs).some(input => {
        const value = input.value.trim();
        return value === '';
    });
    
    if (hasEmptyUrl) {
        alert('Wszystkie pola URL muszą być wypełnione lub usunięte');
        return;
    }
    
    const updatedChannel = {
        ...currentEditingChannel.data,
        name: channelName
    };
    
    for (let i = 1; i <= 10; i++) {
        delete updatedChannel[`url${i}`];
    }
    
    urlInputs.forEach(input => {
        const urlKey = input.dataset.urlKey;
        const urlValue = input.value.trim();
        if (urlValue) {
            updatedChannel[urlKey] = urlValue;
        }
    });
    
    if (typeof window.channelsData !== 'undefined') {
        channelsData[currentEditingChannel.id] = [updatedChannel];
        channelLookupById[currentEditingChannel.id] = updatedChannel;
    }
    
    saveChannelsData();
    closeEditModal();
    renderChannels();
}

function saveChannelsData() {
    if (typeof window.channelsData === 'undefined') {
        alert('Błąd: Brak danych kanałów do zapisania');
        return;
    }
    
    const channelsScript = `window.channelsData = ${JSON.stringify(channelsData, null, 4)};`;
    
    fetch('/save-channels', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: channelsScript })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Plik channels.js został zaktualizowany!');
        } else {
            alert('Błąd: ' + (data.error || 'Nieznany błąd'));
        }
    })
    .catch(error => {
        console.error('Błąd:', error);
        alert('Błąd zapisywania: ' + error.message);
    });
}

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.classList.add('hidden');
    currentEditingChannel = null;
}

function renderChannels(filteredData = null) {
    if (!isLoggedIn || typeof window.channelsData === 'undefined') return;
    
    const container = document.getElementById('channelsContainer');
    if (!container) return;
    
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
                <h2 class="category-title">${escapeHtml(category)}</h2>
                <div class="channels-grid">
        `;
        
        channels.forEach(channel => {
            const escapedChannelName = escapeHtml(channel.name);
            const escapedChannelId = escapeHtml(channel.id);
            const playUrl = channel.url1 || '';
            
            html += `
                <div class="channel-card">
                    <div class="channel-name">${escapedChannelName}</div>
                    <div class="channel-info">
                        <span class="language">${escapeHtml(channel.language || 'PL')}</span>
                        <span class="quality-badge ${getQualityClass(channel.quality || 'SD')}">${escapeHtml(channel.quality || 'SD')}</span>
                    </div>
                    <div class="channel-buttons">
                        <button class="play-button" onclick="window.open('${escapeHtml(playUrl)}', '_blank')" ${!playUrl ? 'disabled' : ''}>Oglądaj na żywo</button>
                        <button class="edit-button" onclick="openEditModal('${escapedChannelId}')">Edytuj</button>
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
    if (!isLoggedIn || typeof window.channelsData === 'undefined') return;
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM załadowany - inicjalizacja panelu admina');
    
	const isAdminPage = window.location.pathname === '/channels' || 
					   window.location.pathname.endsWith('/channels.html') ||
					   document.getElementById('loginView') !== null;
    
    if (!isAdminPage) {
        console.log('Nie jest to strona admina');
        return;
    }
    
    initializeChannelLookup();
    
    checkLoginStatus();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            closeEditModal();
        }
    });
    
    setInterval(() => {
        if (isLoggedIn) {
            saveToLocalStorage('channelsAdminLoginTime', Date.now().toString());
        }
    }, 5 * 60 * 1000);
});

window.addEventListener('beforeunload', function() {
    if (isLoggedIn) {
        saveToLocalStorage('channelsAdminLoggedIn', 'true');
        saveToLocalStorage('channelsAdminLoginTime', Date.now().toString());
    }
});