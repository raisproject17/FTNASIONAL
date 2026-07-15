export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode Tidak Diizinkan' });

    try {
        const { action, key, device } = req.body;
        
        const sheetId = process.env.SECRET_SHEET_ID;
        const envAdminKey = process.env.ADMIN_ACCESS_KEY; 
        const gasUrl = process.env.GAS_WEB_APP_URL;

        if (!sheetId || !envAdminKey) {
            return res.status(500).json({ error: "Konfigurasi sistem belum lengkap di Vercel." });
        }

        // Helper untuk mencatat log ke Google Sheets (Berjalan di background)
        const logLogin = async (role, status) => {
            if (!gasUrl) return;
            try {
                await fetch(gasUrl, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'log_login', role, status, device: device || 'Unknown' }),
                    headers: { 'Content-Type': 'text/plain' }
                });
            } catch(e) { console.error("Gagal log:", e); }
        };

        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=admin`;
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets.");
        
        const csvText = await response.text();
        let currentPublicKey = null;
        for (let row of csvText.split('\n')) {
            const columns = row.split(',').map(col => col.replace(/(^"|"$)/g, '').trim());
            if (columns[0] === 'PUBLIC_KEY') { currentPublicKey = columns[1]; break; }
        }

        if (action === 'verify') {
            if (key === envAdminKey) {
                await logLogin('Admin', '🟢 Sukses');
                return res.status(200).json({ role: 'admin' });
            } else if (key === currentPublicKey) {
                await logLogin('Public', '🟢 Sukses');
                return res.status(200).json({ role: 'public' });
            } else {
                await logLogin('Unknown', '🔴 Gagal (Sandi Salah)');
                return res.status(401).json({ error: 'Kunci Akses tidak valid atau telah kadaluarsa.' });
            }
        }
        return res.status(400).json({ error: 'Aksi tidak dikenal.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
