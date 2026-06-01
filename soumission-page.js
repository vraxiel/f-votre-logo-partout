/**
 * soumission-page.js — F Votre Logo Partout v4
 * Architecture panier — multi-produits, logo & emplacement par produit
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
    'heather-sport-dark-navy':'Marine sport foncé chiné','ice-grey':'Gris glace',
    'light-pink':'Rose pâle','metallic-gold':'Or métallique','mint':'Menthe',
    'old-gold':'Or ancien','peacock':'Paon','pepper':'Poivre','pistachio':'Pistache',
    'red-orange':'Rouge-orange','silver':'Argent','slate':'Ardoise',
    'sport-scarlet-red':'Rouge écarlate sport','storm':'Orage','tan':'Beige',
    'true-navy':'Marine vrai','true-royal':'Bleu royal vrai','white-on-white':'Blanc sur blanc',
  };

  function getNomCouleurFR(nom) {
    if (!nom) return '';
    const slug = nom.toLowerCase().replace(/\s+/g, '-');
    return COLOR_NAME_FR[slug] || COLOR_NAME_FR[nom.toLowerCase()] || nom;
  }

  window.SOM_COLOR_MAP = COLOR_MAP;

  /* ── État global ── */
  let CATEGORIES = [];
  let currentCat = null;
  let currentSousCat = null;
  let allProducts = [];
  let currentPage = 1;
  let perPage = 24;
  let searchQuery = '';
  let modalProduit = null;

  // Panier : tableau de produits configurés
  // Chaque item : { id, idx, name, sku, image, couleurs, colorBlocks, placement, placementPrice, logoMode, logoFile, logoRefFile, logoName }
  const panier = [];
  let panierItemEnCours = null; // item en cours de configuration

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

    // Injecter la barre de recherche au-dessus des filtres si pas déjà là
    if (!document.getElementById('som-search-bar')) {
      const searchBar = document.createElement('div');
      searchBar.id = 'som-search-bar';
      searchBar.className = 'som-search-bar';
      searchBar.innerHTML = `
        <div class="som-search-wrap">
          <svg class="som-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="som-search-input" class="som-search-input"
            placeholder="Rechercher un produit, SKU…"
            oninput="SOM.setSearch(this.value)">
          <button class="som-search-clear" id="som-search-clear" onclick="SOM.clearSearch()" style="display:none">×</button>
        </div>`;
      filtersEl.parentNode.insertBefore(searchBar, filtersEl);
    }
    filtersEl.innerHTML = CATEGORIES.map(cat =>
      `<button class="som-filter-btn" data-cat="${cat.label}">${cat.label}</button>`
    ).join('');
    filtersEl.querySelectorAll('.som-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCat = btn.dataset.cat;
        currentSousCat = null;
        currentPage = 1;
        filtersEl.querySelectorAll('.som-filter-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.cat === currentCat)
        );
        renderSousCats();
        renderCatalogue();
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

  function getCatConfig(label) {
    return CATEGORIES.find(c => c.label === label) || null;
  }

  function filterProducts(catLabel, sousCatLabel) {
    // Recherche globale — ignore catégorie/sous-cat
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return allProducts.filter(p =>
        (p.nom || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.nom_original || '').toLowerCase().includes(q)
      );
    }
    const cfg = getCatConfig(catLabel);
    if (!cfg) return [];
    if (cfg.type === 'skus' && cfg.skus) {
      const sl = cfg.skus.map(s => s.toLowerCase());
      return allProducts.filter(p => sl.includes((p.sku || '').toLowerCase()));
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
      renderPagination(0);
      return;
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
      const swatches = (p.couleurs || []).slice(0, 8).map(c => {
        const img = c.images?.[0] || '';
        return `<span class="som-swatch" title="${c.nom}" style="background:#f5f5f5;overflow:hidden;display:inline-block;">${img ? `<img src="${img}" alt="${c.nom}" style="width:100%;height:100%;object-fit:cover;">` : ''}</span>`;
      }).join('') + ((p.couleurs || []).length > 8 ? `<span class="som-swatch-more">+${(p.couleurs || []).length - 8}</span>` : '');
      const idx = allProducts.indexOf(p);
      // Badge "Déjà dans le panier"
      const dejaDans = panier.some(item => item.idx === idx);
      return `
        <div class="som-card${!dispo ? ' som-card--out' : ''}" style="cursor:pointer;" onclick='SOM.openModalIdx(${idx})'>
          <div class="som-card__img">
            ${imgHtml}
            <span class="som-card__badge${dispo ? ' som-card__badge--in' : ' som-card__badge--out'}">
              <span class="som-card__dot"></span>${dispo ? 'En stock' : 'Rupture'}
            </span>
            ${dejaDans ? '<span class="som-card__badge som-card__badge--panier" style="top:10px;left:10px;right:auto;background:rgba(201,168,76,0.9);color:#111">✓ Ajouté</span>' : ''}
          </div>
          <div class="som-card__body">
            <h3 class="som-card__name">${p.nom}</h3>
            <p class="som-card__sku">SKU : ${p.sku}</p>
            ${swatches ? `<div class="som-card__swatches">${swatches}</div>` : ''}
            <button class="som-card__btn" type="button" ${!dispo ? 'disabled' : ''}
              onclick='event.stopPropagation();SOM.openModalIdx(${idx})'>
              ${dispo ? 'Voir les couleurs →' : 'Indisponible'}
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function renderPagination(total) {
    let containerTop = document.getElementById('som-pagination-top');
    if (!containerTop) {
      containerTop = document.createElement('div');
      containerTop.id = 'som-pagination-top';
      containerTop.className = 'som-pagination som-pagination--top';
      const grid = document.getElementById('som-grid');
      grid.parentNode.insertBefore(containerTop, grid);
    }
    let container = document.getElementById('som-pagination');
    if (!container) {
      container = document.createElement('div');
      container.id = 'som-pagination';
      container.className = 'som-pagination';
      const grid = document.getElementById('som-grid');
      grid.parentNode.insertBefore(container, grid.nextSibling);
    }
    if (total === 0) { container.innerHTML = ''; containerTop.innerHTML = ''; return; }
    const totalPages = Math.ceil(total / perPage);
    const perPageOptions = [24, 48, 96].map(n =>
      `<option value="${n}" ${perPage === n ? 'selected' : ''}>${n} par page</option>`
    ).join('');
    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages += `<button class="som-page-btn${i === currentPage ? ' active' : ''}" onclick="SOM.goPage(${i})">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pages += `<span class="som-page-ellipsis">…</span>`;
      }
    }
    const html = `
      <div class="som-pagination__info">${total} produit${total > 1 ? 's' : ''}</div>
      <div class="som-pagination__pages">
        <button class="som-page-btn" onclick="SOM.goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>←</button>
        ${pages}
        <button class="som-page-btn" onclick="SOM.goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>→</button>
      </div>
      <div class="som-pagination__perpage">
        <select class="som-perpage-select" onchange="SOM.setPerPage(parseInt(this.value))">${perPageOptions}</select>
      </div>`;
    containerTop.innerHTML = html;
    container.innerHTML = html;
  }

  function goPage(page) {
    const products = filterProducts(currentCat, currentSousCat);
    const totalPages = Math.ceil(products.length / perPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCatalogue();
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setPerPage(n) { perPage = n; currentPage = 1; renderCatalogue(); }

  function renderSousCats() {
    const cfg = getCatConfig(currentCat);
    let bar = document.getElementById('som-souscats');
    if (!cfg || !cfg.sous_cats || cfg.sous_cats.length === 0) {
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
    if (!currentSousCat || !cfg.sous_cats.find(s => s.label === currentSousCat)) {
      currentSousCat = cfg.sous_cats[0].label;
    }
    bar.innerHTML = cfg.sous_cats.map(sc =>
      `<button class="som-souscat-btn${sc.label === currentSousCat ? ' active' : ''}" data-souscat="${sc.label}">${sc.label}</button>`
    ).join('');
    bar.querySelectorAll('.som-souscat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSousCat = btn.dataset.souscat;
        currentPage = 1;
        bar.querySelectorAll('.som-souscat-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.souscat === currentSousCat)
        );
        renderCatalogue();
      });
    });
  }

  /* ══════════════════════════════════════
     MODALE PRODUIT
  ══════════════════════════════════════ */

  function openModalIdx(idx) {
    const p = allProducts[idx];
    if (p) openModal(idx, p.nom, p.sku, p.image || '', p.couleurs || [], p.tailles || []);
  }

  function openModal(idx, name, sku, image, couleurs, tailles) {
    modalProduit = { idx, name, sku, image, couleurs, tailles: tailles || [] };
    document.getElementById('modal-nom').textContent = name;
    document.getElementById('modal-sku').textContent = 'SKU : ' + sku;
    const premiereDispo = couleurs.find(c => c.disponible) || couleurs[0];
    renderModalCouleur(premiereDispo);
    renderModalSwatches(couleurs, premiereDispo);
    document.getElementById('som-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(e) {
    if (e && e.target !== document.getElementById('som-modal-overlay')) return;
    document.getElementById('som-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  function renderModalCouleur(couleur) {
    const imgs = couleur?.images || [];
    const mainEl = document.getElementById('modal-main-img');
    const thumbsEl = document.getElementById('modal-thumbs');
    if (imgs.length) {
      mainEl.innerHTML = `<img src="${imgs[0]}" alt="">`;
      thumbsEl.innerHTML = imgs.map((url, i) =>
        `<div class="som-modal__thumb${i === 0 ? ' active' : ''}" onclick="SOM.setMainImg(this,'${url}')">
          <img src="${url}" alt="">
        </div>`
      ).join('');
    } else {
      mainEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555">Aucune image</div>`;
      thumbsEl.innerHTML = '';
    }
    const couleurEl = document.getElementById('modal-couleur-nom');
    if (couleurEl) couleurEl.textContent = getNomCouleurFR(couleur?.nom || '');
    const dispo = document.getElementById('modal-dispo');
    dispo.innerHTML = couleur?.disponible
      ? '<span style="color:#5aaa5a;font-weight:500">En stock</span>'
      : '<span style="color:#cc4444;font-weight:500">Rupture de stock</span>';
  }

  function renderModalSwatches(couleurs, active) {
    document.getElementById('modal-swatches').innerHTML = couleurs.map(c => {
      const img = c.images?.[0] || '';
      return `<div class="som-modal__swatch${c.nom === active?.nom ? ' active' : ''}${!c.disponible ? ' som-modal__swatch--out' : ''}"
        title="${c.nom}" onclick="SOM.selectSwatch(this.title)" style="background:#f5f5f5;overflow:hidden;">
        ${img ? `<img src="${img}" alt="${c.nom}" style="width:100%;height:100%;object-fit:cover;">` : ''}
      </div>`;
    }).join('');
  }

  function selectSwatch(nomCouleur) {
    if (!modalProduit) return;
    const couleur = modalProduit.couleurs.find(c => c.nom === nomCouleur);
    if (!couleur) return;
    renderModalCouleur(couleur);
    document.querySelectorAll('.som-modal__swatch').forEach(s =>
      s.classList.toggle('active', s.title === nomCouleur)
    );
  }

  function setMainImg(thumbEl, url) {
    document.getElementById('modal-main-img').innerHTML = `<img src="${url}" alt="">`;
    document.querySelectorAll('.som-modal__thumb').forEach(t => t.classList.remove('active'));
    thumbEl.classList.add('active');
  }

  function choisirProduit() {
    if (!modalProduit) return;
    const couleurActive = document.querySelector('.som-modal__swatch.active');
    const selectedColor = couleurActive ? couleurActive.title : null;
    const couleurObj = selectedColor ? modalProduit.couleurs.find(c => c.nom === selectedColor) : null;
    const imgSrc = couleurObj?.images?.[0] || modalProduit.image;

    // Créer un nouvel item panier
    panierItemEnCours = {
      id: 'item-' + Date.now(),
      idx: modalProduit.idx,
      name: modalProduit.name,
      sku: modalProduit.sku,
      image: imgSrc,
      couleurs: modalProduit.couleurs,
      tailles: modalProduit.tailles || [],
      colorBlocks: [],
      decoMode: 'dtf',
      placements: [],
      patches: [],
      placementPrice: 0,
      logoMode: 'has',
      logoFile: null,
      logoRefFile: null,
      logoName: '',
    };

    closeModal();
    document.body.style.overflow = '';
    ouvrirConfigProduit(selectedColor);
  }

  /* ══════════════════════════════════════
     CONFIGURATION D'UN PRODUIT (étapes 1-3)
  ══════════════════════════════════════ */

  function ouvrirConfigProduit(selectedColor) {
    const item = panierItemEnCours;
    if (!item) return;

    const formSection = document.getElementById('som-form-section');
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Header produit sélectionné
    document.getElementById('sel-name').textContent = item.name;
    document.getElementById('sel-sku').textContent = 'SKU : ' + item.sku;
    const imgEl = document.getElementById('sel-img');
    imgEl.innerHTML = item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">` : '';

    // Reset logo UI
    resetLogoUI();

    // Reset placements & patches — tout décocher
    document.querySelectorAll('input[name="placement[]"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="patch[]"]').forEach(cb => cb.checked = false);
    item.placements = [];
    item.patches = [];
    setDecoMode('dtf');

    // Premier bloc couleur
    item.colorBlocks = [];
    addColorBlock(selectedColor);

    goStep(1);
  }

  function retourCatalogue() {
    panierItemEnCours = null;
    document.getElementById('som-form-section').style.display = 'none';
    document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Étapes ── */
  const STEP_TITRES = {
    1: { titre: 'QUANTITÉS & COULEURS', sub: 'Minimum <strong>12 articles par couleur</strong>. Répartissez les tailles comme vous voulez.' },
    2: { titre: 'LOGO & EMPLACEMENT', sub: 'Choisissez où imprimer et fournissez votre fichier vectoriel.' },
    3: { titre: 'VOS COORDONNÉES', sub: 'Pour vous envoyer votre soumission personnalisée.' },
    4: { titre: 'RÉCAPITULATIF', sub: 'Vérifiez votre commande avant l\'envoi.' },
  };

  function goStep(step) {
    document.querySelectorAll('.som-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + step).classList.add('active');
    document.querySelectorAll('.som-step').forEach(s => {
      const n = parseInt(s.dataset.step);
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
    });
    // Titre dynamique
    const titre = STEP_TITRES[step];
    if (titre) {
      const titreEl = document.getElementById('som-step-titre');
      const subEl = document.getElementById('som-step-sub');
      if (titreEl) titreEl.textContent = titre.titre;
      if (subEl) subEl.innerHTML = titre.sub;
    }
    if (step === 4) buildRecap();
    document.getElementById('som-steps').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Blocs couleur ── */
  /* ── Tailles d'un produit ── */
  function getTaillesProduit(item, selectedColor) {
    const OS_LABELS = ['os','one size','osfm','adjustable','taille unique','one-size'];

    function labelsFromTailles(tailles) {
      if (!tailles || tailles.length === 0) return [];
      return tailles
        .filter(t => t.disponible !== false)
        .map(t => {
          const l = (t.label || '').trim();
          return OS_LABELS.includes(l.toLowerCase()) ? 'Taille unique' : l;
        })
        .filter(l => l.length > 0);
    }

    // Priorité 1 : tailles de la couleur sélectionnée
    if (selectedColor) {
      const couleurData = (item.couleurs || []).find(c => c.nom === selectedColor);
      const labels = labelsFromTailles(couleurData?.tailles);
      if (labels.length > 0) return labels;
    }

    // Priorité 2 : tailles globales du produit
    const labels = labelsFromTailles(item.tailles);
    if (labels.length > 0) return labels;

    // Fallback : tailles standard
    return SIZES;
  }

  function addColorBlock(defaultColor) {
    const item = panierItemEnCours;
    if (!item) return;
    const couleurs = item.couleurs.filter(c => c.disponible);
    const blockId = 'b' + Date.now();
    const startColor = defaultColor && couleurs.find(c => c.nom === defaultColor)
      ? defaultColor : (couleurs[0]?.nom || '');
    const block = { id: blockId, color: startColor, colorHex: '#ccc', quantities: {} };
    getTaillesProduit(item, startColor).forEach(s => block.quantities[s] = 0);
    item.colorBlocks.push(block);
    renderColorBlocks();
  }

  function removeColorBlock(id) {
    if (!panierItemEnCours) return;
    panierItemEnCours.colorBlocks = panierItemEnCours.colorBlocks.filter(b => b.id !== id);
    renderColorBlocks();
    updateQtySummary();
  }

  function renderColorBlocks() {
    const item = panierItemEnCours;
    if (!item) return;
    const container = document.getElementById('color-blocks-container');
    const couleurs = item.couleurs.filter(c => c.disponible);
    container.innerHTML = item.colorBlocks.map(block => {
      const colorOptions = couleurs.map(c => {
        const slug = (c.nom || '').toLowerCase().replace(/\s+/g, '-');
        const hex = COLOR_MAP[slug] || COLOR_MAP[(c.nom || '').toLowerCase()] || '#ccc';
        return `<option value="${c.nom}" data-hex="${hex}" ${c.nom === block.color ? 'selected' : ''}>${c.nom}</option>`;
      }).join('');
      const sizeInputs = getTaillesProduit(item, block.color).map(size => `
        <div class="som-size-cell">
          <label class="som-size-label">${size}</label>
          <input type="number" class="som-qty-input" min="0" value="${block.quantities[size] || 0}" step="1"
                 oninput="SOM.updateQty('${block.id}','${size}',this.value)">
        </div>`).join('');
      const blockTotal = Object.values(block.quantities).reduce((a, b) => a + b, 0);
      const ok = blockTotal >= MIN_PER_COLOR;
      const hex = COLOR_MAP[(block.color || '').toLowerCase().replace(/\s+/g, '-')] || '#ccc';
      return `
        <div class="som-color-block${ok ? ' som-color-block--ok' : ''}" id="block-${block.id}">
          <div class="som-color-block__header">
            <div class="som-color-block__color-select">
              <div class="som-color-preview" id="preview-${block.id}" style="background:${hex}"></div>
              <select class="som-input som-input--color" onchange="SOM.updateColor('${block.id}',this)">${colorOptions}</select>
            </div>
            <div class="som-color-block__total">
              <span id="block-total-${block.id}" class="${ok ? 'ok' : ''}">${blockTotal}</span> articles
              <span id="min-badge-${block.id}">${ok ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--som-green)"><polyline points="20 6 9 17 4 12"/></svg>' : '<span style="color:#cc4444;font-size:12px">min. 12</span>'}</span>
            </div>
            ${item.colorBlocks.length > 1 ? `<button class="som-btn-remove" type="button" onclick="SOM.removeColorBlock('${block.id}')" title="Supprimer">×</button>` : ''}
          </div>
          <div class="som-size-grid">${sizeInputs}</div>
        </div>`;
    }).join('');
  }

  function updateColor(blockId, select) {
    if (!panierItemEnCours) return;
    const block = panierItemEnCours.colorBlocks.find(b => b.id === blockId);
    if (!block) return;
    block.color = select.value;
    block.colorHex = select.options[select.selectedIndex].dataset.hex || '#ccc';
    const preview = document.getElementById('preview-' + blockId);
    if (preview) preview.style.background = block.colorHex;
    const newTailles = getTaillesProduit(panierItemEnCours, block.color);
    block.quantities = {};
    newTailles.forEach(s => block.quantities[s] = 0);
    renderColorBlocks();
    updateQtySummary();
  }

  function updateQty(blockId, size, val) {
    if (!panierItemEnCours) return;
    const block = panierItemEnCours.colorBlocks.find(b => b.id === blockId);
    if (!block) return;
    block.quantities[size] = Math.max(0, parseInt(val) || 0);
    const blockTotal = Object.values(block.quantities).reduce((a, b) => a + b, 0);
    const ok = blockTotal >= MIN_PER_COLOR;
    const totalEl = document.getElementById('block-total-' + blockId);
    if (totalEl) { totalEl.textContent = blockTotal; totalEl.className = ok ? 'ok' : ''; }
    const blockEl = document.getElementById('block-' + blockId);
    if (blockEl) blockEl.classList.toggle('som-color-block--ok', ok);
    // Mettre à jour le badge min. 12 / checkmark
    const minBadge = document.getElementById('min-badge-' + blockId);
    if (minBadge) {
      minBadge.innerHTML = ok
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--som-green)"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<span style="color:#cc4444;font-size:12px">min. 12</span>';
    }
    updateQtySummary();
  }

  function updateQtySummary() {
    const item = panierItemEnCours;
    if (!item) return;
    const grandTotal = item.colorBlocks.reduce((sum, b) => sum + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0);
    const allOk = item.colorBlocks.length > 0 && item.colorBlocks.every(b => Object.values(b.quantities).reduce((a, c) => a + c, 0) >= MIN_PER_COLOR);
    document.getElementById('grand-total').textContent = grandTotal;
    const msg = document.getElementById('qty-msg');
    const btn = document.getElementById('btn-next-1');
    if (allOk) {
      msg.textContent = '✓ Toutes les couleurs atteignent le minimum de 12 articles.';
      msg.className = 'som-qty-summary__msg ok';
      btn.disabled = false;
    } else {
      msg.textContent = 'Chaque couleur doit avoir au moins 12 articles.';
      msg.className = 'som-qty-summary__msg';
      btn.disabled = true;
    }
  }

  function initPlacements() {
    // DTF emplacements
    document.querySelectorAll('input[name="placement[]"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (!panierItemEnCours) return;
        const checked = Array.from(document.querySelectorAll('input[name="placement[]"]:checked'));
        panierItemEnCours.placements = checked.map(c => ({
          value: c.value,
          label: c.closest('.som-placement-card').querySelector('.som-placement-card__label').textContent,
          size: c.closest('.som-placement-card').querySelector('.som-placement-card__size').textContent,
          price: parseFloat(c.dataset.price) || 0
        }));
        panierItemEnCours.placementPrice = panierItemEnCours.placements.reduce((s, p) => s + p.price, 0);
      });
    });
    // Patches
    document.querySelectorAll('input[name="patch[]"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (!panierItemEnCours) return;
        const checked = Array.from(document.querySelectorAll('input[name="patch[]"]:checked'));
        panierItemEnCours.patches = checked.map(c => ({
          value: c.value,
          label: c.closest('.som-placement-card').querySelector('.som-placement-card__label').textContent,
          size: c.closest('.som-placement-card').querySelector('.som-placement-card__size').textContent,
          price: parseFloat(c.dataset.price) || 0
        }));
      });
    });
  }

  function setDecoMode(mode) {
    if (panierItemEnCours) panierItemEnCours.decoMode = mode;
    const btnDtf = document.getElementById('btn-deco-dtf');
    const btnPatch = document.getElementById('btn-deco-patch');
    const secDtf = document.getElementById('deco-dtf-section');
    const secPatch = document.getElementById('deco-patch-section');
    if (btnDtf) btnDtf.classList.toggle('active', mode === 'dtf');
    if (btnPatch) btnPatch.classList.toggle('active', mode === 'patch');
    if (secDtf) secDtf.style.display = mode === 'dtf' ? 'block' : 'none';
    if (secPatch) secPatch.style.display = mode === 'patch' ? 'block' : 'none';
    // Vider la sélection de l'autre mode
    if (panierItemEnCours) {
      if (mode === 'dtf') {
        document.querySelectorAll('input[name="patch[]"]').forEach(cb => cb.checked = false);
        panierItemEnCours.patches = [];
      } else {
        document.querySelectorAll('input[name="placement[]"]').forEach(cb => cb.checked = false);
        panierItemEnCours.placements = [];
        panierItemEnCours.placementPrice = 0;
      }
    }
  }

  /* ── Logo ── */
  function resetLogoUI() {
    const dzIdle = document.getElementById('dz-idle');
    const dzSuccess = document.getElementById('dz-success');
    const dropzone = document.getElementById('dropzone');
    const svgPreviewBox = document.getElementById('svg-preview-box');
    const logoInput = document.getElementById('logo-input');
    if (dzIdle) dzIdle.style.display = 'flex';
    if (dzSuccess) dzSuccess.style.display = 'none';
    if (dropzone) dropzone.classList.remove('success', 'drag-over');
    if (svgPreviewBox) svgPreviewBox.style.display = 'none';
    if (document.getElementById('svg-preview')) document.getElementById('svg-preview').innerHTML = '';
    if (logoInput) logoInput.value = '';
    if (document.getElementById('logo-error')) document.getElementById('logo-error').style.display = 'none';
    // Reset mode logo
    setLogoMode('has');
  }

  function setLogoMode(mode) {
    if (panierItemEnCours) panierItemEnCours.logoMode = mode;
    document.getElementById('btn-has-logo').classList.toggle('active', mode === 'has');
    document.getElementById('btn-no-logo').classList.toggle('active', mode === 'no');
    document.getElementById('logo-upload-section').style.display = mode === 'has' ? 'block' : 'none';
    document.getElementById('logo-designer-section').style.display = mode === 'no' ? 'block' : 'none';
    const hasFile = panierItemEnCours?.logoFile;
    document.getElementById('btn-next-2').disabled = mode === 'no' ? false : !hasFile;
  }

  function handleFile(file) {
    document.getElementById('logo-error').style.display = 'none';
    if (!file) return;
    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    const formatsVectoriels = ['.ai', '.svg', '.eps', '.pdf'];
    const formatsImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const tousFormats = [...formatsVectoriels, ...formatsImage];
    if (!tousFormats.includes(ext)) {
      showLogoError('Format non accepté. Utilisez .AI, .SVG, .PDF, .JPG ou .PNG.');
      document.getElementById('logo-input').value = '';
      return;
    }
    const estVectoriel = ['.ai', '.svg', '.eps'].includes(ext);
    if (panierItemEnCours) {
      panierItemEnCours.logoFile = file;
      panierItemEnCours.logoName = file.name;
      panierItemEnCours.logoVectoriel = estVectoriel;
    }
    document.getElementById('dz-idle').style.display = 'none';
    document.getElementById('dz-success').style.display = 'flex';
    document.getElementById('dz-filename').textContent = file.name;
    document.getElementById('dropzone').classList.add('success');
    document.getElementById('btn-next-2').disabled = false;
    // Avertissement vectorisation si format image
    const warnEl = document.getElementById('logo-vecto-warning');
    if (warnEl) warnEl.style.display = estVectoriel ? 'none' : 'flex';
    if (ext === '.svg' || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = e => {
        const c = e.target.result;
        if (!c.includes('<script')) {
          document.getElementById('svg-preview').innerHTML = c;
          document.getElementById('svg-preview-box').style.display = 'block';
        }
      };
      reader.readAsText(file);
    }
  }

  function handleRefFile(file) {
    if (!file || !panierItemEnCours) return;
    panierItemEnCours.logoRefFile = file;
    const refSuccess = document.getElementById('ref-success');
    const refIdle = document.getElementById('ref-idle');
    if (document.getElementById('ref-filename')) document.getElementById('ref-filename').textContent = file.name;
    if (refSuccess) refSuccess.style.display = 'flex';
    if (refIdle) refIdle.style.display = 'none';
    document.getElementById('btn-next-2').disabled = false;
  }

  function clearLogo() {
    if (panierItemEnCours) { panierItemEnCours.logoFile = null; panierItemEnCours.logoName = ''; }
    resetLogoUI();
  }

  function dragOver(e) { e.preventDefault(); document.getElementById('dropzone').classList.add('drag-over'); }
  function dragLeave() { document.getElementById('dropzone').classList.remove('drag-over'); }
  function dropFile(e) {
    e.preventDefault(); dragLeave();
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer(); dt.items.add(file);
      document.getElementById('logo-input').files = dt.files;
      handleFile(file);
    }
  }
  function showLogoError(msg) {
    const el = document.getElementById('logo-error');
    el.textContent = msg; el.style.display = 'block';
  }

  /* ══════════════════════════════════════
     PANIER — ajout et gestion
  ══════════════════════════════════════ */

  function ajouterAuPanier() {
    if (!panierItemEnCours) return;
    // Sauvegarder les notes logo si présentes
    const logoNotes = document.getElementById('logo-notes')?.value || '';
    const logoDesc = document.getElementById('logo-description')?.value || '';
    panierItemEnCours.logoNotes = logoNotes;
    panierItemEnCours.logoDescription = logoDesc;

    // Ajouter ou mettre à jour dans le panier
    const existingIdx = panier.findIndex(i => i.id === panierItemEnCours.id);
    if (existingIdx >= 0) {
      panier[existingIdx] = { ...panierItemEnCours };
    } else {
      panier.push({ ...panierItemEnCours });
    }

    panierItemEnCours = null;
    document.getElementById('som-form-section').style.display = 'none';
    renderPanier();
    renderCatalogue(); // Mettre à jour les badges "Ajouté"
  }

  function retirerDuPanier(itemId) {
    const idx = panier.findIndex(i => i.id === itemId);
    if (idx >= 0) panier.splice(idx, 1);
    renderPanier();
    renderCatalogue();
  }

  function modifierItem(itemId) {
    const item = panier.find(i => i.id === itemId);
    if (!item) return;
    panierItemEnCours = { ...item };
    const panierSection = document.getElementById('som-panier-section');
    if (panierSection) panierSection.style.display = 'none';
    ouvrirConfigProduit(item.colorBlocks[0]?.color || null);
  }

  function renderPanier() {
    let section = document.getElementById('som-panier-section');
    if (!section) {
      section = document.createElement('div');
      section.id = 'som-panier-section';
      section.className = 'som-panier-section';
      const formSection = document.getElementById('som-form-section');
      formSection.parentNode.insertBefore(section, formSection);
    }

    if (panier.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    section.innerHTML = `
      <div class="som-container">
        <div class="som-panier-header">
          <div class="som-panier-titre">VOTRE COMMANDE <span class="som-panier-count">${panier.length} produit${panier.length > 1 ? 's' : ''}</span></div>
        </div>
        <div class="som-panier-items">
          ${panier.map(item => {
            const totalQty = item.colorBlocks.reduce((s, b) => s + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0);
            const couleursResume = item.colorBlocks.map(b => {
              const hex = COLOR_MAP[(b.color || '').toLowerCase().replace(/\s+/g, '-')] || '#888';
              const qty = Object.values(b.quantities).reduce((a, c) => a + c, 0);
              return `<span class="som-panier-swatch" style="background:${hex}" title="${b.color}"></span><span class="som-panier-color-qty">${getNomCouleurFR(b.color)} ×${qty}</span>`;
            }).join('');
            const logoInfo = item.logoMode === 'has' ? (item.logoName || '—') : 'Designer demandé';
            return `
              <div class="som-panier-item">
                <div class="som-panier-item__img">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
                </div>
                <div class="som-panier-item__info">
                  <div class="som-panier-item__name">${item.name}</div>
                  <div class="som-panier-item__sku">SKU : ${item.sku}</div>
                  <div class="som-panier-item__couleurs">${couleursResume}</div>
                  <div class="som-panier-item__meta">
                    <span>${totalQty} articles</span>
                    <span>·</span>
                    <span>${(item.placements || []).map(p => p.label).join(', ') || 'Aucun'}</span>
                    <span>·</span>
                    <span>${logoInfo}</span>
                  </div>
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

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ajouterAutreProduit() {
    const section = document.getElementById('som-panier-section');
    if (section) section.style.display = 'none';
    document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
  }

  function passerAuxCoordonnees() {
    if (panier.length === 0) return;
    const section = document.getElementById('som-panier-section');
    if (section) section.style.display = 'none';
    const formSection = document.getElementById('som-form-section');
    formSection.style.display = 'block';

    // Masquer les panneaux 1-2-3, aller directement au panneau coordonnées
    // On réutilise le panel-3 (coordonnées) et panel-4 (confirmation)
    // On crée un faux état pour le header
    document.getElementById('sel-name').textContent = `${panier.length} produit${panier.length > 1 ? 's' : ''} sélectionné${panier.length > 1 ? 's' : ''}`;
    document.getElementById('sel-sku').textContent = panier.map(i => i.sku).join(', ');
    const imgEl = document.getElementById('sel-img');
    imgEl.innerHTML = panier[0]?.image ? `<img src="${panier[0].image}" alt="" style="width:100%;height:100%;object-fit:cover;">` : '';

    goStepCoordonnees();
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goStepCoordonnees() {
    // Cacher tous les panels
    document.querySelectorAll('.som-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-3').classList.add('active');
    // Mettre à jour les steps — on saute 1 et 2
    document.querySelectorAll('.som-step').forEach(s => {
      const n = parseInt(s.dataset.step);
      s.classList.toggle('active', n === 3);
      s.classList.toggle('done', n < 3);
    });
    document.getElementById('som-steps').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ══════════════════════════════════════
     RÉCAP & SOUMISSION
  ══════════════════════════════════════ */

  function buildRecap() {
    syncHidden();
    const container = document.getElementById('som-recap');
    if (!container) return;

    const panierHtml = panier.map(item => {
      const totalQty = item.colorBlocks.reduce((s, b) => s + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0);
      const blocksHtml = item.colorBlocks.map(b => {
        const total = Object.values(b.quantities).reduce((a, c) => a + c, 0);
        const sizes = SIZES.filter(s => b.quantities[s] > 0).map(s => `${b.quantities[s]}×${s}`).join(', ');
        const hex = COLOR_MAP[(b.color || '').toLowerCase().replace(/\s+/g, '-')] || '#ccc';
        return `<div class="som-recap-color"><span class="som-recap-swatch" style="background:${hex}"></span><strong>${getNomCouleurFR(b.color)}</strong> — ${total} articles (${sizes})</div>`;
      }).join('');
      const logoInfo = item.logoMode === 'has' ? (item.logoName || '—') : 'Service designer demandé';
      return `
        <div class="som-recap-produit">
          <div class="som-recap-produit__header">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="som-recap-produit__img">` : ''}
            <div>
              <strong>${item.name}</strong> <span style="color:#555">(${item.sku})</span>
              <div style="font-size:12px;color:#666;margin-top:2px">${totalQty} articles · ${(item.placements || []).map(p => p.label).join(', ') || 'Aucun emplacement'} · Logo : ${logoInfo}</div>
            </div>
          </div>
          <div style="margin-top:10px">${blocksHtml}</div>
        </div>`;
    }).join('');

    const grandTotal = panier.reduce((s, item) =>
      s + item.colorBlocks.reduce((ss, b) => ss + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0), 0);

    container.innerHTML = `
      <div class="som-recap-section">
        <h4>Commande — ${panier.length} produit${panier.length > 1 ? 's' : ''}</h4>
        ${panierHtml}
        <p style="margin-top:12px;font-weight:600">Total : ${grandTotal} articles</p>
      </div>
      <div class="som-recap-section"><h4>Coordonnées</h4>
        <p>${document.getElementById('f-prenom').value} ${document.getElementById('f-nom').value}${document.getElementById('f-entreprise').value ? ' — ' + document.getElementById('f-entreprise').value : ''}</p>
        <p>${document.getElementById('f-email').value} · ${document.getElementById('f-tel').value}</p>
        <p>Préférence : ${document.querySelector('input[name="pref_contact"]:checked')?.value || ''}${document.getElementById('f-moment').value ? ' · ' + document.getElementById('f-moment').value : ''}</p>
      </div>`;
  }

  function syncHidden() {
    const grandTotal = panier.reduce((s, item) =>
      s + item.colorBlocks.reduce((ss, b) => ss + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0), 0);
    // Sérialiser tout le panier (sans les fichiers File)
    const panierSerialisable = panier.map(item => ({
      ...item,
      logoFile: item.logoName || '',
      logoRefFile: item.logoRefFile ? item.logoRefFile.name : '',
    }));
    if (document.getElementById('h-product-name')) document.getElementById('h-product-name').value = panier.map(i => i.name).join(' | ');
    if (document.getElementById('h-product-sku')) document.getElementById('h-product-sku').value = panier.map(i => i.sku).join(' | ');
    if (document.getElementById('h-color-blocks')) document.getElementById('h-color-blocks').value = JSON.stringify(panierSerialisable);
    if (document.getElementById('h-placement')) document.getElementById('h-placement').value = panier.map(i => (i.placements || []).map(p => p.label).join(', ')).join(' | ');
    if (document.getElementById('h-total-qty')) document.getElementById('h-total-qty').value = grandTotal;
    if (document.getElementById('h-logo-mode')) document.getElementById('h-logo-mode').value = panier.map(i => i.logoMode).join(' | ');
    if (document.getElementById('h-prenom')) document.getElementById('h-prenom').value = document.getElementById('f-prenom').value;
    if (document.getElementById('h-nom')) document.getElementById('h-nom').value = document.getElementById('f-nom').value;
    if (document.getElementById('h-email')) document.getElementById('h-email').value = document.getElementById('f-email').value;
    if (document.getElementById('h-tel')) document.getElementById('h-tel').value = document.getElementById('f-tel').value;
    if (document.getElementById('h-entreprise')) document.getElementById('h-entreprise').value = document.getElementById('f-entreprise').value;
    if (document.getElementById('h-pref-contact')) document.getElementById('h-pref-contact').value = document.querySelector('input[name="pref_contact"]:checked')?.value || '';
    if (document.getElementById('h-moment')) document.getElementById('h-moment').value = document.getElementById('f-moment').value;
    if (document.getElementById('h-message')) document.getElementById('h-message').value = document.getElementById('f-message').value;
  }

  function initForm() {
    const form = document.getElementById('som-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      syncHidden();
      const prenom = document.getElementById('f-prenom').value.trim();
      const nom = document.getElementById('f-nom').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const tel = document.getElementById('f-tel').value.trim();
      if (!prenom || !nom || !email || !tel) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      const btn = document.getElementById('btn-submit');
      btn.innerHTML = '<span>Envoi en cours…</span>';
      btn.disabled = true;
      const fd = new FormData(form);
      // Attacher tous les logos
      panier.forEach((item, i) => {
        if (item.logoFile) fd.set(`logo_file_${i}`, item.logoFile, item.logoFile.name);
        if (item.logoRefFile) fd.set(`logo_ref_file_${i}`, item.logoRefFile, item.logoRefFile.name);
      });
      try {
        const r = await fetch(form.action, { method: 'POST', body: fd });
        const data = await r.json();
        if (data.success) {
          document.querySelectorAll('.som-panel').forEach(p => p.classList.remove('active'));
          document.getElementById('panel-5').classList.add('active');
          if (data.data?.ref) document.getElementById('conf-ref').textContent = 'Référence : ' + data.data.ref;
        } else {
          alert(data.data?.message || 'Une erreur est survenue.');
          btn.innerHTML = '<span>Envoyer ma demande de soumission</span>';
          btn.disabled = false;
        }
      } catch(err) {
        alert('Erreur de connexion.');
        btn.innerHTML = '<span>Envoyer ma demande de soumission</span>';
        btn.disabled = false;
      }
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadAllProducts();
    currentSousCat = null;
    renderSousCats();
    renderCatalogue();
    initPlacements();
    initForm();
  });

  /* ── Recherche ── */
  function setSearch(val) {
    searchQuery = val;
    currentPage = 1;
    const clearBtn = document.getElementById('som-search-clear');
    if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
    renderCatalogue();
  }

  function clearSearch() {
    searchQuery = '';
    const input = document.getElementById('som-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('som-search-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    currentPage = 1;
    renderCatalogue();
  }

  /* ── API publique ── */
  window.SOM = {
    goPage, setPerPage,
    openModal, openModalIdx, closeModal, selectSwatch, setMainImg, choisirProduit,
    goStep, addColorBlock, removeColorBlock, updateColor, updateQty,
    setLogoMode, setDecoMode, handleFile, handleRefFile, clearLogo, dragOver, dragLeave, dropFile,
    ajouterAuPanier, retirerDuPanier, modifierItem, ajouterAutreProduit, passerAuxCoordonnees,
    retourCatalogue, buildRecap,
    setSearch, clearSearch,
  };

})();
