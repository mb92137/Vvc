const products=[
{id:1,name:"تشک طبی کلاسیک",cat:"تشک",price:12900000,old:14900000,icon:"🛏️",tag:"پرفروش",rating:"★★★★★"},
{id:2,name:"تشک فنری هتلی",cat:"تشک",price:9900000,old:11500000,icon:"🛏️",tag:"ویژه",rating:"★★★★☆"},
{id:3,name:"بالش مموری فوم",cat:"بالش",price:890000,old:1050000,icon:"🧸",tag:"محبوب",rating:"★★★★★"},
{id:4,name:"بالش طبی گردنی",cat:"بالش",price:720000,old:850000,icon:"💤",tag:"",rating:"★★★★☆"},
{id:5,name:"روتختی هتلی دو نفره",cat:"روتختی",price:2190000,old:2690000,icon:"🛌",tag:"جدید",rating:"★★★★★"},
{id:6,name:"روتختی کتان مینیمال",cat:"روتختی",price:2490000,old:2890000,icon:"🛌",tag:"",rating:"★★★★☆"},
{id:7,name:"ست ملحفه کتان",cat:"ملحفه",price:1490000,old:1790000,icon:"🧵",tag:"",rating:"★★★★★"},
{id:8,name:"پتو چهار فصل",cat:"پتو",price:1690000,old:1990000,icon:"🧣",tag:"پرفروش",rating:"★★★★☆"},
{id:9,name:"محافظ تشک ضدآب",cat:"محافظ",price:590000,old:690000,icon:"🧺",tag:"",rating:"★★★★★"},
{id:10,name:"پتو سبک تابستانی",cat:"پتو",price:1190000,old:1390000,icon:"🧣",tag:"",rating:"★★★★☆"}
];
let cart=JSON.parse(localStorage.getItem("vvc-cart")||"[]");
const money=n=>n.toLocaleString("fa-IR")+" تومان";
function save(){localStorage.setItem("vvc-cart",JSON.stringify(cart));updateCount()}
function updateCount(){document.querySelectorAll("[data-count]").forEach(e=>e.textContent=cart.reduce((s,x)=>s+x.qty,0))}
function render(list=products){
 const grid=document.getElementById("productsGrid");
 grid.innerHTML=list.length?list.map(function(p){return '<article class="product"><div class="product-media">'+(p.tag?'<span class="tag">'+p.tag+'</span>':'')+p.icon+'</div><div class="product-body"><div class="product-cat">'+p.cat+'</div><h3>'+p.name+'</h3><div class="rating">'+p.rating+'</div><div class="price">'+money(p.price)+' <span class="old">'+money(p.old)+'</span></div><button class="add" onclick="addToCart('+p.id+')">افزودن به سبد</button></div></article>'}).join(""):'<div class="empty">محصولی با این مشخصات پیدا نشد.</div>';
}
function addToCart(id){const p=products.find(x=>x.id===id),item=cart.find(x=>x.id===id);item?item.qty++:cart.push({id:id,qty:1});save();toast("محصول به سبد خرید اضافه شد")}
function changeQty(id,d){const x=cart.find(i=>i.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);save();renderCart()}
function renderCart(){
 const box=document.getElementById("cartItems");
 if(!cart.length){box.innerHTML='<div class="empty">سبد خرید شما خالی است.</div>';document.getElementById("cartTotal").textContent=money(0);return}
 box.innerHTML=cart.map(function(i){const p=products.find(x=>x.id===i.id);return '<div class="cart-row"><div class="cart-img">'+p.icon+'</div><div><b>'+p.name+'</b><div class="product-cat">'+money(p.price)+'</div><div class="qty"><button onclick="changeQty('+p.id+',-1)">−</button> '+i.qty+' <button onclick="changeQty('+p.id+',1)">+</button></div></div><strong>'+money(p.price*i.qty)+'</strong></div>'}).join("");
 document.getElementById("cartTotal").textContent=money(cart.reduce((s,i)=>s+products.find(p=>p.id===i.id).price*i.qty,0));
}
function openCart(){document.getElementById("drawer").classList.add("open");renderCart()}function closeCart(){document.getElementById("drawer").classList.remove("open")}
function toast(t){const e=document.getElementById("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function filterProducts(){const q=document.getElementById("searchInput").value.trim();const cat=document.getElementById("categoryFilter").value;let xs=products.filter(p=>(p.name+" "+p.cat).includes(q)&&(cat==="همه"||p.cat===cat));const sort=document.getElementById("sort").value;if(sort==="low")xs.sort((a,b)=>a.price-b.price);if(sort==="high")xs.sort((a,b)=>b.price-a.price);render(xs)}
function category(c){document.getElementById("categoryFilter").value=c;document.getElementById("products").scrollIntoView({behavior:"smooth"});filterProducts()}
function checkout(e){e.preventDefault();if(!cart.length){toast("سبد خرید خالی است");return}cart=[];save();renderCart();toast("سفارش ثبت شد؛ برای پرداخت آنلاین باید درگاه واقعی متصل شود")}
function subscribe(e){e.preventDefault();e.target.reset();toast("عضویت شما با موفقیت انجام شد")}
document.addEventListener("DOMContentLoaded",function(){render();updateCount();document.getElementById("searchInput").addEventListener("input",filterProducts);document.getElementById("categoryFilter").addEventListener("change",filterProducts);document.getElementById("sort").addEventListener("change",filterProducts)});
