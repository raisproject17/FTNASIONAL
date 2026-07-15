export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    try {
        const { action, key, device } = req.body;
        
        // Ambil Kunci Admin dan URL Web App GAS dari Vercel Environment Variables
        const envAdminKey = process.env.ADMIN_ACCESS_KEY;
        const gasUrl = process.env.GAS_WEB_APP_URL;

        if (!envAdminKey || !gasUrl) {
            return res.status(500).json({ error: "Vercel Env Variables (ADMIN_ACCESS_KEY / GAS_WEB_APP_URL) belum diatur." });
        }

        // NORMALISASI: Pastikan input selalu berupa Teks (String) dan tidak ada spasi tidak terlihat
        const inputKeyStr = String(key || "").trim();
        const adminKeyStr = String(envAdminKey).trim();

        let activePublicKey = null;

        // Fetch current public key dari Google Apps Script
        if (action === 'verify') {
            try {
                const gasRes = await fetch(`${gasUrl}?action=get_key`);
                const gasData = await gasRes.json();
                
                // NORMALISASI Kunci Publik
                if (gasData.key) {
                    activePublicKey = String(gasData.key).trim();
                }
            } catch (err) {
                console.error("Gagal mengambil kunci dari GAS:", err);
            }
        }

        // Validasi Kunci
        let role = 'Unknown';
        let statusLog = '🔴 Gagal (Sandi Salah)';
        let isSuccess = false;

        // 1. Cek Sandi Admin
        if (inputKeyStr === adminKeyStr) {
            role = 'admin';
            statusLog = '🟢 Sukses';
            isSuccess = true;
        } 
        // 2. Cek Sandi Publik
        else if (activePublicKey && inputKeyStr === activePublicKey) {
            role = 'public';
            statusLog = '🟢 Sukses';
            isSuccess = true;
        }

        // Kirim Log ke GAS (Tidak menggunakan 'await' agar proses login ke aplikasi tidak melambat)
        if (action === 'verify') {
            fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'log_login',
                    device: device || 'Unknown Device',
                    role: role,
                    status: statusLog
                })
            }).catch(e => console.error("Gagal kirim log:", e));
        }

        // Return hasil ke Frontend
        if (isSuccess) {
            return res.status(200).json({ role });
        } else {
            return res.status(401).json({ error: 'Kunci Akses salah atau API Keys belum tersinkronisasi.' });
        }

    } catch (error) {
        return res.status(500).json({ error: "Terjadi kesalahan sistem: " + error.message });
    }
}
