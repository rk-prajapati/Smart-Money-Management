/* ============================================================
   03-UTILS.JS
   UTILS — Small Helper Functions
   Tiny reusable helpers: DOM selectors ($), Indian currency format,
   short numbers (k/L/Cr), unique IDs, date maths (isoOf, addDays,
   rangeDays), HTML escaping for safety.
   ============================================================ */
'use strict';

/* ================= UTILS ================= */
function $(s){return document.querySelector(s);}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmtIN(n){return '₹'+Math.round(Number(n)||0).toLocaleString('en-IN');}
function compact(n){
  n=Number(n)||0; const a=Math.abs(n);
  if(a>=1e7) return (n/1e7).toFixed(1).replace(/\.0$/,'')+'Cr';
  if(a>=1e5) return (n/1e5).toFixed(1).replace(/\.0$/,'')+'L';
  if(a>=1000) return (n/1000).toFixed(1).replace(/\.0$/,'')+'k';
  return String(Math.round(n));
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function debounce(fn,ms){let t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}
function isoOf(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dateOf(iso){const p=String(iso).split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function todayISO(){return isoOf(new Date());}
function monthKey(d){return isoOf(d).slice(0,7);}
function rangeDays(n){
  const out=[],now=new Date();
  for(let i=n-1;i>=0;i--){out.push(isoOf(addDays(now,-i)));}
  return out;
}
function shortDate(iso){
  const d=dateOf(iso),now=new Date();
  const s=d.getDate()+' '+MONTHS[d.getMonth()];
  return d.getFullYear()===now.getFullYear()?s:s+' '+d.getFullYear();
}
function relDay(iso){
  if(iso===todayISO())return 'Today';
  if(iso===isoOf(addDays(new Date(),-1)))return 'Yesterday';
  return shortDate(iso);
}
function dayLab(iso){const d=dateOf(iso);return DAYS[d.getDay()]+', '+d.getDate()+' '+MONTHS[d.getMonth()];}
function axisLab(iso){const d=dateOf(iso);return d.getDate()+' '+MONTHS[d.getMonth()];}
