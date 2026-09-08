import React, { useMemo, useState } from 'react';

// Aynı domain üzerinden çalışacağı için boş bırakıyoruz (relative path).
// Yerelde ayrı ayrı çalıştırmak isterseniz VITE_API_BASE ortam değişkenini kullanabilirsiniz.
const API = import.meta.env.VITE_API_BASE || '';

const POSES = [
  ['front', 'TAM BOY KARŞIDAN', 'Full-body front-facing fashion pose, standing naturally and looking toward the camera.'],
  ['profile', 'PROFİL / YAN DURUŞ', 'Elegant full-body side/profile pose with the garment clearly visible.'],
  ['back', 'ARKA DETAY', 'Back-facing pose that clearly shows the back details of the outfit.'],
  ['walk', 'YÜRÜYÜŞ HAREKETİ', 'Natural mid-step walking pose with subtle fabric movement.'],
  ['wall', 'DUVARA YASLANMA', 'Relaxed fashion pose leaning lightly against a wall, while keeping the outfit readable.'],
  ['waist', 'ELDE BEL POZU', 'Elegant standing pose with one hand naturally near the waist.'],
  ['far', 'UZAĞA BAKIŞ', 'Standing fashion pose looking slightly away from the camera.'],
  ['sit', 'OTURMA POZU', 'Elegant seated fashion pose with the complete outfit visible as much as possible.'],
  ['hair', 'SAÇ DÜZELTME', 'Natural fashion pose gently adjusting hair, without covering the garment.'],
  ['detail', 'YAKIN ÇEKİM DETAY', 'Closer fashion framing focused on garment details, fabric and workmanship.'],
];

const ENVIRONMENTS = [
  ['white', 'Minimal Beyaz Stüdyo', 'minimal seamless white fashion studio, premium soft studio lighting'],
  ['soft', 'Sıcak & Minimal Soft Stüdyo (Referans)', 'warm minimal soft studio with subtle beige/cream tones and diffused light'],
  ['street', 'Sokak Stili (Şehir)', 'premium modern city street fashion setting, subtle urban background'],
  ['cafe', 'Modern Kafe Önü', 'stylish modern cafe exterior, clean premium lifestyle fashion setting'],
  ['luxury', 'Lüks İç Mekan', 'luxury contemporary interior, elegant architectural details, premium fashion campaign'],
  ['nature', 'Doğa & Park', 'natural elegant park setting with soft daylight and tasteful greenery'],
  ['runway', 'Podyum / Runway', 'minimal premium fashion runway with professional editorial lighting'],
  ['loft', 'Vintage Loft', 'tasteful vintage loft studio with textured walls and soft directional daylight'],
];

const fileTo64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function UploadCard({ title, subtitle, value, onChange, compact = false, icon = '⇧' }) {
  return (
    <label className={`uploadCard ${value ? 'hasImage' : ''} ${compact ? 'compact' : ''}`}>
      {value ? <img src={value} alt="" /> : <>
        <div className="uploadIcon">{icon}</div>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </>}
      <input type="file" accept="image/*" onChange={onChange} />
      {value && <div className="replaceBadge">Değiştir</div>}
    </label>
  );
}

export default function App() {
  const [modelImage, setModelImage] = useState('');
  const [topFrontImage, setTopFrontImage] = useState('');
  const [topBackImage, setTopBackImage] = useState('');
  const [topDetailImage, setTopDetailImage] = useState('');
  const [bottomFrontImage, setBottomFrontImage] = useState('');
  const [bottomBackImage, setBottomBackImage] = useState('');
  const [bottomDetailImage, setBottomDetailImage] = useState('');
  const [accessoryImage, setAccessoryImage] = useState('');
  const [pose, setPose] = useState('front');
  const [environment, setEnvironment] = useState('white');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [video, setVideo] = useState('');
  const [busy, setBusy] = useState(false);
  const [vbusy, setVbusy] = useState(false);
  const [wantVideo, setWantVideo] = useState(false);
  const [error, setError] = useState('');

  const selectedPose = useMemo(() => POSES.find(x => x[0] === pose), [pose]);
  const selectedEnvironment = useMemo(() => ENVIRONMENTS.find(x => x[0] === environment), [environment]);

  async function pick(event, setter) {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(await fileTo64(file));
  }

  async function makeImage() {
    try {
      setBusy(true);
      setError('');
      setVideo('');
      const response = await fetch(`${API}/api/studio-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImage,
          topFrontImage,
          topBackImage,
          topDetailImage,
          bottomFrontImage,
          bottomBackImage,
          bottomDetailImage,
          accessoryImage,
          pose: selectedPose?.[2],
          poseLabel: selectedPose?.[1],
          environment: selectedEnvironment?.[2],
          environmentLabel: selectedEnvironment?.[1],
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Görsel oluşturulamadı.');
      setResult(data.image);
      if (wantVideo) {
        await makeVideo(data.image);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function makeVideo(sourceOverride = '') {
    try {
      setVbusy(true);
      setError('');
      if (video) URL.revokeObjectURL(video);
      const response = await fetch(`${API}/api/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceOverride || result || modelImage,
          prompt: `Use a subtle natural motion suitable for the selected starting pose: ${selectedPose?.[2]}. Preserve the outfit exactly. Keep the setting consistent with: ${selectedEnvironment?.[2]}.`,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Video oluşturulamadı.');
      }
      setVideo(URL.createObjectURL(await response.blob()));
    } catch (e) {
      setError(e.message);
    } finally {
      setVbusy(false);
    }
  }

  const canGenerate = Boolean(modelImage && (
    topFrontImage || topBackImage || topDetailImage ||
    bottomFrontImage || bottomBackImage || bottomDetailImage ||
    accessoryImage
  ));

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brandText">BİLEN<span className="goldDot">•</span></div>
        <div>
          <h1>AI Moda Stüdyosu</h1>
          <p>Model, ürün, poz ve çekim ortamını seçerek moda görseli oluşturun.</p>
        </div>
      </header>

      <main className="studioLayout">
        <div className="controlsColumn">
          <section className="studioCard">
            <div className="sectionTitle"><span className="sectionIcon">♙</span><h2>1. MODEL FOTOĞRAFI</h2></div>
            <UploadCard
              title="Model Fotoğrafı"
              subtitle="Yüzü net, tam boy bir poz yükleyin"
              value={modelImage}
              onChange={e => pick(e, setModelImage)}
            />

            <div className="divider" />

            <div className="sectionTitle"><span className="sectionIcon">✣</span><h2>2. BAŞLANGIÇ POZU</h2></div>
            <div className="poseGrid">
              {POSES.map(([id, label]) => (
                <button key={id} className={`optionButton ${pose === id ? 'active' : ''}`} onClick={() => setPose(id)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="divider" />

            <div className="sectionTitle"><span className="sectionIcon">♧</span><h2>3. ÜRÜN SEÇİMİ</h2></div>

            <div className="productGroup">
              <div className="productGroupHeader">
                <div><strong>ÜST ÜRÜN</strong><span>Gömlek / T-Shirt / Tunik / Ceket</span></div>
                <small>Ön görsel önerilir · Arka ve detay isteğe bağlı</small>
              </div>
              <div className="productViewsGrid">
                <UploadCard compact title="Ön Görünüm" subtitle="Ürünün önden fotoğrafı" value={topFrontImage} onChange={e => pick(e, setTopFrontImage)} />
                <UploadCard compact title="Arka Görünüm" subtitle="Varsa arkadan fotoğrafı" value={topBackImage} onChange={e => pick(e, setTopBackImage)} />
                <UploadCard compact title="Detay" subtitle="Kumaş / yaka / düğme vb." value={topDetailImage} onChange={e => pick(e, setTopDetailImage)} />
              </div>
            </div>

            <div className="productGroup">
              <div className="productGroupHeader">
                <div><strong>ALT ÜRÜN</strong><span>Pantolon / Etek</span></div>
                <small>Ön görsel önerilir · Arka ve detay isteğe bağlı</small>
              </div>
              <div className="productViewsGrid">
                <UploadCard compact title="Ön Görünüm" subtitle="Ürünün önden fotoğrafı" value={bottomFrontImage} onChange={e => pick(e, setBottomFrontImage)} />
                <UploadCard compact title="Arka Görünüm" subtitle="Varsa arkadan fotoğrafı" value={bottomBackImage} onChange={e => pick(e, setBottomBackImage)} />
                <UploadCard compact title="Detay" subtitle="Kumaş / cep / paça vb." value={bottomDetailImage} onChange={e => pick(e, setBottomDetailImage)} />
              </div>
            </div>

            <div className="productGroup accessoryGroup">
              <div className="productGroupHeader">
                <div><strong>AKSESUAR</strong><span>Çanta / Takı / Şal</span></div>
                <small>İsteğe bağlı</small>
              </div>
              <div className="accessoryUpload">
                <UploadCard compact title="Aksesuar Görseli" subtitle="Kullanılacak aksesuar" value={accessoryImage} onChange={e => pick(e, setAccessoryImage)} />
              </div>
            </div>
          </section>

          <section className="studioCard">
            <div className="sectionTitle"><span className="sectionIcon">⊞</span><h2>4. ÇEKİM ORTAMI</h2></div>
            <div className="environmentGrid">
              {ENVIRONMENTS.map(([id, label]) => (
                <button key={id} className={`environmentButton ${environment === id ? 'active' : ''}`} onClick={() => setEnvironment(id)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="divider" />
            <label className="notesLabel">EK NOTLAR</label>
            <textarea
              className="notes"
              rows="5"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Işık, kumaş detayı vb..."
            />
          </section>

          <section className={`videoChoice ${wantVideo ? 'active' : ''}`} onClick={() => setWantVideo(v => !v)} role="checkbox" aria-checked={wantVideo} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWantVideo(v => !v); } }}>
            <div className="videoChoiceCheck">{wantVideo ? '✓' : ''}</div>
            <div className="videoChoiceText">
              <strong>5 SN E-TİCARET VİDEOSU DA OLUŞTUR</strong>
              <span>Seçiliyse görsel hazırlandıktan sonra aynı ürün ve model korunarak 9:16 dikey, tam 5 saniyelik MP4 video otomatik hazırlanır.</span>
            </div>
            <div className="videoChoiceBadge">9:16 · 5 SN</div>
          </section>

          <button className="generateButton" disabled={!canGenerate || busy || vbusy} onClick={makeImage}>
            {busy ? (wantVideo ? 'GÖRSEL HAZIRLANIYOR…' : 'GÖRSEL OLUŞTURULUYOR…') : vbusy ? '5 SN VİDEO HAZIRLANIYOR…' : wantVideo ? 'GÖRSEL + 5 SN VİDEO OLUŞTUR' : 'GÖRSELİ OLUŞTUR'}
          </button>
          {!canGenerate && <p className="hint">Model fotoğrafı ile en az bir ürün görseli yükleyin.</p>}
          {error && <div className="errorBox">{error}</div>}
        </div>

        <aside className="resultColumn">
          <section className="resultCard stickyResult">
            <div className="resultHeading">
              <div><small>SONUÇ</small><h2>Stüdyo Çıktısı</h2></div>
              <span className="ratioBadge">2:3</span>
            </div>

            {result ? (
              <>
                <img className="resultImage" src={result} alt="Oluşturulan moda görseli" />
                <a className="downloadButton" href={result} download="bilen-ai-studio.jpg">Görseli İndir</a>
                <button className="videoButton" disabled={vbusy} onClick={() => makeVideo()}>
                  {vbusy ? '6 SN ÜRETİLİYOR → 5 SN KESİLİYOR…' : (video ? '5 SN VİDEOYU YENİDEN OLUŞTUR' : '5 SN DİKEY VİDEO OLUŞTUR')}
                </button>
                {video && <>
                  <video className="videoPlayer" src={video} controls playsInline />
                  <a className="downloadButton" href={video} download="bilen-ai-5sn.mp4">5 Sn MP4 İndir</a>
                </>}
              </>
            ) : (
              <div className="resultPlaceholder">
                <div className="placeholderIcon">✦</div>
                <strong>Görseliniz burada görünecek</strong>
                <span>Sol taraftaki seçimleri tamamlayıp görseli oluşturun.</span>
              </div>
            )}

            <div className="selectionSummary">
              <div><span>Poz</span><strong>{selectedPose?.[1]}</strong></div>
              <div><span>Ortam</span><strong>{selectedEnvironment?.[1]}</strong></div>
              <div><span>Video</span><strong>{wantVideo ? 'Otomatik · 9:16 · 5 saniye' : 'İsteğe bağlı · 9:16 · 5 saniye'}</strong></div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
