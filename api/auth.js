export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    try {
        const { action, key, device } = req.body;
        const envAdminKey = process.env.ADMIN_ACCESS_KEY;
        const gasUrl = process.env.GAS_WEB_APP_URL;

        if (!envAdminKey || !gasUrl) {
            return res.status(500).json({ error: "Vercel Env Variables belum diatur." });
        }

        const inputKeyStr = String(key || "").trim();
        const adminKeyStr = String(envAdminKey).trim();

        let activePublicKey = null;
        let activePrivateKey = null;

        if (action === 'verify') {
            try {
                const gasRes = await fetch(`${gasUrl}?action=get_key`);
                const gasData = await gasRes.json();
                
                if (gasData.publicKey) activePublicKey = String(gasData.publicKey).trim();
                if (gasData.privateKey) activePrivateKey = String(gasData.privateKey).trim();
            } catch (err) {
                console.error("Gagal mengambil kunci dari GAS:", err);
            }
        }

        let role = 'Unknown';
        let statusLog = '🔴 Gagal (Sandi Salah)';
        let isSuccess = false;

        if (inputKeyStr === adminKeyStr) {
            role = 'admin';
            statusLog = '🟢 Sukses (Admin)';
            isSuccess = true;
        } else if (activePrivateKey && inputKeyStr === activePrivateKey) {
            role = 'private'; // Akses Full AI, Tanpa Dashboard
            statusLog = '🟢 Sukses (Private)';
            isSuccess = true;
        } else if (activePublicKey && inputKeyStr === activePublicKey) {
            role = 'public'; // Akses Non-AI
            statusLog = '🟢 Sukses (Public)';
            isSuccess = true;
        }

        // Kirim Log ke GAS (Background process)
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

        if (isSuccess) {
            return res.status(200).json({ role });
        } else {
            return res.status(401).json({ error: 'Kunci Akses salah atau telah direset.' });
        }

    } catch (error) {
        return res.status(500).json({ error: "Terjadi kesalahan sistem: " + error.message });
    }
}
