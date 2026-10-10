/* Auth v2 roles */
function updateAuthUI(){const a=document.getElementById("auth-area");if(!a)return;const u=currentUser();
if(u){const admin=(typeof userRole==="function"?userRole():"customer")==="admin";
a.innerHTML=`<span class="userchip"><span class="avatar">${(u.name||u.email||"U")[0].toUpperCase()}</span><b>${(u.name||"").split(" ")[0].slice(0,10)}</b>${admin?`<a class="hbtn primary" href="admin.html">Admin</a>`:`<button class="hbtn" id="req-admin">Seller?</button>`}<button class="hbtn" id="logout-btn">Out</button></span>`;
document.getElementById("logout-btn").onclick=()=>{const A=fbAuth();if(A){try{A.signOut()}catch(e){}}setUser(null);toast("Logged out")};
const ra=document.getElementById("req-admin");if(ra)ra.onclick=()=>requestAdminAccess();
}
else a.innerHTML=`<button class="hbtn" id="login-open"><i class="fa fa-user"></i><span>Login</span></button>`;
const lo=document.getElementById("login-open");if(lo)lo.onclick=()=>openM("auth-modal");
const sl=document.getElementById("side-login");if(sl)sl.onclick=e=>{e.preventDefault();closeAll();openM("auth-modal")}}
function updateBell(){const n=unreadCount();const b=document.getElementById("bell-count");if(!b)return;if(n>0){b.style.display="flex";b.textContent=n}else b.style.display="none"}
function bindAuth(){
const err=m=>{const e=$("auth-err");if(e)e.textContent=m};
const loginBtn=$("do-login");if(loginBtn)loginBtn.onclick=async()=>{
const em=$("a-email").value.trim(),pw=$("a-pass").value;
if(!em||pw.length<6)return err("Enter email + 6-char password");
const A=fbAuth();
try{
if(A){const c=await A.signInWithEmailAndPassword(em,pw);await afterLogin({uid:c.user.uid,name:c.user.displayName||em.split("@")[0],email:c.user.email});subscribeEmail(em);closeAll();toast(isAdmin()?"Welcome Admin":"Welcome back!")}
else{const users=JSON.parse(localStorage.getItem("meko_users")||"[]");const f=users.find(x=>x.email===em&&x.pass===pw);if(!f)return err("No account — register");await afterLogin({uid:f.uid||f.email,name:f.name,email:em});subscribeEmail(em);closeAll();toast("Welcome back!")}
}catch(e){err(e.message||String(e))}};
const regBtn=$("do-reg");if(regBtn)regBtn.onclick=async()=>{
const nm=$("a-name").value.trim()||"Customer",em=$("a-email").value.trim(),pw=$("a-pass").value;
if(!/^\S+@\S+\.\S+$/.test(em))return err("Invalid email");if(pw.length<6)return err("Password 6+ chars");
const A=fbAuth();
try{
if(A){const c=await A.createUserWithEmailAndPassword(em,pw);try{await c.user.updateProfile({displayName:nm})}catch(e){}try{await c.user.sendEmailVerification()}catch(e){}
const u=await afterLogin({uid:c.user.uid,name:nm,email:em});subscribeEmail(em);
try{fbDb().ref("users/"+c.user.uid).set({name:nm,email:em,role:u.role,at:Date.now()})}catch(e){}
try{const t=tplWelcome(u);sendMail(em,t.subject,t.message,{name:nm})}catch(e){}
closeAll();toast("Registered as CUSTOMER")}
else{let users=[];try{users=JSON.parse(localStorage.getItem("meko_users")||"[]")}catch(e){}if(users.find(x=>x.email===em))return err("Email exists — login");const nu={uid:"u"+Date.now(),name:nm,email:em,pass:pw,role:roleOf(em)};users.push(nu);localStorage.setItem("meko_users",JSON.stringify(users));await afterLogin({uid:nu.uid,name:nm,email:em});subscribeEmail(em);closeAll();toast("Registered as "+userRole())}
}catch(e){err(e.message||String(e))}};
const gg=$("do-google");if(gg)gg.onclick=()=>{const A2=fbAuth();if(!A2)return err("Enable Google sign-in in Firebase console");const P=new firebase.auth.GoogleAuthProvider();A2.signInWithPopup(P).then(async c=>{await afterLogin({uid:c.user.uid,name:c.user.displayName||"Customer",email:c.user.email});subscribeEmail(c.user.email);closeAll();toast("Welcome!")}).catch(e=>err(e.message))};
const oj=document.getElementById("offer-join");if(oj)oj.onclick=()=>{const e=document.getElementById("offer-email").value;if(subscribeEmail(e)){toast("Subscribed! Watch your inbox 🎁");document.getElementById("offer-email").value=""}else toast("Enter valid email")};
const nb=document.getElementById("notif-btn");if(nb)nb.onclick=()=>{const n=getNotes();localStorage.setItem("meko_read",n.length);updateBell();document.getElementById("list-title").textContent="🎁 Offers & Mail";document.getElementById("list-body").innerHTML=n.length?n.map(x=>`<div class="note"><b>${x.title}</b><br><small>${x.date||""}</small><p style="margin-top:6px">${x.body}</p>${x.coupon?`<b style="color:#6c2bff">Coupon: ${x.coupon}</b>`:""}</div>`).join(""):"No offers yet — join the email list!";openM("list-modal")};
const sell=document.getElementById("sell-link");if(sell)sell.onclick=e=>{e.preventDefault();const u=(typeof currentUser==="function"&&currentUser());if(!u){openM("auth-modal");toast("Register first — then request admin")}else requestAdminAccess()};
function refreshRoleLinks(){try{const admin=(typeof isAdmin==="function"&&isAdmin());const al=document.getElementById("admin-link");if(al)al.style.display=admin?"":"none";const sl2=document.getElementById("sell-link");if(sl2)sl2.style.display=admin?"none":""}catch(e){}}
const _uau=updateAuthUI;updateAuthUI=function(){_uau();refreshRoleLinks()};
const A=fbAuth();if(A){try{A.onAuthStateChanged(async u=>{if(u){await afterLogin({uid:u.uid,name:u.displayName||u.email.split("@")[0],email:u.email})}})}catch(e){}}
updateAuthUI();updateBell();syncFromCloud();
}
function showOrdersWithInvoices(){const o=getOrders();$("list-title").textContent="My Orders";$("list-body").innerHTML=o.length?o.map(x=>`<div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:8px 0"><b>${x.id}</b> <span style="background:#fef3c7;padding:2px 10px;border-radius:12px;font-size:12px">${x.status}</span><br><small>${x.date} • ${money(x.total)} • ${String(x.pay).toUpperCase()}</small><br><button class="btn-ghost" style="width:auto;padding:6px 14px;margin-top:6px" onclick="printInvoice('${x.id}')">Invoice</button></div>`).join(""):"No orders yet";openM("list-modal")}
document.addEventListener("DOMContentLoaded",()=>setTimeout(bindAuth,300));
