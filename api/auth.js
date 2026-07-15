export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    try {
        const { action, key } = req.body;
        
        // Ambil ID Sheet dan Kunci Admin (Master Key) dari Vercel Environment Variables
        const sheetId = process.env.SECRET_SHEET_ID;
        const envAdminKey = process.env.ADMIN_ACCESS_KEY; 

        if (!sheetId || !envAdminKey) {
            return res.status(500).json({ error: "Konfigurasi SECRET_SHEET_ID / ADMIN_ACCESS_KEY belum disetel di Vercel Settings." });
        }

        // Endpoint khusus Google Visualization API untuk mengambil spesifik Sheet bernama "admin"
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=admin`;
        
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error("Gagal mengambil data dari Google Sheets. Pastikan Spreadsheet disetel ke 'Anyone with the link can view'.");
        }

        const csvText = await response.text();
        
        // Parsing CSV Sederhana untuk mencari baris PUBLIC_KEY
        let currentPublicKey = null;
        const rows = csvText.split('\n');
        
        for (let row of rows) {
            // Hilangkan tanda kutip ganda ("") bawaan CSV
            const columns = row.split(',').map(col => col.replace(/(^"|"$)/g, '').trim());
            
            // Asumsi format di sheet -> Kolom A: PUBLIC_KEY | Kolom B: 12345
            if (columns[0] === 'PUBLIC_KEY') {
                currentPublicKey = columns[1];
                break;
            }
        }

        if (!currentPublicKey) {
            return res.status(500).json({ error: "Kunci publik belum diatur di dalam sheet 'admin'. Harap jalankan script GAS terlebih dahulu." });
        }

        // AKSI: VERIFIKASI LOGIN
        if (action === 'verify') {
            if (key === envAdminKey) {
                // Sesi Admin Valid
                return res.status(200).json({ role: 'admin' });
            } else if (key === currentPublicKey) {
                // Sesi Publik Valid
                return res.status(200).json({ role: 'public' });
            } else {
                return res.status(401).json({ error: 'Kunci Akses tidak valid atau telah kadaluarsa.' });
            }
        }

        return res.status(400).json({ error: 'Aksi tidak dikenal.' });

    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan sistem: " + error.message });
    }
}
