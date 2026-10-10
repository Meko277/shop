/* Admin v2: Firebase role gate + legacy 1234. Tabs: products, orders, users, mail, log, settings. */
const ADMIN_PASS="1234";
const $=id=>document.getElementById(id);
const money=n=>"$"+Number(n).toFixed(2);
const DP=[{id:"p1",name:"Apple iPhone 15 Pro Max 256GB",cat:"Electronics",price:1199,old:1299,rating:4.8,reviews:2314,img:"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600",badge:"Best Seller",stock:25,desc:"A17 Pro chip."},{id:"p2",name:"Samsung 55 inch 4K Smart TV",cat:"Electronics",price:499,old:799,rating:4.6,reviews:1872,img:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600",badge:"-38%",stock:15,desc:"Crystal 4K."}];
const getP=()=>{try{const s=localStorage.getItem("meko_products");if(s)return JSON.parse(s)}catch(e){}return DP};
const saveP=p=>localStorage.setItem("meko_products",JSON.stringify(p));
const getO=()=>{try{return JSON.parse(localStorage.getItem("meko_orders")||"[]")}catch(e){return[]}};
const saveO=o=>localStorage.setItem("meko_orders",JSON.stringify(o));
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2000)}
let editId=null,upImg="";
document.addEventListener("DOMContentLoaded",()=>{
autoGate();
$("login-btn").onclick=adminLogin;
$("legacy-btn").onclick=doLegacy;$("p").addEventListener("keydown",e=>{if(e.key==="Enter")doLegacy()});
$("logout").onclick=()=>{sessionStorage.removeItem("meko_admin");location.reload()};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("on"));b.classList.add("on");["products","add","orders","users","mail","maillog","settings"].forEach(t=>$("tab-"+t).style.display=t===b.dataset.t?"block":"none")});
$("f-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{upImg=ev.target.result;$("preview").src=upImg;$("preview").style.display="block"};r.readAsDataURL(f)};
$("save-p").onclick=saveProduct;$("cancel-e").onclick=()=>{editId=null;$("form-title").textContent="Add Product";["f-name","f-cat","f-price","f-old","f-stock","f-rating","f-img","f-desc"].forEach(i=>$(i).value="")};
$("send-note").onclick=sendNote;$("save-settings").onclick=saveSettings;loadSettings();syncAdminCloud();
});
async function autoGate(){if(sessionStorage.getItem("meko_admin")==="1")return showAdmin();
try{const u=typeof currentUser==="function"?currentUser():null;if(u&&(u.role==="admin"||roleOf(u.email)==="admin")){sessionStorage.setItem("meko_admin","1");return showAdmin()}}catch(e){}}
async function adminLogin(){const em=$("a-email").value.trim(),pw=$("a-pass").value;const er=$("admin-err");
try{
let u=null;
const A=fbAuth();
if(A){const c=await A.signInWithEmailAndPassword(em,pw);u=await afterLogin({uid:c.user.uid,name:c.user.displayName||em.split("@")[0],email:c.user.email})}
else{const users=JSON.parse(localStorage.getItem("meko_users")||"[]");const f=users.find(x=>x.email===em&&x.pass===pw);if(!f)throw new Error("Invalid login");u=await afterLogin({uid:f.uid||f.email,name:f.name,email:em})}
if(u.role!=="admin"&&roleOf(u.email)!=="admin"){er.textContent="You're a CUSTOMER. Click 'Become seller' on the store — owner approves by email.";return}
sessionStorage.setItem("meko_admin","1");showAdmin();
}catch(e){er.textContent=e.message||String(e)}}
function doLegacy(){if($("p").value===ADMIN_PASS){sessionStorage.setItem("meko_admin","1");showAdmin()}else toast("Wrong password")}
function showAdmin(){$("login-view").style.display="none";$("admin-view").style.display="block";$("logout").style.display="flex";render()}
function render(){const P=getP(),O=getO();
$("s-rev").textContent=money(O.reduce((s,x)=>s+x.total,0));$("s-ord").textContent=O.length;$("s-pro").textContent=P.length;$("s-stock").textContent=P.reduce((s,x)=>s+(+x.stock||0),0);
$("p-rows").innerHTML=P.map(p=>`<tr><td><img src="${p.img}" onerror="this.src='https://via.placeholder.com/50'"></td><td>${p.name.slice(0,35)}</td><td>${p.cat}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><button class="btn btn-e" onclick="editP('${p.id}')">Edit</button> <button class="btn btn-d" onclick="delP('${p.id}')">Del</button></td></tr>`).join("");
$("o-list").innerHTML=O.length?O.map(o=>`<div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:8px 0"><b>${o.id}</b> — ${o.name} (${o.phone}) ${o.paid?'<span style="background:#dcfce7;padding:2px 8px;border-radius:10px;font-size:11px">PAID</span>':""}<br><small>${o.date} • ${o.city} • ${o.items.reduce((s,i)=>s+i.qty,0)} items • <b>${money(o.total)}</b> • ${String(o.pay).toUpperCase()}${o.email?` • ${o.email}`:""}</small><br><small>${o.items.map(i=>i.name.slice(0,30)+" x"+i.qty).join(", ")}</small><br><div style="margin-top:8px"><select id="st-${o.id}">${["Pending","Paid","Shipped","Delivered","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select> <button class="btn btn-e" onclick="setStatus('${o.id}')">Update</button> <button class="btn btn-e" onclick="printInvoice('${o.id}')">Invoice</button> <button class="btn btn-d" onclick="delO('${o.id}')">Delete</button></div></div>`).join(""):"<p>No orders yet.</p>";
renderUsers();renderMail();renderMailLog();
}
function saveProduct(){const name=$("f-name").value.trim();if(name.length<3)return toast("Enter name");const price=+$("f-price").value;if(!(price>0))return toast("Enter price");
const P=getP();const img=upImg||$("f-img").value.trim()||"https://via.placeholder.com/600x400?text=Product";
const obj={id:editId||"p"+Date.now(),name,cat:$("f-cat").value.trim()||"General",price,old:+$("f-old").value||price,stock:+$("f-stock").value||10,rating:+$("f-rating").value||4.5,reviews:Math.floor(Math.random()*500)+10,img,badge:"",desc:$("f-desc").value.trim()};
if(editId){const i=P.findIndex(x=>x.id===editId);P[i]={...P[i],...obj}}else P.unshift(obj);
saveP(P);editId=null;upImg="";$("form-title").textContent="Add Product";["f-name","f-cat","f-price","f-old","f-stock","f-rating","f-img","f-desc"].forEach(i=>$(i).value="");toast("Saved ✓");render()}
function editP(id){const p=getP().find(x=>x.id===id);if(!p)return;editId=id;$("form-title").textContent="Edit Product";$("f-name").value=p.name;$("f-cat").value=p.cat;$("f-price").value=p.price;$("f-old").value=p.old;$("f-stock").value=p.stock;$("f-rating").value=p.rating;$("f-img").value=p.img.startsWith("data:")?"":p.img;$("f-desc").value=p.desc||"";document.querySelector('[data-t=add]').click();window.scrollTo(0,0)}
function delP(id){if(!confirm("Delete product?"))return;saveP(getP().filter(x=>x.id!==id));render()}
function setStatus(id){const o=getO();const f=o.find(x=>x.id===id);f.status=$("st-"+id).value;saveO(o);render();toast("Order "+f.status)}
function delO(id){if(!confirm("Delete order?"))return;saveO(getO().filter(x=>x.id!==id));render()}
function renderMail(){const s=getSubs(),n=getNotes();
const sn=$("sub-n");if(sn)sn.textContent=s.length;
const sl=$("sub-list");if(sl)sl.innerHTML=s.length?s.map(e=>`<span style="background:#f1edff;padding:4px 10px;border-radius:14px;margin:2px;display:inline-block">${e}</span>`).join(""):"No subscribers yet";
const nl=$("note-list");if(nl)nl.innerHTML=n.length?n.map((x,i)=>`<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin:6px 0"><b>${x.title}</b> <small>${x.date||""}</small><br><small>${x.body||""}</small> ${x.coupon?`<b>Coupon: ${x.coupon}</b>`:""}<br><button class="btn btn-d" onclick="delNote(${i})">Delete</button></div>`).join(""):"No offers sent"}
function sendNote(){const title=$("m-title").value.trim(),body=$("m-body").value.trim(),coupon=$("m-coupon").value.trim().toUpperCase(),to=$("m-to").value.trim();
if(title.length<3)return toast("Enter offer title");if(body.length<3)return toast("Enter message");
const n=getNotes();n.unshift({title,body,coupon,to:to||"all",date:new Date().toLocaleString()});saveNotes(n);pushProducts();
$("m-title").value="";$("m-body").value="";$("m-coupon").value="";$("m-to").value="";renderMail();
// REAL email blast
const targets=to?[to]:getSubs();
if(!targets.length)return toast("Offer saved (no subscribers)");
toast("Sending "+targets.length+" emails...");
Promise.all(targets.slice(0,200).map(e=>sendMail(e,title,`${body}${coupon?"\nCoupon: "+coupon:""}`,{name:e}).catch(()=>null))).then(rs=>{const ok=rs.filter(r=>r&&r.ok).length;renderMailLog();toast(ok?`Sent ${ok}/${targets.length} ✉️`:"Saved — configure EmailJS in Settings")});
}
function renderMailLog(){const el=$("mail-list");if(!el)return;const o=getOutbox();el.innerHTML=o.length?o.slice(0,50).map(m=>`<div style="border:1px solid #eee;border-radius:8px;padding:8px;margin:6px 0;font-size:13px"><b>${m.subject}</b> → ${m.to}<br><small>${m.date} • <b>${m.status}</b></small></div>`).join(""):"No emails yet"}
function renderUsers(){
const ul=$("u-list"),rl=$("req-list");if(!ul)return;
let users=[];try{users=JSON.parse(localStorage.getItem("meko_users")||"[]")}catch(e){}
let reqs=[];try{reqs=JSON.parse(localStorage.getItem("meko_admin_req")||"[]")}catch(e){}
ul.innerHTML=users.length?users.map(u=>`<div style="border:1px solid #eee;border-radius:8px;padding:8px;margin:6px 0;font-size:13px"><b>${u.name}</b> ${u.email} — <b>${u.role||"customer"}</b> <button class="btn btn-e" onclick="approveUser('${u.email}')">Make admin</button> <button class="btn" onclick="demoteUser('${u.email}')">Customer</button></div>`).join(""):"No registered users yet (Firebase users appear after login — approve via requests below)";
rl.innerHTML=reqs.length?reqs.map(r=>`<div style="border:1px solid #f0d48a;background:#fffbe6;border-radius:8px;padding:8px;margin:6px 0;font-size:13px"><b>${r.name}</b> ${r.email} <small>${r.at}</small> <button class="btn btn-e" onclick="approveUser('${r.email}')">✅ Approve</button> <button class="btn btn-d" onclick="rejectReq('${r.email}')">Reject</button></div>`).join(""):"No pending requests";
try{const db=fbDb();if(db){db.ref("users").once("value").then(s=>{const v=s.val();if(v){const arr=Object.entries(v).map(([uid,x])=>({uid,...x}));const extra=arr.filter(a=>!users.find(u=>u.email===a.email));if(extra.length)ul.innerHTML+=`<h4>Firebase users</h4>`+extra.map(u=>`<div style="border:1px solid #eee;border-radius:8px;padding:8px;margin:6px 0;font-size:13px"><b>${u.name||""}</b> ${u.email} — <b>${u.role||"customer"}</b> <button class="btn btn-e" onclick="approveUser('${u.email}')">Make admin</button></div>`).join("")}}).catch(()=>{})}}catch(e){}
}
async function approveUser(email){syncRole(email,"admin");
let users=[];try{users=JSON.parse(localStorage.getItem("meko_users")||"[]")}catch(e){}const f=users.find(x=>x.email===email);if(f){f.role="admin";localStorage.setItem("meko_users",JSON.stringify(users))}
let reqs=[];try{reqs=JSON.parse(localStorage.getItem("meko_admin_req")||"[]")}catch(e){}localStorage.setItem("meko_admin_req",JSON.stringify(reqs.filter(r=>r.email!==email)));
const db=fbDb();if(db){try{db.ref("admin_requests/"+btoa(email)).remove()}catch(e){}}
try{const t=tplRoleApproved({name:(f&&f.name)||email,email});await sendMail(email,t.subject,t.message,{name:(f&&f.name)||email})}catch(e){}
renderUsers();toast("Approved ✅ "+email)}
function demoteUser(email){syncRole(email,"customer");let users=[];try{users=JSON.parse(localStorage.getItem("meko_users")||"[]")}catch(e){}const f=users.find(x=>x.email===email);if(f){f.role="customer";localStorage.setItem("meko_users",JSON.stringify(users))}renderUsers()}
function rejectReq(email){let reqs=[];try{reqs=JSON.parse(localStorage.getItem("meko_admin_req")||"[]")}catch(e){}localStorage.setItem("meko_admin_req",JSON.stringify(reqs.filter(r=>r.email!==email)));renderUsers()}
function loadSettings(){const c=cfg();try{
if($("s-owner"))$("s-owner").value=(c.OWNER_EMAILS||[""])[0]||"";
if($("s-public"))$("s-public").value=(c.EMAILJS||{}).PUBLIC_KEY||"";
if($("s-service"))$("s-service").value=(c.EMAILJS||{}).SERVICE_ID||"";
if($("s-template"))$("s-template").value=(c.EMAILJS||{}).TEMPLATE_ID||"";
if($("s-stripe"))$("s-stripe").value=c.STRIPE_PAYMENT_LINK||"";
if($("s-paypal"))$("s-paypal").value=c.PAYPAL_ME||"";
if($("s-tax"))$("s-tax").value=c.TAX_RATE??0.14;
if($("s-ship"))$("s-ship").value=c.SHIP_FEE??4.99;
}catch(e){}}
function saveSettings(){const c=cfg();
const upd={OWNER_EMAILS:[$("s-owner").value.trim()].filter(Boolean),EMAILJS:{PUBLIC_KEY:$("s-public").value.trim(),SERVICE_ID:$("s-service").value.trim(),TEMPLATE_ID:$("s-template").value.trim()},STRIPE_PAYMENT_LINK:$("s-stripe").value.trim(),PAYPAL_ME:$("s-paypal").value.trim(),TAX_RATE:+$("s-tax").value||0,SHIP_FEE:+$("s-ship").value||0};
window.MEKO_CONFIG={...c,...upd};localStorage.setItem("meko_settings",JSON.stringify(upd));
const db=fbDb();if(db){try{db.ref("settings").set(upd)}catch(e){}}
initEmailJS();toast("Settings saved ✅");loadSettings()}
function delNote(i){const n=getNotes();n.splice(i,1);saveNotes(n);renderMail()}
function pushProducts(){const db=fbDb();if(!db)return;try{db.ref("products").set(getP())}catch(e){}}
function syncAdminCloud(){renderMail();renderUsers();renderMailLog();try{const db=fbDb();if(!db)return;
db.ref("subscribers").once("value").then(s=>{const v=s.val();if(v){const a=Array.isArray(v)?v:Object.values(v);localStorage.setItem("meko_subs",JSON.stringify(a));renderMail()}}).catch(()=>{});
db.ref("admin_requests").once("value").then(s=>{const v=s.val();if(v){const a=Object.values(v);localStorage.setItem("meko_admin_req",JSON.stringify(a));renderUsers()}}).catch(()=>{});
db.ref("settings").once("value").then(s=>{const v=s.val();if(v){window.MEKO_CONFIG={...cfg(),...v};loadSettings()}}).catch(()=>{});
db.ref("orders").once("value").then(s=>{const v=s.val();if(v){const a=Object.values(v);const local=getO();const merged=[...a.filter(x=>!local.find(l=>l.id===x.id)),...local];localStorage.setItem("meko_orders",JSON.stringify(merged));render()}}).catch(()=>{});
}catch(e){}}
const _render=render;render=function(){_render();renderMail()};
