/**
 * soumission-page.js — F Votre Logo Partout v2
 * Sous-catégories 2 niveaux
 */
(function () {
  'use strict';

  const AJAX = window.soumissionData?.ajaxUrl || '/wp-admin/admin-ajax.php';
  const MIN_PER_COLOR = 12;
  const SIZES = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL'];

  const COLOR_MAP = {
    'black':'#1a1a1a','white':'#f5f5f5','blanc':'#f5f5f5','noir':'#1a1a1a',
    'navy':'#1b3a6e','marine':'#1b3a6e','red':'#c0293a','rouge':'#c0293a',
    'royal':'#3545a8','forest':'#2d6e45','gold':'#e0b920','orange':'#e07820',
    'maroon':'#7a1f3a','purple':'#6b3fa0','ash':'#c8c8c8','grey':'#8a8a8a',
    'sport-grey':'#9a9a9a','graphite-heather':'#555','dark-heather':'#444',
    'carolina-blue':'#4a90c4','irish-green':'#2d8a45','garnet':'#8a1f3a',
    'safety-green':'#7dbf00','safety-orange':'#ff6600','cardinal':'#9b1b30',
    'charcoal':'#3c3c3c','heather':'#b0b0b0','athletic-heather':'#aaa',
    'light-blue':'#87ceeb','kelly-green':'#4caf50','brown':'#795548',
    'sand':'#c2a87a','military-green':'#4a5e38','mint-green':'#98d4b0',
    'platinum':'#e0e0e0','carbon':'#555555','classic-navy':'#1b3a6e',
  };

  const CATEGORIES = {
    'Vedettes': {
      icon: '⭐',
      skus: ['5000','8000','18500','18600','8800','64V00L'],
      sousCats: null
    },
    'Chandails': {
      icon: '👕',
      sousCats: {
        'Tous':             { mots: ['t-shirt','tee','chandail','camisole','tank top','ringer'] },
        'Manches courtes':  { mots: ['short sleeve','short-sleeve','manches courtes'] },
        'Manches longues':  { mots: ['long sleeve','long-sleeve','manches longues'] },
        'Cols en V':        { mots: ['v-neck','v neck','vneck','col en v'] },
        'Cols ronds':       { mots: ['crewneck','crew neck','col rond'] },
        'Performance':      { mots: ['performance','dri-fit','moisture','athletic wear'] },
        'À capuchon':       { mots: ['hooded t-shirt','hooded tee'] },
        'Polyester':        { mots: ['polyester tee','100% polyester','poly t-shirt'] },
        'Baseball':         { mots: ['baseball','raglan'] },
        'Camisoles':        { mots: ['tank top','camisole','sleeveless'] },
        'Femmes':           { mots: ['women','ladies','femme'] },
      }
    },
    'Coton ouatés': {
      icon: '🧥',
      sousCats: {
        'Tous':                  { mots: ['fleece','molleton','sweatshirt'] },
        'Col arrondi':           { mots: ['crewneck fleece','crew fleece','col arrondi','crewneck sweat'] },
        'À capuchon':            { mots: ['hooded fleece','hooded sweatshirt','pullover hood'] },
        'Zip complet':           { mots: ['full zip','full-zip','fermeture éclair complète'] },
        'Zip quart':             { mots: ['quarter zip','quarter-zip','1/4 zip','cadet'] },
        'Haute visibilité':      { mots: ['high visibility','haute visibilité','hi-vis','safety fleece'] },
        'Pantalons molletonnés': { mots: ['sweatpant','fleece pant','pantalon molleton','jogger'] },
      }
    },
    'Hoodies': {
      icon: '🏃',
      sousCats: {
        'Tous':        { mots: ['hoodie','hood','capuche'] },
        'Pullover':    { mots: ['pullover hood','pull-over hood'] },
        'Zip complet': { mots: ['full zip hoodie','zip hoodie','hooded full zip'] },
        'Polyester':   { mots: ['performance hoodie','polyester hoodie','poly hoodie'] },
        'Femmes':      { mots: ["women's hoodie",'ladies hoodie','hoodie femme'] },
      }
    },
    'Polos': {
      icon: '👔',
      sousCats: {
        'Tous':        { mots: ['polo'] },
        'Jersey':      { mots: ['jersey polo'] },
        'Performance': { mots: ['performance polo','sport polo','dri-fit polo'] },
        'Piqué':       { mots: ['pique polo','piqué polo'] },
        'Avec poche':  { mots: ['pocket polo'] },
        'Enfants':     { mots: ['youth polo','kids polo'] },
      }
    },
    'Casquettes': {
      icon: '🧢',
      sousCats: {
        'Toutes':           { mots: ['cap','hat','casquette','toque','beanie','snapback','trucker','visor'] },
        '5 panneaux':       { mots: ['5 panel','5-panel'] },
        '6 panneaux':       { mots: ['6 panel','6-panel'] },
        'Snapback':         { mots: ['snapback'] },
        'Trucker':          { mots: ['trucker','mesh back'] },
        'Toques / Beanies': { mots: ['beanie','toque','knit cap'] },
        'Visières':         { mots: ['visor','visière'] },
        'Camouflage':       { mots: ['camo cap','camouflage cap'] },
      }
    },
    'Pantalons & Shorts': {
      icon: '👖',
      sousCats: {
        'Tous':                  { mots: ['pant','short','pantalon'] },
        'Pantalons molletonnés': { mots: ['sweatpant','fleece pant','jogger pant'] },
        'Shorts':                { mots: ['short','shorts'] },
      }
    },
  };

  const state = {
    product: null,
    colorBlocks: [],
    placement: 'avant-coeur',
    placementPrice: 2.00,
    logoMode: 'has',
    logoFile: null,
    logoRefFile: null,
    logoName: '',
    currentStep: 0,
  };

  let allProducts = [];
  let currentCat = 'Vedettes';
  let currentSousCat = null;

  /* ── Chargement produits ── */
  async function loadAllProducts() {
    try {
      const r = await fetch(AJAX + '?action=flask_proxy&endpoint=produits');
      const j = await r.json();
      if (j.success && j.data?.produits) {
        allProducts = j.data.produits;
        renderCatalogue();
      }
    } catch(e) {
      document.getElementById('som-grid').innerHTML = '<p style="padding:2rem;color:#c0293a;text-align:center">Impossible de charger les produits.</p>';
    }
  }

  function filterProducts(cat, sousCat) {
    const cfg = CATEGORIES[cat];
    if (!cfg) return [];
    if (cfg.skus) {
      const sl = cfg.skus.map(s => s.toLowerCase());
      return allProducts.filter(p => sl.includes((p.sku||'').toLowerCase()));
    }
    if (cfg.sousCats) {
      const keys = Object.keys(cfg.sousCats);
      const sc = sousCat && cfg.sousCats[sousCat] ? sousCat : keys[0];
      const mots = cfg.sousCats[sc].mots;
      return allProducts.filter(p => mots.some(m => (p.nom||'').toLowerCase().includes(m)));
    }
    return [];
  }

  /* ── Rendu catalogue ── */
  function renderCatalogue() {
    document.querySelectorAll('.som-filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === currentCat);
    });
    renderSousCats();
    const products = filterProducts(currentCat, currentSousCat);
    const grid = document.getElementById('som-grid');
    if (!products.length) {
      grid.innerHTML = '<p style="padding:2rem;color:#888;text-align:center;grid-column:1/-1">Aucun produit dans cette catégorie.</p>';
      return;
    }
    grid.innerHTML = products.map((p, i) => {
      const dispo = p.couleurs?.some(c => c.disponible) ?? true;
      const imgHtml = p.image
        ? `<img src="${p.image}" alt="${p.nom}" loading="lazy">`
        : `<div class="som-card__no-img"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      const swatches = (p.couleurs||[]).slice(0,8).map(c => {
        const slug = c.nom.toLowerCase().replace(/\s+/g,'-');
        const hex = COLOR_MAP[slug] || COLOR_MAP[c.nom.toLowerCase()] || '#ccc';
        return `<span class="som-swatch" title="${c.nom}" style="background:${hex}${(slug==='white'||slug==='blanc')?';border:1px solid #ddd':''}"></span>`;
      }).join('') + ((p.couleurs||[]).length > 8 ? `<span class="som-swatch-more">+${(p.couleurs||[]).length-8}</span>` : '');
      return `
        <div class="som-card${!dispo?' som-card--out':''}">
          <div class="som-card__img">
            ${imgHtml}
            <span class="som-card__badge${dispo?' som-card__badge--in':' som-card__badge--out'}">
              <span class="som-card__dot"></span>${dispo?'En stock':'Rupture'}
            </span>
          </div>
          <div class="som-card__body">
            <h3 class="som-card__name">${p.nom}</h3>
            <p class="som-card__sku">SKU : ${p.sku}</p>
            ${swatches?`<div class="som-card__swatches">${swatches}</div>`:''}
            <button class="som-card__btn" type="button" ${!dispo?'disabled':''}
              onclick='SOM.selectProduct(${i},${JSON.stringify(p.nom)},${JSON.stringify(p.sku)},${JSON.stringify(p.image||"")},${JSON.stringify(p.couleurs||[])})'>
              ${dispo?'Demander une soumission':'Indisponible'}
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function renderSousCats() {
    const cfg = CATEGORIES[currentCat];
    let bar = document.getElementById('som-souscats');
    if (!cfg?.sousCats) {
      if (bar) bar.style.display = 'none';
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'som-souscats';
      bar.className = 'som-souscats';
      const filters = document.getElementById('som-filters');
      filters.parentNode.insertBefore(bar, filters.nextSibling);
    }
    bar.style.display = 'flex';
    const sousCats = Object.keys(cfg.sousCats);
    if (!currentSousCat || !cfg.sousCats[currentSousCat]) currentSousCat = sousCats[0];
    bar.innerHTML = sousCats.map(sc =>
      `<button class="som-souscat-btn${sc===currentSousCat?' active':''}" data-souscat="${sc}">${sc}</button>`
    ).join('');
    bar.querySelectorAll('.som-souscat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSousCat = btn.dataset.souscat;
        bar.querySelectorAll('.som-souscat-btn').forEach(b => b.classList.toggle('active', b.dataset.souscat===currentSousCat));
        renderCatalogue();
      });
    });
  }

  function initFilters() {
    document.querySelectorAll('.som-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCat = btn.dataset.cat;
        currentSousCat = null;
        renderCatalogue();
      });
    });
  }

  /* ── Sélection produit ── */
  function selectProduct(idx, name, sku, image, couleurs) {
    state.product = { idx, name, sku, image, couleurs };
    state.colorBlocks = [];
    const formSection = document.getElementById('som-form-section');
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior:'smooth', block:'start' });
    document.getElementById('sel-name').textContent = name;
    document.getElementById('sel-sku').textContent = 'SKU : ' + sku;
    const imgEl = document.getElementById('sel-img');
    imgEl.innerHTML = image ? `<img src="${image}" alt="${name}" style="width:100%;height:100%;object-fit:cover;">` : '';
    state.currentStep = 0;
    goStep(1);
    addColorBlock();
  }

  function resetProduct() {
    state.product = null; state.colorBlocks = [];
    document.getElementById('som-form-section').style.display = 'none';
    document.getElementById('catalogue').scrollIntoView({ behavior:'smooth' });
  }

  /* ── Étapes ── */
  function goStep(step) {
    document.querySelectorAll('.som-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + step).classList.add('active');
    document.querySelectorAll('.som-step').forEach(s => {
      const n = parseInt(s.dataset.step);
      s.classList.toggle('active', n===step);
      s.classList.toggle('done', n<step);
    });
    state.currentStep = step;
    if (step===4) buildRecap();
    document.getElementById('som-steps').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  /* ── Blocs couleur ── */
  function addColorBlock() {
    const couleurs = (state.product?.couleurs||[]).filter(c=>c.disponible);
    const blockId = 'b'+Date.now();
    const block = { id:blockId, color:couleurs[0]?.nom||'', colorHex:'#ccc', quantities:{} };
    SIZES.forEach(s => block.quantities[s]=0);
    state.colorBlocks.push(block);
    renderColorBlocks();
  }

  function removeColorBlock(id) {
    state.colorBlocks = state.colorBlocks.filter(b=>b.id!==id);
    renderColorBlocks(); updateQtySummary();
  }

  function renderColorBlocks() {
    const container = document.getElementById('color-blocks-container');
    const couleurs = (state.product?.couleurs||[]).filter(c=>c.disponible);
    container.innerHTML = state.colorBlocks.map(block => {
      const colorOptions = couleurs.map(c => {
        const slug = c.nom.toLowerCase().replace(/\s+/g,'-');
        const hex = COLOR_MAP[slug]||COLOR_MAP[c.nom.toLowerCase()]||'#ccc';
        return `<option value="${c.nom}" data-hex="${hex}" ${c.nom===block.color?'selected':''}>${c.nom}</option>`;
      }).join('');
      const sizeInputs = SIZES.map(size => `
        <div class="som-size-cell">
          <label class="som-size-label">${size}</label>
          <input type="number" class="som-qty-input" min="0" value="${block.quantities[size]||0}" step="1"
                 oninput="SOM.updateQty('${block.id}','${size}',this.value)">
        </div>`).join('');
      const blockTotal = Object.values(block.quantities).reduce((a,b)=>a+b,0);
      const ok = blockTotal>=MIN_PER_COLOR;
      const hex = COLOR_MAP[(block.color||'').toLowerCase().replace(/\s+/g,'-')]||'#ccc';
      return `
        <div class="som-color-block${ok?' som-color-block--ok':''}" id="block-${block.id}">
          <div class="som-color-block__header">
            <div class="som-color-block__color-select">
              <div class="som-color-preview" id="preview-${block.id}" style="background:${hex}"></div>
              <select class="som-input som-input--color" onchange="SOM.updateColor('${block.id}',this)">${colorOptions}</select>
            </div>
            <div class="som-color-block__total">
              <span id="block-total-${block.id}" class="${ok?'ok':''}">${blockTotal}</span> articles
              ${ok?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--som-green)"><polyline points="20 6 9 17 4 12"/></svg>':'<span style="color:#c0293a;font-size:12px">min. 12</span>'}
            </div>
            ${state.colorBlocks.length>1?`<button class="som-btn-remove" type="button" onclick="SOM.removeColorBlock('${block.id}')" title="Supprimer">×</button>`:''}
          </div>
          <div class="som-size-grid">${sizeInputs}</div>
        </div>`;
    }).join('');
  }

  function updateColor(blockId, select) {
    const block = state.colorBlocks.find(b=>b.id===blockId);
    if (!block) return;
    block.color = select.value;
    const hex = select.options[select.selectedIndex].dataset.hex||'#ccc';
    block.colorHex = hex;
    const preview = document.getElementById('preview-'+blockId);
    if (preview) preview.style.background = hex;
  }

  function updateQty(blockId, size, val) {
    const block = state.colorBlocks.find(b=>b.id===blockId);
    if (!block) return;
    block.quantities[size] = Math.max(0,parseInt(val)||0);
    const blockTotal = Object.values(block.quantities).reduce((a,b)=>a+b,0);
    const ok = blockTotal>=MIN_PER_COLOR;
    const totalEl = document.getElementById('block-total-'+blockId);
    if (totalEl) { totalEl.textContent=blockTotal; totalEl.className=ok?'ok':''; }
    const blockEl = document.getElementById('block-'+blockId);
    if (blockEl) blockEl.classList.toggle('som-color-block--ok',ok);
    updateQtySummary();
  }

  function updateQtySummary() {
    const grandTotal = state.colorBlocks.reduce((sum,b)=>sum+Object.values(b.quantities).reduce((a,c)=>a+c,0),0);
    const allOk = state.colorBlocks.length>0 && state.colorBlocks.every(b=>Object.values(b.quantities).reduce((a,c)=>a+c,0)>=MIN_PER_COLOR);
    document.getElementById('grand-total').textContent = grandTotal;
    const msg = document.getElementById('qty-msg');
    const btn = document.getElementById('btn-next-1');
    if (allOk) { msg.textContent='✓ Toutes les couleurs atteignent le minimum de 12 articles.'; msg.className='som-qty-summary__msg ok'; btn.disabled=false; }
    else { msg.textContent='Chaque couleur doit avoir au moins 12 articles.'; msg.className='som-qty-summary__msg'; btn.disabled=true; }
  }

  function initPlacements() {
    document.querySelectorAll('input[name="placement"]').forEach(r => {
      r.addEventListener('change', () => { state.placement=r.value; state.placementPrice=parseFloat(r.dataset.price)||0; });
    });
  }

  /* ── Logo ── */
  function setLogoMode(mode) {
    state.logoMode = mode;
    document.getElementById('btn-has-logo').classList.toggle('active', mode==='has');
    document.getElementById('btn-no-logo').classList.toggle('active', mode==='no');
    document.getElementById('logo-upload-section').style.display = mode==='has'?'block':'none';
    document.getElementById('logo-designer-section').style.display = mode==='no'?'block':'none';
    document.getElementById('btn-next-2').disabled = mode==='no'?false:!state.logoFile;
  }

  function handleFile(file) {
    document.getElementById('logo-error').style.display='none';
    if (!file) return;
    const name=file.name.toLowerCase();
    const ext=name.slice(name.lastIndexOf('.'));
    if (!['.ai','.svg'].includes(ext)) { showLogoError('Seuls les fichiers .AI et .SVG sont acceptés.'); document.getElementById('logo-input').value=''; return; }
    state.logoFile=file; state.logoName=file.name;
    document.getElementById('dz-idle').style.display='none';
    document.getElementById('dz-success').style.display='flex';
    document.getElementById('dz-filename').textContent=file.name;
    document.getElementById('dropzone').classList.add('success');
    document.getElementById('btn-next-2').disabled=false;
    if (ext==='.svg'||file.type==='image/svg+xml') {
      const reader=new FileReader();
      reader.onload=e=>{const c=e.target.result;if(!c.includes('<script')){document.getElementById('svg-preview').innerHTML=c;document.getElementById('svg-preview-box').style.display='block';}};
      reader.readAsText(file);
    }
  }

  function handleRefFile(file) {
    if (!file) return;
    state.logoRefFile = file;
    const refSuccess = document.getElementById('ref-success');
    const refIdle = document.getElementById('ref-idle');
    const refFilename = document.getElementById('ref-filename');
    if (refFilename) refFilename.textContent = file.name;
    if (refSuccess) refSuccess.style.display='flex';
    if (refIdle) refIdle.style.display='none';
    document.getElementById('btn-next-2').disabled = false;
  }

  function clearLogo() {
    state.logoFile=null; state.logoName='';
    document.getElementById('logo-input').value='';
    document.getElementById('dz-idle').style.display='flex';
    document.getElementById('dz-success').style.display='none';
    document.getElementById('dropzone').classList.remove('success');
    document.getElementById('svg-preview-box').style.display='none';
    document.getElementById('svg-preview').innerHTML='';
    document.getElementById('btn-next-2').disabled=true;
  }

  function dragOver(e) { e.preventDefault(); document.getElementById('dropzone').classList.add('drag-over'); }
  function dragLeave() { document.getElementById('dropzone').classList.remove('drag-over'); }
  function dropFile(e) {
    e.preventDefault(); dragLeave();
    const file=e.dataTransfer.files[0];
    if (file){const dt=new DataTransfer();dt.items.add(file);document.getElementById('logo-input').files=dt.files;handleFile(file);}
  }
  function showLogoError(msg) { const el=document.getElementById('logo-error');el.textContent=msg;el.style.display='block'; }

  /* ── Récap ── */
  function buildRecap() {
    syncHidden();
    const container=document.getElementById('som-recap');
    const blocksHtml=state.colorBlocks.map(b=>{
      const total=Object.values(b.quantities).reduce((a,c)=>a+c,0);
      const sizes=SIZES.filter(s=>b.quantities[s]>0).map(s=>`${b.quantities[s]}×${s}`).join(', ');
      const hex=COLOR_MAP[(b.color||'').toLowerCase().replace(/\s+/g,'-')]||'#ccc';
      return `<div class="som-recap-color"><span class="som-recap-swatch" style="background:${hex}"></span><strong>${b.color}</strong> — ${total} articles (${sizes})</div>`;
    }).join('');
    const placementLabel=document.querySelector('.som-placement-card:has(input:checked) .som-placement-card__label')?.textContent||state.placement;
    const logoInfo=state.logoMode==='has'?(state.logoName||'—'):'📐 Service designer demandé';
    const grandTotal=state.colorBlocks.reduce((s,b)=>s+Object.values(b.quantities).reduce((a,c)=>a+c,0),0);
    container.innerHTML=`
      <div class="som-recap-section"><h4>🛍 Produit</h4><p>${state.product?.name||'—'} <span style="color:#888">(SKU: ${state.product?.sku||'—'})</span></p></div>
      <div class="som-recap-section"><h4>📏 Quantités & couleurs</h4>${blocksHtml}<p style="margin-top:8px"><strong>Total : ${grandTotal} articles</strong></p><p>Emplacement : ${placementLabel}</p></div>
      <div class="som-recap-section"><h4>🎨 Logo</h4><p>${logoInfo}</p></div>
      <div class="som-recap-section"><h4>👤 Coordonnées</h4>
        <p>${document.getElementById('f-prenom').value} ${document.getElementById('f-nom').value}${document.getElementById('f-entreprise').value?' — '+document.getElementById('f-entreprise').value:''}</p>
        <p>📧 ${document.getElementById('f-email').value} · 📞 ${document.getElementById('f-tel').value}</p>
        <p>Préférence : ${document.querySelector('input[name="pref_contact"]:checked')?.value||''}${document.getElementById('f-moment').value?' · '+document.getElementById('f-moment').value:''}</p>
      </div>`;
  }

  function syncHidden() {
    document.getElementById('h-product-name').value=state.product?.name||'';
    document.getElementById('h-product-sku').value=state.product?.sku||'';
    document.getElementById('h-color-blocks').value=JSON.stringify(state.colorBlocks);
    document.getElementById('h-placement').value=state.placement;
    document.getElementById('h-total-qty').value=state.colorBlocks.reduce((s,b)=>s+Object.values(b.quantities).reduce((a,c)=>a+c,0),0);
    document.getElementById('h-logo-mode').value=state.logoMode;
    document.getElementById('h-prenom').value=document.getElementById('f-prenom').value;
    document.getElementById('h-nom').value=document.getElementById('f-nom').value;
    document.getElementById('h-email').value=document.getElementById('f-email').value;
    document.getElementById('h-tel').value=document.getElementById('f-tel').value;
    document.getElementById('h-entreprise').value=document.getElementById('f-entreprise').value;
    document.getElementById('h-pref-contact').value=document.querySelector('input[name="pref_contact"]:checked')?.value||'';
    document.getElementById('h-moment').value=document.getElementById('f-moment').value;
    document.getElementById('h-message').value=document.getElementById('f-message').value;
    document.getElementById('h-logo-notes').value=document.getElementById('logo-notes')?.value||'';
    document.getElementById('h-logo-description').value=document.getElementById('logo-description')?.value||'';
  }

  /* ── Form submit ── */
  function initForm() {
    const form=document.getElementById('som-form');
    if (!form) return;
    form.addEventListener('submit',async e=>{
      e.preventDefault(); syncHidden();
      const prenom=document.getElementById('f-prenom').value.trim();
      const nom=document.getElementById('f-nom').value.trim();
      const email=document.getElementById('f-email').value.trim();
      const tel=document.getElementById('f-tel').value.trim();
      if (!prenom||!nom||!email||!tel){alert('Veuillez remplir tous les champs obligatoires.');goStep(3);return;}
      if (state.logoMode==='no'&&!document.getElementById('logo-description').value.trim()){alert('Veuillez décrire votre logo.');goStep(2);return;}
      const btn=document.getElementById('btn-submit');
      btn.innerHTML='<span>Envoi en cours…</span>';btn.disabled=true;
      const fd=new FormData(form);
      if (state.logoFile) fd.set('logo_file',state.logoFile,state.logoFile.name);
      if (state.logoRefFile) fd.set('logo_ref_file',state.logoRefFile,state.logoRefFile.name);
      try {
        const r=await fetch(form.action,{method:'POST',body:fd});
        const data=await r.json();
        if (data.success){
          document.querySelectorAll('.som-panel').forEach(p=>p.classList.remove('active'));
          document.getElementById('panel-5').classList.add('active');
          if (data.data?.ref) document.getElementById('conf-ref').textContent='Référence : '+data.data.ref;
        } else {alert(data.data?.message||'Une erreur est survenue.');btn.innerHTML='<span>Envoyer ma demande de soumission</span>';btn.disabled=false;}
      } catch(err){alert('Erreur de connexion.');btn.innerHTML='<span>Envoyer ma demande de soumission</span>';btn.disabled=false;}
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    loadAllProducts(); initFilters(); initPlacements(); initForm();
  });

  window.SOM={selectProduct,resetProduct,goStep,addColorBlock,removeColorBlock,updateColor,updateQty,setLogoMode,handleFile,handleRefFile,clearLogo,dragOver,dragLeave,dropFile,buildRecap};

})();
