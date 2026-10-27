/* ============================================================
   08-APP.JS
   APP — Global State, Events, Theme & Init (control room)
   Global state variables (current screen, filters, editing id),
   toast/confetti/confirm dialogs, dark mode toggle, ALL event
   listeners, and init() which starts the app.
   ============================================================ */
'use strict';

/* ================= STATE ================= */
let currentView='home';
let statsRange=7;
let txnSearch='', txnType='all', txnCat='all';
let txnShowAll=false;
let editId=null, sheetType='expense', amtStr='';
let selCat={expense:'food',income:'salary'};
let selMethod='upi';
let goalEmoji='🎯';
let gidc=0;
let cmCb=null;

/* ================= TOAST / CONFIRM / CONFETTI ================= */
let toastT=null;
function toast(msg){
  const el=$('#toast');el.textContent=msg;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show');},2300);
}
function confirmDialog(title,msg,okLabel,cb){
  $('#cmTitle').textContent=title;$('#cmMsg').textContent=msg;$('#cmOk').textContent=okLabel;
  cmCb=cb;$('#confirmModal').classList.add('show');
}
function hideConfirm(){$('#confirmModal').classList.remove('show');cmCb=null;}
function confettiAt(x,y){
  const ems=['🎉','✨','💰','🎊','⭐'];
  for(let i=0;i<16;i++){
    const s=document.createElement('span');
    s.className='confetti';s.textContent=pick(ems);
    s.style.left=(x||innerWidth/2)+'px';s.style.top=(y||innerHeight/2)+'px';
    document.body.appendChild(s);
    const ang=Math.random()*Math.PI*2,dist=70+Math.random()*130;
    s.animate(
      [{transform:'translate(0,0) scale(1)',opacity:1},
       {transform:'translate('+(Math.cos(ang)*dist)+'px,'+(Math.sin(ang)*dist-70)+'px) scale(1.5)',opacity:0}],
      {duration:900+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'}
    ).onfinish=function(){s.remove();};
  }
}

/* ================= THEME ================= */
function applyTheme(){
  document.documentElement.setAttribute('data-theme',db.settings.theme);
  $('#btnTheme').textContent=db.settings.theme==='dark'?'☀️':'🌙';
}
function toggleTheme(){
  db.settings.theme=db.settings.theme==='dark'?'light':'dark';
  saveDB();applyTheme();
  if(currentView==='settings')renderSettings();
}

/* ================= EVENTS ================= */
function onMainClick(e){
  const t=e.target;
  let el=t.closest('.txn');
  if(el){openTxnSheet(el.getAttribute('data-id'));return;}
  el=t.closest('.ranges button');
  if(el){statsRange=+el.getAttribute('data-r');txnShowAll=false;renderStats();return;}
  el=t.closest('.fchip');
  if(el){txnType=el.getAttribute('data-t');txnShowAll=false;renderStats();return;}
  el=t.closest('#btnShowAll');
  if(el){
    txnShowAll=true;renderTxnListBox();
    const em=document.querySelector('#txnListBox .endmark');
    if(em)setTimeout(function(){em.scrollIntoView({behavior:'smooth',block:'end'});},80);
    return;
  }
  el=t.closest('[data-goto]');
  if(el){renderView(el.getAttribute('data-goto'));return;}
  el=t.closest('.bud-edit');
  if(el){startBudEdit(el);return;}
  el=t.closest('#btnNewGoal');
  if(el){openGoalSheet();return;}
  el=t.closest('.gq');
  if(el){addGoalMoney(el.getAttribute('data-id'),+el.getAttribute('data-a'),e);return;}
  el=t.closest('.gcustom');
  if(el){
    const row=$('#gcr-'+el.getAttribute('data-id'));
    if(row){row.classList.toggle('hidden');const i=row.querySelector('input');if(!row.classList.contains('hidden'))i.focus();}
    return;
  }
  el=t.closest('.gcadd');
  if(el){
    const row=el.closest('.gc-row');
    const inp=row.querySelector('input');
    const v=parseFloat(inp.value);
    if(v>0)addGoalMoney(el.getAttribute('data-id'),v,e);
    else toast('Please enter an amount 🙂');
    return;
  }
  el=t.closest('.gdel');
  if(el){
    const id=el.getAttribute('data-id');
    const g=db.goals.find(function(x){return x.id===id;});
    confirmDialog('Delete this goal?','Goal "'+(g?g.name:'')+'" will be removed.','Delete',function(){
      db.goals=db.goals.filter(function(x){return x.id!==id;});
      saveDB();renderView(currentView);toast('Goal deleted');
    });
    return;
  }
  el=t.closest('#btnExport');
  if(el){exportCSV();return;}
  el=t.closest('#btnDemo');
  if(el){
    confirmDialog('Load demo data?','Your current data will be replaced.','Load demo',function(){
      seedDemo();renderView('home');toast('Demo data loaded — explore! 🚀');
    });
    return;
  }
  el=t.closest('#btnClear');
  if(el){confirmDialog('Delete all data?','All transactions, budgets and goals will be removed. This cannot be undone!','Delete all',clearAll);return;}
}
function bindEvents(){
  $('.nav').addEventListener('click',function(e){
    const b=e.target.closest('.navbtn');
    if(b)renderView(b.getAttribute('data-view'));
  });
  $('#fabAdd').addEventListener('click',function(){openTxnSheet();});
  $('#btnTheme').addEventListener('click',toggleTheme);
  const main=$('#main');
  main.addEventListener('click',onMainClick);
  main.addEventListener('input',function(e){
    if(e.target.id==='txnSearch'){txnSearch=e.target.value;txnShowAll=false;renderTxnListBox();}
  });
  main.addEventListener('change',function(e){
    if(e.target.id==='catSel'){txnCat=e.target.value;txnShowAll=false;renderTxnListBox();}
    if(e.target.id==='themeSwitch'){toggleTheme();}
  });
  main.addEventListener('focusout',function(e){
    if(e.target.classList&&e.target.classList.contains('bud-input'))commitBud(e.target);
  });
  main.addEventListener('keydown',function(e){
    if(e.target.classList&&e.target.classList.contains('bud-input')&&e.key==='Enter'){
      e.preventDefault();e.target.blur();
    }
  });
  $('#segExp').addEventListener('click',function(){setSheetType('expense');});
  $('#segInc').addEventListener('click',function(){setSheetType('income');});
  $('#closeTxn').addEventListener('click',closeSheet);
  $('#backdrop').addEventListener('click',closeSheet);
  $('#keypad').addEventListener('click',function(e){
    const k=e.target.closest('.key');
    if(!k)return;
    if(k.getAttribute('data-k')==='ok')saveTxn();
    else keyPress(k.getAttribute('data-k'));
  });
  $('#catGrid').addEventListener('click',function(e){
    const c=e.target.closest('.cat-chip');
    if(c){selCat[sheetType]=c.getAttribute('data-cat');buildCatGrid();}
  });
  $('#methodRow').addEventListener('click',function(e){
    const m=e.target.closest('.mchip');
    if(m){selMethod=m.getAttribute('data-m');syncMethodRow();}
  });
  $('#delTxn').addEventListener('click',function(){
    confirmDialog('Delete transaction?','This transaction will be permanently deleted.','Delete',function(){
      db.txns=db.txns.filter(function(t){return t.id!==editId;});
      saveDB();closeSheet();renderView(currentView);toast('Deleted 🗑️');
    });
  });
  $('#closeGoal').addEventListener('click',closeSheet);
  $('#saveGoal').addEventListener('click',saveGoal);
  $('#gemGrid').addEventListener('click',function(e){
    const g=e.target.closest('.gemoji');
    if(g){goalEmoji=g.getAttribute('data-e');syncGemGrid();}
  });
  $('#cmCancel').addEventListener('click',hideConfirm);
  $('#confirmModal').addEventListener('click',function(e){if(e.target.id==='confirmModal')hideConfirm();});
  $('#cmOk').addEventListener('click',function(){
    const cb=cmCb;hideConfirm();if(cb)cb();
  });
  $('#wDemo').addEventListener('click',function(){
    seedDemo();$('#welcomeModal').classList.remove('show');renderView('home');
    toast('Demo data loaded — explore! 🚀');
  });
  $('#wFresh').addEventListener('click',function(){
    db.seenWelcome=true;saveDB();$('#welcomeModal').classList.remove('show');
  });
  window.addEventListener('resize',debounce(function(){renderView(currentView);},250));
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){closeSheet();hideConfirm();}
  });
}

/* ================= INIT ================= */
function buildKeypad(){
  const keys=['1','2','3','⌫','4','5','6','C','7','8','9','.','00','0','ok'];
  $('#keypad').innerHTML=keys.map(function(k){
    if(k==='ok')return '<div class="key ok" data-k="ok">SAVE ✓</div>';
    return '<div class="key '+((k==='⌫'||k==='C')?'acc':'')+'" data-k="'+k+'">'+k+'</div>';
  }).join('');
}
function init(){
  loadDB();
  applyTheme();
  buildKeypad();
  syncGemGrid();
  bindEvents();
  if(!db.seenWelcome&&db.txns.length===0)$('#welcomeModal').classList.add('show');
  renderView('home');
}
init();
