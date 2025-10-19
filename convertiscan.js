// ----------- Utilitaires temps -----------
function parseTimeToSeconds(str) {
  if (!str) return null;
  let s = String(str).trim().toLowerCase().replace(/\s+/g,'');
  s = s.replace(/s$/, '');          // retire "s" final
  s = s.replace(',', '.');          // virgule -> point
  s = s.replace(/’/g, "'");         // apostrophe typographique

  // formats: m:ss(.d), m'ss(.d), ss(.d)
  if (s.includes(':')) {
    const [m, rest] = s.split(':');
    const sec = parseFloat(rest);
    const min = parseInt(m, 10);
    if (isNaN(min) || isNaN(sec)) return null;
    return min * 60 + sec;
  } else if (s.includes("'")) {
    const [m, rest] = s.split("'");
    const sec = parseFloat(rest);
    const min = parseInt(m, 10);
    if (isNaN(min) || isNaN(sec)) return null;
    return min * 60 + sec;
  } else {
    const sec = parseFloat(s);
    if (isNaN(sec)) return null;
    return sec;
  }
}

function fmtTime(sec) {
  if (sec == null || isNaN(sec)) return '—';
  const sign = sec < 0 ? '-' : '';
  sec = Math.abs(sec);
  const m = Math.floor(sec / 60);
  const s = sec - m*60;
  const sStr = s < 10 ? `0${s.toFixed(1)}` : s.toFixed(1);
  const sClean = sStr.endsWith('.0') ? sStr.slice(0, -2) : sStr;
  return `${sign}${m}:${sClean}`;
}

// ----------- Normalisation classe (ex. "4ème b" -> "4B") -----------
function normalizeClasse(input) {
  if (!input) return '';
  let s = input.toString().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  s = s.replace(/\s+/g,'');
  s = s.replace(/(EME|E|ÈME)/g, ''); // 4EME/4E -> 4
  const m = s.match(/(\d{1,2})\s*([A-Z])/);
  if (m) return `${m[1]}${m[2]}`;
  const m2 = s.match(/(\d{1,2})/);
  return m2 ? m2[1] : s;
}

// ----------- Calcul des intermédiaires -----------
function computeSplits(t200c, t400c, t600c, t800c) {
  const T200 = parseTimeToSeconds(t200c);
  const T400 = parseTimeToSeconds(t400c);
  const T600 = parseTimeToSeconds(t600c);
  const T800 = parseTimeToSeconds(t800c);

  const valid = [T200, T400, T600, T800].every(v => v != null);
  if (!valid) return { valid:false };

  if (!(T200 <= T400 && T400 <= T600 && T600 <= T800)) {
    return { valid:false, error:'Les temps cumulés doivent être croissants (200 ≤ 400 ≤ 600 ≤ 800).' };
  }

  const S200 = T200;
  const S400 = T400 - T200;
  const S600 = T600 - T400;
  const S800 = T800; // temps final (cumul)

  return {
    valid:true,
    raw: { T200, T400, T600, T800 },
    splits: { S200, S400, S600, S800 },
    fmt: {
      S200: fmtTime(S200),
      S400: fmtTime(S400),
      S600: fmtTime(S600),
      S800: fmtTime(S800),
    }
  };
}

// ----------- Stockage local (clé par élève A/B) -----------
const LS_KEY = 'convertiscan.v1';
function saveLocal(slot, data) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  all[slot] = data;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}
function loadLocal(slot) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  return all[slot] || null;
}

// ----------- Construction QR ScanProf (JSON direct, 1 élève = 1 enregistrement) -----------
function buildScanProfRecord({ nom, prenom, classe, cumuls, splits }) {
  return {
    nom: (nom || '').toString().toUpperCase().trim(),
    prenom: (prenom || '').toString().trim(),
    classe: normalizeClasse(classe),
    extras: {
      epreuve: '800m',
      cumul_200: cumuls.T200,
      cumul_400: cumuls.T400,
      cumul_600: cumuls.T600,
      cumul_800: cumuls.T800,
      split_200: splits.S200,
      split_400: splits.S400,
      split_600: splits.S600
    }
  };
}

function makeQR(containerId, payload) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const data = JSON.stringify(payload);
  new QRCode(el, { text: data, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.L });
}

// ----------- Liaison UI -----------
function collect(prefix) {
  const get = name => document.querySelector(`[name="${prefix}_${name}"]`)?.value?.trim() || '';
  return {
    nom: get('nom'),
    prenom: get('prenom'),
    classe: get('classe'),
    t200: get('t200'),
    t400: get('t400'),
    t600: get('t600'),
    t800: get('t800'),
  };
}

function renderOut(id, result) {
  const box = document.getElementById(id);
  if (!result || !result.valid) {
    box.innerHTML = result?.error ? `<span class="chip">${result.error}</span>` : '';
    return;
  }
  const f = result.fmt;
  box.innerHTML = `
    <span class="chip">200 → ${f.S200}</span>
    <span class="chip">400 → ${f.S400}</span>
    <span class="chip">600 → ${f.S600}</span>
    <span class="chip">800 (total) → ${f.S800}</span>
  `;
}

function handleLive(prefix, outId) {
  const inputs = ['t200','t400','t600','t800'].map(s => document.querySelector(`[name="${prefix}_${s}"]`));
  inputs.forEach(inp => inp.addEventListener('input', () => {
    const v = collect(prefix);
    const r = computeSplits(v.t200, v.t400, v.t600, v.t800);
    renderOut(outId, r);
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  handleLive('a', 'a_out');
  handleLive('b', 'b_out');

  document.querySelectorAll('[data-save]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.getAttribute('data-save');
      const v = collect(slot.toLowerCase());
      saveLocal(`eleve_${slot}`, v);
      alert(`Élève ${slot} enregistré en local.`);
    });
  });
  document.querySelectorAll('[data-load]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.getAttribute('data-load');
      const v = loadLocal(`eleve_${slot}`);
      if (!v) return alert(`Aucune donnée locale pour ${slot}.`);
      const set = (name, val) => { const el = document.querySelector(`[name="${slot.toLowerCase()}_${name}"]`); if (el) el.value = val || ''; };
      Object.entries(v).forEach(([k,val]) => set(k, val));
      const r = computeSplits(v.t200, v.t400, v.t600, v.t800);
      renderOut(`${slot.toLowerCase()}_out`, r);
    });
  });

  document.querySelectorAll('[data-qr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.getAttribute('data-qr').toLowerCase();
      const v = collect(slot);
      const r = computeSplits(v.t200, v.t400, v.t600, v.t800);
      if (!r.valid) return alert(r.error || 'Saisie incomplète/incorrecte.');

      const rec = buildScanProfRecord({
        nom: v.nom, prenom: v.prenom, classe: v.classe,
        cumuls: r.raw, splits: r.splits
      });
      makeQR(`qr${slot.toUpperCase()}`, rec);
    });
  });
});
