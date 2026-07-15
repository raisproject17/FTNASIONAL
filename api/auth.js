export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode Tidak Diizinkan' });

    try {
        const { action, key, device } = req.body;
        
        const envAdminKey = process.env.ADMIN_ACCESS_KEY; 
        const gasUrl = process.env.GAS_WEB_APP_URL; // Gunakan URL GAS Web App

        if (!envAdminKey || !gasUrl) {
            return res.status(500).json({ error: "Konfigurasi ADMIN_ACCESS_KEY atau GAS_WEB_APP_URL belum diatur di Vercel." });
        }

        // Helper untuk mencatat log ke Google Sheets (Berjalan di background)
        const logLogin = async (role, status) => {
            try {
                await fetch(gasUrl, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'log_login', role, status, device: device || 'Unknown' }),
                    headers: { 'Content-Type': 'text/plain' } // GAS Butuh tipe ini untuk doPost JSON
                });
            } catch(e) { console.error("Gagal log:", e); }
        };

        // Ambil Data Kunci Terbaru dari GAS (Metode yang Jauh Lebih Aman & Pasti)
        let currentPublicKey = null;
        try {
            const getRes = await fetch(gasUrl);
            const dataSheet = await getRes.json();
            currentPublicKey = dataSheet.currentKey;
        } catch (gasError) {
            return res.status(500).json({ error: "Gagal menyambung ke Google Apps Script (Sistem Database)." });
        }

        if (action === 'verify') {
            if (key === envAdminKey) {
                // Jangan menunggu log selesai (await) agar login admin tetap instan dan cepat
                logLogin('Admin', '🟢 Sukses');
                return res.status(200).json({ role: 'admin' });
            } else if (key === currentPublicKey) {
                logLogin('Public', '🟢 Sukses');
                return res.status(200).json({ role: 'public' });
            } else {
                logLogin('Unknown', '🔴 Gagal (Sandi Salah)');
                return res.status(401).json({ error: 'Kunci Akses tidak valid atau telah kadaluarsa.' });
            }
        }
        return res.status(400).json({ error: 'Aksi tidak dikenal.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
