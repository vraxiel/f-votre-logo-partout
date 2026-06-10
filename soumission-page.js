/**
 * soumission-page.js — F Votre Logo Partout v7
 * Flow :
 *   Modale  → choix couleur
 *   Panel 1 → Logo + emplacements
 *   Panel 2 → Quantités par couleur × taille + compteur impressions
 *   Panel 3 → Coordonnées
 *   Panel 4 → Récapitulatif + envoi
 *   Panel 5 → Confirmation
 */
(function () {
  'use strict';

  const AJAX = window.soumissionData?.ajaxUrl || '/wp-admin/admin-ajax.php';
  const MIN_IMPRESSIONS = 12;
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

  const COLOR_NAME_FR = {
    'black':'Noir','white':'Blanc','blanc':'Blanc','noir':'Noir',
    'navy':'Marine','marine':'Marine','red':'Rouge','rouge':'Rouge',
    'royal':'Bleu royal','forest':'Vert forêt','gold':'Or','orange':'Orange',
    'maroon':'Bordeaux','purple':'Mauve','ash':'Gris cendré','grey':'Gris',
    'gray':'Gris','sport-grey':'Gris sport','graphite-heather':'Graphite chiné',
    'dark-heather':'Gris foncé chiné','carolina-blue':'Bleu Carolina',
    'irish-green':'Vert irlandais','garnet':'Grenat','safety-green':'Vert sécurité',
    'safety-orange':'Orange sécurité','cardinal':'Cardinal','charcoal':'Charbon',
    'heather':'Chiné','athletic-heather':'Gris athlétique chiné',
    'light-blue':'Bleu ciel','kelly-green':'Vert Kelly','brown':'Brun',
    'sand':'Sable','military-green':'Vert militaire','mint-green':'Vert menthe',
    'platinum':'Platine','carbon':'Carbone','classic-navy':'Marine classique',
    'antique-cherry-red':'Rouge cerise antique','antique-heliconia':'Hélicoïne antique',
    'antique-irish-green':'Vert irlandais antique','antique-orange':'Orange antique',
    'antique-royal':'Bleu royal antique','antique-sapphire':'Saphir antique',
    'antique-cherry':'Cerise antique','cherry-red':'Rouge cerise',
    'daisy':'Jaune marguerite','heliconia':'Hélicoïne','indigo-blue':'Bleu indigo',
    'iris':'Iris','jade-dome':'Dôme jade','kiwi':'Kiwi','lime':'Lime',
    'natural':'Naturel','pink':'Rose','raspberry':'Framboise','sapphire':'Saphir',
    'smoke':'Fumée','sport-dark-navy':'Marine foncé sport','tangerine':'Tangerine',
    'tropical-blue':'Bleu tropical','tweed':'Tweed','violet':'Violet',
    'yellow-haze':'Jaune brume','azalea':'Azalée','berry':'Baie',
    'cherry-blossom':'Fleur de cerisier','cornsilk':'Cornsilk','denim':'Denim',
    'heather-red':'Rouge chiné','heather-military-green':'Vert militaire chiné',
    'heather-navy':'Marine chiné','heather-royal':'Bleu royal chiné',
    'ice-grey':'Gris glace','light-pink':'Rose pâle','metallic-gold':'Or métallique',
    'mint':'Menthe','old-gold':'Or ancien','peacock':'Paon','pepper':'Poivre',
    'pistachio':'Pistache','red-orange':'Rouge-orange','silver':'Argent',
    'slate':'Ardoise','sport-scarlet-red':'Rouge écarlate sport','storm':'Orage',
    'tan':'Beige','true-navy':'Marine vrai','true-royal':'Bleu royal vrai',
  };

  function getNomCouleurFR(nom) {
    if (!nom) return '';
    const slug = nom.toLowerCase().replace(/\s+/g, '-');
    return COLOR_NAME_FR[slug] || COLOR_NAME_FR[nom.toLowerCase()] || nom;
  }

  function getColorHex(nom) {
    if (!nom) return '#ccc';
    const slug = nom.toLowerCase().replace(/\s+/g, '-');
    return COLOR_MAP[slug] || COLOR_MAP[nom.toLowerCase()] || '#ccc';
  }

  window.SOM_COLOR_MAP = COLOR_MAP;

  /* ── État global ── */
  let CATEGORIES    = [];
  let currentCat    = null;
  let currentSousCat = null;
  let allProducts   = [];
  let currentPage   = 1;
  let perPage       = 24;
  let searchQuery   = '';
  let modalProduit  = null;

  const panier = [];
  let panierItemEnCours = null;

  const PLACEMENTS_DTF = [
    { value:'avant-coeur-petit',  label:'Avant — Coeur',   size:'Zone max 4" x 2,5"',  price:2.00,  zone:'coeur' },
    { value:'avant-coeur',        label:'Avant — Coeur',   size:'Zone max 4" x 4"',    price:2.00,  zone:'coeur' },
    { value:'avant-centre-petit', label:'Avant — Centre',  size:'Zone max 6" x 6"',    price:2.25,  zone:'centre' },
    { value:'avant-centre-grand', label:'Avant — Centre',  size:'Zone max 11" x 11"',  price:7.00,  zone:'centre' },
    { value:'avant-centre-max',   label:'Avant — Centre',  size:'Zone max 14" x 14"',  price:11.40, zone:'centre' },
    { value:'arriere-petit',      label:'Arriere',          size:'Zone max 11" x 6,5"', price:3.75,  zone:'arriere' },
    { value:'arriere',            label:'Arriere',          size:'Zone max 11" x 11"',  price:6.60,  zone:'arriere' },
    { value:'arriere-max',        label:'Arriere',          size:'Zone max 14" x 14"',  price:11.40, zone:'arriere' },
    { value:'manche-gauche-petit', label:'Manche gauche', size:'Zone max 11" x 2"',   price:2.00,  zone:'manche-gauche' },
    { value:'manche-gauche-grand', label:'Manche gauche', size:'Zone max 11" x 3,5"', price:2.75,  zone:'manche-gauche' },
    { value:'manche-droite-petit', label:'Manche droite', size:'Zone max 11" x 2"',   price:2.00,  zone:'manche-droite' },
    { value:'manche-droite-grand', label:'Manche droite', size:'Zone max 11" x 3,5"', price:2.75,  zone:'manche-droite' },
    { value:'autre-dtf',          label:'Autre',            size:'Sur mesure',                price:0,     zone:'autre' },
  ];

  const PLACEMENTS_PATCH = [
    { value:'patch-petit', label:'Patch cuir', size:'2,25" × 1,85"', price:7.30,  zone:'coeur' },
    { value:'patch-grand', label:'Patch cuir', size:'3" × 2,5"',     price:13.50, zone:'coeur' },
  ];

  /* ══════════════════════════════════════
     CATALOGUE
  ══════════════════════════════════════ */

  async function loadCategories() {
    try {
      const r = await fetch(AJAX + '?action=flask_proxy&endpoint=categories-menu');
      const j = await r.json();
      if (j.success && Array.isArray(j.data)) CATEGORIES = j.data;
    } catch(e) { CATEGORIES = []; }
    if (CATEGORIES.length > 0) currentCat = CATEGORIES[0].label;
    buildFilterBar();
  }

  function buildFilterBar() {
    const filtersEl = document.getElementById('som-filters');
    if (!filtersEl) return;
    if (!document.getElementById('som-search-bar')) {
      const sb = document.createElement('div');
      sb.id = 'som-search-bar'; sb.className = 'som-search-bar';
      sb.innerHTML = `<div class="som-search-wrap">
        <svg class="som-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="som-search-input" class="som-search-input" placeholder="Rechercher un produit, SKU…" oninput="SOM.setSearch(this.value)">
        <button class="som-search-clear" id="som-search-clear" onclick="SOM.clearSearch()" style="display:none">×</button>
      </div>`;
      filtersEl.parentNode.insertBefore(sb, filtersEl);
    }
    filtersEl.innerHTML = CATEGORIES.map(cat =>
      `<button class="som-filter-btn" data-cat="${cat.label}">${cat.label}</button>`
    ).join('');
    filtersEl.querySelectorAll('.som-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCat = btn.dataset.cat; currentSousCat = null; currentPage = 1;
        filtersEl.querySelectorAll('.som-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCat));
        renderSousCats(); renderCatalogue();
      });
    });
    const activeBtn = filtersEl.querySelector(`[data-cat="${currentCat}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    renderSousCats();
  }

  async function loadAllProducts() {
    try {
      const r = await fetch(AJAX + '?action=flask_proxy&endpoint=produits');
      const j = await r.json();
      if (j.success && j.data) {
        allProducts = Array.isArray(j.data) ? j.data : (j.data.produits || []);
        renderCatalogue();
      }
    } catch(e) {
      const grid = document.getElementById('som-grid');
      if (grid) grid.innerHTML = '<p style="padding:2rem;color:#c0293a;text-align:center">Impossible de charger les produits.</p>';
    }
  }

  function getCatConfig(label) { return CATEGORIES.find(c => c.label === label) || null; }

  function filterProducts(catLabel, sousCatLabel) {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return allProducts.filter(p =>
        (p.nom||'').toLowerCase().includes(q) ||
        (p.sku||'').toLowerCase().includes(q) ||
        (p.nom_original||'').toLowerCase().includes(q)
      );
    }
    const cfg = getCatConfig(catLabel);
    if (!cfg) return [];
    if (cfg.type === 'skus' && cfg.skus) {
      const sl = cfg.skus.map(s => s.toLowerCase());
      return allProducts.filter(p => sl.includes((p.sku||'').toLowerCase()));
    }
    if (cfg.type === 'catalogue' && cfg.cat_parent) {
      let sousCatEnfant = null;
      if (sousCatLabel && cfg.sous_cats) {
        const sc = cfg.sous_cats.find(s => s.label === sousCatLabel);
        sousCatEnfant = sc ? sc.cat_enfant : null;
      } else if (cfg.sous_cats && cfg.sous_cats.length > 0) {
        sousCatEnfant = cfg.sous_cats[0].cat_enfant;
      }
      return allProducts.filter(p => {
        const parents = Array.isArray(p.cat_parent) ? p.cat_parent : [p.cat_parent];
        const enfants = Array.isArray(p.cat_enfant) ? p.cat_enfant : [p.cat_enfant];
        if (!parents.includes(cfg.cat_parent)) return false;
        if (sousCatEnfant === null) return true;
        return enfants.includes(sousCatEnfant);
      });
    }
    return [];
  }

  function renderCatalogue() {
    const products = filterProducts(currentCat, currentSousCat);
    const grid = document.getElementById('som-grid');
    if (!grid) return;
    if (!products.length) {
      grid.innerHTML = '<p style="padding:2rem;color:#888;text-align:center;grid-column:1/-1">Aucun produit dans cette catégorie.</p>';
      renderPagination(0); return;
    }
    const totalPages = Math.ceil(products.length / perPage);
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * perPage;
    const paginated = products.slice(start, start + perPage);
    renderPagination(products.length);
    grid.innerHTML = paginated.map(p => {
      const dispo = p.couleurs?.some(c => c.disponible) ?? true;
      const imgHtml = p.image
        ? `<img src="${p.image}" alt="${p.nom}" loading="lazy">`
        : `<div class="som-card__no-img"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      const swatches = (p.couleurs||[]).slice(0,8).map(c => {
        const img = c.images?.[0]||'';
        return `<span class="som-swatch" title="${c.nom}" style="background:#f5f5f5;overflow:hidden;display:inline-block;">${img?`<img src="${img}" alt="${c.nom}" style="width:100%;height:100%;object-fit:cover;">`:''}   </span>`;
      }).join('') + ((p.couleurs||[]).length > 8 ? `<span class="som-swatch-more">+${(p.couleurs||[]).length-8}</span>` : '');
      const idx = allProducts.indexOf(p);
      const dejaDans = panier.some(item => item.idx === idx);
      return `
        <div class="som-card${!dispo?' som-card--out':''}" style="cursor:pointer;" onclick='SOM.openModalIdx(${idx})'>
          <div class="som-card__img">
            ${imgHtml}
            <span class="som-card__badge${dispo?' som-card__badge--in':' som-card__badge--out'}">
              <span class="som-card__dot"></span>${dispo?'En stock':'Rupture'}
            </span>
            ${dejaDans?'<span class="som-card__badge som-card__badge--panier" style="top:10px;left:10px;right:auto;background:rgba(201,168,76,0.9);color:#111">✓ Ajouté</span>':''}
          </div>
          <div class="som-card__body">
            <h3 class="som-card__name">${p.nom}</h3>
            <p class="som-card__sku">SKU : ${p.sku}</p>
            ${swatches?`<div class="som-card__swatches">${swatches}</div>`:''}
            <button class="som-card__btn" type="button" ${!dispo?'disabled':''} onclick='event.stopPropagation();SOM.openModalIdx(${idx})'>
              ${dispo?'Voir les couleurs →':'Indisponible'}
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function renderPagination(total) {
    let top = document.getElementById('som-pagination-top');
    if (!top) {
      top = document.createElement('div'); top.id='som-pagination-top'; top.className='som-pagination som-pagination--top';
      const grid=document.getElementById('som-grid'); grid.parentNode.insertBefore(top,grid);
    }
    let bot = document.getElementById('som-pagination');
    if (!bot) {
      bot = document.createElement('div'); bot.id='som-pagination'; bot.className='som-pagination';
      const grid=document.getElementById('som-grid'); grid.parentNode.insertBefore(bot,grid.nextSibling);
    }
    if (total===0) { top.innerHTML=''; bot.innerHTML=''; return; }
    const totalPages = Math.ceil(total/perPage);
    const opts = [24,48,96].map(n=>`<option value="${n}" ${perPage===n?'selected':''}>${n} par page</option>`).join('');
    let pages='';
    for (let i=1;i<=totalPages;i++) {
      if (i===1||i===totalPages||(i>=currentPage-2&&i<=currentPage+2))
        pages+=`<button class="som-page-btn${i===currentPage?' active':''}" onclick="SOM.goPage(${i})">${i}</button>`;
      else if (i===currentPage-3||i===currentPage+3)
        pages+=`<span class="som-page-ellipsis">…</span>`;
    }
    const html=`
      <div class="som-pagination__info">${total} produit${total>1?'s':''}</div>
      <div class="som-pagination__pages">
        <button class="som-page-btn" onclick="SOM.goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>←</button>
        ${pages}
        <button class="som-page-btn" onclick="SOM.goPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>→</button>
      </div>
      <div class="som-pagination__perpage">
        <select class="som-perpage-select" onchange="SOM.setPerPage(parseInt(this.value))">${opts}</select>
      </div>`;
    top.innerHTML=html; bot.innerHTML=html;
  }

  function goPage(page) {
    const products=filterProducts(currentCat,currentSousCat);
    const totalPages=Math.ceil(products.length/perPage);
    if (page<1||page>totalPages) return;
    currentPage=page; renderCatalogue();
    document.getElementById('catalogue')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function setPerPage(n) { perPage=n; currentPage=1; renderCatalogue(); }

  function renderSousCats() {
    const cfg=getCatConfig(currentCat);
    let bar=document.getElementById('som-souscats');
    if (!cfg||!cfg.sous_cats||cfg.sous_cats.length===0) { if(bar) bar.style.display='none'; return; }
    if (!bar) {
      bar=document.createElement('div'); bar.id='som-souscats'; bar.className='som-souscats';
      const filters=document.getElementById('som-filters');
      filters.parentNode.insertBefore(bar,filters.nextSibling);
    }
    bar.style.display='flex';
    if (!currentSousCat||!cfg.sous_cats.find(s=>s.label===currentSousCat))
      currentSousCat=cfg.sous_cats[0].label;
    bar.innerHTML=cfg.sous_cats.map(sc=>
      `<button class="som-souscat-btn${sc.label===currentSousCat?' active':''}" data-souscat="${sc.label}">${sc.label}</button>`
    ).join('');
    bar.querySelectorAll('.som-souscat-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        currentSousCat=btn.dataset.souscat; currentPage=1;
        bar.querySelectorAll('.som-souscat-btn').forEach(b=>b.classList.toggle('active',b.dataset.souscat===currentSousCat));
        renderCatalogue();
      });
    });
  }

  /* ══════════════════════════════════════
     MODALE PRODUIT
  ══════════════════════════════════════ */

  function openModalIdx(idx) {
    const p=allProducts[idx];
    if (p) openModal(idx,p.nom,p.sku,p.image||'',p.couleurs||[],p.tailles||[]);
  }

  function openModal(idx,name,sku,image,couleurs,tailles) {
    modalProduit={idx,name,sku,image,couleurs,tailles:tailles||[]};
    document.getElementById('modal-nom').textContent=name;
    document.getElementById('modal-sku').textContent='SKU : '+sku;
    const premiereDispo=couleurs.find(c=>c.disponible)||couleurs[0];
    renderModalCouleur(premiereDispo);
    renderModalSwatches(couleurs,premiereDispo);
    document.getElementById('som-modal-overlay').classList.add('active');
    document.body.style.overflow='hidden';
  }

  function closeModal(e) {
    if (e&&e.target!==document.getElementById('som-modal-overlay')) return;
    document.getElementById('som-modal-overlay').classList.remove('active');
    document.body.style.overflow='';
  }

  function renderModalCouleur(couleur) {
    const imgs=couleur?.images||[];
    const mainEl=document.getElementById('modal-main-img');
    const thumbsEl=document.getElementById('modal-thumbs');
    if (imgs.length) {
      mainEl.innerHTML=`<img src="${imgs[0]}" alt="">`;
      thumbsEl.innerHTML=imgs.map((url,i)=>
        `<div class="som-modal__thumb${i===0?' active':''}" onclick="SOM.setMainImg(this,'${url}')"><img src="${url}" alt=""></div>`
      ).join('');
    } else {
      mainEl.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555">Aucune image</div>`;
      thumbsEl.innerHTML='';
    }
    const couleurEl=document.getElementById('modal-couleur-nom');
    if (couleurEl) couleurEl.textContent=getNomCouleurFR(couleur?.nom||'');
    const dispo=document.getElementById('modal-dispo');
    dispo.innerHTML=couleur?.disponible
      ?'<span style="color:#5aaa5a;font-weight:500">En stock</span>'
      :'<span style="color:#cc4444;font-weight:500">Rupture de stock</span>';
  }

  function renderModalSwatches(couleurs,active) {
    document.getElementById('modal-swatches').innerHTML=couleurs.map(c=>{
      const img=c.images?.[0]||'';
      return `<div class="som-modal__swatch${c.nom===active?.nom?' active':''}${!c.disponible?' som-modal__swatch--out':''}"
        title="${c.nom}" onclick="SOM.selectSwatch(this.title)" style="background:#f5f5f5;overflow:hidden;">
        ${img?`<img src="${img}" alt="${c.nom}" style="width:100%;height:100%;object-fit:cover;">`:''}
      </div>`;
    }).join('');
  }

  function selectSwatch(nomCouleur) {
    if (!modalProduit) return;
    const couleur=modalProduit.couleurs.find(c=>c.nom===nomCouleur);
    if (!couleur) return;
    renderModalCouleur(couleur);
    document.querySelectorAll('.som-modal__swatch').forEach(s=>s.classList.toggle('active',s.title===nomCouleur));
  }

  function setMainImg(thumbEl,url) {
    document.getElementById('modal-main-img').innerHTML=`<img src="${url}" alt="">`;
    document.querySelectorAll('.som-modal__thumb').forEach(t=>t.classList.remove('active'));
    thumbEl.classList.add('active');
  }

  /* ══════════════════════════════════════
     CHOIX PRODUIT DEPUIS MODALE
  ══════════════════════════════════════ */

  function choisirProduit() {
    if (!modalProduit) return;
    const couleurActive=document.querySelector('.som-modal__swatch.active');
    const selectedColor=couleurActive?couleurActive.title:null;
    const couleurObj=selectedColor?modalProduit.couleurs.find(c=>c.nom===selectedColor):null;
    const imgSrc=couleurObj?.images?.[0]||modalProduit.image;

    panierItemEnCours = {
      id: 'item-'+Date.now(),
      idx: modalProduit.idx,
      name: modalProduit.name,
      sku: modalProduit.sku,
      image: imgSrc,
      couleurs: modalProduit.couleurs,
      tailles: modalProduit.tailles||[],
      selectedColor: selectedColor,
      designs: [],
      colorBlocks: [],
    };

    // Initialiser un bloc couleur avec la couleur choisie dans la modale
    const block = {
      id: 'b'+Date.now(),
      color: selectedColor || (modalProduit.couleurs.find(c=>c.disponible)?.nom || ''),
      quantities: {}
    };
    getTaillesProduit(panierItemEnCours, block.color).forEach(s => block.quantities[s]=0);
    panierItemEnCours.colorBlocks = [block];

    closeModal();
    document.body.style.overflow='';

    const formSection=document.getElementById('som-form-section');
    formSection.style.display='block';
    document.getElementById('sel-name').textContent=panierItemEnCours.name;
    document.getElementById('sel-sku').textContent='SKU : '+panierItemEnCours.sku;
    const imgEl=document.getElementById('sel-img');
    imgEl.innerHTML=panierItemEnCours.image?`<img src="${panierItemEnCours.image}" alt="${panierItemEnCours.name}" style="width:100%;height:100%;object-fit:cover;">`:'';

    // Démarrer au panel 1 (logo)
    if (panierItemEnCours.designs.length===0) addDesign();
    goStep(1);
    formSection.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function retourCatalogue() {
    panierItemEnCours=null;
    document.getElementById('som-form-section').style.display='none';
    document.getElementById('catalogue').scrollIntoView({behavior:'smooth'});
  }

  /* ── Étapes ── */
  function goStep(step) {
    document.querySelectorAll('.som-panel').forEach(p=>p.classList.remove('active'));
    const panel=document.getElementById('panel-'+step);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.som-step').forEach(s=>{
      const n=parseInt(s.dataset.step);
      s.classList.toggle('active',n===step);
      s.classList.toggle('done',n<step);
    });
    if (step===1) renderDesigns();
    if (step===2) { renderColorBlocks(); updateP2Summary(); }
    if (step===4) buildRecap();
    document.getElementById('som-steps')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  /* ══════════════════════════════════════
     PANEL 1 — LOGO + EMPLACEMENTS
  ══════════════════════════════════════ */

  function addDesign() {
    if (!panierItemEnCours) return;
    panierItemEnCours.designs.push({
      id: 'design-'+Date.now(),
      type: 'dtf',
      positions: [],
      logoFile: null,
      logoName: '',
      logoVectoriel: false,
      notes: '',
    });
    renderDesigns();
  }

  function removeDesign(designId) {
    if (!panierItemEnCours) return;
    panierItemEnCours.designs=panierItemEnCours.designs.filter(d=>d.id!==designId);
    renderDesigns(); updateDecoValidation();
  }

  function updateDesignType(designId,type) {
    if (!panierItemEnCours) return;
    const d=panierItemEnCours.designs.find(d=>d.id===designId);
    if (!d) return;
    d.type=type; d.positions=[];
    renderDesigns(); updateDecoValidation();
  }

  function togglePosition(designId,posValue) {
    if (!panierItemEnCours) return;
    const d=panierItemEnCours.designs.find(d=>d.id===designId);
    if (!d) return;
    const placements = d.type==='patch' ? PLACEMENTS_PATCH : PLACEMENTS_DTF;
    // Trouver la zone de cet emplacement
    const placement = placements.find(function(p){return p.value===posValue;});
    const zone = placement ? placement.zone : null;
    if (d.positions.includes(posValue)) {
      // Decocher
      d.positions = d.positions.filter(function(p){return p!==posValue;});
    } else {
      // Cocher — retirer les autres emplacements de la meme zone
      if (zone) {
        const sameZone = placements.filter(function(p){return p.zone===zone;}).map(function(p){return p.value;});
        d.positions = d.positions.filter(function(p){return !sameZone.includes(p);});
      }
      d.positions.push(posValue);
    }
    renderDesigns();
    updateDecoValidation();
  }

  function renderDesigns() {
    const container=document.getElementById('som-designs-container');
    if (!container||!panierItemEnCours) return;
    if (panierItemEnCours.designs.length===0) {
      container.innerHTML=`<div class="som-deco-empty"><p>Aucun design ajouté.</p></div>`;
      updateDecoValidation(); return;
    }
    container.innerHTML=panierItemEnCours.designs.map((design,idx)=>{
      const placements=design.type==='patch'?PLACEMENTS_PATCH:PLACEMENTS_DTF;
      const n=design.positions.length;
      const positionsHtml=placements.map(p=>{
        const checked=design.positions.includes(p.value);
        return `<label class="som-placement-card${checked?' som-placement-card--checked':''}"
          data-design="${design.id}" data-pos="${p.value}">
          <input type="checkbox" ${checked?'checked':''} onchange="SOM.togglePosition('${design.id}','${p.value}')">
          <span class="som-placement-card__label">${p.label}</span>
          <span class="som-placement-card__size">${p.size}</span>
          ${p.price>0?`<span class="som-placement-card__price">${p.price.toFixed(2)}$/article</span>`:'<span class="som-placement-card__price">À confirmer</span>'}
        </label>`;
      }).join('');
      return `
        <div class="som-design-block" id="design-${design.id}">
          <div class="som-design-block__header">
            <div class="som-design-block__num">Design ${idx+1}</div>
            <span id="deco-pos-count-${design.id}" class="som-deco-counter${n>0?' ok':''}">
              ${n} position${n>1?'s':''}
            </span>
            ${panierItemEnCours.designs.length>1
              ?`<button class="som-btn-remove" type="button" onclick="SOM.removeDesign('${design.id}')" title="Supprimer">×</button>`:''}
          </div>

          <label class="som-label" style="margin-top:10px">Type de décoration</label>
          <div class="som-logo-toggle" style="margin-bottom:14px">
            <button class="som-logo-toggle__btn${design.type==='dtf'?' active':''}" type="button"
              onclick="SOM.updateDesignType('${design.id}','dtf')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span><strong>Impression DTF</strong></span>
            </button>
            <button class="som-logo-toggle__btn${design.type==='patch'?' active':''}" type="button"
              onclick="SOM.updateDesignType('${design.id}','patch')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 20.8 8 13.6 2 9.2h7.6z"/></svg>
              <span><strong>Patch simili cuir</strong></span>
            </button>
          </div>

          ${design.type==='patch'?`<div style="display:flex;gap:10px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);padding:12px 16px;margin-bottom:12px;font-size:12px;color:var(--som-muted)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--som-gold)" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span><strong style="color:var(--som-text)">Frais de matrice : 25$</strong> (unique, par modèle de patch)</span>
          </div>`:''}

          <label class="som-label">Emplacements</label>
          <p style="font-size:12px;color:var(--som-dim);margin-bottom:10px">Cliquez sur le schéma ou cochez les cases.</p>
          <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-bottom:4px">
            <div style="flex-shrink:0;width:180px" id="svg-wrap-${design.id}">
              ${buildTshirtSVG(design)}
            </div>
            <div style="flex:1;min-width:200px">
              <div class="som-placements">${positionsHtml}</div>
            </div>
          </div>

          <div style="margin-top:16px">
            <label class="som-label">Logo pour ce design <span class="som-required">*</span></label>
            ${buildLogoUploadHtml(design)}
          </div>

          <div class="som-field-group" style="margin-top:10px">
            <label class="som-label" for="notes-${design.id}">Notes <span class="som-optional">(optionnel)</span></label>
            <textarea class="som-textarea" id="notes-${design.id}" rows="2"
              placeholder="Couleurs préférées, contraintes particulières…"
              oninput="SOM.updateDesignNotes('${design.id}',this.value)">${design.notes||''}</textarea>
          </div>
        </div>`;
    }).join('');
    updateDecoValidation();
  }

  function buildTshirtSVG(design) {
    var pos = design.positions;
    var gS = '#c9a84c'; var bS = '#4a78c9';
    var d = design.id;

    /* Echelle : 1 pouce = 7px */
    var SC = 7;

    /* Positions de reference sur le SVG (centre du t-shirt = x:100) */
    /* Avant : corps y=20 a y=200, poitrine commence a y=55 */
    /* Arriere : corps y=230 a y=410 */

    /* Definir chaque emplacement avec sa position et taille reelle */
    var ZONES_AVANT = {
      'avant-coeur-petit':  { x:110, y:52, w:4*SC,   h:2.5*SC, label:'4x2.5"',  color:gS },
      'avant-coeur':        { x:110, y:52, w:4*SC,   h:4*SC,   label:'4x4"',    color:gS },
      'avant-centre-petit': { x:79,  y:98, w:6*SC,   h:6*SC,   label:'6x6"',    color:gS },
      'avant-centre-grand': { x:62,  y:95, w:11*SC,  h:11*SC,  label:'11x11"',  color:gS },
      'avant-centre-max':   { x:51,  y:90, w:14*SC,  h:14*SC,  label:'14x14"',  color:gS },
      'manche-petit':       { x:14,  y:62, w:11*SC,  h:2*SC,   label:'11x2"',   color:gS, rotate:-22 },
      'manche-grand':       { x:14,  y:62, w:11*SC,  h:3.5*SC, label:'11x3.5"', color:gS, rotate:-22 },
    };
    var ZONES_ARRIERE = {
      'arriere-petit':      { x:62,  y:268, w:11*SC,  h:6.5*SC, label:'11x6.5"', color:bS },
      'arriere':            { x:62,  y:262, w:11*SC,  h:11*SC,  label:'11x11"',  color:bS },
      'arriere-max':        { x:51,  y:268, w:14*SC,  h:14*SC,  label:'14x14"',  color:bS },
    };

    var svg = '<svg viewBox="0 0 200 430" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:220px;height:auto;display:block;" data-design="' + d + '">';

    /* ── AVANT ── */
    svg += '<text x="100" y="14" text-anchor="middle" font-size="8" fill="#555" font-family="system-ui" letter-spacing="2">AVANT</text>';
    svg += '<path d="M55,38 L14,68 L30,88 L30,195 L170,195 L170,88 L186,68 L145,38 Q130,20 100,20 Q70,20 55,38 Z" fill="#252525" stroke="#3a3a3a" stroke-width="1.5"/>';
    svg += '<path d="M74,36 Q100,54 126,36" fill="none" stroke="#444" stroke-width="1.5"/>';
    /* Manches avant grisees */
    svg += '<path d="M55,38 L14,68 L30,88 L48,75 Z" fill="rgba(255,255,255,0.03)" stroke="#3a3a3a" stroke-width="1.2"/>';
    svg += '<path d="M145,38 L186,68 L170,88 L152,75 Z" fill="rgba(255,255,255,0.03)" stroke="#3a3a3a" stroke-width="1.2"/>';

    /* Zones avant cliquables (toujours visibles, dim si non selectionne) */
    var mancheGOn = pos.includes('manche-gauche-petit') || pos.includes('manche-gauche-grand');
    var mancheDOn = pos.includes('manche-droite-petit') || pos.includes('manche-droite-grand');
    svg += '<g class="som-svg-zone" data-design="' + d + '" data-zone="manche-droite">';
    svg += '<path d="M55,38 L14,68 L30,88 L48,75 Z" style="fill:' + (mancheDOn?'rgba(201,168,76,0.35)':'rgba(255,255,255,0.03)') + ';stroke:' + (mancheDOn?gS:'#3a3a3a') + ';stroke-width:1.5;cursor:pointer;"/>';
    if (mancheDOn) svg += '<text x="22" y="68" text-anchor="middle" font-size="9" fill="' + gS + '" pointer-events="none">✓</text>';
    else svg += '<text x="22" y="68" text-anchor="middle" font-size="6" fill="#555" pointer-events="none" font-family="system-ui">D</text>';
    svg += '</g>';
    svg += '<g class="som-svg-zone" data-design="' + d + '" data-zone="manche-gauche">';
    svg += '<path d="M145,38 L186,68 L170,88 L152,75 Z" style="fill:' + (mancheGOn?'rgba(201,168,76,0.35)':'rgba(255,255,255,0.03)') + ';stroke:' + (mancheGOn?gS:'#3a3a3a') + ';stroke-width:1.5;cursor:pointer;"/>';
    if (mancheGOn) svg += '<text x="168" y="68" text-anchor="middle" font-size="9" fill="' + gS + '" pointer-events="none">✓</text>';
    else svg += '<text x="168" y="68" text-anchor="middle" font-size="6" fill="#555" pointer-events="none" font-family="system-ui">G</text>';
    svg += '</g>';
    svg += '</g>';

    /* Afficher chaque zone avant cochee avec sa vraie taille */
    Object.keys(ZONES_AVANT).forEach(function(key) {
      if (!pos.includes(key)) return;
      var z = ZONES_AVANT[key];
      if (z.rotate) return; /* manches traitees separement */
      svg += '<rect x="' + z.x + '" y="' + z.y + '" width="' + z.w + '" height="' + z.h + '" rx="2"'
        + ' fill="rgba(201,168,76,0.25)" stroke="' + z.color + '" stroke-width="1.5" pointer-events="none"/>';
      svg += '<text x="' + (z.x + z.w/2) + '" y="' + (z.y + z.h/2 + 3) + '" text-anchor="middle"'
        + ' font-size="6.5" fill="' + z.color + '" pointer-events="none" font-family="system-ui">' + z.label + '</text>';
    });

    /* Zones cliquables invisibles pour coeur et centre */
    svg += '<g class="som-svg-zone" data-design="' + d + '" data-zone="coeur" style="cursor:pointer">';
    svg += '<rect x="110" y="50" width="46" height="46" rx="2" fill="rgba(0,0,0,0)" stroke="rgba(201,168,76,0.15)" stroke-width="1" stroke-dasharray="3,3"/>';
    svg += '<text x="133" y="100" text-anchor="middle" font-size="6" fill="#444" font-family="system-ui" pointer-events="none">Coeur</text>';
    svg += '</g>';

    svg += '<g class="som-svg-zone" data-design="' + d + '" data-zone="centre" style="cursor:pointer">';
    svg += '<rect x="44" y="78" width="112" height="112" rx="2" fill="rgba(0,0,0,0)" stroke="rgba(201,168,76,0.15)" stroke-width="1" stroke-dasharray="3,3"/>';
    svg += '<text x="100" y="196" text-anchor="middle" font-size="6" fill="#444" font-family="system-ui" pointer-events="none">Centre</text>';
    svg += '</g>';

    /* ── SEPARATEUR ── */
    svg += '<line x1="20" y1="210" x2="180" y2="210" stroke="#2a2a2a" stroke-width="1"/>';

    /* ── ARRIERE ── */
    svg += '<text x="100" y="228" text-anchor="middle" font-size="8" fill="#555" font-family="system-ui" letter-spacing="2">ARRIERE</text>';
    var oy = 215;
    svg += '<path d="M55,' + (38+oy) + ' L14,' + (68+oy) + ' L30,' + (88+oy) + ' L30,' + (195+oy) + ' L170,' + (195+oy) + ' L170,' + (88+oy) + ' L186,' + (68+oy) + ' L145,' + (38+oy) + ' Q130,' + (20+oy) + ' 100,' + (20+oy) + ' Q70,' + (20+oy) + ' 55,' + (38+oy) + ' Z" fill="#252525" stroke="#3a3a3a" stroke-width="1.5"/>';
    svg += '<path d="M80,' + (36+oy) + ' Q100,' + (44+oy) + ' 120,' + (36+oy) + '" fill="none" stroke="#444" stroke-width="1.5"/>';
    svg += '<path d="M55,' + (38+oy) + ' L14,' + (68+oy) + ' L30,' + (88+oy) + ' L48,' + (75+oy) + ' Z" fill="rgba(255,255,255,0.03)" stroke="#3a3a3a" stroke-width="1.2"/>';
    svg += '<path d="M145,' + (38+oy) + ' L186,' + (68+oy) + ' L170,' + (88+oy) + ' L152,' + (75+oy) + ' Z" fill="rgba(255,255,255,0.03)" stroke="#3a3a3a" stroke-width="1.2"/>';

    /* Zone arriere cliquable */
    svg += '<g class="som-svg-zone" data-design="' + d + '" data-zone="arriere" style="cursor:pointer">';
    svg += '<rect x="44" y="' + (52+oy) + '" width="112" height="130" rx="2" fill="rgba(0,0,0,0)" stroke="rgba(74,120,201,0.2)" stroke-width="1" stroke-dasharray="3,3"/>';
    svg += '</g>';

    /* Afficher chaque zone arriere cochee avec sa vraie taille */
    Object.keys(ZONES_ARRIERE).forEach(function(key) {
      if (!pos.includes(key)) return;
      var z = ZONES_ARRIERE[key];
      svg += '<rect x="' + z.x + '" y="' + z.y + '" width="' + z.w + '" height="' + z.h + '" rx="2"'
        + ' fill="rgba(74,120,201,0.25)" stroke="' + z.color + '" stroke-width="1.5" pointer-events="none"/>';
      svg += '<text x="' + (z.x + z.w/2) + '" y="' + (z.y + z.h/2 + 3) + '" text-anchor="middle"'
        + ' font-size="6.5" fill="' + z.color + '" pointer-events="none" font-family="system-ui">' + z.label + '</text>';
    });

    /* Arriere texte indicateur si rien selectionne */
    var arriereOn = pos.includes('arriere-petit') || pos.includes('arriere') || pos.includes('arriere-max');
    if (!arriereOn) {
      svg += '<text x="100" y="' + (108+oy) + '" text-anchor="middle" font-size="7" fill="#444" font-family="system-ui" pointer-events="none">Cliquer pour selectionner</text>';
    }

    svg += '</svg>';
    return svg;
  }

  function toggleZoneSVG(designId, zone) {
    if (!panierItemEnCours) return;
    var d = panierItemEnCours.designs.find(function(d){return d.id===designId;});
    if (!d) return;
    var placements = d.type === 'patch' ? PLACEMENTS_PATCH : PLACEMENTS_DTF;
    var keys = placements.filter(function(p){return p.zone===zone;}).map(function(p){return p.value;});
    var anyActive = keys.some(function(k){return d.positions.includes(k);});
    if (anyActive) {
      d.positions = d.positions.filter(function(p){return !keys.includes(p);});
    } else {
      var defaultKey = keys[Math.min(1, keys.length-1)];
      if (defaultKey && !d.positions.includes(defaultKey)) d.positions.push(defaultKey);
    }
    renderDesigns();
    updateDecoValidation();
  }

  function initSVGClicks() {
    document.addEventListener('click', function(e) {
      var zone = e.target.closest('.som-svg-zone');
      if (!zone) return;
      var designId = zone.dataset.design;
      var zoneName = zone.dataset.zone;
      if (designId && zoneName) toggleZoneSVG(designId, zoneName);
    });
  }

  function buildLogoUploadHtml(design) {
    const dzId='dz-'+design.id, inputId='logo-input-'+design.id, hasFile=!!design.logoFile;
    return `<div class="som-dropzone${hasFile?' success':''}" id="${dzId}"
      ondragover="SOM.dragOverDesign(event,'${design.id}')"
      ondragleave="SOM.dragLeaveDesign('${design.id}')"
      ondrop="SOM.dropFileDesign(event,'${design.id}')"
      onclick="document.getElementById('${inputId}').click()">
      <input type="file" id="${inputId}" accept=".ai,.svg,.eps,.pdf,.jpg,.jpeg,.png,.gif,.webp"
        style="display:none" onchange="SOM.handleFileDesign(this.files[0],'${design.id}')">
      ${hasFile?`<div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--som-green)"><polyline points="20 6 9 17 4 12"/></svg>
          <p style="font-weight:600">${design.logoName}</p>
          <button class="som-btn som-btn--ghost som-btn--sm" type="button"
            onclick="event.stopPropagation();SOM.clearLogoDesign('${design.id}')">Supprimer</button>
        </div>`:`<div>
          <div class="som-dropzone__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
          <p class="som-dropzone__title">Glissez votre fichier ici</p>
          <p class="som-dropzone__sub">ou <span class="som-link">parcourir</span></p>
          <div class="som-format-badges">
            <span class="som-format-badge">.AI</span><span class="som-format-badge">.SVG</span>
            <span class="som-format-badge" style="opacity:.5">.PDF</span><span class="som-format-badge" style="opacity:.5">.PNG</span>
          </div>
        </div>`}
    </div>`;
  }

  function handleFileDesign(file,designId) {
    if (!file||!panierItemEnCours) return;
    const d=panierItemEnCours.designs.find(d=>d.id===designId);
    if (!d) return;
    const ext=file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.ai','.svg','.eps','.pdf','.jpg','.jpeg','.png','.gif','.webp'].includes(ext)) {
      alert('Format non accepté. Utilisez .AI, .SVG, .PDF, .JPG ou .PNG.'); return;
    }
    d.logoFile=file; d.logoName=file.name;
    d.logoVectoriel=['.ai','.svg','.eps'].includes(ext);
    renderDesigns(); updateDecoValidation();
  }

  function clearLogoDesign(designId) {
    if (!panierItemEnCours) return;
    const d=panierItemEnCours.designs.find(d=>d.id===designId);
    if (!d) return;
    d.logoFile=null; d.logoName='';
    renderDesigns(); updateDecoValidation();
  }

  function dragOverDesign(e,id) { e.preventDefault(); document.getElementById('dz-'+id)?.classList.add('drag-over'); }
  function dragLeaveDesign(id)  { document.getElementById('dz-'+id)?.classList.remove('drag-over'); }
  function dropFileDesign(e,id) { e.preventDefault(); dragLeaveDesign(id); const f=e.dataTransfer.files[0]; if(f) handleFileDesign(f,id); }
  function updateDesignNotes(id,val) { if(!panierItemEnCours) return; const d=panierItemEnCours.designs.find(d=>d.id===id); if(d) d.notes=val; }

  function updateDecoValidation() {
    const btn=document.getElementById('btn-next-1');
    if (!btn||!panierItemEnCours) return;
    const designs=panierItemEnCours.designs;
    if (designs.length===0) { btn.disabled=true; return; }
    btn.disabled=!designs.every(d=>d.positions.length>=1&&d.logoFile!==null);
  }

  /* ══════════════════════════════════════
     PANEL 2 — QUANTITÉS PAR COULEUR × TAILLE
  ══════════════════════════════════════ */

  function getTaillesProduit(item,selectedColor) {
    const OS=['os','one size','osfm','adjustable','taille unique','one-size'];
    function parse(tailles) {
      if (!tailles||tailles.length===0) return [];
      return tailles.filter(t=>t.disponible!==false)
        .map(t=>{ const l=(t.label||'').trim(); return OS.includes(l.toLowerCase())?'Taille unique':l; })
        .filter(l=>l.length>0);
    }
    if (selectedColor) {
      const c=(item.couleurs||[]).find(c=>c.nom===selectedColor);
      const labels=parse(c?.tailles);
      if (labels.length>0) return labels;
    }
    const labels=parse(item.tailles);
    return labels.length>0?labels:SIZES;
  }

  function addColorBlock(defaultColor) {
    const item=panierItemEnCours;
    if (!item) return;
    const couleurs=item.couleurs.filter(c=>c.disponible);
    const blockId='b'+Date.now();
    const startColor=defaultColor&&couleurs.find(c=>c.nom===defaultColor)
      ?defaultColor:(couleurs[0]?.nom||'');
    const block={id:blockId,color:startColor,quantities:{}};
    getTaillesProduit(item,startColor).forEach(s=>block.quantities[s]=0);
    item.colorBlocks.push(block);
    renderColorBlocks();
  }

  function removeColorBlock(id) {
    if (!panierItemEnCours) return;
    panierItemEnCours.colorBlocks=panierItemEnCours.colorBlocks.filter(b=>b.id!==id);
    renderColorBlocks(); updateP2Summary();
  }

  function renderColorBlocks() {
    const item=panierItemEnCours;
    if (!item) return;
    const container=document.getElementById('color-blocks-container');
    if (!container) return;
    const couleurs=item.couleurs.filter(c=>c.disponible);

    // Compteurs impressions par design
    const countersEl=document.getElementById('p2-design-counters');
    if (countersEl&&item.designs.length>0) {
      const total=getTotalPieces();
      countersEl.innerHTML=item.designs.map((d,i)=>{
        const imp=d.positions.length*total;
        const ok=imp>=MIN_IMPRESSIONS;
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid ${ok?'var(--som-green)':'var(--som-border2)'};margin-bottom:8px;font-size:13px">
          <span style="color:var(--som-dim)">Design ${i+1} · ${d.positions.length} position${d.positions.length!==1?'s':''}</span>
          <span id="p2-counter-${d.id}" class="som-deco-counter${ok?' ok':imp>0?' warn':''}">
            ${imp} impression${imp>1?'s':''}
          </span>
          <span style="font-size:11px;color:var(--som-dim)">/ ${MIN_IMPRESSIONS} min.</span>
        </div>`;
      }).join('');
    }

    container.innerHTML=couleurs.length===0?'<p style="color:var(--som-dim);padding:1rem">Aucune couleur disponible.</p>':
    item.colorBlocks.map(block=>{
      const colorOptions=couleurs.map(c=>{
        const hex=getColorHex(c.nom);
        return `<option value="${c.nom}" data-hex="${hex}" ${c.nom===block.color?'selected':''}>${getNomCouleurFR(c.nom)}</option>`;
      }).join('');
      const sizeInputs=getTaillesProduit(item,block.color).map(size=>`
        <div class="som-size-cell">
          <label class="som-size-label">${size}</label>
          <input type="number" class="som-qty-input" min="0" value="${block.quantities[size]||0}" step="1"
            oninput="SOM.updateQty('${block.id}','${size}',this.value)">
        </div>`).join('');
      const blockTotal=Object.values(block.quantities).reduce((a,b)=>a+b,0);
      const hex=getColorHex(block.color);
      return `
        <div class="som-color-block" id="block-${block.id}">
          <div class="som-color-block__header">
            <div class="som-color-block__color-select">
              <div class="som-color-preview" id="preview-${block.id}" style="background:${hex}"></div>
              <select class="som-input som-input--color" onchange="SOM.updateColor('${block.id}',this)">${colorOptions}</select>
            </div>
            <div class="som-color-block__total">
              <span id="block-total-${block.id}">${blockTotal}</span> articles
            </div>
            ${item.colorBlocks.length>1?`<button class="som-btn-remove" type="button" onclick="SOM.removeColorBlock('${block.id}')" title="Supprimer">×</button>`:''}
          </div>
          <div class="som-size-grid">${sizeInputs}</div>
        </div>`;
    }).join('');
  }

  function updateColor(blockId,select) {
    if (!panierItemEnCours) return;
    const block=panierItemEnCours.colorBlocks.find(b=>b.id===blockId);
    if (!block) return;
    block.color=select.value;
    const hex=select.options[select.selectedIndex].dataset.hex||'#ccc';
    const preview=document.getElementById('preview-'+blockId);
    if (preview) preview.style.background=hex;
    const newTailles=getTaillesProduit(panierItemEnCours,block.color);
    block.quantities={};
    newTailles.forEach(s=>block.quantities[s]=0);
    renderColorBlocks(); updateP2Summary();
  }

  function updateQty(blockId,size,val) {
    if (!panierItemEnCours) return;
    const block=panierItemEnCours.colorBlocks.find(b=>b.id===blockId);
    if (!block) return;
    block.quantities[size]=Math.max(0,parseInt(val)||0);
    const blockTotal=Object.values(block.quantities).reduce((a,b)=>a+b,0);
    const totalEl=document.getElementById('block-total-'+blockId);
    if (totalEl) totalEl.textContent=blockTotal;
    updateP2Summary();
  }

  function getTotalPieces() {
    if (!panierItemEnCours) return 0;
    return panierItemEnCours.colorBlocks.reduce(
      (sum,b)=>sum+Object.values(b.quantities).reduce((a,c)=>a+c,0),0
    );
  }

  function updateP2Summary() {
    const total=getTotalPieces();
    const totalEl=document.getElementById('grand-total');
    if (totalEl) totalEl.textContent=total;

    const item=panierItemEnCours;

    // Màj compteurs impressions par design
    if (item) {
      item.designs.forEach(d=>{
        const imp=d.positions.length*total;
        const ok=imp>=MIN_IMPRESSIONS;
        const el=document.getElementById('p2-counter-'+d.id);
        if (el) {
          el.textContent=imp+' impression'+(imp>1?'s':'');
          el.className='som-deco-counter'+(ok?' ok':imp>0?' warn':'');
          el.closest('div').style.borderColor=ok?'var(--som-green)':'var(--som-border2)';
        }
      });
    }

    const btn=document.getElementById('btn-next-2');
    if (!btn) return;
    if (total<1) { btn.disabled=true; }
    else {
      const allOk=(item?.designs||[]).every(d=>d.positions.length*total>=MIN_IMPRESSIONS);
      btn.disabled=!allOk;
    }

    const msg=document.getElementById('qty-msg');
    if (msg) {
      if (total<1) {
        msg.textContent='Ajoutez au moins un article pour continuer.';
        msg.className='som-qty-summary__msg';
      } else {
        const allOk=(item?.designs||[]).every(d=>d.positions.length*total>=MIN_IMPRESSIONS);
        if (!allOk) {
          msg.textContent=`⚠ Minimum de ${MIN_IMPRESSIONS} impressions par design non atteint — ajoutez des articles.`;
          msg.className='som-qty-summary__msg warn';
        } else {
          msg.textContent=`✓ ${total} article${total>1?'s':''} — minimum atteint pour tous les designs.`;
          msg.className='som-qty-summary__msg ok';
        }
      }
    }
  }

  /* ══════════════════════════════════════
     PANIER
  ══════════════════════════════════════ */

  function ajouterAuPanier() {
    if (!panierItemEnCours) return;
    const existingIdx=panier.findIndex(i=>i.id===panierItemEnCours.id);
    if (existingIdx>=0) panier[existingIdx]={...panierItemEnCours};
    else panier.push({...panierItemEnCours});
    panierItemEnCours=null;
    document.getElementById('som-form-section').style.display='none';
    renderPanier();
    renderCatalogue();
  }

  function retirerDuPanier(itemId) {
    const idx=panier.findIndex(i=>i.id===itemId);
    if (idx>=0) panier.splice(idx,1);
    renderPanier(); renderCatalogue();
  }

  function modifierItem(itemId) {
    const item=panier.find(i=>i.id===itemId);
    if (!item) return;
    panierItemEnCours={
      ...item,
      designs:item.designs.map(d=>({...d,positions:[...d.positions]})),
      colorBlocks:item.colorBlocks.map(b=>({...b,quantities:{...b.quantities}}))
    };
    document.getElementById('som-panier-section').style.display='none';
    const formSection=document.getElementById('som-form-section');
    formSection.style.display='block';
    document.getElementById('sel-name').textContent=panierItemEnCours.name;
    document.getElementById('sel-sku').textContent='SKU : '+panierItemEnCours.sku;
    const imgEl=document.getElementById('sel-img');
    imgEl.innerHTML=panierItemEnCours.image?`<img src="${panierItemEnCours.image}" alt="" style="width:100%;height:100%;object-fit:cover;">`:'';
    goStep(1);
    formSection.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function retourPanier() {
    document.getElementById('som-form-section').style.display='none';
    renderPanier();
  }

  function renderPanier() {
    let section=document.getElementById('som-panier-section');
    if (!section) {
      section=document.createElement('div');
      section.id='som-panier-section'; section.className='som-panier-section';
      const formSection=document.getElementById('som-form-section');
      formSection.parentNode.insertBefore(section,formSection);
    }
    if (panier.length===0) { section.style.display='none'; return; }
    section.style.display='block';
    section.innerHTML=`
      <div class="som-container">
        <div class="som-panier-header">
          <div class="som-panier-titre">VOTRE COMMANDE <span class="som-panier-count">${panier.length} produit${panier.length>1?'s':''}</span></div>
        </div>
        <div class="som-panier-items">
          ${panier.map(item=>{
            const totalQty=item.colorBlocks.reduce((s,b)=>s+Object.values(b.quantities).reduce((a,c)=>a+c,0),0);
            const couleursResume=item.colorBlocks.map(b=>{
              const hex=getColorHex(b.color);
              const qty=Object.values(b.quantities).reduce((a,c)=>a+c,0);
              return `<span class="som-panier-swatch" style="background:${hex}" title="${b.color}"></span><span class="som-panier-color-qty">${getNomCouleurFR(b.color)} ×${qty}</span>`;
            }).join('');
            const designsResume=(item.designs||[]).map((d,i)=>{
              const imp=d.positions.length*totalQty;
              return `Design ${i+1} : ${d.positions.length} pos. · ${imp} impr.`;
            }).join(' | ')||'Aucun design';
            return `
              <div class="som-panier-item">
                <div class="som-panier-item__img">${item.image?`<img src="${item.image}" alt="${item.name}">`:''}
                </div>
                <div class="som-panier-item__info">
                  <div class="som-panier-item__name">${item.name}</div>
                  <div class="som-panier-item__sku">SKU : ${item.sku}</div>
                  <div class="som-panier-item__couleurs">${couleursResume}</div>
                  <div class="som-panier-item__meta"><span>${totalQty} articles</span><span>·</span><span>${designsResume}</span></div>
                </div>
                <div class="som-panier-item__actions">
                  <button class="som-btn som-btn--ghost som-btn--sm" onclick="SOM.modifierItem('${item.id}')">Modifier</button>
                  <button class="som-btn-remove" onclick="SOM.retirerDuPanier('${item.id}')" title="Retirer">×</button>
                </div>
              </div>`;
          }).join('')}
        </div>
        <div class="som-panier-footer">
          <button class="som-btn som-btn--ghost" onclick="SOM.ajouterAutreProduit()">+ Ajouter un autre produit</button>
          <button class="som-btn som-btn--primary" onclick="SOM.passerAuxCoordonnees()">Continuer → Coordonnées</button>
        </div>
      </div>`;
    section.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function ajouterAutreProduit() {
    document.getElementById('som-panier-section').style.display='none';
    document.getElementById('catalogue').scrollIntoView({behavior:'smooth'});
  }

  function passerAuxCoordonnees() {
    if (panier.length===0) return;
    document.getElementById('som-panier-section').style.display='none';
    const formSection=document.getElementById('som-form-section');
    formSection.style.display='block';
    document.getElementById('sel-name').textContent=`${panier.length} produit${panier.length>1?'s':''} sélectionné${panier.length>1?'s':''}`;
    document.getElementById('sel-sku').textContent=panier.map(i=>i.sku).join(', ');
    const imgEl=document.getElementById('sel-img');
    imgEl.innerHTML=panier[0]?.image?`<img src="${panier[0].image}" alt="" style="width:100%;height:100%;object-fit:cover;">`:'';
    goStep(3);
    formSection.scrollIntoView({behavior:'smooth',block:'start'});
  }

  /* ══════════════════════════════════════
     RÉCAP & SOUMISSION
  ══════════════════════════════════════ */

  function buildRecap() {
    syncHidden();
    const container=document.getElementById('som-recap');
    if (!container) return;
    const panierHtml=panier.map(item=>{
      const totalQty=item.colorBlocks.reduce((s,b)=>s+Object.values(b.quantities).reduce((a,c)=>a+c,0),0);
      const blocksHtml=item.colorBlocks.map(b=>{
        const total=Object.values(b.quantities).reduce((a,c)=>a+c,0);
        const sizes=Object.entries(b.quantities).filter(([,q])=>q>0).map(([s,q])=>`${q}×${s}`).join(', ');
        const hex=getColorHex(b.color);
        return `<div class="som-recap-color">
          <span class="som-recap-swatch" style="background:${hex}"></span>
          <strong>${getNomCouleurFR(b.color)}</strong> — ${total} articles${sizes?' ('+sizes+')':''}
        </div>`;
      }).join('');
      const designsHtml=(item.designs||[]).map((d,i)=>{
        const imp=d.positions.length*totalQty;
        const positions=d.positions.map(p=>{
          const found=[...PLACEMENTS_DTF,...PLACEMENTS_PATCH].find(pl=>pl.value===p);
          return found?`${found.label} (${found.size})`:p;
        }).join(', ');
        return `<div style="font-size:12px;color:var(--som-muted);margin-top:4px">
          Design ${i+1} · ${d.type.toUpperCase()} · ${d.logoName||'Logo non fourni'} · ${imp} impressions<br>
          <span style="color:var(--som-dim)">Positions : ${positions||'Aucune'}</span>
        </div>`;
      }).join('');
      return `<div class="som-recap-produit">
        <div class="som-recap-produit__header">
          ${item.image?`<img src="${item.image}" alt="${item.name}" class="som-recap-produit__img">`:''}
          <div>
            <strong>${item.name}</strong> <span style="color:#555">(${item.sku})</span>
            <div style="font-size:12px;color:#666;margin-top:2px">${totalQty} articles</div>
          </div>
        </div>
        <div style="margin-top:10px">${blocksHtml}</div>
        <div style="margin-top:10px;border-top:1px solid var(--som-border);padding-top:10px">${designsHtml}</div>
      </div>`;
    }).join('');
    const grandTotal=panier.reduce((s,item)=>s+item.colorBlocks.reduce((ss,b)=>ss+Object.values(b.quantities).reduce((a,c)=>a+c,0),0),0);
    container.innerHTML=`
      <div class="som-recap-section">
        <h4>Commande — ${panier.length} produit${panier.length>1?'s':''}</h4>
        ${panierHtml}
        <p style="margin-top:12px;font-weight:600">Total : ${grandTotal} articles</p>
      </div>
      <div class="som-recap-section"><h4>Coordonnées</h4>
        <p>${document.getElementById('f-prenom').value} ${document.getElementById('f-nom').value}${document.getElementById('f-entreprise').value?' — '+document.getElementById('f-entreprise').value:''}</p>
        <p>${document.getElementById('f-email').value} · ${document.getElementById('f-tel').value}</p>
        <p>Préférence : ${document.querySelector('input[name="pref_contact"]:checked')?.value||''}${document.getElementById('f-moment').value?' · '+document.getElementById('f-moment').value:''}</p>
      </div>`;
  }

  function syncHidden() {
    const grandTotal=panier.reduce((s,item)=>s+item.colorBlocks.reduce((ss,b)=>ss+Object.values(b.quantities).reduce((a,c)=>a+c,0),0),0);
    const panierSer=panier.map(item=>({
      ...item,
      designs:(item.designs||[]).map(d=>({...d,logoFile:d.logoName||''})),
    }));
    const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
    set('h-product-name', panier.map(i=>i.name).join(' | '));
    set('h-product-sku',  panier.map(i=>i.sku).join(' | '));
    set('h-color-blocks', JSON.stringify(panierSer));
    set('h-placement',    panier.map(i=>(i.designs||[]).map(d=>d.positions.join('+')).join(' | ')).join(' || '));
    set('h-total-qty',    grandTotal);
    set('h-logo-mode',    'designs');
    set('h-prenom',       document.getElementById('f-prenom').value);
    set('h-nom',          document.getElementById('f-nom').value);
    set('h-email',        document.getElementById('f-email').value);
    set('h-tel',          document.getElementById('f-tel').value);
    set('h-entreprise',   document.getElementById('f-entreprise').value);
    set('h-pref-contact', document.querySelector('input[name="pref_contact"]:checked')?.value||'');
    set('h-moment',       document.getElementById('f-moment').value);
    set('h-message',      document.getElementById('f-message').value);
  }

  function initForm() {
    const form=document.getElementById('som-form');
    if (!form) return;
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      syncHidden();
      const prenom=document.getElementById('f-prenom').value.trim();
      const nom=document.getElementById('f-nom').value.trim();
      const email=document.getElementById('f-email').value.trim();
      const tel=document.getElementById('f-tel').value.trim();
      if (!prenom||!nom||!email||!tel) { alert('Veuillez remplir tous les champs obligatoires.'); return; }
      const btn=document.getElementById('btn-submit');
      btn.innerHTML='<span>Envoi en cours…</span>'; btn.disabled=true;
      const fd=new FormData(form);
      panier.forEach((item,i)=>{
        (item.designs||[]).forEach((d,j)=>{
          if (d.logoFile) fd.set(`logo_design_${i}_${j}`,d.logoFile,d.logoFile.name);
        });
      });
      try {
        const r=await fetch(form.action,{method:'POST',body:fd});
        const data=await r.json();
        if (data.success) {
          document.querySelectorAll('.som-panel').forEach(p=>p.classList.remove('active'));
          document.getElementById('panel-5').classList.add('active');
          if (data.data?.ref) document.getElementById('conf-ref').textContent='Référence : '+data.data.ref;
        } else {
          alert(data.data?.message||'Une erreur est survenue.');
          btn.innerHTML='<span>Envoyer ma demande de soumission</span>'; btn.disabled=false;
        }
      } catch(err) {
        alert('Erreur de connexion.');
        btn.innerHTML='<span>Envoyer ma demande de soumission</span>'; btn.disabled=false;
      }
    });
  }

  /* ── Recherche ── */
  function setSearch(val) {
    searchQuery=val; currentPage=1;
    const c=document.getElementById('som-search-clear');
    if(c) c.style.display=val?'flex':'none';
    renderCatalogue();
  }
  function clearSearch() {
    searchQuery='';
    const i=document.getElementById('som-search-input'); if(i) i.value='';
    const c=document.getElementById('som-search-clear'); if(c) c.style.display='none';
    currentPage=1; renderCatalogue();
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', async ()=>{
    await loadCategories();
    await loadAllProducts();
    currentSousCat=null;
    renderSousCats();
    renderCatalogue();
    initForm();
    initSVGClicks();
  });

  /* ── API publique ── */
  window.SOM = {
    goPage, setPerPage, setSearch, clearSearch,
    openModal, openModalIdx, closeModal, selectSwatch, setMainImg, choisirProduit,
    goStep, retourCatalogue, retourPanier,
    addDesign, removeDesign, updateDesignType, togglePosition, toggleZoneSVG,
    handleFileDesign, clearLogoDesign, dragOverDesign, dragLeaveDesign, dropFileDesign,
    updateDesignNotes,
    addColorBlock, removeColorBlock, updateColor, updateQty,
    ajouterAuPanier, retirerDuPanier, modifierItem, ajouterAutreProduit, passerAuxCoordonnees,
    buildRecap,
  };

})();
