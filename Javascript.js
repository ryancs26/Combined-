(function(){
  // -------- settings --------
  const INJECT_CSS = true; // set to false if you already added these rules in your CSS
  const BREAKPOINT = 900;  // matches previous CSS logic
  // --------------------------

  // 1) Locate existing header pieces
  const header = document.querySelector('.navbar');
  const row    = header?.querySelector('.row');
  let links    = header?.querySelector('.nav-links');

  if (!header || !row) { console.warn('Hamburger: missing .navbar/.row'); return; }
  if (!links) {
    // if links are wrapped differently on a page, try to find a <nav> with links
    links = header.querySelector('nav a') ? header.querySelector('nav').cloneNode(true) : null;
    if (!links) { console.warn('Hamburger: missing .nav-links'); return; }
  }

  // 2) Ensure desktop wrapper
  let desktopNav = header.querySelector('.nav-desktop');
  if (!desktopNav) {
    desktopNav = document.createElement('nav');
    desktopNav.className = 'nav-desktop';
    desktopNav.setAttribute('aria-label','Primary');
    // If .nav-links is inside header already, move it into nav-desktop
    if (links.classList && links.classList.contains('nav-links')) {
      desktopNav.appendChild(links);
    } else {
      // fallback: wrap whatever links container we found
      const wrap = document.createElement('div');
      wrap.className = 'nav-links';
      wrap.append(...header.querySelectorAll('nav a').forEach? [] : []);
      desktopNav.appendChild(wrap);
    }
    row.appendChild(desktopNav);
  }

  // 3) Add hamburger button if missing
  let btn = row.querySelector('#nav-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.id = 'nav-toggle';
    btn.setAttribute('aria-label','Open menu');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls','mobile-drawer');
    btn.innerHTML = '<span class="nav-toggle-box" aria-hidden="true"><span class="nav-toggle-inner"></span></span>';
    row.appendChild(btn);
  }

  // 4) Add drawer + overlay if missing (clone desktop links into drawer)
  let drawer = document.getElementById('mobile-drawer');
  if (!drawer) {
    drawer = document.createElement('nav');
    drawer.className = 'mobile-drawer';
    drawer.id = 'mobile-drawer';
    drawer.hidden = true;

    const ul = document.createElement('ul');
    ul.className = 'mobile-links';

    const aTags = header.querySelectorAll('.nav-desktop .nav-links a');
    aTags.forEach(a => {
      const li = document.createElement('li');
      li.appendChild(a.cloneNode(true));
      ul.appendChild(li);
    });

    drawer.appendChild(ul);
    header.insertAdjacentElement('afterend', drawer);
  }

  let overlay = document.getElementById('mobile-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobile-overlay';
    overlay.hidden = true;
    drawer.insertAdjacentElement('afterend', overlay);
  }

  // 5) Inject CSS once (so you don’t touch per-page CSS files)
  if (INJECT_CSS && !document.getElementById('hamburger-inline-css')) {
    const css = `
:root{ --hdr-h:64px; --shadow-lg:0 10px 28px rgba(0,0,0,.12); }
.nav-desktop{ display:flex; align-items:center; }
@media (max-width:${BREAKPOINT}px){ .nav-desktop{ display:none; } }

.nav-toggle{ border:0; background:transparent; padding:10px; margin-left:auto; display:none; cursor:pointer; line-height:0; }
@media (max-width:${BREAKPOINT}px){ .nav-toggle{ display:inline-flex; } }

.nav-toggle-box{ width:28px; height:20px; position:relative; display:inline-block; }
.nav-toggle-inner, .nav-toggle-inner::before, .nav-toggle-inner::after{
  position:absolute; left:0; width:28px; height:2px; background:#000;
  transition:transform .25s ease, opacity .2s ease, background .2s;
}
.nav-toggle-inner{ top:9px; }
.nav-toggle-inner::before{ content:""; top:-9px; }
.nav-toggle-inner::after{ content:""; top:9px; }
.nav-toggle.is-active .nav-toggle-inner{ transform:rotate(45deg); }
.nav-toggle.is-active .nav-toggle-inner::before{ transform:translateY(9px) rotate(90deg); }
.nav-toggle.is-active .nav-toggle-inner::after{ transform:translateY(-9px) rotate(90deg); opacity:0; }

.mobile-drawer{
  position:fixed; top:var(--hdr-h); left:0; right:0; background:#fff; box-shadow:var(--shadow-lg);
  transform:translateY(-8px); opacity:0; pointer-events:none; transition:transform .2s ease, opacity .2s ease;
  border-top:3px solid var(--lime); z-index:1100;
}
.mobile-drawer.open{ transform:translateY(0); opacity:1; pointer-events:auto; }

.mobile-links{ list-style:none; margin:0; padding:10px 14px; }
.mobile-links li{ border-bottom:1px solid #efefef; }
.mobile-links li:last-child{ border-bottom:none; }
.mobile-links a{ display:block; padding:14px 8px; text-decoration:none; font-weight:700; color:#000; transition:color .2s, background .2s; }
.mobile-links a:hover{ color:#098276; background:rgba(9,130,118,.06); }

.mobile-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.28); opacity:0; pointer-events:none; transition:opacity .2s ease; z-index:1090; }
.mobile-overlay.show{ opacity:1; pointer-events:auto; }

.navbar{ min-height:var(--hdr-h); z-index:1000; }
.navbar .row{ min-height:var(--hdr-h); }

@media (prefers-reduced-motion:reduce){
  .nav-toggle-inner, .nav-toggle-inner::before, .nav-toggle-inner::after, .mobile-drawer, .mobile-overlay{ transition:none; }
}`;
    const style = document.createElement('style');
    style.id = 'hamburger-inline-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // 6) Behavior
  function openMenu(){
    btn.classList.add('is-active');
    btn.setAttribute('aria-expanded','true');
    drawer.hidden = false; overlay.hidden = false;
    requestAnimationFrame(()=>{ drawer.classList.add('open'); overlay.classList.add('show'); });
    drawer.querySelector('a')?.focus();
    document.addEventListener('keydown', onKeydown);
  }
  function closeMenu(){
    btn.classList.remove('is-active');
    btn.setAttribute('aria-expanded','false');
    drawer.classList.remove('open'); overlay.classList.remove('show');
    setTimeout(()=>{ drawer.hidden = true; overlay.hidden = true; }, 180);
    document.removeEventListener('keydown', onKeydown);
    btn.focus();
  }
  function onKeydown(e){ if (e.key === 'Escape') closeMenu(); }

  btn.addEventListener('click', () =>
    (btn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu())
  );
  overlay.addEventListener('click', closeMenu);
  drawer.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });

  // Close if resized to desktop
  const mq = window.matchMedia(`(min-width: ${BREAKPOINT+1}px)`);
  const onChange = e => { if (e.matches && btn.getAttribute('aria-expanded') === 'true') closeMenu(); };
  if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
})();
