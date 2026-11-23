const q=s=>document.querySelector(s),K="tj_data_v1";
let D={trades:[],settings:{name:"Trader",balance:10000,cur:"$",lev:100,mode:"usd"},lastBackup:null};
try{const s=JSON.parse(localStorage.getItem(K));if(s)D={...D,...s,settings:{...D.settings,...s.settings}}}catch(e){}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(D));return 1}catch(e){toast("Penyimpanan penuh. Hapus screenshot atau ekspor backup.");return 0}};
let V="dashboard",F={f:"all",from:"",to:"",asset:""},A={r:"all"},cal=new Date(),E,PD=null,IM="replace",BX="";cal.setDate(1);
const NAV=[["dashboard","Dashboard","▦"],["history","History","☰"],["analytics","Analytics","◔"],["backup","Backup","⇪"],["settings","Settings","◈"]];
q("#nav").innerHTML=NAV.map(n=>`<button data-v="${n[0]}" onclick="go('${n[0]}')"><span>${n[2]}</span>${n[1]}</button>`).join("");
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nowL=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
const dt=s=>s?new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"";
const td=t=>t.closeTime||t.openTime,cl=n=>n>0?"g":n<0?"r":"";
const $f=(n,s=1)=>(s&&n>0?"+":"")+(n<0?"-":"")+D.settings.cur+Math.abs(n).toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2});
const pf=v=>v===Infinity?"∞":v.toFixed(2);
function toast(m){const e=q("#toast");e.textContent=m;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2600)}
function ask(m,cb){window.CB=cb;q("#dlg").innerHTML=`<div class="ov"><div class="sheet stack"><p>${m}</p><div class="row"><button class="btn sec ml" onclick="q('#dlg').innerHTML=''">Batal</button><button class="btn del" onclick="q('#dlg').innerHTML='';CB()">Ya, lanjutkan</button></div></div></div>`}
/* ---- kalkulasi ---- */
const spec=a=>{a=a.toUpperCase();return/XAU|GOLD/.test(a)?{p:.1,c:100}:/BTC|ETH|SOL|BNB|XRP|DOGE|ADA|US30|NAS|SPX|DAX|GER|NDX|DJI|UK100/.test(a)?{p:1,c:1}:/JPY/.test(a)?{p:.01,c:1e5}:{p:1e-4,c:1e5}};
const exitP=t=>t.exitType=="tp"?t.tp:t.exitType=="sl"?t.sl:t.exitType=="manual"?t.exit:null;
const calc=t=>{const x=exitP(t);if(x==null)return{open:1,pnl:0,pips:0};const s=spec(t.asset),d=(t.side=="BUY"?1:-1)*(x-t.entry),u=t.mode=="lot"?t.size*s.c:t.size*(t.lev||1)/t.entry;let pnl=d*u;if(t.mode=="lot"&&/JPY/i.test(t.asset))pnl/=x;return{open:0,x,pnl,pips:d/s.p}};
const rr=t=>t.sl&&t.tp&&t.sl!=t.entry?Math.abs(t.tp-t.entry)/Math.abs(t.entry-t.sl):null;
const T=()=>D.trades.map(t=>({...t,...calc(t)}));
function stats(ts){const c=ts.filter(t=>!t.open),w=c.filter(t=>t.pnl>0),l=c.filter(t=>t.pnl<0),sum=a=>a.reduce((x,t)=>x+t.pnl,0),gp=sum(w),gl=-sum(l),rs=ts.map(rr).filter(x=>x!=null);
return{c,n:c.length,w,l,wr:c.length?w.length/c.length*100:0,pnl:sum(c),rr:rs.length?rs.reduce((a,b)=>a+b)/rs.length:0,pf:gl?gp/gl:gp?Infinity:0,aw:w.length?gp/w.length:0,al:l.length?-gl/l.length:0,best:c.length?Math.max(...c.map(t=>t.pnl)):0,worst:c.length?Math.min(...c.map(t=>t.pnl)):0,open:ts.length-c.length}}
/* ---- komponen ---- */
const tile=(l,v,c="")=>`<div class="card"><div class="mu sm">${l}</div><div class="big ${c}">${v}</div></div>`;
const empty=`<div class="card c mu">Belum ada trade. Tekan + Add Trade untuk mulai mencatat.</div>`;
function card(t){const s=t.open?["OPEN","a"]:t.exitType=="tp"?["TP Hit","g"]:t.exitType=="sl"?["SL Hit","r"]:["Manual",t.pnl>=0?"g":"r"];
return `<div class="card trade ${t.open?"":t.pnl>=0?"w":"l"}" onclick="openForm('${t.id}')"><div class="row"><b>${esc(t.asset)}</b><span class="bd ${t.side=="BUY"?"g":"r"}">${t.side}</span><span class="mu sm">${dt(t.openTime)}</span><span class="bd ${s[1]} ml">${s[0]}</span></div><div class="row sm mu mono"><span>Entry ${t.entry}</span><span>Exit ${t.open?"-":t.x}</span></div><div class="row"><span class="mono ${cl(t.pips)}">${t.open?"-":(t.pips>0?"+":"")+t.pips.toFixed(1)+" pips"}</span><b class="mono ml ${cl(t.pnl)}">${t.open?"Open":$f(t.pnl)}</b></div></div>`}
function donut(w,l){const n=w+l,C=2*Math.PI*38;return `<svg viewBox="0 0 100 100" width="104"><circle cx="50" cy="50" r="38" fill="none" stroke="${n?"var(--r)":"var(--ln)"}" stroke-width="12"/>${n?`<circle cx="50" cy="50" r="38" fill="none" stroke="var(--g)" stroke-width="12" stroke-dasharray="${w/n*C} ${C}" transform="rotate(-90 50 50)"/>`:""}<text x="50" y="55" text-anchor="middle" fill="var(--tx)" font-size="17" font-weight="700">${n?Math.round(w/n*100)+"%":"-"}</text></svg>`}
const dcard=(t,w,l)=>`<div class="card row"><div>${donut(w,l)}</div><div><b>${t}</b><div class="g sm">${w} win</div><div class="r sm">${l} loss</div></div></div>`;
function line(ts){const c=ts.filter(t=>!t.open).sort((a,b)=>new Date(td(a))-new Date(td(b)));if(!c.length)return `<p class="mu c">Belum ada data</p>`;let s=0;const p=[0,...c.map(t=>s+=t.pnl)],mx=Math.max(...p,0),mn=Math.min(...p,0),R=mx-mn||1,W=320,H=130,Y=v=>8+(mx-v)/R*(H-16),pts=p.map((v,i)=>(i/(p.length-1)*W).toFixed(1)+","+Y(v).toFixed(1)).join(" "),k=s>=0?"var(--g)":"var(--r)";
return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="none" style="height:150px"><line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--ln)" stroke-dasharray="3"/><polygon points="0,${Y(0)} ${pts} ${W},${Y(0)}" fill="${k}" opacity=".15"/><polyline points="${pts}" fill="none" stroke="${k}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="row sm mu mono"><span>Low ${$f(mn,0)}</span><span class="ml">High ${$f(mx,0)}</span></div>`}
const bar=(l,n,m,x,k)=>`<div><div class="row"><span>${esc(l)}</span><span class="ml mono sm ${k=="var(--g)"?"g":k=="var(--r)"?"r":"mu"}">${x}</span></div><div class="tk"><i style="width:${Math.max(4,n/m*100)}%;background:${k}"></i></div></div>`;
/* ---- views ---- */
function dash(){const ts=T(),s=stats(ts),S=D.settings,rec=[...ts].sort((a,b)=>new Date(b.openTime)-new Date(a.openTime)).slice(0,4);
return `<h1>Halo, ${esc(S.name)}</h1><div class="card"><div class="mu sm">Equity</div><div class="mono huge">${$f(S.balance+s.pnl,0)}</div><div class="mono ${cl(s.pnl)}">${$f(s.pnl)} total P&amp;L</div></div><div class="grid">${tile("Win Rate",s.wr.toFixed(1)+"%")}${tile("Closed Trades",s.n)}${tile("Open Trades",s.open,"a")}${tile("Profit Factor",pf(s.pf))}</div><h2>Cumulative P&amp;L</h2><div class="card">${line(ts)}</div><div class="row"><h2>Trade terbaru</h2><a class="ml g" onclick="go('history')">Lihat semua</a></div><div class="stack">${rec.map(card).join("")||empty}</div>`}
function hist(){const all=T().sort((a,b)=>new Date(b.openTime)-new Date(a.openTime)),as=[...new Set(all.map(t=>t.asset))].sort();
const fl={open:t=>t.open,wins:t=>!t.open&&t.pnl>0,losses:t=>!t.open&&t.pnl<0,date:t=>{const d=td(t).slice(0,10);return(!F.from||d>=F.from)&&(!F.to||d<=F.to)},asset:t=>!F.asset||t.asset==F.asset};
const r=all.filter(fl[F.f]||(()=>1));
return `<h1>History</h1><div class="row">${["all","open","wins","losses","date","asset"].map(f=>`<button class="chip ${F.f==f?"on":""}" onclick="F.f='${f}';render()">${f[0].toUpperCase()+f.slice(1)}</button>`).join("")}</div>
${F.f=="date"?`<div class="g2"><label>Dari<input type="date" value="${F.from}" onchange="F.from=this.value;render()"></label><label>Sampai<input type="date" value="${F.to}" onchange="F.to=this.value;render()"></label></div>`:""}
${F.f=="asset"?`<select onchange="F.asset=this.value;render()"><option value="">Semua asset</option>${as.map(a=>`<option ${F.asset==a?"selected":""}>${esc(a)}</option>`).join("")}</select>`:""}
<div class="stack">${r.map(card).join("")||empty}</div>`}
function ana(){const rg=A.r,now=Date.now(),yr=""+new Date().getFullYear(),ts=T().filter(t=>rg=="all"||(rg=="ytd"?td(t).slice(0,4)==yr:now-new Date(td(t))<=rg*864e5)),s=stats(ts),c=s.c,side=x=>{const a=c.filter(t=>t.side==x);return[a.filter(t=>t.pnl>0).length,a.filter(t=>t.pnl<0).length]};
const ag={};c.forEach(t=>{(ag[t.asset]=ag[t.asset]||{n:0,p:0}).n++;ag[t.asset].p+=t.pnl});const al=Object.entries(ag).sort((a,b)=>b[1].p-a[1].p),ac=(t,e,k)=>`<div class="card"><div class="mu sm">${t}</div>${e?`<div class="big">${esc(e[0])}</div><div class="mono ${k}">${$f(e[1].p)}</div><div class="mu sm">${e[1].n} trade</div>`:`<div class="mu">-</div>`}</div>`;
return `<h1>Analytics</h1><div class="row">${[["all","All Time"],["7","7D"],["30","30D"],["90","90D"],["ytd","YTD"]].map(r=>`<button class="chip ${rg==r[0]?"on":""}" onclick="A.r='${r[0]}';render()">${r[1]}</button>`).join("")}</div>
<h2>Summary Statistics</h2><div class="grid">${tile("Win Rate",s.wr.toFixed(1)+"%",s.wr>=50?"g":s.n?"r":"")}${tile("Total P&amp;L",$f(s.pnl),cl(s.pnl))}${tile("Avg R:R","1:"+s.rr.toFixed(2))}${tile("Profit Factor",pf(s.pf))}${tile("Avg Win",$f(s.aw),"g")}${tile("Avg Loss",$f(s.al),"r")}${tile("Best Trade",$f(s.best),"g")}${tile("Worst Trade",$f(s.worst),"r")}${tile("Open Trades",s.open,"a")}</div>
<div class="dg">${dcard("Profitability",s.w.length,s.l.length)}${dcard("Long Analysis",...side("BUY"))}${dcard("Short Analysis",...side("SELL"))}</div>
<h2>Cumulative P&amp;L</h2><div class="card">${line(ts)}</div>
<div class="g2">${ac("Best Asset",al[0]&&al[0][1].p>0?al[0]:null,"g")}${ac("Worst Asset",al.length&&al[al.length-1][1].p<0?al[al.length-1]:null,"r")}</div>
<h2>Kalender P&amp;L</h2>${calH()}`}
function calH(){const y=cal.getFullYear(),m=cal.getMonth(),pre=y+"-"+String(m+1).padStart(2,"0"),by={};let tot=0;
T().filter(t=>!t.open&&td(t).slice(0,7)==pre).forEach(t=>{const d=+td(t).slice(8,10);by[d]=(by[d]||0)+t.pnl;tot+=t.pnl});
const sh=v=>(v>0?"+":"")+(Math.abs(v)>=1000?(v/1000).toFixed(1)+"k":Math.round(v)),cs=[];
for(let i=0;i<new Date(y,m,1).getDay();i++)cs.push(`<div class="cd e"></div>`);
for(let d=1;d<=new Date(y,m+1,0).getDate();d++){const v=by[d];cs.push(`<div class="cd ${v>0?"gw":v<0?"lr":""}"><span class="mu">${d}</span>${v!=null?`<b class="${cl(v)}">${sh(v)}</b>`:""}</div>`)}
return `<div class="card stack"><div class="row"><button class="chip" onclick="cm(-1)">‹</button><b class="ml">${cal.toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</b><span class="mono ${cl(tot)}">${$f(tot)}</span><button class="chip ml" onclick="cm(1)">›</button></div><div class="cal mu sm c">${["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(d=>`<span>${d}</span>`).join("")}</div><div class="cal">${cs.join("")}</div></div>`}
const cm=d=>{cal.setMonth(cal.getMonth()+d);render()};
function bak(){const raw=JSON.stringify(D),kb=new Blob([raw]).size/1024,ns=D.trades.filter(t=>t.shot).length;
return `<h1>Backup &amp; Restore</h1><div class="card stack"><b>Storage Info</b><div class="row"><span class="mu">Jumlah trade</span><b class="ml mono">${D.trades.length}</b></div><div class="row"><span class="mu">Dengan screenshot</span><b class="ml mono">${ns}</b></div><div class="row"><span class="mu">Ukuran data</span><b class="ml mono">${kb.toFixed(1)} KB</b></div><div class="tk"><i style="width:${Math.min(100,kb/5120*100)}%;background:${kb>4000?"var(--r)":"var(--g)"}"></i></div><div class="sm mu">Batas browser sekitar 5 MB. Backup terakhir: ${D.lastBackup?new Date(D.lastBackup).toLocaleString("id-ID"):"belum pernah"}</div></div>
<div class="card stack"><b>Export / Share Backup</b><p class="mu sm">Simpan semua trade dan pengaturan ke satu file JSON.</p><div class="row"><button class="btn" onclick="expB()">Export Backup</button><button class="btn sec" onclick="expB(1)">Share Backup</button></div>${BX?`<label>Salin manual<textarea class="bx" readonly onclick="this.select()">${esc(BX)}</textarea></label>`:""}</div>
<div class="card stack"><b>Import Backup</b><input type="file" accept=".tjbackup,.json,application/json" onchange="pick(this)">${PD?`<div class="g sm">File siap: ${PD.trades.length} trade</div>`:""}<label class="row" style="display:flex"><input type="radio" name="im" value="replace" ${IM=="replace"?"checked":""} onchange="IM=this.value"> Replace All (timpa semua data)</label><label class="row" style="display:flex"><input type="radio" name="im" value="merge" ${IM=="merge"?"checked":""} onchange="IM=this.value"> Merge (gabung, lewati trade yang sudah ada)</label><button class="btn" onclick="imp()">Import Backup</button></div>
<div class="card stack"><b class="r">Clear All Data</b><p class="mu sm">Menghapus semua trade dari browser ini. Ekspor backup dulu bila perlu.</p><button class="btn del" onclick="ask('Hapus semua trade? Tindakan ini tidak bisa dibatalkan.',()=>{D.trades=[];D.lastBackup=null;save();render();toast('Semua data dihapus')})">Clear All Data</button></div>`}
async function expB(sh){const j=JSON.stringify({app:"tradingjournal",v:1,at:new Date().toISOString(),data:D}),fn="tradingjournal-"+new Date().toISOString().slice(0,10)+".tjbackup";let ok=0;
try{if(sh&&navigator.share){const f=new File([j],fn,{type:"application/json"});await navigator.share(navigator.canShare&&navigator.canShare({files:[f]})?{files:[f],title:"Trading Journal Backup"}:{title:"Trading Journal Backup",text:j});ok=1}}catch(e){if(e&&e.name=="AbortError")return}
if(!ok){try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([j],{type:"application/octet-stream"}));a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1e3);ok=1}catch(e){}}
if(ok){D.lastBackup=Date.now();save();BX="";toast("Backup siap")}else{BX=j;toast("Download tidak tersedia. Salin teks di bawah.")}render()}
function pick(i){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result),d=j.data||j;if(!Array.isArray(d.trades))throw 0;PD=d;toast(d.trades.length+" trade siap diimpor")}catch(e){PD=null;toast("File backup tidak valid")}render()};r.readAsText(f)}
function imp(){if(!PD)return toast("Pilih file backup dulu");const run=()=>{if(IM=="replace"){D.trades=PD.trades;if(PD.settings)D.settings={...D.settings,...PD.settings}}else{const ids=new Set(D.trades.map(t=>t.id));D.trades=[...D.trades,...PD.trades.filter(t=>!ids.has(t.id))]}PD=null;if(save()){render();toast("Import selesai")}};IM=="replace"?ask("Replace All akan menimpa semua data saat ini. Lanjutkan?",run):run()}
function sett(){const S=D.settings;return `<h1>Settings</h1><div class="card stack"><label>Nama<input id="sn" value="${esc(S.name)}"></label><label>Saldo awal<input id="sb" type="number" step="any" value="${S.balance}"></label><label>Simbol mata uang<input id="sc" value="${esc(S.cur)}" maxlength="4"></label><label>Default leverage (x)<input id="sl" type="number" value="${S.lev}"></label><label>Default position size<select id="sm"><option value="usd" ${S.mode=="usd"?"selected":""}>USD Value</option><option value="lot" ${S.mode=="lot"?"selected":""}>Lot Size</option></select></label><button class="btn" onclick="saveS()">Save Settings</button></div><p class="mu sm">Pip dan P&amp;L dihitung otomatis dari harga: JPY 0.01, XAU 0.1, kripto dan indeks 1, lainnya 0.0001. Satu lot = 100.000 unit (XAU 100 oz). USD Value dihitung sebagai margin dikali leverage. Hasilnya estimasi.</p>`}
function saveS(){const g=i=>q("#"+i).value;D.settings={name:g("sn")||"Trader",balance:+g("sb")||0,cur:g("sc")||"$",lev:+g("sl")||1,mode:g("sm")};if(save())toast("Pengaturan tersimpan")}
/* ---- form trade ---- */
const seg=(k,o,l)=>`<div class="seg" data-k="${k}">${o.map((v,i)=>`<button type="button" data-v="${v}" class="${E[k]==v?"on":""}" onclick="sg(this)">${l[i]}</button>`).join("")}</div>`;
function openForm(id){const S=D.settings,t=id&&D.trades.find(x=>x.id==id);E=t?{...t}:{id:"",side:"BUY",exitType:"open",mode:S.mode,lev:S.lev,shot:"",openTime:nowL()};if(t){E.lot=t.mode=="lot"?t.size:+(t.size*(t.lev||1)/ntl(t.asset,t.entry)).toFixed(3)}const v=k=>esc(E[k]??""),num=(i,l,k)=>`<label>${l}<input id="${i}" type="number" step="any" oninput="upd()" value="${v(k)}"></label>`;
q("#modal").innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="sheet stack"><div class="row"><h2>${t?"Edit Trade":"New Trade"}</h2><button class="x ml" onclick="closeM()" aria-label="Tutup">×</button></div>
<label>Asset Name / Simbol<input id="fa" list="al" oninput="upd()" value="${v("asset")}" placeholder="EURUSD, XAUUSD, BTCUSD"><datalist id="al">${["EURUSD","GBPUSD","USDJPY","XAUUSD","BTCUSD","ETHUSD","US30","NAS100"].map(a=>`<option>${a}</option>`).join("")}</datalist></label>
<div class="info" id="si"></div>${seg("side",["BUY","SELL"],["BUY","SELL"])}
${num("fe","Entry Price","entry")}<div class="g2">${num("fs","Stop Loss (SL)","sl")}${num("ft","Take Profit (TP)","tp")}</div><div class="info" id="st"></div>
<label>Komentar<textarea id="fn" rows="3" placeholder="Alasan entry, setup, catatan...">${v("notes")}</textarea></label>
<label>Position Size</label><div class="g2"><label>Lot Size<input id="fz" type="number" step="any" value="${v("lot")}" oninput="upd()"></label><label>Leverage (x)<input id="fl" type="number" value="${v("lev")}" oninput="upd()"></label></div>
<label>Exit Type</label>${seg("exitType",["open","manual","tp","sl"],["Still Open","Manual Entry","TP Hit","SL Hit"])}
<div id="xf">${num("fx","Exit Price","exit")}</div>


<div class="g2"><label>Open Time<input id="fo" type="datetime-local" value="${v("openTime")}"></label><label id="cf">Close Time<input id="fc" type="datetime-local" value="${v("closeTime")}"></label></div>

<label>Screenshot<input type="file" accept="image/*" onchange="shot(this)"></label><div id="pv">${E.shot?pvH():""}</div>
<button class="btn" onclick="saveT()">SAVE TRADE</button>${t?`<button class="btn del" onclick="delT()">Delete Trade</button>`:""}</div></div>`;vis()}
const pvH=()=>`<img src="${E.shot}" alt="Screenshot"><button type="button" class="chip" onclick="E.shot='';q('#pv').innerHTML=''">Hapus screenshot</button>`;
function sg(b){const g=b.parentNode;E[g.dataset.k]=b.dataset.v;[...g.children].forEach(x=>x.classList.toggle("on",x==b));vis()}
function vis(){q("#xf").hidden=E.exitType!="manual";q("#cf").hidden=E.exitType=="open";if(E.exitType!="open"&&!q("#fc").value)q("#fc").value=nowL();upd()}
const ntl=(a,p)=>spec(a).c*(/JPY/i.test(a)?1:p);
function rd(){const g=i=>q("#"+i).value,n=i=>g(i)===""?null:+g(i);return{...E,mode:"lot",asset:g("fa").trim().toUpperCase(),entry:n("fe"),sl:n("fs"),tp:n("ft"),size:n("fz"),lev:n("fl")||1}}
const symInfo=a=>{if(!a)return"Ketik simbol, misalnya EURUSD, XAUUSD atau BTCUSD. Info pip dan lot tampil di sini.";const s=spec(a),k=/XAU|GOLD/i.test(a)?"Emas":/JPY/i.test(a)?"Forex JPY":/BTC|ETH|SOL|BNB|XRP|DOGE|ADA/i.test(a)?"Kripto":/US30|NAS|SPX|DAX|GER|NDX|DJI|UK100/i.test(a)?"Indeks":"Forex";return `<b>${esc(a)}</b> (${k})<br>1 pip = ${s.p}<br>1 lot = ${s.c.toLocaleString("id-ID")} unit`};
function upd(){const t=rd(),e=t.entry,buy=t.side=="BUY";q("#si").innerHTML=symInfo(t.asset);let h="Isi Entry Price untuk melihat keterangan SL dan TP.";
if(e>0){const s=spec(t.asset||"EURUSD"),ln=(nm,p,k)=>{if(p==null)return `<b>${nm}</b>: belum diisi`;const ok=buy==(k=="tp"?p>e:p<e),r=t.size>0?calc({...t,exitType:k}):null;return `<b class="${k=="tp"?"g":"r"}">${nm}</b>: ${(Math.abs(p-e)/s.p).toFixed(1)} pips`+(r?`, ${k=="tp"?"potensi":"risiko"} ${$f(Math.abs(r.pnl),0)}`:"")+(ok?"":` <span class="a">(arah tidak sesuai ${t.side})</span>`)},R=rr(t);h=ln("Stop Loss",t.sl,"sl")+"<br>"+ln("Take Profit",t.tp,"tp")+(R?`<br><b>R:R</b> 1:${R.toFixed(2)}`:"")+(t.size>0?`<br><b>Margin</b> sekitar ${$f(t.size*ntl(t.asset||"EURUSD",e)/t.lev,0)} (leverage ${t.lev}x)`:"")}
q("#st").innerHTML=h}
function shot(i){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,900/im.width),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);E.shot=c.toDataURL("image/jpeg",.6);q("#pv").innerHTML=pvH()};im.src=r.result};r.readAsDataURL(f)}
const closeM=()=>q("#modal").innerHTML="";
function saveT(){const g=i=>q("#"+i).value,n=i=>g(i)===""?null:+g(i);
const t={...E,mode:"lot",asset:g("fa").trim().toUpperCase(),entry:n("fe"),sl:n("fs"),tp:n("ft"),exit:n("fx"),size:n("fz"),lev:n("fl")||1,openTime:g("fo"),closeTime:E.exitType=="open"?"":g("fc")||g("fo"),notes:g("fn")};
const er=!t.asset?"Asset Name wajib diisi":!(t.entry>0)?"Entry Price wajib diisi":t.exitType=="tp"&&!t.tp?"Isi Take Profit untuk TP Hit":t.exitType=="sl"&&!t.sl?"Isi Stop Loss untuk SL Hit":t.exitType=="manual"&&t.exit==null?"Isi Exit Price":!(t.size>0)?"Lot Size wajib diisi":!t.openTime?"Open Time wajib diisi":"";
if(er)return toast(er);
if(!t.id){t.id=Date.now().toString(36);D.trades.push(t)}else D.trades[D.trades.findIndex(x=>x.id==t.id)]=t;
if(save()){closeM();render();toast("Trade tersimpan")}}
function delT(){ask("Hapus trade ini?",()=>{D.trades=D.trades.filter(t=>t.id!=E.id);save();closeM();render()})}
/* ---- router ---- */
const go=v=>{V=v;render();scrollTo(0,0)};
function render(){q("#app").innerHTML=({dashboard:dash,history:hist,analytics:ana,backup:bak,settings:sett})[V]();document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.v==V));q("#fab").hidden=V=="backup"||V=="settings"}
render();
