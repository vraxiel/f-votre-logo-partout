<?php
/**
 * Template Name: Demande de Soumission
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header(); ?>

<div class="som-page" id="som-app">

  <!-- HERO -->
  <section class="som-hero">
    <div class="som-hero__inner">
      <div class="som-hero__text">
        <span class="som-hero__eyebrow">Impression personnalisée · DTF · Broderie</span>
        <h1>Votre logo.<br><em>Partout.</em></h1>
        <p>Choisissez votre article, configurez votre commande et recevez votre soumission sous 24&nbsp;h.</p>
        <a href="#catalogue" class="som-btn som-btn--hero">
          Voir les produits
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </a>
      </div>
      <div class="som-hero__badges">
        <div class="som-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Qualité garantie</span></div>
        <div class="som-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Réponse sous 24&nbsp;h</span></div>
        <div class="som-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><span>Virement Interac</span></div>
        <div class="som-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg><span>Service personnalisé</span></div>
      </div>
    </div>
  </section>

  <!-- CATALOGUE -->
  <section class="som-catalogue" id="catalogue">
    <div class="som-container">
      <div class="som-section-header">
        <h2>Nos produits</h2>
        <p>Choisissez vos articles et configurez votre commande.</p>
      </div>
      <div class="som-filters" id="som-filters"></div>
      <div class="som-grid" id="som-grid">
        <div class="som-loading"><div class="som-spinner"></div><p>Chargement des produits…</p></div>
      </div>
    </div>
  </section>

  <!-- SECTION FORMULAIRE -->
  <section class="som-form-section" id="som-form-section" style="display:none;">
    <div class="som-container">

      <!-- Indicateur d'étapes -->
      <div class="som-steps" id="som-steps">
        <div class="som-step active" data-step="1">
          <div class="som-step__num">1</div><span>Logo</span>
        </div>
        <div class="som-step-line"></div>
        <div class="som-step" data-step="2">
          <div class="som-step__num">2</div><span>Quantités</span>
        </div>
        <div class="som-step-line"></div>
        <div class="som-step" data-step="3">
          <div class="som-step__num">3</div><span>Coordonnées</span>
        </div>
        <div class="som-step-line"></div>
        <div class="som-step" data-step="4">
          <div class="som-step__num">4</div><span>Récapitulatif</span>
        </div>
      </div>

      <!-- Produit sélectionné -->
      <div class="som-selected-product" id="som-selected-product">
        <div class="som-selected-product__img" id="sel-img"></div>
        <div class="som-selected-product__info">
          <span class="som-selected-product__label">Produit sélectionné</span>
          <h3 id="sel-name"></h3>
          <p id="sel-sku"></p>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           PANEL 1 — LOGO + EMPLACEMENTS
      ════════════════════════════════════ -->
      <div class="som-panel active" id="panel-1">
        <div class="som-panel__header">
          <span class="som-panel__num">01</span>
          <div>
            <h2>Logo &amp; Emplacements</h2>
            <p>Ajoutez un ou plusieurs designs. Chaque design nécessite un minimum de <strong>12 impressions</strong>.</p>
          </div>
        </div>

        <div class="som-deco-info-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Comment fonctionne le minimum de 12 ?</strong>
            <p>Le minimum de 12 s'applique par <em>design unique</em>. Si vous avez 6 articles avec le logo en avant ET en arrière, cela donne 6 × 2 = <strong>12 impressions</strong> — le minimum est atteint.</p>
          </div>
        </div>

        <div id="som-designs-container"></div>

        <button class="som-btn som-btn--add-color" type="button" onclick="SOM.addDesign()" style="margin-top:12px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un design
        </button>

        <div class="som-panel__actions">
          <button class="som-btn som-btn--ghost" type="button" onclick="SOM.retourCatalogue()">
            ← Retour au catalogue
          </button>
          <button class="som-btn som-btn--primary" id="btn-next-1" type="button" disabled
            onclick="SOM.goStep(2)">
            Continuer vers les quantités
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           PANEL 2 — QUANTITÉS PAR TAILLE
      ════════════════════════════════════ -->
      <div class="som-panel" id="panel-2">
        <div class="som-panel__header">
          <span class="som-panel__num">02</span>
          <div>
            <h2>Quantités par taille</h2>
            <p>Indiquez les quantités pour chaque couleur et taille.</p>
          </div>
        </div>

        <div id="p2-design-counters" style="margin-bottom:20px"></div>
        <div id="color-blocks-container"></div>

        <button class="som-btn som-btn--add-color" id="btn-add-color" type="button" onclick="SOM.addColorBlock()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter une autre couleur
        </button>

        <div class="som-qty-summary" id="qty-summary">
          <div class="som-qty-summary__total">
            Total : <strong id="grand-total">0</strong> article<span id="grand-total-s"></span>
          </div>
          <p class="som-qty-summary__msg" id="qty-msg">Ajoutez au moins un article pour continuer.</p>
        </div>

        <div class="som-panel__actions">
          <button class="som-btn som-btn--ghost" type="button" onclick="SOM.goStep(1)">← Retour</button>
          <button class="som-btn som-btn--primary" id="btn-next-2" type="button" disabled
            onclick="SOM.ajouterAuPanier()">
            Ajouter au panier
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           PANEL 3 — COORDONNÉES
      ════════════════════════════════════ -->
      <div class="som-panel" id="panel-3">
        <div class="som-panel__header">
          <span class="som-panel__num">03</span>
          <div>
            <h2>Vos coordonnées</h2>
            <p>Nous vous enverrons votre soumission personnalisée sous 24&nbsp;h.</p>
          </div>
        </div>
        <div class="som-form-grid">
          <div class="som-field-group">
            <label class="som-label" for="f-prenom">Prénom <span class="som-required">*</span></label>
            <input type="text" class="som-input" id="f-prenom" name="prenom" required autocomplete="given-name">
          </div>
          <div class="som-field-group">
            <label class="som-label" for="f-nom">Nom <span class="som-required">*</span></label>
            <input type="text" class="som-input" id="f-nom" name="nom" required autocomplete="family-name">
          </div>
          <div class="som-field-group">
            <label class="som-label" for="f-email">Courriel <span class="som-required">*</span></label>
            <input type="email" class="som-input" id="f-email" name="email" required autocomplete="email">
          </div>
          <div class="som-field-group">
            <label class="som-label" for="f-tel">Téléphone <span class="som-required">*</span></label>
            <input type="tel" class="som-input" id="f-tel" name="telephone" required autocomplete="tel">
          </div>
          <div class="som-field-group som-field-full">
            <label class="som-label" for="f-entreprise">Entreprise <span class="som-optional">(optionnel)</span></label>
            <input type="text" class="som-input" id="f-entreprise" name="entreprise" autocomplete="organization">
          </div>
          <div class="som-field-group">
            <label class="som-label">Préférence de contact <span class="som-required">*</span></label>
            <div class="som-radio-row">
              <label class="som-radio-pill"><input type="radio" name="pref_contact" value="courriel" checked><span>📧 Courriel</span></label>
              <label class="som-radio-pill"><input type="radio" name="pref_contact" value="telephone"><span>📞 Téléphone</span></label>
              <label class="som-radio-pill"><input type="radio" name="pref_contact" value="les-deux"><span>Les deux</span></label>
            </div>
          </div>
          <div class="som-field-group">
            <label class="som-label" for="f-moment">Meilleur moment pour vous joindre</label>
            <select class="som-input" id="f-moment" name="meilleur_moment">
              <option value="">-- Choisir --</option>
              <option value="matin">Matin (8h–12h)</option>
              <option value="midi">Midi (12h–14h)</option>
              <option value="apres-midi">Après-midi (14h–17h)</option>
              <option value="soir">Soir (17h–20h)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div class="som-field-group som-field-full">
            <label class="som-label" for="f-message">Message additionnel <span class="som-optional">(optionnel)</span></label>
            <textarea class="som-textarea" id="f-message" name="message" rows="3"
              placeholder="Date de livraison souhaitée, questions particulières…"></textarea>
          </div>
        </div>
        <div class="som-panel__actions">
          <button class="som-btn som-btn--ghost" type="button" onclick="SOM.retourPanier()">← Retour au panier</button>
          <button class="som-btn som-btn--primary" id="btn-next-3" type="button" onclick="SOM.goStep(4)">
            Voir le récapitulatif
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           PANEL 4 — RÉCAPITULATIF + ENVOI
      ════════════════════════════════════ -->
      <div class="som-panel" id="panel-4">
        <div class="som-panel__header">
          <span class="som-panel__num">04</span>
          <div>
            <h2>Récapitulatif</h2>
            <p>Vérifiez votre demande avant d'envoyer.</p>
          </div>
        </div>

        <div class="som-recap" id="som-recap"></div>

        <form id="som-form" method="post" action="<?php echo esc_url(admin_url('admin-ajax.php')); ?>" enctype="multipart/form-data">
          <?php wp_nonce_field('soumission_submit', 'soumission_nonce'); ?>
          <input type="hidden" name="action"          value="submit_soumission">
          <input type="hidden" name="product_name"    id="h-product-name">
          <input type="hidden" name="product_sku"     id="h-product-sku">
          <input type="hidden" name="color_blocks"    id="h-color-blocks">
          <input type="hidden" name="placement"       id="h-placement">
          <input type="hidden" name="total_qty"       id="h-total-qty">
          <input type="hidden" name="logo_mode"       id="h-logo-mode">
          <input type="hidden" name="prenom"          id="h-prenom">
          <input type="hidden" name="nom"             id="h-nom">
          <input type="hidden" name="email"           id="h-email">
          <input type="hidden" name="telephone"       id="h-tel">
          <input type="hidden" name="entreprise"      id="h-entreprise">
          <input type="hidden" name="pref_contact"    id="h-pref-contact">
          <input type="hidden" name="meilleur_moment" id="h-moment">
          <input type="hidden" name="message"         id="h-message">

          <div class="som-panel__actions">
            <button class="som-btn som-btn--ghost" type="button" onclick="SOM.goStep(3)">← Retour</button>
            <button class="som-btn som-btn--submit" type="submit" id="btn-submit">
              <span>Envoyer ma demande de soumission</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </form>
      </div>

      <!-- ═══════════════════════════════════
           PANEL 5 — CONFIRMATION
      ════════════════════════════════════ -->
      <div class="som-panel" id="panel-5">
        <div class="som-confirmation">
          <div class="som-confirmation__icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2>Demande envoyée !</h2>
          <p>Merci ! Nous avons bien reçu votre demande.<br>Vous recevrez votre soumission personnalisée sous <strong>24 heures ouvrables</strong>.</p>
          <div class="som-confirmation__ref" id="conf-ref"></div>
          <a href="<?php echo esc_url(home_url('/')); ?>" class="som-btn som-btn--primary">Retour à l'accueil</a>
        </div>
      </div>

    </div>
  </section>

</div>

<!-- MODALE PRODUIT -->
<div class="som-modal-overlay" id="som-modal-overlay" onclick="SOM.closeModal(event)">
  <div class="som-modal" id="som-modal">
    <button class="som-modal__close" onclick="SOM.closeModal()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="som-modal__body">
      <div class="som-modal__gallery">
        <div class="som-modal__main-img" id="modal-main-img"></div>
        <div class="som-modal__thumbs" id="modal-thumbs"></div>
      </div>
      <div class="som-modal__info">
        <h2 id="modal-nom"></h2>
        <p id="modal-sku" class="som-modal__sku"></p>
        <p id="modal-couleur-nom" class="som-modal__couleur-nom"></p>
        <div class="som-modal__swatches" id="modal-swatches"></div>
        <div id="modal-dispo"></div>
        <button class="som-btn som-btn--primary som-modal__cta" onclick="SOM.choisirProduit()">
          Demander une soumission
        </button>
      </div>
    </div>
  </div>
</div>

<?php get_footer(); ?>
