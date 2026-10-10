/* Seller portal part 1 */
const $=id=>document.getElementById(id);
const money=n=>(cfg().CURRENCY||"$")+Number(n||0).toFixed(2);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
let EDIT=null,UPIMG="";
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("on"));b.classList.add("on");["orders","products","add","returns","settings"].forEach(t=>$("t-"+t).style.display=t===b.dataset.t?"block":"none")});
$("logout").onclick=()=>{const A=fbAuth();if(A)try{A.signOut()}catch(e){}localStorage.removeItem("meko_user");location.href="index.html"};
$("apply-btn").onclick=async()=>{try{await applySeller({storeName:$("s-store").value.trim(),phone:$("s-phone").value.trim(),city:$("s-city").value.trim(),nationalId:$("s-nid").value.trim(),address:$("s-addr").value.trim()});toast("Application sent");boot()}catch(e){toast(e.message)}};
$("p-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{UPIMG=ev.target.result;$("p-prev").src=UPIMG;$("p-prev").style.display="block"};r.readAsDataURL(f)};
$("p-save").onclick=saveMine;$("p-cancel").onclick=()=>{EDIT=null;$("f-title").textContent="Add product"};
$("st-save").onclick=saveStore;
const A=fbAuth();if(A){try{A.onAuthStateChanged(async u=>{if(u){await afterLogin({uid:u.uid,name:u.displayName||u.email.split("@")[0],email:u.email})}})}catch(e){}}
setTimeout(boot,400);
});
async function boot(){const u=currentUser();if(!u){location.href="index.html";return}
if(typeof isAdmin==="function"&&isAdmin())$("adm-link").style.display="";
const s=mySeller();
if(!s){$("apply-view").style.display="block";return}
if(s.status!=="approved"){$("apply-view").style.display="block";return}
$("dash-view").style.display="block";$("store-title").textContent="Store: "+s.storeName;
$("seller-status").textContent=u.email+" | commission "+(commissionRate()*100)+"%";
$("st-store").value=s.storeName||"";$("st-phone").value=s.phone||"";$("st-city").value=s.city||"";$("st-addr").value=s.address||"";
renderSeller();
}
async function saveStore(){const s=mySeller();if(!s)return;Object.assign(s,{storeName:$("st-store").value,phone:$("st-phone").value,city:$("st-city").value,address:$("st-addr").value});let a=[];try{a=JSON.parse(localStorage.getItem("meko_sellers")||"[]")}catch(e){}localStorage.setItem("meko_sellers",JSON.stringify(a.map(x=>x.email===s.email?s:x)));await fsSet("sellers",s.email.replace(/[^a-zA-Z0-9@._-]/g,"_"),s);toast("Store saved")}
function myProducts(){const u=currentUser();return getProducts().filter(p=>(p.sellerEmail||"store")===u.email)}
function myOrders(){const u=currentUser();let all=[];try{all=JSON.parse(localStorage.getItem("meko_sellerOrders")||"[]")}catch(e){}return all.filter(o=>o.seller===u.email)}

function renderSeller(){const P=myProducts(),O=myOrders();
const rev=O.filter(o=>o.status!=="cancelled").reduce((a,o)=>a+o.payout,0);
$("m-rev").textContent=money(rev);$("m-ord").textContent=O.length;$("m-pro").textContent=P.length;$("m-low").textContent=P.filter(p=>p.stock<=5).length;
$("sp-rows").innerHTML=P.map(p=>`<tr><td><img class="t" src="${p.img}"></td><td>${p.name.slice(0,30)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.status||"active"}</td><td><button class="btn be" onclick="editMine('${p.id}')">Edit</button> <button class="btn bd" onclick="delMine('${p.id}')">Del</button></td></tr>`).join("")||"<tr><td colspan=6>No products yet</td></tr>";
$("so-list").innerHTML=O.length?O.map((o,i)=>`<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin:8px 0;font-size:13px"><b>${o.orderId}</b> sub ${money(o.sub)} payout ${money(o.payout)} <b>${o.status}</b><br><small>${o.items.map(x=>x.qty+"x "+x.name.slice(0,28)).join(", ")}</small><br><select id="ss-${i}">${["pending","processing","shipped","delivered","cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select> <button class="btn be" onclick="setShip(${i})">Update</button></div>`).join(""):"No orders yet";
let ret=[];try{ret=JSON.parse(localStorage.getItem("meko_returns")||"[]")}catch(e){}
$("sr-list").innerHTML=ret.length?ret.map(r=>`<div style="font-size:13px;border:1px solid #eee;border-radius:8px;padding:8px;margin:6px 0">${r.orderId} — ${r.reason} (<b>${r.status}</b>)</div>`).join(""):"No returns";}
async function saveMine(){const u=currentUser();const name=$("p-name").value.trim();if(name.length<3)return toast("Name required");const price=+$("p-price").value;if(!(price>0))return toast("Price required");
const P=getProducts();const img=UPIMG||$("p-img").value.trim()||"https://via.placeholder.com/600x400?text=Product";
let specs={};try{if($("p-specs").value.trim())specs=JSON.parse($("p-specs").value)}catch(e){return toast("Bad specs JSON")}
const obj={id:EDIT||"p"+Date.now(),name,cat:$("p-cat").value.trim()||"General",brand:$("p-brand").value.trim()||"",price,old:+$("p-old").value||price,stock:+$("p-stock").value||10,sku:$("p-sku").value.trim()||("SKU-"+Date.now().toString().slice(-6)),img,desc:$("p-desc").value.trim(),specs,sellerEmail:u.email,status:"active",rating:4.5,reviews:10};
if(EDIT){const i=P.findIndex(x=>x.id===EDIT);if(!canManageProduct(P[i]))return toast("Not yours");P[i]={...P[i],...obj}}else P.unshift(obj);
saveProducts(P);await fsSet("products",obj.id,obj);await audit("product.save",u.email,obj.id);
EDIT=null;UPIMG="";$("f-title").textContent="Add product";toast("Saved");renderSeller()}
function editMine(id){const p=getProducts().find(x=>x.id===id);if(!canManageProduct(p))return toast("Not yours");EDIT=id;$("f-title").textContent="Edit product";$("p-name").value=p.name;$("p-cat").value=p.cat||"";$("p-brand").value=p.brand||"";$("p-price").value=p.price;$("p-old").value=p.old;$("p-stock").value=p.stock;$("p-sku").value=p.sku||"";$("p-desc").value=p.desc||"";document.querySelector('[data-t=add]').click()}
async function delMine(id){if(!confirm("Delete?"))return;const p=getProducts().find(x=>x.id===id);if(!canManageProduct(p))return toast("Not yours");saveProducts(getProducts().filter(x=>x.id!==id));await audit("product.delete",(currentUser()||{}).email,id);renderSeller()}
async function setShip(i){const O=myOrders();const o=O[i];o.status=$("ss-"+i).value;let all=[];try{all=JSON.parse(localStorage.getItem("meko_sellerOrders")||"[]")}catch(e){}const f=all.find(x=>x.orderId===o.orderId&&x.seller===o.seller);if(f)f.status=o.status;localStorage.setItem("meko_sellerOrders",JSON.stringify(all));
const main=getOrders().find(x=>x.id===o.orderId);if(main){if(o.status==="shipped")main.status="Shipped";if(o.status==="delivered")main.status="Delivered";saveOrders(getOrders().map(x=>x.id===main.id?main:x));await fsSet("orders",main.id,{status:main.status})}
await audit("order.ship",(currentUser()||{}).email,o.orderId+":"+o.status);renderSeller();toast("Updated")}
