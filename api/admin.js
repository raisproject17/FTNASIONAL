export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { action, adminKey, newKey } = req.body;
    
    // Validasi Keamanan: Pastikan yang me-request benar-benar Admin
    const envAdminKey = process.env.ADMIN_ACCESS_KEY;
    if (adminKey !== envAdminKey) {
        return res.status(401).json({ error: 'Akses Ditolak: Kunci Admin tidak valid.' });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) return res.status(500).json({ error: 'GAS_WEB_APP_URL belum diatur di Vercel.' });

    try {
        // Ambil Data Dashboard
        if (action === 'get_dashboard') {
            const response = await fetch(gasUrl);
            const data = await response.json();
            return res.status(200).json(data);
        }

        // Perbarui Kunci Secara Instan
        if (action === 'update_key') {
            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'update_key', newKey }),
                headers: { 'Content-Type': 'text/plain' }
            });
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
