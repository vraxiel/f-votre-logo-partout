/**
 * soumission-page.js — F Votre Logo Partout v3
 * Catégories dynamiques depuis /api/categories-menu
 */
(function () {
  'use strict';

  const AJAX = window.soumissionData?.ajaxUrl || '/wp-admin/admin-ajax.php';
  const API_BASE = 'http://localhost:5000';
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

  window.SOM_COLOR_MAP = COLOR_MAP;

  // Catégories chargées dynamiquement depuis l'API
  let CATEGORIES = [];
  let currentCat = null;
  let currentSousCat = null;

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
  let currentPage = 1;
  let perPage = 24;

  /* ── Chargement menu catégories ── */
  async function loadCategories() {
    try {
      const r = await fetch(AJAX + '?action=flask_proxy&endpoint=categories-menu');
      const j = await r.json();
      if (j.success && Array.isArray(j.data)) {
        CATEGORIES = j.data;
      }
    } catch(e) {
      console.warn('Impossible de charger les catégories depuis l\'API', e);
      CATEGORIES = [];
    }
    if (CATEGORIES.length > 0) {
      currentCat = CATEGORIES[0].label;
    }
    buildFilterBar();
  }

  /* ── Construction dynamique de la barre de filtres ── */
  function buildFilterBar() {
    const filtersEl = document.getElementById('som-filters');
    if (!filtersEl) return;
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

  /* ── Chargement produits ── */
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

  /* ── Trouver la config d'une catégorie par label ── */
  function getCatConfig(label) {
    return CATEGORIES.find(c => c.label === label) || null;
  }

  /* ── Filtrage produits ── */
  function filterProducts(catLabel, sousCatLabel) {
    const cfg = getCatConfig(catLabel);
    if (!cfg) return [];

    // Catégorie de type SKUs (ex: Vedettes)
    if (cfg.type === 'skus' && cfg.skus) {
      const sl = cfg.skus.map(s => s.toLowerCase());
      return allProducts.filter(p => sl.includes((p.sku || '').toLowerCase()));
    }

    // Catégorie de type catalogue (filtrage par cat_parent / cat_enfant)
    if (cfg.type === 'catalogue' && cfg.cat_parent) {
      let sousCatEnfant = null;
      if (sousCatLabel && cfg.sous_cats) {
        const sc = cfg.sous_cats.find(s => s.label === sousCatLabel);
        sousCatEnfant = sc ? sc.cat_enfant : null;
      } else if (cfg.sous_cats && cfg.sous_cats.length > 0) {
        sousCatEnfant = cfg.sous_cats[0].cat_enfant; // "Tous" par défaut
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

  /* ── Rendu catalogue ── */
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
    grid.innerHTML = paginated.map((p) => {
      const dispo = p.couleurs?.some(c => c.disponible) ?? true;
      const imgHtml = p.image
        ? `<img src="${p.image}" alt="${p.nom}" loading="lazy">`
        : `<div class="som-card__no-img"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      const swatches = (p.couleurs || []).slice(0, 8).map(c => {
        const img = c.images?.[0] || '';
        return `<span class="som-swatch" title="${c.nom}" style="background:#f5f5f5;overflow:hidden;display:inline-block;">${img ? `<img src="${img}" alt="${c.nom}" style="width:100%;height:100%;object-fit:cover;">` : ''}</span>`;
      }).join('') + ((p.couleurs || []).length > 8 ? `<span class="som-swatch-more">+${(p.couleurs || []).length - 8}</span>` : '');
      const idx = allProducts.indexOf(p);
      return `
        <div class="som-card${!dispo ? ' som-card--out' : ''}" style="cursor:pointer;" onclick='SOM.openModalIdx(${idx})'>
          <div class="som-card__img">
            ${imgHtml}
            <span class="som-card__badge${dispo ? ' som-card__badge--in' : ' som-card__badge--out'}">
              <span class="som-card__dot"></span>${dispo ? 'En stock' : 'Rupture'}
            </span>
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


  /* ── Pagination ── */
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
    if (total === 0) { container.innerHTML = ''; return; }
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
    containerTop.innerHTML = container.innerHTML = `
      <div class="som-pagination__info">${total} produit${total > 1 ? 's' : ''}</div>
      <div class="som-pagination__pages">
        <button class="som-page-btn" onclick="SOM.goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>←</button>
        ${pages}
        <button class="som-page-btn" onclick="SOM.goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>→</button>
      </div>
      <div class="som-pagination__perpage">
        <select class="som-perpage-select" onchange="SOM.setPerPage(parseInt(this.value))">${perPageOptions}</select>
      </div>`;
  }

  function goPage(page) {
    const products = filterProducts(currentCat, currentSousCat);
    const totalPages = Math.ceil(products.length / perPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCatalogue();
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setPerPage(n) {
    perPage = n;
    currentPage = 1;
    renderCatalogue();
  }

  /* ── Sous-catégories dynamiques ── */
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

    // Sélectionner la première sous-cat par défaut
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

  /* ── Sélection produit ── */
  function selectProduct(idx, name, sku, image, couleurs) {
    state.product = { idx, name, sku, image, couleurs };
    state.colorBlocks = [];
    const formSection = document.getElementById('som-form-section');
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('sel-name').textContent = name;
    document.getElementById('sel-sku').textContent = 'SKU : ' + sku;
    const imgEl = document.getElementById('sel-img');
    imgEl.innerHTML = image ? `<img src="${image}" alt="${name}" style="width:100%;height:100%;object-fit:cover;">` : '';
    state.currentStep = 0;
    goStep(1);
    addColorBlock();
  }

  function resetProduct() {
    state.product = null;
    state.colorBlocks = [];
    document.getElementById('som-form-section').style.display = 'none';
    document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Étapes ── */
  function goStep(step) {
    document.querySelectorAll('.som-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + step).classList.add('active');
    document.querySelectorAll('.som-step').forEach(s => {
      const n = parseInt(s.dataset.step);
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
    });
    state.currentStep = step;
    if (step === 4) buildRecap();
    document.getElementById('som-steps').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Blocs couleur ── */
  function addColorBlock() {
    const couleurs = (state.product?.couleurs || []).filter(c => c.disponible);
    const blockId = 'b' + Date.now();
    const block = { id: blockId, color: couleurs[0]?.nom || '', colorHex: '#ccc', quantities: {} };
    SIZES.forEach(s => block.quantities[s] = 0);
    state.colorBlocks.push(block);
    renderColorBlocks();
  }

  function removeColorBlock(id) {
    state.colorBlocks = state.colorBlocks.filter(b => b.id !== id);
    renderColorBlocks();
    updateQtySummary();
  }

  function renderColorBlocks() {
    const container = document.getElementById('color-blocks-container');
    const couleurs = (state.product?.couleurs || []).filter(c => c.disponible);
    container.innerHTML = state.colorBlocks.map(block => {
      const colorOptions = couleurs.map(c => {
        const slug = (c.nom || '').toLowerCase().replace(/\s+/g, '-');
        const hex = COLOR_MAP[slug] || COLOR_MAP[(c.nom || '').toLowerCase()] || '#ccc';
        return `<option value="${c.nom}" data-hex="${hex}" ${c.nom === block.color ? 'selected' : ''}>${c.nom}</option>`;
      }).join('');
      const sizeInputs = SIZES.map(size => `
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
              ${ok ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--som-green)"><polyline points="20 6 9 17 4 12"/></svg>' : '<span style="color:#c0293a;font-size:12px">min. 12</span>'}
            </div>
            ${state.colorBlocks.length > 1 ? `<button class="som-btn-remove" type="button" onclick="SOM.removeColorBlock('${block.id}')" title="Supprimer">×</button>` : ''}
          </div>
          <div class="som-size-grid">${sizeInputs}</div>
        </div>`;
    }).join('');
  }

  function updateColor(blockId, select) {
    const block = state.colorBlocks.find(b => b.id === blockId);
    if (!block) return;
    block.color = select.value;
    const hex = select.options[select.selectedIndex].dataset.hex || '#ccc';
    block.colorHex = hex;
    const preview = document.getElementById('preview-' + blockId);
    if (preview) preview.style.background = hex;
  }

  function updateQty(blockId, size, val) {
    const block = state.colorBlocks.find(b => b.id === blockId);
    if (!block) return;
    block.quantities[size] = Math.max(0, parseInt(val) || 0);
    const blockTotal = Object.values(block.quantities).reduce((a, b) => a + b, 0);
    const ok = blockTotal >= MIN_PER_COLOR;
    const totalEl = document.getElementById('block-total-' + blockId);
    if (totalEl) { totalEl.textContent = blockTotal; totalEl.className = ok ? 'ok' : ''; }
    const blockEl = document.getElementById('block-' + blockId);
    if (blockEl) blockEl.classList.toggle('som-color-block--ok', ok);
    updateQtySummary();
  }

  function updateQtySummary() {
    const grandTotal = state.colorBlocks.reduce((sum, b) => sum + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0);
    const allOk = state.colorBlocks.length > 0 && state.colorBlocks.every(b => Object.values(b.quantities).reduce((a, c) => a + c, 0) >= MIN_PER_COLOR);
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
    document.querySelectorAll('input[name="placement"]').forEach(r => {
      r.addEventListener('change', () => {
        state.placement = r.value;
        state.placementPrice = parseFloat(r.dataset.price) || 0;
      });
    });
  }

  /* ── Logo ── */
  function setLogoMode(mode) {
    state.logoMode = mode;
    document.getElementById('btn-has-logo').classList.toggle('active', mode === 'has');
    document.getElementById('btn-no-logo').classList.toggle('active', mode === 'no');
    document.getElementById('logo-upload-section').style.display = mode === 'has' ? 'block' : 'none';
    document.getElementById('logo-designer-section').style.display = mode === 'no' ? 'block' : 'none';
    document.getElementById('btn-next-2').disabled = mode === 'no' ? false : !state.logoFile;
  }

  function handleFile(file) {
    document.getElementById('logo-error').style.display = 'none';
    if (!file) return;
    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    if (!['.ai', '.svg'].includes(ext)) {
      showLogoError('Seuls les fichiers .AI et .SVG sont acceptés.');
      document.getElementById('logo-input').value = '';
      return;
    }
    state.logoFile = file;
    state.logoName = file.name;
    document.getElementById('dz-idle').style.display = 'none';
    document.getElementById('dz-success').style.display = 'flex';
    document.getElementById('dz-filename').textContent = file.name;
    document.getElementById('dropzone').classList.add('success');
    document.getElementById('btn-next-2').disabled = false;
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
    if (!file) return;
    state.logoRefFile = file;
    const refSuccess = document.getElementById('ref-success');
    const refIdle = document.getElementById('ref-idle');
    const refFilename = document.getElementById('ref-filename');
    if (refFilename) refFilename.textContent = file.name;
    if (refSuccess) refSuccess.style.display = 'flex';
    if (refIdle) refIdle.style.display = 'none';
    document.getElementById('btn-next-2').disabled = false;
  }

  function clearLogo() {
    state.logoFile = null;
    state.logoName = '';
    document.getElementById('logo-input').value = '';
    document.getElementById('dz-idle').style.display = 'flex';
    document.getElementById('dz-success').style.display = 'none';
    document.getElementById('dropzone').classList.remove('success');
    document.getElementById('svg-preview-box').style.display = 'none';
    document.getElementById('svg-preview').innerHTML = '';
    document.getElementById('btn-next-2').disabled = true;
  }

  function dragOver(e) { e.preventDefault(); document.getElementById('dropzone').classList.add('drag-over'); }
  function dragLeave() { document.getElementById('dropzone').classList.remove('drag-over'); }
  function dropFile(e) {
    e.preventDefault();
    dragLeave();
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('logo-input').files = dt.files;
      handleFile(file);
    }
  }
  function showLogoError(msg) {
    const el = document.getElementById('logo-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  /* ── Récap ── */
  function buildRecap() {
    syncHidden();
    const container = document.getElementById('som-recap');
    const blocksHtml = state.colorBlocks.map(b => {
      const total = Object.values(b.quantities).reduce((a, c) => a + c, 0);
      const sizes = SIZES.filter(s => b.quantities[s] > 0).map(s => `${b.quantities[s]}×${s}`).join(', ');
      const hex = COLOR_MAP[(b.color || '').toLowerCase().replace(/\s+/g, '-')] || '#ccc';
      return `<div class="som-recap-color"><span class="som-recap-swatch" style="background:${hex}"></span><strong>${b.color}</strong> — ${total} articles (${sizes})</div>`;
    }).join('');
    const placementLabel = document.querySelector('.som-placement-card:has(input:checked) .som-placement-card__label')?.textContent || state.placement;
    const logoInfo = state.logoMode === 'has' ? (state.logoName || '—') : 'Service designer demandé';
    const grandTotal = state.colorBlocks.reduce((s, b) => s + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0);
    containerTop.innerHTML = container.innerHTML = `
      <div class="som-recap-section"><h4>Produit</h4><p>${state.product?.name || '—'} <span style="color:#888">(SKU: ${state.product?.sku || '—'})</span></p></div>
      <div class="som-recap-section"><h4>Quantités & couleurs</h4>${blocksHtml}<p style="margin-top:8px"><strong>Total : ${grandTotal} articles</strong></p><p>Emplacement : ${placementLabel}</p></div>
      <div class="som-recap-section"><h4>Logo</h4><p>${logoInfo}</p></div>
      <div class="som-recap-section"><h4>Coordonnées</h4>
        <p>${document.getElementById('f-prenom').value} ${document.getElementById('f-nom').value}${document.getElementById('f-entreprise').value ? ' — ' + document.getElementById('f-entreprise').value : ''}</p>
        <p>${document.getElementById('f-email').value} · ${document.getElementById('f-tel').value}</p>
        <p>Préférence : ${document.querySelector('input[name="pref_contact"]:checked')?.value || ''}${document.getElementById('f-moment').value ? ' · ' + document.getElementById('f-moment').value : ''}</p>
      </div>`;
  }

  function syncHidden() {
    document.getElementById('h-product-name').value = state.product?.name || '';
    document.getElementById('h-product-sku').value = state.product?.sku || '';
    document.getElementById('h-color-blocks').value = JSON.stringify(state.colorBlocks);
    document.getElementById('h-placement').value = state.placement;
    document.getElementById('h-total-qty').value = state.colorBlocks.reduce((s, b) => s + Object.values(b.quantities).reduce((a, c) => a + c, 0), 0);
    document.getElementById('h-logo-mode').value = state.logoMode;
    document.getElementById('h-prenom').value = document.getElementById('f-prenom').value;
    document.getElementById('h-nom').value = document.getElementById('f-nom').value;
    document.getElementById('h-email').value = document.getElementById('f-email').value;
    document.getElementById('h-tel').value = document.getElementById('f-tel').value;
    document.getElementById('h-entreprise').value = document.getElementById('f-entreprise').value;
    document.getElementById('h-pref-contact').value = document.querySelector('input[name="pref_contact"]:checked')?.value || '';
    document.getElementById('h-moment').value = document.getElementById('f-moment').value;
    document.getElementById('h-message').value = document.getElementById('f-message').value;
    document.getElementById('h-logo-notes').value = document.getElementById('logo-notes')?.value || '';
    document.getElementById('h-logo-description').value = document.getElementById('logo-description')?.value || '';
  }

  /* ── Form submit ── */
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
        goStep(3);
        return;
      }
      if (state.logoMode === 'no' && !document.getElementById('logo-description').value.trim()) {
        alert('Veuillez décrire votre logo.');
        goStep(2);
        return;
      }
      const btn = document.getElementById('btn-submit');
      btn.innerHTML = '<span>Envoi en cours…</span>';
      btn.disabled = true;
      const fd = new FormData(form);
      if (state.logoFile) fd.set('logo_file', state.logoFile, state.logoFile.name);
      if (state.logoRefFile) fd.set('logo_ref_file', state.logoRefFile, state.logoRefFile.name);
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

  /* ── Modale produit ── */
  let modalProduit = null;

  function openModalIdx(idx) {
    const p = allProducts[idx];
    if (p) openModal(idx, p.nom, p.sku, p.image || '', p.couleurs || []);
  }

  function openModal(idx, name, sku, image, couleurs) {
    modalProduit = { idx, name, sku, image, couleurs };
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
      mainEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ccc">Aucune image</div>`;
      thumbsEl.innerHTML = '';
    }
    const dispo = document.getElementById('modal-dispo');
    dispo.innerHTML = couleur?.disponible
      ? '<span style="color:#00b894;font-weight:600">En stock</span>'
      : '<span style="color:#c0293a;font-weight:600">Rupture de stock</span>';
  }

  function renderModalSwatches(couleurs, active) {
    document.getElementById('modal-swatches').innerHTML = couleurs.map(c => {
      const img = c.images?.[0] || '';
      return `<div class="som-modal__swatch${c.nom === active?.nom ? ' active' : ''}${!c.disponible ? ' som-modal__swatch--out' : ''}"
        title="${c.nom}"
        onclick="SOM.selectSwatch(this.title)"
        style="background:#f5f5f5;overflow:hidden;">
        ${img ? `<img src="${img}" alt="${c.nom}" style="width:100%;height:100%;object-fit:cover;">` : ''}
      </div>`;
    }).join('');
  }

  function selectSwatch(nomCouleur) {
    if (!modalProduit) return;
    const couleur = modalProduit.couleurs.find(c => c.nom === nomCouleur);
    if (!couleur) return;
    renderModalCouleur(couleur);
    document.querySelectorAll('.som-modal__swatch').forEach(s => {
      s.classList.toggle('active', s.title === nomCouleur);
    });
  }

  function setMainImg(thumbEl, url) {
    document.getElementById('modal-main-img').innerHTML = `<img src="${url}" alt="">`;
    document.querySelectorAll('.som-modal__thumb').forEach(t => t.classList.remove('active'));
    thumbEl.classList.add('active');
  }

  function choisirProduit() {
    if (!modalProduit) return;
    closeModal();
    document.body.style.overflow = '';
    selectProduct(modalProduit.idx, modalProduit.name, modalProduit.sku, modalProduit.image, modalProduit.couleurs);
  }

  window.SOM = {
    selectProduct, resetProduct, goStep, addColorBlock, removeColorBlock,
    updateColor, updateQty, setLogoMode, handleFile, handleRefFile,
    clearLogo, dragOver, dragLeave, dropFile, buildRecap,
    openModal, openModalIdx, closeModal, selectSwatch, setMainImg, choisirProduit,
    goPage, setPerPage
  };

})();
