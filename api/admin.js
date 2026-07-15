export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    try {
        const { action, adminKey, newPublicKey, newPrivateKey } = req.body;
        
        // Verifikasi keamanan bahwa yang meminta data benar-benar Admin
        const envAdminKey = process.env.ADMIN_ACCESS_KEY;
        if (String(adminKey).trim() !== String(envAdminKey).trim()) {
            return res.status(401).json({ error: 'Akses Ditolak: Kunci Admin Tidak Valid.' });
        }

        const gasUrl = process.env.GAS_WEB_APP_URL;

        if (action === 'get_dashboard') {
            // Ambil data dari GAS Get Default
            const gasRes = await fetch(gasUrl);
            const data = await gasRes.json();
            return res.status(200).json(data);
        }

        if (action === 'update_keys') {
            // Kirim kunci baru ke GAS
            const gasRes = await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_keys',
                    publicKey: newPublicKey,
                    privateKey: newPrivateKey
                })
            });
            const data = await gasRes.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: 'Aksi admin tidak valid.' });

    } catch (error) {
        return res.status(500).json({ error: "Terjadi kesalahan sistem: " + error.message });
    }
}
