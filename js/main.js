document.getElementById('navbar').innerHTML = `
<nav class="nav-bar">
  <a href="index.html" class="nav-brand">Helados Victoria</a>
  <ul class="nav-links">
    <li><a href="index.html">Inicio</a></li>
    <li><a href="tienda.html">Tienda</a></li>
    <li><a href="contacto.html">Contacto</a></li>
  
    <li><a href="sabores.html">Sabores</a></li>
    <li><a href="promociones.html">Promociones</a></li>
    <li><a href="blog.html">Blog</a></li>
    <li><a href="carrito.html">Carrito <span class="badge" data-cart-count>0</span></a></li>
  </ul>
  <div class="nav-cta">
    <a href="#" class="btn ghost" data-open-login>Iniciar sesión</a>
    <a href="#" class="btn primary" data-open-register>Registrarse</a>
  
    <button class="btn ghost" data-toggle-theme title="Cambiar tema">🌓</button>
  </div>
</nav>
`;

// Animación de contador
const counters = document.querySelectorAll('.contador');
const animationDuration = 1500; // ms

const animateCounters = () => {
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const suffix = counter.getAttribute('data-sufijo') || '';
    const start = 0;
    const startTime = performance.now();

    const update = now => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const current = Math.floor(progress * target);
      counter.innerText = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  });
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.intersectionRatio >= 0.6) {
      animateCounters();
      observer.disconnect();
    }
  });
}, {
  threshold: 0.6 // 60% de visibilidad
});


const statsSection = document.querySelector('.info-producto');
observer.observe(statsSection);



// --- Carga de navegación compartida (nav.html) si existe ---
(function(){
  const host = document.getElementById('navbar');
  if (host && !host.dataset.injected) {
    fetch('nav.html').then(r=>r.text()).then(html=>{
      host.innerHTML = html;
      host.dataset.injected = '1';
      // Añade acciones para Login/Registro si están en la barra
      const loginBtn = document.querySelector('[data-open-login]');
      const regBtn = document.querySelector('[data-open-register]');
      loginBtn && loginBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal('loginModal'); });
      regBtn && regBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal('registerModal'); });
    }).catch(()=>{});
  }
})();

// --- Botón "ir arriba" ---
(function(){
  const btn = document.getElementById('backToTop');
  if(!btn) return;
  const toggle = () => {
    if (window.scrollY > 400) btn.classList.add('show'); else btn.classList.remove('show');
  };
  window.addEventListener('scroll', toggle, {passive:true});
  btn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  toggle();
})();

// --- Modales Auth (Login/Registro) ---
function openModal(id){
  const root = document.getElementById('authModals');
  if(!root) return;
  root.style.display='block';
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModals(){
  const root = document.getElementById('authModals');
  if(!root) return;
  root.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));
  root.style.display='none';
  document.body.style.overflow='auto';
}
document.addEventListener('click', (e)=>{
  if(e.target.matches('[data-close]') || e.target.classList.contains('modal')) closeModals();
});
