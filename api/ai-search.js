export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "API Key belum diatur di Vercel." });
        }

        const { query } = req.body;

        // Jika kunci menggunakan format baru berawalan 'AQ.', 
        // kita tangani dengan pengamanan header token agar tidak mental (401/403)
        const isAuthKey = apiKey.startsWith('AQ.');

        // Menggunakan model stabil generatif
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

        const headers = {
            'Content-Type': 'application/json'
        };

        let requestUrl = url;
        if (isAuthKey) {
            // Untuk token tipe AQ, kirim sebagai Bearer / Auth header jika didukung, 
            // atau gunakan x-goog-api-key khusus.
            headers['x-goog-api-key'] = apiKey;
        } else {
            requestUrl = `${url}?key=${apiKey}`;
        }

        const payload = {
            contents: [{ 
                parts: [{ text: `Berikan jawaban ringkas dan to the point untuk pertanyaan ini: "${query}"` }] 
            }],
            systemInstruction: { 
                parts: [{ text: "Anda adalah search engine akademik. Jawab langsung pada intinya tanpa basa-basi." }] 
            }
        };

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Jika token AQ masih ditolak oleh sistem Google Generative Language lama,
            // kita berikan respons fallback yang elegan agar aplikasi tidak crash.
            if (isAuthKey && response.status === 401) {
                return.status(200).json({ 
                    answer: "⚠️ Catatan Sistem: Kunci API Anda menggunakan format otentikasi baru (AQ.). Silakan tambahkan pertanyaan ini ke dalam Google Spreadsheet (Sheet 'quiz') agar langsung terbaca oleh database lokal." 
                });
            }
            throw new Error(data.error?.message || 'Gagal memproses permintaan AI.');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.status(200).json({ answer: text || "Jawaban tidak ditemukan." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
