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
  if (!valid) return { valid:false };
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
const LS = 'convertiscan.v4';
function saveId(id){ localStorage.setItem(LS+'.id', JSON.stringify(id)); }
function loadId(){ try{return JSON.parse(localStorage.getItem(LS+'.id')||'{}')}catch{return {}} }

// ------- Construction d'un SEUL QR avec 2 courses (flat fields) -------
function buildOneQR({ nom, prenom, classe, c1, c2 }) {
  return {
    nom: (nom||'').toUpperCase().trim(),
    prenom: (prenom||'').trim(),
    classe: normalizeClasse(classe),
    // Course 1
    split200_1: Number(c1.S200.toFixed(2)),
    split400_1: Number(c1.S400.toFixed(2)),
    split600_1: Number(c1.S600.toFixed(2)),
    temps800_1: Number(c1.TFIN.toFixed(2)),
    // Course 2
    split200_2: Number(c2.S200.toFixed(2)),
    split400_2: Number(c2.S400.toFixed(2)),
    split600_2: Number(c2.S600.toFixed(2)),
    temps800_2: Number(c2.TFIN.toFixed(2))
  };
}

function makeQR(containerId, payload){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const data = JSON.stringify(payload);
  new QRCode(el, { text: data, width: 260, height: 260, correctLevel: QRCode.CorrectLevel.L });
}
const $ = (s)=>document.querySelector(s);
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
    el.addEventListener('input', ()=>{
      const v = collectCourse(prefix);
      const r = computeSplits(v.t200,v.t400,v.t600,v.t800);
      renderOut(outId,r);
    });
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('saveId').addEventListener('click',()=>{ saveId(getId()); alert('Identité enregistrée.'); });
  document.getElementById('loadId').addEventListener('click',()=>{
    const id = loadId();
    if(!id || (!id.nom && !id.prenom && !id.classe)) return alert('Aucune identité locale.');
    const nom = document.querySelector('[name="nom"]'); if(nom) nom.value = id.nom||'';
    const prenom = document.querySelector('[name="prenom"]'); if(prenom) prenom.value = id.prenom||'';
    const classe = document.querySelector('[name="classe"]'); if(classe) classe.value = id.classe||'';
  });
  live('c1','c1_out'); live('c2','c2_out');

  document.getElementById('makeOneQR').addEventListener('click',()=>{
    const id = getId();
    if(!id.nom||!id.prenom||!id.classe) return alert('Complète nom, prénom, classe.');
    const v1 = collectCourse('c1');
    const v2 = collectCourse('c2');
    const r1 = computeSplits(v1.t200,v1.t400,v1.t600,v1.t800);
    const r2 = computeSplits(v2.t200,v2.t400,v2.t600,v2.t800);
    if(!r1.valid || !r2.valid) return alert('Complète correctement les 2 courses (cumuls croissants).');
    const rec = buildOneQR({ nom:id.nom, prenom:id.prenom, classe:id.classe, c1:r1.splits, c2:r2.splits });
    makeQR('qrONE', rec);
    document.getElementById('qrHint').textContent = 'QR généré : 1 élève, 2 courses (champs à plat).';
  });
});
