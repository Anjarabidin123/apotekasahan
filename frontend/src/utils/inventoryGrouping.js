export const DEFAULT_RACK_FOLDERS = [
  { id: 'rak-utama', name: 'Etalase Depan & Bebas', tone: 'emerald' },
  { id: 'rak-keras', name: 'Rak Obat Keras & Antibiotik', tone: 'rose' },
  { id: 'rak-topikal', name: 'Sirup Anak, Salep & Tetes', tone: 'teal' },
  { id: 'rak-karantina', name: 'Karantina & Wajib Retur PBF', tone: 'amber' },
];

export const FOLDER_TONE_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  blue: 'bg-blue-50 text-blue-600 border-blue-200/80',
  rose: 'bg-rose-50 text-rose-600 border-rose-200/80',
  amber: 'bg-amber-50 text-amber-600 border-amber-200/80',
  teal: 'bg-teal-50 text-teal-600 border-teal-200/80',
  violet: 'bg-violet-50 text-violet-600 border-violet-200/80',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function inferMedicineCategory(batch, obatMap) {
  const fromMaster = obatMap.get(Number(batch.obat_id))?.kategori;
  if (fromMaster) return fromMaster;
  const nama = (batch.nama_obat || '').toLowerCase();
  if (/amox|cefix|cipro|azith|cefad|kloram|antibiot/.test(nama)) return 'Antibiotik';
  if (/paracet|ibuprof|mefenam|antalgin|ketopro|aspir/.test(nama)) return 'Analgesik & Antipiretik';
  if (/omepra|antasid|ranitid|lansopra/.test(nama)) return 'Saluran Lambung';
  if (/salep|krim|tetes|gel|topikal/.test(nama)) return 'Topikal & Kulit';
  if (/sirup|obh|batuk|cetiriz|salbut/.test(nama)) return 'Batuk, Flu & Napas';
  if (/vit|curcuma|suplemen|zinc/.test(nama)) return 'Suplemen & Vitamin';
  return 'Lainnya';
}

export function resolveBatchFolder(batch, groupMode, obatMap, rackFolders, batchFolderMap) {
  if (groupMode === 'pbf') {
    const name = batch.nama_distributor || 'PBF Lainnya';
    return {
      id: `pbf:${batch.distributor_id || name}`,
      name,
      tone: 'teal',
    };
  }

  if (groupMode === 'status') {
    if (batch.status_retur === 'lewat_batas') {
      return { id: 'st:lewat_batas', name: 'Lewat Batas Retur', tone: 'rose' };
    }
    if (batch.status_risiko === 'tinggi') {
      return { id: 'st:risiko_tinggi', name: 'Risiko Tinggi / Wajib Retur', tone: 'amber' };
    }
    if (batch.status_risiko === 'sedang') {
      return { id: 'st:sedang', name: 'Perlu Dipantau (Waspada)', tone: 'slate' };
    }
    return { id: 'st:aman', name: 'Stok Aman Terkendali', tone: 'teal' };
  }

  if (groupMode === 'abjad') {
    const ch = (batch.nama_obat || 'Z').trim().charAt(0).toUpperCase();
    if (ch >= 'A' && ch <= 'E') return { id: 'az:a-e', name: 'Obat Awalan A – E', tone: 'emerald' };
    if (ch >= 'F' && ch <= 'K') return { id: 'az:f-k', name: 'Obat Awalan F – K', tone: 'teal' };
    if (ch >= 'L' && ch <= 'P') return { id: 'az:l-p', name: 'Obat Awalan L – P', tone: 'emerald' };
    return { id: 'az:q-z', name: 'Obat Awalan Q – Z', tone: 'amber' };
  }

  if (groupMode === 'rak') {
    const mappedId = batchFolderMap[String(batch.id)];
    if (mappedId) {
      const found = rackFolders.find((f) => f.id === mappedId);
      if (found) return found;
    }
    if (batch.status_retur === 'lewat_batas') {
      return rackFolders.find((f) => f.id === 'rak-karantina') || rackFolders[0];
    }
    const cat = inferMedicineCategory(batch, obatMap).toLowerCase();
    if (cat.includes('antibiotik') || cat.includes('hipertensi') || cat.includes('diabetes')) {
      return rackFolders.find((f) => f.id === 'rak-keras') || rackFolders[0];
    }
    if (cat.includes('topikal') || cat.includes('batuk') || cat.includes('sirup')) {
      return rackFolders.find((f) => f.id === 'rak-topikal') || rackFolders[0];
    }
    return rackFolders[0];
  }

  const catName = inferMedicineCategory(batch, obatMap);
  const lower = catName.toLowerCase();
  let tone = 'emerald';
  if (lower.includes('antibiotik')) tone = 'rose';
  else if (lower.includes('topikal') || lower.includes('anak')) tone = 'teal';
  else if (lower.includes('lambung') || lower.includes('batuk')) tone = 'amber';
  else if (lower.includes('suplemen') || lower.includes('vitamin')) tone = 'teal';

  return {
    id: `cat:${catName}`,
    name: catName,
    tone,
  };
}

export function groupBatchesIntoProducts(batchList) {
  const map = new Map();
  batchList.forEach((b) => {
    const key = b.obat_id ? `obat:${b.obat_id}` : `nama:${(b.nama_obat || '').toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        nama_obat: b.nama_obat,
        categoryLabel: b._folderName || '-',
        folderId: b._folderId,
        folderName: b._folderName,
        totalStok: 0,
        totalNilai: 0,
        batches: [],
        earliestEd: b.tanggal_kedaluwarsa || '9999-12-31',
        hasOverdueRetur: false,
        hasHighRisk: false,
      });
    }
    const prod = map.get(key);
    prod.batches.push(b);
    prod.totalStok += b.jumlah_saat_ini ?? 0;
    prod.totalNilai += b.nilai_total || 0;
    if (b.tanggal_kedaluwarsa && b.tanggal_kedaluwarsa < prod.earliestEd) {
      prod.earliestEd = b.tanggal_kedaluwarsa;
    }
    if (b.status_retur === 'lewat_batas') prod.hasOverdueRetur = true;
    if (b.status_risiko === 'tinggi' && b.status_retur !== 'lewat_batas') prod.hasHighRisk = true;
  });

  // Urutkan batch tiap produk berdasarkan FEFO (ED terdekat dulu)
  const products = Array.from(map.values());
  products.forEach((p) => {
    p.batches.sort((a, b) =>
      String(a.tanggal_kedaluwarsa || '').localeCompare(String(b.tanggal_kedaluwarsa || ''))
    );
  });

  return products.sort((a, b) => {
    if (b.hasOverdueRetur !== a.hasOverdueRetur) return b.hasOverdueRetur ? 1 : -1;
    if (b.hasHighRisk !== a.hasHighRisk) return b.hasHighRisk ? 1 : -1;
    return String(a.earliestEd).localeCompare(String(b.earliestEd));
  });
}
