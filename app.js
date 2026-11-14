const SEED={"start": "2026-11-13", "end": "2027-12-31", "saldo0": 0, "ganho": 0, "gasto": 0, "trip": [{"d": "2026-12-31", "b": 0, "g": 0}, {"d": "2027-01-01", "b": 0, "g": 0}, {"d": "2027-01-02", "b": 0, "g": 0}, {"d": "2027-01-03", "b": 0, "g": 0}, {"d": "2027-01-04", "b": 0, "g": 0}, {"d": "2027-01-05", "b": 0, "g": 0}, {"d": "2027-01-06", "b": 0, "g": 0}, {"d": "2027-01-07", "b": 0, "g": 0}], "over": {}, "items": {}, "obs": []};
const KEY='fin_bsb_sp_v1';
let S=null;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S)S=SEED;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const fmt=n=>(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=s=>{const x=parseFloat(String(s).replace(/\./g,'').replace(',','.'));return isNaN(x)?null:x};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>iso(new Date());
const P=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const add=(s,n)=>{const d=P(s);d.setDate(d.getDate()+n);return iso(d)};
const WD=['dom','seg','ter','qua','qui','sex','sáb'],MS=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fd=s=>{const d=P(s);return pad(d.getDate())+'/'+pad(d.getMonth()+1)};
const sum=(a,t)=>a.filter(x=>x.t==t).reduce((s,x)=>s+x.v,0);
let tab='hoje';

function calc(){
  const T=today(),tm=add(T,1),tr={};S.trip.forEach(x=>tr[x.d]=x);
  let bal=S.saldo0;const rows=[];
  for(let d=S.start;d<=S.end;d=add(d,1)){
    const it=S.items[d]||[],t=tr[d],real=d<=T;
    let inn=sum(it,'in'),out=sum(it,'out');
    if(!real){inn+=t?t.g:S.ganho;out+=t?t.b:(S.over[d]!=null?S.over[d]:S.gasto)}
    let obg=0;
    S.obs.forEach(o=>{if(d<=T){if(o.pago==d)obg+=o.v}else if(!o.pago&&(d==tm?o.pagar<=d:o.pagar==d))obg+=o.v});
    bal=bal+inn-out-obg;
    rows.push({d,inn,out,obg,bal,real,sp:!!t,hoje:d==T});
  }
  return rows;
}
function city(d){return S.trip.some(x=>x.d==d)}

function render(){
  const R=calc(),T=today();
  const nv=[['hoje','🏠','Hoje'],['dias','📅','Dias'],['contas','🧾','Contas'],['sp','✈️','Viagem'],['cfg','⚙️','Ajustes']];
  $('nv').innerHTML=nv.map(n=>`<button class="${tab==n[0]?'on':''}" onclick="tab='${n[0]}';render();window.scrollTo(0,0)"><b>${n[1]}</b>${n[2]}</button>`).join('');
  $('m').innerHTML={hoje:vHoje,dias:vDias,contas:vContas,sp:vSP,cfg:vCfg}[tab](R,T);
  if(tab=='dias'){const e=document.querySelector('.day.hoje');if(e)e.scrollIntoView({block:'center'})}
}

function chart(R){
  const W=520,H=150,p=6,mn=Math.min(0,...R.map(r=>r.bal)),mx=Math.max(...R.map(r=>r.bal));
  const x=i=>p+i*(W-2*p)/(R.length-1),y=v=>H-p-(v-mn)*(H-2*p)/((mx-mn)||1);
  const pts=R.map((r,i)=>x(i).toFixed(1)+','+y(r.bal).toFixed(1)).join(' ');
  const sp=R.map((r,i)=>r.sp?`<rect x="${x(i)-1}" y="0" width="3" height="${H}" fill="var(--sp)" opacity=".25"/>`:'').join('');
  const hi=R.findIndex(r=>r.hoje);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Saldo previsto">${sp}<line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="var(--ln)"/><polyline points="${pts}" fill="none" stroke="var(--ac)" stroke-width="2"/>${hi>=0?`<circle cx="${x(hi)}" cy="${y(R[hi].bal)}" r="4" fill="var(--ac)"/>`:''}</svg>`;
}

function vHoje(R,T){
  const h=R.find(r=>r.hoje)||R[0],sp=city(T);
  const pend=S.obs.filter(o=>!o.pago).sort((a,b)=>a.venc<b.venc?-1:1),nx=pend[0];
  const falta=pend.reduce((s,o)=>s+o.v,0),neg=R.find(r=>r.bal<0);
  const t0=S.trip[0].d,tN=S.trip[S.trip.length-1].d;
  const emb=R.find(r=>r.d==add(t0,-1)),volta=R.find(r=>r.d==tN);
  const gasto=S.trip.reduce((s,x)=>s+sum(S.items[x.d]||[],'out'),0),res=S.trip.reduce((s,x)=>s+x.b,0);
  const months={};R.forEach(r=>{const k=r.d.slice(0,7);(months[k]=months[k]||{i:0,o:0,b:0,e:0});const m=months[k];m.i+=r.inn;m.o+=r.out;m.b+=r.obg;m.e=r.bal});
  return `<div class="card"><h2>Saldo hoje · ${sp?'<span class="sp">✈ São Paulo</span>':'Brasília'}</h2><div class="big ${h.bal<0?'bad':''}">${fmt(h.bal)}</div>
  <div class="mut">${WD[P(T).getDay()]}, ${fd(T)}</div>
  <div class="grid" style="margin-top:12px"><button class="btn" onclick="quick('in')">＋ Ganhei</button><button class="btn alt" onclick="quick('out')">− Gastei</button></div></div>
  ${neg?`<div class="card bad">⚠ Saldo fica negativo em ${fd(neg.d)} (${fmt(neg.bal)}).</div>`:''}
  <div class="card"><h2>Próxima obrigação</h2>${nx?`<div class="row"><b>${nx.n}</b><span>${fmt(nx.v)}</span></div><div class="row"><span class="mut">Vence em</span><span>${fd(nx.venc)}</span></div>`:'<div class="ok">Tudo pago!</div>'}<div class="row"><span class="mut">Falta pagar (total)</span><b>${fmt(falta)}</b></div></div>
  <div class="card"><h2>✈ Viagem a SP · ${fd(t0)} a ${fd(tN)}</h2>
  <div class="row"><span>Saldo previsto ao embarcar</span><b>${emb?fmt(emb.bal):'-'}</b></div>
  <div class="row"><span>Reserva da viagem</span><b>${fmt(res)}</b></div>
  <div class="row"><span>Já gastou em SP</span><b>${fmt(gasto)}</b></div>
  <div class="row"><span>Ainda pode gastar</span><b class="${res-gasto<0?'bad':'ok'}">${fmt(res-gasto)}</b></div>
  <div class="row"><span>Saldo previsto na volta</span><b>${volta?fmt(volta.bal):'-'}</b></div></div>
  <div class="card"><h2>Saldo previsto (faixa azul = SP)</h2>${chart(R)}</div>
  <div class="card scroll"><h2>Mês a mês</h2><table><tr><th>Mês</th><th>Entra</th><th>Sai</th><th>Contas</th><th>Saldo</th></tr>${Object.keys(months).map(k=>{const m=months[k];return `<tr><td>${MS[+k.slice(5)-1]}/${k.slice(2,4)}</td><td>${fmt(m.i)}</td><td>${fmt(m.o)}</td><td>${fmt(m.b)}</td><td><b>${fmt(m.e)}</b></td></tr>`}).join('')}</table></div>`;
}

function vDias(R){
  return `<div class="card"><h2>Toque num dia para lançar</h2>`+R.map(r=>`<div class="day ${r.hoje?'hoje':''} ${r.real?'':'fut'}" onclick="dayEdit('${r.d}')">
  <div><b>${fd(r.d)}</b><br><span class="mut">${WD[P(r.d).getDay()]}</span></div>
  <div><span class="ok">+${fmt(r.inn)}</span> <span class="bad">−${fmt(r.out)}</span>${r.obg?` <span class="pill">conta ${fmt(r.obg)}</span>`:''}<br>${r.sp?'<span class="sp">✈ SP</span>':'<span class="mut">BSB</span>'} <span class="mut">${r.real?(r.hoje?'hoje':'real'):'previsto'}</span></div>
  <b class="${r.bal<0?'bad':''}">${fmt(r.bal)}</b></div>`).join('')+'</div>';
}

function vContas(){
  const l=S.obs.map((o,i)=>({o,i})).sort((a,b)=>a.o.venc<b.o.venc?-1:1),T=today();
  const st=o=>o.pago?'<span class="ok">✔ Paga</span>':o.venc<T?'<span class="bad">⚠ Atrasada</span>':'<span class="mut">A pagar</span>';
  const tot=S.obs.reduce((s,o)=>s+o.v,0),pg=S.obs.filter(o=>o.pago).reduce((s,o)=>s+o.v,0);
  return `<div class="card"><h2>Obrigações</h2>${l.map(({o,i})=>`<div class="row" onclick="obEdit(${i})"><div><b>${o.n}</b><br><span class="mut">vence ${fd(o.venc)} · pagar em ${o.pagar?fd(o.pagar):'-'}</span></div><div style="text-align:right">${fmt(o.v)}<br>${st(o)}</div></div>`).join('')}
  <div class="row"><span class="mut">Já pago</span><b>${fmt(pg)}</b></div><div class="row"><span class="mut">Falta pagar</span><b>${fmt(tot-pg)}</b></div>
  <button class="btn ghost" onclick="obEdit(-1)">＋ Nova obrigação</button></div>`;
}

function vSP(R){
  let acc=0;const res=S.trip.reduce((s,x)=>s+x.b,0);
  const rows=S.trip.map((t,i)=>{const g=sum(S.items[t.d]||[],'out');acc+=g;const f=t.d<=today();
    return `<div class="card" style="padding:10px"><div class="row"><b>${fd(t.d)} ${WD[P(t.d).getDay()]}</b><span class="mut">gastou ${fmt(g)}</span></div>
    <div class="grid"><div><label>Orçamento do dia</label><input inputmode="decimal" value="${t.b}" onchange="S.trip[${i}].b=num(this.value)||0;save();render()"></div>
    <div><label>${f?'Sobra do dia':'Reserva restante'}</label><div style="padding:14px 0" class="${(f?t.b-g:res-acc)<0?'bad':'ok'}"><b>${fmt(f?t.b-g:res-acc)}</b></div></div></div>
    <button class="btn ghost" onclick="dayEdit('${t.d}')">Lançar gasto neste dia</button></div>`}).join('');
  return `<div class="card"><h2>✈ Orçamento da viagem</h2><div class="row"><span>Reserva total</span><b>${fmt(res)}</b></div><div class="row"><span>Já gastou</span><b>${fmt(acc)}</b></div><div class="row"><span>Ainda pode gastar</span><b class="${res-acc<0?'bad':'ok'}">${fmt(res-acc)}</b></div></div>${rows}`;
}

function vCfg(){
  return `<div class="card"><h2>Parâmetros</h2>
  <label>Saldo inicial (início do período)</label><input inputmode="decimal" value="${S.saldo0}" onchange="S.saldo0=num(this.value)||0;save()">
  <label>Ganho previsto por dia</label><input inputmode="decimal" value="${S.ganho}" onchange="S.ganho=num(this.value)||0;save()">
  <label>Gasto previsto por dia em Brasília</label><input inputmode="decimal" value="${S.gasto}" onchange="S.gasto=num(this.value)||0;save()">
  <label>Dia inicial do controle</label><input type="date" value="${S.start}" onchange="if(this.value){S.start=this.value;save()}">
  <label>Dia final</label><input type="date" value="${S.end}" onchange="if(this.value){S.end=this.value;save()}">
  <button class="btn" onclick="render()">Atualizar cálculos</button></div>
  <div class="card"><h2>Backup (os dados ficam só neste aparelho)</h2>
  <button class="btn ghost" onclick="exp()">Exportar dados</button><br><br><button class="btn ghost" onclick="imp()">Importar dados</button><br><br>
  <button class="btn ghost" onclick="if(confirm('Voltar aos dados do Excel de exemplo? Isso apaga seus lançamentos.')){S=JSON.parse(JSON.stringify(SEED));save();render()}">Restaurar exemplo do Excel</button></div>`;
}

function openSheet(h){$('sh').innerHTML=h;$('ov').style.display='flex'}
function closeSheet(){$('ov').style.display='none';render()}
function quick(t){const T=today();
  openSheet(`<h3>${t=='in'?'＋ Ganhei':'− Gastei'} · hoje (${city(T)?'SP':'BSB'})</h3><label>Valor (R$)</label><input id="qv" inputmode="decimal" autofocus><label>Descrição (opcional)</label><input id="qn"><button class="btn" onclick="addItem('${T}','${t}','qv','qn')">Salvar</button>`)}
function addItem(d,t,vi,ni){const v=num($(vi).value);if(!v||v<=0)return;(S.items[d]=S.items[d]||[]).push({t,v,n:$(ni).value});save();closeSheet()}
function dayEdit(d){
  const it=S.items[d]||[],fut=d>today(),tr=city(d);
  openSheet(`<h3>${fd(d)} · ${tr?'✈ São Paulo':'Brasília'} ${fut?'<span class="mut">(previsto)</span>':''}</h3>
  ${it.map((x,i)=>`<div class="li"><span>${x.t=='in'?'＋':'−'} ${x.n||''}</span><b>${fmt(x.v)}</b><button onclick="S.items['${d}'].splice(${i},1);save();dayEdit('${d}')">✕</button></div>`).join('')||'<div class="mut">Sem lançamentos.</div>'}
  <hr style="border:0;border-top:1px solid var(--ln)">
  <label>Tipo</label><select id="dt"><option value="out">Saída (gastei)</option><option value="in">Entrada (ganhei)</option></select>
  <label>Valor (R$)</label><input id="dv" inputmode="decimal"><label>Descrição</label><input id="dn">
  <button class="btn" onclick="addItem('${d}',$('dt').value,'dv','dn')">Adicionar</button>
  ${fut&&!tr?`<br><br><label>Gasto previsto só neste dia (deixe vazio para usar o padrão)</label><input inputmode="decimal" value="${S.over[d]!=null?S.over[d]:''}" onchange="const x=num(this.value);if(x==null)delete S.over['${d}'];else S.over['${d}']=x;save()">`:''}
  ${fut?'<div class="mut" style="font-size:12px;margin-top:6px">Lançamentos em dias futuros somam-se à previsão do dia.</div>':''}`)}
function obEdit(i){
  const o=i<0?{n:'',v:'',venc:today(),pagar:today(),pago:''}:S.obs[i];
  openSheet(`<h3>${i<0?'Nova obrigação':o.n}</h3><label>Nome</label><input id="on" value="${o.n}"><label>Valor (R$)</label><input id="ov2" inputmode="decimal" value="${o.v}">
  <label>Vencimento</label><input id="oe" type="date" value="${o.venc}"><label>Pretendo pagar em</label><input id="op" type="date" value="${o.pagar}"><label>Pago em (vazio = não paga)</label><input id="og" type="date" value="${o.pago}">
  <button class="btn" onclick="obSave(${i})">Salvar</button>${i>=0?`<br><br><button class="btn ghost" onclick="S.obs[${i}].pago='${today()}';save();closeSheet()">Marcar como paga hoje</button><br><br><button class="btn ghost" onclick="if(confirm('Excluir?')){S.obs.splice(${i},1);save();closeSheet()}">Excluir</button>`:''}`)}
function obSave(i){const o={n:$('on').value||'Conta',v:num($('ov2').value)||0,venc:$('oe').value,pagar:$('op').value||$('oe').value,pago:$('og').value};if(i<0)S.obs.push(o);else S.obs[i]=o;save();closeSheet()}
function exp(){openSheet(`<h3>Exportar</h3><div class="mut">Copie o texto e guarde (ex.: nas suas notas).</div><textarea id="tx" rows="8" style="width:100%;background:var(--bg);color:var(--tx);border:1px solid var(--ln);border-radius:10px">${JSON.stringify(S).replace(/</g,'&lt;')}</textarea><button class="btn" onclick="$('tx').select();document.execCommand('copy')">Copiar</button>`)}
function imp(){openSheet(`<h3>Importar</h3><textarea id="tx" rows="8" style="width:100%;background:var(--bg);color:var(--tx);border:1px solid var(--ln);border-radius:10px"></textarea><button class="btn" onclick="try{const x=JSON.parse($('tx').value);if(!x.items||!x.obs)throw 0;S=x;save();closeSheet()}catch(e){alert('Texto inválido')}">Importar</button>`)}
render();
