// Parse/format
function parseTimeToSeconds(str){if(!str)return null;let s=String(str).trim().toLowerCase().replace(/\s+/g,"");s=s.replace(/s$/,"").replace(",","." ).replace(/’/g,"'");if(s.includes(":")){const[m,r]=s.split(":");const sec=parseFloat(r);const min=parseInt(m,10);if(isNaN(min)||isNaN(sec))return null;return min*60+sec}else if(s.includes("'")){const[m,r]=s.split("'");const sec=parseFloat(r);const min=parseInt(m,10);if(isNaN(min)||isNaN(sec))return null;return min*60+sec}else{const sec=parseFloat(s);return isNaN(sec)?null:sec}}
function fmt(sec){if(sec==null||isNaN(sec))return"—";const m=Math.floor(sec/60);const s=sec-m*60;const t=s<10?`0${s.toFixed(1)}`:s.toFixed(1);return t.endsWith(".0")?`${m}:${t.slice(0,-2)}`:`${m}:${t}`}
function compute(t200,t400,t600,t800){const T200=parseTimeToSeconds(t200),T400=parseTimeToSeconds(t400),T600=parseTimeToSeconds(t600),T800=parseTimeToSeconds(t800);if([T200,T400,T600,T800].some(v=>v==null))return{ok:false,err:"Saisie incomplète"};if(!(T200<=T400&&T400<=T600&&T600<=T800))return{ok:false,err:"Cumuls non croissants"};const S200=T200,S400=T400-T200,S600=T600-T400,TFIN=T800;return{ok:true,raw:{T200,T400,T600,T800},fmt:{S200:fmt(S200),S400:fmt(S400),S600:fmt(S600),TFIN:fmt(TFIN)}}}

function makeTempsString(c1,c2){return `C1 200:${c1.S200} 400:${c1.S400} 600:${c1.S600} 800:${c1.TFIN} | C2 200:${c2.S200} 400:${c2.S400} 600:${c2.S600} 800:${c2.TFIN}`}

document.addEventListener("DOMContentLoaded",()=>{
  const $=q=>document.querySelector(q);
  function collect(prefix){const g=k=>$(`[name="${prefix}_${k}"]`)?.value?.trim()||"";return{t200:g("t200"),t400:g("t400"),t600:g("t600"),t800:g("t800")}}
  function renderOut(id,r){const el=document.getElementById(id);if(!el)return;if(!r||!r.ok){el.textContent=r?.err||"";return}const f=r.fmt;el.textContent=`200:${f.S200} • 400:${f.S400} • 600:${f.S600} • 800:${f.TFIN}`}

  ["c1","c2"].forEach(p=>["t200","t400","t600","t800"].forEach(k=>{
    const el=document.querySelector(`[name="${p}_${k}"]`); if(!el)return;
    el.addEventListener("input",()=>{const v=collect(p); const r=compute(v.t200,v.t400,v.t600,v.t800); renderOut(p+"_out",r);}, {passive:true});
  }));

  document.getElementById("makeOneQR").addEventListener("click",()=>{
    const nom=$('[name="nom"]').value.trim(), prenom=$('[name="prenom"]').value.trim(), classe=$('[name="classe"]').value.trim();
    if(!nom||!prenom||!classe){alert("Complète nom, prénom, classe.");return;}
    const v1=collect("c1"), v2=collect("c2");
    const r1=compute(v1.t200,v1.t400,v1.t600,v1.t800), r2=compute(v2.t200,v2.t400,v2.t600,v2.t800);
    if(!r1.ok||!r2.ok){alert((r1.err||r2.err)||"Complète correctement les 2 courses.");return;}

    // Compose a single record using ScanProf mapping (put detail in 'temps')
    const record = {
      person: { nom, prenom, classe },
      run: {
        // IMPORTANT: 'temps' is a single field ScanProf affiche — we format BOTH courses here
        temps: makeTempsString(r1.fmt, r2.fmt),
        // Extras keep structured splits (si jamais utilisés ailleurs)
        split_200_c1: r1.fmt.S200, split_400_c1: r1.fmt.S400, split_600_c1: r1.fmt.S600, temps_800_c1: r1.fmt.TFIN,
        split_200_c2: r2.fmt.S200, split_400_c2: r2.fmt.S400, split_600_c2: r2.fmt.S600, temps_800_c2: r2.fmt.TFIN
      }
    };

    // Use the provided ScanProf generator (ensures proper mapping)
    makeScanProfQR(record, "qrONE", { width: 280 });
    document.getElementById("qrHint").textContent = "✅ QR généré : le champ TEMPS contient tout le détail (C1 & C2).";
  });
});
