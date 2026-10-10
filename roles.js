/* Roles: customer + admin. Register = customer. Admin approval via email → role=admin → Admin button appears. Owner emails auto-admin. */
function userRole(){const u=currentUser();return (u&&u.role)||"customer"}
function isAdmin(){return userRole()==="admin"}
function roleOf(email){const e=(email||"").toLowerCase();const owners=(cfg().OWNER_EMAILS||[]).map(x=>x.toLowerCase());return owners.includes(e)?"admin":"customer"}
function uid(){const u=currentUser();return u&&(u.uid||u.email)||"guest"}
function syncRole(uidOrEmail,role){ // admin action: approve/revoke
  const db=fbDb();if(db){try{db.ref("roles/"+btoa(uidOrEmail)).set({role,at:Date.now()})}catch(e){}}
  let users=[];try{users=JSON.parse(localStorage.getItem("meko_users")||"[]")}catch(e){}
  const f=users.find(x=>x.uid===uidOrEmail||x.email===uidOrEmail);if(f){f.role=role;localStorage.setItem("meko_users",JSON.stringify(users))}
  const me=currentUser();if(me&&(me.uid===uidOrEmail||me.email===uidOrEmail)){me.role=role;setUser(me)}
}
function fetchRole(uidOrEmail){return new Promise(res=>{const db=fbDb();if(!db)return res(null);try{db.ref("roles/"+btoa(uidOrEmail)).once("value").then(s=>res(s.val()?s.val().role:null)).catch(()=>res(null))}catch(e){res(null)}})}
async function afterLogin(user){ // attach role
  let role=roleOf(user.email);
  let users=[];try{users=JSON.parse(localStorage.getItem("meko_users")||"[]")}catch(e){}
  const local=users.find(x=>x.email===user.email);if(local&&local.role)role=local.role;
  const cloud=await fetchRole(user.uid||user.email);if(cloud)role=cloud;
  user.role=role;setUser(user);return user;
}
async function requestAdminAccess(){const u=currentUser();if(!u)return toast("Login first");if(isAdmin())return toast("Already admin");
  const db=fbDb();const req={uid:u.uid||u.email,name:u.name,email:u.email,at:new Date().toLocaleString(),status:"pending"};
  let all=[];try{all=JSON.parse(localStorage.getItem("meko_admin_req")||"[]")}catch(e){}
  if(!all.find(x=>x.email===u.email)){all.unshift(req);localStorage.setItem("meko_admin_req",JSON.stringify(all))}
  if(db){try{db.ref("admin_requests/"+btoa(u.email)).set(req)}catch(e){}}
  // real email to YOU (owner) so you confirm him
  const t=tplAdminRequest(u);
  const owner=(cfg().OWNER_EMAILS||[])[0]||"";
  if(owner&&owner!=="you@example.com"){const r=await sendMail(owner,t.subject,t.message,{name:u.name});toast(r.ok?"Request sent to owner ✉️":"Request saved — configure email to notify owner")}
  else{mailtoOwner(t.subject,t.message);toast("Opening your mail app — send the request to yourself as owner")}
}
