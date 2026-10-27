/* ============================================================
   06-VIEWS.JS
   VIEWS — Screens: Home, Stats, Plan, Settings
   Builds each screen's HTML from data: dashboard cards, 7-day chart,
   budget progress bars, goal rings, analytics + filters +
   transaction list, settings page.
   ============================================================ */
'use strict';

/* ================= TXN ROW ================= */
function txnRow(t){
  const c=CATMAP[t.cat]||CATMAP.other;
  const m=METHODS.find(function(x){return x.id===t.method;})||METHODS[0];
  const dt=relDay(t.date);
  const name=t.note?esc(t.note):c.name;
  const sub=c.name+' · '+(m.i+' '+m.n)+' · '+dt;
  const amt=(t.type==='expense'?'−':'+')+fmtIN(t.amount);
  return '<div class="txn" data-id="'+t.id+'">'+
    '<div class="txn-ic" style="background:'+c.color+'22">'+c.icon+'</div>'+
    '<div class="txn-mid"><div class="txn-name">'+name+'</div><div class="txn-sub">'+sub+'</div></div>'+
    '<div class="txn-amt '+(t.type==='expense'?'exp':'inc')+'">'+amt+'</div></div>';
}

/* ================= VIEWS ================= */
function renderView(v){
  currentView=v;
  $$('.navbtn').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-view')===v);});
  $$('.view').forEach(function(s){s.classList.remove('active');});
  const sec=$('#view-'+v);
  sec.classList.add('active');
  if(v==='home')renderHome();
  else if(v==='stats')renderStats();
  else if(v==='plan')renderPlan();
  else renderSettings();
}

function renderHome(){
  const el=$('#view-home');
  const allInc=sumBy(db.txns,'income'),allExp=sumBy(db.txns,'expense');
  const bal=allInc-allExp;
  const now=new Date();
  const mTx=monthTxns();
  const mInc=sumBy(mTx,'income'),mExp=sumBy(mTx,'expense');
  const saveRate=mInc>0?Math.round((mInc-mExp)/mInc*100):null;
  const tExp=sumDay(todayISO(),'expense');
  const wTx=txnsIn(7),wExp=sumBy(wTx,'expense');
  const a30=sumBy(txnsIn(30),'expense')/30;
  const h=now.getHours();
  const greet=h<12?'Good morning':(h<17?'Good afternoon':'Good evening');
  const dateStr=DAYS[now.getDay()]+', '+now.getDate()+' '+MONTHS[now.getMonth()];
  const insights=computeInsights(30).filter(function(i){return i.tag!=='budget';});
  const banner=insights[0];
  const alerts=budgetAlerts();
  const recent=sortedTxns().slice(0,8);
  const mk=monthKey(now);
  const withB=CATS.expense.map(function(c){
    const b=db.budgets.cats[c.id]||0;
    let spent=0;
    db.txns.forEach(function(t){if(t.type==='expense'&&t.cat===c.id&&t.date.slice(0,7)===mk)spent+=t.amount;});
    return {c:c,b:b,spent:spent,pct:b>0?Math.round(spent/b*100):null};
  }).filter(function(r){return r.b>0;}).sort(function(a,b){return b.pct-a.pct;});
  let html=
    '<div class="greet"><div><div class="g1">'+greet+' 👋</div><div class="g2">'+dateStr+'</div></div></div>'+
    '<div class="hero"><div class="hero-art">'+piggySVG('hero')+'</div>'+
    '<div class="lbl">TOTAL BALANCE</div><div class="big">'+fmtIN(bal)+'</div>'+
    '<div class="hrow">'+
    '<div class="hstat"><div class="k">↑ INCOME ('+MONTHS[now.getMonth()]+')</div><div class="v">'+fmtIN(mInc)+'</div></div>'+
    '<div class="hstat"><div class="k">↓ EXPENSE</div><div class="v">'+fmtIN(mExp)+'</div></div>'+
    '<div class="hstat"><div class="k">💰 SAVED</div><div class="v">'+(saveRate===null?'—':saveRate+'%')+'</div></div>'+
    '</div>'+
    '<div class="hero-badges"><span class="hbadge">🔒 100% Private</span><span class="hbadge">📴 Offline Ready</span><span class="hbadge">📊 Smart Insights</span></div>'+
    '</div>'+
    '<div class="mini-row">'+
    '<div class="mini t1"><div class="ic">☀️</div><div class="v">'+fmtIN(tExp)+'</div><div class="k">SPENT TODAY</div></div>'+
    '<div class="mini t2"><div class="ic">📅</div><div class="v">'+fmtIN(wExp)+'</div><div class="k">THIS WEEK</div></div>'+
    '<div class="mini t3"><div class="ic">📊</div><div class="v">'+fmtIN(a30)+'</div><div class="k">DAILY AVG (30D)</div></div>'+
    '</div>';
  if(banner){
    html+='<div class="insight"><div class="iic t-'+banner.tone+'">'+banner.icon+'</div><div>'+
      '<div class="it">'+banner.title+'</div><div class="id">'+banner.desc+'</div></div></div>';
  }
  alerts.forEach(function(a){
    html+='<div class="alertb '+a.tone+'"><span>'+(a.tone==='bad'?'🚨':'⚠️')+'</span><div>'+esc(a.name)+' budget at '+a.pct+
      '% — '+fmtIN(a.spent)+' / '+fmtIN(a.budget)+(a.left>0?' · '+fmtIN(a.left)+' left':' · over budget!')+'</div></div>';
  });
  html+='<div class="card chart-card"><h3><span class="h3l"><span class="h3ic" style="background:rgba(99,102,241,.13)">📈</span>Last 7 days</span><span class="h3sub">'+fmtIN(wExp)+' · avg '+fmtIN(wExp/7)+'/day</span></h3>'+
    '<div id="homeChart" class="chartwrap"></div></div>';
  html+='<div class="card"><h3><span class="h3l"><span class="h3ic" style="background:rgba(168,85,247,.14)">🎯</span>Budgets this month</span><button class="link" data-goto="plan">View all →</button></h3>';
  if(withB.length){
    withB.slice(0,3).forEach(function(r){
      const col=barColor(r.pct);
      html+='<div class="bud-row"><div class="bud-top"><span class="bud-name">'+r.c.icon+' '+r.c.name+
        '</span><span class="bud-sub">'+r.pct+'%</span></div>'+
        '<div class="bar"><i style="width:'+Math.min(r.pct,100)+'%;background:'+col+'"></i></div>'+
        '<div class="bud-sub">'+fmtIN(r.spent)+' / '+fmtIN(r.b)+'</div></div>';
    });
  }else{
    html+='<div class="empty"><div class="ill">'+targetSVG(118)+'</div>No budgets set — add them in the Plan tab and get alerts at 80%.</div>';
  }
  html+='</div>';
  if(db.goals.length){
    html+='<div class="card"><h3><span class="h3l"><span class="h3ic" style="background:rgba(16,185,129,.15)">🚀</span>Savings goals</span><button class="link" data-goto="plan">View all →</button></h3><div class="hscroll">';
    db.goals.forEach(function(g){
      const pct=Math.round(g.saved/g.target*100);
      html+='<div class="goal-mini" data-goto="plan"><div class="gm-ring">'+ringSVG(pct,64)+
        '<span class="gem">'+g.emoji+'</span></div><div class="gm-name">'+esc(g.name)+'</div>'+
        '<div class="gm-sub">'+fmtIN(g.saved)+' / '+fmtIN(g.target)+'</div></div>';
    });
    html+='</div></div>';
  }
  html+='<div class="card"><h3><span class="h3l"><span class="h3ic" style="background:rgba(245,158,11,.16)">🧾</span>Recent transactions</span><button class="link" data-goto="stats">View all →</button></h3>';
  if(recent.length){
    html+=recent.map(txnRow).join('');
  }else{
    html+='<div class="empty"><div class="ill">'+piggySVG('full',150)+'</div>No transactions yet.<br>Tap the <b>＋</b> button below to add your first one!</div>';
  }
  html+='</div>';
  el.innerHTML=html;
  lineChart($('#homeChart'),dailyTotals(rangeDays(7)),{height:170});
}

function barColor(pct){
  if(pct>=100)return '#ef4444';
  if(pct>=85)return '#f97316';
  if(pct>=60)return '#f59e0b';
  return PRIMARY;
}

function renderStats(){
  const el=$('#view-stats');
  const tx=txnsIn(statsRange);
  const spent=sumBy(tx,'expense'),earned=sumBy(tx,'income');
  const isos=rangeDays(statsRange);
  const daily=dailyTotals(isos);
  const avg=spent/statsRange;
  let md={v:0,iso:null};
  daily.forEach(function(p){if(p.v>md.v)md=p;});
  const byCat=aggByCat(tx);
  const ents=Object.keys(byCat).map(function(k){return [k,byCat[k]];}).sort(function(a,b){return b[1]-a[1];});
  const items=ents.slice(0,5).map(function(x){
    return {label:CATMAP[x[0]].name,value:x[1],color:CATMAP[x[0]].color};
  });
  if(ents.length>5){
    const restV=ents.slice(5).reduce(function(a,x){return a+x[1];},0);
    items.push({label:'Others',value:restV,color:'#94a3b8'});
  }
  const pl=statsRange===7?'7 days':(statsRange===30?'30 days':'3 months');
  let html='<h2 class="vtitle">📊 Analytics</h2>';
  html+='<div class="ranges">'+
    '<button class="'+(statsRange===7?'on':'')+'" data-r="7">7 Days</button>'+
    '<button class="'+(statsRange===30?'on':'')+'" data-r="30">1 Month</button>'+
    '<button class="'+(statsRange===90?'on':'')+'" data-r="90">3 Months</button></div>';
  html+='<div class="chips">'+
    '<div class="schip"><div class="k">💸 Spent ('+pl+')</div><div class="v exp">'+fmtIN(spent)+'</div></div>'+
    '<div class="schip"><div class="k">💰 Earned</div><div class="v inc">'+fmtIN(earned)+'</div></div>'+
    '<div class="schip"><div class="k">📆 Daily average</div><div class="v">'+fmtIN(avg)+'</div></div>'+
    (md.iso&&md.v>0?'<div class="schip"><div class="k">🔥 Biggest day</div><div class="v">'+fmtIN(md.v)+'</div><div class="s">'+dayLab(md.iso)+'</div></div>':'')+
    '</div>';
  html+='<div class="card chart-card"><h3>📈 Daily spending <span class="h3sub">Last '+pl+' trend</span></h3><div id="statLine" class="chartwrap"></div></div>';
  html+='<div class="card chart-card"><h3>🍩 Spending by category</h3><div id="statDonut" class="chartwrap"></div><div class="legend" id="donutLegend"></div></div>';
  html+='<div class="card chart-card"><h3>📊 Income vs Expense</h3><div id="statBars" class="chartwrap"></div></div>';
  const ins=computeInsights(statsRange);
  html+='<div class="card"><h3>💡 Smart insights</h3>';
  if(ins.length){
    ins.forEach(function(i){
      html+='<div class="icard"><div class="iic t-'+i.tone+'">'+i.icon+'</div><div>'+
        '<div class="it">'+i.title+'</div><div class="id">'+i.desc+'</div></div></div>';
    });
  }else{
    html+='<div class="empty"><div class="e">💡</div>Smart insights will appear here as your data grows.</div>';
  }
  html+='</div>';
  html+='<div class="card"><h3>🧾 Transactions <span class="h3c" id="txnCount"></span></h3>'+
    '<div class="search-row"><input type="text" id="txnSearch" placeholder="🔍 Search — note, category, amount…" value="'+esc(txnSearch)+'"></div>'+
    '<div class="filters"><div class="fchips">'+
    '<button class="fchip '+(txnType==='all'?'on':'')+'" data-t="all">All</button>'+
    '<button class="fchip '+(txnType==='expense'?'on':'')+'" data-t="expense">− Expense</button>'+
    '<button class="fchip '+(txnType==='income'?'on':'')+'" data-t="income">＋ Income</button>'+
    '</div><select id="catSel"><option value="all">All categories</option>'+
    '<optgroup label="Expense">'+CATS.expense.map(function(c){return '<option value="'+c.id+'" '+(txnCat===c.id?'selected':'')+'>'+c.icon+' '+c.name+'</option>';}).join('')+'</optgroup>'+
    '<optgroup label="Income">'+CATS.income.map(function(c){return '<option value="'+c.id+'" '+(txnCat===c.id?'selected':'')+'>'+c.icon+' '+c.name+'</option>';}).join('')+'</optgroup>'+
    '</select></div><div id="txnListBox"></div></div>';
  el.innerHTML=html;
  lineChart($('#statLine'),daily,{height:200});
  donutChart($('#statDonut'),items);
  const lg=$('#donutLegend');
  if(lg&&items.length){
    const tot=items.reduce(function(a,b){return a+b.value;},0);
    lg.innerHTML=items.map(function(it){
      return '<div class="leg"><span class="dot" style="background:'+it.color+'"></span>'+
        '<span class="ln">'+esc(it.label)+'</span><span class="lv">'+fmtIN(it.value)+'</span>'+
        '<span class="lp">'+Math.round(it.value/tot*100)+'%</span></div>';
    }).join('');
  }
  barChart($('#statBars'),ivsGroups(statsRange));
  renderTxnListBox();
}

function renderTxnListBox(){
  const box=$('#txnListBox');
  if(!box)return;
  const isos=rangeDays(statsRange);
  const from=isos[0],to=isos[isos.length-1];
  const totalInRange=db.txns.filter(function(t){return t.date>=from&&t.date<=to;}).length;
  const list=sortedTxns().filter(function(t){
    if(!(t.date>=from&&t.date<=to))return false;
    if(txnType!=='all'&&t.type!==txnType)return false;
    if(txnCat!=='all'&&t.cat!==txnCat)return false;
    if(txnSearch){
      const q=txnSearch.toLowerCase();
      const c=CATMAP[t.cat]||CATMAP.other;
      const hay=(c.name+' '+(t.note||'')+' '+t.amount).toLowerCase();
      if(hay.indexOf(q)===-1)return false;
    }
    return true;
  });
  const cnt=$('#txnCount');
  if(cnt)cnt.textContent=list.length+' / '+totalInRange;
  if(!list.length){
    box.innerHTML='<div class="empty"><div class="e">🔍</div>Nothing found — try different filters.</div>';
    return;
  }
  const cap=150;
  if(list.length>cap&&!txnShowAll){
    box.innerHTML=list.slice(0,cap).map(txnRow).join('')+
      '<button class="showall" id="btnShowAll">▼ Load all '+(list.length-cap)+' remaining transactions</button>';
  }else{
    box.innerHTML=list.map(txnRow).join('')+
      '<div class="endmark"><span class="em">🎉</span>You\'ve reached the end · '+list.length+' transaction'+(list.length===1?'':'s')+' shown</div>';
  }
}

function renderPlan(){
  const el=$('#view-plan');
  const now=new Date();
  const mk=monthKey(now);
  const mTx=monthTxns();
  const mInc=sumBy(mTx,'income'),mExp=sumBy(mTx,'expense');
  const msav=mInc-mExp;
  const ob=db.budgets.overall;
  const rows=CATS.expense.map(function(c){
    const b=db.budgets.cats[c.id]||0;
    let spent=0;
    db.txns.forEach(function(t){if(t.type==='expense'&&t.cat===c.id&&t.date.slice(0,7)===mk)spent+=t.amount;});
    return {c:c,b:b,spent:spent,pct:b>0?Math.round(spent/b*100):null};
  });
  const withB=rows.filter(function(r){return r.b>0;}).sort(function(a,b){return b.pct-a.pct;});
  const noB=rows.filter(function(r){return !(r.b>0);});
  const opct=ob>0?Math.round(mExp/ob*100):null;
  let html='<h2 class="vtitle">🎯 Plan</h2>';
  /* overall budget */
  html+='<div class="card"><h3>💳 Overall monthly budget '+
    '<button class="link bud-edit" data-cat="__all">'+(ob>0?fmtIN(ob)+' ✏️':'Set budget ✏️')+'</button></h3>';
  if(ob>0){
    html+='<div class="bar"><i style="width:'+Math.min(opct,100)+'%;background:'+barColor(opct)+'"></i></div>'+
      '<div class="bud-sub">'+fmtIN(mExp)+' spent · '+opct+'% '+(ob-mExp>=0?'· '+fmtIN(ob-mExp)+' left':'· '+fmtIN(mExp-ob)+' over!')+'</div>';
  }else{
    html+='<div class="bud-sub">Set a total monthly budget — get a warning when you cross 80%. 🔔</div>';
  }
  html+='</div>';
  /* category budgets */
  html+='<div class="card"><h3>💵 Category budgets <span class="h3sub">'+MONTHS_FULL[now.getMonth()]+' '+now.getFullYear()+'</span></h3>';
  if(withB.length){
    withB.forEach(function(r){
      html+='<div class="bud-row"><div class="bud-top"><span class="bud-name">'+r.c.icon+' '+r.c.name+
        '</span><button class="link bud-edit" data-cat="'+r.c.id+'">'+fmtIN(r.b)+' ✏️</button></div>'+
        '<div class="bar"><i style="width:'+Math.min(r.pct,100)+'%;background:'+barColor(r.pct)+'"></i></div>'+
        '<div class="bud-sub">'+fmtIN(r.spent)+' spent · '+r.pct+'% '+(r.b-r.spent>=0?'· '+fmtIN(r.b-r.spent)+' left':'· '+fmtIN(r.spent-r.b)+' over!')+'</div></div>';
    });
  }
  if(noB.length){
    noB.forEach(function(r){
      html+='<div class="bud-row slim"><div class="bud-top"><span class="bud-name">'+r.c.icon+' '+r.c.name+
        '</span><button class="link bud-edit" data-cat="'+r.c.id+'">Set ✏️</button></div>'+
        '<div class="bud-sub">'+(r.spent>0?fmtIN(r.spent)+' spent this month':'No spending this month')+'</div></div>';
    });
  }
  html+='</div>';
  /* goals */
  html+='<div class="card"><h3>🚀 Savings goals <button class="link" id="btnNewGoal">＋ New goal</button></h3>';
  if(db.goals.length){
    db.goals.forEach(function(g){
      const pct=Math.min(Math.round(g.saved/g.target*100),100);
      const done=g.saved>=g.target;
      const rem=g.target-g.saved;
      let eta='';
      if(done){eta='<div class="goal-eta" style="color:'+INCOME_C+'">✅ Goal complete — congratulations! 🎉</div>';}
      else if(msav>500){
        eta='<div class="goal-eta">🚀 At this pace, about '+Math.ceil(rem/msav)+' more months ('+fmtIN(msav)+'/mo)</div>';
      }
      let dl='';
      if(g.deadline){
        const d=dateOf(g.deadline);
        dl=' · by '+d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear();
      }
      html+='<div class="goal"><div class="goal-ring">'+ringSVG(pct,74)+'<span class="gem">'+g.emoji+'</span></div>'+
        '<div class="goal-info"><div class="goal-name">'+esc(g.name)+(done?'<span class="done-chip">DONE 🎉</span>':'')+'</div>'+
        '<div class="goal-nums">'+fmtIN(g.saved)+' / '+fmtIN(g.target)+' · '+pct+'%'+dl+'</div>'+eta+
        '<div class="goal-btns">'+
        '<button class="gbtn gq" data-id="'+g.id+'" data-a="500">+₹500</button>'+
        '<button class="gbtn gq" data-id="'+g.id+'" data-a="1000">+₹1,000</button>'+
        '<button class="gbtn gcustom" data-id="'+g.id+'">Custom</button>'+
        '<button class="gbtn ghost gdel" data-id="'+g.id+'">✕</button></div>'+
        '<div class="gc-row hidden" id="gcr-'+g.id+'"><input type="number" min="1" placeholder="Amount (₹)"><button class="gbtn gcadd" data-id="'+g.id+'">Add</button></div>'+
        '</div></div>';
    });
  }else{
    html+='<div class="empty"><div class="e">🚀</div>No goals yet.<br>Create one and start saving!</div>';
  }
  html+='</div>';
  /* month summary */
  html+='<div class="card"><h3>📌 '+MONTHS_FULL[now.getMonth()]+' summary</h3>'+
    '<div class="bud-sub" style="font-size:12.5px;line-height:2">↑ Income: <b>'+fmtIN(mInc)+'</b><br>'+
    '↓ Expense: <b>'+fmtIN(mExp)+'</b><br>'+
    '💰 Saved: <b>'+fmtIN(msav)+'</b>'+(mInc>0?' ('+Math.round(msav/mInc*100)+'%)':'')+'</div></div>';
  el.innerHTML=html;
}

function renderSettings(){
  const el=$('#view-settings');
  const dark=db.settings.theme==='dark';
  const storageMsg=persistent
    ?'✅ localStorage — data is saved permanently in your browser'
    :'⚠️ Preview mode — data is temporary. Download the file and open it in your browser for permanent storage.';
  el.innerHTML='<h2 class="vtitle">⚙️ More</h2>'+
    '<div class="card"><h3>Settings</h3>'+
    '<div class="set-row"><span class="sic">🌙</span><div class="smid"><div class="st">Dark mode</div><div class="ss">Easy on the eyes 😌</div></div>'+
    '<label class="switch"><input type="checkbox" id="themeSwitch" '+(dark?'checked':'')+'><span class="slider"></span></label></div>'+
    '<div class="set-row"><span class="sic">🗄️</span><div class="smid"><div class="st">Data storage</div><div class="ss">'+storageMsg+'</div></div></div>'+
    '<div class="set-row"><span class="sic">🔒</span><div class="smid"><div class="st">Privacy</div><div class="ss">100% offline — your data never leaves your device.</div></div></div>'+
    '</div>'+
    '<div class="card"><h3>Data</h3>'+
    '<button class="btn btn-ghost" id="btnExport">📄 Export CSV (Excel)</button>'+
    '<button class="btn btn-ghost" id="btnDemo">🧪 Load demo data</button>'+
    '<button class="btn btn-danger" id="btnClear">🗑 Delete all data</button></div>'+
    '<div class="card about">💙 <b>SmartMoney v1.0</b><br>Smart Money Management &amp; Expense Tracking System<br>Made with love + vanilla JS 🍦</div>';
}
