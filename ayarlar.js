// ============================================================
// AYARLAR — Supabase proje bilgilerinle doldur
// Supabase Dashboard > Project Settings > Data API bölümünden
// "Project URL" değerini kopyala.
// ============================================================

const SUPABASE_URL = "https://cjctbnrgvsopnvdpqmjv.supabase.co";

// Project Settings > Data API > Project API keys > "anon public" değerini buraya yapıştır
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY3RibnJndnNvcG52ZHBxbWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODEyMDgsImV4cCI6MjEwMTY1NzIwOH0.lvwm5FXdRXW6jkaZZcU6JWxWfIJWbhyqeZXmYZ9cmjo"; // <-- BURAYI DA DEĞİŞTİR

const FONKSIYON_URL = (isim) => `${SUPABASE_URL}/functions/v1/${isim}`;

// Tüm sayfalarda ortak kullanılan API çağrı fonksiyonu.
// apikey + Authorization başlıkları, Supabase'in "Missing authorization header"
// hatasını önlemek için gerekli (fonksiyonlara JWT doğrulaması sorulmadan ulaşmamızı sağlar).
async function api(fonksiyon, govde) {
  const yanit = await fetch(FONKSIYON_URL(fonksiyon), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(govde),
  });
  return await yanit.json();
}

// Fotoğrafı sıkıştırıp base64'e çeviren yardımcı fonksiyon
// (büyük fotoğrafları küçültür, isteği hızlandırır ve boyut sınırını aşmayı önler)
function dosyayiBase64eCevir(dosya, maxGenislik = 1600, kalite = 0.85) {
  return new Promise((resolve, reject) => {
    const okuyucu = new FileReader();
    okuyucu.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let genislik = img.width;
        let yukseklik = img.height;
        if (genislik > maxGenislik) {
          yukseklik = Math.round((yukseklik * maxGenislik) / genislik);
          genislik = maxGenislik;
        }
        const tuval = document.createElement("canvas");
        tuval.width = genislik;
        tuval.height = yukseklik;
        const ctx = tuval.getContext("2d");
        ctx.drawImage(img, 0, 0, genislik, yukseklik);
        const dataUrl = tuval.toDataURL("image/jpeg", kalite);
        // "data:image/jpeg;base64," önekini kaldır, sadece ham base64 kalsın
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    okuyucu.onerror = reject;
    okuyucu.readAsDataURL(dosya);
  });
}

async function birdenFazlaDosyayiBase64eCevir(dosyaListesi) {
  const sonuclar = [];
  for (const dosya of dosyaListesi) {
    sonuclar.push(await dosyayiBase64eCevir(dosya));
  }
  return sonuclar;
}
