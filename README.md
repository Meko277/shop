# MekoShop Marketplace v4 — Amazon/Noon/AliExpress-level PRO build

## Run locally (no build)
No npm needed. Serve the folder (module-safe) and open:
- `index.html` storefront • `product.html?id=...` • `checkout.html` • `success.html` • `account.html` • `seller.html` • `admin.html`
- Windows: `cd shop` then `python -m http.server 8000` → http://localhost:8000/index.html (or just double-click index.html)

## Tests
- `node tests/run.js` — billing, coupons, roles, splits, tracking machine (pure logic, offline).
- Firestore rules: `firestore.rules` — deploy manually in Firebase console (Firestore > Rules). Rule test via emulator optional (see SCHEMA.md).

## Configure (Firebase shop-98ce2 already wired)
1. Firebase console > Authentication: enable Email/Password + Google. Add authorized domain `meko277.github.io`.
2. Firestore: create database > paste `firestore.rules` > publish. (RTDB test mode optional legacy.)
3. Admin > Settings: owner email (yours prefilled), EmailJS keys, Stripe Payment Link, PayPal link, VAT, shipping, commission.
4. EmailJS: emailjs.com > connect Gmail > template vars to_email,to_name,subject,message,order_id,total.
5. Stripe: Dashboard > Payment Links > paste link. PayPal: paypal.me link.

## Deploy (GitHub Pages)
Push `main`, Settings > Pages > Deploy from branch main/root → https://meko277.github.io/shop/

## Security notes
- Roles enforced in firestore.rules + seller isolation in market.js/seller.js (sellerApproved gate). Admin button hidden AND gated.
- No secrets in repo (.env.example only placeholders). Never store cards/CVV. Paid state only via provider flow.



