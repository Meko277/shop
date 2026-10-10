# Deploy + integration checklist (exact)
## GitHub Pages (site)
1. `git add . && git commit -m "marketplace v4" && git push origin main`
2. Repo Settings > Pages > Deploy from branch: main / root
3. https://meko277.github.io/shop/ (+ admin.html, seller.html, account.html, checkout.html, product.html)

## Firebase (shop-98ce2)
- Auth: Email/Password ON, Google ON, authorized domains += meko277.github.io
- Firestore: Create database (production) > Rules tab > paste firestore.rules > Publish
- (Optional legacy) RTDB: test mode

## Email (EmailJS, free, no backend)
- emailjs.com > Add service (Gmail) > Create template with vars: to_email,to_name,subject,message,order_id,total
- Admin > Settings: paste PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID > Save
- Verify: Admin > Mail Log shows "sent"; inbox receives welcome/order/offer mails

## Billing (no backend)
- Stripe Dashboard > Payment Links > Create > paste URL in Admin > Settings > appears on success.html + checkout
- PayPal: paste https://paypal.me/... link
- VAT/shipping/commission editable in Settings; invoices printable; CSV export in Orders

## Seller flow
Register > seller.html > apply > Admin > Sellers > Approve > seller adds products (own only) > order splits + commission recorded

## Admin flow
admin.html > login (owner auto-admin, or approved role, or legacy 1234) > Products/Orders/Sellers/Users/Coupons/Mail/Log/Audit/Settings
