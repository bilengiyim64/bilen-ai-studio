# Bilen AI Moda Stüdyosu

Bu sürümde model + ürün referansları ile sanal moda çekimi ve 5 saniyelik dikey video akışı bulunur.

## Yeni özellikler

- Model fotoğrafı yükleme
- 10 farklı başlangıç pozu
- Üst ürün yükleme
- Alt ürün yükleme
- Aksesuar yükleme
- 8 farklı çekim ortamı
- Ek notlar alanı
- 2:3 e-ticaret görseli
- Oluşturulan görselden 9:16 video
- Veo 3.1 ile 6 saniye üretip FFmpeg ile tam 5.00 saniyeye otomatik kırpma

## Kurulum

1. Node.js 20+ kurulu olmalı.
2. FFmpeg sistemde kurulu ve `ffmpeg` komutu PATH içinde olmalı.
3. `server/.env.example` dosyasını `server/.env` olarak kopyalayın.
4. `GEMINI_API_KEY=` satırına Google Gemini API anahtarınızı girin.
5. Proje ana klasöründe:

```bash
npm install
npm run install:all
npm run dev
```

Alternatif olarak client ve server klasörlerinde ayrı ayrı `npm install` ve `npm run dev` kullanabilirsiniz.

## Kullanım

Model fotoğrafını yükleyin, en az bir ürün (üst/alt/aksesuar) ekleyin, poz ve çekim ortamını seçin. İsterseniz ek not yazın ve **Görseli Oluştur** butonuna basın. Sonuçtan **5 Sn Dikey Video Oluştur** seçeneğini kullanabilirsiniz.

## Güvenlik

Gemini API anahtarını frontend içine koymayın. Anahtar sadece `server/.env` içinde tutulur.

## Web'e canlı yayın (Railway ile tek servis)

Bu klasördeki `Dockerfile`, React arayüzünü derleyip Node sunucusuyla aynı adresten (tek domain) servis edecek şekilde hazırlanmıştır. FFmpeg de imajın içine kurulur.

1. Bu klasörü bir GitHub deposuna yükleyin (`.env` dosyasını YÜKLEMEYİN).
2. Railway'de **New Project → Deploy from GitHub Repo** ile bu depoyu seçin. Railway `Dockerfile`'ı otomatik algılar.
3. Servisin **Variables** kısmına `GEMINI_API_KEY` değerini ekleyin.
4. **Settings → Networking → Generate Domain** ile geçici bir web adresi alın; uygulama artık o adresten çalışır.
5. İsterseniz aynı yerden kendi alan adınızı (ör. `ai.bilengiyim.com`) bağlayabilirsiniz.


## Otomatik 5 sn e-ticaret videosu

Ürün ve model görselleri yüklendikten sonra **5 SN E-TİCARET VİDEOSU DA OLUŞTUR** seçeneğini işaretleyin. Ana üretim butonu bu durumda önce 2:3 e-ticaret görselini üretir, ardından aynı sonuç görselini Veo 3.1'e başlangıç karesi olarak gönderir. Veo 9:16 formatında 6 saniye üretir; sunucu FFmpeg ile çıktıyı otomatik olarak tam 5.000 saniyelik MP4'e dönüştürür. Görsel ve video sonuç panelinde birlikte sunulur.

Video seçeneği işaretlenmezse yalnızca görsel üretilir; daha sonra sonuç panelindeki video butonuyla video ayrıca üretilebilir.
