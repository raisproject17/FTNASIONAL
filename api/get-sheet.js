```javascript
export default async function handler(req, res) {
  try {
    // Mengambil ID Rahasia dari Environment Variable Vercel
    const sheetId = process.env.SECRET_SHEET_ID;
    
    if (!sheetId) {
      return res.status(500).send("Konfigurasi SECRET_SHEET_ID belum diatur di Vercel.");
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    // Fetch data secara server-side
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets");
    
    const csvText = await response.text();
    
    // Mengembalikan data sebagai teks CSV ke Frontend
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csvText);

  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
}

**3. Atur Environment Variable di Dashboard Vercel**
* Buka Dashboard Vercel Anda, pilih project PWA ini.
* Buka menu **Settings** > **Environment Variables**.
* Tambahkan variable baru:
  * **Key:** `SECRET_SHEET_ID`
  * **Value:** `10Xr6T9yTjfCTvMLurGzxe82gZ1QHbgEimYhEIBnlQp0` (Atau ID spreadsheet rahasia Anda yang baru).
* Simpan (Save) dan lakukan **Redeploy** (Deploy ulang) project tersebut.

Dengan cara ini, frontend PWA hanya akan berkomunikasi dengan `/api/get-sheet`, dan ID Google Sheet Anda 100% aman disembunyikan di dalam server Vercel.

```
