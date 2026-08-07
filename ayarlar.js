// ============================================================
// AYARLAR — Supabase proje bilgilerinle doldur
// Supabase Dashboard > Project Settings > Data API bölümünden
// "Project URL" değerini kopyala.
// ============================================================

const SUPABASE_URL = "https://cjctbnrgvsopnvdpqmjv.supabase.co/rest/v1/"; // <-- BURAYI DEĞİŞTİR

const FONKSIYON_URL = (isim) => `${SUPABASE_URL}/functions/v1/${isim}`;

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
