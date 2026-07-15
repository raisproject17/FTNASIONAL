export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: "API Key Gemini belum diatur di Vercel Settings." });
        }

        const { query } = req.body;
        
        // Menggunakan endpoint v1 yang JAUH LEBIH STABIL daripada v1beta
        // Dan menggunakan model gemini-1.5-flash-latest yang memastikan ketersediaan
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        // Payload disederhanakan tanpa 'tools: googleSearch' untuk menghindari error "Not Supported"
        const payload = {
            contents: [{ 
                parts: [{ text: `Pertanyaan: "${query}"\n\nTolong berikan jawaban yang paling tepat, ringkas, dan komprehensif untuk pertanyaan kuis ini. Bertindaklah seperti Search Engine yang akurat.` }] 
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Gemini API Error Detail:", data);
            // Menangkap error spesifik untuk ditampilkan
            throw new Error(data.error?.message || 'Gagal tersambung dengan server AI Google.');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        res.status(200).json({ answer: text || "Maaf, jawaban tidak dapat diproses oleh AI." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
