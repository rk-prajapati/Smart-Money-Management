/* ============================================================
   07-ACTIONS.JS
   ACTIONS — What Happens When User Does Something
   Add/edit/delete transaction (the + keypad sheet), savings goals
   (create / add money / delete), budget editing, CSV export,
   demo data generator.
   ============================================================ */
'use strict';

/* ================= TXN SHEET ================= */
function fmtAmtStr(s){
  if(s==='')return '0';
  if(s.indexOf('.')===-1){
    return (+s).toLocaleString('en-IN');
  }
  const parts=s.split('.');
  const ii=parts[0]===''?'0':(+parts[0]).toLocaleString('en-IN');
  return ii+'.'+parts[1];
}
function updAmt(){
  $('#amtDisplay').textContent='₹'+fmtAmtStr(amtStr);
}
function setSheetType(t){
  if(sheetType===t)return;
  sheetType=t;
  const valid=CATS[t].some(function(c){return c.id===selCat[t];});
  if(!valid)selCat[t]=CATS[t][0].id;
  syncSheet();
}
function syncSheet(){
  $('#segExp').className=sheetType==='expense'?'on':'';
  $('#segInc').className=sheetType==='income'?'on':'';
  const ad=$('#amtDisplay');
  ad.textContent='₹'+fmtAmtStr(amtStr);
  ad.className='amt-display '+sheetType;
  buildCatGrid();
  syncMethodRow();
}
function buildCatGrid(){
  $('#catGrid').innerHTML=CATS[sheetType].map(function(c){
    return '<div class="cat-chip '+(selCat[sheetType]===c.id?'sel':'')+'" data-cat="'+c.id+
      '"><span class="ci">'+c.icon+'</span><span class="cn">'+c.name+'</span></div>';
  }).join('');
}
function syncMethodRow(){
  $('#methodRow').innerHTML=METHODS.map(function(m){
    return '<div class="mchip '+(selMethod===m.id?'sel':'')+'" data-m="'+m.id+'">'+m.i+' '+m.n+'</div>';
  }).join('');
}
function openTxnSheet(id){
  editId=id||null;
  const t=id?db.txns.find(function(x){return x.id===id;}):null;
  sheetType=t?t.type:'expense';
  amtStr=t?String(t.amount):'';
  if(t){selCat[sheetType]=t.cat;selMethod=t.method;}
  else{const valid=CATS[sheetType].some(function(c){return c.id===selCat[sheetType];});if(!valid)selCat[sheetType]=CATS[sheetType][0].id;selMethod='upi';}
  $('#noteInput').value=t?(t.note||''):'';
  $('#dateInput').value=t?t.date:todayISO();
  $('#delTxn').classList.toggle('hidden',!t);
  syncSheet();
  $('#backdrop').classList.add('show');
  $('#txnSheet').classList.add('show');
}
function closeSheet(){
  $('#txnSheet').classList.remove('show');
  $('#goalSheet').classList.remove('show');
  $('#backdrop').classList.remove('show');
  editId=null;
}
function keyPress(k){
  if(k==='⌫'){amtStr=amtStr.slice(0,-1);}
  else if(k==='C'){amtStr='';}
  else if(k==='.'){
    if(amtStr.indexOf('.')===-1)amtStr=(amtStr||'0')+'.';
  }else{
    for(let ci=0;ci<k.length;ci++){
      const ch=k[ci];
      if(amtStr.indexOf('.')!==-1){
        const dec=amtStr.split('.')[1];
        if(dec.length<2)amtStr+=ch;
      }else{
        if(amtStr===''){amtStr=ch;}
        else if(amtStr==='0'){if(ch!=='0')amtStr=ch;}
        else if(amtStr.length<7){amtStr+=ch;}
      }
    }
  }
  updAmt();
}
function saveTxn(){
  const amount=parseFloat(amtStr);
  if(!amount||amount<=0){toast('Please enter an amount 🙂');return;}
  const data={
    type:sheetType,
    amount:Math.round(amount*100)/100,
    cat:selCat[sheetType],
    note:$('#noteInput').value.trim().slice(0,60),
    date:$('#dateInput').value||todayISO(),
    method:selMethod
  };
  if(editId){
    const t=db.txns.find(function(x){return x.id===editId;});
    if(t)Object.assign(t,data,{ts:Date.now()});
    toast('Updated ✅');
  }else{
    db.txns.push(Object.assign({id:uid(),ts:Date.now()},data));
    toast('Saved ✅');
  }
  saveDB();
  closeSheet();
  renderView(currentView);
}

/* ================= GOALS ================= */
function openGoalSheet(){
  goalEmoji='🎯';
  $('#gName').value='';
  $('#gTarget').value='';
  $('#gDate').value='';
  syncGemGrid();
  $('#backdrop').classList.add('show');
  $('#goalSheet').classList.add('show');
}
function syncGemGrid(){
  $('#gemGrid').innerHTML=GEMOJIS.map(function(e){
    return '<div class="gemoji '+(goalEmoji===e?'sel':'')+'" data-e="'+e+'">'+e+'</div>';
  }).join('');
}
function saveGoal(){
  const name=$('#gName').value.trim();
  const target=parseFloat($('#gTarget').value);
  if(!name){toast('Please name your goal 🙂');return;}
  if(!target||target<=0){toast('Please set a target amount 🙂');return;}
  db.goals.push({id:uid(),emoji:goalEmoji,name:name,target:Math.round(target),saved:0,deadline:$('#gDate').value||null});
  saveDB();closeSheet();renderView(currentView);
  toast('Goal created 🎯');
}
function addGoalMoney(id,amt,ev){
  const g=db.goals.find(function(x){return x.id===id;});
  if(!g||!(amt>0))return;
  const before=g.saved;
  g.saved=Math.round(g.saved+amt);
  saveDB();
  if(before<g.target&&g.saved>=g.target){
    confettiAt(ev?ev.clientX:null,ev?ev.clientY:null);
    toast('🎉 "'+g.name+'" complete! Congratulations!');
  }else{
    toast(fmtIN(amt)+' added 💪');
  }
  renderView(currentView);
}

/* ================= BUDGET EDIT ================= */
function startBudEdit(btn){
  const cat=btn.getAttribute('data-cat');
  const cur=cat==='__all'?db.budgets.overall:(db.budgets.cats[cat]||0);
  const holder=btn.parentElement;
  const inp=document.createElement('input');
  inp.type='number';inp.min='0';inp.step='any';
  inp.className='bud-input';
  inp.setAttribute('data-cat',cat);
  inp.value=cur>0?cur:'';
  inp.placeholder='₹ budget';
  holder.innerHTML='';
  holder.appendChild(inp);
  inp.focus();inp.select();
}
function commitBud(inp){
  if(!inp.isConnected)return;
  const cat=inp.getAttribute('data-cat');
  const v=Math.max(0,parseFloat(inp.value)||0);
  if(cat==='__all'){db.budgets.overall=Math.round(v);}
  else{
    if(v>0)db.budgets.cats[cat]=Math.round(v);
    else delete db.budgets.cats[cat];
  }
  saveDB();
  toast(v>0?'Budget saved ✅':'Budget removed');
  renderView(currentView);
}

/* ================= DATA OPS ================= */
function exportCSV(){
  if(!db.txns.length){toast('Add some transactions first 🙂');return;}
  const rows=[['Date','Type','Category','Amount (INR)','Note','Method']];
  sortedTxns().slice().reverse().forEach(function(t){
    const c=CATMAP[t.cat]||CATMAP.other;
    const m=METHODS.find(function(x){return x.id===t.method;});
    rows.push([t.date,t.type,c.name,t.amount,t.note||'',m?m.n:'']);
  });
  const csv=rows.map(function(r){
    return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');
  }).join('\n');
  try{
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='smartmoney-export.csv';
    document.body.appendChild(a);a.click();a.remove();
    toast('CSV downloading 📄');
  }catch(e){toast('Download failed — it may be blocked in preview.');}
}
function seedDemo(){
  const txns=[];
  const now=new Date();
  const methodPool=['upi','upi','upi','cash','card','bank'];
  function add(daysBack,type,cat,amount,note){
    txns.push({
      id:uid(),type:type,cat:cat,amount:Math.round(amount),note:note||'',
      date:isoOf(addDays(now,-daysBack)),
      method:pick(methodPool),
      ts:Date.now()-daysBack*86400000-Math.floor(Math.random()*40000000)
    });
  }
  const foods=['Swiggy','Zomato','Chai + samosa','Office lunch','Dinner','Breakfast','Coffee'];
  const shops=['Myntra','Amazon','Kurta','Shoes','Gift'];
  const funs=['Movie','Netflix','Concert','Game'];
  for(let d=95;d>=0;d--){
    const dt=addDays(now,-d);
    const dow=dt.getDay(),dom=dt.getDate();
    if(dom===1){add(d,'income','salary',68000,'Monthly salary');add(d,'expense','rent',15000,'Rent');}
    if(dom===5){add(d,'expense','bills',900+Math.random()*900,'Electricity bill');}
    if(dom===7){add(d,'expense','bills',239+Math.random()*160,'Mobile recharge');}
    if(dom===12){add(d,'expense','bills',599,'WiFi');}
    if(dow===0&&Math.random()<0.85){add(d,'expense','grocery',700+Math.random()*1600,pick(['BigBasket','Kirana store','Vegetable market']));}
    if(Math.random()<(dow===0||dow===6?0.75:0.5)){add(d,'expense','food',90+Math.random()*480,pick(foods));}
    if(Math.random()<0.15){add(d,'expense','food',30+Math.random()*90,pick(['Chai','Coffee','Snacks']));}
    if(Math.random()<0.5){add(d,'expense','transport',35+Math.random()*150,pick(['Auto','Cab','Metro']));}
    if(dow===4&&Math.random()<0.5){add(d,'expense','fuel',900+Math.random()*700,'Petrol');}
    if(Math.random()<0.08){add(d,'expense','shopping',500+Math.random()*3200,pick(shops));}
    if(Math.random()<0.12){add(d,'expense','fun',150+Math.random()*650,pick(funs));}
    if(Math.random()<0.05){add(d,'expense','health',250+Math.random()*1100,pick(['Pharmacy','Doctor']));}
    if(Math.random()<0.1){add(d,'expense','personal',150+Math.random()*450,'Personal care');}
    if(Math.random()<0.03){add(d,'expense','edu',300+Math.random()*900,'Course/book');}
    if(Math.random()<0.04){add(d,'income','freelance',2500+Math.random()*5500,'Side project');}
    if(Math.random()<0.015){add(d,'income','invest',800+Math.random()*2500,'Dividend/interest');}
  }
  db.txns=txns;
  db.budgets={overall:32000,cats:{food:6000,grocery:5000,transport:2500,fuel:3000,shopping:5000,bills:3500,fun:1500}};
  db.goals=[
    {id:uid(),emoji:'📱',name:'New Phone',target:80000,saved:32000,deadline:null},
    {id:uid(),emoji:'✈️',name:'Goa Trip',target:40000,saved:9500,deadline:isoOf(addDays(now,120))}
  ];
  db.seenWelcome=true;
  saveDB();
}
function clearAll(){
  db={...defaultDB(),seenWelcome:true,settings:{theme:db.settings.theme}};
  saveDB();
  renderView('settings');
  toast('All data cleared 🧼');
}
