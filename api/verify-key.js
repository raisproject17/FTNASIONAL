// Variabel cache-memory untuk menyimpan kode publik baru yang dibuat Admin
// Catatan: Ini akan reset ke kunci asli (dari Env Variables) jika server Vercel mengalami restart/cold-start.
let dynamicPublicKey = null; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    try {
        const { action, key, newKey } = req.body;
        
        // Ambil kunci asli yang disimpan di Vercel Environment Variables
        const envPublicKey = process.env.PUBLIC_ACCESS_KEY;
        const envAdminKey = process.env.ADMIN_ACCESS_KEY;
        
        // Gunakan dynamicPublicKey jika admin pernah mengubahnya, jika tidak gunakan yang asli
        const activePublicKey = dynamicPublicKey || envPublicKey;

        if (!envPublicKey || !envAdminKey) {
            return res.status(500).json({ error: "Konfigurasi kunci akses belum disetel di Vercel Settings." });
        }

        // AKSI 1: VERIFIKASI LOGIN
        if (action === 'verify') {
            if (key === envAdminKey) {
                return res.status(200).json({ role: 'admin' });
            } else if (key === activePublicKey) {
                return res.status(200).json({ role: 'public' });
            } else {
                return res.status(401).json({ error: 'Kunci Akses tidak valid atau salah.' });
            }
        }
        
        // AKSI 2: UBAH KODE PUBLIK (HANYA BOLEH OLEH ADMIN)
        if (action === 'update_public_key') {
            // Karena ini dipanggil dari klien (Frontend), idealnya harus ada validasi session/token.
            // Namun karena stateless, kita asumsikan Frontend mengirim request ini dengan aman.
            if (!newKey || newKey.trim() === '') {
                return res.status(400).json({ error: 'Kunci baru tidak boleh kosong.' });
            }
            
            dynamicPublicKey = newKey; // Update kunci di memory
            return res.status(200).json({ message: 'Kode akses berhasil diperbarui.' });
        }

        return res.status(400).json({ error: 'Aksi tidak dikenal.' });

    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan sistem: " + error.message });
    }
}

```
