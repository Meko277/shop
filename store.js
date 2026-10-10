/* MekoShop store engine - products, cart, checkout, wishlist, orders. No backend needed. Stripe-ready. */
const STRIPE_PUBLIC_KEY = ""; // paste Stripe publishable key to enable real card processing
const FREE_SHIP = 50, SHIP_FEE = 4.99;
const DEFAULT_PRODUCTS = [
{id:"p1",name:"Apple iPhone 15 Pro Max 256GB - Natural Titanium",cat:"Electronics",price:1199,old:1299,rating:4.8,reviews:2314,img:"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600",badge:"Best Seller",stock:25,desc:"A17 Pro chip, 48MP camera, titanium design."},
{id:"p2",name:"Samsung 55 inch Crystal 4K Smart TV",cat:"Electronics",price:499,old:799,rating:4.6,reviews:1872,img:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600",badge:"-38%",stock:15,desc:"Crystal 4K UHD, Tizen smart TV."},
{id:"p3",name:"Sony WH-1000XM5 Noise Cancelling Headphones",cat:"Electronics",price:328,old:399,rating:4.9,reviews:5420,img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",badge:"Top Rated",stock:40,desc:"Industry leading noise cancellation, 30h battery."},
{id:"p4",name:"Nike Air Zoom Pegasus Running Shoes",cat:"Fashion",price:89,old:130,rating:4.7,reviews:3102,img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",badge:"-32%",stock:60,desc:"Responsive cushioning for daily running."},
{id:"p5",name:"Men's Casual Slim-Fit Denim Jacket",cat:"Fashion",price:45,old:79,rating:4.4,reviews:890,img:"https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600",badge:"",stock:100,desc:"Classic denim jacket, all seasons."},
{id:"p6",name:"Dyson V15 Detect Cordless Vacuum",cat:"Home",price:549,old:749,rating:4.8,reviews:1204,img:"https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600",badge:"-27%",stock:12,desc:"Laser reveals microscopic dust, 60min run."},
{id:"p7",name:"Instant Pot Duo 7-in-1 Pressure Cooker 5.7L",cat:"Home",price:79,old:119,rating:4.7,reviews:8930,img:"https://images.unsplash.com/photo-1585515320310-259814833e62?w=600",badge:"Best Seller",stock:50,desc:"Pressure cook, slow cook, rice, yogurt and more."},
{id:"p8",name:"LEGO Technic Supercar Building Set",cat:"Toys",price:149,old:199,rating:4.9,reviews:2210,img:"https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600",badge:"",stock:30,desc:"3778 pieces, V12 engine model."},
{id:"p9",name:"MacBook Air M3 13 inch 8GB 256GB",cat:"Electronics",price:999,old:1099,rating:4.9,reviews:1876,img:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",badge:"New",stock:20,desc:"M3 chip, 18h battery, fanless."},
{id:"p10",name:"Adidas Ultraboost Light Running Shoes",cat:"Fashion",price:110,old:190,rating:4.6,reviews:1543,img:"https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600",badge:"-42%",stock:45,desc:"Lightest Ultraboost ever."},
{id:"p11",name:"Philips Airfryer XL 6.2L",cat:"Home",price:129,old:199,rating:4.5,reviews:4320,img:"https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600",badge:"",stock:35,desc:"Healthy frying with 90% less fat."},
{id:"p12",name:"CeraVe Moisturizing Skincare Set",cat:"Beauty",price:29,old:45,rating:4.7,reviews:6720,img:"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",badge:"",stock:80,desc:"Dermatologist developed daily care."}
];
/* MekoShop store engine v2 — billing-aware, role-aware. */
const $=id=>document.getElementById(id);
const money=n=>(typeof cfg==="function"?(cfg().CURRENCY||"$"):"$")+Number(n||0).toFixed(2);
const getProducts=()=>{try{const s=localStorage.getItem("meko_products");if(s&&JSON.parse(s).length)return JSON.parse(s)}catch(e){}return DEFAULT_PRODUCTS.slice()};
const saveProducts=p=>localStorage.setItem("meko_products",JSON.stringify(p));
const getCart=()=>{try{return JSON.parse(localStorage.getItem("meko_cart")||"[]")}catch(e){return[]}};
const saveCart=c=>localStorage.setItem("meko_cart",JSON.stringify(c));
const getWish=()=>{try{return JSON.parse(localStorage.getItem("meko_wish")||"[]")}catch(e){return[]}};
const saveWish=w=>localStorage.setItem("meko_wish",JSON.stringify(w));
const getOrders=()=>{try{return JSON.parse(localStorage.getItem("meko_orders")||"[]")}catch(e){return[]}};
const saveOrders=o=>localStorage.setItem("meko_orders",JSON.stringify(o));
if(!localStorage.getItem("meko_products"))saveProducts(DEFAULT_PRODUCTS);
let state={cat:"",brand:"",q:"",sort:"pop",min:0,max:0,stock:false,minR:0,page:1};
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function stars(r){let s="";for(let i=1;i<=5;i++)s+=i<=Math.round(r)?"★":"☆";return s}
function disc(p){return p.old>p.price?Math.round((1-p.price/p.old)*100):0}
function cardHTML(p){const d=disc(p);const w=getWish().includes(p.id);
return `<div class="card"><div class="img" onclick="location.href='product.html?id=${p.id}'">${d?`<span class="badge">-${d}%</span>`:(p.badge?`<span class="badge">${p.badge}</span>`:"")}<img loading="lazy" src="${p.img}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'"><button class="wish ${w?"liked":""}" onclick="event.stopPropagation();toggleWish('${p.id}')">♥</button></div><div class="card-body"><h4 onclick="location.href='product.html?id=${p.id}'">${p.name}</h4><div class="stars">${stars(p.rating)} <small>${p.rating} (${p.reviews})</small></div><div class="price-row"><span class="price">${money(p.price)}</span>${p.old>p.price?`<span class="old">${money(p.old)}</span>`:""}</div><small class="prime">✓ ${p.stock>0?"In stock • fast delivery":"Out of stock"}</small><button class="add" onclick="addToCart('${p.id}')">Add to Cart</button></div></div>`}
function renderAll(){const P=getProducts();
const cats=[...new Set(P.map(p=>p.cat))];
$("search-cat").innerHTML='<option value="">All</option>'+cats.map(c=>`<option>${c}</option>`).join("");
$("filter-cat").innerHTML='<option value="">All Categories</option>'+cats.map(c=>`<option ${state.cat===c?"selected":""}>${c}</option>`).join("");
$("cat-links").innerHTML=cats.map(c=>`<a href="#" onclick="filterCat('${c}');return false">${c}</a>`).join("");
$("side-cats").innerHTML=cats.map(c=>`<a href="#" onclick="filterCat('${c}');return false">${c}</a>`).join("");
const CIM={Electronics:"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200",Fashion:"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",Home:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200",Toys:"https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200",Beauty:"https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200"};
$("cats-row").innerHTML=cats.map(c=>`<div class="cat-card" onclick="filterCat('${c}')"><img src="${CIM[c]||'https://via.placeholder.com/200?text='+c}"><b>${c}</b></div>`).join("");
let list=P.filter(p=>(p.status||"active")==="active").filter(p=>(!state.cat||p.cat===state.cat)&&(!state.brand||(p.brand||"")===state.brand)&&(!state.q||(p.name+" "+p.cat+" "+(p.brand||"")).toLowerCase().includes(state.q))&&(!state.min||p.price>=state.min)&&(!state.max||p.price<=state.max)&&(!state.stock||p.stock>0)&&(!state.minR||p.rating>=state.minR));
if(state.sort==="low")list.sort((a,b)=>a.price-b.price);else if(state.sort==="high")list.sort((a,b)=>b.price-a.price);else if(state.sort==="rating")list.sort((a,b)=>b.rating-a.rating);else if(state.sort==="discount")list.sort((a,b)=>disc(b)-disc(a));else if(state.sort==="new")list.sort((a,b)=>(b.at||0)-(a.at||0));
$("grid-title").textContent=state.q?`Results for "${state.q}" (${list.length})`:state.cat?state.cat:`Recommended (${list.length})`;
const shown=list.slice(0,(state.page||1)*12);
$("product-grid").innerHTML=shown.length?shown.map(cardHTML).join(""):`<div style="grid-column:1/-1;text-align:center;padding:30px"><h3>No products found</h3><button class="hbtn" onclick="clearFilters()">Clear filters</button></div>`;
const lm=$("load-more");if(lm)lm.style.display=list.length>shown.length?"":"none";
$("deals-row").innerHTML=P.filter(p=>disc(p)>=20).map(p=>`<div class="deal-card" onclick="quickView('${p.id}')"><img src="${p.img}"><br><span class="off">-${disc(p)}%</span> <b>Deal</b><div class="price">${money(p.price)}</div><small>${p.name.slice(0,32)}...</small></div>`).join("")||"<p>No deals yet</p>";
function renderCart(){const P=getProducts(),c=getCart();const box=$("cart-items");if(!c.length){box.innerHTML="<p style='text-align:center;padding:30px;color:#888'>Your cart is empty 🛒</p>"}else{box.innerHTML=c.map(i=>{const p=P.find(x=>x.id===i.id);if(!p)return"";return `<div class="c-item"><img src="${p.img}"><div class="inf"><b>${p.name.slice(0,45)}</b><span class="price">${money(p.price)}</span><div class="mini-qty"><button onclick="chQty('${p.id}',-1)">-</button><span>${i.qty}</span><button onclick="chQty('${p.id}',1)">+</button><button class="rm" onclick="rmItem('${p.id}')">Remove</button></div></div></div>`}).join("")}
const sub=c.reduce((s,i)=>{const p=P.find(x=>x.id===i.id);return s+(p?p.price*i.qty:0)},0);
const ship=sub===0?0:(sub>=FREE_SHIP?0:SHIP_FEE);
$("cart-total").textContent=money(sub);$("ship-cost").textContent=sub===0?"-":ship===0?"FREE":money(ship);
$("ship-fill").style.width=Math.min(100,sub/FREE_SHIP*100)+"%";
$("ship-msg").innerHTML=sub>=FREE_SHIP?"🎉 You got <b>FREE delivery!</b>":`Add <b>${money(FREE_SHIP-sub)}</b> more for FREE delivery`;}
function chQty(id,d){let c=getCart();const P=getProducts();const p=P.find(x=>x.id===id);const f=c.find(x=>x.id===id);if(!f)return;f.qty+=d;if(f.qty<=0)c=c.filter(x=>x.id!==id);if(p&&f&&f.qty>p.stock){f.qty=p.stock;toast("Only "+p.stock+" in stock")}saveCart(c);updateBadges();renderCart()}
function rmItem(id){saveCart(getCart().filter(x=>x.id!==id));updateBadges();renderCart()}
function openM(id){$(id).classList.add("show");$("overlay").classList.add("show")}
function closeAll(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show"));const dr=$("cart-drawer");if(dr)dr.classList.remove("open");$("side-menu").classList.remove("open");$("overlay").classList.remove("show")}
function quickView(id){const p=getProducts().find(x=>x.id===id);if(!p)return;const d=disc(p);
$("p-detail").innerHTML=`<div class="p-box-grid"><img src="${p.img}" onerror="this.src='https://via.placeholder.com/500'"><div><h2>${p.name}</h2><div class="stars">${stars(p.rating)} <small>${p.rating} | ${p.reviews} ratings</small></div><hr style="margin:10px 0"><div class="price-row"><span class="price" style="font-size:28px">${money(p.price)}</span>${p.old>p.price?`<span class="old">${money(p.old)}</span><span class="off">-${d}%</span>`:""}</div><p style="margin:10px 0;color:#333">${p.desc||""}</p><p><b>Category:</b> ${p.cat} | <b>Stock:</b> ${p.stock>0?p.stock+" available":"Out of stock"}</p><div class="qty"><button onclick="qvQty(-1)">-</button><span id="qv-n">1</span><button onclick="qvQty(1)">+</button></div><button class="btn-primary" onclick="addToCart('${p.id}',parseInt(document.getElementById('qv-n').textContent))">Add to Cart</button><button class="btn-ghost" onclick="addToCart('${p.id}',parseInt(document.getElementById('qv-n').textContent));closeAll();openCheckout()">Buy Now</button></div></div>`;
openM("product-modal")}
function qvQty(d){const e=$("qv-n");e.textContent=Math.max(1,Math.min(10,parseInt(e.textContent)+d))}
let couponOff=0;
function cartSub(){const P=getProducts(),c=getCart();return c.reduce((s,i)=>{const p=P.find(x=>x.id===i.id);return s+(p?p.price*i.qty:0)},0)}
function currentBill(){const sub=cartSub();const code=($("coupon")?$("coupon").value:"").trim().toUpperCase();couponOff=code==="MEKO10"?sub*0.10:code==="SAVE20"?sub*0.20:0;return billTotals(sub,couponOff)}
function openCheckout(){const c=getCart();if(!c.length)return toast("Cart is empty");const P=getProducts();
$("co-items").innerHTML=c.map(i=>{const p=P.find(x=>x.id===i.id);return `<div class="row"><span>${p.name.slice(0,28)}.. x ${i.qty}</span><b>${money(p.price*i.qty)}</b></div>`}).join("");
refreshTotals();openM("checkout-modal")}
function refreshTotals(){const b=currentBill();
$("co-sub").textContent=money(b.sub);$("co-ship").textContent=b.ship===0?"FREE":money(b.ship);
$("co-total").textContent=money(b.total);
const taxEl=$("co-tax");if(taxEl)taxEl.textContent=money(b.tax);
const disEl=$("co-dis");if(disEl)disEl.textContent="−"+money(b.discount);}
function validCard(n){n=n.replace(/\s/g,"");if(!/^\d{13,19}$/.test(n))return false;let s=0,d=false;for(let i=n.length-1;i>=0;i--){let x=+n[i];if(d){x*=2;if(x>9)x-=9}s+=x;d=!d}return s%10===0}
function placeOrder(){const name=$("co-name").value.trim(),phone=$("co-phone").value.trim(),city=$("co-city").value.trim(),addr=$("co-address").value.trim();
if(name.length<3)return toast("Enter full name");if(phone.length<7)return toast("Enter valid phone");if(!city)return toast("Enter city");if(addr.length<5)return toast("Enter address");
const pay=document.querySelector('input[name=pay]:checked').value;
if(pay==="card"){if(!validCard($("cc-num").value))return toast("Invalid card number");if(!/^\d{2}\/\d{2}$/.test($("cc-exp").value))return toast("Expiry MM/YY");if(!/^\d{3,4}$/.test($("cc-cvc").value))return toast("Invalid CVC");if($("cc-name").value.length<3)return toast("Name on card required")}
const b=currentBill();
const P=getProducts(),c=getCart();
const me=(typeof currentUser==="function"&&currentUser())||{};
const order={id:"MK-"+Date.now().toString().slice(-8),date:new Date().toLocaleString(),name,phone,city,addr,pay,email:me.email||"",uid:me.uid||me.email||"guest",items:c.map(i=>{const p=P.find(x=>x.id===i.id);return{name:p.name,price:p.price,qty:i.qty,img:p.img}}),sub:b.sub,discount:b.discount,tax:b.tax,taxRate:b.taxRate,ship:b.ship,total:b.total,status:"Pending",paid:pay!=="cod"};
c.forEach(i=>{const p=P.find(x=>x.id===i.id);if(p)p.stock=Math.max(0,p.stock-i.qty)});saveProducts(P);
const o=getOrders();o.unshift(order);saveOrders(o);
const db=(typeof fbDb==="function"&&fbDb());if(db){try{db.ref("orders/"+order.id).set(order)}catch(e){}}
saveCart([]);updateBadges();renderCart();closeAll();
$("success-txt").innerHTML=`Order <b>${order.id}</b> • ${money(order.total)} • ${pay==="cod"?"Pay on delivery":pay.toUpperCase()} • Arriving in 2-4 days to ${city}<br><small>A confirmation email was sent${realPayLinks()? " • real pay links below":""}</small><div id="pay-links" style="margin-top:10px"></div><br><button class="btn-ghost" style="width:auto;padding:8px 18px" onclick="printInvoice('${order.id}')">🧾 Print invoice</button>`;
openM("success-modal");
// real confirmation email (EmailJS if configured) + real pay links
try{const t=tplOrder(order);const to=order.email||((me&&me.email)||"");if(to)sendMail(to,t.subject,t.message,{name:order.name,orderId:order.id,total:money(order.total)}).then(r=>{if(!r.ok&&r.via==="mailto")toast("Email not configured — see Admin>Settings")})}catch(e){}
try{const pl=document.getElementById("pay-links");const links=realPayLinks(order.total);if(pl&&links.length)pl.innerHTML=links.map(l=>`<a href="${l.url}" target="_blank" class="btn-primary" style="display:block;text-decoration:none;text-align:center;margin:6px 0">${l.name} • ${money(order.total)}</a>`).join("")}catch(e){}
}
function showList(kind){const P=getProducts();
if(kind==="wish"){const w=getWish();$("list-title").textContent="My Wishlist";$("list-body").innerHTML=w.length?w.map(id=>{const p=P.find(x=>x.id===id);if(!p)return"";return `<div class="c-item"><img src="${p.img}"><div class="inf"><b>${p.name}</b><span class="price">${money(p.price)}</span><br><button class="btn-primary" style="width:auto;padding:8px 18px" onclick="addToCart('${p.id}')">Add to Cart</button></div></div>`}).join(""):"Wishlist empty"}
else{const o=getOrders();$("list-title").textContent="My Orders";$("list-body").innerHTML=o.length?o.map(x=>`<div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:8px 0"><b>${x.id}</b> <span style="background:#fef3c7;padding:2px 10px;border-radius:12px;font-size:12px">${x.status}</span><br><small>${x.date} • ${money(x.total)} • ${x.pay.toUpperCase()}</small><br><small>${x.items.map(i=>i.name.slice(0,30)).join(", ")}</small></div>`).join(""):"No orders yet"}
openM("list-modal")}
let heroI=0;function heroGo(n){const s=document.querySelectorAll(".slide");heroI=(n+s.length)%s.length;s.forEach((x,i)=>x.classList.toggle("active",i===heroI));const d=$("hero-dots");if(d)d.innerHTML=[...s].map((_,i)=>`<span class="${i===heroI?"on":""}" onclick="heroGo(${i})"></span>`).join("")}
function tick(){let h=+$("dh").textContent,m=+$("dm").textContent,s=+$("ds").textContent;if(--s<0){s=59;if(--m<0){m=59;if(--h<0)h=5}}$("dh").textContent=String(h).padStart(2,"0");$("dm").textContent=String(m).padStart(2,"0");$("ds").textContent=String(s).padStart(2,"0");const t=`${$("dh").textContent}:${$("dm").textContent}:${$("ds").textContent}`;if($("top-count"))$("top-count").textContent="ends in "+t}
document.addEventListener("click",e=>{if(e.target.hasAttribute("data-close"))closeAll()});
window.addEventListener("DOMContentLoaded",()=>{
try{const q=new URLSearchParams(location.search).get("q");if(q){state.q=q.slice(0,80);const si=$("search-input");if(si)si.value=q}}catch(e){}
renderAll();renderCart();try{pullCatalog()}catch(e){}heroGo(0);setInterval(()=>heroGo(heroI+1),5000);setInterval(tick,1000);
$("cart-btn").onclick=()=>{$("cart-drawer").classList.add("open");$("overlay").classList.add("show")};
$("menu-btn").onclick=()=>{$("side-menu").classList.add("open");$("overlay").classList.add("show")};
$("side-close").onclick=closeAll;$("overlay").onclick=closeAll;
$("checkout-btn").onclick=()=>{closeAll();openCheckout()};
$("place-order").onclick=placeOrder;const _cp=$("coupon");if(_cp)_cp.oninput=refreshTotals;
$("wishlist-btn").onclick=()=>showList("wish");$("orders-btn").onclick=()=>showOrdersWithInvoices();
const _tb=$("track-btn");if(_tb)_tb.onclick=()=>{closeAll();showOrdersWithInvoices()};
$("filter-cat").onchange=e=>{state.cat=e.target.value;state.page=1;renderAll()};
$("filter-sort").onchange=e=>{state.sort=e.target.value;state.page=1;renderAll()};
const _fbr=$("filter-brand");if(_fbr)_fbr.onchange=e=>{state.brand=e.target.value;state.page=1;renderAll()};
const _fst=$("filter-stock");if(_fst)_fst.onchange=e=>{state.stock=e.target.checked;state.page=1;renderAll()};
const _frt=$("filter-rating");if(_frt)_frt.onchange=e=>{state.minR=+e.target.value;state.page=1;renderAll()};
const _fc=$("filter-clear");if(_fc)_fc.onclick=()=>clearFilters();
const _lm=$("load-more");if(_lm)_lm.onclick=()=>{state.page++;renderAll()};
const _pg=$("price-go");if(_pg)_pg.onclick=()=>{state.min=+$("min-p").value||0;state.max=+$("max-p").value||0;renderAll()};
$("hero-prev").onclick=()=>heroGo(heroI-1);$("hero-next").onclick=()=>heroGo(heroI+1);
$("search-btn").onclick=()=>{state.q=$("search-input").value.toLowerCase().trim().slice(0,80);state.cat=$("search-cat").value;state.page=1;try{history.replaceState(null,"","index.html?q="+encodeURIComponent(state.q))}catch(e){}renderAll();scrollToProducts()};
$("search-input").addEventListener("input",e=>{const q=e.target.value.toLowerCase().slice(0,80);const box=$("search-suggest");if(!box)return;if(q.length<2){box.style.display="none";return};
const m=getProducts().filter(p=>(p.status||"active")==="active"&&p.name.toLowerCase().includes(q)).slice(0,6);
box.innerHTML=m.map(p=>`<div onclick="document.getElementById('search-input').value='${p.name.replace(/'/g,"")}';document.getElementById('search-btn').click()">${p.name.slice(0,50)}</div>`).join("")||"<div>No matches</div>";box.style.display="block"});
const _cn=$("cc-num");if(_cn)_cn.addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,16).replace(/(\d{4})(?=\d)/g,"$1 ")});
const _ce=$("cc-exp");if(_ce)_ce.addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,4);if(v.length>2)v=v.slice(0,2)+"/"+v.slice(2);e.target.value=v});
});
function filterCat(c){state.cat=c;state.brand="";state.q="";state.page=1;const s=$("search-input");if(s)s.value="";renderAll();document.getElementById("products").scrollIntoView({behavior:"smooth"})}
function filterBrand(b){state.brand=b;state.page=1;renderAll();document.getElementById("products").scrollIntoView({behavior:"smooth"})}
function clearFilters(){state={cat:"",brand:"",q:"",sort:"pop",min:0,max:0,stock:false,minR:0,page:1};const s=$("search-input");if(s)s.value="";renderAll()}
async function pullCatalog(){try{
const cloud=await fsQuery("products",[],100);if(cloud.length){const local=getProducts();const merged=[...cloud.map(c=>({id:c.id,...c})),...local.filter(l=>!cloud.find(c=>c.id===l.id))];localStorage.setItem("meko_products",JSON.stringify(merged));renderAll()}
await syncCats();await loadSettingsCloud();renderAll();
}catch(e){}}
function scrollToProducts(){document.getElementById("products").scrollIntoView({behavior:"smooth"})}
function toggleWish(id){let w=getWish();w=w.includes(id)?w.filter(x=>x!==id):[...w,id];saveWish(w);renderAll();toast(w.includes(id)?"Added to wishlist ♥":"Removed from wishlist")}
function addToCart(id,qty=1){const P=getProducts();const p=P.find(x=>x.id===id);if(!p)return;if(p.stock<=0)return toast("Out of stock");let c=getCart();const f=c.find(x=>x.id===id);if(f)f.qty=Math.min(f.qty+qty,p.stock);else c.push({id,qty});saveCart(c);updateBadges();renderCart();toast("Added to cart 🛒")}
function updateBadges(){const c=getCart();$("cart-count").textContent=c.reduce((s,x)=>s+x.qty,0);$("d-count").textContent=c.reduce((s,x)=>s+x.qty,0);$("wish-count").textContent=getWish().length}
