# MekoShop - Amazon / Noon Clone

Modern full-working e-commerce website (GitHub Pages ready).

## Features
- Storefront like Amazon + Noon
- Search, categories, flash deals countdown, wishlist, cart
- Product quick view
- Checkout with COD + Card + PayPal (mock, Stripe-ready)
- Admin panel `admin.html` : login `admin / admin123`, add/edit/delete products, image upload, orders manager, stats
- Data saved in localStorage (no backend needed) - works on GitHub Pages
- Fully responsive + modern design

## Run locally
Just open `index.html` in browser. No build needed.

## Deploy to GitHub Pages
Repo: https://github.com/Meko277/shop
1. Push all files to `main`
2. Repo Settings > Pages > Deploy from branch > main / root
3. Open `https://meko277.github.io/shop/` and `.../admin.html`

## Real payments (Stripe)
Open `store.js` -> `STRIPE_PUBLIC_KEY = ""`. Put your Stripe publishable key and uncomment Stripe.js code. For full backend use Stripe Checkout + Firebase/Supabase.

Admin login default: `admin` / `admin123` (change in admin.js ADMIN_USER)
