import { requireAuth } from './auth.js';
import { getUltimeSpese, filtraPerMese, euro, setBudget, getBudget } from './spese.js';

requireAuth();

(async function(){
  try{
    const spese = await getUltimeSpese(200);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const mese = filtraPerMese(spese, ym);
    const totCat = {};
    mese.forEach(s=>{ totCat[s.categoria] = (totCat[s.categoria] || 0) + Number(s.importo); });

    const ctx = document.getElementById('chartTotali');
    if(ctx){
      new Chart(ctx,{type:'pie',data:{labels:Object.keys(totCat),datasets:[{data:Object.values(totCat)}]},options:{plugins:{legend:{position:'bottom'}}}});
    }

    const ul = document.getElementById('ultimeSpese');
    if(ul){
      ul.innerHTML = spese.slice(0,5).map(s=>`<li class="list-group-item d-flex justify-content-between"><span>${s.data} - ${s.descrizione}</span><span>${euro(s.importo)}</span></li>`).join('');
    }

    let budget = await getBudget(ym);
    renderBudget(budget, totCat);

    document.getElementById('budgetForm')?.addEventListener('submit', async e=>{
      e.preventDefault();
      const cat = document.getElementById('budgetCategoria').value.trim();
      const imp = document.getElementById('budgetImporto').value;
      if(cat && imp){
        await setBudget(cat, imp, ym);
        document.getElementById('budgetCategoria').value='';
        document.getElementById('budgetImporto').value='';
        budget = await getBudget(ym);
        renderBudget(budget, totCat);
      }
    });
  }catch(err){
    console.error(err);
  }
})();

function renderBudget(budget, totCat){
  const div = document.getElementById('budgetStatus');
  if(!div) return;
  const entries = Object.entries(budget || {});
  if(!entries.length){
    div.textContent = 'Nessun budget definito.';
    return;
  }
  div.innerHTML = entries.map(([cat,lim])=>{
    const spent = totCat[cat] || 0;
    const cls = spent > lim ? 'text-danger' : '';
    return `<div class="${cls}">${cat}: ${euro(spent)} / ${euro(lim)}</div>`;
  }).join('');
}
