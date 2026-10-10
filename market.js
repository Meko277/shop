/* Marketplace domain: sellers, commissions, coupons, reviews, returns, sellerOrders, payouts */
// commission: configurable % (default 10%)
function commissionRate(){return (cfg().COMMISSION_RATE!=null?cfg().COMMISSION_RATE:0.10)}
// sellers
async function applySeller(profile){ // profile: {storeName, phone, city, address, nationalId}
  const u=currentUser();if(!u)throw new Error("Login first");
  const rec={uid:u.uid||u.email,name:u.name,email:u.email,status:"pending",at:Date.now(),...profile};
  let arr=[];try{arr=JSON.parse(localStorage.getItem("meko_sellers")||"[]")}catch(e){}
  arr=arr.filter(s=>s.email!==u.email);arr.unshift(rec);localStorage.setItem("meko_sellers",JSON.stringify(arr));
  await fsSet("sellers",String(u.uid||u.email).replace(/[^a-zA-Z0-9@._-]/g,"_"),rec);
  const db=fbDb();if(db){try{db.ref("seller_requests/"+btoa(u.email)).set(rec)}catch(e){}}
  try{const t={subject:`🏪 Seller application — ${u.email}`,message:`${u.name} (${u.email}) applied as seller.\nStore: ${profile.storeName}\nPhone: ${profile.phone}\nApprove: Admin > Sellers`};const owner=(cfg().OWNER_EMAILS||[])[0];if(owner)await sendMail(owner,t.subject,t.message,{name:u.name})}catch(e){}
  await audit("seller.apply",u.email,profile.storeName);
  return rec;
}
function getSellers(){try{return JSON.parse(localStorage.getItem("meko_sellers")||"[]")}catch(e){return[]}}
async function setSellerStatus(email,status){let arr=getSellers();const f=arr.find(s=>s.email===email);if(f){f.status=status;localStorage.setItem("meko_sellers",JSON.stringify(arr))}
  await fsSet("sellers",String(email).replace(/[^a-zA-Z0-9@._-]/g,"_"),{status});
  const u=currentUser();await audit("seller."+status,u&&u.email,email);
  if(f&&status==="approved"){try{const t={subject:"Your seller account approved ✅",message:`Hi ${f.name},\n\nYour store "${f.storeName}" is approved. Open Seller Dashboard to add products.\n\n— MekoShop`};await sendMail(email,t.subject,t.message,{name:f.name})}catch(e){}}
}
function mySeller(){const u=currentUser();if(!u)return null;return getSellers().find(s=>s.email===u.email)||null}
function isSeller(){const s=mySeller();return !!(s&&s.status==="approved")}
// products carry sellerEmail + status(active/pending/suspended)
function productSeller(p){return p.sellerEmail||"store"}
function canManageProduct(p){if(isAdmin())return true;const u=currentUser();return !!(u&&p.sellerEmail===u.email)}
async function setProductStatus(id,status){const P=getProducts();const p=P.find(x=>x.id===id);if(!p)return;if(!canManageProduct(p))return toast("Not your product");p.status=status;saveProducts(P);await fsSet("products",id,{status});await audit("product."+status,(currentUser()||{}).email,id)}
// orders split per seller + commission rows
function splitOrder(order){const groups={};order.items.forEach(i=>{const s=i.sellerEmail||"store";(groups[s]=groups[s]||[]).push(i)});
  return Object.entries(groups).map(([seller,items])=>{const sub=items.reduce((a,i)=>a+i.price*i.qty,0);const com=sub*commissionRate();return{seller,items,sub,commission:com,payout:sub-com,status:"pending"}});
}
async function recordSellerOrders(order){const splits=splitOrder(order);
  let all=[];try{all=JSON.parse(localStorage.getItem("meko_sellerOrders")||"[]")}catch(e){}
  splits.forEach(s=>all.unshift({orderId:order.id,date:order.date,...s}));
  localStorage.setItem("meko_sellerOrders",JSON.stringify(all.slice(0,500)));
  for(const s of splits){await fsAdd("sellerOrders",{orderId:order.id,date:order.date,...s});await fsAdd("commissions",{orderId:order.id,seller:s.seller,amount:s.commission,base:s.sub,state:"accrued",at:Date.now()})}
}
// coupons: {code, pct, min, exp, maxUse, used}
function getCoupons(){const base=[{code:"MEKO10",pct:10,min:0},{code:"SAVE20",pct:20,min:100}];try{const s=JSON.parse(localStorage.getItem("meko_coupons")||"null");if(s)return base.concat(s)}catch(e){}return base}
function validateCoupon(code,sub){const c=getCoupons().find(x=>x.code===String(code||"").toUpperCase());if(!c)return{ok:false,off:0,msg:"Invalid coupon"};if(c.min&&sub<c.min)return{ok:false,off:0,msg:`Min ${money(c.min)}`};if(c.exp&&Date.now()>c.exp)return{ok:false,off:0,msg:"Expired"};if(c.maxUse&&((c.used||0)>=c.maxUse))return{ok:false,off:0,msg:"Fully used"};return{ok:true,off:sub*(c.pct/100),coupon:c}}
// reviews
function getReviews(pid){try{return JSON.parse(localStorage.getItem("meko_rev_"+pid)||"[]")}catch(e){return[]}}
async function addReview(pid,rating,text){const u=currentUser();if(!u)return toast("Login to review");const r={pid,user:u.name,email:u.email,rating,text,at:new Date().toLocaleString()};const a=getReviews(pid);a.unshift(r);localStorage.setItem("meko_rev_"+pid,JSON.stringify(a));await fsAdd("reviews",r);return r}
// returns
async function requestReturn(orderId,reason){const u=currentUser();const o=getOrders().find(x=>x.id===orderId);if(!o)return toast("Not found");o.status="Return requested";saveOrders(o);
  let r=[];try{r=JSON.parse(localStorage.getItem("meko_returns")||"[]")}catch(e){}r.unshift({orderId,by:(u||{}).email||o.email,reason,at:new Date().toLocaleString(),status:"requested"});localStorage.setItem("meko_returns",JSON.stringify(r));
  await fsSet("orders",orderId,{status:"Return requested"});await fsAdd("returns",{orderId,reason,status:"requested",at:Date.now()});await audit("return.request",(u||{}).email,orderId);toast("Return requested");if(typeof renderAll==="function")renderAll();
}
