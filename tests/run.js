// MekoShop unit tests (pure logic, no network). Run: node tests/run.js
let pass=0,fail=0;
function t(name,cond){if(cond){pass++;console.log("PASS "+name)}else{fail++;console.log("FAIL "+name)}}
// billing math (mirror of billing.js)
function billTotals(sub,discount,c){const net=Math.max(0,sub-discount);const tax=net*(c.TAX_RATE||0);const ship=net>=(c.FREE_SHIP||50)||sub===0?0:(c.SHIP_FEE||4.99);return{sub,discount,net,tax,ship,total:net+tax+ship}}
const C={TAX_RATE:0.14,FREE_SHIP:50,SHIP_FEE:4.99};
let b=billTotals(100,10,C);t("bill net",b.net===90);t("bill tax",Math.abs(b.tax-12.6)<.01);t("bill free ship",b.ship===0);
b=billTotals(30,0,C);t("bill paid ship",b.ship===4.99);t("bill total",Math.abs(b.total-(30+4.2+4.99))<.01);
b=billTotals(0,0,C);t("bill empty",b.total===0);
// coupons
function validateCoupon(code,sub,list){const c=list.find(x=>x.code===code);if(!c)return{ok:false};if(c.min&&sub<c.min)return{ok:false};if(c.exp&&Date.now()>c.exp)return{ok:false};return{ok:true,off:sub*(c.pct/100)}}
t("coupon ok",validateCoupon("MEKO10",100,[{code:"MEKO10",pct:10}]).off===10);
t("coupon min",validateCoupon("SAVE20",50,[{code:"SAVE20",pct:20,min:100}]).ok===false);
t("coupon expired",validateCoupon("X",100,[{code:"X",pct:5,exp:1}]).ok===false);
// roles boundary
function roleOf(email,owners){return owners.map(x=>x.toLowerCase()).includes(String(email).toLowerCase())?"admin":"customer"}
t("owner admin",roleOf("MarkTamer2005@GMAIL.com",["marktamer2005@gmail.com"])==="admin");
t("guest customer",roleOf("x@y.com",["marktamer2005@gmail.com"])==="customer");
// order split + commission
function split(items,rate){const g={};items.forEach(i=>{(g[i.sellerEmail||"store"]=g[i.sellerEmail||"store"]||[]).push(i)});return Object.entries(g).map(([s,it])=>{const sub=it.reduce((a,i)=>a+i.price*i.qty,0);return{seller:s,sub,com:sub*rate,pay:sub*(1-rate)}})}
const sp=split([{price:100,qty:1,sellerEmail:"a@x"},{price:50,qty:2,sellerEmail:"b@x"}],0.10);
t("split sellers",sp.length===2);t("commission",sp[0].com===10&&sp[1].pay===90);
// cart stock guard
function addQty(cur,add,stock){return Math.min(cur+add,stock)}
t("stock cap",addQty(4,3,5)===5);t("stock ok",addQty(1,1,5)===2);
// tracking state machine
const FLOW=["Pending","Paid","Processing","Shipped","Delivered"];const NEXT={Pending:["Paid","Cancelled"],Paid:["Processing","Cancelled"],Processing:["Shipped","Cancelled"],Shipped:["Delivered"],"Return requested":["Returned","Refunded"]};
t("flow ok",NEXT.Paid.includes("Processing"));t("flow block",!NEXT.Pending.includes("Delivered"));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
