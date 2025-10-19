// ----------- Utilitaires temps -----------
function parseTimeToSeconds(str) {
  if (!str) return null;
  let s = String(str).trim().toLowerCase().replace(/\s+/g,'');
  s = s.replace(/s$/, '');
  s = s.replace(',', '.');
  s = s.replace(/’/g, "'");
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
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) - m*60;
  const sStr = s < 10 ? `0${s.toFixed(1)}` : s.toFixed(1);
  const sClean = sStr.endsWith('.0') ? sStr.slice(0, -2) : sStr;
  return `${m}:${sClean}`;
}
function normalizeClasse(input) {
  if (!input) return '';
  let s = input.toString().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  s = s.replace(/\s+/g,'');
  s = s.replace(/(EME|E|ÈME)/g, '');
  const m = s.match(/(\d{1,2})\s*([A-Z])/);
  if (m) return `${m[1]}${m[2]}`;
  const m2 = s.match(/(\d{1,2})/);
  return m2 ? m2[1] : s;
}
function computeSplits(t200c, t400c, t600c, t800c) {
  const T200 = parseTimeToSeconds(t200c);
  const T400 = parseTimeToSeconds(t400c);
  const T600 = parseTimeToSeconds(t600c);
  const T800 = parseTimeToSeconds(t800c);
  const valid = [T200, T400, T600, T800].every(v => v != null);
  if (!valid) return { valid:false, error: 'Saisie incomplète' };
  if (!(T200 <= T400 && T400 <= T600 && T600 <= T800)) {
    return { valid:false, error:'Cumul non croissant (200 ≤ 400 ≤ 600 ≤ 800).' };
  }
  const S200 = T200;
  const S400 = T400 - T200;
  const S600 = T600 - T400;
  const TFIN = T800;
  return {
    valid:true,
    splits: { S200, S400, S600, TFIN },
    fmt: { S200: fmtTime(S200), S400: fmtTime(S400), S600: fmtTime(S600), TFIN: fmtTime(TFIN) }
  };
}
const LS = 'convertiscan.v7';
const $ = (s)=>document.querySelector(s);

// ------- SEUL QR avec 2 courses (champs en mm:ss) -------
function buildOneQR({ nom, prenom, classe, c1fmt, c2fmt }) {
  return {
    nom: (nom||'').toUpperCase().trim(),
    prenom: (prenom||'').trim(),
    classe: normalizeClasse(classe),
    // Course 1 (mm:ss)
    split_200_c1: c1fmt.S200,
    split_400_c1: c1fmt.S400,
    split_600_c1: c1fmt.S600,
    temps_800_c1: c1fmt.TFIN,
    // Course 2 (mm:ss)
    split_200_c2: c2fmt.S200,
    split_400_c2: c2fmt.S400,
    split_600_c2: c2fmt.S600,
    temps_800_c2: c2fmt.TFIN
  };
}
function makeQR(containerId, payload){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const data = JSON.stringify(payload);
  new QRCode(el, { text: data, width: 260, height: 260, correctLevel: QRCode.CorrectLevel.L });
}
function getId(){ return { nom:$('[name="nom"]')?.value?.trim()||'', prenom:$('[name="prenom"]')?.value?.trim()||'', classe:$('[name="classe"]')?.value?.trim()||'' } }
function collectCourse(prefix){
  const get = (k)=> $(`[name="${prefix}_${k}"]`)?.value?.trim()||'';
  return { t200:get('t200'), t400:get('t400'), t600:get('t600'), t800:get('t800') };
}
function renderOut(id, r){
  const box = document.getElementById(id);
  if(!r||!r.valid){ box.innerHTML = r?.error ? `<span class="chip">${r.error}</span>` : ''; return; }
  const f=r.fmt;
  box.innerHTML = `<span class="chip">Split 200 → ${f.S200}</span>
  <span class="chip">Split 400 → ${f.S400}</span>
  <span class="chip">Split 600 → ${f.S600}</span>
  <span class="chip">Temps 800 → ${f.TFIN}</span>`;
}
function live(prefix,outId){
  ['t200','t400','t600','t800'].forEach(k=>{
    const el = document.querySelector(`[name="${prefix}_${k}"]`);
    if(!el) return;
    el.addEventListener('input', ()=>{
      const v = collectCourse(prefix);
      const r = computeSplits(v.t200,v.t400,v.t600,v.t800);
      renderOut(outId,r);
    }, { passive: true });
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  live('c1','c1_out'); live('c2','c2_out');

  const makeBtn = document.getElementById('makeOneQR');
  if(makeBtn) makeBtn.addEventListener('click',()=>{
    const id = getId();
    if(!id.nom||!id.prenom||!id.classe) { alert('Complète nom, prénom, classe.'); return; }
    const v1 = collectCourse('c1');
    const v2 = collectCourse('c2');
    const r1 = computeSplits(v1.t200,v1.t400,v1.t600,v1.t800);
    const r2 = computeSplits(v2.t200,v2.t400,v2.t600,v2.t800);
    if(!r1.valid || !r2.valid) { alert((r1.error||r2.error)||'Complète correctement les 2 courses.'); return; }
    const rec = buildOneQR({ nom:id.nom, prenom:id.prenom, classe:id.classe, c1fmt:r1.fmt, c2fmt:r2.fmt });
    makeQR('qrONE', rec);
    const hint = document.getElementById('qrHint');
    if(hint) hint.textContent = '✅ QR généré (mm:ss).';
    const preview = document.getElementById('jsonPreview');
    if(preview){ preview.textContent = JSON.stringify(rec, null, 2); preview.style.display='block'; }
  }, { passive: true });
});
