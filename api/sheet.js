module.exports = async function (req, res) {
    // 1. Mengizinkan CORS agar tidak diblokir browser saat testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    // 2. Rahasia URL diambil dari Environment Variable
    let SHEET_URL = process.env.SPREADSHEET_URL;

    if (!SHEET_URL) {
        return res.status(500).json({ error: "Variabel SPREADSHEET_URL belum diisi di Vercel." });
    }

    // 3. FITUR AUTO-CONVERT: Ubah URL /edit menjadi /export CSV
    if (SHEET_URL.includes('/edit')) {
        SHEET_URL = SHEET_URL.replace(/\/edit.*$/, '/export?format=csv');
    }

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Gagal menghubungi Google Sheets.");
        
        const csvText = await response.text();
        
        // 4. Pengecekan Izin Akses Google Sheet
        if (csvText.trim().toLowerCase().startsWith('<!doctype html>')) {
            throw new Error("Akses ditolak! Buka Google Sheet Anda -> klik 'Share' -> ubah menjadi 'Anyone with the link' (Siapa saja yang memiliki link).");
        }
        
        // 5. Parsing CSV
        const arr = [];
        let quote = false;
        let row = 0, col = 0;
        for (let c = 0; c < csvText.length; c++) {
            let cc = csvText[c], nc = csvText[c+1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
            if (cc == '"') { quote = !quote; continue; }
            if (cc == ',' && !quote) { ++col; continue; }
            if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
            if (cc == '\n' && !quote) { ++row; col = 0; continue; }
            if (cc == '\r' && !quote) { ++row; col = 0; continue; }
            arr[row][col] += cc;
        }

        // Filter data kosong
        const validData = arr.filter(r => r.length >= 2 && r[0].trim() !== '');
        
        res.status(200).json(validData);
    } catch (error) {
        console.error("Sheet API Error:", error);
        res.status(500).json({ error: error.message });
    }
};


File 2: api/gemini.js

File ini akan memproses pencarian Gemini tanpa mengekspos API Key ke publik.

module.exports = async function (req, res) {
    // 1. Mengizinkan CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // 2. Mengambil API Key dari Vercel
    const API_KEY = process.env.GEMINI_API_KEY;
    const query = req.body.query;

    if (!API_KEY) return res.status(500).json({ error: "Variabel GEMINI_API_KEY belum diisi di Vercel." });
    if (!query) return res.status(400).json({ error: "Query pencarian tidak boleh kosong." });

    // 3. Konfigurasi model stabil gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: query }] }],
        systemInstruction: { 
            parts: [{ text: "Anda adalah asisten cerdas untuk menjawab kuis dan pertanyaan umum. Berikan jawaban yang akurat, singkat, dan langsung pada intinya dalam bahasa Indonesia." }] 
        },
        tools: [{ googleSearch: {} }] 
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Koneksi ke AI Google gagal.");
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak menemukan jawaban.";
        
        // Memisahkan sumber referensi link dari Google
        const rawSources = data.candidates?.[0]?.groundingMetadata?.groundingAttributions;
        let sources = [];
        if (rawSources) {
            sources = rawSources
                .filter(a => a.web && a.web.uri)
                .map(a => ({ uri: a.web.uri, title: a.web.title }));
            // Hilangkan duplikat
            sources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
        }

        res.status(200).json({ text, sources });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: error.message });
    }
};
