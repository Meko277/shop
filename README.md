# MekoShop PRO — Amazon/Noon/AliExpress level (v3)

Live: https://meko277.github.io/shop/ — Admin: .../admin.html

## Roles (Firebase Auth)
- Register = CUSTOMER (email verify + welcome email). Admin button hidden.
- "Become a seller" → real email sent to OWNER → Admin panel > Users > ✅ Approve → user gets Admin button + approval email.
- Owner emails auto-admin. Put YOUR email in Admin > Settings > Owner email (or config.js OWNER_EMAILS).
- Legacy admin pass `1234` still works.

## Real email (no backend, GitHub Pages OK)
- EmailJS: emailjs.com → connect Gmail → template vars: to_email,to_name,subject,message,order_id,total → paste keys in Admin > Settings.
- Covers: welcome, order confirmations, offer blasts, admin-request to owner, approval mail. Full log in Admin > Mail Log (+ RTDB mail_outbox).

## Real billing (no backend)
- Checkout: subtotal − coupon + VAT + shipping, printable invoice per order, CSV export, PAID badges.
- Stripe: Dashboard > Payment Links > paste link in Settings → pay button appears after order. PayPal: paste paypal.me link. Cards validated (Luhn).

## Firebase console checklist
Auth: Email/Password + Google ON. Realtime Database: test mode. (RTDB nodes: users, roles, admin_requests, products, orders, notifications, subscribers, settings, mail_outbox)

## Files
config.js, firebase.js, mailer.js, billing.js, roles.js, store.js, auth.js, admin.js, index.html, admin.html, styles.css, theme.css


