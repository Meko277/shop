/* Customer account hub */
const $=id=>document.getElementById(id);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
const money=n=>(cfg().CURRENCY||"$")+Number(n||0).toFixed(2);
const FLOW=["Pending","Pending payment","Paid","Processing","Shipped","Delivered"];
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("on"));b.classList.add("on");["orders","addr","wish","profile","support"].forEach(t=>$("a-"+t).style.display=t===b.dataset.t?"block":"none")});
$("logout").onclick=()=>{const A=fbAuth();if(A)try{A.signOut()}catch(e){}localStorage.removeItem("meko_user");location.href="index.html"};
$("sup-mail").textContent=cfg().SUPPORT_EMAIL||"";
const u=currentUser();if(!u){location.href="index.html";return}
$("hello").textContent="Hello, "+(u.name||u.email);if(isAdmin())$("adm").style.display="";
$("pf-name").value=u.name||"";
$("ad-save").onclick=saveAddr;$("pf-save").onclick=savePf;$("pf-reset").onclick=resetPw;$("pf-del").onclick=delData;$("ret-btn").onclick=()=>requestReturn($("ret-order").value.trim(),$("ret-reason").value.trim());
renderOrders();renderAddr();renderWish();
});
function tl(status){const order=["Pending","Pending payment","Paid","Processing","Shipped","Delivered"];let idx=order.indexOf(status);if(idx<0)idx=0;const steps=["Pending","Paid","Shipped","Delivered"];return `<div class="tl">${steps.map((s,i)=>`<div class="${i<=Math.min(3,Math.floor(idx/1.5))?"on":""}">${s}</div>`).join("")}</div>`}
function renderOrders(){const u=currentUser();const o=getOrders().filter(x=>x.email===u.email||x.uid===(u.uid||u.email));
$("a-orders").innerHTML=o.length?o.map(x=>`<div class="ord"><b>${x.id}</b> ${x.paid?'<span style="background:#dcfce7;padding:2px 8px;border-radius:10px">PAID</span>':""} <b>${x.status}</b> • ${money(x.total)}<br><small>${x.date} • ${x.items.map(i=>i.qty+"x "+i.name.slice(0,28)).join(", ")}</small>${tl(x.status)}<button class="hbtn" onclick="printInvoice('${x.id}')">Invoice</button> <button class="hbtn" onclick="cancelOrder('${x.id}')">Cancel</button></div>`).join(""):"No orders yet — <a href='index.html'>shop now</a>"}
function cancelOrder(id){const o=getOrders().find(x=>x.id===id);if(!o)return;if(["Shipped","Delivered"].includes(o.status))return toast("Too late to cancel");o.status="Cancelled";saveOrders(getOrders().map(x=>x.id===id?o:x));fsSet("orders",id,{status:"Cancelled"});renderOrders();toast("Cancelled")}
function renderAddr(){let a=[];try{a=JSON.parse(localStorage.getItem("meko_addr")||"[]")}catch(e){}$("addr-list").innerHTML=a.length?a.map((x,i)=>`<div class="ord"><b>${x.label||"Address"}</b> ${x.name} ${x.phone}<br>${x.addr}, ${x.city} <button class="hbtn" onclick="delAddr(${i})">Remove</button></div>`).join(""):"No saved addresses"}
function saveAddr(){let a=[];try{a=JSON.parse(localStorage.getItem("meko_addr")||"[]")}catch(e){}a.unshift({label:$("ad-label").value||"Home",name:$("ad-name").value,phone:$("ad-phone").value,city:$("ad-city").value,addr:$("ad-addr").value});localStorage.setItem("meko_addr",JSON.stringify(a.slice(0,5)));const u=currentUser();fsSet("addresses",u.uid||u.email,{list:a.slice(0,5)});renderAddr();toast("Saved")}
function delAddr(i){let a=[];try{a=JSON.parse(localStorage.getItem("meko_addr")||"[]")}catch(e){}a.splice(i,1);localStorage.setItem("meko_addr",JSON.stringify(a));renderAddr()}
function renderWish(){const P=getProducts(),w=getWish();$("wish-list").innerHTML=w.length?w.map(id=>{const p=P.find(x=>x.id===id);return p?`<div class="ord"><img src="${p.img}" style="width:50px;height:50px;object-fit:cover;border-radius:8px"> <b>${p.name.slice(0,40)}</b> ${money(p.price)} <button class="hbtn" onclick="location.href='product.html?id=${p.id}'">View</button></div>`:""}).join(""):"Wishlist empty"}
function savePf(){const u=currentUser();u.name=$("pf-name").value;u.phone=$("pf-phone").value;setUser(u);$("pf-msg").textContent="Saved";fsSet("users",u.uid||u.email,{name:u.name,phone:u.phone})}
function resetPw(){const u=currentUser();const A=fbAuth();if(A&&u.email){A.sendPasswordResetEmail(u.email).then(()=>$("pf-msg").textContent="Reset email sent").catch(e=>$("pf-msg").textContent=e.message)}else $("pf-msg").textContent="Login with Firebase to reset"}
function delData(){if(!confirm("Remove local account data?"))return;["meko_user","meko_cart","meko_wish","meko_addr"].forEach(k=>localStorage.removeItem(k));location.href="index.html"}
