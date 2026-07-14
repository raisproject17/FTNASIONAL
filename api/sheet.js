module.exports = async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 1. URL SPREADSHEET (Sudah dikonversi ke format CSV)
    const SHEET_URL = "[https://docs.google.com/spreadsheets/d/10Xr6T9yTjfCTvMLurGzxe82gZ1QHbgEimYhEIBnlQp0/export?format=csv](https://docs.google.com/spreadsheets/d/10Xr6T9yTjfCTvMLurGzxe82gZ1QHbgEimYhEIBnlQp0/export?format=csv)";

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Gagal menghubungi Google Sheets.");
        
        const csvText = await response.text();
        
        // Pengecekan Izin Akses Google Sheet
        if (csvText.trim().toLowerCase().startsWith('<!doctype html>')) {
            throw new Error("Akses ditolak! Pastikan Google Sheet Anda disetel ke 'Anyone with the link'.");
        }
        
        // Parsing CSV
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
        res.status(500).json({ error: error.message });
    }
};
