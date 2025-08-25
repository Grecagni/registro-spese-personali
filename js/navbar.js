import { logout } from "./auth.js";

async function loadNavbar(){
  const container = document.getElementById('navbar');
  if(!container) return;
  const res = await fetch('partials/navbar.html');
  container.innerHTML = await res.text();

  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  container.querySelectorAll('a[data-page]').forEach(a=>{
    if(a.getAttribute('data-page')===file) a.classList.add('fw-bold','text-decoration-underline');
  });
  container.querySelector('#logoutLink')?.addEventListener('click',e=>{e.preventDefault();logout();});
}

loadNavbar();

