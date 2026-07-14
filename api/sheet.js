export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    // Rahasia URL diambil dari Environment Variable
    let SHEET_URL = process.env.SPREADSHEET_URL;

    // FITUR AUTO-CONVERT: 
    // Jika URL yang dimasukkan adalah link /edit biasa, otomatis ubah menjadi format CSV
    if (SHEET_URL && SHEET_URL.includes('/edit')) {
        SHEET_URL = SHEET_URL.replace(/\/edit.*$/, '/export?format=csv');
    }

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Gagal mengunduh spreadsheet");
        
        const csvText = await response.text();
        
        // Parsing CSV sederhana
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
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
