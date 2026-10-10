/* MekoShop central config — EDIT THESE */
window.MEKO_CONFIG = {
  OWNER_EMAILS: ["you@example.com"], // <-- PUT YOUR EMAIL HERE: auto-admin + receives admin-request mails
  TAX_RATE: 0.14,            // 14% VAT (change as needed)
  CURRENCY: "$",
  FREE_SHIP: 50, SHIP_FEE: 4.99,
  // Real email via EmailJS (https://www.emailjs.com) — free, no backend, works on GitHub Pages
  EMAILJS: { PUBLIC_KEY: "", SERVICE_ID: "", TEMPLATE_ID: "" }, // fill in Admin > Settings or here
  // Real billing: paste your links (no backend needed)
  STRIPE_PAYMENT_LINK: "",   // e.g. https://buy.stripe.com/xxxxx (Stripe Dashboard > Payment Links)
  PAYPAL_ME: "",              // e.g. https://paypal.me/yourshop
  SUPPORT_EMAIL: "support@mekoshop.com"
};
// runtime overrides from Admin>Settings (localStorage + RTDB)
try{const s=JSON.parse(localStorage.getItem("meko_settings")||"null");if(s)window.MEKO_CONFIG={...window.MEKO_CONFIG,...s}}catch(e){}
