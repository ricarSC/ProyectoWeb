
// shop.js: catálogo y carrito para heladería
const CART_KEY = 'cart_v1';
const DATA_URL = 'data/helados.json';

const state = {
  productos: [],
  filtros: new Set(),
  busqueda: ''
};

function money(n){ return 'Q ' + n.toFixed(2); }

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCartBadge(); }
function addToCart(item){
  const cart = loadCart();
  cart.push(item);
  saveCart(cart);
  alert('Añadido al carrito');
}
function renderCartBadge(){
  const cart = loadCart();
  const el = document.querySelector('[data-cart-count]');
  if(el) el.textContent = cart.length;
}

async function initCatalog(){
  try{
    const res = await fetch(DATA_URL);
    const data = await res.json();
    state.productos = data;
    bindFilters();
    renderCatalog();
  }catch(e){ console.error('Error cargando catálogo', e); }
}

function bindFilters(){
  document.querySelectorAll('[data-filter]').forEach(chk=>{
    chk.addEventListener('change', ()=>{
      state.filtros = new Set([...document.querySelectorAll('[data-filter]:checked')].map(x=>x.value));
      renderCatalog();
    });
  });
  const search = document.querySelector('[data-search]');
  if(search){
    search.addEventListener('input', (e)=>{ state.busqueda = e.target.value.toLowerCase(); renderCatalog(); });
  }
}

function productCard(p){
  const tags = (p.tags||[]).map(t=>`<span class="tag">${t.replace('_',' ')}</span>`).join('');
  return `<article class="card product" data-id="${p.id}">
    <img src="${p.img}" alt="Helado ${p.nombre}" loading="lazy">
    <div class="product-body">
      <h3>${p.nombre}</h3>
      <p class="muted">${p.descripcion}</p>
      <div class="price">${money(p.precioBase)}</div>
      <div class="tags">${tags}</div>
      <button class="btn primary" data-open-config="${p.id}">Personalizar</button>
      <button class="btn ghost" data-share="${p.id}">Compartir</button>
    </div>
  </article>`;
}

function renderCatalog(){
  const grid = document.querySelector('[data-catalog]');
  if(!grid) return;
  let items = [...state.productos];
  // filtros
  if(state.filtros.size){
    items = items.filter(p => p.categorias?.some(c=> state.filtros.has(c)));
  }
  if(state.busqueda){
    items = items.filter(p => (p.nombre+p.descripcion).toLowerCase().includes(state.busqueda));
  }
  grid.innerHTML = items.map(productCard).join('') || '<p>No hay resultados.</p>';
  // listeners Config + Share
  grid.querySelectorAll('[data-open-config]').forEach(btn=> btn.addEventListener('click', ()=> openConfigModal(btn.dataset.openConfig)));
  grid.querySelectorAll('[data-share]').forEach(btn=> btn.addEventListener('click', ()=> shareProduct(btn.dataset.share)));
}

function shareProduct(id){
  const p = state.productos.find(x=>x.id===id);
  if(!p) return;
  const text = `Mirá este helado: ${p.nombre} - ${p.descripcion}`;
  if(navigator.share){
    navigator.share({title: p.nombre, text, url: location.href});
  }else{
    prompt('Copiá y compartí:', text + ' ' + location.href);
  }
}

function openConfigModal(id){
  const p = state.productos.find(x=>x.id===id);
  if(!p) return;
  const root = document.getElementById('configModal');
  const body = root.querySelector('.modal-content .body');
  // tamaño
  const sizeOpts = p.tamaños.map((t,i)=> `<label><input type="radio" name="size" value="${t.label}" data-extra="${t.extra}" ${i? '': 'checked'}> ${t.label} (+${money(t.extra)})</label>`).join('');
  // toppings
  const topOpts = p.toppings.map((t,i)=> `<label><input type="checkbox" name="top" value="${t.label}" data-precio="${t.precio}"> ${t.label} (+${money(t.precio)})</label>`).join('');
  body.innerHTML = `
    <h3>${p.nombre}</h3>
    <p class="muted">${p.descripcion}</p>
    <div class="config">
      <div><strong>Tamaño</strong><div class="opts">${sizeOpts}</div></div>
      <div><strong>Toppings</strong><div class="opts">${topOpts}</div></div>
      <div class="qty"><strong>Cantidad</strong> <input type="number" min="1" value="1" step="1"></div>
      <div class="total">Total: <span data-total>${money(p.precioBase)}</span></div>
      <div class="actions">
        <button class="btn primary" data-add>Agregar al carrito</button>
        <button class="btn ghost" data-close>Cerrar</button>
      </div>
    </div>
  `;
  root.dataset.pid = p.id;
  root.classList.add('open');
  document.body.style.overflow='hidden';
  const calc = ()=>{
    const base = p.precioBase;
    const size = [...body.querySelectorAll('input[name="size"]')].find(x=>x.checked);
    const extra = Number(size?.dataset.extra||0);
    const tops = [...body.querySelectorAll('input[name="top"]:checked')];
    const topsTotal = tops.reduce((s,x)=> s + Number(x.dataset.precio||0), 0);
    const qty = Number(body.querySelector('.qty input').value||1);
    const total = (base + extra + topsTotal) * qty;
    body.querySelector('[data-total]').textContent = money(total);
    return { size: size?.value, tops: tops.map(x=>x.value), qty, total };
  };
  body.addEventListener('change', calc);
  body.querySelector('.qty input').addEventListener('input', calc);
  calc();
  body.querySelector('[data-add]').addEventListener('click', ()=>{
    const sel = calc();
    addToCart({
      id: p.id, nombre: p.nombre, img: p.img,
      precioUnit: p.precioBase, size: sel.size, tops: sel.tops, qty: sel.qty, total: sel.total
    });
    closeConfig();
  });
  body.querySelector('[data-close]').addEventListener('click', closeConfig);
}

function closeConfig(){
  const root = document.getElementById('configModal');
  root.classList.remove('open');
  document.body.style.overflow='auto';
}

document.addEventListener('click', (e)=>{
  if(e.target.id==='configModal') closeConfig();
});

// Carrito page
function renderCartPage(){
  const host = document.querySelector('[data-cart]');
  if(!host) return;
  const cart = loadCart();
  if(cart.length===0){ host.innerHTML='<p>Tu carrito está vacío.</p>'; renderCartBadge(); return; }
  const rows = cart.map((it,idx)=>`
    <div class="cart-row">
      <img src="${it.img}" alt="${it.nombre}" loading="lazy">
      <div class="info">
        <h4>${it.nombre}</h4>
        <p class="muted">${it.size||''} ${it.tops?.length? '• '+it.tops.join(', '): ''}</p>
        <p>Cant: ${it.qty}</p>
      </div>
      <div class="subtotal">${money(it.total)}</div>
      <button class="btn ghost" data-remove="${idx}">Quitar</button>
    </div>
  `).join('');
  const total = cart.reduce((s,x)=> s + Number(x.total||0), 0);
  host.innerHTML = `
    ${rows}
    <div class="cart-total"><strong>Total:</strong> ${money(total)}</div>
    <div class="cart-actions">
      <button class="btn ghost" data-empty>Vaciar</button>
      <a class="btn primary" href="#" data-whatsapp>Finalizar por WhatsApp</a>
    </div>
  `;
  host.querySelectorAll('[data-remove]').forEach(btn=> btn.addEventListener('click', ()=>{
    const c = loadCart(); c.splice(Number(btn.dataset.remove),1); saveCart(c); renderCartPage();
  }));
  host.querySelector('[data-empty]').addEventListener('click', ()=>{ saveCart([]); renderCartPage(); });
  host.querySelector('[data-whatsapp]').addEventListener('click', (e)=>{
    e.preventDefault();
    const lineas = cart.map(it=> `• ${it.nombre} x${it.qty} (${it.size||''}${it.tops?.length? ' + '+it.tops.join(', '): ''}) = ${money(it.total)}`);
    const msg = encodeURIComponent(`Hola, quiero este pedido:%0A${lineas.join('%0A')}`);
    const url = `https://wa.me/50255555555?text=${msg}`;
    window.open(url, '_blank');
  });
  renderCartBadge();
}

// Init según página
document.addEventListener('DOMContentLoaded', ()=>{
  renderCartBadge();
  if (document.querySelector('[data-catalog]')) { initCatalog(); }
  if (document.querySelector('[data-cart]')) { renderCartPage(); }
});
