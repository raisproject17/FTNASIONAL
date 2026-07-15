export default async function handler(req, res) {
    // Pastikan metode request adalah POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    try {
        const { key } = req.body;
        
        // Ambil kunci rahasia yang disimpan di Vercel Environment Variables
        const publicKey = process.env.PUBLIC_ACCESS_KEY;
        const adminKey = process.env.ADMIN_ACCESS_KEY;
        
        if (!publicKey || !adminKey) {
            return res.status(500).json({ error: "Konfigurasi kunci akses (PUBLIC_ACCESS_KEY atau ADMIN_ACCESS_KEY) belum disetel di Vercel Settings." });
        }

        // Cek kecocokan Kunci
        if (key === adminKey) {
            // Jika Kunci Admin cocok
            return res.status(200).json({ role: 'admin' });
            
        } else if (key === publicKey) {
            // Jika Kunci Publik cocok
            return res.status(200).json({ role: 'public' });
            
        } else {
            // Jika Kunci salah
            return res.status(401).json({ error: 'Kunci Akses tidak valid atau salah.' });
        }

    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan sistem: " + error.message });
    }
}
