import { emailSignup, bounceIfLogged } from './auth.js';

bounceIfLogged();

const form = document.getElementById('signupForm');
const msg  = document.getElementById('msg');

form?.addEventListener('submit', async e => {
  e.preventDefault();
  msg.innerHTML = '';
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;
  try{
    await emailSignup(email, pass);
    location.href = 'index.html';
  }catch(err){
    msg.innerHTML = `<div class="alert alert-danger" role="alert">${err.message}</div>`;
  }
});
