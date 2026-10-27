/* ============================================================
   02-STORAGE.JS
   STORAGE — localStorage Database + Data Queries
   The app's "database": saves/loads everything as JSON in browser
   localStorage (key: smartpaisa_v1) + all data queries
   (range totals, daily totals, category breakdown, month filter).
   ============================================================ */
'use strict';

/* ================= STORAGE ================= */
function defaultDB(){
  return {txns:[],budgets:{overall:0,cats:{}},goals:[],settings:{theme:'light'},seenWelcome:false};
}
let db=defaultDB();
let persistent=true;
try{ localStorage.setItem('__sp_t','1'); localStorage.removeItem('__sp_t'); }
catch(e){ persistent=false; }
function saveDB(){
  if(!persistent) return;
  try{ localStorage.setItem('smartpaisa_v1',JSON.stringify(db)); }catch(e){}
}
function loadDB(){
  if(!persistent) return;
  try{
    const raw=localStorage.getItem('smartpaisa_v1');
    if(raw){
      const p=JSON.parse(raw);
      db={...defaultDB(),...p};
      db.budgets={...defaultDB().budgets,...(p.budgets||{})};
      db.settings={...defaultDB().settings,...(p.settings||{})};
      db.txns=Array.isArray(p.txns)?p.txns:[];
      db.goals=Array.isArray(p.goals)?p.goals:[];
    }
  }catch(e){}
}

/* ================= DATA HELPERS ================= */
function sumBy(list,type){let s=0;for(let i=0;i<list.length;i++){if(list[i].type===type)s+=list[i].amount;}return s;}
function txnsIn(days){
  const isos=rangeDays(days),from=isos[0],to=isos[isos.length-1];
  return db.txns.filter(function(t){return t.date>=from&&t.date<=to;});
}
function sumDay(iso,type){
  let s=0;
  for(let i=0;i<db.txns.length;i++){const t=db.txns[i];if(t.date===iso&&t.type===type)s+=t.amount;}
  return s;
}
function dailyTotals(isos){
  const m={};isos.forEach(function(i){m[i]=0;});
  db.txns.forEach(function(t){if(t.type==='expense'&&Object.prototype.hasOwnProperty.call(m,t.date))m[t.date]+=t.amount;});
  return isos.map(function(i){return {iso:i,v:m[i]};});
}
function aggByCat(list){
  const m={};
  list.forEach(function(t){if(t.type==='expense'){m[t.cat]=(m[t.cat]||0)+t.amount;}});
  return m;
}
function monthTxns(){
  const mk=monthKey(new Date());
  return db.txns.filter(function(t){return t.date.slice(0,7)===mk;});
}
function sortedTxns(){
  return db.txns.slice().sort(function(a,b){return a.date===b.date?b.ts-a.ts:(b.date>a.date?1:-1);});
}
