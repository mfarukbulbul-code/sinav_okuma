// ============================================================
// AYARLAR — Supabase proje bilgilerinle doldur
// Supabase Dashboard > Project Settings > Data API bölümünden
// "Project URL" değerini kopyala.
// ============================================================

const SUPABASE_URL = "https://cjctbnrgvsopnvdpqmjv.supabase.co"; // <-- BURAYI DEĞİŞTİR

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

// ============================================================
// FOTOĞRAF TOPLAYICI BİLEŞENİ
// "Fotoğraf Çek" her tıklamada bir fotoğrafı listeye EKLER (üzerine
// yazmaz) — böylece arkalı önlü / çok sayfalı kağıtları art arda
// çekip biriktirebilirsin. "Galeriden Ekle" ise tek seferde birden
// fazla dosya seçmene izin verir.
// Kullanımı: const toplayici = fotografToplayiciOlustur(document.getElementById("alan"));
//            ... gönderirken: toplayici.dosyalar (File[] dizisi)
// ============================================================
function fotografToplayiciOlustur(kapsayiciElementi) {
  let dosyalar = [];

  const satir = document.createElement("div");
  satir.className = "foto-toplayici";

  const kameraInput = document.createElement("input");
  kameraInput.type = "file";
  kameraInput.accept = "image/*";
  kameraInput.capture = "environment";
  kameraInput.style.display = "none";

  const galeriInput = document.createElement("input");
  galeriInput.type = "file";
  galeriInput.accept = "image/*";
  galeriInput.multiple = true;
  galeriInput.style.display = "none";

  const kameraBtn = document.createElement("button");
  kameraBtn.type = "button";
  kameraBtn.textContent = "📷 Fotoğraf Ekle";
  kameraBtn.onclick = () => kameraInput.click();

  const galeriBtn = document.createElement("button");
  galeriBtn.type = "button";
  galeriBtn.className = "ikincil";
  galeriBtn.textContent = "🖼️ Galeriden Ekle";
  galeriBtn.onclick = () => galeriInput.click();

  const thumbAlan = document.createElement("div");
  thumbAlan.className = "thumb-alan";

  function listeyiGuncelle() {
    thumbAlan.innerHTML = dosyalar
      .map((d, i) => `<span class="thumb-item">📄 ${i + 1} <a href="#" data-i="${i}">✕</a></span>`)
      .join(" ");
    thumbAlan.querySelectorAll("a").forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        dosyalar.splice(Number(a.dataset.i), 1);
        listeyiGuncelle();
      };
    });
  }

  kameraInput.onchange = () => {
    if (kameraInput.files[0]) dosyalar.push(kameraInput.files[0]);
    kameraInput.value = "";
    listeyiGuncelle();
  };
  galeriInput.onchange = () => {
    dosyalar.push(...Array.from(galeriInput.files));
    galeriInput.value = "";
    listeyiGuncelle();
  };

  satir.append(kameraBtn, galeriBtn, kameraInput, galeriInput, thumbAlan);
  kapsayiciElementi.appendChild(satir);

  return {
    get dosyalar() { return dosyalar; },
    temizle() { dosyalar = []; listeyiGuncelle(); },
  };
}
