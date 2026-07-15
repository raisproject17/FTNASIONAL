export default async function handler(req, res) {
  try {
    // Mengambil ID Rahasia dari Environment Variable Vercel
    const sheetId = process.env.SECRET_SHEET_ID;
    
    if (!sheetId) {
      return res.status(500).send("Konfigurasi SECRET_SHEET_ID belum diatur di Vercel.");
    }

    // Menggunakan API gviz untuk SPESIFIK menargetkan sheet bernama "quiz"
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=quiz`;
    
    // Fetch data secara server-side
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets (Sheet: quiz)");
    
    const csvText = await response.text();
    
    // Mengembalikan data sebagai teks CSV ke Frontend
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csvText);

  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
}
