/* ============================================================
   05-INSIGHTS.JS
   INSIGHTS — Smart Insights Engine (the brain)
   Auto-generated money advice: budget alerts at 80%, week-over-week
   comparison, month-end prediction, savings rate, goal ETA,
   zero-spend days, top category detection.
   ============================================================ */
'use strict';

/* ================= INSIGHTS ENGINE ================= */
function budgetAlerts(){
  const mk=monthKey(new Date());
  const res=[];
  Object.keys(db.budgets.cats).forEach(function(cid){
    const b=db.budgets.cats[cid];
    if(!b||b<=0)return;
    let spent=0;
    db.txns.forEach(function(t){if(t.type==='expense'&&t.date.slice(0,7)===mk&&t.cat===cid)spent+=t.amount;});
    const pct=Math.round(spent/b*100);
    if(pct>=80){
      res.push({id:cid,name:CATMAP[cid]?CATMAP[cid].name:cid,spent:spent,budget:b,pct:pct,left:b-spent,tone:pct>=100?'bad':'warn'});
    }
  });
  return res.sort(function(a,b){return b.pct-a.pct;});
}
function computeInsights(range){
  const out=[];
  const rl=range===7?'week':(range===30?'month':'3 months');
  const tx=txnsIn(range);
  const spent=sumBy(tx,'expense'),earned=sumBy(tx,'income');
  /* top category */
  const byCat=aggByCat(tx);
  const ents=Object.keys(byCat).map(function(k){return [k,byCat[k]];}).sort(function(a,b){return b[1]-a[1];});
  if(ents.length&&spent>0){
    const cid=ents[0][0],v=ents[0][1];
    out.push({tag:'top',tone:'info',icon:CATMAP[cid].icon,title:'Top category: '+CATMAP[cid].name,
      desc:'In the last '+rl+', '+CATMAP[cid].name+' was your biggest expense — '+fmtIN(v)+' ('+Math.round(v/spent*100)+'% of spending).'});
  }
  /* week over week */
  const isos7=rangeDays(7),prev=rangeDays(14).slice(0,7);
  let sp7=0,spp=0;
  isos7.forEach(function(i){sp7+=sumDay(i,'expense');});
  prev.forEach(function(i){spp+=sumDay(i,'expense');});
  if(sp7>0&&spp>0){
    const d=Math.round((sp7-spp)/spp*100);
    if(d>10) out.push({tag:'wow',tone:'bad',icon:'📈',title:'Spending up '+d+'%',
      desc:'This week '+fmtIN(sp7)+' vs last week '+fmtIN(spp)+'. Time to slow down 🙂'});
    else if(d<-10) out.push({tag:'wow',tone:'good',icon:'👏',title:'Spending down '+Math.abs(d)+'%!',
      desc:'This week '+fmtIN(sp7)+' vs last week '+fmtIN(spp)+' — great job!'});
    else out.push({tag:'wow',tone:'info',icon:'⚖️',title:'Spending is steady',
      desc:'This week '+fmtIN(sp7)+' — about the same as last week ('+fmtIN(spp)+').'});
  }
  /* biggest day */
  const daily=dailyTotals(rangeDays(range));
  let md={v:0,iso:null};
  daily.forEach(function(p){if(p.v>md.v)md=p;});
  if(md.iso&&md.v>0){
    const dd=dateOf(md.iso);
    out.push({tag:'big',tone:'purple',icon:'🔥',title:'Biggest spend day',
      desc:DAYS[dd.getDay()]+', '+dd.getDate()+' '+MONTHS[dd.getMonth()]+' — '+fmtIN(md.v)+'.'});
  }
  /* average */
  if(spent>0){
    const avg=spent/range;
    out.push({tag:'avg',tone:'info',icon:'📆',title:'Daily average '+fmtIN(avg),
      desc:range===30?'At this pace, the month will end around '+fmtIN(avg*30)+'.':'Total '+fmtIN(spent)+' spent in the last '+rl+'.'});
  }
  /* month savings */
  const mTx=monthTxns();
  const mInc=sumBy(mTx,'income'),mExp=sumBy(mTx,'expense');
  if(mInc>0){
    const sr=Math.round((mInc-mExp)/mInc*100);
    if(sr>=20) out.push({tag:'save',tone:'good',icon:'🎉',title:'Saved '+sr+'% this month',
      desc:'From '+fmtIN(mInc)+' income, you saved '+fmtIN(mInc-mExp)+' — great going!'});
    else if(sr<0) out.push({tag:'save',tone:'bad',icon:'⚠️',title:'Spending exceeds income!',
      desc:'You spent '+fmtIN(mExp-mInc)+' more than you earned this month. Time to cut back.'});
    else out.push({tag:'save',tone:'info',icon:'💰',title:sr+'% saved this month',
      desc:'Push a little more to cross the 20% mark!'});
  }
  /* month-end projection */
  const now=new Date();
  const dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const dom=now.getDate();
  if(mExp>0&&dom>=3){
    const proj=Math.round(mExp/dom*dim);
    const ob=db.budgets.overall;
    if(ob>0&&proj>ob) out.push({tag:'proj',tone:'warn',icon:'🔮',title:'Month-end forecast',
      desc:'At this pace you will reach '+fmtIN(proj)+' — your budget is '+fmtIN(ob)+' (over by '+fmtIN(proj-ob)+').'});
    else out.push({tag:'proj',tone:'good',icon:'🔮',title:'Month-end forecast',
      desc:'At this pace, expect about '+fmtIN(proj)+' of spending this month.'});
  }
  /* zero spend days */
  const zs=daily.filter(function(p){return p.v===0;}).length;
  if(zs>0&&range>=7) out.push({tag:'zero',tone:'good',icon:'🧘',title:zs+' zero-spend day'+(zs>1?'s':''),
    desc:'No spending on '+zs+' day'+(zs>1?'s':'')+' in the last '+rl+' — nice consistency!'});
  /* budget alerts */
  budgetAlerts().forEach(function(a){
    out.push({tag:'budget',tone:a.tone,icon:a.tone==='bad'?'🚨':'⚠️',title:a.name+' budget at '+a.pct+'%',
      desc:fmtIN(a.spent)+' of '+fmtIN(a.budget)+(a.left>0?' — '+fmtIN(a.left)+' left.':' — over budget!')});
  });
  /* goal nudge */
  const msav=mInc-mExp;
  if(db.goals.length&&msav>500){
    const g=db.goals.slice().sort(function(a,b){return (b.target-b.saved)-(a.target-a.saved);})[0];
    const rem=g.target-g.saved;
    if(rem>0){
      const mo=Math.ceil(rem/msav);
      out.push({tag:'goal',tone:'purple',icon:g.emoji,title:esc(g.name)+': '+fmtIN(rem)+' to go',
        desc:'At your saving pace (~'+fmtIN(msav)+'/month), about '+mo+' month'+(mo>1?'s':'')+' to go.'});
    }
  }
  const ord={bad:0,warn:1,good:2,purple:3,info:4};
  return out.sort(function(a,b){return ord[a.tone]-ord[b.tone];}).slice(0,7);
}
