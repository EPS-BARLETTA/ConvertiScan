// --- Utils ---
function parseTimeToSeconds(str){if(!str)return null;let s=String(str).trim().toLowerCase().replace(/\s+/g,"");s=s.replace(/s$/,"").replace(",","." ).replace(/’/g,"'");if(s.includes(":")){const[m,r]=s.split(":");const sec=parseFloat(r);const min=parseInt(m,10);if(isNaN(min)||isNaN(sec))return null;return min*60+sec}else if(s.includes("'")){const[m,r]=s.split("'");const sec=parseFloat(r);const min=parseInt(m,10);if(isNaN(min)||isNaN(sec))return null;return min*60+sec}else{const sec=parseFloat(s);return isNaN(sec)?null:sec}}
function fmt(sec){if(sec==null||isNaN(sec))return"—";const m=Math.floor(sec/60);const s=sec-m*60;const t=s<10?`0${s.toFixed(1)}`:s.toFixed(1);return t.endsWith(".0")?`${m}:${t.slice(0,-2)}`:`${m}:${t}`}
function compute(t200,t400,t600,t800){const T200=parseTimeToSeconds(t200),T400=parseTimeToSeconds(t400),T600=parseTimeToSeconds(t600),T800=parseTimeToSeconds(t800);if([T200,T400,T600,T800].some(v=>v==null))return{ok:false,err:"Saisie incomplète"};if(!(T200<=T400&&T400<=T600&&T600<=T800))return{ok:false,err:"Cumuls non croissants"};const S200=T200,S400=T400-T200,S600=T600-T400,TFIN=T800;return{ok:true,fmt:{S200:fmt(S200),S400:fmt(S400),S600:fmt(S600),TFIN:fmt(TFIN)}}}
function collect(p){const g=k=>document.querySelector(`[name="${p}_${k}"]`)?.value?.trim()||"";return{t200:g("t200"),t400:g("t400"),t600:g("t600"),t800:g("t800")}}
function renderOut(id,r){const el=document.getElementById(id);if(!el)return;if(!r||!r.ok){el.textContent=r?.err||"";return}const f=r.fmt;el.textContent=`200:${f.S200} • 400:${f.S400} • 600:${f.S600} • 800:${f.TFIN}`}
function ensureQRReady(){ if(!window.QRCode){ alert('Librairie QR manquante. Ouvre la page "saisie.html" depuis des fichiers extraits (pas dans le ZIP) et hors mode "Lecteur" iOS.'); return false; } return true; }

document.addEventListener("DOMContentLoaded",()=>{
  ["c1","c2"].forEach(p=>["t200","t400","t600","t800"].forEach(k=>{
    const el=document.querySelector(`[name="${p}_${k}"]`); if(!el) return;
    el.addEventListener("input",()=>{const v=collect(p); const r=compute(v.t200,v.t400,v.t600,v.t800); renderOut(p+"_out",r);},{passive:true});
  }));
  const btn = document.getElementById("makeOneQR");
  btn.addEventListener("click",()=>{
    if(!ensureQRReady()) return;
    const nom=document.querySelector('[name="nom"]').value.trim();
    const prenom=document.querySelector('[name="prenom"]').value.trim();
    const classe=document.querySelector('[name="classe"]').value.trim();
    if(!nom||!prenom||!classe){alert("Complète nom, prénom, classe.");return;}
    const v1=collect("c1"), v2=collect("c2");
    const r1=compute(v1.t200,v1.t400,v1.t600,v1.t800);
    const r2=compute(v2.t200,v2.t400,v2.t600,v2.t800);
    if(!r1.ok||!r2.ok){alert((r1.err||r2.err)||"Complète correctement les 2 courses.");return;}
    const course1 = `800:${r1.fmt.TFIN} | 200:${r1.fmt.S200} 400:${r1.fmt.S400} 600:${r1.fmt.S600}`;
    const course2 = `800:${r2.fmt.TFIN} | 200:${r2.fmt.S200} 400:${r2.fmt.S400} 600:${r2.fmt.S600}`;
    const payload = { nom, prenom, classe, course1, course2 };
    const el=document.getElementById("qrONE"); el.innerHTML="";
    try {
      new QRCode(el,{text:JSON.stringify(payload),width:280,height:280,correctLevel:QRCode.CorrectLevel.L});
      document.getElementById("qrHint").textContent="✅ QR généré : 2 colonnes (course1 / course2)";
      const preview=document.getElementById("jsonPreview"); if(preview){preview.textContent=JSON.stringify(payload,null,2); preview.style.display="block";}
    } catch(e){
      alert("Erreur QR: " + e.message);
    }
  }, {passive:true});
});