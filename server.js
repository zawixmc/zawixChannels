const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/channels', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels', 'index.html'));
});

app.get('/channels/', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels', 'index.html'));
});

app.get('/channels/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels', 'index.html'));
});

app.get('/channels/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels', 'script.js'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/channels.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels.js'));
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.post('/save-channels', (req, res) => {
    try {
        fs.writeFileSync('channels.js', req.body.content);
        console.log('✅ Plik channels.js został zaktualizowany');
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Błąd zapisywania pliku:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log('\n🚀 zawixChannels Server');
    console.log('═══════════════════════════════');
    console.log(`📡 Serwer działa na porcie: ${PORT}`);
    console.log('🎬 Panel administracyjny: /channels');
    console.log('💾 API do zapisywania: /save-channels');
    console.log('═══════════════════════════════');
    console.log('⚡ Gotowy do działania!\n');
});

process.on('SIGINT', () => {
    console.log('\n👋 Zatrzymywanie serwera...');
    console.log('🔴 Serwer zatrzymany');
    process.exit(0);
});

module.exports = app;