
/* scanprof-embed.js — Générateur de QR JSON direct compatibles ScanProf (MDM-safe)
   - Ne crée aucun champ artificiel ; mappe uniquement ce qui existe.
   - Normalise la classe (4ème/4e/4eme/4 a → 4A/4B…).
   - Un QR = 1 enregistrement logique (ex. 1 élève × 1 mesure).
   - QR correction level = L. En cas d'overflow, réessaie sans "extras".
   - Expose : normalizeClasse, makeScanProfQR, renderScanProfUI, downloadScanProfQR
*/

(function(){
  function stripAccents(s){return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
  function toFixed2(v){const n=Number(v);return isFinite(n)?Number(n.toFixed(2)):0;}
  function toInt(v){const n=parseInt(String(v??"").trim(),10);return Number.isFinite(n)?n:0;}

  function normalizeClasse(raw){
    let s = stripAccents(String(raw||"")).toUpperCase().replace(/\s+/g,"");
    s = s.replace(/EME/g,"E"); // 4EME -> 4E
    const m = s.match(/(\d{1,2})\s*([A-Z])/);
    if(m) return `${m[1]}${m[2]}`;
    const n = s.match(/(\d{1,2})/);
    return n ? `${n[1]}` : s;
  }

  // Mappe un enregistrement (person/run) -> JSON ScanProf minimal + extras
  function mapToScanProf(rec){
    const person = rec.person || rec; // nom/prenom/classe/sexe
    const run    = rec.run    || rec; // distance/vitesse/...

    const out = {
      nom:     String(person.nom||person.Nom||person.name||"").toUpperCase().trim(),
      prenom:  String(person.prenom||person.Prenom||person.firstName||"").trim(),
      classe:  normalizeClasse(person.classe||person.Classe||person.class||person["classe_eleve"]),
      sexe:    (String(person.sexe||person.Sexe||person.gender||"").toUpperCase().startsWith("F")?"F"
              : String(person.sexe||person.Sexe||person.gender||"").toUpperCase().startsWith("M")?"M":"")
    };

    if (run.distance!=null || run.m!=null || run["distance_m"]!=null)
      out.distance = toInt(run.distance ?? run.m ?? run["distance_m"]);
    if (run.vitesse!=null || run.speed!=null)
      out.vitesse  = toFixed2(run.vitesse ?? run.speed);

    // Collecte extras (sans champs vides) — uniquement si présents
    const extras = {};
    const baseKeys = new Set(Object.keys(out));
    Object.keys(run||{}).forEach(k=>{
      const v = run[k];
      if (!baseKeys.has(k) && v!==undefined && v!==null && v!=="") extras[k]=v;
    });
    // Infos annexes possibles côté "person"
    ["temps","time","difficulte","blocs","bloc_reussis","bloc_reussit","vma","session","app"]
      .forEach(k=>{ const v=person[k]; if(v!==undefined && v!==null && v!=="") extras[k]=v; });

    if (Object.keys(extras).length) out.extras = extras;
    return out;
  }

  // Génère le QR dans targetId — essai avec extras puis sans extras si overflow
  function makeScanProfQR(rows, targetId, opts){
    const el = document.getElementById(targetId);
    if (!el) return console.error("[ScanProf] conteneur introuvable:", targetId);
    el.innerHTML = "";
    const list = Array.isArray(rows)? rows : [rows];
    const size = (opts && opts.width) || 256;

    function render(mapped){
      if (!window.QRCode) throw new Error("QRCode lib absente");
      new QRCode(el, { text: JSON.stringify(mapped), width:size, height:size, correctLevel: QRCode.CorrectLevel.L });
    }
    try {
      render(list.map(mapToScanProf));           // essai avec extras
    } catch(e1) {
      try {
        const trimmed = list.map(r=>{ const o=mapToScanProf(r); delete o.extras; return o; });
        render(trimmed);                         // essai sans extras
      } catch(e2) {
        console.error("[ScanProf] overflow/QR error:", e2.message||e2);
        el.innerHTML = "<div style='max-width:28rem'><p><strong>QR trop volumineux</strong> ou librairie absente.</p></div>";
      }
    }
  }

  // UI : 1 QR = 1 mesure (course). Crée des boutons et une modale (voir template HTML).
  function renderScanProfUI(dataset){
    const data = Array.isArray(dataset)? dataset : [dataset];
    const btns  = document.getElementById("qrButtons");
    const modal = document.getElementById("qrModal");
    const full  = document.getElementById("qrFull");
    const close = document.getElementById("closeModal");
    if (!btns || !modal || !full || !close) return;

    btns.innerHTML = "";
    data.forEach(person=>{
      let runs=[];
      if (Array.isArray(person.runs)) runs = person.runs;
      else if (Array.isArray(person.courses)) runs = person.courses;
      else if (Array.isArray(person.mesures)) runs = person.mesures;
      else if (person.course) runs = [person.course];
      else runs = [person]; // fallback

      runs.forEach((run, i)=>{
        const b = document.createElement("button");
        const nom = String(person.nom||person.Nom||person.name||"").toUpperCase().trim();
        const prenom = String(person.prenom||person.Prenom||person.firstName||"").trim();
        const classe = normalizeClasse(person.classe||person.Classe||person.class||person["classe_eleve"]);
        b.textContent = `📱 QR • ${prenom} ${nom} — ${classe} • Mesure ${i+1}`;
        b.addEventListener("click", ()=>{
          full.innerHTML = "";
          makeScanProfQR([{person, run}], "qrFull", { width:640, keepExtras:true });
          modal.classList.add("active");
        });
        const wrap = document.createElement("div"); wrap.appendChild(b); btns.appendChild(wrap);
      });
    });

    close.addEventListener("click", ()=> modal.classList.remove("active"));
    modal.addEventListener("click", (e)=>{ if(e.target===modal) modal.classList.remove("active"); });
  }

  function downloadScanProfQR(targetId, filename){
    const el = document.getElementById(targetId);
    if (!el) return;
    let dataURL, canvas = el.querySelector("canvas"), img = el.querySelector("img");
    if (canvas) dataURL = canvas.toDataURL("image/png"); else if (img) dataURL = img.src;
    if (!dataURL) return;
    const a = document.createElement("a"); a.href=dataURL; a.download=filename||"ScanProf_QR.png";
    document.body.appendChild(a); a.click(); a.remove();
  }

  window.normalizeClasse = normalizeClasse;
  window.makeScanProfQR = makeScanProfQR;
  window.renderScanProfUI = renderScanProfUI;
  window.downloadScanProfQR = downloadScanProfQR;
})();
