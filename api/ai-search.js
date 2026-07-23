export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Ambil kunci API DeepSeek dari Environment Variable Vercel
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "DEEPSEEK_API_KEY belum diatur di Vercel Settings." });
        }

        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query tidak boleh kosong.' });
        }

        // Endpoint resmi DeepSeek Chat API
        const url = 'https://api.deepseek.com/chat/completions';

        const payload = {
            model: "deepseek-chat", // Model stabil DeepSeek
            messages: [
                {
                    role: "system",
                    content: "Anda adalah search engine akademik dan asisten pemecah soal kuis. Berikan jawaban yang ringkas, jelas, terstruktur, dan langsung pada intinya."
                },
                {
                    role: "user",
                    content: `Carikan jawaban yang paling akurat untuk pertanyaan ujian/kuis ini: "${query}"`
                }
            ],
            stream: false
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Gagal memproses permintaan dengan DeepSeek API.');
        }

        const answerText = data.choices?.[0]?.message?.content;
        res.status(200).json({ answer: answerText || "Jawaban tidak ditemukan." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
