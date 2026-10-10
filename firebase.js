// Firebase config - shop-98ce2 (compat SDK). RTDB used for roles, products, orders, offers, settings.
const firebaseConfig={apiKey:"AIzaSyAnGtHW3fcMjivKgUiKDPA_mSwnYbB3vSs",authDomain:"shop-98ce2.firebaseapp.com",databaseURL:"https://shop-98ce2-default-rtdb.firebaseio.com",projectId:"shop-98ce2",storageBucket:"shop-98ce2.firebasestorage.app",messagingSenderId:"848902576917",appId:"1:848902576917:web:18e9e2f0eaee830896a71c",measurementId:"G-BJTZEGB5NK"};
try{if(typeof firebase!=="undefined"&&!firebase.apps.length)firebase.initializeApp(firebaseConfig)}catch(e){console.log("fb init",e)}
function fbAuth(){try{if(typeof firebase!=="undefined"&&firebase.auth)return firebase.auth()}catch(e){}return null}
function fbDb(){try{if(typeof firebase!=="undefined"&&firebase.database)return firebase.database()}catch(e){}return null}
// subscriber list = local + RTDB mirror
function getSubs(){try{return JSON.parse(localStorage.getItem("meko_subs")||"[]")}catch(e){return[]}}
function saveSubs(s){localStorage.setItem("meko_subs",JSON.stringify(s));const db=fbDb();if(db){try{db.ref("subscribers").set(s)}catch(e){}}}
function subscribeEmail(email){email=(email||"").trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return false;let s=getSubs();if(!s.includes(email)){s.push(email);saveSubs(s)}return true}
// notifications / offers inbox (admin -> customers)
function getNotes(){try{return JSON.parse(localStorage.getItem("meko_notes")||"[]")}catch(e){return[]}}
function saveNotes(n){localStorage.setItem("meko_notes",JSON.stringify(n));const db=fbDb();if(db){try{db.ref("notifications").set(n)}catch(e){}}}
function unreadCount(){const read=+(localStorage.getItem("meko_read")||0);return Math.max(0,getNotes().length-read)}
// pull shared data from RTDB when available
function syncFromCloud(){const db=fbDb();if(!db)return;try{
db.ref("products").once("value").then(snap=>{const v=snap.val();if(v){const arr=Array.isArray(v)?v:Object.values(v);if(arr.length){localStorage.setItem("meko_products",JSON.stringify(arr));if(typeof renderAll==="function")renderAll()}}}).catch(()=>{});
db.ref("notifications").once("value").then(snap=>{const v=snap.val();if(v){const arr=Array.isArray(v)?v:Object.values(v);localStorage.setItem("meko_notes",JSON.stringify(arr));if(typeof updateBell==="function")updateBell()}}).catch(()=>{});
}catch(e){}}
// auth helpers (Firebase Auth + local fallback so site never breaks)
function currentUser(){try{return JSON.parse(localStorage.getItem("meko_user")||"null")}catch(e){return null}}
function setUser(u){if(u)localStorage.setItem("meko_user",JSON.stringify(u));else localStorage.removeItem("meko_user");if(typeof updateAuthUI==="function")updateAuthUI()}
