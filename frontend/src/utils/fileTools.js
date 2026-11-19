import { api } from '../services/api';

const AI_CONFIG_KEY = 'simaaf_ai_config';

const DEFAULT_AI_CONFIG = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
};

/**
 * Mengambil konfigurasi token AI yang disimpan pengguna di browser.
 */
export function getAiConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider || 'gemini',
      apiKey: parsed.apiKey || '',
      model:
        parsed.model ||
        (parsed.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'),
    };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

/**
 * Menyimpan token API dan pilihan model AI ke penyimpanan lokal.
 */
export function saveAiConfig(config) {
  const normalized = {
    provider: config.provider || 'gemini',
    apiKey: (config.apiKey || '').trim(),
    model:
      (config.model || '').trim() ||
      (config.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'),
  };
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}

/**
 * Memicu unduhan berkas di browser dari objek Blob.
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Mengubah array data menjadi berkas CSV berstandar UTF-8 BOM agar rapi dibuka di Excel.
 */
export function exportToExcelCsv(filename, headers, rows) {
  const escapeCell = (val) => {
    const str = String(val ?? '');
    if (/[",\n\r;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const finalName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  triggerDownload(blob, finalName);
}

/**
 * Mengunduh templat faktur CSV siap isi untuk impor cepat ke SIMAAF.
 */
export function downloadTemplateFakturCsv() {
  const headers = [
    'Nama Obat',
    'Nomor Batch',
    'Tanggal Kedaluwarsa',
    'Jumlah',
    'Harga Beli Satuan',
    'Satuan',
  ];
  const sampleRows = [
    ['Amoxicillin 500mg', 'AMX-2611-A1', '2027-08-15', 25, 42000, 'box'],
    ['Paracetamol Sirup 60ml', 'PCT-2611-B2', '2027-09-20', 30, 18500, 'botol'],
    ['Ibuprofen 400mg Tablet', 'IBP-2611-C3', '2027-07-10', 40, 6800, 'strip'],
  ];
  exportToExcelCsv('template_faktur_simaaf.csv', headers, sampleRows);
}

/**
 * Mengunduh templat Excel/CSV migrasi stok awal & opname massal untuk apotek yang sudah berjalan.
 */
export function downloadTemplateOpnameCsv() {
  const headers = [
    'Nama Obat',
    'Nomor Batch',
    'Tanggal Kedaluwarsa',
    'Jumlah Fisik',
    'Harga Beli Satuan',
    'Satuan',
    'Distributor PBF',
  ];
  const sampleRows = [
    ['Cefixime 100mg Kapsul', 'CFX-2601-A', '2027-02-15', 14, 78000, 'box', 'PBF Enseval Putera Megatrading'],
    ['Paracetamol 500mg Strip', 'PCT-2608-M1', '2027-11-30', 65, 4500, 'strip', 'PBF Kimia Farma Trading & Distribution'],
    ['Vitamin C 500mg Tablet', 'VTC-2610-R2', '2028-03-20', 40, 35000, 'botol', 'PBF Penta Valent Medan'],
  ];
  exportToExcelCsv('template_opname_migrasi_simaaf.csv', headers, sampleRows);
}

/**
 * Menghasilkan dan mengunduh berkas jadwal kalender standar iCalendar (.ics).
 */
export function exportCalendarIcs(filename, milestones = []) {
  const formatIcsDate = (dateStr) => String(dateStr || '').replace(/[^0-9]/g, '').slice(0, 8);
  const escapeText = (text) =>
    String(text || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

  const events = milestones
    .filter((m) => m.date)
    .map((m, idx) => {
      const dt = formatIcsDate(m.date);
      const uid = `simaaf-${dt}-${idx}@apotekasahan.local`;
      const summary = escapeText(m.title || 'Tenggat Obat SIMAAF');
      const desc = escapeText(
        `${m.desc || ''} | Nilai: Rp ${Number(m.batch?.nilai_total || 0).toLocaleString('id-ID')}`
      );
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${dt}`,
        `DTEND;VALUE=DATE:${dt}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${desc}`,
        'END:VEVENT',
      ].join('\r\n');
    });

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SIMAAF//Apotek Asahan Farma//ID',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const finalName = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  triggerDownload(blob, finalName);
}

/**
 * Menormalkan format tanggal dari DD/MM/YYYY atau YYYY-MM-DD menjadi YYYY-MM-DD.
 */
function normalizeDate(raw) {
  const s = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return '2027-06-30';
}

/**
 * Mencocokkan nama obat hasil pembacaan berkas dengan master obat yang ada.
 */
function matchObatItem(rawName, obatList = []) {
  const cleanName = String(rawName || '').trim();
  const q = cleanName.toLowerCase();
  if (!q) {
    return obatList[0] || { id: 1, nama: 'Obat Baru', satuan: 'box' };
  }
  const exact = obatList.find((o) => o.nama.toLowerCase() === q);
  if (exact) return exact;
  const partial = obatList.find(
    (o) =>
      o.nama.toLowerCase().includes(q) ||
      q.includes(o.nama.toLowerCase().split(' ')[0])
  );
  // Pertahankan nama asli dari dokumen apotek lama jika belum ada di master demo
  return partial || { id: Date.now() + Math.floor(Math.random() * 1000), nama: cleanName, satuan: 'unit' };
}

/**
 * Mencocokkan nama distributor dari dokumen dengan daftar PBF rekanan.
 */
function matchDistributorId(rawDist, distributors = []) {
  const q = String(rawDist || '').toLowerCase().trim();
  if (!q || distributors.length === 0) return distributors[0]?.id || 1;
  const found = distributors.find(
    (d) =>
      d.nama.toLowerCase().includes(q) ||
      q.includes(d.nama.toLowerCase().replace('pbf ', '').split(' ')[0])
  );
  return found ? found.id : distributors[0]?.id || 1;
}

/**
 * Membaca baris dari teks CSV/TSV menggunakan pemisah koma, titik koma, atau tab.
 */
function parseDelimitedText(text, obatList) {
  const rawLines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return [];

  const firstLine = rawLines[0];
  const delimiter = firstLine.includes(';')
    ? ';'
    : firstLine.includes('\t')
    ? '\t'
    : ',';

  const splitRow = (line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const rows = rawLines.map(splitRow);
  const hasHeader = /nama|obat|batch|jumlah|exp|kedaluwarsa|harga/i.test(
    rows[0].join(' ')
  );
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((cols) => cols.length >= 2 && cols.some((c) => c.length > 0))
    .map((cols, idx) => {
      const namaInput = cols[0] || '';
      const matched = matchObatItem(namaInput, obatList);
      const jumlahRaw = Number(String(cols[3] || '10').replace(/[^0-9]/g, ''));
      const hargaRaw = Number(String(cols[4] || '25000').replace(/[^0-9]/g, ''));

      return {
        obat_id: matched.id,
        nama_obat: matched.nama,
        nomor_batch: (cols[1] || `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`).trim(),
        tanggal_kedaluwarsa: normalizeDate(cols[2]),
        jumlah: jumlahRaw >= 0 && cols[3] !== undefined && cols[3] !== '' ? jumlahRaw : 10,
        harga_beli_satuan: hargaRaw > 0 ? hargaRaw : 25000,
        satuan: (cols[5] || matched.satuan || 'box').trim(),
        nama_distributor_raw: (cols[6] || '').trim(),
      };
    });
}

/**
 * Mengekstrak entri teks dari arsip ZIP (.docx atau .xlsx) secara langsung di browser.
 */
async function extractTextFromOfficeZip(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const collected = [];

  // Membaca local file header ZIP (signature PK\x03\x04 = 0x04034b50)
  let offset = 0;
  while (offset + 30 < bytes.length) {
    if (
      bytes[offset] !== 0x50 ||
      bytes[offset + 1] !== 0x4b ||
      bytes[offset + 2] !== 0x03 ||
      bytes[offset + 3] !== 0x04
    ) {
      offset++;
      continue;
    }

    const compression = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const dataStart = offset + 30 + nameLen + extraLen;
    const entryName = textDecoder.decode(bytes.slice(offset + 30, offset + 30 + nameLen));

    const isTargetXml =
      entryName.endsWith('.xml') &&
      (entryName.includes('word/document') ||
        entryName.includes('sharedStrings') ||
        entryName.includes('worksheets/sheet'));

    if (isTargetXml && compSize > 0 && dataStart + compSize <= bytes.length) {
      const slice = bytes.slice(dataStart, dataStart + compSize);
      try {
        let xmlStr = '';
        if (compression === 0) {
          xmlStr = textDecoder.decode(slice);
        } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(slice);
          writer.close();
          const outBuf = await new Response(ds.readable).arrayBuffer();
          xmlStr = textDecoder.decode(outBuf);
        }

        if (xmlStr) {
          const stripped = xmlStr
            .replace(/<\/(w:tr|w:p|row|si)>/gi, '\n')
            .replace(/<\/(w:tc|c|t)>/gi, ' | ')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/[ \t]+\|/g, ' | ')
            .trim();
          if (stripped) collected.push(stripped);
        }
      } catch {
        // Lewati entri XML yang tidak bisa didekompresi
      }
    }

    offset = compSize > 0 ? dataStart + compSize : offset + 30 + nameLen + extraLen;
  }

  return collected.join('\n');
}

/**
 * Mengubah file gambar menjadi string base64 tanpa awalan data URL.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1] || '';
      resolve({ base64, dataUrl: result });
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Mengurai hasil JSON teks dari respons model AI menjadi struktur faktur SIMAAF.
 */
function parseAiJsonResponse(rawText, obatList, distributors) {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Respons AI tidak mengandung struktur JSON yang valid.');
  }

  const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];

  const mappedItems = rawItems.map((it, idx) => {
    const matched = matchObatItem(it.nama_obat, obatList);
    return {
      obat_id: matched.id,
      nama_obat: matched.nama,
      nomor_batch: String(it.nomor_batch || `AI-${Date.now().toString().slice(-4)}-${idx + 1}`),
      tanggal_kedaluwarsa: normalizeDate(it.tanggal_kedaluwarsa),
      jumlah: Number(it.jumlah) > 0 ? Number(it.jumlah) : 10,
      harga_beli_satuan: Number(it.harga_beli_satuan) > 0 ? Number(it.harga_beli_satuan) : 25000,
      satuan: it.satuan || matched.satuan || 'box',
    };
  });

  return {
    nomor_faktur: parsed.nomor_faktur || `FAK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    distributor_id: matchDistributorId(parsed.nama_distributor, distributors),
    items: mappedItems,
  };
}

/**
 * Memanggil API Gemini atau OpenAI secara langsung dari browser jika token AI tersedia.
 */
async function callAiExtraction({ aiConfig, isImage, mimeType, base64, documentText, obatList, distributors }) {
  const obatRef = obatList.map((o) => o.nama).slice(0, 25).join(', ');
  const pbfRef = distributors.map((d) => d.nama).slice(0, 14).join(', ');

  const instruction = [
    'Ekstrak daftar penerimaan faktur obat apotek dari berkas berikut.',
    `Daftar referensi obat apotek: [${obatRef}].`,
    `Daftar referensi distributor PBF: [${pbfRef}].`,
    'Kembalikan HANYA JSON valid dengan format:',
    '{"nomor_faktur":"string","nama_distributor":"string","items":[{"nama_obat":"string","nomor_batch":"string","tanggal_kedaluwarsa":"YYYY-MM-DD","jumlah":number,"harga_beli_satuan":number,"satuan":"string"}]}',
  ].join('\n');

  if (aiConfig.provider === 'openai') {
    const model = aiConfig.model || 'gpt-4o-mini';
    const contentPayload = isImage
      ? [
          { type: 'text', text: instruction },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ]
      : `${instruction}\n\nIsi Dokumen:\n${documentText.slice(0, 12000)}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [{ role: 'user', content: contentPayload }],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API HTTP ${res.status}`);
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content || '';
    return parseAiJsonResponse(raw, obatList, distributors);
  }

  const model = aiConfig.model || 'gemini-2.5-flash';
  const parts = isImage
    ? [{ text: instruction }, { inlineData: { mimeType, data: base64 } }]
    : [{ text: `${instruction}\n\nIsi Dokumen:\n${documentText.slice(0, 12000)}` }];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(aiConfig.apiKey)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API HTTP ${res.status}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseAiJsonResponse(raw, obatList, distributors);
}

/**
 * Membaca dan mengekstrak item faktur dari foto, Excel/CSV, atau Word/TXT secara lokal atau via AI token.
 */
export async function parseUploadedDocument(file, obatList = [], distributors = []) {
  const name = (file?.name || '').toLowerCase();
  const mime = file?.type || 'application/octet-stream';
  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(name);
  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf');
  const isDelimited = /\.(csv|tsv)$/i.test(name);
  const isOfficeZip = /\.(docx|xlsx)$/i.test(name);
  const aiConfig = getAiConfig();
  const hasToken = Boolean(aiConfig.apiKey);

  // Alur gambar atau PDF: gunakan AI multimodal jika token tersedia, atau simulasi lokal jika belum ada token
  if (isImage || isPdf) {
    if (hasToken && (isImage || aiConfig.provider === 'gemini')) {
      try {
        const { base64 } = await fileToBase64(file);
        const aiResult = await callAiExtraction({
          aiConfig,
          isImage: true,
          mimeType: isPdf ? 'application/pdf' : mime,
          base64,
          documentText: '',
          obatList,
          distributors,
        });
        if (aiResult.items.length > 0) {
          return {
            sukses: true,
            metode: `AI (${aiConfig.provider.toUpperCase()})`,
            data: aiResult,
            pesan: `Berkas "${file.name}" berhasil diekstrak akurat menggunakan token AI.`,
          };
        }
      } catch (err) {
        const fallback = await api.ekstrakFakturFoto(file);
        return {
          sukses: true,
          metode: 'Data Simulasi (Fallback)',
          data: fallback.data,
          pesan: `Token AI gagal terhubung (${err.message}). Menampilkan data simulasi agar input tetap berjalan.`,
        };
      }
    }

    const sim = await api.ekstrakFakturFoto(file);
    return {
      sukses: true,
      metode: isPdf ? 'Pemindaian PDF Simulasi' : 'Pemindaian Simulasi',
      data: sim.data,
      pesan: `Berkas "${file.name}" dimuat dengan data simulasi. Masukkan Token AI jika ingin mengekstrak foto faktur asli.`,
    };
  }

  // Ekstraksi teks mentah dari Excel/CSV/Word/TXT/JSON
  let rawText = '';
  if (isOfficeZip) {
    rawText = await extractTextFromOfficeZip(file);
  }
  if (!rawText) {
    rawText = await file.text();
  }

  // Cek format JSON langsung
  if (name.endsWith('.json')) {
    try {
      const parsed = JSON.parse(rawText);
      const list = Array.isArray(parsed) ? parsed : parsed.items || [];
      if (list.length > 0) {
        return {
          sukses: true,
          metode: 'Parser JSON',
          data: {
            nomor_faktur: parsed.nomor_faktur || `JSON-${Date.now().toString().slice(-4)}`,
            distributor_id: matchDistributorId(parsed.nama_distributor, distributors),
            items: list.map((it, i) => {
              const m = matchObatItem(it.nama_obat, obatList);
              return {
                obat_id: m.id,
                nama_obat: m.nama,
                nomor_batch: it.nomor_batch || `IMP-${i + 1}`,
                tanggal_kedaluwarsa: normalizeDate(it.tanggal_kedaluwarsa),
                jumlah: Number(it.jumlah) || 10,
                harga_beli_satuan: Number(it.harga_beli_satuan) || 25000,
                satuan: it.satuan || m.satuan || 'box',
              };
            }),
          },
          pesan: `Berhasil membaca ${list.length} item obat dari berkas JSON.`,
        };
      }
    } catch {
      // Lanjutkan ke parser teks atau AI jika bukan JSON valid
    }
  }

  // Jika ada token AI dan berkas adalah dokumen Word/Excel/TXT kompleks, prioritaskan AI terlebih dahulu
  if (hasToken && !isDelimited && rawText.trim().length > 10) {
    try {
      const aiResult = await callAiExtraction({
        aiConfig,
        isImage: false,
        mimeType: mime,
        base64: '',
        documentText: rawText,
        obatList,
        distributors,
      });
      if (aiResult.items.length > 0) {
        return {
          sukses: true,
          metode: `AI (${aiConfig.provider.toUpperCase()})`,
          data: aiResult,
          pesan: `Dokumen "${file.name}" berhasil dibaca oleh AI dan dipetakan ke tabel.`,
        };
      }
    } catch {
      // Lanjutkan ke parser lokal bila pemanggilan AI gagal
    }
  }

  // Parser lokal tabel CSV/TSV atau teks dokumen
  const normalizedForRows = isDelimited
    ? rawText
    : rawText.replace(/\s\|\s/g, ',');
  const parsedItems = parseDelimitedText(normalizedForRows, obatList);

  if (parsedItems.length > 0) {
    return {
      sukses: true,
      metode: isDelimited ? 'Parser Excel / CSV' : 'Parser Dokumen Lokal',
      data: {
        nomor_faktur: `IMP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        distributor_id: distributors[0]?.id || 1,
        items: parsedItems,
      },
      pesan: `Berhasil membaca ${parsedItems.length} baris obat dari "${file.name}".`,
    };
  }

  const fallback = await api.ekstrakFakturFoto(file);
  return {
    sukses: true,
    metode: 'Fallback Contoh Lokal',
    data: fallback.data,
    pesan: `Format isi "${file.name}" belum standar. Gunakan "Template CSV" atau aktifkan Token AI untuk ekstraksi dokumen bebas.`,
  };
}
