/* MekoShop Firestore DB layer — real persistence.
   Collections: users, sellers, products, categories, carts, orders, sellerOrders, reviews, wishlists, addresses, coupons, promotions, notifications, returns, commissions, payouts, settings, auditLogs
   Works with fallback: if Firestore unavailable, uses localStorage so site never breaks. */
let _fs=null,_fsMode="local";
function fsDb(){try{if(typeof firebase!=="undefined"&&firebase.firestore){if(!_fs)_fs=firebase.firestore();return _fs}}catch(e){}return null}
function fsReady(){return !!fsDb()}
/* ---------- generic helpers ---------- */
async function fsGet(col,id){const db=fsDb();if(!db)return null;try{const d=await db.collection(col).doc(id).get();return d.exists?{id:d.id,...d.data()}:null}catch(e){return null}}
async function fsSet(col,id,data){const db=fsDb();if(!db)return false;try{await db.collection(col).doc(id).set({...data,updatedAt:Date.now()},{merge:true});return true}catch(e){return false}}
async function fsAdd(col,data){const db=fsDb();if(!db)return null;try{const r=await db.collection(col).add({...data,createdAt:Date.now()});return r.id}catch(e){return null}}
async function fsQuery(col,filters,limitN){const db=fsDb();if(!db)return[];
try{let q=db.collection(col);(filters||[]).forEach(f=>{q=q.where(f[0],f[1],f[2])});if(limitN)q=q.limit(limitN);const s=await q.get();return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){return[]}}
async function audit(action,by,detail){const db=fsDb();const row={action,by:by||(currentUser()||{}).email||"system",detail:detail||"",at:Date.now()};
let log=[];try{log=JSON.parse(localStorage.getItem("meko_audit")||"[]")}catch(e){}log.unshift(row);localStorage.setItem("meko_audit",JSON.stringify(log.slice(0,200)));
if(db){try{await db.collection("auditLogs").add(row)}catch(e){}}}
/* ---------- settings (cached) ---------- */
async function loadSettingsCloud(){const s=await fsGet("settings","store");if(s){window.MEKO_CONFIG={...cfg(),...s.public,...s};try{localStorage.setItem("meko_settings",JSON.stringify(s.public||{}))}catch(e){}if(typeof loadSettings==="function"){try{loadSettings()}catch(e){}}}
async function saveSettingsCloud(pub){await fsSet("settings","store",{public:pub,at:Date.now()})}
/* ---------- categories ---------- */
const DEFAULT_CATS=["Electronics","Fashion","Home","Beauty","Toys","Sports"];
function getCats(){try{const s=JSON.parse(localStorage.getItem("meko_cats")||"null");if(s&&s.length)return s}catch(e){}return DEFAULT_CATS.slice()}
function saveCats(c){localStorage.setItem("meko_cats",JSON.stringify(c));fsSet("settings","cats",{list:c})}
async function syncCats(){const c=await fsGet("settings","cats");if(c&&c.list&&c.list.length){localStorage.setItem("meko_cats",JSON.stringify(c.list))}}
