# MekoShop Firestore schema (v4 marketplace)
Auth: Firebase Auth (email/Google). Roles in `roles/{uid}` = customer|seller|admin. Owner marktamer2005@gmail.com = admin.

- users/{uid}: {name,email,role,phone,city,address,at}
- roles/{uid}: {role, at}  // ONLY admin/owner writes (rules enforce)
- sellers/{key}: {uid,name,email,storeName,phone,city,address,nationalId,status:pending|approved|rejected|suspended,at}
- products/{id}: {name,cat,brand,price,old,rating,reviews,img,imgs[],stock,sku,sellerEmail,status:active|pending|suspended,badge,desc,specs{},variants[],at}
- categories (settings/cats): {list[]}
- carts/{uid}: {items:[{id,qty}], at}
- orders/{id}: {id,date,name,phone,city,addr,email,uid,pay,items:[{id,name,price,qty,img,sellerEmail}],sub,discount,tax,taxRate,ship,total,status,paid,at}
- sellerOrders/{auto}: {orderId,date,seller,items,sub,commission,payout,status}
- commissions/{auto}: {orderId,seller,base,amount,state:accrued|paid,at}
- payouts/{auto}: {seller,amount,orders[],state:pending|paid,at}
- reviews/{auto}: {pid,user,email,rating,text,at}
- wishlists/{uid}: {ids[]}
- addresses/{uid}: {list:[{label,name,phone,city,addr}],at}
- coupons/{code}: {code,pct,min,exp,maxUse,used}
- promotions/{id}: {title,body,coupon,to,at}
- notifications/{id}: {title,body,coupon,to,date}
- returns/{auto}: {orderId,by,reason,status,at}
- settings/store: {public:{OWNER_EMAILS,TAX_RATE,CURRENCY,FREE_SHIP,SHIP_FEE,COMMISSION_RATE,EMAILJS,STRIPE_PAYMENT_LINK,PAYPAL_ME}}
- auditLogs/{auto}: {action,by,detail,at}

Rules: firestore.rules (deploy manually: firebase console > Firestore > Rules). Never weaken to allow-all in production.
Tests: tests/run.js (node) — pure logic: billing, coupons, roles, order split, tracking states. Firestore rule tests need emulator (docs in tests/).
