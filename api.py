from flask import Flask, jsonify, request
from bs4 import BeautifulSoup
import requests
import json
import re
import os

app = Flask(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Accept": "text/html, application/json, */*",
    "Accept-Language": "fr-CA,fr;q=0.9",
    "Cookie": "PHPSESSID=7341b895c0f87552e4a1bd2dbad4858a; mage-cache-sessid=true; form_key=6mGSfugisGYhSR21; private_content_version=712f1451721d244391d063e272ddffcc",
}

BASE_DIR     = "/home/alex/scraper/fournisseurs/tshirtideal"
STOCK_FILE   = os.path.join(BASE_DIR, "products.json")
OVERRIDES_FILE = os.path.join(BASE_DIR, "overrides.json")

CHAMPS_PRIVES = {"prix", "price", "prix_achat", "cout", "cost", "note_interne", "_commentaire", "_champs_disponibles"}


def load_products():
    """
    Charge products.json et applique overrides.json par-dessus.
    - products.json = source de vérité fournisseur, jamais modifié
    - overrides.json = personnalisations (catégories, visibilité, vedettes, ordre)
    - Les champs privés (prix fournisseur, notes internes) ne sont jamais retournés
    """
    with open(STOCK_FILE, "r", encoding="utf-8") as f:
        products = json.load(f)

    overrides = {}
    if os.path.exists(OVERRIDES_FILE):
        with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        overrides = {k: v for k, v in raw.items() if not k.startswith("_")}

    result = []
    for product in products:
        sku = product.get("sku", "")

        p = {k: v for k, v in product.items() if k not in CHAMPS_PRIVES}

        if sku in overrides:
            for key, value in overrides[sku].items():
                if key not in CHAMPS_PRIVES:
                    p[key] = value

        result.append(p)

    return result


def scrape_produit_live(url_key):
    url = f"https://www.tshirtideal.ca/fr/{url_key}.html"
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        html = r.text
        if "initConfigurableSwatchOptions" not in html:
            return [], [], None, None
        product_id_match = re.search(r'"productId":(\d+)', html)
        product_id = product_id_match.group(1) if product_id_match else None

        swatch_match = re.search(
            r'initConfigurableSwatchOptions\s*\(\s*(\{.*?\})\s*\)',
            html, re.DOTALL
        )
        if not swatch_match:
            return [], [], product_id, None

        swatch_data = json.loads(swatch_match.group(1))
        couleurs = []
        tailles  = []

        for attr in swatch_data.get("attributes", {}).values():
            label = attr.get("label", "").lower()
            options = attr.get("options", [])
            if "color" in label or "couleur" in label:
                couleurs = [{"id": o["id"], "label": o["label"]} for o in options]
            elif "size" in label or "taille" in label:
                tailles = [{"id": o["id"], "label": o["label"]} for o in options]

        return couleurs, tailles, product_id, swatch_data

    except Exception as e:
        return [], [], None, None


def get_stock_warehouse(product_id, color_id):
    url = f"https://www.tshirtideal.ca/rest/V1/warehouse/data/{product_id}-{color_id}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        data = json.loads(json.loads(r.text))
        soup = BeautifulSoup(data, "html.parser")
        warehouses = {}
        for wh in soup.select("dl.wh-name"):
            name = wh.find("dt").text.strip()
            sizes = {}
            for li in wh.select("li.ai_store1"):
                size_label = li.find("span", class_="size-label")
                qty_span   = li.find("span", class_="qty-value")
                if size_label and qty_span:
                    sizes[size_label.text.strip()] = int(qty_span.text.strip() or 0)
            warehouses[name] = sizes
        return warehouses
    except Exception:
        return {}


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.route("/api/produits")
def get_produits():
    """
    Retourne le catalogue complet fusionné (products.json + overrides.json).
    Filtre les produits avec visible=false.
    Supporte ?cat_parent=Polos et ?vedette=true en paramètres.
    """
    products = load_products()

    products = [p for p in products if p.get("visible", True)]

    cat_parent = request.args.get("cat_parent")
    if cat_parent:
        products = [p for p in products if p.get("cat_parent") == cat_parent]

    cat_enfant = request.args.get("cat_enfant")
    if cat_enfant:
        products = [p for p in products if p.get("cat_enfant") == cat_enfant]

    vedette = request.args.get("vedette")
    if vedette == "true":
        products = [p for p in products if p.get("vedette", False)]

    products.sort(key=lambda p: (p.get("ordre") is None, p.get("ordre", 0)))

    return jsonify(products)


@app.route("/api/produit/<sku>")
def get_produit(sku):
    """
    Retourne le détail d'un produit avec stock live depuis TShirtIdeal.
    Override appliqué. Prix fournisseur exclu.
    """
    products = load_products()
    product = next((p for p in products if p.get("sku") == sku), None)

    if not product:
        return jsonify({"erreur": f"Produit {sku} introuvable"}), 404

    url_key = product.get("url_key", "")
    couleurs, tailles, product_id, _ = scrape_produit_live(url_key)

    stock_par_couleur = {}
    for couleur in couleurs:
        stock_par_couleur[couleur["label"]] = get_stock_warehouse(product_id, couleur["id"])

    return jsonify({
        **product,
        "stock_live": stock_par_couleur,
        "couleurs_live": couleurs,
        "tailles_live": tailles,
    })


@app.route("/api/produits/filtre")
def get_produits_filtre():
    """
    Alias de /api/produits avec filtres — conservé pour compatibilité JS existant.
    """
    return get_produits()


@app.route("/api/categories")
def get_categories():
    """
    Retourne la liste des cat_parent uniques avec leurs cat_enfant,
    basée sur le catalogue fusionné (visible uniquement).
    """
    products = load_products()
    products = [p for p in products if p.get("visible", True)]

    categories = {}
    for p in products:
        parent = p.get("cat_parent")
        enfant = p.get("cat_enfant")
        if isinstance(parent, list):
            parent = parent[0] if parent else None
        if isinstance(enfant, list):
            enfant = enfant[0] if enfant else None
        if parent:
            if parent not in categories:
                categories[parent] = set()
            if enfant:
                categories[parent].add(enfant)

    return jsonify({k: sorted(list(v)) for k, v in sorted(categories.items())})


@app.route("/api/overrides")
def get_overrides():
    """
    Retourne le contenu d'overrides.json (pour l'admin WordPress futur).
    Note: endpoint à protéger par auth avant mise en production.
    """
    if not os.path.exists(OVERRIDES_FILE):
        return jsonify({})
    with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return jsonify({k: v for k, v in raw.items() if not k.startswith("_")})



@app.route("/api/categories-menu")
def get_categories_menu():
    """
    Retourne la structure complète du menu depuis _categories dans overrides.json.
    C'est cet endpoint que le JS utilise pour construire le menu dynamiquement.
    """
    if not os.path.exists(OVERRIDES_FILE):
        return jsonify([])
    with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    categories = data.get("_categories", [])
    categories.sort(key=lambda c: c.get("ordre", 99))
    return jsonify(categories)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
