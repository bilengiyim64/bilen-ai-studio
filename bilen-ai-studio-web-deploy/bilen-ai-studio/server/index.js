import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '90mb' }));

const API_KEY = process.env.GEMINI_API_KEY;
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

function requireKey(res) {
  if (!API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil. server/.env dosyasını oluşturun.' });
    return false;
  }
  return true;
}

function parseDataUrl(dataUrl) {
  const m = /^data:(.*?);base64,(.*)$/.exec(dataUrl || '');
  if (!m) throw new Error('Geçersiz görsel verisi.');
  return { mimeType: m[1], data: m[2] };
}

async function googleFetch(url, options = {}) {
  const r = await fetch(url, { ...options, headers: { 'x-goog-api-key': API_KEY, ...(options.headers || {}) } });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!r.ok) throw new Error(body?.error?.message || body?.message || `Google API hatası: ${r.status}`);
  return body;
}

function pushImage(input, dataUrl, label) {
  if (!dataUrl) return;
  const img = parseDataUrl(dataUrl);
  input.push({ type: 'text', text: label });
  input.push({ type: 'image', mime_type: img.mimeType, data: img.data });
}

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/studio-image', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const {
      modelImage,
      topFrontImage, topBackImage, topDetailImage,
      bottomFrontImage, bottomBackImage, bottomDetailImage,
      accessoryImage,
      pose = '', poseLabel = '', environment = '', environmentLabel = '', notes = ''
    } = req.body;

    if (!modelImage) return res.status(400).json({ error: 'Model fotoğrafı gerekli.' });
    if (!topFrontImage && !topBackImage && !topDetailImage && !bottomFrontImage && !bottomBackImage && !bottomDetailImage && !accessoryImage) return res.status(400).json({ error: 'En az bir ürün görseli yükleyin.' });

    const input = [{
      type: 'text',
      text: `You are an expert women's fashion e-commerce photography and virtual styling system.

TASK:
Create one photorealistic premium fashion image using the provided MODEL PHOTO as the identity and body reference, and dress/style that model using only the uploaded product reference images.

STRICT IDENTITY RULES:
- Preserve the model's recognizable face, hair, skin tone, general body proportions and adult appearance from the MODEL PHOTO.
- Do not invent a different person.
- Keep anatomy natural, with realistic hands, fingers, limbs and garment draping.

STRICT PRODUCT RULES:
- The uploaded TOP, BOTTOM and ACCESSORY images are product references, not inspiration.
- A product may have FRONT, BACK and DETAIL reference images. Treat all views of the same category as the SAME physical product.
- FRONT view defines the primary silhouette, front construction, length, closures and visible design.
- BACK view defines the exact back construction and must be respected whenever the selected pose exposes the back.
- DETAIL view provides close-up evidence for fabric texture, stitching, collar, buttons, pockets, embroidery, trim, pattern scale and workmanship.
- Combine information from all supplied views without inventing or duplicating garment features.
- Preserve each supplied item's exact color, pattern, cut, length, collar, sleeve, seams, buttons, pockets, trim, texture and distinctive design details.
- Never merge product details incorrectly and never redesign the garments.
- If a product category was not uploaded, do not add a visually dominant replacement item unless needed for modest/natural styling; keep it neutral and simple.
- Accessories must not hide important garment details.

POSE:
${poseLabel || 'Selected pose'} — ${pose}

SETTING:
${environmentLabel || 'Selected environment'} — ${environment}

COMPOSITION:
- Premium women's fashion e-commerce/editorial quality.
- Vertical 2:3 composition.
- Keep the outfit readable and proportional.
- For full-body poses, show the model from head to feet and avoid cropping shoes.
- Lighting should reveal true fabric texture and color.
- No text, logos, labels, borders or watermarks added to the image.

ADDITIONAL USER NOTES:
${notes || 'None.'}`
    }];

    pushImage(input, modelImage, 'MODEL PHOTO — preserve this person as the model identity and body reference.');
    pushImage(input, topFrontImage, 'TOP PRODUCT — FRONT VIEW. Primary reference for the exact upper garment.');
    pushImage(input, topBackImage, 'TOP PRODUCT — BACK VIEW. Same upper garment; preserve these exact back details.');
    pushImage(input, topDetailImage, 'TOP PRODUCT — DETAIL VIEW. Same upper garment; preserve fabric, stitching, buttons, collar, trim, pattern scale and workmanship visible here.');
    pushImage(input, bottomFrontImage, 'BOTTOM PRODUCT — FRONT VIEW. Primary reference for the exact bottom garment.');
    pushImage(input, bottomBackImage, 'BOTTOM PRODUCT — BACK VIEW. Same bottom garment; preserve these exact back details.');
    pushImage(input, bottomDetailImage, 'BOTTOM PRODUCT — DETAIL VIEW. Same bottom garment; preserve fabric, pockets, waistband, seams, hem, pattern scale and workmanship visible here.');
    pushImage(input, accessoryImage, 'ACCESSORY PRODUCT REFERENCE — use this exact accessory naturally in the styling.');

    const body = await googleFetch(`${BASE}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.1-flash-image',
        input,
        response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '2:3', image_size: '2K' }
      })
    });

    const out = body.output_image || body.outputImage;
    if (!out?.data) throw new Error('Görsel üretilemedi. Google API görsel çıktısı döndürmedi.');
    res.json({ image: `data:${out.mime_type || out.mimeType || 'image/jpeg'};base64,${out.data}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eski /api/image uç noktası geriye dönük uyumluluk için korunuyor.
app.post('/api/image', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { image, referenceImage, prompt = '', background = 'white' } = req.body;
    if (!image) return res.status(400).json({ error: 'Ana görsel gerekli.' });
    const src = parseDataUrl(image);
    const input = [
      { type: 'text', text: `You are a professional women's fashion e-commerce image editor. Preserve the exact garment identity, cut, seams, buttons, pattern placement, fabric texture and proportions of the main image. Do not redesign the garment. Keep human anatomy natural. Background preference: ${background}. User request: ${prompt || 'Prepare a premium e-commerce image with clean studio presentation.'}` },
      { type: 'image', mime_type: src.mimeType, data: src.data }
    ];
    if (referenceImage) pushImage(input, referenceImage, 'REFERENCE IMAGE — transfer only the user-requested property.');
    const body = await googleFetch(`${BASE}/interactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-3.1-flash-image', input, response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '2:3', image_size: '2K' } })
    });
    const out = body.output_image || body.outputImage;
    if (!out?.data) throw new Error('Görsel üretilemedi.');
    res.json({ image: `data:${out.mime_type || out.mimeType || 'image/jpeg'};base64,${out.data}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args);
    let err = '';
    p.stderr.on('data', d => err += d.toString());
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve() : reject(new Error('FFmpeg hatası: ' + err.slice(-1200))));
  });
}

app.post('/api/video', async (req, res) => {
  const work = path.join(os.tmpdir(), `bilen-${randomUUID()}`);
  try {
    if (!requireKey(res)) return;
    const { image, prompt = '' } = req.body;
    if (!image) return res.status(400).json({ error: 'Başlangıç görseli gerekli.' });
    const src = parseDataUrl(image);
    const request = {
      instances: [{
        prompt: `Create a premium vertical women's fashion e-commerce video from the input image. Preserve the exact model identity, clothing design, color, pattern, fabric, buttons, seams and proportions. The adult model makes only subtle natural movement. Do not morph the face or garment. Use a gentle cinematic camera movement. No text, no logo, no watermark, no price, and no extra accessories. Keep the complete outfit readable. ${prompt}`,
        image: { bytesBase64Encoded: src.data, mimeType: src.mimeType }
      }],
      parameters: { aspectRatio: '9:16', durationSeconds: '6', resolution: '720p', personGeneration: 'allow_adult', sampleCount: 1 }
    };

    let op = await googleFetch(`${BASE}/models/veo-3.1-generate-preview:predictLongRunning`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request)
    });
    const name = op.name;
    if (!name) throw new Error('Video işlemi başlatılamadı.');
    const deadline = Date.now() + 8 * 60 * 1000;
    while (!op.done) {
      if (Date.now() > deadline) throw new Error('Video üretimi zaman aşımına uğradı.');
      await new Promise(r => setTimeout(r, 10000));
      op = await googleFetch(`${BASE}/${name}`);
    }
    if (op.error) throw new Error(op.error.message || 'Veo video üretim hatası.');
    const sample = op.response?.generateVideoResponse?.generatedSamples?.[0] || op.response?.generatedVideos?.[0];
    const uri = sample?.video?.uri || sample?.video?.url || sample?.uri;
    if (!uri) throw new Error('Üretilen video bağlantısı bulunamadı.');

    await fs.mkdir(work, { recursive: true });
    const inputPath = path.join(work, 'veo-6s.mp4');
    const outputPath = path.join(work, 'bilen-5s.mp4');
    const vr = await fetch(uri, { headers: { 'x-goog-api-key': API_KEY } });
    if (!vr.ok) throw new Error(`Video indirilemedi: ${vr.status}`);
    await fs.writeFile(inputPath, Buffer.from(await vr.arrayBuffer()));
    await runFfmpeg(['-y', '-i', inputPath, '-t', '5.000', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-movflags', '+faststart', outputPath]);
    const data = await fs.readFile(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="bilen-ai-5sn.mp4"');
    res.send(data);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  } finally {
    fs.rm(work, { recursive: true, force: true }).catch(() => {});
  }
});

// Derlenmiş React uygulamasını (client/dist) aynı sunucudan servis et.
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

app.listen(process.env.PORT || 3001, () => console.log(`Bilen AI server: http://localhost:${process.env.PORT || 3001}`));
