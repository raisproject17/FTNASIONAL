export default async function handler(req, res) {
    // Pastikan metode request adalah POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Ambil kunci API rahasia yang disimpan aman di setelan Vercel Environment Variables
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: "API Key Gemini belum diatur di Vercel Settings." });
        }

        const { query } = req.body;
        
        // Memanggil API Gemini versi stabil dengan Search Engine Google
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ 
                parts: [{ text: `Carikan jawaban yang paling tepat, jelas, dan komprehensif untuk pertanyaan kuis ini. Pertanyaan: "${query}"` }] 
            }],
            systemInstruction: { 
                parts: [{ text: "Anda adalah asisten cerdas pemecah soal kuis. Berikan jawaban yang terstruktur dan langsung pada intinya. Wajib gunakan google search jika Anda butuh referensi tambahan agar jawaban akurat." }] 
            },
            tools: [{ google_search: {} }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Gagal tersambung dengan server AI Google.');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Kirim jawaban kembali ke aplikasi Frontend kita
        res.status(200).json({ answer: text || "Maaf, jawaban tidak dapat ditemukan di internet." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
