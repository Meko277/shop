/* i18n EN/AR + RTL + currency */
const I18N={en:{search:"Search phones, fashion, home...",bag:"Bag",orders:"Orders",login:"Login",deals:"Flash Deals",rec:"Recommended",checkout:"Checkout",track:"Track order",join:"Join",offers:"Exclusive offers by email"},ar:{search:"ابحث عن هواتف، أزياء، منزل...",bag:"السلة",orders:"الطلبات",login:"دخول",deals:"عروض فلاش",rec:"مقترح لك",checkout:"الدفع",track:"تتبع الطلب",join:"اشترك",offers:"عروض حصرية بالبريد"}};
function lang(){return localStorage.getItem("meko_lang")||"en"}
function setLang(l){localStorage.setItem("meko_lang",l);applyLang()}
function applyLang(){const l=lang(),d=I18N[l];document.getElementById("html-root").dir=l==="ar"?"rtl":"ltr";document.getElementById("html-root").lang=l;
const m={ "search-input":d.search };Object.entries(m).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.placeholder=v});
const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
const cb=document.querySelector("#cart-btn span");if(cb&&l==="ar")cb.textContent=d.bag;
const lb=document.getElementById("login-open");if(lb)lb.querySelector("span").textContent=d.login;
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(applyLang,400));
