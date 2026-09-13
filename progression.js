(() => {
 const comparison=document.getElementById('compare');
 const slider=document.getElementById('reveal');
 const notes={entrance:'The trailhead shows the shared composition: a winding path, a distant dome, and lanterns that establish the route.',approach:'The approach makes the material changes easiest to see: the path, the banks, the foliage, and the home ahead.',courtyard:'At the courtyard, compare the observatory’s silhouette, surface scale, masonry, and light around the entrance.',threshold:'At the door, compare the original simple vestibule with the textured surfaces and the corrected circular floor.'};
 const names={entrance:'trailhead',approach:'observatory approach',courtyard:'courtyard',threshold:'open doorway and greeting'};
 function reveal(value){value=Math.max(0,Math.min(100,Number(value)));slider.value=value;comparison.style.setProperty('--split',value+'%');slider.setAttribute('aria-valuetext',`${Math.round(value)}% original, ${Math.round(100-value)}% refined`);document.querySelectorAll('[data-reveal]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.reveal)===value?'true':'false'));}
 slider.addEventListener('input',()=>reveal(slider.value));
 document.querySelectorAll('[data-reveal]').forEach(button=>button.addEventListener('click',()=>reveal(button.dataset.reveal)));
 document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>{const view=button.dataset.view;comparison.dataset.view=view;document.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));comparison.querySelector('.before').setAttribute('aria-label','Version 1: original '+names[view]);comparison.querySelector('.after').setAttribute('aria-label','Version 2: refined '+names[view]);document.getElementById('view-note').textContent=notes[view];}));
 let dragging=false;
 const move=e=>{const r=comparison.getBoundingClientRect();reveal((e.clientX-r.left)/r.width*100)};
 comparison.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;comparison.setPointerCapture(e.pointerId);move(e)});
 comparison.addEventListener('pointermove',e=>{if(dragging)move(e)});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])comparison.addEventListener(event,()=>dragging=false);
 reveal(50);
})();
