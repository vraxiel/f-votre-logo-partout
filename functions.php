<?php
/**
 * functions.php - Theme enfant Storefront
 * F - Votre logo partout
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* =====================================================
   0. SMTP - Configuration courriel Gmail
===================================================== */
add_action( 'phpmailer_init', 'soumission_smtp_config' );
function soumission_smtp_config( $phpmailer ) {
    $phpmailer->isSMTP();
    $phpmailer->Host       = 'smtp.gmail.com';
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Port       = 465;
    $phpmailer->SMTPSecure = 'ssl';
    $phpmailer->Username   = defined('SMTP_USER') ? SMTP_USER : '';
    $phpmailer->Password   = defined('SMTP_PASS') ? SMTP_PASS : '';
    $phpmailer->From       = 'vraxiel@gmail.com';
    $phpmailer->FromName   = 'F - Votre Logo Partout';
}



/* =====================================================
   1. ENQUEUE - CSS & JS
===================================================== */
add_action( 'wp_enqueue_scripts', 'storefront_child_enqueue_styles' );

function storefront_child_enqueue_styles() {
    wp_enqueue_style(
        'parent-style',
        get_template_directory_uri() . '/style.css'
    );

    if ( ! is_page_template( 'page-soumission.php' ) ) return;

    wp_enqueue_style(
        'soumission-page',
        get_stylesheet_directory_uri() . '/assets/css/soumission-page.css',
        array(),
        filemtime( get_stylesheet_directory() . '/assets/css/soumission-page.css' )
    );

    wp_enqueue_script(
        'soumission-page',
        get_stylesheet_directory_uri() . '/assets/js/soumission-page.js',
        array(),
        filemtime( get_stylesheet_directory() . '/assets/js/soumission-page.js' ),
        true
    );

    wp_localize_script( 'soumission-page', 'soumissionData', array(
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'soumission_submit' ),
        'minQty'  => 12,
    ) );
}

/* =====================================================
   2. AJAX HANDLER — SOUMISSION MULTI-PRODUITS
===================================================== */
add_action( 'wp_ajax_submit_soumission',        'soumission_handle_submission' );
add_action( 'wp_ajax_nopriv_submit_soumission', 'soumission_handle_submission' );

function soumission_handle_submission() {
    if ( ! check_ajax_referer( 'soumission_submit', 'soumission_nonce', false ) ) {
        wp_send_json_error( array( 'message' => 'Requete non valide. Rechargez la page.' ) );
    }

    // Coordonnees client
    $prenom     = sanitize_text_field( $_POST['prenom']          ?? '' );
    $nom        = sanitize_text_field( $_POST['nom']             ?? '' );
    $email      = sanitize_email(      $_POST['email']           ?? '' );
    $telephone  = sanitize_text_field( $_POST['telephone']       ?? '' );
    $entreprise = sanitize_text_field( $_POST['entreprise']      ?? '' );
    $message    = sanitize_textarea_field( $_POST['message']     ?? '' );
    $pref       = sanitize_text_field( $_POST['pref_contact']    ?? '' );
    $moment     = sanitize_text_field( $_POST['meilleur_moment'] ?? '' );
    $total_qty  = intval( $_POST['total_qty']                    ?? 0 );

    // Validation de base
    if ( empty( $prenom ) || empty( $nom ) || empty( $email ) ) {
        wp_send_json_error( array( 'message' => 'Prenom, nom et courriel sont requis.' ) );
    }
    if ( ! is_email( $email ) ) {
        wp_send_json_error( array( 'message' => 'Adresse courriel invalide.' ) );
    }

    // Panier multi-produits
    $color_blocks_raw = stripslashes( $_POST['color_blocks'] ?? '[]' );
    $panier = json_decode( $color_blocks_raw, true );
    if ( ! is_array( $panier ) || count( $panier ) === 0 ) {
        wp_send_json_error( array( 'message' => 'Panier vide ou invalide.' ) );
    }

    // Validation : chaque design doit avoir >= 12 impressions
    foreach ( $panier as $item_idx => $item ) {
        $item_total = 0;
        foreach ( ( $item['colorBlocks'] ?? array() ) as $block ) {
            foreach ( ( $block['quantities'] ?? array() ) as $qty ) {
                $item_total += intval( $qty );
            }
        }
        foreach ( ( $item['designs'] ?? array() ) as $design_idx => $design ) {
            $positions   = $design['positions'] ?? array();
            $impressions = count( $positions ) * $item_total;
            if ( $impressions < 12 ) {
                wp_send_json_error( array(
                    'message' => 'Le design ' . ( $design_idx + 1 ) . ' du produit "' . sanitize_text_field( $item['name'] ?? '' ) . '" n\'atteint pas le minimum de 12 impressions.',
                ) );
            }
        }
    }

    // Upload logos — format : logo_design_{item_idx}_{design_idx}
    $logos_uploades = array();
    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';

    foreach ( $_FILES as $key => $file ) {
        if ( strpos( $key, 'logo_design_' ) !== 0 ) continue;
        if ( empty( $file['name'] ) ) continue;

        $parts = explode( '_', str_replace( 'logo_design_', '', $key ) );
        $ii    = intval( $parts[0] ?? 0 );
        $di    = intval( $parts[1] ?? 0 );
        $ext   = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );

        $formats_ok = array( 'ai', 'svg', 'eps', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp' );
        if ( ! in_array( $ext, $formats_ok, true ) ) continue;

        add_filter( 'upload_mimes',              'soumission_allow_mime_types' );
        add_filter( 'wp_check_filetype_and_ext', 'soumission_fix_svg_mime', 10, 4 );
        $upload = wp_handle_upload( $file, array( 'test_form' => false ) );
        remove_filter( 'upload_mimes',              'soumission_allow_mime_types' );
        remove_filter( 'wp_check_filetype_and_ext', 'soumission_fix_svg_mime' );

        if ( ! isset( $upload['error'] ) ) {
            $logos_uploades[ $ii ][ $di ] = array(
                'url'  => $upload['url'],
                'path' => $upload['file'],
                'name' => $file['name'],
            );
        }
    }

    // Reference unique
    $ref = 'SOM-' . strtoupper( substr( $prenom, 0, 2 ) . substr( $nom, 0, 2 ) ) . '-' . date( 'ymd' ) . '-' . wp_rand( 100, 999 );

    // Serialiser le panier proprement pour la DB
    $panier_db = array();
    foreach ( $panier as $ii => $item ) {
        $item_db = array(
            'name' => sanitize_text_field( $item['name'] ?? '' ),
            'sku'  => sanitize_text_field( $item['sku']  ?? '' ),
            'colorBlocks' => array(),
            'designs'     => array(),
        );
        foreach ( ( $item['colorBlocks'] ?? array() ) as $block ) {
            $qtys = array();
            foreach ( ( $block['quantities'] ?? array() ) as $size => $qty ) {
                $qtys[ sanitize_text_field( $size ) ] = intval( $qty );
            }
            $item_db['colorBlocks'][] = array(
                'color'      => sanitize_text_field( $block['color'] ?? '' ),
                'quantities' => $qtys,
            );
        }
        foreach ( ( $item['designs'] ?? array() ) as $di => $design ) {
            $positions = array_map( 'sanitize_text_field', $design['positions'] ?? array() );
            $item_db['designs'][] = array(
                'type'      => sanitize_text_field( $design['type']  ?? 'dtf' ),
                'positions' => $positions,
                'logoName'  => sanitize_text_field( $design['logoFile'] ?? $design['logoName'] ?? '' ),
                'logoUrl'   => $logos_uploades[ $ii ][ $di ]['url']  ?? '',
                'notes'     => sanitize_textarea_field( $design['notes'] ?? '' ),
            );
        }
        $panier_db[] = $item_db;
    }

    // Sauvegarder dans la DB
    $post_id = wp_insert_post( array(
        'post_type'   => 'soumission',
        'post_title'  => $ref . ' - ' . $prenom . ' ' . $nom,
        'post_status' => 'private',
        'post_author' => 1,
    ) );

    if ( $post_id ) {
        update_post_meta( $post_id, '_som_ref',        $ref );
        update_post_meta( $post_id, '_som_prenom',     $prenom );
        update_post_meta( $post_id, '_som_nom',        $nom );
        update_post_meta( $post_id, '_som_email',      $email );
        update_post_meta( $post_id, '_som_telephone',  $telephone );
        update_post_meta( $post_id, '_som_entreprise', $entreprise );
        update_post_meta( $post_id, '_som_message',    $message );
        update_post_meta( $post_id, '_som_pref',       $pref );
        update_post_meta( $post_id, '_som_moment',     $moment );
        update_post_meta( $post_id, '_som_total_qty',  $total_qty );
        update_post_meta( $post_id, '_som_panier',     $panier_db );
        update_post_meta( $post_id, '_som_date',       current_time( 'mysql' ) );
        update_post_meta( $post_id, '_som_status',     'nouveau' );
    }

    // Collecter tous les chemins de logos pour les pièces jointes
    $all_logo_paths = array();
    foreach ( $logos_uploades as $ii => $designs ) {
        foreach ( $designs as $di => $logo ) {
            if ( ! empty( $logo['path'] ) && file_exists( $logo['path'] ) ) {
                $all_logo_paths[] = $logo['path'];
            }
        }
    }

    // Courriels
    soumission_send_admin_email( array(
        'ref'        => $ref,
        'prenom'     => $prenom,
        'nom'        => $nom,
        'email'      => $email,
        'telephone'  => $telephone,
        'entreprise' => $entreprise,
        'message'    => $message,
        'pref'       => $pref,
        'moment'     => $moment,
        'total_qty'  => $total_qty,
        'panier'     => $panier_db,
    ), $all_logo_paths );

    soumission_send_client_email( array(
        'ref'    => $ref,
        'prenom' => $prenom,
        'nom'    => $nom,
        'email'  => $email,
    ) );

    wp_send_json_success( array( 'ref' => $ref ) );
}

/* =====================================================
   3. MIMES
===================================================== */
function soumission_allow_mime_types( $mimes ) {
    $mimes['ai']  = 'application/postscript';
    $mimes['svg'] = 'image/svg+xml';
    $mimes['eps'] = 'application/postscript';
    return $mimes;
}

function soumission_fix_svg_mime( $data, $file, $filename, $mimes ) {
    $ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );
    if ( $ext === 'svg' ) { $data['ext'] = 'svg'; $data['type'] = 'image/svg+xml'; }
    if ( $ext === 'ai'  ) { $data['ext'] = 'ai';  $data['type'] = 'application/postscript'; }
    if ( $ext === 'eps' ) { $data['ext'] = 'eps'; $data['type'] = 'application/postscript'; }
    return $data;
}

/* =====================================================
   4. COURRIELS
===================================================== */
function soumission_send_admin_email( $data, $logo_paths = array() ) {
    $to      = apply_filters( 'soumission_admin_email', 'vraxiel@gmail.com' );
    $subject = '[Nouvelle soumission] ' . $data['ref'] . ' - ' . $data['prenom'] . ' ' . $data['nom'];

    $body  = "NOUVELLE DEMANDE DE SOUMISSION\n";
    $body .= "================================\n\n";
    $body .= "Reference    : " . $data['ref'] . "\n";
    $body .= "Date         : " . current_time( 'Y-m-d H:i' ) . "\n\n";
    $body .= "CLIENT\n";
    $body .= "------\n";
    $body .= "Nom          : " . $data['prenom'] . ' ' . $data['nom'] . "\n";
    $body .= "Courriel     : " . $data['email'] . "\n";
    $body .= "Telephone    : " . ( $data['telephone'] ?: '-' ) . "\n";
    $body .= "Entreprise   : " . ( $data['entreprise'] ?: '-' ) . "\n";
    $body .= "Pref contact : " . ( $data['pref'] ?: '-' ) . "\n";
    $body .= "Moment       : " . ( $data['moment'] ?: '-' ) . "\n\n";
    $body .= "COMMANDE — " . count( $data['panier'] ) . " produit(s) — " . $data['total_qty'] . " articles au total\n";
    $body .= "------\n";

    foreach ( $data['panier'] as $idx => $item ) {
        $body .= "\nProduit " . ( $idx + 1 ) . " : " . $item['name'] . " (" . $item['sku'] . ")\n";

        // Couleurs & quantites
        $item_total = 0;
        foreach ( $item['colorBlocks'] as $block ) {
            $block_total = array_sum( $block['quantities'] );
            $item_total += $block_total;
            $sizes = array();
            foreach ( $block['quantities'] as $size => $qty ) {
                if ( $qty > 0 ) $sizes[] = $qty . 'x' . $size;
            }
            $body .= "  Couleur : " . $block['color'] . " — " . $block_total . " articles";
            if ( $sizes ) $body .= " (" . implode( ', ', $sizes ) . ")";
            $body .= "\n";
        }

        // Designs
        foreach ( $item['designs'] as $di => $design ) {
            $impressions = count( $design['positions'] ) * $item_total;
            $body .= "  Design " . ( $di + 1 ) . " (" . strtoupper( $design['type'] ) . ") : " . $impressions . " impressions\n";
            $body .= "    Positions : " . ( $design['positions'] ? implode( ', ', $design['positions'] ) : 'aucune' ) . "\n";
            $body .= "    Logo      : " . ( $design['logoName'] ?: 'non fourni' ) . "\n";
            if ( $design['logoUrl'] ) $body .= "    URL       : " . $design['logoUrl'] . "\n";
            if ( $design['notes'] )   $body .= "    Notes     : " . $design['notes'] . "\n";
        }
    }

    $body .= "\nMESSAGE CLIENT\n";
    $body .= "------\n";
    $body .= ( $data['message'] ?: '-' ) . "\n\n";
    $body .= "Admin : " . admin_url( 'edit.php?post_type=soumission' ) . "\n";

    $headers     = array( 'Content-Type: text/plain; charset=UTF-8' );
    $attachments = array();
    foreach ( $logo_paths as $path ) {
        if ( file_exists( $path ) ) $attachments[] = $path;
    }

    wp_mail( $to, $subject, $body, $headers, $attachments );
}

function soumission_send_client_email( $data ) {
    $site_name = get_bloginfo( 'name' );
    $to        = $data['email'];
    $subject   = 'Votre demande de soumission - ' . $data['ref'];

    $body  = "Bonjour " . $data['prenom'] . ",\n\n";
    $body .= "Nous avons bien recu votre demande de soumission.\n\n";
    $body .= "Reference : " . $data['ref'] . "\n\n";
    $body .= "Notre equipe vous reviendra sous 24 heures ouvrables avec votre soumission personnalisee.\n\n";
    $body .= "Cordialement,\n";
    $body .= "L'equipe " . $site_name . "\n";

    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $site_name . ' <' . get_option( 'admin_email' ) . '>',
    );

    wp_mail( $to, $subject, $body, $headers );
}

/* =====================================================
   5. POST TYPE SOUMISSION
===================================================== */
add_action( 'init', 'soumission_register_post_type' );

function soumission_register_post_type() {
    register_post_type( 'soumission', array(
        'label'           => 'Soumissions',
        'public'          => false,
        'show_ui'         => true,
        'show_in_menu'    => true,
        'menu_icon'       => 'dashicons-clipboard',
        'supports'        => array( 'title' ),
        'capability_type' => 'post',
        'map_meta_cap'    => true,
    ) );
}

/* =====================================================
   6. COLONNES ADMIN
===================================================== */
add_filter( 'manage_soumission_posts_columns',       'soumission_admin_columns' );
add_action( 'manage_soumission_posts_custom_column', 'soumission_admin_column_content', 10, 2 );

function soumission_admin_columns( $cols ) {
    return array(
        'cb'        => $cols['cb'],
        'title'     => 'Reference',
        'client'    => 'Client',
        'produits'  => 'Produits',
        'total_qty' => 'Articles',
        'statut'    => 'Statut',
        'date'      => 'Date',
    );
}

function soumission_admin_column_content( $col, $post_id ) {
    switch ( $col ) {
        case 'client':
            $prenom = get_post_meta( $post_id, '_som_prenom', true );
            $nom    = get_post_meta( $post_id, '_som_nom',    true );
            $email  = get_post_meta( $post_id, '_som_email',  true );
            echo esc_html( $prenom . ' ' . $nom );
            echo '<br><small>' . esc_html( $email ) . '</small>';
            break;
        case 'produits':
            $panier = get_post_meta( $post_id, '_som_panier', true );
            if ( is_array( $panier ) ) {
                $noms = array_map( function( $item ) {
                    return esc_html( $item['sku'] ?? '' );
                }, $panier );
                echo implode( ', ', $noms );
                echo '<br><small>' . count( $panier ) . ' produit(s)</small>';
            } else {
                echo '-';
            }
            break;
        case 'total_qty':
            echo esc_html( get_post_meta( $post_id, '_som_total_qty', true ) ) . ' art.';
            break;
        case 'statut':
            $statut = get_post_meta( $post_id, '_som_status', true );
            $labels = array(
                'nouveau'  => '<span style="color:#0f7c56;font-weight:600">Nouveau</span>',
                'en-cours' => '<span style="color:#a05a00;font-weight:600">En cours</span>',
                'envoye'   => '<span style="color:#3545a8;font-weight:600">Envoye</span>',
                'accepte'  => '<span style="color:#2d6e45;font-weight:600">Accepte</span>',
                'decline'  => '<span style="color:#c0293a;font-weight:600">Decline</span>',
            );
            echo isset( $labels[ $statut ] ) ? $labels[ $statut ] : '<span style="color:#7b7f96">-</span>';
            break;
    }
}

/* =====================================================
   7. META BOX — detail complet du panier
===================================================== */
add_action( 'add_meta_boxes', 'soumission_add_meta_boxes' );

function soumission_add_meta_boxes() {
    add_meta_box(
        'soumission-details',
        'Details de la soumission',
        'soumission_meta_box_html',
        'soumission',
        'normal',
        'high'
    );
}

function soumission_meta_box_html( $post ) {
    // Coordonnees
    $fields = array(
        'Reference'      => get_post_meta( $post->ID, '_som_ref',        true ),
        'Prenom'         => get_post_meta( $post->ID, '_som_prenom',     true ),
        'Nom'            => get_post_meta( $post->ID, '_som_nom',        true ),
        'Courriel'       => get_post_meta( $post->ID, '_som_email',      true ),
        'Telephone'      => get_post_meta( $post->ID, '_som_telephone',  true ),
        'Entreprise'     => get_post_meta( $post->ID, '_som_entreprise', true ),
        'Pref. contact'  => get_post_meta( $post->ID, '_som_pref',       true ),
        'Moment'         => get_post_meta( $post->ID, '_som_moment',     true ),
        'Total articles' => get_post_meta( $post->ID, '_som_total_qty',  true ),
        'Message'        => get_post_meta( $post->ID, '_som_message',    true ),
    );

    echo '<table class="widefat" style="margin-bottom:20px"><tbody>';
    foreach ( $fields as $label => $value ) {
        echo '<tr>';
        echo '<th style="width:160px;padding:8px 12px;background:#f9f9f9">' . esc_html( $label ) . '</th>';
        echo '<td style="padding:8px 12px">' . esc_html( $value ?: '-' ) . '</td>';
        echo '</tr>';
    }
    echo '</tbody></table>';

    // Detail panier
    $panier = get_post_meta( $post->ID, '_som_panier', true );
    if ( is_array( $panier ) && count( $panier ) > 0 ) {
        echo '<h4 style="margin:0 0 10px">Commande — ' . count( $panier ) . ' produit(s)</h4>';
        foreach ( $panier as $idx => $item ) {
            echo '<div style="border:1px solid #ddd;padding:12px 16px;margin-bottom:10px;background:#fafafa">';
            echo '<strong>' . esc_html( ( $idx + 1 ) . '. ' . $item['name'] . ' (' . $item['sku'] . ')' ) . '</strong>';

            // Couleurs
            $item_total = 0;
            echo '<table style="margin-top:8px;width:100%;border-collapse:collapse">';
            foreach ( ( $item['colorBlocks'] ?? array() ) as $block ) {
                $block_total = array_sum( $block['quantities'] );
                $item_total += $block_total;
                $sizes = array();
                foreach ( $block['quantities'] as $size => $qty ) {
                    if ( $qty > 0 ) $sizes[] = $qty . '&times;' . esc_html( $size );
                }
                echo '<tr>';
                echo '<td style="padding:4px 8px;border:1px solid #eee;background:#fff;width:160px">' . esc_html( $block['color'] ) . '</td>';
                echo '<td style="padding:4px 8px;border:1px solid #eee">' . $block_total . ' art. — ' . implode( ', ', $sizes ) . '</td>';
                echo '</tr>';
            }
            echo '</table>';

            // Designs
            foreach ( ( $item['designs'] ?? array() ) as $di => $design ) {
                $impressions = count( $design['positions'] ) * $item_total;
                echo '<div style="margin-top:10px;padding:8px 12px;background:#fff;border:1px solid #e0e0e0">';
                echo '<strong>Design ' . ( $di + 1 ) . '</strong> — ' . strtoupper( esc_html( $design['type'] ) ) . ' — ' . $impressions . ' impressions<br>';
                echo 'Positions : ' . esc_html( $design['positions'] ? implode( ', ', $design['positions'] ) : 'aucune' ) . '<br>';
                echo 'Logo : ' . esc_html( $design['logoName'] ?: 'non fourni' );
                if ( ! empty( $design['logoUrl'] ) ) {
                    echo ' — <a href="' . esc_url( $design['logoUrl'] ) . '" target="_blank">Telecharger</a>';
                }
                if ( ! empty( $design['notes'] ) ) {
                    echo '<br>Notes : ' . esc_html( $design['notes'] );
                }
                echo '</div>';
            }
            echo '</div>';
        }
    }

    // Statut
    $current_status = get_post_meta( $post->ID, '_som_status', true ) ?: 'nouveau';
    wp_nonce_field( 'soumission_update_status', 'soumission_status_nonce' );
    echo '<p style="margin-top:16px">';
    echo '<label style="font-weight:600">Statut : </label>';
    echo '<select name="soumission_status" style="margin-left:8px">';
    $statuts = array(
        'nouveau'  => 'Nouveau',
        'en-cours' => 'En cours',
        'envoye'   => 'Soumission envoyee',
        'accepte'  => 'Accepte',
        'decline'  => 'Decline',
    );
    foreach ( $statuts as $val => $lbl ) {
        echo '<option value="' . esc_attr( $val ) . '" ' . selected( $current_status, $val, false ) . '>' . esc_html( $lbl ) . '</option>';
    }
    echo '</select>';
    echo '<input type="submit" class="button button-primary" style="margin-left:8px" value="Sauvegarder">';
    echo '</p>';
}

add_action( 'save_post_soumission', 'soumission_save_status' );

function soumission_save_status( $post_id ) {
    if ( ! isset( $_POST['soumission_status_nonce'] ) ) return;
    if ( ! wp_verify_nonce( $_POST['soumission_status_nonce'], 'soumission_update_status' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;
    if ( isset( $_POST['soumission_status'] ) ) {
        update_post_meta( $post_id, '_som_status', sanitize_text_field( $_POST['soumission_status'] ) );
    }
}

/* =====================================================
   8. PROXY API FLASK
===================================================== */
add_action( 'wp_ajax_flask_proxy',        'soumission_flask_proxy' );
add_action( 'wp_ajax_nopriv_flask_proxy', 'soumission_flask_proxy' );

function soumission_flask_proxy() {
    $endpoint = isset( $_REQUEST['endpoint'] ) ? sanitize_text_field( $_REQUEST['endpoint'] ) : '';
    $allowed  = array( 'produits', 'produit', 'stock', 'produits/filtre', 'categories-menu', 'categories', 'overrides' );

    $parts = explode( '/', ltrim( $endpoint, '/' ) );
    if ( ! in_array( $parts[0], $allowed, true ) ) {
        wp_send_json_error( 'Endpoint non autorise.' );
    }

    // Transmettre les query params à Flask (ex: cat_parent, cat_enfant)
    $params = $_REQUEST;
    unset( $params['action'], $params['endpoint'], $params['_wpnonce'] );
    $query_string = http_build_query( $params );

    $url = 'http://127.0.0.1:5000/api/' . $endpoint;
    if ( ! empty( $query_string ) ) {
        $url .= '?' . $query_string;
    }

    $response = wp_remote_get( $url, array( 'timeout' => 10 ) );

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( $response->get_error_message() );
    }

    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body, true );

    wp_send_json_success( $data );
}
