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
  const TFIN = T800; // temps final (cumul)

  return {
    valid:true,
    raw: { T200, T400, T600, T800 },
    splits: { S200, S400, S600, TFIN },
    fmt: {
      S200: fmtTime(S200),
      S400: fmtTime(S400),
      S600: fmtTime(S600),
      TFIN: fmtTime(TFIN),
    }
  };
}

// ----------- Stockage local -----------
const LS_KEY = 'convertiscan.v2';
function saveId(id) { localStorage.setItem(LS_KEY+'.id', JSON.stringify(id)); }
function loadId() { try { return JSON.parse(localStorage.getItem(LS_KEY+'.id')||'{}'); } catch { return {}; } }

// ----------- Construction QR ScanProf (JSON direct, champs strictement demandés) -----------
// Ordre demandé: nom, prenom, classe, split_200, split_400, split_600, temps_800
function buildScanProfRecord({ nom, prenom, classe, splits }) {
  return {
    nom: (nom || '').toString().toUpperCase().trim(),
    prenom: (prenom || '').toString().trim(),
    classe: normalizeClasse(classe),
    split_200: Number(splits.S200.toFixed(2)),
    split_400: Number(splits.S400.toFixed(2)),
    split_600: Number(splits.S600.toFixed(2)),
    temps_800: Number(splits.TFIN.toFixed(2))
  };
}

function makeQR(containerId, payload) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const data = JSON.stringify(payload);
  new QRCode(el, { text: data, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.L });
}

// ----------- Helpers UI -----------
const $ = sel => document.querySelector(sel);
function getId() {
  return {
    nom: $('[name="nom"]')?.value?.trim() || '',
    prenom: $('[name="prenom"]')?.value?.trim() || '',
    classe: $('[name="classe"]')?.value?.trim() || ''
  };
}

function collectCourse(prefix) {
  const get = (name) => $(`[name="${prefix}_${name}"]`)?.value?.trim() || '';
  return {
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
    <span class="chip">Split 200 → ${f.S200}</span>
    <span class="chip">Split 400 → ${f.S400}</span>
    <span class="chip">Split 600 → ${f.S600}</span>
    <span class="chip">Temps 800 → ${f.TFIN}</span>
  `;
}

function handleLive(prefix, outId) {
  ['t200','t400','t600','t800'].forEach(k => {
    $(`[name="${prefix}_${k}"]`).addEventListener('input', () => {
      const v = collectCourse(prefix);
      const r = computeSplits(v.t200, v.t400, v.t600, v.t800);
      renderOut(outId, r);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Home identity save/load
  $('#saveId').addEventListener('click', () => {
    const id = getId(); saveId(id);
    alert('Identité enregistrée en local.');
  });
  $('#loadId').addEventListener('click', () => {
    const id = loadId();
    if (!id || (!id.nom && !id.prenom && !id.classe)) return alert('Aucune identité locale.');
    if ($('[name="nom"]')) $('[name="nom"]').value = id.nom || '';
    if ($('[name="prenom"]')) $('[name="prenom"]').value = id.prenom || '';
    if ($('[name="classe"]')) $('[name="classe"]').value = id.classe || '';
  });

  // Live compute per course
  handleLive('c1', 'c1_out');
  handleLive('c2', 'c2_out');

  // QR buttons per course
  document.querySelectorAll('[data-qr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = btn.getAttribute('data-qr').toLowerCase(); // c1 / c2
      const id = getId();
      if (!id.nom || !id.prenom || !id.classe) {
        return alert('Complète le nom, le prénom et la classe.');
      }
      const v = collectCourse(course);
      const r = computeSplits(v.t200, v.t400, v.t600, v.t800);
      if (!r.valid) return alert(r.error || 'Saisie incomplète/incorrecte.');
      const rec = buildScanProfRecord({ ...id, splits: r.splits });
      makeQR(`qr${course.toUpperCase()}`, rec);
    });
  });
});
