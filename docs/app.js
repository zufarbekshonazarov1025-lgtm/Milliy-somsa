import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { markSvg, lockupH, wordmarkV, patternUrl } from './brand.js?v=26';
document.documentElement.style.setProperty('--pattern', patternUrl());

// Yangi versiya chiqqan bo'lsa, telefondagi eski nusxa o'rniga darhol yangisini yuklaydi.
// Har yangilanishda APP_V, version.json va index.html'dagi ?v= raqami birga oshiriladi.
const APP_V = "26";
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
  kalk:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M10 12h6M10 16h6"/>',
  kalkulyator:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
  kassa:'<rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 10h.01M18 15h.01"/>',
  qarzlar:'<path d="M17 3l4 4-4 4"/><path d="M21 7H9"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h12"/>',
  excel:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="m9 12 4 5M13 12l-4 5"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  uy:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M12 17s-3-1.8-3-3.6a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.8-3 3.6-3 3.6z"/>',
  dashboard:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  koproq:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  bugun:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  yetkazish:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  ombor:'<path d="M21 8 12 3 3 8v13h18z"/><path d="M7 21v-8h10v8"/>',
  hisob:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',
  sozlama:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};
// Admin uchun pastki panel: eng ko'p ishlatiladigan bo'limlar. Qolganlari ☰ menyuda.
const ADMIN_TABS = ["dashboard","bugun","yetkazish","ombor","kalkulyator"];
const MOTHER_TABS = ["bugun","yetkazish","ombor","kalkulyator","kassa","qarzlar"];
const TAB_NAMES = { kalk:"Kalkulyatsiya", kalkulyator:"Kalkulyator", kassa:"Hisob-kitob", qarzlar:"Qarzlar", uy:"Uyga", dashboard:"Dashboard", koproq:"Ko'proq", bugun:"Bugun", yetkazish:"Yetkazish", ombor:"Ombor", hisob:"Hisob", sozlama:"Sozlama" };

const S = { types:{}, ings:{}, clients:{}, days:{}, moves:{}, debts:{}, payments:{}, expenses:{}, cashIn:{}, cred:{}, kassa:{}, semi:{}, config:{zaxira:2}, profiles:{} };
const LOGIN_DOMAIN = "milliysomsa.uz";
const ROLE_NAMES = { admin:"Admin", ishchi:"Ishchi", kuzatuvchi:"Kuzatuvchi" };
const K = { date:null, data:null, loading:false };   // kuzatuvchi dashboardi uchun
let session = null, me = null, preview = null, tab = "dashboard", viewDate = ymd(new Date()), selType = null, period = "bugun";
const drafts = {}, pendingOrders = {};
let orderTimer = null, ready = false, channel = null;

/* ---------- helpers ---------- */
function ymd(d){const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)}
function addDays(s,n){const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return ymd(d)}
function niceDate(s){const d=new Date(s+"T12:00:00");return WDAYS[d.getDay()]+", "+d.getDate()+"-"+MONTHS[d.getMonth()]}
function shortDate(s){const d=new Date(s+"T12:00:00");return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."+d.getFullYear()}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function sp(n){const r=Math.round(+n||0);return (r<0?"−":"")+String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g," ")}
/* Pul maydonlari: yozish paytida 100000 → 100 000 */
function groupDigits(v){const str=String(v==null?"":v);const neg=/^\s*[-−]/.test(str);const d=str.replace(/[^\d]/g,"");return (neg&&d?"-":"")+d.replace(/\B(?=(\d{3})+(?!\d))/g," ")}
function fmtNumInputs(root){if(!root||!root.querySelectorAll)return;const list=root.matches&&root.matches('input[inputmode="numeric"]')?[root]:root.querySelectorAll('input[inputmode="numeric"]');list.forEach(el=>{if(!el.value)return;const f=groupDigits(el.value);if(f!==el.value)el.value=f})}
document.addEventListener("input",e=>{const el=e.target;if(!el||el.tagName!=="INPUT"||el.getAttribute("inputmode")!=="numeric")return;
  const pos=el.selectionStart==null?el.value.length:el.selectionStart;const before=el.value.slice(0,pos).replace(/[^\d]/g,"").length;const f=groupDigits(el.value);if(f===el.value)return;el.value=f;
  let i=0,n=0;while(i<f.length&&n<before){if(/\d/.test(f[i]))n++;i++}try{el.setSelectionRange(i,i)}catch(_){}},true);
// Ba'zi Android klaviaturalari "input" ni kechiktiradi: chiqishda ham formatlaymiz
for(const ev of ["compositionend","change","blur","keyup"])document.addEventListener(ev,e=>{const el=e.target;if(el&&el.tagName==="INPUT"&&el.getAttribute("inputmode")==="numeric"&&el.value){const f=groupDigits(el.value);if(f!==el.value){const end=el.selectionStart===el.value.length;el.value=f;if(end)try{el.setSelectionRange(f.length,f.length)}catch(_){}}}},true);
new MutationObserver(ms=>{for(const m of ms)for(const nd of m.addedNodes)if(nd.nodeType===1)fmtNumInputs(nd)}).observe(document.documentElement,{childList:true,subtree:true});
function som(n){return sp(n)+" so'm"}
function num(v){if(v==null)return NaN;return parseFloat(String(v).replace(/\s/g,"").replace(",","."))}
function uinfo(ing){return UNITS[ing&&ing.unit]||UNITS.kg}
function ppb(ing){const u=uinfo(ing);const q=(+ing.packQty||1)*u.f;return q?(+ing.packPrice||0)/q:0}
function showQty(base,ing){const u=uinfo(ing);if(u.f===1)return sp(base)+" ta";return (Math.round(base/u.f*100)/100).toString().replace(".",",")+" "+u.name}
function baseLabel(ing){return uinfo(ing).base}
function byOrder(obj){return Object.entries(obj).map(([id,v])=>({id,...v})).sort((a,b)=>(a.order||99)-(b.order||99)||String(a.name).localeCompare(String(b.name)))}
const types=()=>byOrder(S.types), clients=()=>byOrder(S.clients), ings=()=>byOrder(S.ings);
function cprice(c,tid){const p=c&&c.prices&&c.prices[tid];return +p||(+(S.types[tid]||{}).price||0)}
/* Yarim tayyor mahsulotlar: retseptdagi kalit "s:<id>" ko'rinishida bo'ladi */
const isSemiRef=r=>typeof r==="string"&&r.startsWith("s:");
const semis=()=>byOrder(S.semi);
function semiPpb(sm){const out=+sm.yield||0;if(!out)return 0;return (sm.recipe||[]).reduce((s,r)=>{const i=S.ings[r.ing];return s+(i?r.qty*ppb(i):0)},0)/out}
function refItem(ref){if(isSemiRef(ref)){const sm=S.semi[ref.slice(2)];return sm?{id:ref,name:sm.name,base:"g",f:1000,uname:"kg",ppb:semiPpb(sm),semi:sm}:null}
  const i=S.ings[ref];return i?{id:ref,name:i.name,base:baseLabel(i),f:uinfo(i).f,uname:uinfo(i).name,ppb:ppb(i),ing:i}:null}
function qtyTxt(base,it){if(it.f===1)return sp(base)+" ta";return (Math.round(base/it.f*100)/100).toString().replace(".",",")+" "+it.uname}
/* Ombordagi hamma narsa: xom ashyo va yarim tayyor mahsulotlar (bir xil ko'rinishda) */
function stockItems(){return ings().concat(semis().map(sm=>({id:"s:"+sm.id,name:sm.name,unit:"kg",stock:sm.stock,min:sm.min,packQty:1,packPrice:semiPpb(sm)*1000,semi:true,order:900+(sm.order||0)})))}
function stockItem(id){return stockItems().find(x=>x.id===id)}
const domId=id=>String(id).replace(/[^A-Za-z0-9_-]/g,"_");
function typeCost(t){return (t.recipe||[]).reduce((s,r)=>{const it=refItem(r.ing);return s+(it?r.qty*it.ppb:0)},0)}
function clientOf(id){return S.clients[id]?{id,...S.clients[id]}:null}
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
function clientBalance(cid,upto){const c=S.clients[cid]||{};let b=+c.startDebt||0;for(const k of dayKeys()){if(upto&&k>upto)break;const dl=(S.days[k].deliveries||{})[cid];if(dl&&dl.done)b+=(dl.givenSum||0)-(dl.retSum||0)-(dl.paid||0)}
  for(const p of Object.values(S.payments)){if(p.client===cid&&(!upto||p.date<=upto))b-=p.amount}return b}
/* Qarz qoidalari: summa chegarasi va muddat (FIFO: eng eski to'lanmagan somsa sanasi) */
function debtRules(){return {max:S.config.debtMax!=null?+S.config.debtMax:500000,days:S.config.debtDays!=null?+S.config.debtDays:7}}
function daysBetween(a,b){return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5)}
function debtInfo(cid){
  const t=ymd(new Date());const c=S.clients[cid]||{};const ks=dayKeys();const ch=[];let cr=0;
  if(+c.startDebt>0)ch.push({date:ks[0]&&ks[0]<t?ks[0]:t,amt:+c.startDebt});else if(+c.startDebt<0)cr-= +c.startDebt;
  for(const k of ks){const dl=(S.days[k].deliveries||{})[cid];if(!dl||!dl.done)continue;if(dl.givenSum>0)ch.push({date:k,amt:+dl.givenSum});cr+=(+dl.retSum||0)+(+dl.paid||0)}
  for(const p of Object.values(S.payments))if(p.client===cid)cr+=+p.amount||0;
  let since=null,bal=0;for(const x of ch){const use=Math.min(cr,x.amt);cr-=use;const left=x.amt-use;if(left>0.5){if(!since)since=x.date;bal+=left}}
  bal-=cr;const days=since?Math.max(0,daysBetween(since,t)):0;const R=debtRules();
  const over=bal>R.max,late=bal>0&&days>R.days;
  const why=[over?"qarz "+sp(R.max)+" dan oshdi":"",late?days+" kundan beri to'lanmagan":""].filter(Boolean).join(", ");
  return {bal,since,days,over,late,flag:over||late,why};
}
function debtFlags(){return clients().map(c=>({c,d:debtInfo(c.id)})).filter(x=>x.d.flag).sort((a,b)=>b.d.bal-a.d.bal)}
function avgDaily(iid){const ks=dayKeys().filter(k=>k<=ymd(new Date())).slice(-7);let s=0,n=0;for(const k of ks){const c=(S.days[k].consumed||{})[iid];if(c){s+=c;n++}}return n?s/n:0}
function svg(name){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[name]+'</svg>'}
async function run(p,okMsg){const r=await p;if(r&&r.error){console.error(r.error);toast("Saqlanmadi: internetni tekshiring");throw r.error}if(okMsg)toast(okMsg);return r}

/* ---------- loading data ---------- */
const LOAD = {
  ings: async()=>{const {data,error}=await sb.from("ingredients").select("*");if(error)throw error;S.ings=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,unit:r.unit,packQty:+r.pack_qty,packPrice:+r.pack_price,min:+r.min,stock:+r.stock,order:r.sort}]))},
  types: async()=>{const {data,error}=await sb.from("somsa_types").select("*");if(error)throw error;S.types=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,price:+r.price,order:r.sort,recipe:r.recipe||[]}]))},
  clients: async()=>{const {data,error}=await sb.from("clients").select("*");if(error)throw error;S.clients=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,place:r.place,when:r.when_text,order:r.sort,types:r.types||[],prices:r.prices||{},payMode:r.pay_mode,startDebt:+r.start_debt}]))},
  days: async()=>{const {data,error}=await sb.from("days").select("*");if(error)throw error;S.days=Object.fromEntries((data||[]).map(r=>[r.date,{orders:r.orders||{},deliveries:r.deliveries||{},consumed:r.consumed||{}}]))},
  moves: async()=>{const {data,error}=await sb.from("moves").select("*").order("at",{ascending:false}).limit(500);if(error)throw error;S.moves=Object.fromEntries((data||[]).map(r=>[r.id,{kind:r.kind,date:r.date,items:r.items||[],total:+r.total,at:r.at,supplier:r.supplier||"",pay:r.pay||"naqd",note:r.note||"",by:r.by}]))},
  debts: async()=>{const {data,error}=await sb.from("debts").select("*");if(error)throw error;S.debts=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,amount:+r.amount,note:r.note,date:r.date}]))},
  config: async()=>{const {data,error}=await sb.from("settings").select("*");if(error)throw error;const m=Object.fromEntries((data||[]).map(r=>[r.key,r.value]));S.config=m.main||{zaxira:2};S.kassa=m.kassa||{}},
  semi: async()=>{const {data,error}=await sb.from("semi").select("*");if(error)throw error;S.semi=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,recipe:r.recipe||[],yield:+r.yield,show:r.show,order:r.sort,stock:+r.stock,min:+r.min}]))},
  cashIn: async()=>{if(!isStaff()){S.cashIn={};return}const {data,error}=await sb.from("cash_in").select("*");if(error)throw error;S.cashIn=Object.fromEntries((data||[]).map(r=>[r.id,{date:r.date,amount:+r.amount,note:r.note,at:r.at}]))},
  cred: async()=>{if(!isStaff()){S.cred={};return}const {data,error}=await sb.from("creditor_ledger").select("*");if(error)throw error;S.cred=Object.fromEntries((data||[]).map(r=>[r.id,{name:r.name,date:r.date,amount:+r.amount,note:r.note,cash:r.cash,at:r.at}]))},
  payments: async()=>{const {data,error}=await sb.from("payments").select("*");if(error)throw error;S.payments=Object.fromEntries((data||[]).map(r=>[r.id,{client:r.client_id,date:r.date,amount:+r.amount,note:r.note,at:r.at}]))},
  expenses: async()=>{if(!isStaff()){S.expenses={};return}const {data,error}=await sb.from("expenses").select("*");if(error)throw error;S.expenses=Object.fromEntries((data||[]).map(r=>[r.id,{date:r.date,category:r.category,amount:+r.amount,note:r.note,at:r.at}]))},
  profiles: async()=>{const {data,error}=await sb.from("profiles").select("*");if(error)throw error;S.profiles=Object.fromEntries((data||[]).map(r=>[r.id,r]))}
};
const TABLE_KEY = { ingredients:"ings", somsa_types:"types", clients:"clients", days:"days", moves:"moves", debts:"debts", settings:"config", payments:"payments", expenses:"expenses", cash_in:"cashIn", creditor_ledger:"cred", semi:"semi" };
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
    channel.on("postgres_changes",{event:"*",schema:"public",table:t},async()=>{try{await LOAD[TABLE_KEY[t]]();applyQueued();saveCache();render()}catch(e){}});
  }
  channel.subscribe();
}

/* ---------- internetsiz ishlash: navbat va kesh ---------- */
const QKEY="somsa_queue_v1", CKEY="somsa_cache_v1";
function qGet(){try{return JSON.parse(localStorage.getItem(QKEY)||"[]")}catch(e){return []}}
function qSet(q){try{localStorage.setItem(QKEY,JSON.stringify(q))}catch(e){}if(ready)renderBrandbar()}
const isNetErr=e=>!navigator.onLine||/fetch|network|load failed|timeout|abort/i.test(String((e&&(e.message||e))||""));
function exec(op){
  if(op.k==="day")return sb.from("days").upsert(op.row);
  if(op.k==="stock")return sb.rpc("adjust_stock",{changes:op.changes});
  if(op.k==="pay")return sb.from("payments").insert(op.row);
  return Promise.resolve({error:null});
}
/* Internet bo'lsa darhol yuboradi; bo'lmasa telefonda navbatga qo'yadi va keyin o'zi yuboradi. */
async function sendOrQueue(op,okMsg){
  if(navigator.onLine){
    const r=await Promise.resolve(exec(op)).catch(e=>({error:e}));
    if(!r.error){if(okMsg)toast(okMsg);return true}
    if(!isNetErr(r.error)){console.error(r.error);toast("Saqlanmadi: "+(r.error.message||"xato"));throw r.error}
  }
  let q=qGet();if(op.k==="day")q=q.filter(x=>!(x.k==="day"&&x.row.date===op.row.date));q.push(op);qSet(q);
  toast("Internet yo'q — telefonda saqlandi, internet chiqqanda yuboriladi");return false;
}
let flushing=false;
async function flushQueue(){
  if(flushing||!session||!navigator.onLine)return;const q=qGet();if(!q.length)return;flushing=true;
  const rest=[];for(const op of q){const r=await Promise.resolve(exec(op)).catch(e=>({error:e}));if(r.error&&isNetErr(r.error))rest.push(op)}
  qSet(rest);flushing=false;
  if(rest.length<q.length){toast("Saqlanmagan amallar yuborildi");refresh()}
}
function applyQueued(){for(const op of qGet()){if(op.k==="day")S.days[op.row.date]={orders:op.row.orders,deliveries:op.row.deliveries,consumed:op.row.consumed};if(op.k==="pay")S.payments[op.row.id]={client:op.row.client_id,date:op.row.date,amount:+op.row.amount,note:op.row.note}}}
function saveCache(){try{const lim=addDays(ymd(new Date()),-60);const days=Object.fromEntries(Object.entries(S.days).filter(([k])=>k>=lim));
  localStorage.setItem(CKEY,JSON.stringify({uid:session.user.id,at:Date.now(),S:{...S,days}}))}catch(e){}}
function loadCache(){try{const c=JSON.parse(localStorage.getItem(CKEY)||"null");if(c&&c.uid===session.user.id){Object.assign(S,c.S);me=S.profiles[session.user.id]||null;return !!me}}catch(e){}return false}
window.addEventListener("online",()=>{flushQueue();if(ready)renderBrandbar()});
window.addEventListener("offline",()=>{if(ready)renderBrandbar()});
setInterval(flushQueue,20000);

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
  return sendOrQueue({k:"day",row});
}
async function saveOrders(d){
  const orders=pendingOrders[d];if(!orders)return;
  const oldC=day(d).consumed||{};const newC=requirement(orders);const changes={};
  for(const iid of new Set([...Object.keys(oldC),...Object.keys(newC)])){const delta=(newC[iid]||0)-(oldC[iid]||0);if(Math.abs(delta)>1e-9&&refItem(iid))changes[iid]=-delta}
  try{
    await saveDay(d,{orders,consumed:newC});
    if(Object.keys(changes).length)await sendOrQueue({k:"stock",changes});
    delete pendingOrders[d];render();
  }catch(e){}
}
function queueOrders(){clearTimeout(orderTimer);orderTimer=setTimeout(()=>{for(const d of Object.keys(pendingOrders))saveOrders(d)},800)}
function clearOrders(d){
  const all=Object.values(ordersOf(d)).reduce((a,x)=>a+sumObj(x),0);if(!all)return;
  openModal(mHead("Zakazlar 0 qilinsinmi?")+'<div class="card"><span class="b">'+esc(niceDate(d))+' — '+all+' ta somsa</span><span class="small muted">Shu kundagi barcha do\'konlar zakazi 0 bo\'ladi. Yetkazilgan somsa va pullar o\'zgarmaydi.</span></div><button class="btn danger wide" id="oc_yes">Ha, hammasini 0 qilish</button><button class="btn ghost wide" data-act="close">Bekor qilish</button>',m=>{
    m.querySelector("#oc_yes").addEventListener("click",()=>{pendingOrders[d]={};closeModal();render();clearTimeout(orderTimer);saveOrders(d).then(()=>toast("Zakazlar 0 qilindi"))})});
}
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
  const sw=!isAdmin()?"":preview?'<button class="mswitch on" data-act="mother" aria-label="Ko\'rinishni almashtirish">Ko\'rinish: '+ROLE_NAMES[role()]+'</button>':'<button class="icon menubtn" data-act="menu" aria-label="Menyu">'+svg("menu")+'</button>';
  const qn=qGet().length;const net=(!navigator.onLine||qn)?'<span class="pill '+(navigator.onLine?"warn":"bad")+'" role="status">'+(navigator.onLine?"":"Internet yo'q")+(qn?(navigator.onLine?"":" · ")+qn+" ta amal kutmoqda":"")+'</span>':"";
  document.getElementById("brandbar").innerHTML=lockupH(28,'#162538')+'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">'+net+sw+'</div>';
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
  const VIEWS={dashboard:vDashboard,koproq:vKoproq,bugun:vBugun,yetkazish:vYetkazish,ombor:vOmbor,hisob:vHisob,sozlama:vSozlama,kalk:vKalk,kalkulyator:vKalkulyator,kassa:vKassa,qarzlar:vQarzlar,uy:vUy};
  let allowed;
  if(!isMother()){
    if(!VIEWS[tab]||tab==="koproq")tab="dashboard";
    allowed=ADMIN_TABS;
  }else{
    allowed=MOTHER_TABS;
    if(!allowed.includes(tab))tab="bugun";
  }
  const nav=document.getElementById("navin");
  nav.style.gridTemplateColumns="repeat("+allowed.length+",minmax(0,1fr))";document.getElementById("nav").classList.toggle("n6",allowed.length>5);
  nav.innerHTML=allowed.map(k=>'<button data-act="tab" data-k="'+k+'" class="'+(tab===k?"on":"")+'" aria-current="'+(tab===k?"page":"false")+'">'+svg(k)+'<span class="nl">'+TAB_NAMES[k]+'</span></button>').join("");
  document.getElementById("nav").hidden=false;
  const fn=VIEWS[tab];
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

/* DASHBOARD (admin): tan narx va foydasiz umumiy ko'rinish */
function daySold(k){let g=0,r=0;const dd=S.days[k];if(!dd)return 0;for(const cid in dd.deliveries||{}){const dl=dd.deliveries[cid];if(!dl.done)continue;g+=sumObj(dl.given);const rr=nextReturned(cid,k);if(rr)r+=sumObj(rr)}return Math.max(0,g-r)}
function monthStats(from,to){let rev=0,cnt=0;for(const k of dayKeys()){if(k<from||k>to)continue;for(const cid in S.days[k].deliveries||{}){const dl=S.days[k].deliveries[cid];if(!dl.done)continue;rev+=(dl.givenSum||0)-(dl.retSum||0);cnt+=sumObj(dl.given)-sumObj(dl.returned)}}return {rev,cnt}}
function pct(a,b){if(!b)return "";const p=Math.round((a-b)/b*100);return '<span class="small" style="font-weight:700;color:'+(p>=0?"var(--ok)":"var(--bad)")+'">'+(p>=0?"▲ ":"▼ ")+Math.abs(p)+'% o\'tgan oydan</span>'}
function vDashboard(){
  const t=ymd(new Date());let h=header("Dashboard",niceDate(t));
  const tot=sumObj(dayTypeTotals(t));const dels=(day(t).deliveries)||{};
  const active=clients().filter(c=>sumObj(ordersOf(t)[c.id])>0||dels[c.id]);const doneN=active.filter(c=>(dels[c.id]||{}).done).length;
  let cash=0;for(const cid in dels)if(dels[cid].done)cash+=dels[cid].paid||0;for(const p of Object.values(S.payments))if(p.date===t)cash+=p.amount;
  const prog=active.length?Math.round(doneN/active.length*100):0;
  h+='<div class="hero pat" role="button" tabindex="0" data-act="go" data-k="bugun" style="cursor:pointer"><div class="grid2"><div><div class="lbl">Bugun yopiladi</div><div><span class="big num">'+tot+'</span> <span class="unit">ta</span></div></div><div><div class="lbl">Bugun tushgan pul</div><div class="xb num" style="font-size:24px;color:var(--orange);line-height:1.6">'+sp(cash)+'</div></div></div>'+
    '<div><div class="lbl">Yetkazish: '+doneN+' / '+active.length+' do\'kon berildi</div><div class="bar" style="background:#2B4064;margin-top:6px;height:7px"><i style="width:'+prog+'%;background:var(--orange)"></i></div></div></div>';
  const fl=debtFlags();
  if(fl.length)h+='<div class="alert bad"><b>Qarzni undirish kerak — '+fl.length+' ta do\'kon</b>'+fl.map(x=>'<div role="button" tabindex="0" data-act="akt" data-c="'+x.c.id+'" style="display:flex;justify-content:space-between;gap:8px;cursor:pointer;padding:4px 0"><span><b>'+esc(x.c.name)+'</b> <span class="small">'+esc(x.d.why)+'</span></span><b class="num" style="white-space:nowrap">'+som(x.d.bal)+'</b></div>').join("")+'</div>';
  const owed=clients().map(c=>clientBalance(c.id)).filter(b=>b>0);const owedSum=owed.reduce((a,b)=>a+b,0);
  const crs=credBalances().filter(x=>x.b>0);const debtSum=crs.reduce((a,x)=>a+x.b,0);
  const m0=t.slice(0,8)+"01";const pd=new Date(t+"T12:00:00");pd.setMonth(pd.getMonth()-1);const pt=ymd(pd);const pm0=pt.slice(0,8)+"01";
  const cur=monthStats(m0,t),prv=monthStats(pm0,pt);
  const tile=(lbl,val,sub,k)=>'<div class="card" role="button" tabindex="0" data-act="go" data-k="'+k+'" style="gap:4px;cursor:pointer"><span class="small muted" style="font-weight:600">'+lbl+'</span><span class="xb num" style="font-size:20px">'+val+'</span>'+sub+'</div>';
  h+='<div class="grid2">'+tile("Kassadagi pul",sp(kassaBalance()),'<span class="small muted">Hisob-kitob</span>',"kassa")+tile("Mijozlardagi pulim",sp(owedSum),'<span class="small muted">'+owed.length+' ta do\'konda</span>',"qarzlar")+
    tile("Bizning qarzlarimiz",sp(debtSum),'<span class="small muted">'+crs.length+' ta joyga</span>',"qarzlar")+tile("Shu oy savdo",sp(cur.rev),pct(cur.rev,prv.rev)||'<span class="small muted">'+sp(cur.cnt)+' ta sotildi</span>',"hisob")+'</div>';
  // 7 kunlik grafik
  const ds=[];for(let i=6;i>=0;i--){const k=addDays(t,-i);const z=Object.values(ordersOf(k)).reduce((a,o)=>a+sumObj(o),0);ds.push({k,z,s:k<t?daySold(k):0})}
  const mx=Math.max(1,...ds.map(d=>Math.max(d.z,d.s)));const WD=["Ya","Du","Se","Ch","Pa","Ju","Sh"];
  h+='<div class="card"><div class="sec"><span>Oxirgi 7 kun</span><span class="sub">somsa soni</span></div><div role="img" aria-label="Oxirgi 7 kunlik zakaz va sotilgan somsa" style="display:flex;align-items:flex-end;gap:8px;height:120px">'+ds.map(d=>'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%"><div style="flex:1;width:100%;display:flex;align-items:flex-end;gap:3px"><i title="Zakaz '+d.z+'" style="flex:1;display:block;border-radius:4px 4px 0 0;background:#D9DEE6;height:'+(d.z/mx*100)+'%"></i><i title="Sotildi '+d.s+'" style="flex:1;display:block;border-radius:4px 4px 0 0;background:var(--orange);height:'+(d.s/mx*100)+'%"></i></div><span class="small muted">'+WD[new Date(d.k+"T12:00:00").getDay()]+'</span></div>').join("")+'</div>'+
    '<div class="small muted" style="display:flex;gap:14px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#D9DEE6;margin-right:5px"></i>Zakaz</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--orange);margin-right:5px"></i>Sotildi</span></div></div>';
  // Mijozlar sotilishi
  const rates=clients().map(c=>({c,r:sellRate(c.id)})).filter(x=>x.r!=null).sort((a,b)=>a.r-b.r);
  h+='<div class="card"><div class="sec"><span>Mijozlar</span><span class="sub">7 kunda sotilishi</span></div>'+(rates.length?rates.map(x=>{const col=x.r>=90?"var(--ok)":x.r>=60?"var(--warn)":"var(--bad)";const cls=x.r>=90?"ok":x.r>=60?"warn":"bad";
    return '<div class="ingrow" role="button" tabindex="0" data-act="akt" data-c="'+x.c.id+'" style="cursor:pointer;align-items:center"><div style="flex:1;min-width:0"><div class="b">'+esc(x.c.name)+'</div><div class="bar" style="margin-top:5px;max-width:170px"><i style="width:'+x.r+'%;background:'+col+'"></i></div></div><span class="pill '+cls+'">'+x.r+'%</span></div>'}).join(""):'<div class="muted">Hali yetkazish bo\'lmagan.</div>')+'</div>';
  // Ombor
  const st=stockItems().map(i=>{const a=avgDaily(i.id);const s0=+i.stock||0;return {i,days:s0<=0?0:a?Math.floor(s0/a):null,s0,low:s0<(+i.min||0)*uinfo(i).f}}).sort((a,b)=>(a.days??999)-(b.days??999)||(b.low-a.low)).slice(0,5);
  h+='<div class="card" role="button" tabindex="0" data-act="go" data-k="ombor" style="cursor:pointer"><div class="sec"><span>Ombor</span><span class="sub">necha kunga yetadi</span></div>'+st.map(x=>{const cls=x.s0<=0||x.low?"bad":(x.days!=null&&x.days<4)?"warn":"ok";
    return '<div class="ingrow" style="align-items:center"><span>'+esc(x.i.name)+'</span><span class="pill '+cls+'">'+(x.s0<=0?"tugagan":(x.days!=null?x.days+" kun · ":"")+showQty(x.s0,x.i))+'</span></div>'}).join("")+'</div>';
  return h;
}
function vKoproq(){
  const it=(k,t,s)=>'<button class="row" data-act="tab" data-k="'+k+'" style="border:none;background:none;width:100%;text-align:left;border-bottom:1px solid var(--line)"><div class="col"><span class="b">'+t+'</span><span class="small muted">'+s+'</span></div><span aria-hidden="true">›</span></button>';
  return header("Ko'proq")+'<div class="list">'+it("hisob","Hisob","Savdo, foyda, xarajatlar, qarzlar")+it("sozlama","Sozlama","Retsept, narx, mijozlar, foydalanuvchilar")+'</div>';
}

/* ---------- ☰ MENYU (admin) ---------- */
const MENU = [
  ["dashboard","Dashboard","Umumiy ko'rinish"],
  ["bugun","Bugun","Zakaz va masalliq"],
  ["yetkazish","Yetkazish","Do'konlarga berish, to'lovlar"],
  ["ombor","Ombor","Xarid, qoldiq, sanash"],
  ["kalk","Kalkulyatsiya","Har bir somsaning retsepti"],
  ["kalkulyator","Kalkulyator","Nechta somsaga nima kerak"],
  ["kassa","Hisob-kitob","Kassa: kirim va rasxod"],
  ["qarzlar","Qarzlar","Bizga va bizning qarzlar"],
  ["uy","Uyga o'tkazilgan","Uyga ketgan masalliq va xarajatlar"],
  ["hisob","Hisobot","Savdo, sotuv, davr bo'yicha"],
  ["sozlama","Sozlama","Mijozlar, foydalanuvchilar"]
];
function openDrawer(){
  let d=document.getElementById("drawer");
  if(!d){d=document.createElement("div");d.id="drawer";d.className="drawerwrap";document.body.appendChild(d);
    d.addEventListener("click",e=>{if(e.target===d)closeDrawer()})}
  d.innerHTML='<nav class="drawer" aria-label="Menyu"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+lockupH(26,'#162538')+'<button class="icon" data-act="drawerclose" aria-label="Menyuni yopish"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>'+
    MENU.map(([k,t,s])=>'<button class="mitem '+(tab===k?"on":"")+'" data-act="go" data-k="'+k+'">'+svg(k)+'<span class="col"><span class="b">'+t+'</span><span class="small muted">'+s+'</span></span></button>').join("")+
    '<div style="border-top:1px solid var(--line);margin:6px 0"></div><button class="mitem" data-act="mother">'+svg("sozlama")+'<span class="col"><span class="b">Ko\'rinish: '+ROLE_NAMES[role()]+'</span><span class="small muted">Onam yoki kuzatuvchi ekranini tekshirish</span></span></button><button class="mitem" data-act="logout"><span style="width:22px"></span><span class="b" style="color:var(--bad)">Hisobdan chiqish</span></button></nav>';
  d.hidden=false;
}
function closeDrawer(){const d=document.getElementById("drawer");if(d)d.hidden=true}
function drawerOpen(){const d=document.getElementById("drawer");return d&&!d.hidden}
function backBar(){return role()==="admin"&&!ADMIN_TABS.includes(tab)?'<button class="linkbtn" data-act="go" data-k="dashboard" style="align-self:flex-start;padding:2px 0;text-decoration:none;font-weight:600">← Dashboard</button>':""}

/* ---------- KALKULYATSIYA ---------- */
const calcCounts={};
function vKalk(){
  let h=backBar()+header("Kalkulyatsiya","1 ta somsaga ketadigan masalliqlar. Bir marta yoziladi, retsept o'zgarsa shu yerda o'zgartiriladi.");
  const ty=types();
  h+='<div class="sec"><span>Yarim tayyor mahsulotlar</span><button class="btn small" data-act="edsemi">+ Qo\'shish</button></div>';
  h+=semis().length?semis().map(sm=>{const pk=semiPpb(sm)*1000;return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="sec">'+esc(sm.name)+'</span><button class="btn ghost small" data-act="edsemi" data-id="'+sm.id+'">Tahrirlash</button></div><div class="small muted">Bir partiya uchun:</div>'+
    (sm.recipe||[]).filter(r=>S.ings[r.ing]).map(r=>{const i=S.ings[r.ing];return '<div style="display:flex;justify-content:space-between;gap:8px" class="small"><span>'+esc(i.name)+' <span class="muted">'+(uinfo(i).f===1?sp(r.qty)+" ta":sp(r.qty)+" "+baseLabel(i))+'</span></span><span class="num">'+sp(r.qty*ppb(i))+'</span></div>'}).join("")+
    '<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px;gap:8px"><span>Chiqadi: '+sp(sm.yield)+' g</span><span class="xb num" style="font-size:17px">1 kg — '+som(pk)+'</span></div></div>'}).join(""):'<div class="card empty">Masalan: marinovkali go\'sht, hamir.</div>';
  h+='<div class="sec"><span>Somsa turlari</span><button class="btn small" data-act="edtype">+ Yangi kalkulyatsiya</button></div>';
  h+=ty.length?ty.map(t=>{const tc=typeCost(t);return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="sec">'+esc(t.name)+'</span><button class="btn ghost small" data-act="edtype" data-id="'+t.id+'">Tahrirlash</button></div>'+
    (t.recipe||[]).filter(r=>refItem(r.ing)).map(r=>{const it=refItem(r.ing);return '<div style="display:flex;justify-content:space-between;gap:8px" class="small"><span>'+(it.semi?'<span class="pill warn" style="padding:1px 6px;margin-right:4px">yarim tayyor</span>':"")+esc(r.label||it.name)+' <span class="muted">'+(it.f===1?(Math.round(r.qty*1000)/1000).toString().replace(".",",")+" ta":(Math.round(r.qty*10)/10).toString().replace(".",",")+" "+it.base)+'</span></span><span class="num">'+sp(r.qty*it.ppb)+'</span></div>'}).join("")+
    '<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px;gap:8px"><span>1 dona tannarxi</span><span class="xb num" style="font-size:17px">'+som(tc)+'</span></div><div style="display:flex;justify-content:space-between;gap:8px" class="small muted"><span>Sotuv narxi '+sp(t.price)+'</span><span style="color:var(--ok);font-weight:700">foyda '+sp(t.price-tc)+'</span></div></div>'}).join(""):'<div class="card empty">Hali kalkulyatsiya yo\'q.</div>';
  h+='<div class="sec"><span>Masalliqlar va narxlar</span><button class="btn small" data-act="eding">+ Masalliq</button></div><div class="list">'+ings().map(i=>'<div class="row" role="button" tabindex="0" data-act="eding" data-id="'+i.id+'" style="cursor:pointer"><div class="col"><span class="b">'+esc(i.name)+'</span><span class="small muted">'+som(i.packPrice)+' / '+(i.packQty||1)+' '+uinfo(i).name+'</span></div><span class="small muted num">'+som(ppb(i)*uinfo(i).f)+' / '+uinfo(i).name+'</span></div>').join("")+'</div>';
  return h;
}

/* ---------- KALKULYATOR: kalkulyatsiyadagi retseptlarni olib, songa ko'paytiradi ---------- */
function gramTxt(q,it){if(it.f===1)return sp(Math.ceil(q-1e-9))+" ta";const t=sp(q)+" "+it.base;return q>=1000?t+' <span class="small muted">('+qtyTxt(q,it)+')</span>':t}
function vKalkulyator(){
  let h=backBar()+header("Kalkulyator","Son yozing — kalkulyatsiyadagi retsept bo'yicha hisoblaydi");
  const ty=types();
  h+='<div class="card">'+ty.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><label for="kc_'+t.id+'" class="b">'+esc(t.name)+'</label><div class="stepper"><button data-act="calc" data-t="'+t.id+'" data-n="-10" aria-label="10 ta kamaytirish" style="font-size:12px">−10</button><input class="inp num" id="kc_'+t.id+'" data-calc="'+t.id+'" inputmode="numeric" value="'+(calcCounts[t.id]||"")+'" placeholder="0" style="width:70px;min-height:38px;text-align:center;padding:0 4px"><button class="plus" data-act="calc" data-t="'+t.id+'" data-n="10" aria-label="10 ta qo\'shish" style="font-size:12px">+10</button></div></div>').join("")+
    '<button class="linkbtn" data-act="calcclear" style="align-self:flex-start;padding:2px 0">Tozalash</button></div>';
  const sel=ty.filter(t=>(+calcCounts[t.id]||0)>0);
  if(!sel.length)return h+'<div class="card empty">Somsa turiga son yozing. Masalan, go\'shtli — 50.</div>';
  const need={};let cnt=0,cost=0;
  for(const t of sel){const n=+calcCounts[t.id];cnt+=n;cost+=typeCost(t)*n;
    const lines=(t.recipe||[]).filter(r=>refItem(r.ing));
    h+='<div class="card"><div class="sec"><span>'+esc(t.name)+' — '+n+' ta</span></div>'+(lines.length?lines.map(r=>{const it=refItem(r.ing);const q=r.qty*n;need[r.ing]=(need[r.ing]||0)+q;
      return '<div class="ingrow"><span>'+esc(r.label||it.name)+' <span class="small muted">'+String(r.qty).replace(".",",")+(it.f===1?"":" "+it.base)+' × '+n+'</span></span><span class="b num" style="text-align:right">'+gramTxt(q,it)+'</span></div>'}).join(""):'<div class="muted">Bu turning kalkulyatsiyasi kiritilmagan.</div>')+'</div>'}
  if(sel.length>1){h+='<div class="card"><div class="sec"><span>Jami kerak — '+cnt+' ta somsa</span></div>'+Object.keys(need).map(k=>{const it=refItem(k);return '<div class="ingrow"><span>'+esc(it.name)+'</span><span class="b num" style="text-align:right">'+gramTxt(need[k],it)+'</span></div>'}).join("")+'</div>'}
  return h;
}

/* ---------- HISOB-KITOB (KASSA) ---------- */
function kassaEvents(){
  const ev=[];
  for(const k of dayKeys()){const dd=S.days[k];for(const cid in dd.deliveries||{}){const dl=dd.deliveries[cid];if(dl.done&&dl.paid)ev.push({date:k,at:dl.at||k,inn:dl.paid,txt:"Olindi: "+((S.clients[cid]||{}).name||cid),src:"Do'kondan"})}}
  for(const p of Object.values(S.payments))ev.push({date:p.date,at:p.at||p.date,inn:p.amount,txt:"Qarz to'lovi: "+((S.clients[p.client]||{}).name||""),src:p.note||"Do'kondan"});
  for(const [id,c] of Object.entries(S.cashIn))ev.push({date:c.date,at:c.at||c.date,inn:c.amount,txt:"Kirim",src:c.note,kind:"cashin",id});
  for(const [id,e] of Object.entries(S.expenses))ev.push({date:e.date,at:e.at||e.date,out:e.amount,txt:"Rasxod: "+e.category,src:e.note,kind:"exp",id});
  for(const m of Object.values(S.moves))if(m.kind==="xarid"&&m.pay!=="qarz"&&m.total)ev.push({date:m.date,at:m.at||m.date,out:m.total,txt:"Xarid"+(m.supplier?": "+m.supplier:""),src:(m.items||[]).map(it=>(S.ings[it.ing]||{}).name).filter(Boolean).join(", ")});
  for(const c of Object.values(S.cred))if(c.cash&&c.amount<0)ev.push({date:c.date,at:c.at||c.date,out:-c.amount,txt:"Qarz to'landi: "+c.name,src:c.note});
  ev.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.at).localeCompare(String(a.at)));
  return ev;
}
function kassaBalance(){const st=S.kassa||{};let b=+st.start||0;for(const e of kassaEvents()){if(st.date&&e.date<st.date)continue;b+=(e.inn||0)-(e.out||0)}return b}
function vKassa(){
  let h=backBar()+header("Hisob-kitob","Kassa: kirim va rasxod");
  const st=S.kassa||{};
  h+='<div class="hero pat"><div class="lbl">Kassadagi pul</div><div class="xb num" style="font-size:34px;line-height:1.1">'+som(kassaBalance())+'</div><div class="hint">'+(st.date?"Boshlang'ich: "+som(st.start||0)+" ("+shortDate(st.date)+" dan)":"Boshlang'ich summa kiritilmagan")+(isMother()?'':' · <button class="linkbtn" data-act="kassastart" style="color:var(--on-navy-muted);padding:0;font-size:12px">o\'zgartirish</button>')+'</div></div>';
  h+='<div class="grid2"><button class="btn" data-act="kirim">+ Kirim</button><button class="btn navy" data-act="exp">− Rasxod</button></div>';
  h+='<div class="chips">'+[["bugun","Bugun"],["hafta","7 kun"],["oy","Shu oy"]].map(([k,l])=>'<button class="chip '+(period===k?"on":"")+'" data-act="period" data-k="'+k+'">'+l+'</button>').join("")+'</div>';
  const ev=kassaEvents().filter(e=>inPeriod(e.date));const inn=ev.reduce((s,e)=>s+(e.inn||0),0),out=ev.reduce((s,e)=>s+(e.out||0),0);
  h+='<div class="grid2"><div class="card" style="gap:2px"><span class="small muted">Kirim</span><span class="xb num" style="font-size:18px;color:var(--ok)">+'+sp(inn)+'</span></div><div class="card" style="gap:2px"><span class="small muted">Rasxod</span><span class="xb num" style="font-size:18px;color:var(--bad)">−'+sp(out)+'</span></div></div>';
  h+=ev.length?'<div class="list">'+ev.map(e=>{const del=e.kind&&!isMother()?' role="button" tabindex="0" data-act="kdel" data-kind="'+e.kind+'" data-id="'+e.id+'" style="cursor:pointer"':"";
    return '<div class="row"'+del+'><div class="col"><span class="b">'+esc(e.txt)+'</span><span class="small muted">'+shortDate(e.date)+(e.src?" · "+esc(e.src):"")+'</span></div><span class="b num" style="color:'+(e.inn?"var(--ok)":"var(--bad)")+';white-space:nowrap">'+(e.inn?"+"+sp(e.inn):"−"+sp(e.out))+'</span></div>'}).join("")+'</div>':'<div class="card empty">Bu davrda kirim yoki rasxod yo\'q.</div>';
  return h;
}
// Yozuv tanlangan davrda ko'rinmasa, uni ko'rsatadigan davrga o'tadi va sanasini aytadi
function showSaved(d,what){const t=ymd(new Date());if(d===t){toast(what+" saqlandi");return}
  if(!inPeriod(d)){for(const p of ["hafta","oy"]){period=p;if(inPeriod(d))break}}
  toast(what+" "+shortDate(d)+" sanasiga yozildi");render()}
const EXP_CATS2=["Gaz","O'tin / ko'mir","Benzin","Paket","Elektr","Ish haqi","Ijara","Uy uchun","Boshqa"];
function mRasxod(){
  openModal(mHead("Rasxod qilish")+'<div class="field"><label for="ex_cat">Turi</label><select class="inp" id="ex_cat">'+EXP_CATS2.map(c=>'<option>'+esc(c)+'</option>').join("")+'</select></div><div class="field"><label for="ex_amt">Summa (so\'m)</label><input class="inp num" id="ex_amt" inputmode="numeric"></div><div class="field"><label for="ex_note">Nima uchun?</label><input class="inp" id="ex_note" placeholder="masalan: 2 ta gaz ballon"></div><div class="field"><label for="ex_date">Sana</label><input class="inp" type="date" id="ex_date" value="'+ymd(new Date())+'"></div><div class="err" id="ex_err" style="color:var(--bad)"></div><button class="btn wide" id="ex_save">Saqlash</button>',m=>{
    m.querySelector("#ex_save").addEventListener("click",async()=>{const a=num(m.querySelector("#ex_amt").value);const note=m.querySelector("#ex_note").value.trim();const err=m.querySelector("#ex_err");
      if(!(a>0)){err.textContent="Summani kiriting";return}if(!note){err.textContent="Nima uchun qilinganini yozing";return}
      const d=m.querySelector("#ex_date").value||ymd(new Date());try{await run(sb.from("expenses").insert({category:m.querySelector("#ex_cat").value,amount:a,date:d,note}));closeModal();showSaved(d,"Rasxod")}catch(e){}})});
}
function mKirim(){
  openModal(mHead("Kirim")+'<div class="field"><label for="ki_amt">Summa (so\'m)</label><input class="inp num" id="ki_amt" inputmode="numeric"></div><div class="field"><label for="ki_note">Qayerdan?</label><input class="inp" id="ki_note" placeholder="masalan: chakana sotuv"></div><div class="field"><label for="ki_date">Sana</label><input class="inp" type="date" id="ki_date" value="'+ymd(new Date())+'"></div><div class="small muted">Do\'konlardan olingan pullar kassaga o\'zi tushadi, ularni bu yerga yozmang.</div><div class="err" id="ki_err" style="color:var(--bad)"></div><button class="btn wide" id="ki_save">Saqlash</button>',m=>{
    m.querySelector("#ki_save").addEventListener("click",async()=>{const a=num(m.querySelector("#ki_amt").value);const note=m.querySelector("#ki_note").value.trim();const err=m.querySelector("#ki_err");
      if(!(a>0)){err.textContent="Summani kiriting";return}if(!note){err.textContent="Qayerdan kelganini yozing";return}
      const d=m.querySelector("#ki_date").value||ymd(new Date());try{await run(sb.from("cash_in").insert({amount:a,note,date:d}));closeModal();showSaved(d,"Kirim")}catch(e){}})});
}
function mKassaStart(){
  const st=S.kassa||{};
  openModal(mHead("Boshlang'ich summa")+'<div class="small muted">Dasturni ishlata boshlagan kuningizdagi kassadagi naqd pul. Shu kundan oldingi kirim-rasxodlar hisobga olinmaydi.</div><div class="field"><label for="ks_amt">Summa (so\'m)</label><input class="inp num" id="ks_amt" inputmode="numeric" value="'+(st.start||"")+'"></div><div class="field"><label for="ks_date">Qaysi kundan</label><input class="inp" type="date" id="ks_date" value="'+(st.date||ymd(new Date()))+'"></div><button class="btn wide" id="ks_save">Saqlash</button>',m=>{
    m.querySelector("#ks_save").addEventListener("click",async()=>{const v={start:num(m.querySelector("#ks_amt").value)||0,date:m.querySelector("#ks_date").value||ymd(new Date())};
      try{await run(sb.from("settings").upsert({key:"kassa",value:v}),"Saqlandi");S.kassa=v;closeModal();render()}catch(e){}})});
}
function mKassaDel(kind,id){
  const isExp=kind==="exp";const e=isExp?S.expenses[id]:S.cashIn[id];if(!e)return;
  openModal(mHead(isExp?"Rasxod":"Kirim")+'<div class="card"><span class="b">'+(isExp?esc(e.category)+" · ":"")+som(e.amount)+'</span><span class="small muted">'+shortDate(e.date)+(e.note?" · "+esc(e.note):"")+'</span></div><button class="btn danger wide" id="kd_yes">O\'chirish</button><button class="btn ghost wide" data-act="close">Yopish</button>',m=>{
    m.querySelector("#kd_yes").addEventListener("click",async()=>{try{await run(sb.from(isExp?"expenses":"cash_in").delete().eq("id",id),"O'chirildi");closeModal()}catch(err){}})});
}

/* ---------- QARZLAR ---------- */
let qseg="bizga";
function credBalances(){const m={};for(const c of Object.values(S.cred)){m[c.name]=(m[c.name]||0)+c.amount}return Object.entries(m).map(([name,b])=>({name,b})).sort((a,b)=>b.b-a.b)}
function vQarzlar(){
  let h=backBar()+header("Qarzlar");
  const cl=clients().map(c=>({c,b:clientBalance(c.id)}));const bizga=cl.reduce((s,x)=>s+Math.max(0,x.b),0);
  const cr=credBalances();const biz=cr.reduce((s,x)=>s+Math.max(0,x.b),0);
  h+='<div class="grid2"><button class="card" data-act="qseg" data-k="bizga" style="gap:2px;text-align:left;border:2px solid '+(qseg==="bizga"?"var(--orange)":"transparent")+'"><span class="small muted">Bizga qarzlar</span><span class="xb num" style="font-size:19px">'+sp(bizga)+'</span></button><button class="card" data-act="qseg" data-k="biz" style="gap:2px;text-align:left;border:2px solid '+(qseg==="biz"?"var(--orange)":"transparent")+'"><span class="small muted">Bizning qarzlarimiz</span><span class="xb num" style="font-size:19px">'+sp(biz)+'</span></button></div>';
  if(qseg==="bizga"){
    const R=debtRules();h+='<div class="small muted">Undirish qoidasi: qarz '+som(R.max)+' dan oshsa yoki '+R.days+' kundan ko\'p to\'lanmasa.'+(isMother()?'':' <button class="linkbtn" data-act="go" data-k="sozlama" style="padding:0;font-size:12px">o\'zgartirish</button>')+'</div>';
    h+='<div class="sec"><span>Do\'konlar</span><span class="sub">bosing — hisob-kitob varag\'i</span></div><div class="list">'+cl.sort((a,b)=>b.b-a.b).map(x=>{const st=sellRate(x.c.id);const di=debtInfo(x.c.id);
      return '<div class="row" role="button" tabindex="0" data-act="akt" data-c="'+x.c.id+'" style="cursor:pointer"><div class="col"><span class="b">'+esc(x.c.name)+(di.flag?' <span class="pill bad">undirish</span>':"")+'</span><span class="small muted">'+(x.c.payMode==="darhol"?"darhol to'laydi":"ertasi kuni to'laydi")+(st!=null?" · sotilishi "+st+"%":"")+(di.bal>0&&di.since?" · "+di.days+" kunlik qarz":"")+'</span>'+(di.flag?'<span class="small" style="color:var(--bad);font-weight:600">'+esc(di.why)+'</span>':"")+'</div><span class="b num" style="white-space:nowrap;'+(di.flag?"color:var(--bad)":"")+'">'+som(x.b)+'</span></div>'}).join("")+'<div class="row"><span class="b">Jami</span><span class="xb num">'+som(bizga)+'</span></div></div>';
  }else{
    h+='<div class="sec"><span>Kimga qarzmiz</span>'+(isMother()?'':'<button class="btn small" data-act="crednew">+ Qarz</button>')+'</div>';
    h+=cr.length?'<div class="list">'+cr.map(x=>'<div class="row" role="button" tabindex="0" data-act="cred" data-n="'+esc(x.name)+'" style="cursor:pointer"><div class="col"><span class="b">'+esc(x.name)+'</span><span class="small muted">'+(x.b>0?"to'lanmagan":"to'liq to'langan")+'</span></div><span class="b num" style="white-space:nowrap">'+som(x.b)+'</span></div>').join("")+'<div class="row"><span class="b">Jami</span><span class="xb num">'+som(biz)+'</span></div></div>':'<div class="card empty">Qarzimiz yo\'q. Xaridni "Qarzga" qilsangiz, shu yerga o\'zi tushadi.</div>';
  }
  return h;
}
function mCred(name){
  const rows=Object.entries(S.cred).map(([id,c])=>({id,...c})).filter(c=>c.name===name).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.at).localeCompare(String(a.at)));
  const bal=rows.reduce((s,c)=>s+c.amount,0);
  let h=mHead(name)+'<div class="card" style="gap:2px"><span class="small muted">Qolgan qarzimiz</span><span class="xb num" style="font-size:24px">'+som(bal)+'</span></div><div class="grid2"><button class="btn" id="cr_pay">To\'lash</button>'+(isMother()?'':'<button class="btn ghost" id="cr_add">+ Qarz qo\'shish</button>')+'</div>';
  h+=rows.length?'<div class="list">'+rows.map(c=>'<div class="row"><div class="col"><span class="b">'+(c.amount>0?"Qarz olindi":"To'landi"+(c.cash?" (kassadan)":""))+'</span><span class="small muted">'+shortDate(c.date)+(c.note?" · "+esc(c.note):"")+'</span></div><span class="b num" style="color:'+(c.amount>0?"var(--bad)":"var(--ok)")+'">'+(c.amount>0?"+":"−")+sp(Math.abs(c.amount))+'</span></div>').join("")+'</div>':"";
  openModal(h,m=>{m.querySelector("#cr_pay").addEventListener("click",()=>mCredEntry(name,-1,bal));const ca=m.querySelector("#cr_add");if(ca)ca.addEventListener("click",()=>mCredEntry(name,1,bal))});
}
function mCredEntry(name,sign,bal){
  const pay=sign<0;
  openModal(mHead(pay?"Qarzni to'lash":"Qarz qo'shish")+(name?'':'<div class="field"><label for="ce_name">Kimga</label><input class="inp" id="ce_name" list="ce_names" placeholder="masalan: go\'sht do\'koni"><datalist id="ce_names">'+credBalances().map(x=>'<option value="'+esc(x.name)+'">').join("")+'</datalist></div>')+
    (name?'<div class="card"><span class="b">'+esc(name)+'</span>'+(pay?'<span class="small muted">Qolgan qarz: '+som(bal)+'</span>':'')+'</div>':'')+
    '<div class="field"><label for="ce_amt">Summa (so\'m)</label><input class="inp num" id="ce_amt" inputmode="numeric" value="'+(pay&&bal>0?Math.round(bal):"")+'"></div><div class="field"><label for="ce_note">'+(pay?"Izoh (ixtiyoriy)":"Nima uchun?")+'</label><input class="inp" id="ce_note"></div><div class="field"><label for="ce_date">Sana</label><input class="inp" type="date" id="ce_date" value="'+ymd(new Date())+'"></div>'+
    (pay?'<label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="ce_cash" checked> Kassadan to\'landi (kassa rasxodiga yoziladi)</label>':'')+
    '<div class="err" id="ce_err" style="color:var(--bad)"></div><button class="btn wide" id="ce_save">Saqlash</button>',m=>{
    m.querySelector("#ce_save").addEventListener("click",async()=>{const err=m.querySelector("#ce_err");const nm=name||(m.querySelector("#ce_name").value||"").trim();const a=num(m.querySelector("#ce_amt").value);const note=m.querySelector("#ce_note").value.trim();
      if(!nm){err.textContent="Kimga ekanini yozing";return}if(!(a>0)){err.textContent="Summani kiriting";return}if(!pay&&!note){err.textContent="Nima uchun ekanini yozing";return}
      try{await run(sb.from("creditor_ledger").insert({name:nm,amount:sign*a,note,date:m.querySelector("#ce_date").value||ymd(new Date()),cash:pay?m.querySelector("#ce_cash").checked:false}),"Saqlandi");closeModal()}catch(e){}})});
}

/* ---------- XARID (yangi) ---------- */
function mXarid2(draft){
  const D=draft||{date:ymd(new Date()),supplier:"",pay:"naqd",rows:[{ing:"",qty:"",sum:""}]};
  const suppliers=[...new Set(Object.values(S.moves).map(m=>m.supplier).filter(Boolean).concat(credBalances().map(x=>x.name)))];
  const opts=sel=>'<option value="">Mahsulotni tanlang</option>'+ings().map(i=>'<option value="'+i.id+'"'+(i.id===sel?" selected":"")+'>'+esc(i.name)+' ('+uinfo(i).name+')</option>').join("");
  const rowsHtml=()=>D.rows.map((r,k)=>{const i=S.ings[r.ing];return '<div class="card" style="gap:6px"><div class="inrow"><select class="inp" data-x="'+k+'" data-f="ing" aria-label="Mahsulot">'+opts(r.ing)+'</select><button class="btn ghost small" type="button" data-xrm="'+k+'" aria-label="Qatorni o\'chirish">✕</button></div><div class="inrow"><input class="inp num" data-x="'+k+'" data-f="qty" inputmode="decimal" placeholder="Miqdor" value="'+esc(r.qty)+'" aria-label="Miqdor"><span class="tag">'+(i?uinfo(i).name:"")+'</span><input class="inp num" data-x="'+k+'" data-f="sum" inputmode="numeric" placeholder="Jami summa" value="'+esc(r.sum)+'" aria-label="Jami summa"><span class="tag">so\'m</span></div></div>'}).join("");
  const h=mHead("Xarid")+'<div class="grid2"><div class="field"><label for="x_date">Sana</label><input class="inp" type="date" id="x_date" value="'+D.date+'"></div><div class="field"><label for="x_sup">Kimdan</label><input class="inp" id="x_sup" list="x_sups" value="'+esc(D.supplier)+'" placeholder="bozor, go\'sht do\'koni"><datalist id="x_sups">'+suppliers.map(s=>'<option value="'+esc(s)+'">').join("")+'</datalist></div></div>'+
    '<div id="x_rows" style="display:flex;flex-direction:column;gap:8px">'+rowsHtml()+'</div><div class="grid2"><button class="btn ghost" type="button" id="x_add">+ Yana mahsulot</button><button class="btn ghost" type="button" id="x_new">+ Yangi mahsulot</button></div>'+
    '<div class="field"><label>To\'lov</label><div class="grid2"><button type="button" class="chip '+(D.pay==="naqd"?"on":"")+'" data-xpay="naqd">Naqd (kassadan)</button><button type="button" class="chip '+(D.pay==="qarz"?"on":"")+'" data-xpay="qarz">Qarzga</button></div></div>'+
    '<div class="card" style="gap:2px"><span class="small muted">Jami</span><span class="xb num" id="x_total" style="font-size:20px">0 so\'m</span></div><div class="err" id="x_err" style="color:var(--bad)"></div><button class="btn wide" id="x_save" style="min-height:52px">Saqlash</button>';
  openModal(h,m=>{
    const box=m.querySelector("#x_rows");
    const sync=()=>{box.querySelectorAll("[data-x]").forEach(el=>{D.rows[+el.dataset.x][el.dataset.f]=el.value});D.date=m.querySelector("#x_date").value;D.supplier=m.querySelector("#x_sup").value};
    const total=()=>{sync();m.querySelector("#x_total").textContent=som(D.rows.reduce((s,r)=>s+(num(r.sum)||0),0))};
    box.addEventListener("input",total);box.addEventListener("change",e=>{if(e.target.dataset.f!=="ing")return;sync();box.innerHTML=rowsHtml();total()});
    box.addEventListener("click",e=>{const b=e.target.closest("[data-xrm]");if(!b)return;sync();D.rows.splice(+b.dataset.xrm,1);if(!D.rows.length)D.rows.push({ing:"",qty:"",sum:""});box.innerHTML=rowsHtml();total()});
    m.querySelector("#x_add").addEventListener("click",()=>{sync();D.rows.push({ing:"",qty:"",sum:""});box.innerHTML=rowsHtml()});
    m.querySelector("#x_new").addEventListener("click",()=>{sync();mIng(null,newId=>{const empty=D.rows.find(r=>!r.ing);if(empty)empty.ing=newId;else D.rows.push({ing:newId,qty:"",sum:""});mXarid2(D)})});
    m.querySelectorAll("[data-xpay]").forEach(b=>b.addEventListener("click",()=>{D.pay=b.dataset.xpay;m.querySelectorAll("[data-xpay]").forEach(x=>x.classList.toggle("on",x===b))}));
    total();
    m.querySelector("#x_save").addEventListener("click",async()=>{sync();const err=m.querySelector("#x_err");
      const rows=D.rows.filter(r=>r.ing&&num(r.qty)>0);if(!rows.length){err.textContent="Kamida bitta mahsulot va miqdorini kiriting";return}
      if(rows.some(r=>!(num(r.sum)>0))){err.textContent="Har bir mahsulotning jami summasini yozing";return}
      if(D.pay==="qarz"&&!D.supplier.trim()){err.textContent="Qarzga olinganda kimdan olinganini yozing";return}
      const items=[],changes={},priceW=[];let tot=0;
      for(const r of rows){const i=S.ings[r.ing];const u=uinfo(i);const q=num(r.qty),s=num(r.sum);const base=q*u.f;items.push({ing:r.ing,qty:base,sum:s});tot+=s;changes[r.ing]=(changes[r.ing]||0)+base;
        priceW.push(sb.from("ingredients").update({pack_price:Math.round(s/base*(i.packQty||1)*u.f)}).eq("id",r.ing))}
      const sup=D.supplier.trim();
      try{await run(sb.rpc("adjust_stock",{changes}));await Promise.all(priceW);
        await run(sb.from("moves").insert({kind:"xarid",date:D.date||ymd(new Date()),items,total:tot,supplier:sup,pay:D.pay}));
        if(D.pay==="qarz")await run(sb.from("creditor_ledger").insert({name:sup,amount:tot,date:D.date||ymd(new Date()),note:"Xarid: "+items.map(it=>(S.ings[it.ing]||{}).name).join(", ")}));
        toast(D.pay==="qarz"?"Xarid saqlandi, qarzga yozildi":"Xarid saqlandi, kassadan chiqdi");closeModal()}catch(e){}});
  });
}

/* BUGUN */
function vBugun(){
  const ty=types();const tot=dayTypeTotals(viewDate);const all=sumObj(tot);
  if(!ty.length)return header("Bugun")+'<div class="card empty"><b>Somsa turlari hali kiritilmagan</b><span>Sozlama bo\'limida turlar va retseptlarni qo\'shing.</span></div>';
  if(!selType||!S.types[selType])selType=(ty.find(t=>tot[t.id])||ty[0]).id;
  let h=backBar()+dateBar();
  h+='<div class="hero pat"><div class="lbl">Yopiladi</div><div style="display:flex;align-items:baseline;gap:8px"><span class="big num">'+all+'</span><span class="unit">ta somsa</span></div><div class="grid3">'+
    ty.map(t=>'<button class="tile '+(selType===t.id?"on":"")+'" data-act="seltype" data-t="'+t.id+'" aria-pressed="'+(selType===t.id)+'"><span class="t">'+esc(t.name)+'</span><span class="n num">'+(tot[t.id]||0)+'</span></button>').join("")+
    '</div><div class="hint">Turini bosing — masalliqlari chiqadi</div></div>';
  if(role()==="admin")h+=moneyCard();
  const t=S.types[selType];const n=tot[selType]||0;const shown=(t.recipe||[]).filter(r=>r.show&&refItem(r.ing));
  h+='<div class="card"><div class="sec"><span>'+esc(t.name)+' — '+n+' ta</span></div>';
  if(!shown.length)h+='<div class="muted">Bu tur uchun ko\'rsatiladigan masalliq hali kiritilmagan.</div>';
  else if(!n)h+='<div class="muted">Bu kunga bu turdan zakaz yo\'q.</div>';
  else h+=shown.map(r=>{const it=refItem(r.ing);const q=r.qty*n;return '<div class="ingrow"><span>'+esc(r.label||it.name)+'</span><span class="v num">'+sp(q)+" "+it.base+'</span></div>'}).join("");
  h+='</div>';
  if(!isMother()){const low=lowList();if(low.length)h+='<div class="alert '+(low.some(x=>x.out)?"bad":"")+'"><b>Masalliq kam qoldi</b><span>'+low.map(x=>esc(x.name)+": "+x.txt).join(" · ")+'</span></div>'}
  const cl=clients();const o=ordersOf(viewDate);
  const oAll=Object.values(o).reduce((a,x)=>a+sumObj(x),0);
  h+='<div class="sec"><span>Zakazlar</span><span class="sub">'+(pendingOrders[viewDate]?"saqlanmoqda…":"saqlangan")+'</span></div>';
  if(oAll>0)h+='<button class="btn ghost wide" data-act="ordclear" style="min-height:44px">Hammasini 0 qilish</button>';
  if(!cl.length)h+='<div class="card empty">Mijozlar hali kiritilmagan.</div>';
  else h+='<div class="list">'+cl.map(c=>{const ts=(c.types||[]).filter(x=>S.types[x]);const prev=prevDelivery(c.id,viewDate);
    let hint="";if(prev){const rr=nextReturned(c.id,prev.date);hint=shortDate(prev.date)+": "+sumObj(prev.given)+" ta berilgan"+(rr!==false?", "+sumObj(rr)+" qaytgan":"")}
    const dflag=role()==="admin"&&!preview?debtInfo(c.id):null;
    return '<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><div class="col"><span class="b">'+esc(c.name)+(dflag&&dflag.flag?' <span class="pill bad">qarz '+sp(dflag.bal)+'</span>':"")+'</span><span class="sub">'+esc(c.when||"")+(hint?" · "+esc(hint):"")+'</span></div>'+
    ts.map(tid=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[tid].name)+'</span><div class="stepper"><button data-act="ord" data-c="'+c.id+'" data-t="'+tid+'" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num">'+((o[c.id]||{})[tid]||0)+'</span><button class="plus" data-act="ord" data-c="'+c.id+'" data-t="'+tid+'" data-n="1" aria-label="Ko\'paytirish">+</button><button data-act="ord" data-c="'+c.id+'" data-t="'+tid+'" data-n="5" aria-label="5 ta qo\'shish" style="font-size:13px;width:44px">+5</button></div></div>').join("")+'</div>'}).join("")+'</div>';
  h+='<button class="linkbtn" data-act="logout">Hisobdan chiqish</button>';
  return h;
}
/* Mijozlardagi pul: har bir do'konning hozirgi qarzi va jami (faqat admin) */
function moneyCard(){
  const rows=clients().map(c=>({c,b:clientBalance(c.id)})).filter(x=>Math.abs(x.b)>=1).sort((a,b)=>b.b-a.b);
  const total=rows.reduce((s,x)=>s+x.b,0);
  let h='<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="sec">Mijozlardagi pulim</span><span class="xb num" style="font-size:18px;color:var(--ink)">'+som(total)+'</span></div>';
  if(!rows.length)h+='<div class="muted">Hozircha hech kimda pulingiz yo\'q.</div>';
  else h+=rows.map(x=>'<div class="ingrow" role="button" tabindex="0" data-act="akt" data-c="'+x.c.id+'" style="padding:7px 0;cursor:pointer"><span>'+esc(x.c.name)+'</span><span class="b num">'+som(x.b)+'</span></div>').join("");
  return h+'<button class="linkbtn" data-act="go" data-k="qarzlar" style="align-self:flex-start;padding:4px 0">Batafsil — Qarzlar</button></div>';
}
function lowList(){const out=[];for(const i of stockItems()){const st=+i.stock||0;const min=(+i.min||0)*uinfo(i).f;const avg=avgDaily(i.id);
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
let selShop=null;const SD={};
/* Qaytgan somsalar havzasi: shu kuni boshqa do'konlardan qaytgan, hali boshqa do'konga berilmagan */
function retPool(d,exceptCid){const p={};const dls=day(d).deliveries||{};
  for(const cid in dls){if(cid===exceptCid)continue;const dl=dls[cid];if(!dl||!dl.done)continue;
    for(const t in dl.returned||{})p[t]=(p[t]||0)+(+dl.returned[t]||0);
    for(const t in dl.fromRet||{})p[t]=(p[t]||0)-(+dl.fromRet[t]||0)}
  for(const t in p)if(p[t]<0)p[t]=0;return p}
function retStats(d){let r=0,f=0;const dls=day(d).deliveries||{};for(const cid in dls){const dl=dls[cid];if(!dl||!dl.done)continue;r+=sumObj(dl.returned);f+=sumObj(dl.fromRet)}return {r,f,left:Math.max(0,r-f)}}
function shopDraft(c){const k=viewDate+"|"+c.id;if(!SD[k]){const s=delivState(c);const dl=s.dl;
  const fr=Object.assign({},dl&&dl.fromRet||{});const g=Object.assign({},s.given);for(const t in fr)g[t]=Math.max(0,(+g[t]||0)-(+fr[t]||0));
  SD[k]={given:g,fr,ret:Object.assign({},dl?dl.returned||{}:{}),paid:dl&&dl.done?String(Math.round(dl.paid||0)):"",edit:!(dl&&dl.done)}}return SD[k]}
function shopCalc(c,sd){const s=delivState(c);
  const fr=sd.fr||{};const lines=[];for(const t of s.ts){const p=s.priceMap[t]||cprice(c,t);if(+sd.given[t]>0)lines.push({t,n:+sd.given[t],p});if(+fr[t]>0)lines.push({t,n:+fr[t],p,fr:1})}
  const gs=lines.reduce((x,l)=>x+l.n*l.p,0);
  const rs=Object.keys(sd.ret).reduce((x,t)=>x+(+sd.ret[t]||0)*((s.prev&&s.prev.priceMap&&s.prev.priceMap[t])||cprice(c,t)),0);
  const before=clientBalance(c.id,addDays(viewDate,-1));const total=before+gs-rs;const paid=Math.max(0,num(sd.paid)||0);
  return {s,lines,gs,rs,before,total,paid,after:total-paid}}
function vYetkazish(){
  if(selShop&&S.clients[selShop])return vShop(clientOf(selShop));selShop=null;
  let h=backBar()+header("Yetkazish","Do'konni tanlang")+dateBar();
  const cl=clients().filter(c=>{const z=sumObj(ordersOf(viewDate)[c.id]);const dl=(day(viewDate).deliveries||{})[c.id];const prev=prevDelivery(c.id,viewDate);return z>0||dl||(prev&&prev.date===addDays(viewDate,-1)&&sumObj(prev.given)>0)});
  if(!cl.length)return h+'<div class="card empty"><b>Bu kunga zakaz yo\'q</b><span>Zakazlar "Bugun" bo\'limida kiritiladi.</span></div>';
  const dls=day(viewDate).deliveries||{};const doneN=cl.filter(c=>(dls[c.id]||{}).done).length;
  h+='<div class="sec"><span>'+doneN+' / '+cl.length+' do\'kon bajarildi</span></div>';
  {const rs=retStats(viewDate);if(rs.r)h+='<div class="card" style="gap:4px"><div class="ingrow"><span>Bugun qaytdi</span><span class="b num">'+rs.r+' ta</span></div><div class="ingrow"><span>Boshqa do\'konga berildi</span><span class="b num">'+rs.f+' ta</span></div><div class="ingrow"><span class="b">Qo\'lda qoldi</span><span class="xb num" style="color:'+(rs.left?"var(--warn)":"var(--ok)")+'">'+rs.left+' ta</span></div></div>'}
  h+='<div class="list">';
  for(const c of cl){const dl=dls[c.id];const done=dl&&dl.done;const z=sumObj(ordersOf(viewDate)[c.id]);const di=debtInfo(c.id);
    let right;
    if(done)right='<span class="b num">'+sumObj(dl.given)+' ta</span><span class="pill ok">Berildi · '+sp(dl.paid||0)+'</span>';
    else right='<span class="b num">'+(z?z+" ta":"—")+'</span><span class="pill warn">'+(z?"Kutilmoqda":"Faqat pul")+'</span>';
    h+='<div class="row" role="button" tabindex="0" data-act="shop" data-c="'+c.id+'" style="cursor:pointer;padding:14px 12px"><div class="col"><span class="b" style="font-size:16px">'+esc(c.name)+(di.flag&&!done?' <span class="pill bad">qarz</span>':"")+'</span><span class="small" style="color:var(--bad);font-weight:600">'+esc(c.when||"")+'</span></div><div class="col" style="align-items:flex-end;gap:4px">'+right+'</div></div>'}
  return h+'</div>';
}
function vShop(c){
  const sd=shopDraft(c);const k=shopCalc(c,sd);const s=k.s;const z=s.z||{};const zSum=sumObj(z);const done=s.dl&&s.dl.done;
  let h='<button class="linkbtn" data-act="shopback" style="align-self:flex-start;padding:2px 0;text-decoration:none;font-weight:600">← Do\'konlar</button>';
  h+='<div class="top"><div class="col"><div class="h1">'+esc(c.name)+'</div><div class="sub">'+esc(niceDate(viewDate))+(c.when?" · "+esc(c.when):"")+'</div></div></div>';
  if(done&&!sd.edit){
    const dl=s.dl;const gSum=sumObj(dl.given);
    h+='<div class="hero pat"><div class="grid2"><div><div class="lbl">Berildi</div><div><span class="big num">'+gSum+'</span> <span class="unit">ta</span></div>'+(zSum&&zSum!==gSum?'<div class="hint">zakaz '+zSum+' ta edi</div>':"")+'</div><div><div class="lbl">Olindi</div><div class="xb num" style="font-size:24px;color:var(--orange);line-height:1.6">'+sp(dl.paid||0)+'</div></div></div></div>';
    h+='<div class="card">'+Object.keys(dl.given).filter(t=>dl.given[t]).map(t=>{const p=(dl.priceMap||{})[t]||cprice(c,t);return '<div class="ingrow"><span>'+esc((S.types[t]||{}).name||t)+' '+dl.given[t]+' × '+sp(p)+'</span><span class="b num">'+sp(dl.given[t]*p)+'</span></div>'}).join("")+
      (sumObj(dl.fromRet)?'<div class="ingrow"><span class="small muted">Shundan qaytgan somsadan: '+sumObj(dl.fromRet)+' ta</span><span></span></div>':"")+
      (sumObj(dl.returned)?'<div class="ingrow"><span>Qaytdi '+sumObj(dl.returned)+' ta</span><span class="b num">−'+sp(dl.retSum||0)+'</span></div>':"")+
      '<div class="ingrow"><span>Olindi</span><span class="b num">−'+sp(dl.paid||0)+'</span></div><div class="ingrow"><span class="b">Hozirgi qarzi</span><span class="xb num" style="color:'+(clientBalance(c.id)>0?"var(--bad)":"var(--ok)")+'">'+som(clientBalance(c.id))+'</span></div></div>';
    h+='<div class="grid2"><button class="btn ghost" data-act="nak" data-c="'+c.id+'">Nakladnoy</button><button class="btn ghost" data-act="shopedit">O\'zgartirish</button></div>';
    h+='<button class="linkbtn" data-act="pay" data-c="'+c.id+'" style="align-self:flex-start;padding:2px 0">Faqat qarz to\'lovi oldim</button>';
    return h}
  // 1. Berish kerak
  h+='<div class="card"><div class="sec"><span>Berish kerak</span><span class="xb num">'+zSum+' ta</span></div>'+(zSum?s.ts.filter(t=>z[t]).map(t=>'<div class="ingrow"><span>'+esc(S.types[t].name)+'</span><span class="b num">'+z[t]+' ta</span></div>').join(""):'<div class="muted">Bugun zakaz yo\'q — faqat pul va qaytgan somsa olinadi.</div>')+'</div>';
  // 2. Berildi
  const stp=(kind,t,v)=>'<div class="stepper"><button type="button" data-act="sd" data-k="'+kind+'" data-t="'+t+'" data-n="-1" aria-label="Kamaytirish">−</button><input class="val num inp" style="width:64px;min-height:40px;padding:4px;text-align:center" inputmode="numeric" data-sdin="'+kind+'" data-t="'+t+'" value="'+v+'" aria-label="Soni"><button type="button" class="plus" data-act="sd" data-k="'+kind+'" data-t="'+t+'" data-n="1" aria-label="Ko\'paytirish">+</button></div>';
  h+='<div class="card"><div class="sec"><span>Berildi</span></div><div class="small muted">Boshqa son olib borilgan bo\'lsa, o\'zgartiring.</div>'+s.ts.map(t=>{const v=+sd.given[t]||0,zz=+z[t]||0;
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="col"><span>'+esc(S.types[t].name)+'</span><span class="small" id="gd_'+t+'" style="color:var(--warn)">'+(v!==zz?(v<zz?"zakazdan "+(zz-v)+" ta kam":"zakazdan "+(v-zz)+" ta ko\'p"):"")+'</span></span>'+stp("g",t,v)+'</div>'}).join("")+'</div>';
  // 3. Qaytdi (ixtiyoriy)
  if(s.prevTs.length)h+='<div class="card"><div class="sec"><span>Qaytdi</span><span class="sub">'+shortDate(s.prev.date)+': '+sumObj(s.prev.given)+' ta berilgan</span></div>'+s.prevTs.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[t].name)+'</span>'+stp("r",t,+sd.ret[t]||0)+'</div>').join("")+'</div>';
  // 3b. Boshqa do'konlardan qaytganidan berish
  {const pool=retPool(viewDate,c.id);const pts=s.ts.filter(t=>(pool[t]||0)>0||(+sd.fr[t]||0)>0);
    if(pts.length)h+='<div class="card"><div class="sec"><span>Qaytgandan berish</span></div><div class="small muted">Bugun boshqa do\'konlardan qaytgan somsadan shu do\'konga berilsa, sonini yozing. Zakazga qo\'shimcha hisoblanadi.</div>'+pts.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="col"><span>'+esc(S.types[t].name)+'</span><span class="small muted">bor: '+(pool[t]||0)+' ta</span></span>'+stp("f",t,+sd.fr[t]||0)+'</div>').join("")+'</div>'}
  // 4. Hisob + olingan pul
  h+='<div class="card" id="shopcalc">'+shopCalcHtml(c,k)+'</div>';
  h+='<div class="card"><div class="field"><label for="sd_paid" class="b">Olingan pul (so\'m)</label><input class="inp num" id="sd_paid" data-sdin="paid" inputmode="numeric" placeholder="0" value="'+esc(sd.paid)+'" style="font-size:22px;font-weight:800;min-height:56px"></div><div class="grid2" id="sd_quick">'+shopQuick(k)+'</div><div id="sd_left">'+shopLeft(k)+'</div></div>';
  const di=debtInfo(c.id);if(di.flag)h+='<div class="alert bad"><b>Qarzni undirish kerak: '+som(di.bal)+'</b><span>'+esc(di.why)+'.</span></div>';
  if(viewDate>ymd(new Date()))h+='<div class="alert"><b>Bu kun hali kelmagan</b><span>Yetkazishni shu kunning o\'zida kiriting. Zakazni "Bugun" bo\'limida oldindan yozsa bo\'ladi.</span></div>';
  else h+='<button class="btn ok wide" data-act="shopsave" style="min-height:56px;font-size:17px">Saqlash</button>';
  if(done)h+='<button class="btn ghost wide" data-act="shopcancel">Bekor qilish</button>';
  return h;
}
function shopCalcHtml(c,k){
  let h='<div class="sec"><span>Hisob</span></div>'+k.lines.map(l=>'<div class="ingrow"><span>'+esc(S.types[l.t].name)+(l.fr?' <span class="small muted">(qaytgandan)</span>':'')+' '+l.n+' × '+sp(l.p)+'</span><span class="b num">'+sp(l.n*l.p)+'</span></div>').join("");
  if(!k.lines.length)h+='<div class="ingrow"><span>Bugun somsa berilmadi</span><span class="b num">0</span></div>';
  if(k.rs)h+='<div class="ingrow"><span>Qaytgan somsa</span><span class="b num">−'+sp(k.rs)+'</span></div>';
  h+='<div class="ingrow"><span class="b">Bugungi summa</span><span class="xb num">'+som(k.gs-k.rs)+'</span></div>';
  if(Math.abs(k.before)>=1)h+='<div class="ingrow"><span>'+(k.before>0?"Eski qarzi":"Oldindan to\'lagan")+'</span><span class="b num" style="color:'+(k.before>0?"var(--bad)":"var(--ok)")+'">'+(k.before>0?"+":"−")+sp(Math.abs(k.before))+'</span></div><div class="ingrow"><span class="b">Jami to\'lashi kerak</span><span class="xb num">'+som(Math.max(0,k.total))+'</span></div>';
  return h}
function shopQuick(k){const today=Math.max(0,k.gs-k.rs),all=Math.max(0,k.total);
  return '<button class="btn ghost small" data-act="sdpaid" data-v="'+Math.round(today)+'">Bugungisi<br><b class="num">'+sp(today)+'</b></button>'+(Math.abs(all-today)>=1?'<button class="btn ghost small" data-act="sdpaid" data-v="'+Math.round(all)+'">Hammasi<br><b class="num">'+sp(all)+'</b></button>':"")}
function shopLeft(k){
  if(k.after>=1)return '<div class="box" style="background:var(--bad-soft)"><span class="small" style="color:var(--bad)">Qarzga qo\'shiladi</span><span class="xb num" style="font-size:22px;color:var(--bad)">'+som(k.after)+'</span></div>';
  if(k.after<=-1)return '<div class="box" style="background:var(--ok-soft)"><span class="small" style="color:var(--ok)">Ortiqcha to\'ladi — keyingi safarga o\'tadi</span><span class="xb num" style="font-size:22px;color:var(--ok)">'+som(-k.after)+'</span></div>';
  return '<div class="box" style="background:var(--ok-soft)"><span class="b" style="color:var(--ok)">To\'liq to\'landi, qarz qolmaydi</span></div>'}
function shopRefresh(){const c=clientOf(selShop);if(!c)return;const sd=shopDraft(c);const k=shopCalc(c,sd);
  const q=id=>document.getElementById(id);if(q("shopcalc"))q("shopcalc").innerHTML=shopCalcHtml(c,k);if(q("sd_quick"))q("sd_quick").innerHTML=shopQuick(k);if(q("sd_left"))q("sd_left").innerHTML=shopLeft(k);
  const z=delivState(c).z||{};for(const t in sd.given){const el=q("gd_"+t);if(!el)continue;const v=+sd.given[t]||0,zz=+z[t]||0;el.textContent=v!==zz?(v<zz?"zakazdan "+(zz-v)+" ta kam":"zakazdan "+(v-zz)+" ta ko'p"):""}}
document.addEventListener("input",e=>{const el=e.target.closest&&e.target.closest("[data-sdin]");if(!el||!selShop)return;const c=clientOf(selShop);const sd=shopDraft(c);const kd=el.dataset.sdin;
  if(kd==="paid")sd.paid=el.value.replace(/[^\d]/g,"");else if(kd==="f"){const t=el.dataset.t;const mx=retPool(viewDate,c.id)[t]||0;const v=Math.min(mx,Math.max(0,parseInt(el.value.replace(/\s/g,""),10)||0));sd.fr[t]=v;if(String(v)!==el.value)el.value=v}
  else{const obj=kd==="g"?sd.given:sd.ret;obj[el.dataset.t]=Math.max(0,parseInt(el.value.replace(/\s/g,""),10)||0)}shopRefresh()});
async function shopSave(){const c=clientOf(selShop);const sd=shopDraft(c);const k=shopCalc(c,sd);
  const given={},ret={},fr={};const pool=retPool(viewDate,c.id);for(const t in sd.given)given[t]=+sd.given[t]||0;for(const t in sd.ret)if(+sd.ret[t])ret[t]=+sd.ret[t];
  for(const t in sd.fr){const v=Math.min(+sd.fr[t]||0,pool[t]||0);if(v>0){fr[t]=v;given[t]=(given[t]||0)+v}}
  const d=viewDate;await saveDelivery(c.id,given,ret,k.paid,fr);
  if(((day(d).deliveries||{})[c.id]||{}).done){delete SD[d+"|"+c.id];selShop=null;window.scrollTo(0,0);render();toast(k.after>=1?"Saqlandi. Qarzga: "+som(k.after):"Saqlandi")}}
async function saveDelivery(cid,given,returned,paid,fromRet){
  if(viewDate>ymd(new Date())){toast("Kelajakdagi kunga yetkazish yozib bo'lmaydi");return}
  const c=clientOf(cid);const d=viewDate;const s=delivState(c);
  const givenSum=Object.keys(given).reduce((x,t)=>x+(+given[t]||0)*(s.priceMap[t]||cprice(c,t)),0);
  const retSum=Object.keys(returned).reduce((x,t)=>x+(+returned[t]||0)*((s.prev&&s.prev.priceMap&&s.prev.priceMap[t])||cprice(c,t)),0);
  const deliveries=Object.assign({},day(d).deliveries||{});
  deliveries[cid]={given,returned,paid:Math.max(0,paid),done:true,fromRet:fromRet||((deliveries[cid]||{}).fromRet)||{},givenSum,retSum,priceMap:s.priceMap,at:new Date().toISOString(),by:session.user.id};
  try{await saveDay(d,{orders:ordersOf(d),deliveries});delete drafts[cid];toast("Saqlandi");render()}catch(e){}
}

/* OMBOR */
function vOmbor(){
  let h=backBar()+header("Ombor","Qoldiq chegaradan kamaysa, xabar chiqadi");
  if(isMother())h+='<div class="grid3"><button class="btn navy" data-act="tayyor">Tayyorlash</button><button class="btn ghost" data-act="uyga">Uyga o\'tkazish</button><button class="btn ghost" data-act="sanash">Sanash</button></div>';
  else h+='<div class="grid2"><button class="btn" data-act="xarid">Xarid</button><button class="btn navy" data-act="tayyor">Tayyorlash</button><button class="btn ghost" data-act="uyga">Uyga o\'tkazish</button><button class="btn ghost" data-act="sanash">Sanash</button></div><button class="linkbtn" data-act="go" data-k="uy" style="align-self:flex-start;padding:2px 0">Uyga o\'tkazilganlar ro\'yxati →</button>';
  const list=stockItems();
  if(!list.length)return h+'<div class="card empty">Masalliqlar hali kiritilmagan.</div>';
  if(!Object.values(S.moves).some(m=>m.kind==="sanash"||m.kind==="xarid"))h+='<div class="alert"><b>Ombor hali sanalmagan</b><span>Boshlash uchun "Sanash" tugmasini bosib, hozir bor masalliqni kiriting.</span></div>';
  h+='<div class="list">'+list.map(i=>{const st=+i.stock||0;const min=(+i.min||0)*uinfo(i).f;const avg=avgDaily(i.id);const low=st<min;const maxv=Math.max(min*3,st,1);
    return '<div class="row" style="flex-direction:column;align-items:stretch;gap:6px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="b">'+esc(i.name)+'</span><span class="xb num" style="color:'+(low?"var(--bad)":"var(--ok)")+'">'+(st<0?"−":"")+showQty(Math.abs(st),i)+'</span></div><div class="bar"><i style="width:'+Math.max(0,Math.min(100,st/maxv*100))+'%;background:'+(low?"var(--bad)":"var(--ok)")+'"></i></div><div style="display:flex;justify-content:space-between" class="small muted"><span>'+som(ppb(i)*uinfo(i).f)+' / '+uinfo(i).name+'</span><span>'+(avg?"~"+Math.max(0,Math.floor(st/avg))+" kunga · ":"")+'chegara '+showQty(min,i)+'</span></div></div>'}).join("")+'</div>';
  const mv=Object.values(S.moves).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,15);
  if(mv.length){h+='<div class="sec">Oxirgi amallar</div><div class="list">'+mv.map(m=>{const k={xarid:"Xarid",uyga:"Uyga o'tkazildi",sanash:"Sanash",tayyor:"Tayyorlandi"}[m.kind]||m.kind;
    const items=(m.items||[]).map(it=>{const i=stockItem(it.ing);if(!i)return"";if(m.kind==="tayyor")return (it.made?"+":"−")+esc(i.name)+" "+showQty(it.qty,i);return esc(i.name)+" "+(m.kind==="sanash"?showQty(it.actual,i)+(Math.abs(it.actual-it.expected)>0.5?" (farq "+(it.actual-it.expected>0?"+":"−")+showQty(Math.abs(it.actual-it.expected),i)+")":""):showQty(it.qty,i))}).filter(Boolean).join(", ");
    return '<div class="row"><div class="col"><span class="b">'+k+' · '+shortDate(m.date)+'</span><span class="small muted">'+items+'</span></div>'+(m.total?'<span class="b num">'+sp(m.total)+'</span>':"")+'</div>'}).join("")+'</div>'}
  return h;
}

/* HISOB */
function inPeriod(k){const t=ymd(new Date());if(period==="hammasi")return k<=t;if(period==="bugun")return k===t;if(period==="hafta")return k>addDays(t,-7)&&k<=t;return k.slice(0,7)===t.slice(0,7)&&k<=t}
function sellRate(cid){const t=ymd(new Date());let g=0,r=0;for(const k of dayKeys()){const dl=(S.days[k].deliveries||{})[cid];if(!dl||!dl.done)continue;if(k>addDays(t,-7)&&k<=t)g+=sumObj(dl.given);if(k>addDays(t,-6)&&k<=addDays(t,1))r+=sumObj(dl.returned)}return g?Math.max(0,Math.round((1-r/g)*100)):null}
function vHisob(){
  let h=backBar()+header("Hisobot","Savdo va sotuv, davr bo'yicha");
  h+='<button class="btn ghost wide" data-act="excel">'+svg("excel")+' Excelga yuklab olish</button>';
  h+='<div class="chips">'+[["bugun","Bugun"],["hafta","7 kun"],["oy","Shu oy"]].map(([k,l])=>'<button class="chip '+(period===k?"on":"")+'" data-act="period" data-k="'+k+'">'+l+'</button>').join("")+'</div>';
  let zak=0,giv=0,ret=0,rev=0,paid=0,cost=0,short=0;const perType={};
  for(const k of dayKeys()){if(!inPeriod(k))continue;const dd=S.days[k];zak+=Object.values(dd.orders||{}).reduce((s,o)=>s+sumObj(o),0);
    for(const cid in dd.deliveries||{}){const dl=dd.deliveries[cid];if(!dl.done)continue;short+=Math.max(0,sumObj((dd.orders||{})[cid])-sumObj(dl.given));giv+=sumObj(dl.given);ret+=sumObj(dl.returned);rev+=(dl.givenSum||0)-(dl.retSum||0);paid+=dl.paid||0;
      for(const t in dl.given||{})perType[t]=(perType[t]||0)+(+dl.given[t]||0);for(const t in dl.returned||{})perType[t]=(perType[t]||0)-(+dl.returned[t]||0)}}
  for(const t in perType){const ty=S.types[t];if(ty)cost+=perType[t]*typeCost(ty)}
  let buy=0,home=0;for(const m of Object.values(S.moves)){if(!inPeriod(m.date))continue;if(m.kind==="xarid")buy+=m.total||0;if(m.kind==="uyga")home+=m.total||0}
  const exps=Object.entries(S.expenses).map(([id,e])=>({id,...e})).filter(e=>inPeriod(e.date)&&e.category!=="Uy uchun").sort((a,b)=>String(b.date).localeCompare(String(a.date)));const expSum=exps.reduce((x,e)=>x+e.amount,0);
  for(const e of Object.values(S.expenses))if(e.category==="Uy uchun"&&inPeriod(e.date))home+=e.amount;
  for(const p of Object.values(S.payments))if(inPeriod(p.date))paid+=p.amount;
  h+='<div class="grid2">'+[["Sotildi",sp(giv-ret)+" ta"],["Savdo",som(rev)],["Tushgan pul",som(paid)],["Foyda (taxminan)",som(rev-cost-expSum)]].map(([a,b])=>'<div class="card" style="gap:2px"><span class="small muted">'+a+'</span><span class="xb num" style="font-size:18px">'+b+'</span></div>').join("")+'</div>';
  h+='<div class="list">'+[["Zakaz",sp(zak)+" ta"],["Berildi",sp(giv)+" ta"],["Zakazdan kam berildi",sp(short)+" ta"],["Qaytdi",sp(ret)+" ta"],["Boshqa xarajatlar",som(expSum)],["Xaridlar",som(buy)],["Uyga o'tkazildi",som(home)]].map(([a,b])=>'<div class="row"><span>'+a+'</span><span class="b num">'+b+'</span></div>').join("")+'</div>';
  h+='<div class="grid2"><button class="btn ghost" data-act="go" data-k="kassa">Kassa va rasxodlar</button><button class="btn ghost" data-act="go" data-k="kalk">Kalkulyatsiya</button></div>';
  return h;
}

/* SOZLAMA */
function vSozlama(){
  let h=backBar()+header("Sozlama","Mijozlar, foydalanuvchilar va boshqa sozlamalar");
  h+='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div class="col"><span class="b">Zaxira</span><span class="small muted">Har bir turga qo\'shiladi. Faqat ombor hisobida ishlatiladi, onangizga ko\'rinmaydi.</span></div><div class="stepper"><button data-act="zax" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num">'+(+S.config.zaxira||0)+'</span><button class="plus" data-act="zax" data-n="1" aria-label="Ko\'paytirish">+</button></div></div></div>';
  const DR=debtRules();
  h+='<div class="card"><div class="col"><span class="b">Qarzni undirish qoidasi</span><span class="small muted">Shu chegaradan oshgan do\'konlar Dashboard, Qarzlar va Yetkazishda qizil bilan chiqadi.</span></div><div class="grid2"><div class="field"><label for="dr_max">Qarz summasi (so\'m)</label><input class="inp num" id="dr_max" inputmode="numeric" value="'+DR.max+'"></div><div class="field"><label for="dr_days">Muddat (kun)</label><input class="inp num" id="dr_days" inputmode="numeric" value="'+DR.days+'"></div></div><button class="btn ghost" data-act="drsave">Saqlash</button></div>';
  h+='<div class="sec"><span>Mijozlar</span><button class="btn small" data-act="edclient">+ Mijoz</button></div><div class="list">'+clients().map(c=>'<div class="row"><div class="col"><span class="b">'+esc(c.name)+'</span><span class="small muted">'+esc(c.when||"")+' · '+(c.types||[]).map(t=>(S.types[t]||{}).name).filter(Boolean).join(", ")+'</span></div><button class="btn ghost small" data-act="edclient" data-id="'+c.id+'">Tahrirlash</button></div>').join("")+'</div>';
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
/* Ikki marta bosilib, yozuv ikki marta saqlanib qolmasligi uchun: saqlash tugmasini 1,5 soniya qulflash */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('#modal button[id$="_save"],#modal button[id$="_yes"],#modal #xl_go,[data-act="shopsave"],[data-act="give"],[data-act="ordclear"]');if(!b)return;
  if(b.dataset.busy){e.stopImmediatePropagation();e.preventDefault();return}b.dataset.busy="1";setTimeout(()=>{delete b.dataset.busy},1500)},true);
function closeModal(){document.getElementById("modalwrap").hidden=true;document.getElementById("modal").innerHTML=""}
window.somsaBack=()=>{if(!document.getElementById("modalwrap").hidden){closeModal();return true}if(drawerOpen()){closeDrawer();return true}if(selShop&&tab==="yetkazish"){selShop=null;window.scrollTo(0,0);render();return true}if(ready&&role()==="admin"&&tab!=="dashboard"){tab="dashboard";window.scrollTo(0,0);render();return true}return false};
function mHead(t){return '<div style="display:flex;justify-content:space-between;align-items:center"><div class="h1" style="font-size:20px">'+esc(t)+'</div><button class="icon" data-act="close" aria-label="Yopish"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>'}
function stepHtml(prefix,t,v){return '<div class="stepper"><button type="button" data-step="'+prefix+'" data-t="'+t+'" data-n="-1" aria-label="Kamaytirish">−</button><span class="val num" id="'+prefix+'_'+t+'">'+v+'</span><button type="button" class="plus" data-step="'+prefix+'" data-t="'+t+'" data-n="1" aria-label="Ko\'paytirish">+</button></div>'}

function mFix(cid){
  const c=clientOf(cid);const s=delivState(c);const given=Object.assign({},s.given);const ret=Object.assign({},s.returned);
  const retTs=s.prev?Object.keys(s.prev.given||{}).filter(t=>s.prev.given[t]>0):[];
  const calc=()=>{const gs=Object.keys(given).reduce((x,t)=>x+given[t]*(s.priceMap[t]||0),0);const rs=Object.keys(ret).reduce((x,t)=>x+(+ret[t]||0)*((s.prev&&s.prev.priceMap&&s.prev.priceMap[t])||cprice(c,t)),0);return (s.mode==="ertasi"?s.prevSum:gs)-rs};
  let h=mHead(c.name)+'<div class="card"><span class="b">Bugun berildi</span>'+s.ts.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[t].name)+' <span class="small muted">zakaz '+((s.z||{})[t]||0)+'</span></span>'+stepHtml("g",t,given[t]||0)+'</div>').join("")+'</div>';
  if(retTs.length)h+='<div class="card"><span class="b">Qaytdi ('+shortDate(s.prev.date)+' dagi)</span>'+retTs.map(t=>'<div style="display:flex;justify-content:space-between;align-items:center"><span>'+esc(S.types[t].name)+'</span>'+stepHtml("r",t,+ret[t]||0)+'</div>').join("")+'</div>';
  h+='<div class="field"><label for="fx_paid">Olindi (so\'m)</label><input class="inp num" id="fx_paid" inputmode="numeric" value="'+Math.round(s.dl?s.dl.paid:Math.max(0,s.due))+'"></div><div class="small muted" id="fx_hint"></div><button class="btn ok wide" id="fx_save" style="min-height:52px">Saqlash — Berildi</button>';
  openModal(h,m=>{const hint=m.querySelector("#fx_hint");const paid=m.querySelector("#fx_paid");let touched=!!s.dl;
    const upd=()=>{const d=calc();hint.textContent="Hisob bo'yicha olinadi: "+som(Math.max(0,d));if(!touched)paid.value=groupDigits(Math.round(Math.max(0,d)))};upd();
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
/* ---------- EXCEL ---------- */
function mExcel(){
  const t=ymd(new Date());const pm=new Date(t+"T12:00:00");pm.setDate(1);pm.setMonth(pm.getMonth()-1);const p0=ymd(pm);const pe=addDays(t.slice(0,8)+"01",-1);
  const opts=[["oy","Shu oy",t.slice(0,8)+"01",t],["otgan","O'tgan oy",p0,pe],["hammasi","Hammasi",dayKeys()[0]||t,t]];
  openModal(mHead("Excelga yuklab olish")+'<div class="small muted">Savdo, qarzlar, kassa, xaridlar, uyga o\'tkazilganlar va ombor qoldig\'i — har biri alohida varaqda.</div><div class="chips" id="xl_ch">'+opts.map((o,i)=>'<button class="chip'+(i===0?" on":"")+'" data-i="'+i+'">'+o[1]+'</button>').join("")+'</div><div class="grid2"><div class="field"><label for="xl_from">Qaysi kundan</label><input class="inp" type="date" id="xl_from" value="'+opts[0][2]+'"></div><div class="field"><label for="xl_to">Qaysi kungacha</label><input class="inp" type="date" id="xl_to" value="'+opts[0][3]+'"></div></div><button class="btn wide" id="xl_go" style="min-height:52px">Yuklab olish</button>',m=>{
    m.querySelector("#xl_ch").addEventListener("click",e=>{const b=e.target.closest("[data-i]");if(!b)return;const o=opts[+b.dataset.i];m.querySelectorAll("#xl_ch .chip").forEach(x=>x.classList.toggle("on",x===b));m.querySelector("#xl_from").value=o[2];m.querySelector("#xl_to").value=o[3]});
    m.querySelector("#xl_go").addEventListener("click",async e=>{const btn=e.currentTarget;const a=m.querySelector("#xl_from").value||dayKeys()[0]||t,z=m.querySelector("#xl_to").value||t;
      btn.disabled=true;btn.textContent="Tayyorlanmoqda…";try{await buildExcel(a,z);closeModal()}catch(err){console.error(err);toast("Fayl tayyorlanmadi: internetni tekshiring");btn.disabled=false;btn.textContent="Yuklab olish"}})});
}
async function buildExcel(a,z){
  const X=await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs");
  const inR=d=>d>=a&&d<=z;const tn=id=>(S.types[id]||{}).name||id;const cn=id=>(S.clients[id]||{}).name||id;
  const sheets=[];
  // Savdo
  const sv=[["Sana","Do'kon","Somsa","Berildi (ta)","Berildi (so'm)","Qaytdi (ta)","Qaytdi (so'm)","To'landi (so'm)","Qarz qoldig'i (so'm)"]];let T={g:0,gs:0,r:0,rs:0,p:0};
  for(const k of dayKeys()){if(!inR(k))continue;const dd=S.days[k].deliveries||{};for(const cid of Object.keys(dd).sort((x,y)=>((S.clients[x]||{}).order||99)-((S.clients[y]||{}).order||99))){const dl=dd[cid];if(!dl.done)continue;
    const g=sumObj(dl.given),r=sumObj(dl.returned);if(!g&&!r&&!dl.paid)continue;
    sv.push([shortDate(k),cn(cid),Object.keys(dl.given||{}).filter(x=>dl.given[x]).map(x=>tn(x)+" "+dl.given[x]+"×"+sp((dl.priceMap||{})[x]||0)).join(", "),g,+dl.givenSum||0,r,+dl.retSum||0,+dl.paid||0,Math.round(clientBalance(cid,k))]);
    T.g+=g;T.gs+=+dl.givenSum||0;T.r+=r;T.rs+=+dl.retSum||0;T.p+=+dl.paid||0}}
  sv.push([]);sv.push(["Jami","","",T.g,T.gs,T.r,T.rs,T.p,""]);sheets.push(["Savdo",sv,[11,20,30,11,14,11,14,14,16]]);
  // Qarzlar
  const qz=[["Do'kon","Qarz (so'm)","Eng eski to'lanmagan","Necha kun","Holat"]];
  for(const c of clients()){const d=debtInfo(c.id);if(Math.abs(d.bal)<1)continue;qz.push([c.name,Math.round(d.bal),d.since?shortDate(d.since):"",d.since?d.days:"",d.flag?"Undirish kerak: "+d.why:"Normal"])}
  qz.push([]);qz.push(["Bizning qarzlarimiz"]);qz.push(["Kimga","Qarz (so'm)"]);for(const x of credBalances())if(Math.abs(x.b)>=1)qz.push([x.name,Math.round(x.b)]);
  sheets.push(["Qarzlar",qz,[22,14,18,10,40]]);
  // Kassa
  const ks=[["Sana","Kirim (so'm)","Rasxod (so'm)","Nima","Izoh"]];let ki=0,ko=0;
  for(const e of kassaEvents().slice().reverse()){if(!inR(e.date))continue;ks.push([shortDate(e.date),e.inn||"",e.out||"",e.txt,e.src||""]);ki+=e.inn||0;ko+=e.out||0}
  ks.push([]);ks.push(["Jami",ki,ko]);ks.push(["Hozir kassada",Math.round(kassaBalance())]);sheets.push(["Kassa",ks,[11,14,14,30,34]]);
  // Xaridlar
  const xr=[["Sana","Yetkazuvchi","To'lov","Masalliq","Miqdor","Summa (so'm)"]];let xs=0;
  for(const mv of Object.values(S.moves).filter(m=>m.kind==="xarid"&&inR(m.date)).sort((p,q)=>String(p.date).localeCompare(String(q.date))))for(const it of mv.items||[]){const i=stockItem(it.ing);xr.push([shortDate(mv.date),mv.supplier||"",mv.pay==="qarz"?"Qarzga":"Naqd",i?i.name:it.ing,i?showQty(it.qty,i):it.qty,Math.round(+it.sum||0)]);xs+=+it.sum||0}
  xr.push([]);xr.push(["Jami","","","","",Math.round(xs)]);sheets.push(["Xaridlar",xr,[11,18,9,20,12,14]]);
  // Uyga
  const uy=[["Sana","Nima","Miqdor","Summa (so'm)","Izoh"]];let us=0;
  for(const e of uyEvents().slice().reverse()){if(!inR(e.date))continue;uy.push([shortDate(e.date),e.name,e.qtyTxt,Math.round(e.sum),e.note||""]);us+=e.sum}
  uy.push([]);uy.push(["Jami","","",Math.round(us)]);sheets.push(["Uyga o'tkazilgan",uy,[11,22,12,14,26]]);
  // Ombor
  const om=[["Masalliq","Qoldiq","Narxi (1 birlik)","Qiymati (so'm)"]];let os=0;
  for(const i of stockItems()){const v=(+i.stock||0)*(i.semi?(+i.packPrice||0)/1000:ppb(i));om.push([i.name,showQty(+i.stock||0,i),sp(i.semi?+i.packPrice||0:ppb(i)*uinfo(i).f)+" / "+(i.semi?"kg":uinfo(i).name),Math.round(v)]);os+=v}
  om.push([]);om.push(["Jami","","",Math.round(os)]);sheets.push(["Ombor qoldig'i",om,[24,14,18,14]]);
  // Xulosa
  const xl=[["Milliy somsa — hisobot"],["Davr",shortDate(a)+" — "+shortDate(z)],["Tayyorlandi",shortDate(ymd(new Date()))],[],
    ["Berilgan somsa (ta)",T.g],["Qaytgan somsa (ta)",T.r],["Savdo (so'm)",T.gs-T.rs],["Do'konlardan olingan pul",T.p],["Kassaga kirim",ki],["Kassadan rasxod",ko],["Xaridlar",Math.round(xs)],["Uyga o'tkazilgan",Math.round(us)],[],
    ["Do'konlar qarzi (hozir)",Math.round(clients().reduce((s,c)=>s+Math.max(0,clientBalance(c.id)),0))],["Bizning qarzimiz (hozir)",Math.round(credBalances().reduce((s,x)=>s+Math.max(0,x.b),0))],["Kassada (hozir)",Math.round(kassaBalance())]];
  sheets.unshift(["Xulosa",xl,[28,24]]);
  const wb=X.utils.book_new();
  for(const [n,rows,w] of sheets){const ws=X.utils.aoa_to_sheet(rows);ws["!cols"]=w.map(x=>({wch:x}));for(const ad in ws){const cl=ws[ad];if(ad[0]!=="!"&&cl&&cl.t==="n"&&Math.abs(cl.v)>=1000)cl.z="#,##0"}X.utils.book_append_sheet(wb,ws,n)}
  const name="Milliy-somsa_"+a+"_"+z+".xlsx";
  const b64=X.write(wb,{type:"base64",bookType:"xlsx"});
  const mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if(window.SomsaNative&&window.SomsaNative.saveFile){const r=window.SomsaNative.saveFile(name,mime,b64);toast(r||"Saqlandi: Yuklanmalar papkasi");return}
  if(/SomsaApp/.test(navigator.userAgent)){toast("Fayl saqlash uchun ilovani yangilang (yangi APK)");throw new Error("old apk")}
  const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u],{type:mime}));const el=document.createElement("a");el.href=url;el.download=name;document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast("Fayl yuklab olindi");
}
/* UYGA O'TKAZILGAN: ombordan uyga olingan masalliq + kassadagi "Uy uchun" rasxodlari */
function uyEvents(){
  const ev=[];
  for(const [id,m] of Object.entries(S.moves)){if(m.kind!=="uyga")continue;
    for(const it of m.items||[]){const i=stockItem(it.ing);ev.push({id,kind:"move",date:m.date,at:m.at||m.date,ing:it.ing,name:i?i.name:"(o'chirilgan masalliq)",qtyTxt:i?showQty(it.qty,i):"",sum:+it.sum||0,note:m.note,by:m.by})}}
  for(const [id,e] of Object.entries(S.expenses))if(e.category==="Uy uchun")ev.push({id,kind:"exp",date:e.date,at:e.at||e.date,name:e.note||"Uy uchun",qtyTxt:"kassadan",sum:+e.amount||0,cash:true});
  return ev.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.at).localeCompare(String(a.at)));
}
function vUy(){
  let h=backBar()+header("Uyga o'tkazilgan","Somsa hisobidan uyga ketgan narsalar");
  const all=uyEvents();const ev=all.filter(e=>inPeriod(e.date));const tot=ev.reduce((s,e)=>s+e.sum,0);
  const t=ymd(new Date());const mon=all.filter(e=>e.date.slice(0,7)===t.slice(0,7)&&e.date<=t).reduce((s,e)=>s+e.sum,0);
  const pd=new Date(t+"T12:00:00");pd.setDate(1);pd.setMonth(pd.getMonth()-1);const pk=ymd(pd).slice(0,7);
  const prev=all.filter(e=>e.date.slice(0,7)===pk).reduce((s,e)=>s+e.sum,0);
  h+='<div class="hero pat"><div class="lbl">Shu oy uyga ketdi</div><div class="xb num" style="font-size:34px;line-height:1.1">'+som(mon)+'</div><div class="hint">O\'tgan oy ('+MONTHS[pd.getMonth()]+'): '+som(prev)+'</div></div>';
  h+='<div class="grid2"><button class="btn" data-act="uyga">+ Ombordan uyga</button><button class="btn navy" data-act="uyexp">+ Pul bilan (kassadan)</button></div>';
  h+='<div class="chips">'+[["bugun","Bugun"],["hafta","7 kun"],["oy","Shu oy"],["hammasi","Hammasi"]].map(([k,l])=>'<button class="chip '+(period===k?"on":"")+'" data-act="period" data-k="'+k+'">'+l+'</button>').join("")+'</div>';
  if(!ev.length)return h+'<div class="card empty"><b>Bu davrda uyga hech narsa o\'tkazilmagan</b><span>Ombordan olingan masalliq yoki kassadan "Uy uchun" rasxodi shu yerda ko\'rinadi.</span></div>';
  // nima qancha ketdi
  const by={};for(const e of ev){const k=e.kind==="move"?e.ing:"__cash";const g=by[k]=by[k]||{name:e.kind==="move"?e.name:"Pul bilan (kassadan)",qty:0,sum:0,n:0,ing:e.kind==="move"?e.ing:null};g.sum+=e.sum;g.n++;
    if(e.kind==="move"){const m=S.moves[e.id];for(const it of m.items||[])if(it.ing===e.ing)g.qty+=+it.qty||0}}
  const grp=Object.values(by).sort((a,b)=>b.sum-a.sum);
  h+='<div class="card"><div class="sec"><span>Jami</span><span class="xb num">'+som(tot)+'</span></div>'+grp.map(g=>{const i=g.ing?stockItem(g.ing):null;
    return '<div class="ingrow"><span>'+esc(g.name)+' <span class="small muted">'+(i?showQty(g.qty,i)+" · ":"")+g.n+' marta</span></span><span class="b num">'+som(g.sum)+'</span></div>'}).join("")+'</div>';
  // sanalar bo'yicha
  const days={};for(const e of ev)(days[e.date]=days[e.date]||[]).push(e);
  h+='<div class="sec">Qachon va nima</div>';
  for(const d of Object.keys(days).sort().reverse()){const L=days[d];const ds=L.reduce((s,e)=>s+e.sum,0);
    h+='<div class="list"><div class="row" style="background:var(--line)"><span class="b">'+esc(niceDate(d))+'</span><span class="b num">'+som(ds)+'</span></div>'+L.map(e=>{const tm=e.at&&e.at.length>10?new Date(e.at).toTimeString().slice(0,5):"";const who=e.by&&S.profiles[e.by]?S.profiles[e.by].name:"";
      return '<div class="row" role="button" tabindex="0" data-act="uydel" data-kind="'+e.kind+'" data-id="'+e.id+'" style="cursor:pointer"><div class="col"><span class="b">'+esc(e.name)+(e.qtyTxt?' <span class="small muted">'+esc(e.qtyTxt)+'</span>':"")+'</span><span class="small muted">'+[tm,who,e.kind==="move"?e.note:""].filter(Boolean).map(esc).join(" · ")+'</span></div><span class="b num" style="white-space:nowrap">'+som(e.sum)+'</span></div>'}).join("")+'</div>'}
  h+='<div class="small muted">Yozuvni bosib bekor qilish mumkin — masalliq omborga qaytadi.</div>';
  return h;
}
function mUyDel(kind,id){
  if(kind==="exp"){mKassaDel("exp",id);return}
  const mv=S.moves[id];if(!mv)return;
  const txt=(mv.items||[]).map(it=>{const i=stockItem(it.ing);return i?esc(i.name)+" "+showQty(it.qty,i):""}).filter(Boolean).join(", ");
  openModal(mHead("Uyga o'tkazish")+'<div class="card"><span class="b">'+txt+'</span><span class="small muted">'+shortDate(mv.date)+' · '+som(mv.total)+(mv.note?" · "+esc(mv.note):"")+'</span></div><button class="btn danger wide" id="ud_yes">Bekor qilish — omborga qaytarish</button><button class="btn ghost wide" data-act="close">Yopish</button>',m=>{
    m.querySelector("#ud_yes").addEventListener("click",async()=>{const ch={};for(const it of mv.items||[])ch[it.ing]=(ch[it.ing]||0)+(+it.qty||0);
      try{await run(sb.rpc("adjust_stock",{changes:ch}));await run(sb.from("moves").delete().eq("id",id),"Bekor qilindi, omborga qaytdi");closeModal()}catch(e){}})});
}
function mUyExp(){
  openModal(mHead("Uy uchun — kassadan")+'<div class="small muted">Somsa pulidan uy uchun qilingan xarajat (gaz, bozorlik, to\'lov…). Kassadan ayriladi.</div><div class="field"><label for="ue_amt">Summa (so\'m)</label><input class="inp num" id="ue_amt" inputmode="numeric"></div><div class="field"><label for="ue_note">Nima uchun?</label><input class="inp" id="ue_note" placeholder="masalan: uyning gazi"></div><div class="field"><label for="ue_date">Sana</label><input class="inp" type="date" id="ue_date" value="'+ymd(new Date())+'"></div><div class="err" id="ue_err" style="color:var(--bad)"></div><button class="btn wide" id="ue_save">Saqlash</button>',m=>{
    m.querySelector("#ue_save").addEventListener("click",async()=>{const a=num(m.querySelector("#ue_amt").value);const note=m.querySelector("#ue_note").value.trim();const err=m.querySelector("#ue_err");
      if(!(a>0)){err.textContent="Summani kiriting";return}if(!note){err.textContent="Nima uchun ekanini yozing";return}
      const d=m.querySelector("#ue_date").value||ymd(new Date());try{await run(sb.from("expenses").insert({category:"Uy uchun",amount:a,date:d,note}));closeModal();showSaved(d,"Uy xarajati")}catch(e){}})});
}
function mUyga(){
  const list=ings();
  const h=mHead("Uyga o'tkazish")+'<div class="field"><label for="u_ing">Masalliq</label><select class="inp" id="u_ing">'+list.map(i=>'<option value="'+i.id+'">'+esc(i.name)+' (omborda '+showQty(+i.stock||0,i)+')</option>').join("")+'</select></div><div class="field"><label for="u_q">Miqdor</label><div class="inrow"><input class="inp num" id="u_q" inputmode="decimal"><span class="tag" id="u_unit"></span></div></div><div class="b num" id="u_sum"></div><div class="field"><label for="u_note">Izoh (ixtiyoriy)</label><input class="inp" id="u_note" placeholder="masalan: mehmonlarga palov"></div><div class="field"><label for="u_date">Sana</label><input class="inp" type="date" id="u_date" value="'+ymd(new Date())+'"></div><button class="btn wide" id="u_save" style="min-height:52px">Uyga o\'tkazish</button>';
  openModal(h,m=>{const sel=m.querySelector("#u_ing"),q=m.querySelector("#u_q");
    const upd=()=>{const i=S.ings[sel.value];m.querySelector("#u_unit").textContent=uinfo(i).name;const v=num(q.value);m.querySelector("#u_sum").textContent=v>0?"Puli: "+som(v*uinfo(i).f*ppb(i)):""};upd();
    sel.addEventListener("change",upd);q.addEventListener("input",upd);
    m.querySelector("#u_save").addEventListener("click",async()=>{const i=S.ings[sel.value];const v=num(q.value);if(!(v>0)){toast("Miqdorni kiriting");return}
      const base=v*uinfo(i).f,s=base*ppb(i);
      try{await run(sb.rpc("adjust_stock",{changes:{[sel.value]:-base}}));const d=m.querySelector("#u_date").value||ymd(new Date());await run(sb.from("moves").insert({kind:"uyga",date:d,items:[{ing:sel.value,qty:base,sum:s}],total:s,note:m.querySelector("#u_note").value.trim()||null}),"Uyga o'tkazildi: "+som(s));closeModal()}catch(e){}})});
}
function mSanash(){
  const list=stockItems();
  let h=mHead("Sanash")+'<div class="small muted">Omborda haqiqatda qancha borligini kiriting. Bo\'sh qoldirilganlari o\'zgarmaydi.</div>';
  h+=list.map(i=>'<div class="card" style="gap:6px"><span class="b">'+esc(i.name)+' <span class="small muted">hisob bo\'yicha '+showQty(+i.stock||0,i)+'</span></span><div class="inrow"><input class="inp num" id="sq_'+domId(i.id)+'" inputmode="decimal" placeholder="Haqiqiy qoldiq" aria-label="'+esc(i.name)+' qoldig\'i"><span class="tag">'+uinfo(i).name+'</span></div></div>').join("");
  h+='<button class="btn wide" id="s_save" style="min-height:52px">Saqlash</button>';
  openModal(h,m=>{m.querySelector("#s_save").addEventListener("click",async()=>{const items=[],w=[];
    for(const i of list){const raw=m.querySelector("#sq_"+domId(i.id)).value;if(raw.trim()==="")continue;const v=num(raw);if(isNaN(v)||v<0)continue;const base=v*uinfo(i).f;items.push({ing:i.id,expected:+i.stock||0,actual:base});w.push(sb.rpc("set_stock",{item:i.semi?"s:"+i.id.slice(2):i.id,val:base}))}
    if(!items.length){toast("Hech narsa kiritilmadi");return}
    try{const rs=await Promise.all(w);if(rs.some(r=>r.error))throw 1;await run(sb.from("moves").insert({kind:"sanash",date:ymd(new Date()),items,total:0}),"Qoldiq yangilandi");closeModal()}catch(e){toast("Saqlanmadi")}})});
}
/* Tayyorlash: xom ashyodan yarim tayyor mahsulot qilish (masalan marinovka) */
function mTayyor(){
  const list=semis();if(!list.length){toast("Avval Kalkulyatsiyada yarim tayyor mahsulot qo'shing");return}
  openModal(mHead("Tayyorlash")+'<div class="field"><label for="ty_semi">Nima tayyorlandi</label><select class="inp" id="ty_semi">'+list.map(sm=>'<option value="'+sm.id+'">'+esc(sm.name)+'</option>').join("")+'</select></div>'+
    '<div class="field"><label for="ty_in" id="ty_in_l">Qancha solindi</label><div class="inrow"><input class="inp num" id="ty_in" inputmode="decimal"><span class="tag" id="ty_in_u"></span></div></div>'+
    '<div class="field"><label for="ty_q">Qancha chiqdi</label><div class="inrow"><input class="inp num" id="ty_q" inputmode="decimal"><span class="tag">kg</span></div></div>'+
    '<div class="card" id="ty_use" style="gap:4px"></div><label class="small" style="display:'+(isMother()?"none":"flex")+';gap:8px;align-items:center"><input type="checkbox" id="ty_upd"> Kalkulyatsiyadagi chiqishni shu bo\'yicha yangilash</label>'+
    '<div class="err" id="ty_err" style="color:var(--bad)"></div><button class="btn wide" id="ty_save">Saqlash</button>',m=>{
    const sel=m.querySelector("#ty_semi"),inp=m.querySelector("#ty_in"),q=m.querySelector("#ty_q");
    // Asosiy masalliq — retseptdagi eng ko'p miqdorli qator (masalan go'sht yoki un)
    const mainRow=sm=>(sm.recipe||[]).filter(r=>S.ings[r.ing]).sort((a,b)=>b.qty-a.qty)[0];
    const calc=()=>{const sm=S.semi[sel.value];const mr=sm&&mainRow(sm);const out=(num(q.value)||0)*1000;
      if(!sm||!mr)return {sm,mr,out,use:[],k:0};
      const i=S.ings[mr.ing];const inBase=(num(inp.value)||0)*uinfo(i).f;const k=inBase/mr.qty;
      const use=(sm.recipe||[]).map(r=>({i:S.ings[r.ing],id:r.ing,qty:r.qty*k})).filter(u=>u.i);
      return {sm,mr,out,use,k}};
    const upd=()=>{const {sm,mr,out,use,k}=calc();
      if(mr){const i=S.ings[mr.ing];m.querySelector("#ty_in_l").textContent="Qancha "+i.name.toLowerCase()+" solindi";m.querySelector("#ty_in_u").textContent=uinfo(i).name}
      const ratio=k>0&&out>0?out/(sm.yield*k):0;
      m.querySelector("#ty_use").innerHTML='<span class="small muted">Ombordan ayiriladi:</span>'+(k>0?use.map(u=>'<div class="ingrow" style="padding:4px 0"><span>'+esc(u.i.name)+'</span><span class="b num">'+showQty(u.qty,u.i)+'</span></div>').join(""):'<span class="small muted">Qancha solinganini yozing</span>')+
        (ratio?'<div class="small muted" style="margin-top:4px">Retsept bo\'yicha '+showQty(sm.yield*k,{unit:"kg"})+' chiqishi kerak edi, '+showQty(out,{unit:"kg"})+' chiqdi ('+Math.round(ratio*100)+'%).</div>':"")};
    sel.addEventListener("change",upd);inp.addEventListener("input",upd);q.addEventListener("input",upd);upd();
    m.querySelector("#ty_save").addEventListener("click",async()=>{const {sm,out,use,k}=calc();const err=m.querySelector("#ty_err");
      if(!(k>0)){err.textContent="Qancha solinganini yozing";return}if(!(out>0)){err.textContent="Qancha chiqqanini yozing";return}
      const changes={["s:"+sel.value]:out};for(const u of use)changes[u.id]=(changes[u.id]||0)-u.qty;
      const items=[{ing:"s:"+sel.value,qty:out,made:true}].concat(use.map(u=>({ing:u.id,qty:u.qty})));
      try{await run(sb.rpc("adjust_stock",{changes}));await run(sb.from("moves").insert({kind:"tayyor",date:ymd(new Date()),items,total:0}));
        if(m.querySelector("#ty_upd").checked){const ny=Math.round(out/k);await run(sb.from("semi").update({yield:ny}).eq("id",sel.value))}
        toast(sm.name+": "+showQty(out,{unit:"kg"})+" omborga qo'shildi");closeModal()}catch(e){}})});
}
function mSemi(id){
  const sm=id?JSON.parse(JSON.stringify(S.semi[id])):{name:"",recipe:[],yield:1000,show:true,min:0,order:semis().length+1};
  const opts=sel=>'<option value=""'+(sel?"":" selected")+' disabled>— Masalliqni tanlang —</option>'+ings().map(i=>'<option value="'+i.id+'"'+(i.id===sel?" selected":"")+'>'+esc(i.name)+' ('+baseLabel(i)+')</option>').join("");
  const rows=()=>(sm.recipe||[]).map((r,k)=>'<div class="inrow"><select class="inp" data-r="'+k+'" data-f="ing" aria-label="Masalliq">'+opts(r.ing)+'</select><input class="inp num" style="max-width:100px" data-r="'+k+'" data-f="qty" inputmode="decimal" value="'+String(r.qty).replace(".",",")+'" aria-label="Miqdor"><button class="btn ghost small" type="button" data-rm="'+k+'" aria-label="O\'chirish">✕</button></div>').join("");
  openModal(mHead(id?sm.name:"Yarim tayyor mahsulot")+'<div class="field"><label for="sm_name">Nomi</label><input class="inp" id="sm_name" value="'+esc(sm.name)+'" placeholder="masalan: Marinovkali go\'sht"></div><div class="sec">Bir partiya uchun</div><div class="small muted">Miqdorlar g, ml yoki ta da. Masalan: mol go\'shti 1000, tuz 15, zira 5.</div><div id="sm_rows" style="display:flex;flex-direction:column;gap:8px">'+rows()+'</div><button class="btn ghost wide" type="button" id="sm_add">+ Masalliq</button><div class="grid2"><div class="field"><label for="sm_yield">Chiqadi (g)</label><input class="inp num" id="sm_yield" inputmode="decimal" value="'+sm.yield+'"></div><div class="field"><label for="sm_min">Kam qolsa xabar (kg)</label><input class="inp num" id="sm_min" inputmode="decimal" value="'+String(sm.min||0).replace(".",",")+'"></div></div><div class="card" style="gap:2px"><span class="small muted">1 kg narxi</span><span class="xb num" id="sm_cost" style="font-size:20px"></span></div><button class="btn wide" id="sm_save">Saqlash</button>'+(id?'<button class="btn danger wide" id="sm_del">O\'chirish</button>':""),m=>{
    const box=m.querySelector("#sm_rows");
    const sync=()=>{box.querySelectorAll("[data-r]").forEach(el=>{const r=sm.recipe[+el.dataset.r];if(el.dataset.f==="qty")r.qty=num(el.value)||0;else r.ing=el.value});sm.yield=num(m.querySelector("#sm_yield").value)||0};
    const cost=()=>{sync();m.querySelector("#sm_cost").textContent=som(semiPpb(sm)*1000)};
    box.addEventListener("input",cost);box.addEventListener("change",cost);m.querySelector("#sm_yield").addEventListener("input",cost);
    box.addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(!b)return;sync();sm.recipe.splice(+b.dataset.rm,1);box.innerHTML=rows();cost()});
    m.querySelector("#sm_add").addEventListener("click",()=>{sync();sm.recipe.push({ing:"",qty:0});box.innerHTML=rows();cost();const ns=box.querySelectorAll('select[data-f="ing"]');const last=ns[ns.length-1];if(last){last.scrollIntoView({block:"center",behavior:"smooth"});last.focus()}});
    cost();
    m.querySelector("#sm_save").addEventListener("click",async()=>{sync();const name=m.querySelector("#sm_name").value.trim();if(!name){toast("Nomini kiriting");return}if(!(sm.yield>0)){toast("Qancha chiqishini yozing");return}
      try{await run(sb.from("semi").upsert({id:id||slug(name),name,recipe:sm.recipe.filter(r=>r.ing&&r.qty>0),yield:sm.yield,min:num(m.querySelector("#sm_min").value)||0,show:sm.show!==false,sort:sm.order||99}),"Saqlandi");closeModal()}catch(e){}});
    const del=m.querySelector("#sm_del");if(del)del.addEventListener("click",()=>confirmDel("semi",id,sm.name))});
}
function mDebt(){
  openModal(mHead("Bizning qarz")+'<div class="field"><label for="d_name">Kimga</label><input class="inp" id="d_name"></div><div class="field"><label for="d_amt">Summa (so\'m)</label><input class="inp num" id="d_amt" inputmode="numeric"></div><div class="field"><label for="d_note">Izoh</label><input class="inp" id="d_note"></div><button class="btn wide" id="d_save">Saqlash</button>',m=>{
    m.querySelector("#d_save").addEventListener("click",async()=>{const n=m.querySelector("#d_name").value.trim(),a=num(m.querySelector("#d_amt").value);if(!n||!(a>0)){toast("Ism va summani kiriting");return}
      try{await run(sb.from("debts").insert({name:n,amount:a,note:m.querySelector("#d_note").value.trim()}),"Saqlandi");closeModal()}catch(e){}})});
}
function mDebtPay(id){
  const d=S.debts[id];if(!d)return;
  openModal(mHead("Qarzni to'lash")+'<div class="card"><span class="b">'+esc(d.name)+'</span><span class="small muted">Qolgan qarz</span><span class="xb num" style="font-size:20px">'+som(d.amount)+'</span></div><div class="field"><label for="dp_amt">To\'langan summa (so\'m)</label><input class="inp num" id="dp_amt" inputmode="numeric" value="'+Math.round(d.amount)+'"></div><div class="small muted">Qisman to\'lasangiz, qolgani ro\'yxatda qoladi. To\'liq to\'lansa, qarz ro\'yxatdan o\'chadi.</div><button class="btn wide" id="dp_yes">Saqlash</button><button class="btn ghost wide" data-act="close">Bekor qilish</button>',m=>{
    m.querySelector("#dp_yes").addEventListener("click",async()=>{const a=num(m.querySelector("#dp_amt").value);if(!(a>0)){toast("Summani kiriting");return}
      const left=Math.round(d.amount-a);
      try{if(left<=0)await run(sb.from("debts").delete().eq("id",id),"Qarz to'liq to'landi");
        else await run(sb.from("debts").update({amount:left,note:((d.note||"")+" · "+shortDate(ymd(new Date()))+": "+sp(a)+" to'landi").replace(/^ · /,"")}).eq("id",id),"Qolgan qarz: "+som(left));
        closeModal()}catch(e){}})});
}
/* Mijozdan qarz to'lovi (somsa topshirilmagan kuni ham) */
function mPay(cid){
  const c=S.clients[cid];if(!c)return;const b=clientBalance(cid);
  openModal(mHead("Qarz to'lovi")+'<div class="card"><span class="b">'+esc(c.name)+'</span><span class="small muted">Hozirgi qarzi</span><span class="xb num" style="font-size:20px">'+som(b)+'</span></div><div class="field"><label for="py_amt">Olingan summa (so\'m)</label><input class="inp num" id="py_amt" inputmode="numeric"></div><div class="field"><label for="py_date">Sana</label><input class="inp" type="date" id="py_date" value="'+ymd(new Date())+'"></div><div class="field"><label for="py_note">Izoh (ixtiyoriy)</label><input class="inp" id="py_note"></div><button class="btn wide" id="py_save">Saqlash</button>',m=>{
    m.querySelector("#py_save").addEventListener("click",async()=>{const a=num(m.querySelector("#py_amt").value);if(!(a>0)){toast("Summani kiriting");return}
      const row={client_id:cid,amount:a,date:m.querySelector("#py_date").value||ymd(new Date()),note:m.querySelector("#py_note").value.trim()};
      row.id=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2));
      S.payments[row.id]={client:cid,date:row.date,amount:a,note:row.note};
      try{await sendOrQueue({k:"pay",row},"To'lov saqlandi");closeModal();render()}catch(e){delete S.payments[row.id]}})});
}
/* Mijoz hisob-kitob varag'i (akt sverka) */
function aktLines(cid){
  const c=S.clients[cid]||{};const ev=[];
  for(const k of dayKeys()){const dl=(S.days[k].deliveries||{})[cid];if(!dl||!dl.done)continue;
    if(dl.givenSum)ev.push({date:k,o:1,txt:"Berildi: "+sumObj(dl.given)+" ta",plus:dl.givenSum});
    if(dl.retSum)ev.push({date:k,o:0,txt:"Qaytdi: "+sumObj(dl.returned)+" ta",minus:dl.retSum});
    if(dl.paid)ev.push({date:k,o:2,txt:"To'landi",minus:dl.paid})}
  for(const p of Object.values(S.payments))if(p.client===cid)ev.push({date:p.date,o:3,txt:"Qarz to'lovi"+(p.note?" ("+p.note+")":""),minus:p.amount});
  ev.sort((a,b)=>a.date.localeCompare(b.date)||a.o-b.o);
  let bal=+c.startDebt||0;for(const e of ev){bal+=(e.plus||0)-(e.minus||0);e.bal=bal}
  return {start:+c.startDebt||0,ev,bal};
}
function mAkt(cid){
  const c=S.clients[cid];if(!c)return;const A=aktLines(cid);const show=A.ev.slice(-60).reverse();
  let h=mHead(c.name)+'<div class="card" style="gap:2px"><span class="small muted">Hozirgi qarzi</span><span class="xb num" style="font-size:24px">'+som(A.bal)+'</span></div>';
  h+='<div class="grid2"><button class="btn" data-act="pay" data-c="'+cid+'">To\'lov qabul qilish</button><button class="btn ghost" id="ak_share">Ulashish</button></div>';
  h+=show.length?'<div class="list">'+show.map(e=>'<div class="row"><div class="col"><span class="b">'+esc(e.txt)+'</span><span class="small muted">'+shortDate(e.date)+' · qoldiq '+sp(e.bal)+'</span></div><span class="b num" style="color:'+(e.plus?"var(--ink)":"var(--ok)")+'">'+(e.plus?"+":"−")+sp(e.plus||e.minus)+'</span></div>').join("")+'</div>':'<div class="card empty">Hali hisob-kitob yo\'q.</div>';
  if(A.start)h+='<div class="small muted">Boshlang\'ich qarz: '+som(A.start)+'</div>';
  openModal(h,m=>{m.querySelector("#ak_share").addEventListener("click",()=>{
    const lines=["HISOB-KITOB VARAG'I","Mijoz: "+c.name,"Sana: "+shortDate(ymd(new Date())),""];
    if(A.start)lines.push("Boshlang'ich qarz: "+sp(A.start));
    for(const e of A.ev.slice(-30))lines.push(shortDate(e.date)+" — "+e.txt+": "+(e.plus?"+":"−")+sp(e.plus||e.minus)+" (qoldiq "+sp(e.bal)+")");
    lines.push("");lines.push("Qolgan qarz: "+som(A.bal));
    location.href="https://t.me/share/url?url="+encodeURIComponent(" ")+"&text="+encodeURIComponent(lines.join("\n"))})});
}
/* Boshqa xarajatlar */
const EXP_CATS=["Gaz","O'tin / ko'mir","Benzin","Paket","Elektr","Boshqa"];
function mExpense(){
  openModal(mHead("Xarajat")+'<div class="field"><label for="ex_cat">Turi</label><select class="inp" id="ex_cat">'+EXP_CATS.map(c=>'<option>'+esc(c)+'</option>').join("")+'</select></div><div class="field"><label for="ex_amt">Summa (so\'m)</label><input class="inp num" id="ex_amt" inputmode="numeric"></div><div class="field"><label for="ex_date">Sana</label><input class="inp" type="date" id="ex_date" value="'+ymd(new Date())+'"></div><div class="field"><label for="ex_note">Izoh (ixtiyoriy)</label><input class="inp" id="ex_note"></div><button class="btn wide" id="ex_save">Saqlash</button>',m=>{
    m.querySelector("#ex_save").addEventListener("click",async()=>{const a=num(m.querySelector("#ex_amt").value);if(!(a>0)){toast("Summani kiriting");return}
      try{await run(sb.from("expenses").insert({category:m.querySelector("#ex_cat").value,amount:a,date:m.querySelector("#ex_date").value||ymd(new Date()),note:m.querySelector("#ex_note").value.trim()}),"Xarajat saqlandi");closeModal()}catch(e){}})});
}
function mExpDel(id){
  const e=S.expenses[id];if(!e)return;
  openModal(mHead("Xarajat")+'<div class="card"><span class="b">'+esc(e.category)+' · '+som(e.amount)+'</span><span class="small muted">'+shortDate(e.date)+(e.note?" · "+esc(e.note):"")+'</span></div><button class="btn danger wide" id="xd_yes">Bu xarajatni o\'chirish</button><button class="btn ghost wide" data-act="close">Yopish</button>',m=>{
    m.querySelector("#xd_yes").addEventListener("click",async()=>{try{await run(sb.from("expenses").delete().eq("id",id),"O'chirildi");closeModal()}catch(err){}})});
}
function slug(s){return (String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")||"x")+"_"+Math.random().toString(36).slice(2,6)}
function mType(id,draft){
  const t=draft||(id?JSON.parse(JSON.stringify(S.types[id])):{name:"",price:0,order:types().length+1,recipe:[]});
  const ingOpts=sel=>'<option value=""'+(sel?"":" selected")+' disabled>— Masalliqni tanlang —</option>'+'<optgroup label="Yarim tayyor">'+semis().map(sm=>'<option value="s:'+sm.id+'"'+("s:"+sm.id===sel?" selected":"")+'>'+esc(sm.name)+' (g)</option>').join("")+'</optgroup><optgroup label="Masalliqlar">'+ings().map(i=>'<option value="'+i.id+'"'+(i.id===sel?" selected":"")+'>'+esc(i.name)+' ('+baseLabel(i)+')</option>').join("")+'</optgroup>';
  const rows=()=>(t.recipe||[]).map((r,k)=>'<div class="card" style="gap:6px"><div class="inrow"><select class="inp" data-r="'+k+'" data-f="ing" aria-label="Masalliq">'+ingOpts(r.ing)+'</select><input class="inp num" style="max-width:96px" data-r="'+k+'" data-f="qty" inputmode="decimal" value="'+String(r.qty).replace(".",",")+'" aria-label="Miqdor"></div><div class="inrow"><input class="inp" data-r="'+k+'" data-f="label" placeholder="Onamga ko\'rinadigan nom (ixtiyoriy)" value="'+esc(r.label||"")+'" aria-label="Nom"></div><div style="display:flex;justify-content:space-between;align-items:center"><label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-r="'+k+'" data-f="show"'+(r.show?" checked":"")+'> Onamga ko\'rinsin</label><button class="btn danger small" type="button" data-rm="'+k+'">O\'chirish</button></div></div>').join("");
  const h=mHead(id?"Somsa turi":"Yangi tur")+'<div class="field"><label for="t_name">Nomi</label><input class="inp" id="t_name" value="'+esc(t.name)+'"></div><div class="grid2"><div class="field"><label for="t_price">Asosiy narx (so\'m)</label><input class="inp num" id="t_price" inputmode="numeric" value="'+(t.price||"")+'"></div><div class="field"><label for="t_ord">Tartib</label><input class="inp num" id="t_ord" inputmode="numeric" value="'+(t.order||"")+'"></div></div><div class="sec">Retsept — 1 ta somsaga</div><div class="small muted">Miqdor masalliqning o\'lchovida: g, ml yoki ta. Masalan karobka 20 ta somsaga 1 ta bo\'lsa — 0,05.</div><div id="t_rows" style="display:flex;flex-direction:column;gap:8px">'+rows()+'</div><div class="grid2"><button class="btn ghost" type="button" id="t_add">+ Masalliq qo\'shish</button><button class="btn ghost" type="button" id="t_newing">+ Yangi masalliq</button></div><button class="btn wide" id="t_save" style="min-height:52px">Saqlash</button>'+(id?'<button class="btn danger wide" id="t_del">Bu turni o\'chirish</button>':"");
  openModal(h,m=>{const box=m.querySelector("#t_rows");
    const sync=()=>box.querySelectorAll("[data-r]").forEach(el=>{const r=t.recipe[+el.dataset.r];const f=el.dataset.f;if(f==="show")r.show=el.checked;else if(f==="qty")r.qty=num(el.value)||0;else r[f]=el.value});
    m.querySelector("#t_add").addEventListener("click",()=>{sync();t.recipe.push({ing:"",qty:0,show:true,label:""});box.innerHTML=rows();const ns=box.querySelectorAll('select[data-f="ing"]');const last=ns[ns.length-1];if(last){last.scrollIntoView({block:"center",behavior:"smooth"});last.focus()}});
    box.addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(!b)return;sync();t.recipe.splice(+b.dataset.rm,1);box.innerHTML=rows()});
    m.querySelector("#t_newing").addEventListener("click",()=>{sync();t.name=m.querySelector("#t_name").value;t.price=num(m.querySelector("#t_price").value)||0;mIng(null,newId=>{t.recipe.push({ing:newId,qty:0,show:true,label:""});mType(id,t)})});
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
function mIng(id,after){
  const i=id?Object.assign({},S.ings[id]):{name:"",unit:"kg",packQty:1,packPrice:0,min:0,order:ings().length+1,stock:0};
  const h=mHead(id?"Masalliq":"Yangi masalliq")+'<div class="field"><label for="i_name">Nomi</label><input class="inp" id="i_name" value="'+esc(i.name)+'"></div><div class="field"><label for="i_unit">O\'lchov</label><select class="inp" id="i_unit">'+Object.keys(UNITS).map(u=>'<option value="'+u+'"'+(i.unit===u?" selected":"")+'>'+UNITS[u].name+'</option>').join("")+'</select></div><div class="grid2"><div class="field"><label for="i_pq">Qadoq miqdori</label><input class="inp num" id="i_pq" inputmode="decimal" value="'+String(i.packQty).replace(".",",")+'"></div><div class="field"><label for="i_pp">Qadoq narxi (so\'m)</label><input class="inp num" id="i_pp" inputmode="numeric" value="'+(i.packPrice||"")+'"></div></div><div class="small muted">Masalan: un 1 qop = 50 kg, 485 000 so\'m.</div><div class="field"><label for="i_min">Chegara — shundan kamaysa xabar chiqadi</label><input class="inp num" id="i_min" inputmode="decimal" value="'+String(i.min||0).replace(".",",")+'"></div><button class="btn wide" id="i_save" style="min-height:52px">Saqlash</button>'+(id?'<button class="btn danger wide" id="i_del">Bu masalliqni o\'chirish</button>':"");
  openModal(h,m=>{m.querySelector("#i_save").addEventListener("click",async()=>{const name=m.querySelector("#i_name").value.trim();if(!name){toast("Nomini kiriting");return}
    const row={id:id||slug(name),name,unit:m.querySelector("#i_unit").value,pack_qty:num(m.querySelector("#i_pq").value)||1,pack_price:num(m.querySelector("#i_pp").value)||0,min:num(m.querySelector("#i_min").value)||0,sort:i.order||99};
    if(!id)row.stock=0;
    try{await run(sb.from("ingredients").upsert(row),"Saqlandi");S.ings[row.id]={name:row.name,unit:row.unit,packQty:row.pack_qty,packPrice:row.pack_price,min:row.min,stock:+i.stock||0,order:row.sort};if(after)after(row.id);else closeModal()}catch(e){}});
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
  const TBL={days:"Kun (zakaz / yetkazish)",moves:"Ombor amali",ingredients:"Masalliq",somsa_types:"Somsa turi",clients:"Mijoz",debts:"Bizning qarz",settings:"Sozlama",payments:"Qarz to'lovi",expenses:"Rasxod",cash_in:"Kirim",creditor_ledger:"Bizning qarz",semi:"Yarim tayyor mahsulot"};
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
  if(a==="tab"||a==="go"){if(b.dataset.k!=="yetkazish"||tab==="yetkazish")selShop=null;tab=b.dataset.k;closeDrawer();window.scrollTo(0,0);render()}
  else if(a==="menu")openDrawer();else if(a==="drawerclose")closeDrawer();
  else if(a==="calc"){calcCounts[b.dataset.t]=Math.max(0,(+calcCounts[b.dataset.t]||0)+(+b.dataset.n));render()}
  else if(a==="qseg"){qseg=b.dataset.k;render()}
  else if(a==="calcclear"){for(const k in calcCounts)delete calcCounts[k];render()}
  else if(a==="cred")mCred(b.dataset.n);else if(a==="crednew")mCredEntry("",1,0);
  else if(a==="kirim")mKirim();else if(a==="kassastart")mKassaStart();else if(a==="kdel")mKassaDel(b.dataset.kind,b.dataset.id);
  else if(a==="mother"){closeDrawer();preview=preview===null?"ishchi":preview==="ishchi"?"kuzatuvchi":null;window.scrollTo(0,0);render()}
  else if(a==="user")mUser(b.dataset.id);
  else if(a==="date"){viewDate=addDays(viewDate,+b.dataset.n);selShop=null;render()}
  else if(a==="seltype"){selType=b.dataset.t;render()}
  else if(a==="ordclear")clearOrders(viewDate);
  else if(a==="ord")changeOrder(viewDate,b.dataset.c,b.dataset.t,+b.dataset.n);
  else if(a==="ret"){const d=drafts[b.dataset.c]=drafts[b.dataset.c]||{};d[b.dataset.t]=Math.max(0,(+d[b.dataset.t]||0)+(+b.dataset.n));render()}
  else if(a==="give"){const c=clientOf(b.dataset.c);if(!c)return;const s=delivState(c);saveDelivery(c.id,s.given,s.returned,Math.max(0,s.due))}
  else if(a==="fix"){selShop=b.dataset.c;const c=clientOf(selShop);if(c)shopDraft(c).edit=true;render()}
  else if(a==="shop"){selShop=b.dataset.c;window.scrollTo(0,0);render()}
  else if(a==="shopback"){selShop=null;window.scrollTo(0,0);render()}
  else if(a==="shopedit"){const c=clientOf(selShop);if(c)shopDraft(c).edit=true;render()}
  else if(a==="shopcancel"){delete SD[viewDate+"|"+selShop];render()}
  else if(a==="shopsave")shopSave();
  else if(a==="sdpaid"){const c=clientOf(selShop);if(!c)return;shopDraft(c).paid=b.dataset.v;const el=document.getElementById("sd_paid");if(el)el.value=groupDigits(b.dataset.v);shopRefresh()}
  else if(a==="sd"){const c=clientOf(selShop);if(!c)return;const sd=shopDraft(c);const kk=b.dataset.k;const obj=kk==="g"?sd.given:kk==="f"?sd.fr:sd.ret;const t=b.dataset.t;obj[t]=Math.max(0,(+obj[t]||0)+(+b.dataset.n));if(kk==="f")obj[t]=Math.min(obj[t],retPool(viewDate,c.id)[t]||0);
    const inp=document.querySelector('[data-sdin="'+b.dataset.k+'"][data-t="'+t+'"]');if(inp)inp.value=obj[t];shopRefresh()}
  else if(a==="nak")mNak(b.dataset.c);
  else if(a==="xarid")mXarid2();else if(a==="tayyor")mTayyor();else if(a==="edsemi")mSemi(b.dataset.id);else if(a==="uyga")mUyga();else if(a==="uydel")mUyDel(b.dataset.kind,b.dataset.id);else if(a==="uyexp")mUyExp();else if(a==="sanash")mSanash();
  else if(a==="period"){period=b.dataset.k;render()}
  else if(a==="debt")mDebt();else if(a==="debtpay")mDebtPay(b.dataset.id);
  else if(a==="pay")mPay(b.dataset.c);else if(a==="akt")mAkt(b.dataset.c);
  else if(a==="exp")mRasxod();else if(a==="expdel")mExpDel(b.dataset.id);
  else if(a==="zax"){const v=Object.assign({},S.config,{zaxira:Math.max(0,(+S.config.zaxira||0)+(+b.dataset.n))});S.config=v;render();run(sb.from("settings").upsert({key:"main",value:v}))}
  else if(a==="edtype")mType(b.dataset.id);else if(a==="edclient")mClient(b.dataset.id);else if(a==="eding")mIng(b.dataset.id);
  else if(a==="history")mHistory();
  else if(a==="drsave"){const mx=num(document.getElementById("dr_max").value),dd=parseInt(document.getElementById("dr_days").value.replace(/\s/g,""),10);if(!(mx>=0)||!(dd>=0)){toast("Raqamni to'g'ri kiriting");return}
    const v=Object.assign({},S.config,{debtMax:mx,debtDays:dd});S.config=v;run(sb.from("settings").upsert({key:"main",value:v}),"Saqlandi").then(render).catch(()=>{})}
  else if(a==="excel")mExcel();
  else if(a==="logout"){closeDrawer();sb.auth.signOut()}
});
document.getElementById("modalwrap").addEventListener("click",e=>{if(e.target.id==="modalwrap")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")window.somsaBack();else if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}});
document.addEventListener("change",e=>{const el=e.target.closest&&e.target.closest("[data-calc]");if(!el)return;calcCounts[el.dataset.calc]=Math.max(0,parseInt(el.value.replace(/\s/g,""),10)||0);render()});
// Dastur ochiq qolib, yangi kun boshlansa: "Bugun"ni ko'rib turgan bo'lsa, yangi kunga (0 zakazli) o'tadi
let lastToday=ymd(new Date());
function rollDay(){const t=ymd(new Date());if(t===lastToday)return false;const was=viewDate===lastToday;lastToday=t;if(was){viewDate=t;K.date=null;return true}return false}
setInterval(()=>{if(rollDay()&&session&&ready){if(role()==="kuzatuvchi")fetchKuzatuv(viewDate);else render()}},60000);
async function refresh(){rollDay();if(!session||!ready)return;try{await loadAll();applyQueued();saveCache()}catch(e){return}if(role()==="kuzatuvchi")await fetchKuzatuv(viewDate);else render()}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
// Kuzatuvchi jonli yangilanishni olmaydi: har daqiqada yangilab turamiz
setInterval(()=>{if(document.visibilityState==="visible"&&session&&ready&&role()==="kuzatuvchi")fetchKuzatuv(viewDate)},60000);

/* ---------- boot ---------- */
async function start(sess){
  session=sess;ready=false;
  if(!session){if(channel){sb.removeChannel(channel);channel=null}render();return}
  splash("Ma'lumotlar yuklanmoqda…");
  try{await loadAll();applyQueued();saveCache()}
  catch(e){if(loadCache()){applyQueued();ready=true;render();toast("Internet yo'q — oxirgi saqlangan ma'lumotlar ko'rsatilmoqda");return}
    splash("Ma'lumotlarni yuklab bo'lmadi. Internetni tekshirib, dasturni qayta oching.");return}
  ready=true;subscribe();render();flushQueue();
}
let lastUser=undefined;
sb.auth.onAuthStateChange((_ev,sess)=>{const uid=sess?sess.user.id:null;if(uid===lastUser){session=sess;return}lastUser=uid;setTimeout(()=>start(sess),0)});
