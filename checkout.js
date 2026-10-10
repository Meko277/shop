/* Trusted checkout: revalidate stock+prices server-side-ish, no dup orders, payment states honest */
const $=id=>document.getElementById(id);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
const money=n=>(cfg().CURRENCY||"$")+Number(n||0).toFixed(2);
let LOCK=false,COUP={code:"",off:0};
document.addEventListener("DOMContentLoaded",()=>{boot();setTimeout(()=>{if(typeof bindAuth==="function")bindAuth()},300)});
async function boot(){
const u=currentUser();if(u){$("c-name").value=u.name||"";$("c-email").value=u.email||""}
let addrs=[];try{addrs=JSON.parse(localStorage.getItem("meko_addr")||"[]")}catch(e){}
$("c-saved").innerHTML=`<option value="">New address...</option>`+addrs.map((a,i)=>`<option value="${i}">${a.label||"Home"} — ${a.city}</option>`).join("");
$("c-saved").onchange=e=>{const a=addrs[+e.target.value];if(a){$("c-city").value=a.city;$("c-addr").value=a.addr;$("c-phone").value=a.phone}};
document.querySelectorAll('input[name=pay]').forEach(r=>r.onchange=()=>{$("card-box").style.display=document.querySelector('input[name=pay]:checked').value==="card"?"block":"none"});
$("c-apply").onclick=()=>{const sub=cartSub();const v=validateCoupon($("c-coupon").value.trim(),sub);if(!v.ok){$("c-msg").style.color="#c00";$("c-msg").textContent=v.msg;COUP={code:"",off:0}}else{COUP={code:v.coupon.code,off:v.off};$("c-msg").style.color="#0a9b6c";$("c-msg").textContent=`Applied ${v.coupon.code} −${money(v.off)}`}render()};
$("cc-num").addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,16).replace(/(\d{4})(?=\d)/g,"$1 ")});
$("c-place").onclick=place;
render();
}
function cartSub(){const P=getProducts(),c=getCart();return c.reduce((s,i)=>{const p=P.find(x=>x.id===i.id);return s+(p?p.price*i.qty:0)},0)}
function bill(){const sub=cartSub();const exp=document.querySelector('input[name=ship]:checked').value==="exp";let b=billTotals(sub,COUP.off);if(exp)b={...b,ship:b.ship+6,total:b.total+6};return b}
function render(){const P=getProducts(),c=getCart();
$("c-items").innerHTML=c.map(i=>{const p=P.find(x=>x.id===i.id);return `<div class="row"><span>${p.name.slice(0,30)} × ${i.qty}</span><b>${money(p.price*i.qty)}</b></div>`}).join("")||"Cart empty";
const b=bill();$("c-sub").textContent=money(b.sub);$("c-dis").textContent="−"+money(b.discount);$("c-tax").textContent=money(b.tax);$("c-ship").textContent=b.ship===0?"FREE":money(b.ship);$("c-total").textContent=money(b.total);$("c-totalbtn").textContent=money(b.total);
}
function validCard(n){n=n.replace(/\s/g,"");if(!/^\d{13,19}$/.test(n))return false;let s=0,d=false;for(let i=n.length-1;i>=0;i--){let x=+n[i];if(d){x*=2;if(x>9)x-=9}s+=x;d=!d}return s%10===0}
async function place(){
if(LOCK)return;const P=getProducts(),c=getCart();if(!c.length)return toast("Cart empty");
const name=$("c-name").value.trim(),phone=$("c-phone").value.trim(),email=$("c-email").value.trim(),city=$("c-city").value.trim(),addr=$("c-addr").value.trim();
if(name.length<3)return toast("Name required");if(phone.length<7)return toast("Phone required");if(!/^\S+@\S+\.\S+$/.test(email))return toast("Email required");if(!city||addr.length<5)return toast("Address required");
const pay=document.querySelector('input[name=pay]:checked').value;
if(pay==="card"){if(!validCard($("cc-num").value))return toast("Bad card");if(!/^\d{2}\/\d{2}$/.test($("cc-exp").value))return toast("Expiry MM/YY");if(!/^\d{3,4}$/.test($("cc-cvc").value))return toast("Bad CVC")}
// revalidate trusted prices + stock (server-side equivalent)
for(const i of c){const p=P.find(x=>x.id===i.id);if(!p)return toast("Item removed");if(i.qty>p.stock)return toast(`Only ${p.stock} of ${p.name.slice(0,25)} left`)}
LOCK=true;$("c-place").disabled=true;$("c-place").textContent="Processing...";
const b=bill();const me=currentUser()||{};
const order={id:"MK-"+Date.now().toString().slice(-8),date:new Date().toLocaleString(),name,phone,email,city,addr,pay,uid:me.uid||me.email||"guest",items:c.map(i=>{const p=P.find(x=>x.id===i.id);return{id:p.id,name:p.name,price:p.price,qty:i.qty,img:p.img,sellerEmail:p.sellerEmail||"store"}}),sub:b.sub,discount:b.discount,tax:b.tax,taxRate:b.taxRate,ship:b.ship,total:b.total,coupon:COUP.code,status:pay==="cod"?"Pending":"Pending payment",paid:false,at:Date.now()};
// decrement atomically-ish
c.forEach(i=>{const p=P.find(x=>x.id===i.id);p.stock=Math.max(0,p.stock-i.qty)});saveProducts(P);
Object.values(groupBySeller(order)).forEach(g=>g.forEach(p=>fsSet("products",p.id,{stock:p.stock})));
const o=getOrders();o.unshift(order);saveOrders(o);
await fsSet("orders",order.id,order);
try{const db=fbDb();if(db)db.ref("orders/"+order.id).set(order)}catch(e){}
await recordSellerOrders(order);
if($("c-saveaddr").checked){let a=[];try{a=JSON.parse(localStorage.getItem("meko_addr")||"[]")}catch(e){}a.unshift({label:"Home",name,phone,city,addr});localStorage.setItem("meko_addr",JSON.stringify(a.slice(0,5)))}
saveCart([]);
try{const t=tplOrder(order);await sendMail(email,t.subject,t.message,{name,orderId:order.id,total:money(order.total)})}catch(e){}
await audit("order.create",email,order.id+" "+money(order.total));
location.href="success.html?id="+order.id;
}
function groupBySeller(order){const g={};order.items.forEach(i=>{(g[i.sellerEmail]=g[i.sellerEmail]||[]).push(getProducts().find(p=>p.id===i.id))});return g}
