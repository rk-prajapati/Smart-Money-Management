/* ============================================================
   04-CHARTS.JS
   CHARTS — SVG Charts + Illustrations (no library!)
   All graphs are hand-built SVG: line/area chart (daily spending),
   donut chart (categories), income-vs-expense bars, progress rings,
   + piggy bank & target illustrations.
   ============================================================ */
'use strict';

/* ================= CHARTS ================= */
function niceCeil(v){
  if(v<=10)return 10;
  const p=Math.pow(10,Math.floor(Math.log10(v)));
  const mults=[1,1.5,2,2.5,3,4,5,6,8,10];
  for(let i=0;i<mults.length;i++){if(mults[i]*p>=v)return Math.round(mults[i]*p);}
  return 10*p;
}
function smoothPath(pts){
  if(!pts.length)return '';
  if(pts.length===1)return 'M '+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);
  let d='M '+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);
  for(let i=1;i<pts.length;i++){
    const x0=pts[i-1][0],y0=pts[i-1][1],x1=pts[i][0],y1=pts[i][1];
    const mx=((x0+x1)/2).toFixed(1);
    d+=' C '+mx+','+y0.toFixed(1)+' '+mx+','+y1.toFixed(1)+' '+x1.toFixed(1)+','+y1.toFixed(1);
  }
  return d;
}
function lineChart(container,points,opts){
  opts=opts||{};
  const W=Math.max(Math.floor(container.clientWidth||320),260);
  const H=opts.height||180;
  const pl=46,pr=14,pt=16,pb=26;
  const iw=W-pl-pr,ih=H-pt-pb;
  let maxV=Math.max.apply(null,points.map(function(p){return p.v;}).concat([0]));
  const noData=maxV===0;
  maxV=niceCeil(Math.max(maxV,10));
  const n=points.length;
  function X(i){return pl+(n<=1?iw/2:i*iw/(n-1));}
  function Y(v){return pt+ih-(v/maxV)*ih;}
  const pts=points.map(function(p,i){return [X(i),Y(p.v)];});
  const line=smoothPath(pts);
  const area=line+' L '+X(n-1).toFixed(1)+','+(pt+ih).toFixed(1)+' L '+X(0).toFixed(1)+','+(pt+ih).toFixed(1)+' Z';
  const gid='lg'+(gidc++);
  let grid='';
  [0,.5,1].forEach(function(f){
    const y=(pt+ih-f*ih).toFixed(1);
    grid+='<line class="gl" x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'"/>'+
      '<text class="ax" x="'+(pl-7)+'" y="'+(+y+3)+'" text-anchor="end">'+compact(maxV*f)+'</text>';
  });
  let xl='';
  const step=Math.max(1,Math.ceil(n/6));
  for(let i=0;i<n;i+=step){
    xl+='<text class="ax" x="'+X(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle">'+axisLab(points[i].iso)+'</text>';
  }
  const showDots=n<=32;
  let dots='';
  pts.forEach(function(p,i){
    dots+='<circle class="pt" data-i="'+i+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(showDots?3:0)+
      '" fill="'+PRIMARY+'" style="stroke:var(--card);stroke-width:2;'+(showDots?'':'opacity:0;')+'"/>';
  });
  const zw=iw/n;
  let zones='';
  pts.forEach(function(p,i){
    zones+='<rect class="hz" data-i="'+i+'" x="'+(pl+i*zw-1).toFixed(1)+'" y="0" width="'+(zw+2).toFixed(1)+'" height="'+H+'" fill="transparent"/>';
  });
  container.innerHTML=
    '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block;touch-action:none">'+
    '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="'+PRIMARY+'" stop-opacity=".30"/>'+
    '<stop offset="1" stop-color="'+PRIMARY+'" stop-opacity="0"/></linearGradient></defs>'+
    grid+
    '<path d="'+area+'" fill="url(#'+gid+')"/>'+
    '<path d="'+line+'" fill="none" stroke="'+PRIMARY+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+
    dots+zones+
    (noData?'<text class="ax" x="'+(W/2)+'" y="'+(pt+ih/2)+'" text-anchor="middle" style="font-size:12px">No spending yet 🎉</text>':'')+
    '</svg><div class="tip"></div>';
  const svg=container.querySelector('svg'),tip=container.querySelector('.tip');
  const dotEls=container.querySelectorAll('.pt');
  container.querySelectorAll('.hz').forEach(function(z){
    z.addEventListener('pointerenter',function(){
      const i=+z.getAttribute('data-i'),p=pts[i];
      tip.innerHTML='<b>'+fmtIN(points[i].v)+'</b><span>'+dayLab(points[i].iso)+'</span>';
      tip.style.left=Math.min(Math.max(p[0],50),W-50)+'px';
      tip.style.top=(p[1]-8)+'px';
      tip.classList.add('on');
      dotEls.forEach(function(d){d.setAttribute('r',3);d.style.opacity=0;});
      const d=dotEls[i];if(d){d.setAttribute('r',5.5);d.style.opacity=1;}
    });
  });
  svg.addEventListener('pointerleave',function(){
    tip.classList.remove('on');
    dotEls.forEach(function(d){d.setAttribute('r',showDots?3:0);d.style.opacity=showDots?1:0;});
  });
}
function donutChart(container,items){
  const total=items.reduce(function(a,b){return a+b.value;},0);
  if(!total){container.innerHTML='<div class="chart-empty">No spending in this period 🎉</div>';return;}
  const cx=80,cy=80,r=56,sw=26,C=2*Math.PI*r;
  let off=0;
  const segs=items.map(function(it){
    const len=it.value/total*C;
    const dashLen=Math.max(len-1.5,0.5);
    const s='<circle data-l="'+esc(it.label)+'" data-v="'+Math.round(it.value)+'" data-p="'+Math.round(it.value/total*100)+
      '" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+it.color+'" stroke-width="'+sw+
      '" stroke-dasharray="'+dashLen.toFixed(2)+' '+(C-dashLen).toFixed(2)+
      '" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')"/>';
    off+=len;
    return s;
  }).join('');
  container.innerHTML='<div class="donut-wrap"><svg class="donut" width="170" height="170" viewBox="0 0 160 160">'+segs+
    '</svg><div class="donut-center"><b>'+fmtIN(total)+'</b><span>TOTAL SPENT</span></div></div>';
  const dc=container.querySelector('.donut-center');
  container.querySelectorAll('circle').forEach(function(c){
    c.addEventListener('pointerenter',function(){
      dc.innerHTML='<b>'+fmtIN(+c.getAttribute('data-v'))+'</b><span>'+esc(c.getAttribute('data-l'))+' · '+c.getAttribute('data-p')+'%</span>';
    });
    c.addEventListener('pointerleave',function(){
      dc.innerHTML='<b>'+fmtIN(total)+'</b><span>TOTAL SPENT</span>';
    });
  });
}
function ivsGroups(range){
  if(range===7){
    return rangeDays(7).map(function(iso){
      return {label:DAYS[dateOf(iso).getDay()].slice(0,2),income:sumDay(iso,'income'),expense:sumDay(iso,'expense')};
    });
  }
  if(range===30){
    const isos=rangeDays(30),gs=[];
    for(let i=0;i<isos.length;i+=7){
      const ch=isos.slice(i,i+7),d=dateOf(ch[0]);
      gs.push({
        label:d.getDate()+' '+MONTHS[d.getMonth()],
        income:ch.reduce(function(a,x){return a+sumDay(x,'income');},0),
        expense:ch.reduce(function(a,x){return a+sumDay(x,'expense');},0)
      });
    }
    return gs;
  }
  const isos=rangeDays(90),m={},order=[];
  isos.forEach(function(iso){
    const k=iso.slice(0,7);
    if(!m[k]){m[k]={label:MONTHS[+k.slice(5)-1],income:0,expense:0};order.push(k);}
    m[k].income+=sumDay(iso,'income');
    m[k].expense+=sumDay(iso,'expense');
  });
  return order.map(function(k){return m[k];});
}
function barChart(container,groups){
  const W=Math.max(Math.floor(container.clientWidth||320),260),H=210;
  const pl=46,pr=8,pt=18,pb=24;
  const iw=W-pl-pr,ih=H-pt-pb;
  let maxV=1;
  groups.forEach(function(g){maxV=Math.max(maxV,g.income,g.expense);});
  maxV=niceCeil(maxV);
  const gw=iw/groups.length;
  const bw=Math.min(18,gw*0.3);
  let bars='',zones='',xl='';
  groups.forEach(function(g,i){
    const cxg=pl+gw*(i+0.5);
    const hi=(g.income/maxV)*ih,he=(g.expense/maxV)*ih;
    bars+='<rect x="'+(cxg-bw-2).toFixed(1)+'" y="'+(pt+ih-hi).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(hi,g.income>0?3:0).toFixed(1)+'" rx="4" fill="'+INCOME_C+'"/>';
    bars+='<rect x="'+(cxg+2).toFixed(1)+'" y="'+(pt+ih-he).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(he,g.expense>0?3:0).toFixed(1)+'" rx="4" fill="'+EXPENSE_C+'"/>';
    xl+='<text class="ax" x="'+cxg.toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(g.label)+'</text>';
    zones+='<rect class="bz" x="'+(pl+gw*i).toFixed(1)+'" y="0" width="'+gw.toFixed(1)+'" height="'+H+'" fill="transparent" data-i="'+i+'"/>';
  });
  let grid='';
  [0,.5,1].forEach(function(f){
    const y=(pt+ih-f*ih).toFixed(1);
    grid+='<line class="gl" x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'"/>'+
      '<text class="ax" x="'+(pl-7)+'" y="'+(+y+3)+'" text-anchor="end">'+compact(maxV*f)+'</text>';
  });
  const noData=groups.every(function(g){return g.income===0&&g.expense===0;});
  container.innerHTML=
    '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block;touch-action:none">'+grid+bars+xl+zones+
    (noData?'<text class="ax" x="'+(W/2)+'" y="'+(pt+ih/2)+'" text-anchor="middle" style="font-size:12px">No data yet 🤷</text>':'')+
    '</svg><div class="tip"></div>'+
    '<div class="bleg"><span><i style="background:'+INCOME_C+'"></i>Income</span><span><i style="background:'+EXPENSE_C+'"></i>Expense</span></div>';
  const tip=container.querySelector('.tip');
  container.querySelectorAll('.bz').forEach(function(z){
    z.addEventListener('pointerenter',function(){
      const g=groups[+z.getAttribute('data-i')];
      tip.innerHTML='<b>'+esc(g.label)+'</b><span>In '+fmtIN(g.income)+' · Out '+fmtIN(g.expense)+'</span>';
      tip.style.left=Math.min(Math.max(+z.getAttribute('x')+gw/2,60),W-60)+'px';
      tip.style.top='12px';
      tip.classList.add('on');
    });
  });
  container.querySelector('svg').addEventListener('pointerleave',function(){tip.classList.remove('on');});
}
function ringSVG(pct,size){
  size=size||74;
  const r=size/2-8,sw=7,c=2*Math.PI*r;
  const p=Math.max(0,Math.min(pct,100))/100;
  const gid='rg'+(gidc++);
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+
    '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="1" y2="1">'+
    '<stop offset="0" stop-color="'+PRIMARY+'"/><stop offset="1" stop-color="'+PRIMARY2+'"/></linearGradient></defs>'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke-width="'+sw+'" style="stroke:var(--bg2)"/>'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+(pct>=100?INCOME_C:'url(#'+gid+')')+
    '" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+(c*p).toFixed(1)+' '+c.toFixed(1)+
    '" transform="rotate(-90 '+size/2+' '+size/2+')"/></svg>';
}

/* ================= ILLUSTRATIONS ================= */
function piggySVG(mode,w){
  w=w||120;
  const hero=mode==='hero';
  const body=hero?'rgba(255,255,255,.30)':'#f472b6';
  const dark=hero?'rgba(255,255,255,.48)':'#db2777';
  const snout=hero?'rgba(255,255,255,.42)':'#f9a8d4';
  const slot=hero?'rgba(255,255,255,.58)':'#9d174d';
  const eye=hero?'#ffffff':'#831843';
  const coin=hero?'#ffd166':'#fbbf24';
  return '<svg width="'+w+'" viewBox="0 0 150 112" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
    (hero?'':'<ellipse cx="74" cy="102" rx="52" ry="6" fill="rgba(110,120,170,.16)"/>')+
    '<path d="M31 62 q-13 -2 -11 -15 q2 -11 13 -8" stroke="'+dark+'" stroke-width="4.5" fill="none" stroke-linecap="round"/>'+
    '<rect x="46" y="87" width="11" height="13" rx="4.5" fill="'+dark+'"/>'+
    '<rect x="88" y="87" width="11" height="13" rx="4.5" fill="'+dark+'"/>'+
    '<ellipse cx="72" cy="66" rx="42" ry="28" fill="'+body+'"/>'+
    '<path d="M94 45 L106 28 L111 47 Z" fill="'+dark+'"/>'+
    '<rect x="59" y="40" width="28" height="6" rx="3" fill="'+slot+'"/>'+
    '<circle cx="88" cy="61" r="3.2" fill="'+eye+'"/>'+
    '<ellipse cx="106" cy="71" rx="11.5" ry="9" fill="'+snout+'"/>'+
    '<circle cx="103" cy="69.5" r="1.7" fill="'+slot+'"/>'+
    '<circle cx="109.5" cy="72.5" r="1.7" fill="'+slot+'"/>'+
    '<circle cx="73" cy="16" r="10" fill="'+coin+'" stroke="#f59e0b" stroke-width="2.5"/>'+
    '<text x="73" y="20.5" font-size="12" font-weight="800" fill="#92400e" text-anchor="middle">₹</text>'+
    '<path d="M59 29 l-5 3 M87 29 l5 3" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>'+
    (hero?'':'<circle cx="30" cy="95" r="6.5" fill="'+coin+'" stroke="#f59e0b" stroke-width="2"/>'+
    '<circle cx="121" cy="96" r="5" fill="'+coin+'" stroke="#f59e0b" stroke-width="2"/>')+
    '</svg>';
}
function targetSVG(w){
  w=w||110;
  return '<svg width="'+w+'" viewBox="0 0 132 104" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
    '<ellipse cx="66" cy="97" rx="46" ry="5" fill="rgba(110,120,170,.16)"/>'+
    '<circle cx="66" cy="58" r="36" fill="rgba(99,102,241,.10)" stroke="#6366f1" stroke-width="5"/>'+
    '<circle cx="66" cy="58" r="21" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="4.5"/>'+
    '<circle cx="66" cy="58" r="8" fill="#fbbf24" stroke="#f59e0b" stroke-width="2.5"/>'+
    '<path d="M12 94 L52 68" stroke="#6366f1" stroke-width="5" stroke-linecap="round"/>'+
    '<path d="M46 57 L66 64 L54 78 Z" fill="#6366f1"/>'+
    '<circle cx="108" cy="88" r="6" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>'+
    '<circle cx="120" cy="81" r="4.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>'+
    '</svg>';
}
