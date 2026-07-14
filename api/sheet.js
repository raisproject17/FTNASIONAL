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
