import React, { useEffect, useMemo, useState } from 'react';

// Aynı domain üzerinden çalışacağı için boş bırakıyoruz (relative path).
// Yerelde ayrı ayrı çalıştırmak isterseniz VITE_API_BASE ortam değişkenini kullanabilirsiniz.
const API = import.meta.env.VITE_API_BASE || '';
const GEMINI_ENDPOINT = `${API}/api/gemini`;

// Ticimax'a görsel / SEO+beden tablosu gönderimi n8n üzerinden yapılır.
// Ayarlar sekmesinden değiştirilebilir; boşsa bu varsayılanlar kullanılır.
const DEFAULT_TICIMAX_IMAGE_WEBHOOK = 'https://bilengiyim.app.n8n.cloud/webhook/bilen-ai-ticimax-image';
const DEFAULT_TICIMAX_SEO_WEBHOOK = 'https://bilengiyim.app.n8n.cloud/webhook/bilen-ai-ticimax-seo';

const BRAND_NAME = 'Bilen Giyim';

const TABS = [
  { id: 'studio', label: 'STÜDYO' },
  { id: 'catalog', label: 'KATALOG' },
  { id: 'seo', label: 'ÜRÜN AÇIKLAMASI' },
  { id: 'sizeguide', label: 'BEDEN TABLOSU' },
];

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

// --- Beden Tablosu referans verileri ---
const SG_PRODUCT_TYPES = ['Gömlek', 'Bluz', 'Tunik', 'Ceket', 'Yelek', 'Ferace', 'Kap / Pardösü', 'Triko', 'Sweatshirt', 'Elbise', 'Pantolon', 'Etek', 'Takım'];
const SG_TAKIM_TOP_TYPES = ['Tunik', 'Gömlek', 'Bluz', 'Ceket', 'Yelek', 'Triko', 'Sweatshirt', 'Diğer'];
const SG_TAKIM_BOTTOM_TYPES = ['Pantolon', 'Etek'];
const SG_SIZE_SYSTEMS = {
  'Sayısal Beden': ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'],
  'Harf Beden': ['S', 'M', 'L', 'XL', 'XXL'],
  'Numara Beden': ['1', '2', '3', '4', '5'],
  'Standart': ['Standart Beden'],
};
const SG_MEASUREMENTS_MAP = {
  'Gömlek': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Bluz': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Tunik': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Ceket': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Yelek': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Ferace': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Kap / Pardösü': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Manşet Genişliği', 'Etek Ucu Genişliği'],
  'Triko': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Etek Ucu Genişliği'],
  'Sweatshirt': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Etek Ucu Genişliği'],
  'Elbise': ['Göğüs', 'Bel', 'Basen', 'Omuz', 'Ürün Boyu', 'Kol Boyu', 'Üst Kol Genişliği', 'Etek Ucu Genişliği'],
  'Pantolon': ['Bel', 'Basen', 'Ön Ağ', 'Arka Ağ', 'İç Bacak Boyu', 'Dış Boy / Toplam Boy', 'Üst Bacak / Uyluk Genişliği', 'Diz Genişliği', 'Paça Genişliği'],
  'Etek': ['Bel', 'Basen', 'Ürün Boyu', 'Etek Ucu Genişliği'],
  'Diğer': ['Ürün Boyu', 'Göğüs', 'Bel'],
};

const fileTo64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function UploadCard({ title, subtitle, value, onChange, compact = false, icon = '⇧' }) {
  return (
    <label className={`uploadCard ${value ? 'hasImage' : ''} ${compact ? 'compact' : ''}`}>
      {value ? <img src={value} alt="" /> : (
        <>
          <div className="uploadIcon">{icon}</div>
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </>
      )}
      <input type="file" accept="image/*" onChange={onChange} />
      {value && <div className="replaceBadge">Değiştir</div>}
    </label>
  );
}

// --- Gemini yardımcıları (sunucu üzerinden, anahtar hiç istemciye gelmez) ---
async function callGeminiJson(model, payload) {
  const url = `${GEMINI_ENDPOINT}?model=${encodeURIComponent(model)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Yanıt okunamadı (${response.status}).`); }
  if (data.error) throw new Error(data.error.message || 'API hatası.');
  if (!response.ok) throw new Error(`API hatası: ${response.status}`);
  return data;
}

function extractBase64(dataUrl) {
  return (dataUrl || '').split(',')[1] || '';
}

// --- Beden Tablosu Editörü ---
function SizeTableEditor({ title, rows, setRows, selectedSizes, autoIncrementState, setAutoIncrementState, autoFillEmptyOnlyState, setAutoFillEmptyOnlyState }) {
  const handleAutoFill = () => {
    if (autoIncrementState === '') return;
    const increment = parseFloat(autoIncrementState);
    if (isNaN(increment)) return;

    setRows((prevRows) => prevRows.map((row) => {
      const isBoyRow = row.name.toLowerCase().includes('boy') || row.id.toLowerCase().includes('boy');
      let refIdx = -1;
      let refValNum = NaN;

      for (let i = 0; i < selectedSizes.length; i++) {
        const sz = selectedSizes[i];
        const val = row.values[sz];
        if (val !== undefined && String(val).trim() !== '' && !isNaN(parseFloat(val))) {
          refIdx = i;
          refValNum = parseFloat(val);
          break;
        }
      }
      if (refIdx === -1) return row;

      const newValues = { ...row.values };
      selectedSizes.forEach((targetSize, index) => {
        if (index === refIdx) return;
        const isCellEmpty = !newValues[targetSize] || String(newValues[targetSize]).trim() === '';
        if (!autoFillEmptyOnlyState || isCellEmpty) {
          if (isBoyRow) {
            newValues[targetSize] = String(refValNum);
          } else {
            const diffIndex = index - refIdx;
            const calcVal = refValNum + diffIndex * increment;
            newValues[targetSize] = String(Math.round(calcVal * 10) / 10);
          }
        }
      });
      return { ...row, values: newValues };
    }));
  };

  const addRow = () => setRows((prev) => [...prev, { id: 'custom_' + Date.now(), name: 'Yeni Ölçü', values: {}, isCustom: true }]);

  return (
    <div className="sgTable">
      <div className="sgTableHead">
        <h3>{title}</h3>
        {selectedSizes.length > 1 && (
          <div className="sgAutoFill">
            <span>Otomatik Doldurma:</span>
            <div className="sgAutoFillInput">
              <small>ARTIŞ (CM)</small>
              <input type="number" step="0.5" value={autoIncrementState} onChange={(e) => setAutoIncrementState(e.target.value)} placeholder="0" />
            </div>
            <label className="sgCheck">
              <input type="checkbox" checked={autoFillEmptyOnlyState} onChange={(e) => setAutoFillEmptyOnlyState(e.target.checked)} />
              Sadece boşları doldur
            </label>
            <button type="button" onClick={handleAutoFill}>DOLDUR</button>
          </div>
        )}
      </div>
      <div className="sgTableScroll">
        <table>
          <thead>
            <tr>
              <th className="sgFirstCol">ÖLÇÜ NOKTASI (CM)</th>
              {selectedSizes.map((size) => <th key={size}>{size}</th>)}
              <th className="sgLastCol" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="sgFirstCol">
                  {row.isCustom ? (
                    <input type="text" value={row.name} onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))} />
                  ) : (
                    <span>{row.name}</span>
                  )}
                </td>
                {selectedSizes.map((size) => (
                  <td key={size}>
                    <input
                      type="number" step="0.1"
                      value={row.values[size] || ''}
                      onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, values: { ...r.values, [size]: e.target.value } } : r)))}
                      placeholder="-"
                    />
                  </td>
                ))}
                <td className="sgLastCol">
                  {row.isCustom && <button type="button" className="sgRemoveRow" onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}>×</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sgTableFoot">
        <button type="button" onClick={addRow}>+ YENİ ÖLÇÜ SATIRI EKLE</button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');

  // --- Paylaşılan görsel/ürün referansları (Stüdyo + Katalog tarafından kullanılır) ---
  const [modelImage, setModelImage] = useState('');
  const [topFrontImage, setTopFrontImage] = useState('');
  const [topBackImage, setTopBackImage] = useState('');
  const [topDetailImage, setTopDetailImage] = useState('');
  const [bottomFrontImage, setBottomFrontImage] = useState('');
  const [bottomBackImage, setBottomBackImage] = useState('');
  const [bottomDetailImage, setBottomDetailImage] = useState('');
  const [accessoryImage, setAccessoryImage] = useState('');
  const [environment, setEnvironment] = useState('white');
  const [notes, setNotes] = useState('');

  // --- Stüdyo (tekli üretim) ---
  const [pose, setPose] = useState('front');
  const [result, setResult] = useState('');
  const [video, setVideo] = useState('');
  const [busy, setBusy] = useState(false);
  const [vbusy, setVbusy] = useState(false);
  const [wantVideo, setWantVideo] = useState(false);
  const [error, setError] = useState('');

  // --- Katalog (çoklu poz üretimi + Ticimax'a gönder) ---
  const [ticimaxProductId, setTicimaxProductId] = useState('');
  const [ticimaxImageWebhook, setTicimaxImageWebhook] = useState('');
  const [ticimaxSeoWebhook, setTicimaxSeoWebhook] = useState('');
  const [selectedPoses, setSelectedPoses] = useState(['front', 'profile', 'back']);
  const [catalogImages, setCatalogImages] = useState({});
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [selectedForTicimax, setSelectedForTicimax] = useState([]);
  const [imageSendStatus, setImageSendStatus] = useState({ isSending: false, current: 0, total: 0, results: {} });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bilen_output_settings') || '{}');
      if (saved.ticimaxImageWebhook) setTicimaxImageWebhook(saved.ticimaxImageWebhook);
      if (saved.ticimaxSeoWebhook) setTicimaxSeoWebhook(saved.ticimaxSeoWebhook);
    } catch { /* yoksay */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('bilen_output_settings', JSON.stringify({ ticimaxImageWebhook, ticimaxSeoWebhook })); } catch { /* yoksay */ }
  }, [ticimaxImageWebhook, ticimaxSeoWebhook]);

  const imageWebhookUrl = ticimaxImageWebhook.trim() || DEFAULT_TICIMAX_IMAGE_WEBHOOK;
  const seoWebhookUrl = ticimaxSeoWebhook.trim() || DEFAULT_TICIMAX_SEO_WEBHOOK;

  // --- SEO ---
  const [seoData, setSeoData] = useState(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [seoError, setSeoError] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [seoSendStatus, setSeoSendStatus] = useState({ isSending: false, result: null });

  // --- Beden Tablosu ---
  const [productType, setProductType] = useState('Gömlek');
  const [sizeSystem, setSizeSystem] = useState('Sayısal Beden');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [measurementType, setMeasurementType] = useState('DÜZ ZEMİN / TEK YÖN ÖLÇÜSÜ');
  const [tolerance, setTolerance] = useState('±2 CM');
  const [fabricInfo, setFabricInfo] = useState('');
  const [topFabricInfo, setTopFabricInfo] = useState('');
  const [bottomFabricInfo, setBottomFabricInfo] = useState('');
  const [rows, setRows] = useState([]);
  const [topType, setTopType] = useState('Ceket');
  const [bottomType, setBottomType] = useState('Pantolon');
  const [topRows, setTopRows] = useState([]);
  const [bottomRows, setBottomRows] = useState([]);
  const [sgMsg, setSgMsg] = useState('');
  const [autoIncrementSingle, setAutoIncrementSingle] = useState('');
  const [autoFillEmptyOnlySingle, setAutoFillEmptyOnlySingle] = useState(true);
  const [autoIncrementTop, setAutoIncrementTop] = useState('');
  const [autoFillEmptyOnlyTop, setAutoFillEmptyOnlyTop] = useState(true);
  const [autoIncrementBottom, setAutoIncrementBottom] = useState('');
  const [autoFillEmptyOnlyBottom, setAutoFillEmptyOnlyBottom] = useState(true);
  const [sizeChartSendStatus, setSizeChartSendStatus] = useState({ isSending: false, result: null });

  useEffect(() => { setSelectedSizes([]); }, [sizeSystem]);
  useEffect(() => {
    const createRows = (type) => (SG_MEASUREMENTS_MAP[type] || []).map((name) => ({ id: `std_${name}`, name, values: {}, isCustom: false }));
    if (productType === 'Takım') {
      setTopRows(createRows(topType));
      setBottomRows(createRows(bottomType));
    } else {
      setRows(createRows(productType));
    }
  }, [productType, topType, bottomType]);

  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) return prev.filter((s) => s !== size);
      const order = SG_SIZE_SYSTEMS[sizeSystem];
      return [...prev, size].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    });
  };

  const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const generateHTMLString = () => {
    if (selectedSizes.length === 0) return '';
    const colgroupHtml = `<colgroup><col style="width: 55%;" />${selectedSizes.map(() => `<col style="width: ${45 / selectedSizes.length}%;" />`).join('')}</colgroup>`;
    const renderTable = (title, dataRows, fabricText = '') => {
      const filteredRows = dataRows.filter((row) => selectedSizes.some((size) => {
        const val = row.values[size];
        return val !== undefined && val !== null && String(val).trim() !== '';
      }));
      if (filteredRows.length === 0) return '';
      return `
        ${title ? `<h3 style="color:#0f172a;margin:30px 0 10px;font-size:18px;">${escapeHtml(title)}</h3>` : ''}
        <table style="width:100%;table-layout:fixed;border-collapse:collapse;text-align:center;font-family:sans-serif;font-size:14px;">
          ${colgroupHtml}
          <thead><tr style="background-color:#f8fafc;">
            <th style="padding:12px;border:1px solid #e2e8f0;text-align:left;font-weight:bold;color:#64748b;overflow-wrap:anywhere;">ÖLÇÜ (CM)</th>
            ${selectedSizes.map((s) => `<th style="padding:12px;border:1px solid #e2e8f0;font-weight:bold;color:#0f172a;">${escapeHtml(s)}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${filteredRows.map((row) => `<tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:bold;color:#334155;text-align:left;overflow-wrap:anywhere;">${escapeHtml(row.name)}</td>
              ${selectedSizes.map((size) => {
                const val = row.values[size];
                return `<td style="padding:10px 12px;border:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(val !== undefined && String(val).trim() !== '' ? val : '-')}</td>`;
              }).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
        ${fabricText.trim() ? `<p style="font-size:12px;color:#64748b;margin:8px 0 0;"><strong>Kumaş Bilgisi:</strong> ${escapeHtml(fabricText)}</p>` : ''}
      `;
    };
    return `
      <div style="font-family:'Inter',sans-serif;max-width:900px;margin:0 auto;padding:20px;background:#fff;">
        <h2 style="text-align:center;color:#0f172a;font-size:24px;margin-bottom:5px;text-transform:uppercase;">${BRAND_NAME} - BEDEN TABLOSU</h2>
        <p style="text-align:center;color:#64748b;font-size:14px;margin-bottom:20px;">Ölçüm Şekli: ${escapeHtml(measurementType)} | Tolerans: ${escapeHtml(tolerance)}</p>
        ${productType === 'Takım'
          ? renderTable(`ÜST PARÇA (${topType})`, topRows, topFabricInfo) + renderTable(`ALT PARÇA (${bottomType})`, bottomRows, bottomFabricInfo)
          : renderTable('', rows, fabricInfo)}
        <p style="font-size:11px;color:#64748b;margin-top:14px;border-top:1px solid #f1f5f9;padding-top:10px;">* Ölçüler cm cinsindendir. Ürün ölçümlerinde seçilen tolerans kadar farklılık görülebilir.</p>
      </div>`;
  };

  const handleCopySizeHtml = () => {
    const html = generateHTMLString();
    const textarea = document.createElement('textarea');
    textarea.value = html;
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); setSgMsg('HTML panoya kopyalandı!'); setTimeout(() => setSgMsg(''), 3000); } catch (e) { console.error(e); }
    document.body.removeChild(textarea);
  };

  const handlePrintSize = () => {
    const html = generateHTMLString();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(`<html><head><title>Beden Tablosu</title></head><body onload="window.print(); setTimeout(() => window.parent.document.body.removeChild(window.frameElement), 1000);">${html}</body></html>`);
    iframe.contentWindow.document.close();
  };

  // --- Dosya seçimi ---
  async function pick(event, setter) {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(await fileTo64(file));
  }

  // --- Stüdyo: tekli görsel üretimi ---
  const selectedPoseObj = useMemo(() => POSES.find((x) => x[0] === pose), [pose]);
  const selectedEnvironmentObj = useMemo(() => ENVIRONMENTS.find((x) => x[0] === environment), [environment]);
  const canGenerate = Boolean(modelImage && (topFrontImage || topBackImage || topDetailImage || bottomFrontImage || bottomBackImage || bottomDetailImage || accessoryImage));

  async function requestStudioImage(poseId) {
    const p = POSES.find((x) => x[0] === poseId) || selectedPoseObj;
    const response = await fetch(`${API}/api/studio-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelImage, topFrontImage, topBackImage, topDetailImage,
        bottomFrontImage, bottomBackImage, bottomDetailImage, accessoryImage,
        pose: p?.[2], poseLabel: p?.[1],
        environment: selectedEnvironmentObj?.[2], environmentLabel: selectedEnvironmentObj?.[1],
        notes,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Görsel oluşturulamadı.');
    return data.image;
  }

  async function makeImage() {
    try {
      setBusy(true); setError(''); setVideo('');
      const image = await requestStudioImage(pose);
      setResult(image);
      if (wantVideo) await makeVideo(image);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function makeVideo(sourceOverride = '') {
    try {
      setVbusy(true); setError('');
      if (video) URL.revokeObjectURL(video);
      const response = await fetch(`${API}/api/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceOverride || result || modelImage,
          prompt: `Use a subtle natural motion suitable for the selected starting pose: ${selectedPoseObj?.[2]}. Preserve the outfit exactly. Keep the setting consistent with: ${selectedEnvironmentObj?.[2]}.`,
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

  // --- Katalog: çoklu poz üretimi ---
  const togglePoseSelection = (id) => setSelectedPoses((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  async function handleGenerateCatalog() {
    if (!canGenerate) { setError('Model ve en az bir ürün görseli yükleyin (Stüdyo sekmesinde).'); return; }
    if (selectedPoses.length === 0) { setError('Katalog için en az bir poz seçin.'); return; }
    setIsGeneratingCatalog(true);
    setSelectedForTicimax([]);
    setImageSendStatus({ isSending: false, current: 0, total: 0, results: {} });
    for (const poseId of selectedPoses) {
      setCatalogImages((prev) => ({ ...prev, [poseId]: { ...prev[poseId], loading: true, error: null } }));
      try {
        const image = await requestStudioImage(poseId);
        setCatalogImages((prev) => ({ ...prev, [poseId]: { url: image, loading: false, error: null } }));
      } catch (e) {
        setCatalogImages((prev) => ({ ...prev, [poseId]: { url: null, loading: false, error: String(e.message || e) } }));
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    setIsGeneratingCatalog(false);
  }

  const toggleTicimaxImageSelection = (poseId) => {
    const ready = catalogImages[poseId]?.url && !catalogImages[poseId]?.loading && !catalogImages[poseId]?.error;
    if (!ready || imageSendStatus.isSending) return;
    setSelectedForTicimax((prev) => (prev.includes(poseId) ? prev.filter((id) => id !== poseId) : [...prev, poseId]));
  };

  async function handleSendSelectedToTicimax() {
    const productId = Number(ticimaxProductId);
    const selectedReady = selectedPoses.filter((id) => selectedForTicimax.includes(id) && catalogImages[id]?.url);
    if (!selectedReady.length) { setError('Ticimax’a göndermek için en az bir hazır görsel seçin.'); return; }
    if (!Number.isInteger(productId) || productId <= 0) { setError('Geçerli bir Ticimax Ürün Kart ID giriniz.'); return; }

    if (!window.confirm(`Ticimax Ürün ID: ${productId} için ${selectedReady.length} görsel gönderilecek. Devam edilsin mi?`)) return;

    setError('');
    setImageSendStatus({ isSending: true, current: 0, total: selectedReady.length, results: {} });

    for (let i = 0; i < selectedReady.length; i++) {
      const poseId = selectedReady[i];
      const poseObj = POSES.find((x) => x[0] === poseId);
      setImageSendStatus((prev) => ({ ...prev, current: i + 1, results: { ...prev.results, [poseId]: { status: 'sending', message: 'Gönderiliyor...' } } }));
      try {
        const payload = {
          action: 'uploadProductImage',
          ticimaxProductId: productId,
          poseId,
          poseLabel: poseObj?.[1] || poseId,
          sortOrder: i + 1,
          fileName: `bilen-${poseId}-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          imageDataUrl: catalogImages[poseId].url,
        };
        const response = await fetch(imageWebhookUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        const raw = await response.text();
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
        const explicitFailure = body && typeof body === 'object' && (body.success === false || body.Basarili === 0);
        if (!response.ok || explicitFailure) throw new Error((body && typeof body === 'object' && (body.message || body.Mesaj)) || raw || `HTTP ${response.status}`);
        const okMessage = (body && typeof body === 'object' && (body.message || body.Mesaj)) || 'Ticimax’a gönderildi.';
        setImageSendStatus((prev) => ({ ...prev, results: { ...prev.results, [poseId]: { status: 'success', message: String(okMessage) } } }));
      } catch (err) {
        setImageSendStatus((prev) => ({ ...prev, results: { ...prev.results, [poseId]: { status: 'error', message: String(err?.message || err) } } }));
      }
      if (i < selectedReady.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
    setImageSendStatus((prev) => ({ ...prev, isSending: false }));
  }

  // --- SEO üretimi ---
  async function handleGenerateSEO() {
    if (!topFrontImage && !bottomFrontImage) { setSeoError('SEO üretimi için en az bir ticari ürün görseli (üst veya alt ön görünüm) gereklidir.'); return; }
    setIsGeneratingSEO(true); setSeoError(''); setSeoData(null);

    try {
      const isSet = Boolean(topFrontImage && bottomFrontImage);
      const isBottomOnly = !topFrontImage && Boolean(bottomFrontImage);

      let promptText = 'Sen Bilen Giyim markası için çalışan uzman bir e-ticaret SEO metin yazarısın.\n';
      if (isSet) promptText += 'Görsellerdeki KADIN GİYİM TAKIMINI (Üst ve Alt parça birlikte) analiz et ve SEO uyumlu ürün bilgileri oluştur. Ürünün başlığını ve özelliklerini TAKIM olarak kurgula.\n';
      else if (isBottomOnly) promptText += 'Görseldeki KADIN ALT GİYİM (Pantolon, Etek vb.) ürününü analiz et ve SEO uyumlu ürün bilgileri oluştur. SADECE ALT GİYİME odaklan, takımdan bahsetme.\n';
      else promptText += 'Görseldeki kadın giyim ürününü analiz et ve SEO uyumlu ürün bilgileri oluştur.\n';

      promptText += `
        KURALLAR:
        1. Marka adını HER ZAMAN "Bilen Giyim" olarak yaz.
        2. SADECE görselde kesin olarak görebildiğin özellikleri yaz. Kumaş içeriği, üretim yeri, yıkama talimatı gibi görselden anlaşılamayacak bilgileri ASLA uydurma.
        3. Etkileyici, profesyonel bir dil kullan.

        RETURN ONLY ONE VALID JSON OBJECT. Markdown veya açıklama ekleme.
        JSON şeması:
        {
          "title": "Ürün Başlığı",
          "description": "Detaylı ürün açıklaması paragrafı.",
          "features": ["Özellik 1", "Özellik 2", "Özellik 3"],
          "metaTitle": "SEO Meta Title (Max 60 karakter)",
          "metaDescription": "SEO Meta Description (Max 160 karakter)",
          "keywords": "virgülle, ayrılmış, seo, anahtar, kelimeleri"
        }
      `;

      const parts = [{ text: promptText }];
      if (isSet) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: extractBase64(topFrontImage) } });
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: extractBase64(bottomFrontImage) } });
      } else if (isBottomOnly) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: extractBase64(bottomFrontImage) } });
      } else {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: extractBase64(topFrontImage) } });
      }

      const data = await callGeminiJson('gemini-3.1-pro', {
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json' },
      });

      const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonStr) throw new Error('SEO verisi alınamadı.');

      let text = jsonStr.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const start = text.indexOf('{');
      if (start !== -1) {
        let depth = 0, inString = false, escaped = false;
        for (let i = start; i < text.length; i++) {
          const char = text[i];
          if (escaped) { escaped = false; continue; }
          if (char === '\\' && inString) { escaped = true; continue; }
          if (char === '"') { inString = !inString; continue; }
          if (!inString) {
            if (char === '{') depth++;
            if (char === '}') { depth--; if (depth === 0) { text = text.slice(start, i + 1); break; } }
          }
        }
      }

      const parsed = JSON.parse(text);
      setSeoData({
        title: String(parsed.title || ''),
        description: String(parsed.description || ''),
        features: Array.isArray(parsed.features) ? parsed.features.map(String) : (typeof parsed.features === 'string' ? [parsed.features] : []),
        metaTitle: String(parsed.metaTitle || ''),
        metaDescription: String(parsed.metaDescription || ''),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).join(', ') : String(parsed.keywords || ''),
      });
    } catch (e) {
      setSeoError('SEO Üretim Hatası: ' + (e.message || e));
    } finally {
      setIsGeneratingSEO(false);
    }
  }

  async function copyText(text, fieldId) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); setCopiedField(fieldId); setTimeout(() => setCopiedField(null), 2000); } catch { /* yoksay */ }
      document.body.removeChild(textarea);
    }
  }

  async function handleCopyAllSEO() {
    if (!seoData) return;
    const text = `SEO ÜRÜN BAŞLIĞI\n${seoData.title}\n\nÜRÜN AÇIKLAMASI\n${seoData.description}\n\nÖNE ÇIKAN ÖZELLİKLER\n${(seoData.features || []).map((f) => '• ' + f).join('\n')}\n\nMETA BAŞLIK\n${seoData.metaTitle}\n\nMETA AÇIKLAMA\n${seoData.metaDescription}\n\nANAHTAR KELİMELER\n${seoData.keywords}`;
    await copyText(text, 'all');
  }

  // --- Ticimax'a SEO / Beden Tablosu gönderimi (aynı webhook, farklı alanlar) ---
  async function sendToTicimaxSeoWebhook(payload) {
    const response = await fetch(seoWebhookUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const raw = await response.text();
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
    const explicitFailure = body && typeof body === 'object' && body.success === false;
    if (!response.ok || explicitFailure) throw new Error((body && typeof body === 'object' && body.message) || raw || `HTTP ${response.status}`);
    return (body && typeof body === 'object' && body.message) || 'Ticimax’a gönderildi.';
  }

  async function handleSendSeoToTicimax() {
    const productId = Number(ticimaxProductId);
    if (!seoData) { setSeoError('Önce SEO içeriği oluşturun.'); return; }
    if (!Number.isInteger(productId) || productId <= 0) { setSeoError('Geçerli bir Ticimax Ürün Kart ID giriniz (Katalog sekmesindeki alan).'); return; }
    if (!window.confirm(`Ticimax Ürün ID: ${productId} için SEO içeriği gönderilecek (ön yazı + SEO başlık/açıklama/anahtar kelime). Ürün adı değiştirilmeyecek. Devam edilsin mi?`)) return;

    setSeoError('');
    setSeoSendStatus({ isSending: true, result: null });
    try {
      const message = await sendToTicimaxSeoWebhook({
        urunKartId: productId,
        onYazi: seoData.description || '',
        seoBaslik: seoData.metaTitle || '',
        seoAciklama: seoData.metaDescription || '',
        seoAnahtarKelime: seoData.keywords || '',
      });
      setSeoSendStatus({ isSending: false, result: { status: 'success', message } });
    } catch (err) {
      setSeoSendStatus({ isSending: false, result: { status: 'error', message: String(err?.message || err) } });
    }
  }

  async function handleSendSizeChartToTicimax() {
    const productId = Number(ticimaxProductId);
    if (selectedSizes.length === 0) { setSgMsg('Önce en az bir beden seçin.'); setTimeout(() => setSgMsg(''), 2500); return; }
    if (!Number.isInteger(productId) || productId <= 0) { setSgMsg('Geçerli bir Ticimax Ürün Kart ID giriniz (Katalog sekmesindeki alan).'); setTimeout(() => setSgMsg(''), 3000); return; }
    const html = generateHTMLString();
    if (!html.trim()) { setSgMsg('Gönderilecek beden tablosu boş.'); setTimeout(() => setSgMsg(''), 2500); return; }
    if (!window.confirm(`Ticimax Ürün ID: ${productId} için beden tablosu, ürün açıklamasına (mevcut açıklama korunarak) eklenecek. Devam edilsin mi?`)) return;

    setSizeChartSendStatus({ isSending: true, result: null });
    try {
      const message = await sendToTicimaxSeoWebhook({ urunKartId: productId, bedenTablosuHtml: html });
      setSizeChartSendStatus({ isSending: false, result: { status: 'success', message } });
    } catch (err) {
      setSizeChartSendStatus({ isSending: false, result: { status: 'error', message: String(err?.message || err) } });
    }
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brandText">BİLEN<span className="goldDot">•</span></div>
        <div>
          <h1>AI Moda Stüdyosu</h1>
          <p>Model, ürün, poz ve çekim ortamını seçerek moda görseli, SEO metni ve beden tablosu oluşturun.</p>
        </div>
        <nav className="tabNav">
          {TABS.map((t) => (
            <button key={t.id} className={`tabButton ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </nav>
      </header>

      <main className="studioLayout">
        {activeTab === 'studio' && (
          <>
            <div className="controlsColumn">
              <section className="studioCard">
                <div className="sectionTitle"><span className="sectionIcon">♙</span><h2>1. MODEL FOTOĞRAFI</h2></div>
                <UploadCard title="Model Fotoğrafı" subtitle="Yüzü net, tam boy bir poz yükleyin" value={modelImage} onChange={(e) => pick(e, setModelImage)} />

                <div className="divider" />
                <div className="sectionTitle"><span className="sectionIcon">✣</span><h2>2. BAŞLANGIÇ POZU</h2></div>
                <div className="poseGrid">
                  {POSES.map(([id, label]) => (
                    <button key={id} className={`optionButton ${pose === id ? 'active' : ''}`} onClick={() => setPose(id)}>{label}</button>
                  ))}
                </div>

                <div className="divider" />
                <div className="sectionTitle"><span className="sectionIcon">♧</span><h2>3. ÜRÜN SEÇİMİ</h2></div>

                <div className="productGroup">
                  <div className="productGroupHeader"><div><strong>ÜST ÜRÜN</strong><span>Gömlek / T-Shirt / Tunik / Ceket</span></div><small>Ön görsel önerilir · Arka ve detay isteğe bağlı</small></div>
                  <div className="productViewsGrid">
                    <UploadCard compact title="Ön Görünüm" subtitle="Ürünün önden fotoğrafı" value={topFrontImage} onChange={(e) => pick(e, setTopFrontImage)} />
                    <UploadCard compact title="Arka Görünüm" subtitle="Varsa arkadan fotoğrafı" value={topBackImage} onChange={(e) => pick(e, setTopBackImage)} />
                    <UploadCard compact title="Detay" subtitle="Kumaş / yaka / düğme vb." value={topDetailImage} onChange={(e) => pick(e, setTopDetailImage)} />
                  </div>
                </div>

                <div className="productGroup">
                  <div className="productGroupHeader"><div><strong>ALT ÜRÜN</strong><span>Pantolon / Etek</span></div><small>Ön görsel önerilir · Arka ve detay isteğe bağlı</small></div>
                  <div className="productViewsGrid">
                    <UploadCard compact title="Ön Görünüm" subtitle="Ürünün önden fotoğrafı" value={bottomFrontImage} onChange={(e) => pick(e, setBottomFrontImage)} />
                    <UploadCard compact title="Arka Görünüm" subtitle="Varsa arkadan fotoğrafı" value={bottomBackImage} onChange={(e) => pick(e, setBottomBackImage)} />
                    <UploadCard compact title="Detay" subtitle="Kumaş / cep / paça vb." value={bottomDetailImage} onChange={(e) => pick(e, setBottomDetailImage)} />
                  </div>
                </div>

                <div className="productGroup accessoryGroup">
                  <div className="productGroupHeader"><div><strong>AKSESUAR</strong><span>Çanta / Takı / Şal</span></div><small>İsteğe bağlı</small></div>
                  <div className="accessoryUpload"><UploadCard compact title="Aksesuar Görseli" subtitle="Kullanılacak aksesuar" value={accessoryImage} onChange={(e) => pick(e, setAccessoryImage)} /></div>
                </div>
              </section>

              <section className="studioCard">
                <div className="sectionTitle"><span className="sectionIcon">⊞</span><h2>4. ÇEKİM ORTAMI</h2></div>
                <div className="environmentGrid">
                  {ENVIRONMENTS.map(([id, label]) => (
                    <button key={id} className={`environmentButton ${environment === id ? 'active' : ''}`} onClick={() => setEnvironment(id)}>{label}</button>
                  ))}
                </div>
                <div className="divider" />
                <label className="notesLabel">EK NOTLAR</label>
                <textarea className="notes" rows="5" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Işık, kumaş detayı vb..." />
              </section>

              <section className={`videoChoice ${wantVideo ? 'active' : ''}`} onClick={() => setWantVideo((v) => !v)} role="checkbox" aria-checked={wantVideo} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWantVideo((v) => !v); } }}>
                <div className="videoChoiceCheck">{wantVideo ? '✓' : ''}</div>
                <div className="videoChoiceText"><strong>5 SN E-TİCARET VİDEOSU DA OLUŞTUR</strong><span>Seçiliyse görsel hazırlandıktan sonra aynı ürün ve model korunarak 9:16 dikey, tam 5 saniyelik MP4 video otomatik hazırlanır.</span></div>
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
                <div className="resultHeading"><div><small>SONUÇ</small><h2>Stüdyo Çıktısı</h2></div><span className="ratioBadge">2:3</span></div>
                {result ? (
                  <>
                    <img className="resultImage" src={result} alt="Oluşturulan moda görseli" />
                    <a className="downloadButton" href={result} download="bilen-ai-studio.jpg">Görseli İndir</a>
                    <button className="videoButton" disabled={vbusy} onClick={() => makeVideo()}>{vbusy ? '6 SN ÜRETİLİYOR → 5 SN KESİLİYOR…' : (video ? '5 SN VİDEOYU YENİDEN OLUŞTUR' : '5 SN DİKEY VİDEO OLUŞTUR')}</button>
                    {video && <><video className="videoPlayer" src={video} controls playsInline /><a className="downloadButton" href={video} download="bilen-ai-5sn.mp4">5 Sn MP4 İndir</a></>}
                  </>
                ) : (
                  <div className="resultPlaceholder"><div className="placeholderIcon">✦</div><strong>Görseliniz burada görünecek</strong><span>Sol taraftaki seçimleri tamamlayıp görseli oluşturun.</span></div>
                )}
                <div className="selectionSummary">
                  <div><span>Poz</span><strong>{selectedPoseObj?.[1]}</strong></div>
                  <div><span>Ortam</span><strong>{selectedEnvironmentObj?.[1]}</strong></div>
                  <div><span>Video</span><strong>{wantVideo ? 'Otomatik · 9:16 · 5 saniye' : 'İsteğe bağlı · 9:16 · 5 saniye'}</strong></div>
                </div>
              </section>
            </aside>
          </>
        )}

        {activeTab === 'catalog' && (
          <div className="fullWidthPane">
            <section className="studioCard">
              <div className="sectionTitle"><span className="sectionIcon">▤</span><h2>KATALOG — ÇOKLU POZ ÜRETİMİ</h2></div>
              <p className="hint" style={{ textAlign: 'left', margin: '0 0 16px' }}>Stüdyo sekmesindeki model/ürün görsellerini ve çekim ortamını kullanır. Aşağıdan birden fazla poz seçip tek seferde üretebilirsiniz.</p>
              <div className="poseGrid">
                {POSES.map(([id, label]) => (
                  <button key={id} className={`optionButton ${selectedPoses.includes(id) ? 'active' : ''}`} onClick={() => togglePoseSelection(id)}>{label}</button>
                ))}
              </div>
              <button className="generateButton" style={{ marginTop: 18 }} disabled={!canGenerate || isGeneratingCatalog} onClick={handleGenerateCatalog}>
                {isGeneratingCatalog ? 'KATALOG ÜRETİLİYOR…' : `SEÇİLİ ${selectedPoses.length} POZU ÜRET`}
              </button>
              {!canGenerate && <p className="hint">Önce Stüdyo sekmesinden model ve ürün görseli yükleyin.</p>}
              {error && <div className="errorBox">{error}</div>}
            </section>

            {Object.keys(catalogImages).length > 0 && (
              <section className="studioCard">
                <div className="sectionTitle"><span className="sectionIcon">☐</span><h2>ÜRETİLEN GÖRSELLER</h2></div>
                <div className="catalogGrid">
                  {selectedPoses.map((id) => {
                    const item = catalogImages[id];
                    const label = POSES.find((p) => p[0] === id)?.[1] || id;
                    const ready = item?.url && !item?.loading && !item?.error;
                    return (
                      <div key={id} className={`catalogItem ${ready && selectedForTicimax.includes(id) ? 'selected' : ''}`} onClick={() => toggleTicimaxImageSelection(id)}>
                        <div className="catalogItemImg">
                          {item?.loading && <span className="catalogStatus">Üretiliyor…</span>}
                          {item?.error && <span className="catalogStatus error">{item.error}</span>}
                          {ready && <img src={item.url} alt={label} />}
                        </div>
                        <div className="catalogItemFooter">
                          <span>{label}</span>
                          {ready && <input type="checkbox" checked={selectedForTicimax.includes(id)} readOnly />}
                        </div>
                        {imageSendStatus.results[id] && (
                          <div className={`catalogSendStatus ${imageSendStatus.results[id].status}`}>{imageSendStatus.results[id].message}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="divider" />
                <div className="ticimaxSendRow">
                  <div className="ticimaxIdField">
                    <label>Ticimax Ürün Kart ID</label>
                    <input type="text" value={ticimaxProductId} onChange={(e) => setTicimaxProductId(e.target.value.replace(/\D/g, ''))} placeholder="Örn: 78740" />
                  </div>
                  <button className="generateButton" disabled={imageSendStatus.isSending || selectedForTicimax.length === 0} onClick={handleSendSelectedToTicimax}>
                    {imageSendStatus.isSending ? `GÖNDERİLİYOR (${imageSendStatus.current}/${imageSendStatus.total})…` : `SEÇİLENLERİ TİCİMAX'A GÖNDER (${selectedForTicimax.length})`}
                  </button>
                </div>
                <p className="hint">Bu Ticimax Ürün Kart ID, SEO ve Beden Tablosu sekmelerindeki gönderme butonları için de kullanılır.</p>
              </section>
            )}

            <section className="studioCard">
              <div className="sectionTitle"><span className="sectionIcon">⚙</span><h2>WEBHOOK AYARLARI (İsteğe Bağlı)</h2></div>
              <p className="hint" style={{ textAlign: 'left' }}>Boş bırakırsanız varsayılan n8n adresleri kullanılır. Sadece n8n webhook adreslerini değiştirdiyseniz doldurun.</p>
              <label className="notesLabel">Görsel gönderme webhook adresi</label>
              <input type="text" className="webhookInput" value={ticimaxImageWebhook} onChange={(e) => setTicimaxImageWebhook(e.target.value)} placeholder={DEFAULT_TICIMAX_IMAGE_WEBHOOK} />
              <label className="notesLabel" style={{ marginTop: 12 }}>SEO / Beden Tablosu webhook adresi</label>
              <input type="text" className="webhookInput" value={ticimaxSeoWebhook} onChange={(e) => setTicimaxSeoWebhook(e.target.value)} placeholder={DEFAULT_TICIMAX_SEO_WEBHOOK} />
            </section>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="fullWidthPane">
            <section className="studioCard">
              <div className="sectionTitle"><span className="sectionIcon">✎</span><h2>OTOMATİK ÜRÜN AÇIKLAMASI</h2></div>
              <p className="hint" style={{ textAlign: 'left' }}>AI, Stüdyo sekmesinde yüklediğiniz Üst/Alt ürün ön görselini analiz ederek SEO uyumlu başlık, açıklama ve meta etiketleri oluşturur. Hayali veri üretmez.</p>
              <button className="generateButton" disabled={isGeneratingSEO || (!topFrontImage && !bottomFrontImage)} onClick={handleGenerateSEO}>
                {isGeneratingSEO ? 'SEO İÇERİĞİ OLUŞTURULUYOR…' : 'SEO İÇERİĞİ OLUŞTUR'}
              </button>
              {(!topFrontImage && !bottomFrontImage) && <p className="hint">SEO analizi için Stüdyo sekmesinden en az bir ürün ön görseli yükleyin.</p>}
              {seoError && <div className="errorBox">{seoError}</div>}
            </section>

            {seoData && (
              <section className="studioCard">
                <div className="seoGrid">
                  <div className="seoField">
                    <div className="seoFieldHead"><label>SEO Ürün Başlığı</label><button type="button" onClick={() => copyText(seoData.title, 'title')}>{copiedField === 'title' ? 'KOPYALANDI ✓' : 'KOPYALA'}</button></div>
                    <div className="seoBox seoBoxTitle">{seoData.title}</div>
                  </div>
                  <div className="seoField">
                    <div className="seoFieldHead"><label>Ürün Açıklaması</label><button type="button" onClick={() => copyText(seoData.description, 'description')}>{copiedField === 'description' ? 'KOPYALANDI ✓' : 'KOPYALA'}</button></div>
                    <div className="seoBox">{seoData.description}</div>
                  </div>
                  <div className="seoField">
                    <div className="seoFieldHead"><label>Öne Çıkan Özellikler</label><button type="button" onClick={() => copyText((seoData.features || []).map((f) => '• ' + f).join('\n'), 'features')}>{copiedField === 'features' ? 'KOPYALANDI ✓' : 'KOPYALA'}</button></div>
                    <ul className="seoFeatureList">{(seoData.features || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                  <div className="seoField seoMetaCard">
                    <div className="seoFieldHead"><label>META BAŞLIK</label><button type="button" onClick={() => copyText(seoData.metaTitle, 'metaTitle')}>{copiedField === 'metaTitle' ? 'KOPYALANDI ✓' : 'KOPYALA'}</button></div>
                    <div className="seoBox seoBoxDark">{seoData.metaTitle}</div>
                    <div className="seoFieldHead" style={{ marginTop: 14 }}><label>META AÇIKLAMA</label><button type="button" onClick={() => copyText(seoData.metaDescription, 'metaDescription')}>{copiedField === 'metaDescription' ? 'KOPYALANDI ✓' : 'KOPYALA'}</button></div>
                    <div className="seoBox seoBoxDark">{seoData.metaDescription}</div>
                    <div className="seoFieldHead" style={{ marginTop: 14 }}><label>ANAHTAR KELİMELER</label><button type="button" onClick={() => copyText(seoData.keywords, 'keywords')}>{copiedField === 'keywords' ? 'KOPYALANDI ✓' : 'KOPYALA'}</button></div>
                    <div className="seoBox seoBoxDark">{seoData.keywords}</div>
                  </div>
                </div>

                <div className="divider" />
                <button className="generateButton" style={{ marginBottom: 10 }} onClick={handleCopyAllSEO}>{copiedField === 'all' ? 'TÜM SEO METNİ KOPYALANDI ✓' : 'TÜM SEO METNİNİ KOPYALA'}</button>

                <div className="ticimaxSendRow">
                  <div className="ticimaxIdField">
                    <label>Ticimax Ürün Kart ID</label>
                    <input type="text" value={ticimaxProductId} onChange={(e) => setTicimaxProductId(e.target.value.replace(/\D/g, ''))} placeholder="Örn: 78740" />
                  </div>
                  <button className="generateButton" disabled={seoSendStatus.isSending} onClick={handleSendSeoToTicimax}>{seoSendStatus.isSending ? 'GÖNDERİLİYOR…' : "TİCİMAX'A GÖNDER"}</button>
                </div>
                <p className="hint">Açıklama → ön yazı, meta başlık/açıklama/anahtar kelime → SEO alanları. Ürün adı değiştirilmez.</p>
                {seoSendStatus.result && <div className={`errorBox ${seoSendStatus.result.status === 'success' ? 'successBox' : ''}`}>{seoSendStatus.result.message}</div>}
              </section>
            )}
          </div>
        )}

        {activeTab === 'sizeguide' && (
          <div className="fullWidthPane sizeGuidePane">
            <section className="studioCard sgSettingsCard">
              <div className="sectionTitle"><span className="sectionIcon">⚏</span><h2>TABLO AYARLARI</h2></div>
              <label className="notesLabel">1. Ürün Türü</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value)}>{SG_PRODUCT_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}</select>

              <label className="notesLabel" style={{ marginTop: 14 }}>2. Beden Sistemi</label>
              <select value={sizeSystem} onChange={(e) => setSizeSystem(e.target.value)}>{Object.keys(SG_SIZE_SYSTEMS).map((sys) => <option key={sys} value={sys}>{sys}</option>)}</select>

              <label className="notesLabel" style={{ marginTop: 14 }}>3. Seçili Bedenler</label>
              <div className="sizeChipGrid">
                {SG_SIZE_SYSTEMS[sizeSystem].map((size) => (
                  <button key={size} className={`sizeChip ${selectedSizes.includes(size) ? 'active' : ''}`} onClick={() => handleSizeToggle(size)}>{size}</button>
                ))}
              </div>
              {selectedSizes.length === 0 && <p className="hint" style={{ color: '#c23636' }}>En az bir beden seçmelisiniz.</p>}

              <div className="divider" />
              <label className="notesLabel">Ölçüm Şekli</label>
              <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value)}>
                <option value="DÜZ ZEMİN / TEK YÖN ÖLÇÜSÜ">DÜZ ZEMİN / TEK YÖN ÖLÇÜSÜ</option>
                <option value="ÜRÜN ÇEVRE ÖLÇÜSÜ">ÜRÜN ÇEVRE ÖLÇÜSÜ</option>
              </select>
              <label className="notesLabel" style={{ marginTop: 14 }}>Tolerans</label>
              <select value={tolerance} onChange={(e) => setTolerance(e.target.value)}>
                <option value="YOK">YOK</option><option value="±1 CM">±1 CM</option><option value="±2 CM">±2 CM</option><option value="±3 CM">±3 CM</option>
              </select>

              <div className="divider" />
              <label className="notesLabel">Kumaş Bilgisi</label>
              {productType === 'Takım' ? (
                <>
                  <input className="webhookInput" value={topFabricInfo} onChange={(e) => setTopFabricInfo(e.target.value)} placeholder="Üst parça kumaşı (opsiyonel)" />
                  <input className="webhookInput" style={{ marginTop: 8 }} value={bottomFabricInfo} onChange={(e) => setBottomFabricInfo(e.target.value)} placeholder="Alt parça kumaşı (opsiyonel)" />
                </>
              ) : (
                <input className="webhookInput" value={fabricInfo} onChange={(e) => setFabricInfo(e.target.value)} placeholder="Örn: Pamuk karışımlı dokuma (opsiyonel)" />
              )}

              <div className="divider" />
              <button className="generateButton" onClick={handleCopySizeHtml}>WEB İÇİN HTML KOPYALA</button>
              <button className="downloadButton sgOutlineBtn" onClick={handlePrintSize}>YAZDIR</button>
              {sgMsg && <div className="successBox" style={{ marginTop: 10 }}>{sgMsg}</div>}

              <div className="divider" />
              <label className="notesLabel">Ticimax Ürün Kart ID</label>
              <input className="webhookInput" type="text" value={ticimaxProductId} onChange={(e) => setTicimaxProductId(e.target.value.replace(/\D/g, ''))} placeholder="Örn: 78740" />
              <button className="generateButton" style={{ marginTop: 10 }} disabled={sizeChartSendStatus.isSending} onClick={handleSendSizeChartToTicimax}>
                {sizeChartSendStatus.isSending ? 'GÖNDERİLİYOR…' : "TİCİMAX'A GÖNDER"}
              </button>
              {sizeChartSendStatus.result && <div className={`errorBox ${sizeChartSendStatus.result.status === 'success' ? 'successBox' : ''}`} style={{ marginTop: 10 }}>{sizeChartSendStatus.result.message}</div>}
            </section>

            <div className="sgTablesColumn">
              {selectedSizes.length > 0 ? (
                <>
                  {productType === 'Takım' ? (
                    <>
                      <div className="sgTypeRow"><span>Üst Parça Tipi:</span><select value={topType} onChange={(e) => setTopType(e.target.value)}>{SG_TAKIM_TOP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                      <SizeTableEditor title="ÜST PARÇA ÖLÇÜLERİ" rows={topRows} setRows={setTopRows} selectedSizes={selectedSizes} autoIncrementState={autoIncrementTop} setAutoIncrementState={setAutoIncrementTop} autoFillEmptyOnlyState={autoFillEmptyOnlyTop} setAutoFillEmptyOnlyState={setAutoFillEmptyOnlyTop} />
                      <div className="sgTypeRow"><span>Alt Parça Tipi:</span><select value={bottomType} onChange={(e) => setBottomType(e.target.value)}>{SG_TAKIM_BOTTOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                      <SizeTableEditor title="ALT PARÇA ÖLÇÜLERİ" rows={bottomRows} setRows={setBottomRows} selectedSizes={selectedSizes} autoIncrementState={autoIncrementBottom} setAutoIncrementState={setAutoIncrementBottom} autoFillEmptyOnlyState={autoFillEmptyOnlyBottom} setAutoFillEmptyOnlyState={setAutoFillEmptyOnlyBottom} />
                    </>
                  ) : (
                    <SizeTableEditor title={`${productType.toUpperCase()} ÖLÇÜ TABLOSU`} rows={rows} setRows={setRows} selectedSizes={selectedSizes} autoIncrementState={autoIncrementSingle} setAutoIncrementState={setAutoIncrementSingle} autoFillEmptyOnlyState={autoFillEmptyOnlySingle} setAutoFillEmptyOnlyState={setAutoFillEmptyOnlySingle} />
                  )}
                  <div className="sgPreview">
                    <h3>CANLI ÖNİZLEME</h3>
                    <div dangerouslySetInnerHTML={{ __html: generateHTMLString() }} />
                  </div>
                </>
              ) : (
                <div className="resultPlaceholder"><strong>Lütfen soldan en az bir beden seçin.</strong></div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
