/* Real email system: EmailJS (real SMTP) + mailto fallback + RTDB outbox.
   Setup (5 min, free): emailjs.com > sign up > Email Services (connect Gmail) > Email Templates > get SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY > paste in Admin>Settings. Template vars: to_email, to_name, subject, message, order_id, total. */
function cfg(){return window.MEKO_CONFIG||{}}
function initEmailJS(){try{const k=cfg().EMAILJS&&cfg().EMAILJS.PUBLIC_KEY;if(k&&typeof emailjs!=="undefined")emailjs.init(k)}catch(e){}}
function emailReady(){const e=cfg().EMAILJS||{};return !!(e.PUBLIC_KEY&&e.SERVICE_ID&&e.TEMPLATE_ID&&typeof emailjs!=="undefined")}
function getOutbox(){try{return JSON.parse(localStorage.getItem("meko_mail_out")||"[]")}catch(e){return[]}}
function saveOutbox(o){localStorage.setItem("meko_mail_out",JSON.stringify(o));const db=fbDb();if(db){try{db.ref("mail_outbox").set(o.slice(0,100))}catch(e){}}}
function queueMail(to,subject,message,extra){const m={to,subject,message,date:new Date().toLocaleString(),status:"queued",...(extra||{})};const o=getOutbox();o.unshift(m);saveOutbox(o);return m}
// send real email; returns {ok, via}
async function sendMail(to,subject,message,extra){
  const job=queueMail(to,subject,message,extra);
  if(emailReady()){
    try{
      await emailjs.send(cfg().EMAILJS.SERVICE_ID,cfg().EMAILJS.TEMPLATE_ID,{to_email:to,to_name:((extra||{}).name||to),subject,message,order_id:((extra||{}).orderId||""),total:((extra||{}).total||"")});
      job.status="sent";saveOutbox(getOutbox().map(m=>m===job?job:m));return{ok:true,via:"emailjs"};
    }catch(e){job.status="failed: "+(e&&e.text||e.message||e);saveOutbox(getOutbox());return{ok:false,via:"emailjs",error:e}}
  }
  // fallback: open customer's mail app to YOU (owner) — still delivers the message
  job.status="mailto-fallback";saveOutbox(getOutbox());return{ok:false,via:"mailto"};
}
function mailtoOwner(subject,body){const to=(cfg().OWNER_EMAILS||[])[0]||cfg().SUPPORT_EMAIL||"";window.location.href=`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
// templates
function tplAdminRequest(user){return{subject:`🔐 Admin access request — ${user.email}`,message:`Hello Owner,\n\n${user.name} (${user.email}) is requesting ADMIN access on MekoShop.\n\nTo approve: Admin panel > Users > set role=admin (their UID: ${user.uid}).\n\n— MekoShop system`}}
function tplWelcome(u){return{subject:`Welcome to MekoShop 🎉`,message:`Hi ${u.name},\n\nYour account is ready. Enjoy flash deals + coupon MEKO10 for 10% off.\n\n— MekoShop`}}
function tplOrder(o){return{subject:`Order confirmed ${o.id} — ${cfg().CURRENCY}${o.total.toFixed(2)}`,message:`Hi ${o.name},\n\nThanks! Order ${o.id} (${o.items.map(i=>i.qty+"x "+i.name).join(", ")}) total ${cfg().CURRENCY}${o.total.toFixed(2)} via ${o.pay.toUpperCase()}.\nArriving in 2–4 days to ${o.city}.\n\nInvoice: open your Orders > Print invoice.\n\n— MekoShop`}}
function tplRoleApproved(u){return{subject:`You're now an Admin ✅`,message:`Hi ${u.name},\n\nYour admin request was APPROVED. The Admin button now appears on the site — manage products, orders & offers.\n\n— MekoShop owner`}}
initEmailJS();
