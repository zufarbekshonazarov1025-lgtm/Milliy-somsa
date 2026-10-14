import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { markSvg, lockupH, wordmarkV, patternUrl } from './brand.js?v=4';
document.documentElement.style.setProperty('--pattern', patternUrl());

// Yangi versiya chiqqan bo'lsa, telefondagi eski nusxa o'rniga darhol yangisini yuklaydi.
// Har yangilanishda APP_V, version.json va index.html'dagi ?v= raqami birga oshiriladi.
const APP_V = "4";
async function checkVersion(){
  try{
    const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});const {v}=await r.json();
    if(v&&v!==APP_V){const u=new URL(location.href);if(u.searchParams.get("v")!==v){u.searchParams.set("v",v);location.replace(u.toString())}}
  }catch(e){}
}
checkVersion();
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion()});

const SUPABASE_URL = 'https://xxddllenrcflwjjejqvo.supabase.co';
// Ochiq (publishable) kalit: brauzerda turishi uchun mo'ljallangan, ma'lumotni RLS himoya qiladi.
const SUPABASE_KEY = 'sb_publishable_GvvlFAzl6FtHsTwMH5Qo7g_Rj6n1_Y5';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentyabr","oktabr","noyabr","dekabr"];
const WDAYS = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
const UNITS = { kg:{base:"g",f:1000,name:"kg"}, l:{base:"ml",f:1000,name:"l"}, ta:{base:"ta",f:1,name:"ta"} };
const ICONS = {
  bugun:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  yetkazish:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  ombor:'<path d="M21 8 12 3 3 8v13h18z"/><path d="M7 21v-8h10v8"/>',
  hisob:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',
  sozlama:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};
const TAB_NAMES = { bugun:"Bugun", yetkazish:"Yetkazish", ombor:"Ombor", hisob:"Hisob", sozlama:"Sozlama" };

const S = { types:{}, ings:{}, clients:{}, days:{}, moves:{}, debts:{}, config:{zaxira:2}, profiles:{} };
const LOGIN_DOMAIN = "milliysomsa.uz";
const ROLE_NAMES = { admin:"Admin", ishchi:"Ishchi", kuzatuvchi:"Kuzatuvchi" };
const K = { date:null, data:null, loading:false };   // kuzatuvchi dashboardi uchun
let session = null, me = null, preview = null, tab = "bugun", viewDate = ymd(new Date()), selType = null, period = "bugun";
const drafts = {}, pendingOrders = {};
let orderTimer = null, ready = false, channel = null;

/* ---------- helpers ---------- */
function ymd(d){const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)}
function addDays(s,n){const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return ymd(d)}
function niceDate(s){const d=new Date(s+"T12:00:00");return WDAYS[d.getDay()]+", "+d.getDate()+"-"+MONTHS[d.getMonth()]}
function shortDate(s){const d=new Date(s+"T12:00:00");return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."+d.getFullYear()}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function sp(n){const r=Math.round(+n||0);return (r<0?"−":"")+String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g," ")}
function som(n){return sp(n)+" so'm"}
function num(v){if(v==null)return NaN;return parseFloat(String(v).replace(/\s/g,"").replace(",","."))}
function uinfo(ing){return UNITS[ing&&ing.unit]||UNITS.kg}
function ppb(ing){const u=uinfo(ing);const q=(+ing.packQty||1)*u.f;return q?(+ing.packPrice||0)/q:0}
function showQty(base,ing){const u=uinfo(ing);if(u.f===1)return sp(base)+" ta";return (Math.round(base/u.f*100)/100).toString().replace(".",",")+" "+u.name}
function baseLabel(ing){return uinfo(ing).base}
function byOrder(obj){return Object.entries(obj).map(([id,v])=>({id,...v})).sort((a,b)=>(a.order||99)-(b.order||99)||String(a.name).localeCompare(String(b.name)))}
const types=()=>byOrder(S.types), clients=()=>byOrder(S.clients), ings=()=>byOrder(S.ings);
function cprice(c,tid){const p=c&&c.prices&&c.prices[tid];return +p||(+(S.types[tid]||{}).price||0)}
function typeCost(t){return (t.recipe||[]).reduce((s,r)=>{const i=S.ings[r.ing];return s+(i?r.qty*ppb(i):0)},0)}
function day(d){return S.days[d]||{orders:{},deliveries:{},consumed:{}}}
function ordersOf(d){return pendingOrders[d]||day(d).orders||{}}
function sumObj(o){return Object.values(o||{}).reduce((s,v)=>s+(+v||0),0)}
function dayTypeTotals(d){const o=ordersOf(d),t={};for(const c in o)for(const k in o[c])t[k]=(t[k]||0)+(+o[c][k]||0);return t}
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2400)}
const isAdmin=()=>!!me&&me.role==="admin";
function role(){if(!me)return "kuzatuvchi";if(isAdmin()&&preview)return preview;return me.role}
const isStaff=()=>!!me&&(me.role==="admin"||me.role==="ishchi");
const isMother=()=>role()!=="admin";
function dayKeys(){return Object.keys(S.days).sort()}
function prevDelivery(cid,d){const ks=dayKeys();for(let i=ks.length-1;i>=0;i--){const k=ks[i];if(k>=d)continue;const dl=(S.days[k].deliveries||{})[cid];if(dl&&dl.done)return {date:k,...dl}}return null}
function nextReturned(cid,d){for(const k of dayKeys()){if(k<=d)continue;const dl=(S.days[k].deliveries||{})[cid];if(dl&&dl.done)return dl.returned||{}}return false}
function clientBalance(cid,upto){const c=S.clients[cid]||{};let b=+c.startDebt||0;for(const k of dayKeys()){if(upto&&k>upto)break;const dl=(S.days[k].deliveries||{})[cid];if(dl&&dl.done)b+=(dl.givenSum||0)-(dl.retSum||0)-(dl.paid||0)}return b}
function avgDaily(iid){const ks=dayKeys().filter(k=>k<=ymd(new Date())).slice(-7);let s=0,n=0;for(const k of ks){const c=(S.days[k].consumed||{})[iid];if(c){s+=c;n++}}return n?s/n:0}
function svg(name){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[name]+'</svg>'}
async function run(p,okMsg){const r=await p;if(r&&r.error){console.error(r.error);toast("Saqlanmadi: internetni tekshiring");throw r.error}if(okMsg)toast(okMsg);return r}

/* ---------- loading data ---------- */
const LOAD = {
  ings: async()=>{const {data}=await sb.from("ingredients").select("*");S.ings=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,unit:r.unit,packQty:+r.pack_qty,packPrice:+r.pack_price,min:+r.min,stock:+r.stock,order:r.sort}]))},
  types: async()=>{const {data}=await sb.from("somsa_types").select("*");S.types=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,price:+r.price,order:r.sort,recipe:r.recipe||[]}]))},
  clients: async()=>{const {data}=await sb.from("clients").select("*");S.clients=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,place:r.place,when:r.when_text,order:r.sort,types:r.types||[],prices:r.prices||{},payMode:r.pay_mode,startDebt:+r.start_debt}]))},
  days: async()=>{const {data}=await sb.from("days").select("*");S.days=Object.fromEntries((data||[]).map(r=>[r.date,{orders:r.orders||{},deliveries:r.deliveries||{},consumed:r.consumed||{}}]))},
  moves: async()=>{const {data}=await sb.from("moves").select("*").order("at",{ascending:false}).limit(500);S.moves=Object.fromEntries((data||[]).map(r=>[r.id,{kind:r.kind,date:r.date,items:r.items||[],total:+r.total,at:r.at}]))},
  debts: async()=>{const {data}=await sb.from("debts").select("*");S.debts=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,amount:+r.amount,note:r.note,date:r.date}]))},
  config: async()=>{const {data}=await sb.from("settings").select("*").eq("key","main").maybeSingle();S.config=(data&&data.value)||{zaxira:2}},
  profiles: async()=>{const {data}=await sb.from("profiles").select("*");S.profiles=Object.fromEntries((data||[]).map(r=>[r.id,r]))}
};
const TABLE_KEY = { ingredients:"ings", somsa_types:"types", clients:"clients", days:"days", moves:"moves", debts:"debts", settings:"config" };
async function loadAll(){
  await LOAD.profiles();me=S.profiles[session.user.id]||{role:"kuzatuvchi",name:""};
  if(isStaff())await Promise.all(Object.entries(LOAD).filter(([k])=>k!=="profiles").map(([,f])=>f()));
}
async function fetchKuzatuv(d){
  K.loading=true;const {data,error}=await sb.rpc("kuzatuv",{d});K.loading=false;
  if(!error){K.date=d;K.data=data}render();
}
function subscribe(){
  if(channel)sb.removeChannel(channel);
  channel=sb.channel("somsa");
  for(const t of Object.keys(TABLE_KEY)){
    channel.on("postgres_changes",{event:"*",schema:"public",table:t},async()=>{await LOAD[TABLE_KEY[t]]();render()});
  }
  channel.subscribe();
}

/* ---------- consumption & stock ---------- */
function requirement(orders){
  const z=+S.config.zaxira||0,tot={},need={};
  for(const c in orders)for(const t in orders[c])tot[t]=(tot[t]||0)+(+orders[c][t]||0);
  for(const t in tot){if(!tot[t])continue;const ty=S.types[t];if(!ty)continue;const n=tot[t]+z;for(const r of ty.recipe||[])need[r.ing]=(need[r.ing]||0)+r.qty*n}
  return need;
}
async function saveDay(d,patch){
  const cur=day(d);const row={date:d,orders:cur.orders||{},deliveries:cur.deliveries||{},consumed:cur.consumed||{},updated_at:new Date().toISOString(),...patch};
  S.days[d]={orders:row.orders,deliveries:row.deliveries,consumed:row.consumed};
  return run(sb.from("days").upsert(row));
}
async function saveOrders(d){
  const orders=pendingOrders[d];if(!orders)return;
  const oldC=day(d).consumed||{};const newC=requirement(orders);const changes={};
  for(const iid of new Set([...Object.keys(oldC),...Object.keys(newC)])){const delta=(newC[iid]||0)-(oldC[iid]||0);if(Math.abs(delta)>1e-9&&S.ings[iid])changes[iid]=-delta}
  try{
    await saveDay(d,{orders,consumed:newC});
    if(Object.keys(changes).length)await run(sb.rpc("adjust_stock",{changes}));
    delete pendingOrders[d];render();
  }catch(e){}
}
function queueOrders(){clearTimeout(orderTimer);orderTimer=setTimeout(()=>{for(const d of Object.keys(pendingOrders))saveOrders(d)},800)}
function changeOrder(d,cid,tid,delta){
  const o=JSON.parse(JSON.stringify(ordersOf(d)));o[cid]=o[cid]||{};o[cid][tid]=Math.max(0,(+o[cid][tid]||0)+delta);
  pendingOrders[d]=o;render();queueOrders();
}

/* ---------- render ---------- */
function showView(v){
  document.getElementById("splash").hidden=v!=="splash";
  document.getElementById("loginview").hidden=v!=="login";
  document.getElementById("appview").hidden=v!=="app";
}
function splash(msg){
  showView("splash");
  document.getElementById("splash").innerHTML=markSvg(88)+'<div>'+esc(msg)+'</div>';
}
function renderBrandbar(){
  const sw=isAdmin()?'<button class="mswitch '+(preview?"on":"")+'" data-act="mother" aria-label="Ko\'rinishni almashtirish">Ko\'rinish: '+ROLE_NAMES[role()]+'</button>':"";
  document.getElementById("brandbar").innerHTML=lockupH(36)+sw;
}
function render(){
  const main=document.getElementById("main");
  if(!session){renderLogin();return}
  if(!ready)return;
  showView("app");renderBrandbar();
  if(role()==="kuzatuvchi"){
    document.getElementById("nav").hidden=true;
    if(K.date!==viewDate&&!K.loading){fetchKuzatuv(viewDate)}
    main.innerHTML=vKuzatuv();return;
  }
  const allowed=isMother()?["bugun","yetkazish"]:["bugun","yetkazish","ombor","hisob","sozlama"];
  if(!allowed.includes(tab))tab="bugun";
  const nav=document.getElementById("navin");
  nav.style.gridTemplateColumns="repeat("+allowed.length+",minmax(0,1fr))";
  nav.innerHTML=allowed.map(k=>'<button data-act="tab" data-k="'+k+'" class="'+(tab===k?"on":"")+'" aria-current="'+(tab===k?"page":"false")+'">'+svg(k)+TAB_NAMES[k]+'</button>').join("");
  document.getElementById("nav").hidden=false;
  const fn={bugun:vBugun,yetkazish:vYetkazish,ombor:vOmbor,hisob:vHisob,sozlama:vSozlama}[tab];
  const y=window.scrollY;main.innerHTML=fn();window.scrollTo(0,y);
}
function renderLogin(){
  showView("login");
  document.getElementById("loginview").innerHTML='<form class="login" id="loginForm"><div class="brand">'+markSvg(128)+wordmarkV(230)+'</div><div class="field"><label for="lg_email">Login</label><input class="inp" id="lg_email" autocapitalize="none" autocomplete="username" placeholder="masalan: onam" required></div><div class="field"><label for="lg_pass">Parol</label><input class="inp" id="lg_pass" type="password" autocomplete="current-password" required></div><div class="err" id="lg_err" role="alert"></div><button class="btn wide" type="submit">Kirish</button></form>';
  document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault();const err=document.getElementById("lg_err");err.textContent="";
    let login=document.getElementById("lg_email").value.trim().toLowerCase();if(!login.includes("@"))login+="@"+LOGIN_DOMAIN;
    const {error}=await sb.auth.signInWithPassword({email:login,password:document.getElementById("lg_pass").value});
    if(error)err.textContent=error.message.includes("Invalid")?"Login yoki parol noto'g'ri":"Kirib bo'lmadi: "+error.message});
}
function header(title,sub){
  return '<div class="top"><div class="col"><div class="h1">'+esc(title)+'</div>'+(sub?'<div class="sub">'+esc(sub)+'</div>':"")+'</div></div>';
}
function dateBar(){
  const t=ymd(new Date());const lab=viewDate===t?"Bugun":viewDate===addDays(t,1)?"Ertaga":viewDate===addDays(t,-1)?"Kecha":"";
  const arrow=d=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="'+d+'"/></svg>';
  return '<div class="datebar"><button class="icon" data-act="date" data-n="-1" aria-label="Oldingi kun">'+arrow("m15 18-6-6 6-6")+'</button><div class="d col"><span class="b">'+esc(lab||niceDate(viewDate))+'</span><span class="sub">'+esc(lab?niceDate(viewDate):shortDate(viewDate))+'</span></div><button class="icon" data-act="date" data-n="1" aria-label="Keyingi kun">'+arrow("m9 18 6-6-6-6")+'</button></div>';
}

/* BUGUN */
function vBugun(){
  const ty=types();const tot=dayTypeTotals(viewDate);const all=sumObj(tot);
  if(!ty.length)return header("Bugun")+'<div class="card empty"><b>Somsa turlari hali kiritilmagan</b><span>Sozlama bo\'limida turlar va retseptlarni qo\'shing.</span></div>';
  if(!selType||!S.types[selType])selType=(ty.find(t=>tot[t.id])||ty[0]).id;
  let h=dateBar();
  h+='<div class="hero pat"><div class="lbl">Yopiladi</div><div style="display:flex;align-items:baseline;gap:8px"><span class="big num">'+all+'</span><span class="unit">ta somsa</span></div><div class="grid3">'+
    ty.map(t=>'<button class="tile '+(selType===t.id?"on":"")+'" data-act="seltype" data-t="'+t.id+'" aria-pressed="'+(selType===t.id)+'"><span class="t">'+esc(t.name)+'</span><span class="n num">'+(tot[t.id]||0)+'</span></button>').join("")+
    '</div><div class="hint">Turini bosing — masalliqlari chiqadi</div></div>';
  const t=S.types[selType];const n=tot[selType]||0;const shown=(t.recipe||[]).filter(r=>r.show&&S.ings[r.ing]);
  h+='<div class="card"><div class="sec"><span>'+esc(t.name)+' — '+n+' ta</span></div>';
  if(!shown.length)h+='<div class="muted">Bu tur uchun ko\'rsatiladigan masalliq hali kiritilmagan.</div>';
  else if(!n)h+='<div class="muted">Bu kunga bu turdan zakaz yo\'q.</div>';
  else h+=shown.map(r=>{const ing=S.ings[r.ing];const q=r.qty*n;return '<div class="ingrow"><span>'+esc(r.label||ing.name)+'</span><span class="v num">'+sp(q)+" "+baseLabel(ing)+'</span></div>'}).join("");
  h+='</div>';
  if(!isMother()){const low=lowList();if(low.length)h+='<div class="alert '+(low.some(x=>x.out)?"bad":"")+'"><b>Masalliq kam qoldi</b><span>'+low.map(x=>esc(x.name)+": "+x.txt).join(" · ")+'</span></div>'}
  const cl=clients();const o=ordersOf(viewDate);
  h+='<div class="sec"><span>Zakazlar</span><span class="sub">'+(pendingOrders[viewDate]?"saqlanmoqda…":"saqlangan")+'</span></div>';
  if(!cl.length)h+='<div class="card empty">Mijozlar hali kiritilmagan.</div>';
  else h+='<div class="list">'+cl.map(c=>{const ts=(c.types||[]).filter(x=>S.types[x]);const prev=prevDelivery(c.id,viewDate);
    let hint="";if(prev){const rr=nextReturned(c.id,prev.date);hint=shortDate(prev.date)+": "+sumObj(prev.given)+" ta berilgan"+(rr!==false?", "+sumObj(rr)+" qaytgan":"")}
    return '<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><div class="col"><span class="b">'+esc(c.name)+'</span><span class="sub">'+esc(c.when||"")+(hint?" · "+esc(hint):"")+'</span></div>'+
    ts.map(tid=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[tid].name)+'</span><div class="stepper"><button data-act="ord" data-c="'+c.id+'" data-t="'+tid+'" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num">'+((o[c.id]||{})[tid]||0)+'</span><button class="plus" data-act="ord" data-c="'+c.id+'" data-t="'+tid+'" data-n="1" aria-label="Ko\'paytirish">+</button><button data-act="ord" data-c="'+c.id+'" data-t="'+tid+'" data-n="5" aria-label="5 ta qo\'shish" style="font-size:13px;width:44px">+5</button></div></div>').join("")+'</div>'}).join("")+'</div>';
  h+='<button class="linkbtn" data-act="logout">Hisobdan chiqish</button>';
  return h;
}
function lowList(){const out=[];for(const i of ings()){const st=+i.stock||0;const min=(+i.min||0)*uinfo(i).f;const avg=avgDaily(i.id);
  if(st<=0)out.push({name:i.name,out:true,txt:"tugagan"});else if(st<min)out.push({name:i.name,txt:showQty(st,i)+(avg?" (~"+Math.max(0,Math.floor(st/avg))+" kunga)":"")})}return out}

/* KUZATUVCHI: faqat sonlar va masalliq, pulsiz */
function vKuzatuv(){
  let h=dateBar();
  const D=K.date===viewDate?K.data:null;
  if(!D)return h+'<div class="card empty">Yuklanmoqda…</div>';
  const tys=D.types||[],cls=D.clients||[];const tot={};
  for(const c of cls)for(const t in c.orders||{})tot[t]=(tot[t]||0)+(+c.orders[t]||0);
  const all=sumObj(tot);
  if(!selType||!tys.some(t=>t.id===selType))selType=((tys.find(t=>tot[t.id])||tys[0])||{}).id;
  h+='<div class="hero pat"><div class="lbl">Yopiladi</div><div style="display:flex;align-items:baseline;gap:8px"><span class="big num">'+all+'</span><span class="unit">ta somsa</span></div><div class="grid3">'+
    tys.map(t=>'<button class="tile '+(selType===t.id?"on":"")+'" data-act="seltype" data-t="'+esc(t.id)+'" aria-pressed="'+(selType===t.id)+'"><span class="t">'+esc(t.name)+'</span><span class="n num">'+(tot[t.id]||0)+'</span></button>').join("")+'</div></div>';
  const t=tys.find(x=>x.id===selType);
  if(t){const n=tot[t.id]||0;h+='<div class="card"><div class="sec"><span>'+esc(t.name)+' — '+n+' ta</span></div>'+
    (!n?'<div class="muted">Bu kunga bu turdan zakaz yo\'q.</div>':(t.recipe||[]).map(r=>'<div class="ingrow"><span>'+esc(r.name)+'</span><span class="v num">'+sp(r.qty*n)+" "+esc(r.unit)+'</span></div>').join("")||'<div class="muted">Masalliq kiritilmagan.</div>')+'</div>'}
  const act=cls.filter(c=>sumObj(c.orders)>0||c.done);
  h+='<div class="sec"><span>Yetkazish</span><span class="sub">'+act.filter(c=>c.done).length+' / '+act.length+' berildi</span></div>';
  h+=act.length?'<div class="list">'+act.map(c=>'<div class="row"><div class="col"><span class="b">'+esc(c.name)+'</span><span class="small muted">'+esc(c.when||"")+'</span></div><div class="col" style="align-items:flex-end"><span class="b num">'+(c.done?sumObj(c.given):sumObj(c.orders))+' ta</span>'+(c.done?'<span class="pill ok">Berildi</span>':'<span class="pill warn">Kutilmoqda</span>')+'</div></div>').join("")+'</div>':'<div class="card empty">Bu kunga zakaz yo\'q.</div>';
  h+='<button class="linkbtn" data-act="logout">Hisobdan chiqish</button>';
  return h;
}

/* YETKAZISH */
function delivState(c){
  const d=viewDate;const dl=(day(d).deliveries||{})[c.id];const z=ordersOf(d)[c.id]||{};const prev=prevDelivery(c.id,d);
  const ts=(c.types||[]).filter(x=>S.types[x]);
  const given=dl?dl.given:Object.fromEntries(ts.map(t=>[t,+z[t]||0]));
  const prevTs=prev?Object.keys(prev.given||{}).filter(t=>prev.given[t]>0):[];
  const returned=dl?(dl.returned||{}):(drafts[c.id]||{});
  const priceMap=Object.fromEntries(ts.map(t=>[t,cprice(c,t)]));
  const givenSum=Object.keys(given).reduce((s,t)=>s+(+given[t]||0)*(priceMap[t]||cprice(c,t)),0);
  const retSum=Object.keys(returned).reduce((s,t)=>s+(+returned[t]||0)*((prev&&prev.priceMap&&prev.priceMap[t])||cprice(c,t)),0);
  const prevSum=prev?(prev.givenSum||0):0;
  const mode=c.payMode==="darhol"?"darhol":"ertasi";
  const due=(mode==="ertasi"?prevSum:givenSum)-retSum;
  const before=clientBalance(c.id,addDays(d,-1));
  return {dl,z,prev,ts,given,prevTs,returned,priceMap,givenSum,retSum,prevSum,mode,due,before,zSum:sumObj(z)};
}
function vYetkazish(){
  let h=header("Yetkazish","Do'konlar vaqt bo'yicha")+dateBar();
  const cl=clients().filter(c=>{const z=sumObj(ordersOf(viewDate)[c.id]);const dl=(day(viewDate).deliveries||{})[c.id];const prev=prevDelivery(c.id,viewDate);return z>0||dl||(prev&&prev.date===addDays(viewDate,-1)&&sumObj(prev.given)>0)});
  if(!cl.length)return h+'<div class="card empty"><b>Bu kunga zakaz yo\'q</b><span>Zakazlar "Bugun" bo\'limida kiritiladi.</span></div>';
  const doneN=cl.filter(c=>((day(viewDate).deliveries||{})[c.id]||{}).done).length;
  h+='<div class="sec"><span>'+doneN+' / '+cl.length+' berildi</span></div>';
  for(const c of cl){const s=delivState(c);const done=s.dl&&s.dl.done;
    h+='<div class="card '+(done?"done":"")+'"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div class="col"><span class="b" style="font-size:16px">'+esc(c.name)+'</span><span class="small" style="color:var(--bad);font-weight:600">'+esc(c.when||"")+'</span></div><div class="col" style="align-items:flex-end"><span class="xb num" style="font-size:17px">'+sumObj(s.given)+' ta</span><span class="sub num">'+som(s.givenSum)+'</span></div></div>';
    h+='<div class="small muted">'+s.ts.filter(t=>s.given[t]).map(t=>esc(S.types[t].name)+" "+s.given[t]+" × "+sp(s.priceMap[t])).join(" · ")+(s.zSum!==sumObj(s.given)?' · <span class="pill warn">zakaz '+s.zSum+' ta</span>':"")+'</div>';
    if(s.prev){h+='<div class="box"><span class="small muted">'+shortDate(s.prev.date)+': '+sumObj(s.prev.given)+' ta berilgan</span>';
      if(!done&&s.prevTs.length)h+=s.prevTs.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>Qaytdi — '+esc(S.types[t].name)+'</span><div class="stepper"><button data-act="ret" data-c="'+c.id+'" data-t="'+t+'" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num">'+(+s.returned[t]||0)+'</span><button data-act="ret" data-c="'+c.id+'" data-t="'+t+'" data-n="1" aria-label="Ko\'paytirish">+</button></div></div>').join("");
      else if(done)h+='<span class="small">Qaytdi: '+sumObj(s.returned)+' ta</span>';
      h+='</div>'}
    if(done){h+='<div class="box"><span class="small muted">Olindi</span><span class="xb num" style="font-size:18px">'+som(s.dl.paid||0)+'</span><span class="small">Qolgan qarz: '+som(clientBalance(c.id,viewDate))+'</span></div><div class="grid2"><button class="btn ghost small" data-act="nak" data-c="'+c.id+'">Nakladnoy</button><button class="btn ghost small" data-act="fix" data-c="'+c.id+'">O\'zgartirish</button></div>'}
    else{const old=s.before-(s.mode==="ertasi"?s.prevSum:0);
      h+='<div class="box"><span class="small muted">'+(s.mode==="ertasi"?"Kechagi zakaz uchun olinadi":"Bugungi zakaz uchun olinadi")+'</span><span class="xb num" style="font-size:20px">'+som(Math.max(0,s.due))+'</span>'+(old>0?'<span class="small" style="color:var(--bad)">Eski qarz: '+som(old)+'</span>':"")+'</div>'+
      '<div style="display:flex;gap:8px"><button class="btn ok" style="flex:1;min-height:52px" data-act="give" data-c="'+c.id+'">Hammasi to\'g\'ri — Berildi</button><button class="btn ghost" data-act="fix" data-c="'+c.id+'">Tuzatish</button></div>'}
    h+='</div>'}
  return h;
}
async function saveDelivery(cid,given,returned,paid){
  const c=S.clients[cid];const d=viewDate;const s=delivState(c);
  const givenSum=Object.keys(given).reduce((x,t)=>x+(+given[t]||0)*(s.priceMap[t]||cprice(c,t)),0);
  const retSum=Object.keys(returned).reduce((x,t)=>x+(+returned[t]||0)*((s.prev&&s.prev.priceMap&&s.prev.priceMap[t])||cprice(c,t)),0);
  const deliveries=Object.assign({},day(d).deliveries||{});
  deliveries[cid]={given,returned,paid:Math.max(0,paid),done:true,givenSum,retSum,priceMap:s.priceMap,at:new Date().toISOString(),by:session.user.id};
  try{await saveDay(d,{orders:ordersOf(d),deliveries});delete drafts[cid];toast("Saqlandi");render()}catch(e){}
}

/* OMBOR */
function vOmbor(){
  let h=header("Ombor","Qoldiq chegaradan kamaysa, xabar chiqadi");
  h+='<div class="grid3"><button class="btn" data-act="xarid">Xarid</button><button class="btn ghost" data-act="uyga">Uyga o\'tkazish</button><button class="btn ghost" data-act="sanash">Sanash</button></div>';
  const list=ings();
  if(!list.length)return h+'<div class="card empty">Masalliqlar hali kiritilmagan.</div>';
  if(!Object.values(S.moves).some(m=>m.kind==="sanash"||m.kind==="xarid"))h+='<div class="alert"><b>Ombor hali sanalmagan</b><span>Boshlash uchun "Sanash" tugmasini bosib, hozir bor masalliqni kiriting.</span></div>';
  h+='<div class="list">'+list.map(i=>{const st=+i.stock||0;const min=(+i.min||0)*uinfo(i).f;const avg=avgDaily(i.id);const low=st<min;const maxv=Math.max(min*3,st,1);
    return '<div class="row" style="flex-direction:column;align-items:stretch;gap:6px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="b">'+esc(i.name)+'</span><span class="xb num" style="color:'+(low?"var(--bad)":"var(--ok)")+'">'+(st<0?"−":"")+showQty(Math.abs(st),i)+'</span></div><div class="bar"><i style="width:'+Math.max(0,Math.min(100,st/maxv*100))+'%;background:'+(low?"var(--bad)":"var(--ok)")+'"></i></div><div style="display:flex;justify-content:space-between" class="small muted"><span>'+som(ppb(i)*uinfo(i).f)+' / '+uinfo(i).name+'</span><span>'+(avg?"~"+Math.max(0,Math.floor(st/avg))+" kunga · ":"")+'chegara '+showQty(min,i)+'</span></div></div>'}).join("")+'</div>';
  const mv=Object.values(S.moves).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,15);
  if(mv.length){h+='<div class="sec">Oxirgi amallar</div><div class="list">'+mv.map(m=>{const k={xarid:"Xarid",uyga:"Uyga o'tkazildi",sanash:"Sanash"}[m.kind]||m.kind;
    const items=(m.items||[]).map(it=>{const i=S.ings[it.ing];if(!i)return"";return esc(i.name)+" "+(m.kind==="sanash"?showQty(it.actual,i)+(Math.abs(it.actual-it.expected)>0.5?" (farq "+(it.actual-it.expected>0?"+":"−")+showQty(Math.abs(it.actual-it.expected),i)+")":""):showQty(it.qty,i))}).filter(Boolean).join(", ");
    return '<div class="row"><div class="col"><span class="b">'+k+' · '+shortDate(m.date)+'</span><span class="small muted">'+items+'</span></div>'+(m.total?'<span class="b num">'+sp(m.total)+'</span>':"")+'</div>'}).join("")+'</div>'}
  return h;
}

/* HISOB */
function inPeriod(k){const t=ymd(new Date());if(period==="bugun")return k===t;if(period==="hafta")return k>addDays(t,-7)&&k<=t;return k.slice(0,7)===t.slice(0,7)&&k<=t}
function sellRate(cid){const t=ymd(new Date());let g=0,r=0;for(const k of dayKeys()){const dl=(S.days[k].deliveries||{})[cid];if(!dl||!dl.done)continue;if(k>addDays(t,-7)&&k<=t)g+=sumObj(dl.given);if(k>addDays(t,-6)&&k<=addDays(t,1))r+=sumObj(dl.returned)}return g?Math.max(0,Math.round((1-r/g)*100)):null}
function vHisob(){
  let h=header("Hisob","");
  h+='<div class="chips">'+[["bugun","Bugun"],["hafta","7 kun"],["oy","Shu oy"]].map(([k,l])=>'<button class="chip '+(period===k?"on":"")+'" data-act="period" data-k="'+k+'">'+l+'</button>').join("")+'</div>';
  let zak=0,giv=0,ret=0,rev=0,paid=0,cost=0;const perType={};
  for(const k of dayKeys()){if(!inPeriod(k))continue;const dd=S.days[k];zak+=Object.values(dd.orders||{}).reduce((s,o)=>s+sumObj(o),0);
    for(const cid in dd.deliveries||{}){const dl=dd.deliveries[cid];if(!dl.done)continue;giv+=sumObj(dl.given);ret+=sumObj(dl.returned);rev+=(dl.givenSum||0)-(dl.retSum||0);paid+=dl.paid||0;
      for(const t in dl.given||{})perType[t]=(perType[t]||0)+(+dl.given[t]||0);for(const t in dl.returned||{})perType[t]=(perType[t]||0)-(+dl.returned[t]||0)}}
  for(const t in perType){const ty=S.types[t];if(ty)cost+=perType[t]*typeCost(ty)}
  let buy=0,home=0;for(const m of Object.values(S.moves)){if(!inPeriod(m.date))continue;if(m.kind==="xarid")buy+=m.total||0;if(m.kind==="uyga")home+=m.total||0}
  h+='<div class="grid2">'+[["Sotildi",sp(giv-ret)+" ta"],["Savdo",som(rev)],["Tushgan pul",som(paid)],["Foyda (taxminan)",som(rev-cost)]].map(([a,b])=>'<div class="card" style="gap:2px"><span class="small muted">'+a+'</span><span class="xb num" style="font-size:18px">'+b+'</span></div>').join("")+'</div>';
  h+='<div class="list">'+[["Zakaz",sp(zak)+" ta"],["Berildi",sp(giv)+" ta"],["Zakazdan kam berildi",sp(Math.max(0,zak-giv))+" ta"],["Qaytdi",sp(ret)+" ta"],["Somsa tan narxi",som(cost)],["Xaridlar",som(buy)],["Uyga o'tkazildi",som(home)]].map(([a,b])=>'<div class="row"><span>'+a+'</span><span class="b num">'+b+'</span></div>').join("")+'</div>';
  h+='<div class="sec">Tan narx</div>';
  h+=types().map(t=>{const tc=typeCost(t);return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="xb" style="font-size:17px">'+esc(t.name)+'</span><span class="xb num" style="font-size:20px;color:var(--accent)">'+som(tc)+'</span></div>'+
    (t.recipe||[]).filter(r=>S.ings[r.ing]).map(r=>{const i=S.ings[r.ing];return '<div style="display:flex;justify-content:space-between" class="small"><span class="muted">'+esc(r.label||i.name)+' '+(uinfo(i).f===1?(Math.round(r.qty*1000)/1000).toString().replace(".",",")+" ta":(Math.round(r.qty*10)/10).toString().replace(".",",")+" "+baseLabel(i))+'</span><span class="num">'+sp(r.qty*ppb(i))+'</span></div>'}).join("")+
    '<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px"><span>Foyda, '+sp(t.price)+' dan</span><span class="b num" style="color:var(--ok)">'+som(t.price-tc)+'</span></div></div>'}).join("");
  h+='<div class="sec">Bizga qarzlar</div><div class="list">'+clients().map(c=>{const b=clientBalance(c.id);const st=sellRate(c.id);
    return '<div class="row"><div class="col"><span class="b">'+esc(c.name)+'</span><span class="small muted">'+(c.payMode==="darhol"?"darhol to'laydi":"ertasi kuni to'laydi")+(st!=null?" · 7 kunda sotilishi "+st+"%":"")+'</span></div><span class="b num" style="color:'+(b>0?"var(--bad)":"var(--ink)")+'">'+som(b)+'</span></div>'}).join("")+'</div>';
  const debts=Object.entries(S.debts).map(([id,d])=>({id,...d}));const dt=debts.reduce((s,d)=>s+(+d.amount||0),0);
  h+='<div class="sec"><span>Bizning qarzlarimiz</span><button class="btn small" data-act="debt">+ Qarz</button></div>';
  h+=debts.length?'<div class="list">'+debts.map(d=>'<div class="row"><div class="col"><span class="b">'+esc(d.name)+'</span><span class="small muted">'+esc(d.note||"")+'</span></div><div style="display:flex;gap:8px;align-items:center"><span class="b num">'+som(d.amount)+'</span><button class="btn ghost small" data-act="debtpay" data-id="'+d.id+'">To\'landi</button></div></div>').join("")+'<div class="row"><span class="b">Jami</span><span class="xb num">'+som(dt)+'</span></div></div>':'<div class="card empty">Qarzlar hali kiritilmagan.</div>';
  return h;
}

/* SOZLAMA */
function vSozlama(){
  let h=header("Sozlama","Retsept, narx va mijozlarni shu yerda o'zgartirasiz");
  h+='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div class="col"><span class="b">Zaxira</span><span class="small muted">Har bir turga qo\'shiladi. Faqat ombor hisobida ishlatiladi, onangizga ko\'rinmaydi.</span></div><div class="stepper"><button data-act="zax" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num">'+(+S.config.zaxira||0)+'</span><button class="plus" data-act="zax" data-n="1" aria-label="Ko\'paytirish">+</button></div></div></div>';
  h+='<div class="sec"><span>Somsa turlari</span><button class="btn small" data-act="edtype">+ Tur</button></div><div class="list">'+types().map(t=>'<div class="row"><div class="col"><span class="b">'+esc(t.name)+'</span><span class="small muted">'+som(t.price)+' · '+(t.recipe||[]).length+' ta masalliq</span></div><button class="btn ghost small" data-act="edtype" data-id="'+t.id+'">Tahrirlash</button></div>').join("")+'</div>';
  h+='<div class="sec"><span>Mijozlar</span><button class="btn small" data-act="edclient">+ Mijoz</button></div><div class="list">'+clients().map(c=>'<div class="row"><div class="col"><span class="b">'+esc(c.name)+'</span><span class="small muted">'+esc(c.when||"")+' · '+(c.types||[]).map(t=>(S.types[t]||{}).name).filter(Boolean).join(", ")+'</span></div><button class="btn ghost small" data-act="edclient" data-id="'+c.id+'">Tahrirlash</button></div>').join("")+'</div>';
  h+='<div class="sec"><span>Masalliqlar</span><button class="btn small" data-act="eding">+ Masalliq</button></div><div class="list">'+ings().map(i=>'<div class="row"><div class="col"><span class="b">'+esc(i.name)+'</span><span class="small muted">'+som(i.packPrice)+' / '+(i.packQty||1)+' '+uinfo(i).name+' · chegara '+(i.min||0)+' '+uinfo(i).name+'</span></div><button class="btn ghost small" data-act="eding" data-id="'+i.id+'">Tahrirlash</button></div>').join("")+'</div>';
  const ppl=Object.values(S.profiles).sort((a,b)=>["admin","ishchi","kuzatuvchi"].indexOf(a.role)-["admin","ishchi","kuzatuvchi"].indexOf(b.role)||String(a.name).localeCompare(String(b.name)));
  h+='<div class="sec"><span>Foydalanuvchilar</span><button class="btn small" data-act="user">+ Kishi</button></div><div class="list">'+ppl.map(p=>'<div class="row"><div class="col"><span class="b">'+esc(p.name||"—")+(p.id===session.user.id?' <span class="small muted">(siz)</span>':"")+'</span><span class="small muted">'+esc(p.login||"")+' · '+ROLE_NAMES[p.role]+'</span></div><button class="btn ghost small" data-act="user" data-id="'+p.id+'">Tahrirlash</button></div>').join("")+'</div>';
  h+='<div class="small muted">Admin — hammasini boshqaradi. Ishchi — Bugun va Yetkazish. Kuzatuvchi — faqat somsa soni, masalliq va yetkazish holatini ko\'radi, pul ko\'rinmaydi.</div>';
  h+='<div class="grid2"><button class="btn ghost" data-act="history">O\'zgarishlar tarixi</button><button class="btn ghost" data-act="logout">Hisobdan chiqish</button></div>';
  return h;
}
async function callUsers(body){
  const {data,error}=await sb.functions.invoke("foydalanuvchi",{body});
  if(error){let msg="Bajarilmadi";try{const j=await error.context.json();if(j&&j.error)msg=j.error}catch(e){}toast(msg);throw error}
  if(data&&data.error){toast(data.error);throw new Error(data.error)}
  await LOAD.profiles();render();return data;
}
function roleSelect(cur){return '<select class="inp" id="u_role">'+Object.keys(ROLE_NAMES).map(r=>'<option value="'+r+'"'+(r===cur?" selected":"")+'>'+ROLE_NAMES[r]+'</option>').join("")+'</select>'}
function mUser(id){
  const p=id?S.profiles[id]:null;
  if(!p){
    openModal(mHead("Yangi foydalanuvchi")+'<div class="field"><label for="u_name">Ismi</label><input class="inp" id="u_name" placeholder="Masalan: Onam"></div><div class="field"><label for="u_login">Login (lotin harflarda)</label><input class="inp" id="u_login" autocapitalize="none" autocomplete="off" placeholder="masalan: onam"></div><div class="field"><label for="u_pass">Parol (kamida 6 belgi)</label><input class="inp" id="u_pass" autocomplete="new-password"></div><div class="field"><label for="u_role">Roli</label>'+roleSelect("kuzatuvchi")+'</div><button class="btn wide" id="u_save" style="min-height:52px">Qo\'shish</button>',m=>{
      m.querySelector("#u_save").addEventListener("click",async()=>{try{await callUsers({action:"create",name:m.querySelector("#u_name").value,login:m.querySelector("#u_login").value,password:m.querySelector("#u_pass").value,role:m.querySelector("#u_role").value});closeModal();toast("Qo'shildi")}catch(e){}})});
    return;
  }
  const self=id===session.user.id;
  openModal(mHead(p.name||"Foydalanuvchi")+'<div class="card" style="gap:2px"><span class="small muted">Login</span><span class="b">'+esc(p.login||"")+'</span></div><div class="field"><label for="u_name">Ismi</label><input class="inp" id="u_name" value="'+esc(p.name||"")+'"></div><div class="field"><label for="u_role">Roli</label>'+roleSelect(p.role)+'</div><button class="btn wide" id="u_save">Saqlash</button><div class="field"><label for="u_pass">Yangi parol</label><div class="inrow"><input class="inp" id="u_pass" autocomplete="new-password"><button class="btn ghost small" id="u_pw">O\'rnatish</button></div></div>'+(self?"":'<button class="btn danger wide" id="u_del">Bu foydalanuvchini o\'chirish</button>'),m=>{
    m.querySelector("#u_save").addEventListener("click",async()=>{try{await callUsers({action:"update",id,name:m.querySelector("#u_name").value,role:m.querySelector("#u_role").value});closeModal();toast("Saqlandi")}catch(e){}});
    m.querySelector("#u_pw").addEventListener("click",async()=>{try{await callUsers({action:"password",id,password:m.querySelector("#u_pass").value});toast("Parol o'zgardi");m.querySelector("#u_pass").value=""}catch(e){}});
    const del=m.querySelector("#u_del");if(del)del.addEventListener("click",()=>{openModal(mHead("O'chirilsinmi?")+'<div class="card"><span class="b">'+esc(p.name||"")+'</span><span class="small muted">U endi dasturga kira olmaydi.</span></div><button class="btn danger wide" id="cd_yes">Ha, o\'chirish</button><button class="btn ghost wide" data-act="close">Bekor qilish</button>',mm=>{
      mm.querySelector("#cd_yes").addEventListener("click",async()=>{try{await callUsers({action:"delete",id});closeModal();toast("O'chirildi")}catch(e){}})})});
  });
}

/* ---------- modals ---------- */
function openModal(html,mount){const m=document.getElementById("modal");m.innerHTML=html;document.getElementById("modalwrap").hidden=false;if(mount)mount(m)}
function closeModal(){document.getElementById("modalwrap").hidden=true;document.getElementById("modal").innerHTML=""}
window.somsaBack=()=>{if(!document.getElementById("modalwrap").hidden){closeModal();return true}return false};
function mHead(t){return '<div style="display:flex;justify-content:space-between;align-items:center"><div class="h1" style="font-size:20px">'+esc(t)+'</div><button class="icon" data-act="close" aria-label="Yopish"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>'}
function stepHtml(prefix,t,v){return '<div class="stepper"><button type="button" data-step="'+prefix+'" data-t="'+t+'" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num" id="'+prefix+'_'+t+'">'+v+'</span><button type="button" class="plus" data-step="'+prefix+'" data-t="'+t+'" data-n="1" aria-label="Ko\'paytirish">+</button></div>'}

function mFix(cid){
  const c=S.clients[cid];const s=delivState(c);const given=Object.assign({},s.given);const ret=Object.assign({},s.returned);
  const retTs=s.prev?Object.keys(s.prev.given||{}).filter(t=>s.prev.given[t]>0):[];
  const calc=()=>{const gs=Object.keys(given).reduce((x,t)=>x+given[t]*(s.priceMap[t]||0),0);const rs=Object.keys(ret).reduce((x,t)=>x+(+ret[t]||0)*((s.prev&&s.prev.priceMap&&s.prev.priceMap[t])||cprice(c,t)),0);return (s.mode==="ertasi"?s.prevSum:gs)-rs};
  let h=mHead(c.name)+'<div class="card"><span class="b">Bugun berildi</span>'+s.ts.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[t].name)+' <span class="small muted">zakaz '+((s.z||{})[t]||0)+'</span></span>'+stepHtml("g",t,given[t]||0)+'</div>').join("")+'</div>';
  if(retTs.length)h+='<div class="card"><span class="b">Qaytdi ('+shortDate(s.prev.date)+' dagi)</span>'+retTs.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[t].name)+'</span>'+stepHtml("r",t,+ret[t]||0)+'</div>').join("")+'</div>';
  h+='<div class="field"><label for="fx_paid">Olindi (so\'m)</label><input class="inp num" id="fx_paid" inputmode="numeric" value="'+Math.round(s.dl?s.dl.paid:Math.max(0,s.due))+'"></div><div class="small muted" id="fx_hint"></div><button class="btn ok wide" id="fx_save" style="min-height:52px">Saqlash — Berildi</button>';
  openModal(h,m=>{const hint=m.querySelector("#fx_hint");const paid=m.querySelector("#fx_paid");let touched=!!s.dl;
    const upd=()=>{const d=calc();hint.textContent="Hisob bo'yicha olinadi: "+som(Math.max(0,d));if(!touched)paid.value=Math.round(Math.max(0,d))};upd();
    paid.addEventListener("input",()=>touched=true);
    m.addEventListener("click",e=>{const b=e.target.closest("[data-step]");if(!b)return;const obj=b.dataset.step==="g"?given:ret;const t=b.dataset.t;obj[t]=Math.max(0,(+obj[t]||0)+(+b.dataset.n));m.querySelector("#"+b.dataset.step+"_"+t).textContent=obj[t];upd()});
    m.querySelector("#fx_save").addEventListener("click",async()=>{const p=num(paid.value);closeModal();await saveDelivery(cid,given,ret,isNaN(p)?0:p)})});
}
function mNak(cid){
  const c=S.clients[cid];const dl=(day(viewDate).deliveries||{})[cid];if(!dl)return;
  const lines=["NAKLADNOY","Mijoz: "+c.name,"Sana: "+shortDate(viewDate),""];
  for(const t in dl.given){if(!dl.given[t])continue;const p=(dl.priceMap||{})[t]||cprice(c,t);lines.push((S.types[t]||{}).name+": "+dl.given[t]+" × "+sp(p)+" = "+sp(dl.given[t]*p))}
  lines.push("Jami berildi: "+sumObj(dl.given)+" ta, "+som(dl.givenSum||0));
  if(sumObj(dl.returned)){lines.push("");lines.push("Qaytdi: "+sumObj(dl.returned)+" ta, "+som(dl.retSum||0))}
  lines.push("");lines.push("Olindi: "+som(dl.paid||0));lines.push("Qolgan qarz: "+som(clientBalance(cid,viewDate)));
  const txt=lines.join("\n");
  openModal(mHead("Nakladnoy")+'<pre class="nak" id="nak_txt">'+esc(txt)+'</pre><div class="grid2"><button class="btn" id="nak_share">Yuborish</button><button class="btn ghost" id="nak_copy">Nusxa olish</button></div>',m=>{
    const sel=()=>{const r=document.createRange();r.selectNodeContents(m.querySelector("#nak_txt"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Matn belgilandi, nusxa oling")};
    m.querySelector("#nak_copy").addEventListener("click",()=>{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>toast("Nusxa olindi"),sel);else sel()});
    m.querySelector("#nak_share").addEventListener("click",()=>{location.href="https://t.me/share/url?url="+encodeURIComponent(" ")+"&text="+encodeURIComponent(txt)})});
}
function mXarid(){
  const list=ings();
  let h=mHead("Xarid")+'<div class="field"><label for="x_date">Sana</label><input class="inp" type="date" id="x_date" value="'+ymd(new Date())+'"></div><div class="small muted">Faqat olganlaringizni to\'ldiring. Summa bo\'sh qolsa, joriy narx bilan hisoblanadi.</div>';
  h+=list.map(i=>'<div class="card" style="gap:6px"><span class="b">'+esc(i.name)+' <span class="small muted">'+som(ppb(i)*uinfo(i).f)+' / '+uinfo(i).name+'</span></span><div class="inrow"><input class="inp num" id="xq_'+i.id+'" inputmode="decimal" placeholder="Miqdor" aria-label="'+esc(i.name)+' miqdori"><span class="tag">'+uinfo(i).name+'</span><input class="inp num" id="xs_'+i.id+'" inputmode="numeric" placeholder="Summa" aria-label="'+esc(i.name)+' summasi"><span class="tag">so\'m</span></div></div>').join("");
  h+='<button class="btn wide" id="x_save" style="min-height:52px">Saqlash</button>';
  openModal(h,m=>{m.querySelector("#x_save").addEventListener("click",async()=>{
    const date=m.querySelector("#x_date").value||ymd(new Date());const items=[];const changes={};const priceW=[];let total=0;
    for(const i of list){const q=num(m.querySelector("#xq_"+i.id).value);if(!(q>0))continue;let s=num(m.querySelector("#xs_"+i.id).value);const u=uinfo(i);
      if(!(s>0))s=q*ppb(i)*u.f;const base=q*u.f;items.push({ing:i.id,qty:base,sum:s});total+=s;changes[i.id]=base;
      priceW.push(sb.from("ingredients").update({pack_price:Math.round(s/base*(i.packQty||1)*u.f)}).eq("id",i.id))}
    if(!items.length){toast("Hech narsa kiritilmadi");return}
    try{await run(sb.rpc("adjust_stock",{changes}));await Promise.all(priceW);await run(sb.from("moves").insert({kind:"xarid",date,items,total}),"Xarid saqlandi");closeModal()}catch(e){}})});
}
function mUyga(){
  const list=ings();
  const h=mHead("Uyga o'tkazish")+'<div class="field"><label for="u_ing">Masalliq</label><select class="inp" id="u_ing">'+list.map(i=>'<option value="'+i.id+'">'+esc(i.name)+' (omborda '+showQty(+i.stock||0,i)+')</option>').join("")+'</select></div><div class="field"><label for="u_q">Miqdor</label><div class="inrow"><input class="inp num" id="u_q" inputmode="decimal"><span class="tag" id="u_unit"></span></div></div><div class="b num" id="u_sum"></div><button class="btn wide" id="u_save" style="min-height:52px">Uyga o\'tkazish</button>';
  openModal(h,m=>{const sel=m.querySelector("#u_ing"),q=m.querySelector("#u_q");
    const upd=()=>{const i=S.ings[sel.value];m.querySelector("#u_unit").textContent=uinfo(i).name;const v=num(q.value);m.querySelector("#u_sum").textContent=v>0?"Puli: "+som(v*uinfo(i).f*ppb(i)):""};upd();
    sel.addEventListener("change",upd);q.addEventListener("input",upd);
    m.querySelector("#u_save").addEventListener("click",async()=>{const i=S.ings[sel.value];const v=num(q.value);if(!(v>0)){toast("Miqdorni kiriting");return}
      const base=v*uinfo(i).f,s=base*ppb(i);
      try{await run(sb.rpc("adjust_stock",{changes:{[sel.value]:-base}}));await run(sb.from("moves").insert({kind:"uyga",date:ymd(new Date()),items:[{ing:sel.value,qty:base,sum:s}],total:s}),"Uyga o'tkazildi");closeModal()}catch(e){}})});
}
function mSanash(){
  const list=ings();
  let h=mHead("Sanash")+'<div class="small muted">Omborda haqiqatda qancha borligini kiriting. Bo\'sh qoldirilganlari o\'zgarmaydi.</div>';
  h+=list.map(i=>'<div class="card" style="gap:6px"><span class="b">'+esc(i.name)+' <span class="small muted">hisob bo\'yicha '+showQty(+i.stock||0,i)+'</span></span><div class="inrow"><input class="inp num" id="sq_'+i.id+'" inputmode="decimal" placeholder="Haqiqiy qoldiq" aria-label="'+esc(i.name)+' qoldig\'i"><span class="tag">'+uinfo(i).name+'</span></div></div>').join("");
  h+='<button class="btn wide" id="s_save" style="min-height:52px">Saqlash</button>';
  openModal(h,m=>{m.querySelector("#s_save").addEventListener("click",async()=>{const items=[],w=[];
    for(const i of list){const raw=m.querySelector("#sq_"+i.id).value;if(raw.trim()==="")continue;const v=num(raw);if(isNaN(v)||v<0)continue;const base=v*uinfo(i).f;items.push({ing:i.id,expected:+i.stock||0,actual:base});w.push(sb.from("ingredients").update({stock:base}).eq("id",i.id))}
    if(!items.length){toast("Hech narsa kiritilmadi");return}
    try{const rs=await Promise.all(w);if(rs.some(r=>r.error))throw 1;await run(sb.from("moves").insert({kind:"sanash",date:ymd(new Date()),items,total:0}),"Qoldiq yangilandi");closeModal()}catch(e){toast("Saqlanmadi")}})});
}
function mDebt(){
  openModal(mHead("Bizning qarz")+'<div class="field"><label for="d_name">Kimga</label><input class="inp" id="d_name"></div><div class="field"><label for="d_amt">Summa (so\'m)</label><input class="inp num" id="d_amt" inputmode="numeric"></div><div class="field"><label for="d_note">Izoh</label><input class="inp" id="d_note"></div><button class="btn wide" id="d_save">Saqlash</button>',m=>{
    m.querySelector("#d_save").addEventListener("click",async()=>{const n=m.querySelector("#d_name").value.trim(),a=num(m.querySelector("#d_amt").value);if(!n||!(a>0)){toast("Ism va summani kiriting");return}
      try{await run(sb.from("debts").insert({name:n,amount:a,note:m.querySelector("#d_note").value.trim()}),"Saqlandi");closeModal()}catch(e){}})});
}
function mDebtPay(id){
  const d=S.debts[id];if(!d)return;
  openModal(mHead("Qarz to'landimi?")+'<div class="card"><span class="b">'+esc(d.name)+'</span><span class="xb num" style="font-size:20px">'+som(d.amount)+'</span></div><button class="btn ok wide" id="dp_yes">Ha, to\'landi — ro\'yxatdan o\'chirish</button><button class="btn ghost wide" data-act="close">Bekor qilish</button>',m=>{
    m.querySelector("#dp_yes").addEventListener("click",async()=>{try{await run(sb.from("debts").delete().eq("id",id),"O'chirildi");closeModal()}catch(e){}})});
}
function slug(s){return (String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")||"x")+"_"+Math.random().toString(36).slice(2,6)}
function mType(id){
  const t=id?JSON.parse(JSON.stringify(S.types[id])):{name:"",price:0,order:types().length+1,recipe:[]};
  const ingOpts=sel=>ings().map(i=>'<option value="'+i.id+'"'+(i.id===sel?" selected":"")+'>'+esc(i.name)+' ('+baseLabel(i)+')</option>').join("");
  const rows=()=>(t.recipe||[]).map((r,k)=>'<div class="card" style="gap:6px"><div class="inrow"><select class="inp" data-r="'+k+'" data-f="ing" aria-label="Masalliq">'+ingOpts(r.ing)+'</select><input class="inp num" style="max-width:96px" data-r="'+k+'" data-f="qty" inputmode="decimal" value="'+String(r.qty).replace(".",",")+'" aria-label="Miqdor"></div><div class="inrow"><input class="inp" data-r="'+k+'" data-f="label" placeholder="Onamga ko\'rinadigan nom (ixtiyoriy)" value="'+esc(r.label||"")+'" aria-label="Nom"></div><div style="display:flex;justify-content:space-between;align-items:center"><label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-r="'+k+'" data-f="show"'+(r.show?" checked":"")+'> Onamga ko\'rinsin</label><button class="btn danger small" type="button" data-rm="'+k+'">O\'chirish</button></div></div>').join("");
  const h=mHead(id?"Somsa turi":"Yangi tur")+'<div class="field"><label for="t_name">Nomi</label><input class="inp" id="t_name" value="'+esc(t.name)+'"></div><div class="grid2"><div class="field"><label for="t_price">Asosiy narx (so\'m)</label><input class="inp num" id="t_price" inputmode="numeric" value="'+(t.price||"")+'"></div><div class="field"><label for="t_ord">Tartib</label><input class="inp num" id="t_ord" inputmode="numeric" value="'+(t.order||"")+'"></div></div><div class="sec">Retsept — 1 ta somsaga</div><div class="small muted">Miqdor masalliqning o\'lchovida: g, ml yoki ta. Masalan karobka 20 ta somsaga 1 ta bo\'lsa — 0,05.</div><div id="t_rows" style="display:flex;flex-direction:column;gap:8px">'+rows()+'</div><button class="btn ghost wide" type="button" id="t_add">+ Masalliq qo\'shish</button><button class="btn wide" id="t_save" style="min-height:52px">Saqlash</button>'+(id?'<button class="btn danger wide" id="t_del">Bu turni o\'chirish</button>':"");
  openModal(h,m=>{const box=m.querySelector("#t_rows");
    const sync=()=>box.querySelectorAll("[data-r]").forEach(el=>{const r=t.recipe[+el.dataset.r];const f=el.dataset.f;if(f==="show")r.show=el.checked;else if(f==="qty")r.qty=num(el.value)||0;else r[f]=el.value});
    m.querySelector("#t_add").addEventListener("click",()=>{sync();const first=ings()[0];t.recipe.push({ing:first?first.id:"",qty:0,show:true,label:""});box.innerHTML=rows()});
    box.addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(!b)return;sync();t.recipe.splice(+b.dataset.rm,1);box.innerHTML=rows()});
    m.querySelector("#t_save").addEventListener("click",async()=>{sync();const name=m.querySelector("#t_name").value.trim();if(!name){toast("Nomini kiriting");return}
      try{await run(sb.from("somsa_types").upsert({id:id||slug(name),name,price:num(m.querySelector("#t_price").value)||0,sort:num(m.querySelector("#t_ord").value)||99,recipe:t.recipe.filter(r=>r.ing&&r.qty>0)}),"Saqlandi");closeModal()}catch(e){}});
    const del=m.querySelector("#t_del");if(del)del.addEventListener("click",()=>confirmDel("somsa_types",id,t.name))});
}
function mClient(id){
  const c=id?JSON.parse(JSON.stringify(S.clients[id])):{name:"",place:"",when:"",order:clients().length+1,types:[],prices:{},payMode:"ertasi",startDebt:0};
  const h=mHead(id?"Mijoz":"Yangi mijoz")+'<div class="field"><label for="c_name">Nomi</label><input class="inp" id="c_name" value="'+esc(c.name)+'"></div><div class="field"><label for="c_place">Joyi</label><input class="inp" id="c_place" value="'+esc(c.place||"")+'"></div><div class="field"><label for="c_when">Yetkazish vaqti</label><input class="inp" id="c_when" value="'+esc(c.when||"")+'"></div><div class="grid2"><div class="field"><label for="c_ord">Yetkazish tartibi</label><input class="inp num" id="c_ord" inputmode="numeric" value="'+(c.order||"")+'"></div><div class="field"><label for="c_debt">Boshlang\'ich qarzi</label><input class="inp num" id="c_debt" inputmode="numeric" value="'+(c.startDebt||0)+'"></div></div><div class="field"><label for="c_pay">To\'lov</label><select class="inp" id="c_pay"><option value="ertasi"'+(c.payMode!=="darhol"?" selected":"")+'>Ertasi kuni, yangi zakaz olib borilganda</option><option value="darhol"'+(c.payMode==="darhol"?" selected":"")+'>Darhol, somsa berilganda</option></select></div><div class="sec">Oladigan turlari va narxi</div><div class="small muted">Narx bo\'sh qolsa, asosiy narx olinadi.</div>'+
    types().map(t=>'<div class="card" style="gap:6px"><label style="display:flex;gap:8px;align-items:center" class="b"><input type="checkbox" id="ct_'+t.id+'"'+((c.types||[]).includes(t.id)?" checked":"")+'> '+esc(t.name)+'</label><div class="inrow"><input class="inp num" id="cp_'+t.id+'" inputmode="numeric" placeholder="'+sp(t.price)+'" value="'+((c.prices||{})[t.id]||"")+'" aria-label="'+esc(t.name)+' narxi"><span class="tag">so\'m</span></div></div>').join("")+
    '<button class="btn wide" id="c_save" style="min-height:52px">Saqlash</button>'+(id?'<button class="btn danger wide" id="c_del">Bu mijozni o\'chirish</button>':"");
  openModal(h,m=>{m.querySelector("#c_save").addEventListener("click",async()=>{const name=m.querySelector("#c_name").value.trim();if(!name){toast("Nomini kiriting");return}
    const ts=types().filter(t=>m.querySelector("#ct_"+t.id).checked).map(t=>t.id);const prices={};types().forEach(t=>{const v=num(m.querySelector("#cp_"+t.id).value);if(v>0)prices[t.id]=v});
    try{await run(sb.from("clients").upsert({id:id||slug(name),name,place:m.querySelector("#c_place").value.trim(),when_text:m.querySelector("#c_when").value.trim(),sort:num(m.querySelector("#c_ord").value)||99,types:ts,prices,pay_mode:m.querySelector("#c_pay").value,start_debt:num(m.querySelector("#c_debt").value)||0}),"Saqlandi");closeModal()}catch(e){}});
    const del=m.querySelector("#c_del");if(del)del.addEventListener("click",()=>confirmDel("clients",id,c.name))});
}
function mIng(id){
  const i=id?Object.assign({},S.ings[id]):{name:"",unit:"kg",packQty:1,packPrice:0,min:0,order:ings().length+1,stock:0};
  const h=mHead(id?"Masalliq":"Yangi masalliq")+'<div class="field"><label for="i_name">Nomi</label><input class="inp" id="i_name" value="'+esc(i.name)+'"></div><div class="field"><label for="i_unit">O\'lchov</label><select class="inp" id="i_unit">'+Object.keys(UNITS).map(u=>'<option value="'+u+'"'+(i.unit===u?" selected":"")+'>'+UNITS[u].name+'</option>').join("")+'</select></div><div class="grid2"><div class="field"><label for="i_pq">Qadoq miqdori</label><input class="inp num" id="i_pq" inputmode="decimal" value="'+String(i.packQty).replace(".",",")+'"></div><div class="field"><label for="i_pp">Qadoq narxi (so\'m)</label><input class="inp num" id="i_pp" inputmode="numeric" value="'+(i.packPrice||"")+'"></div></div><div class="small muted">Masalan: un 1 qop = 50 kg, 485 000 so\'m.</div><div class="field"><label for="i_min">Chegara — shundan kamaysa xabar chiqadi</label><input class="inp num" id="i_min" inputmode="decimal" value="'+String(i.min||0).replace(".",",")+'"></div><button class="btn wide" id="i_save" style="min-height:52px">Saqlash</button>'+(id?'<button class="btn danger wide" id="i_del">Bu masalliqni o\'chirish</button>':"");
  openModal(h,m=>{m.querySelector("#i_save").addEventListener("click",async()=>{const name=m.querySelector("#i_name").value.trim();if(!name){toast("Nomini kiriting");return}
    const row={id:id||slug(name),name,unit:m.querySelector("#i_unit").value,pack_qty:num(m.querySelector("#i_pq").value)||1,pack_price:num(m.querySelector("#i_pp").value)||0,min:num(m.querySelector("#i_min").value)||0,sort:i.order||99};
    if(!id)row.stock=0;
    try{await run(sb.from("ingredients").upsert(row),"Saqlandi");closeModal()}catch(e){}});
    const del=m.querySelector("#i_del");if(del)del.addEventListener("click",()=>confirmDel("ingredients",id,i.name))});
}
function confirmDel(table,id,name){
  openModal(mHead("O'chirilsinmi?")+'<div class="card"><span class="b">'+esc(name)+'</span><span class="small muted">Bu amalni qaytarib bo\'lmaydi. U o\'zgarishlar tarixida qoladi.</span></div><button class="btn danger wide" id="cd_yes">Ha, o\'chirish</button><button class="btn ghost wide" data-act="close">Bekor qilish</button>',m=>{
    m.querySelector("#cd_yes").addEventListener("click",async()=>{try{await run(sb.from(table).delete().eq("id",id),"O'chirildi");closeModal()}catch(e){}})});
}
async function mHistory(){
  openModal(mHead("O'zgarishlar tarixi")+'<div class="muted">Yuklanmoqda…</div>');
  const {data,error}=await sb.from("history").select("*").order("at",{ascending:false}).limit(80);
  if(error){openModal(mHead("O'zgarishlar tarixi")+'<div class="card empty">Tarixni yuklab bo\'lmadi.</div>');return}
  const TBL={days:"Kun (zakaz / yetkazish)",moves:"Ombor amali",ingredients:"Masalliq",somsa_types:"Somsa turi",clients:"Mijoz",debts:"Bizning qarz",settings:"Sozlama"};
  const OP={INSERT:"qo'shildi",UPDATE:"o'zgardi",DELETE:"o'chirildi"};
  const rows=(data||[]).map(r=>{const d=new Date(r.at);const who=(S.profiles[r.by]||{}).name||"";const nm=r.data&&(r.data.name||(r.tbl==="days"?shortDate(r.data.date):r.tbl==="moves"?({xarid:"Xarid",uyga:"Uyga",sanash:"Sanash"}[r.data.kind]):""));
    return '<div class="row"><div class="col"><span class="b">'+esc(TBL[r.tbl]||r.tbl)+' '+esc(OP[r.op]||r.op)+'</span><span class="small muted">'+esc(nm||"")+(who?" · "+esc(who):"")+'</span></div><span class="small muted num">'+String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+'</span></div>'}).join("");
  openModal(mHead("O'zgarishlar tarixi")+(rows?'<div class="list">'+rows+'</div>':'<div class="card empty">Hali o\'zgarish yo\'q.</div>'));
}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="close"){closeModal();return}
  if(!ready)return;
  if(a==="tab"){tab=b.dataset.k;window.scrollTo(0,0);render()}
  else if(a==="mother"){preview=preview===null?"ishchi":preview==="ishchi"?"kuzatuvchi":null;window.scrollTo(0,0);render()}
  else if(a==="user")mUser(b.dataset.id);
  else if(a==="date"){viewDate=addDays(viewDate,+b.dataset.n);render()}
  else if(a==="seltype"){selType=b.dataset.t;render()}
  else if(a==="ord")changeOrder(viewDate,b.dataset.c,b.dataset.t,+b.dataset.n);
  else if(a==="ret"){const d=drafts[b.dataset.c]=drafts[b.dataset.c]||{};d[b.dataset.t]=Math.max(0,(+d[b.dataset.t]||0)+(+b.dataset.n));render()}
  else if(a==="give"){const c=S.clients[b.dataset.c];const s=delivState(c);saveDelivery(c.id,s.given,s.returned,Math.max(0,s.due))}
  else if(a==="fix")mFix(b.dataset.c);
  else if(a==="nak")mNak(b.dataset.c);
  else if(a==="xarid")mXarid();else if(a==="uyga")mUyga();else if(a==="sanash")mSanash();
  else if(a==="period"){period=b.dataset.k;render()}
  else if(a==="debt")mDebt();else if(a==="debtpay")mDebtPay(b.dataset.id);
  else if(a==="zax"){const v=Object.assign({},S.config,{zaxira:Math.max(0,(+S.config.zaxira||0)+(+b.dataset.n))});S.config=v;render();run(sb.from("settings").upsert({key:"main",value:v}))}
  else if(a==="edtype")mType(b.dataset.id);else if(a==="edclient")mClient(b.dataset.id);else if(a==="eding")mIng(b.dataset.id);
  else if(a==="history")mHistory();
  else if(a==="logout"){sb.auth.signOut()}
});
document.getElementById("modalwrap").addEventListener("click",e=>{if(e.target.id==="modalwrap")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")window.somsaBack()});
async function refresh(){if(!session||!ready)return;await loadAll();if(role()==="kuzatuvchi")await fetchKuzatuv(viewDate);else render()}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
// Kuzatuvchi jonli yangilanishni olmaydi: har daqiqada yangilab turamiz
setInterval(()=>{if(document.visibilityState==="visible"&&session&&ready&&role()==="kuzatuvchi")fetchKuzatuv(viewDate)},60000);

/* ---------- boot ---------- */
async function start(sess){
  session=sess;ready=false;
  if(!session){if(channel){sb.removeChannel(channel);channel=null}render();return}
  splash("Ma'lumotlar yuklanmoqda…");
  try{await loadAll()}catch(e){splash("Ma'lumotlarni yuklab bo'lmadi. Internetni tekshirib, dasturni qayta oching.");return}
  ready=true;subscribe();render();
}
let lastUser=undefined;
sb.auth.onAuthStateChange((_ev,sess)=>{const uid=sess?sess.user.id:null;if(uid===lastUser){session=sess;return}lastUser=uid;setTimeout(()=>start(sess),0)});
