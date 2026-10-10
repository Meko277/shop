/* Admin: login admin/admin123, CRUD products, manage orders */
const ADMIN_USER="admin",ADMIN_PASS="admin123";
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
if(sessionStorage.getItem("meko_admin")==="1")showAdmin();
$("login-btn").onclick=()=>{if($("u").value===ADMIN_USER&&$("p").value===ADMIN_PASS){sessionStorage.setItem("meko_admin","1");showAdmin()}else toast("Wrong credentials (admin/admin123)")};
$("logout").onclick=()=>{sessionStorage.removeItem("meko_admin");location.reload()};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("on"));b.classList.add("on");["products","add","orders"].forEach(t=>$("tab-"+t).style.display=t===b.dataset.t?"block":"none")});
$("f-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{upImg=ev.target.result;$("preview").src=upImg;$("preview").style.display="block"};r.readAsDataURL(f)};
$("save-p").onclick=saveProduct;$("cancel-e").onclick=()=>{editId=null;$("form-title").textContent="Add Product";["f-name","f-cat","f-price","f-old","f-stock","f-rating","f-img","f-desc"].forEach(i=>$(i).value="")};
});
function showAdmin(){$("login-view").style.display="none";$("admin-view").style.display="block";$("logout").style.display="flex";render()}
function render(){const P=getP(),O=getO();
$("s-rev").textContent=money(O.reduce((s,x)=>s+x.total,0));$("s-ord").textContent=O.length;$("s-pro").textContent=P.length;$("s-stock").textContent=P.reduce((s,x)=>s+(+x.stock||0),0);
$("p-rows").innerHTML=P.map(p=>`<tr><td><img src="${p.img}" onerror="this.src='https://via.placeholder.com/50'"></td><td>${p.name.slice(0,35)}</td><td>${p.cat}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><button class="btn btn-e" onclick="editP('${p.id}')">Edit</button> <button class="btn btn-d" onclick="delP('${p.id}')">Del</button></td></tr>`).join("");
$("o-list").innerHTML=O.length?O.map(o=>`<div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:8px 0"><b>${o.id}</b> — ${o.name} (${o.phone})<br><small>${o.date} • ${o.city} • ${o.items.reduce((s,i)=>s+i.qty,0)} items • <b>${money(o.total)}</b> • ${o.pay.toUpperCase()}</small><br><small>${o.items.map(i=>i.name.slice(0,30)+" x"+i.qty).join(", ")}</small><br><div style="margin-top:8px"><select id="st-${o.id}">${["Pending","Shipped","Delivered","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select> <button class="btn btn-e" onclick="setStatus('${o.id}')">Update</button> <button class="btn btn-d" onclick="delO('${o.id}')">Delete</button></div></div>`).join(""):"<p>No orders yet — they appear here when customers checkout.</p>";
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
