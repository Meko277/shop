/* Product detail: gallery, variants, stock guard, reviews, related, share */
const $=id=>document.getElementById(id);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
const money=n=>(cfg().CURRENCY||"$")+Number(n||0).toFixed(2);
let PID=new URLSearchParams(location.search).get("id"),P=null,Q=1;
document.addEventListener("DOMContentLoaded",()=>{boot();setTimeout(()=>{if(typeof bindAuth==="function")bindAuth()},300)});
async function boot(){
let p=getProducts().find(x=>x.id===PID);
if(!p){const c=await fsGet("products",PID);if(c)P=p={id:PID,...c}}
if(!p){$("p-info").innerHTML="<h2>Product not found</h2><a href='index.html'>Back to store</a>";return}
P=p;
const imgs=[p.img,...(p.imgs||[])].filter(Boolean);
$("g-main").src=imgs[0];$("g-thumbs").innerHTML=imgs.map((s,i)=>`<img src="${s}" class="${i===0?"on":""}" onclick="setImg(${i},'${s}')">`).join("");
const d=p.old>p.price?Math.round((1-p.price/p.old)*100):0;
$("p-info").innerHTML=`<h2>${p.name}</h2><div>★ ${p.rating} (${p.reviews} ratings) • SKU ${p.sku||p.id}</div><div style="font-size:28px;font-weight:900">${money(p.price)} ${p.old>p.price?`<small style="text-decoration:line-through;color:#888">${money(p.old)}</small> <span class="badge">-${d}%</span>`:""}</div><p style="color:#444;margin:8px 0">${p.desc||""}</p><p><b>Seller:</b> ${p.sellerEmail||"MekoShop Official"} | <b>${p.stock>0?p.stock+" in stock":"OUT OF STOCK"}</b> | <b>${p.status||"active"}</b></p>`;
$("p-meta").innerHTML=`Category: ${p.cat||""} • Brand: ${p.brand||""} • Delivery: 2-4 days • Free returns 15 days`;
$("p-specs").innerHTML=p.specs&&Object.keys(p.specs).length?`<table>${Object.entries(p.specs).map(([k,v])=>`<tr><td style="padding:6px;border-bottom:1px solid #eee"><b>${k}</b></td><td style="padding:6px;border-bottom:1px solid #eee">${v}</td></tr>`).join("")}</table>`:"No specs";
renderRev();
const rel=getProducts().filter(x=>x.id!==p.id&&x.cat===p.cat).slice(0,6);
$("p-rel").innerHTML=rel.map(x=>`<div class="card" onclick="location.href='product.html?id=${x.id}'"><div class="img"><img src="${x.img}"></div><div class="card-body"><b>${x.name.slice(0,30)}</b><span class="price">${money(x.price)}</span></div></div>`).join("");
$("q-m").onclick=()=>{Q=Math.max(1,Q-1);$("q-n").textContent=Q};
$("q-p").onclick=()=>{Q=Math.min(P.stock||10,Q+1);$("q-n").textContent=Q};
$("p-add").onclick=()=>{addToCart(P.id,Q)};
$("p-buy").onclick=()=>{addToCart(P.id,Q);location.href="checkout.html"};
$("p-wish").onclick=()=>toggleWish(P.id);
$("p-share").onclick=()=>{try{navigator.clipboard.writeText(location.href);toast("Link copied")}catch(e){toast(location.href)}};
$("r-send").onclick=async()=>{await addReview(P.id,+$("r-star").value,$("r-text").value.trim());$("r-text").value="";renderRev()};
}
function setImg(i,s){$("g-main").src=s;document.querySelectorAll(".thumbs img").forEach((x,j)=>x.classList.toggle("on",i===j))}
async function renderRev(){let a=[];try{a=getReviews(PID)}catch(e){}const cloud=await fsQuery("reviews",[["pid","==",PID]],20);if(cloud.length)a=cloud;
$("rev-list").innerHTML=a.length?a.map(r=>`<div class="rev"><b>${r.user}</b> ${"★".repeat(r.rating)}<br><small>${r.at||""}</small><p>${r.text||""}</p></div>`).join(""):"No reviews yet — be the first!"}
function openM(id){$(id).classList.add("show");$("overlay").classList.add("show")}
function closeAll(){document.querySelectorAll(".modal,.drawer").forEach(m=>m.classList.remove("show"));$("overlay").classList.remove("show")}
