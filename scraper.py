import requests
import json
import deepl
import os
import re
import time
import smtplib
import ssl
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── CONFIG ──────────────────────────────────────────
GMAIL_USER     = "vraxiel@gmail.com"
GMAIL_PASSWORD = "bduc odcs otei ijat"
EMAIL_DEST     = "vraxiel@gmail.com"
STOCK_FILE     = "products.json"
PREV_FILE      = "products_precedent.json"
LOG_FILE       = "scraper.log"
DELAI          = 0.5
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
DEEPL_KEY      = os.getenv("DEEPL_KEY", "")
TRAD_FILE      = "traductions.json"
DEEPL_TARGET   = "FR" 

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "fr-CA,fr;q=0.9",
}

def charger_cache_traductions():
    if os.path.exists(TRAD_FILE):
        with open(TRAD_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def sauvegarder_cache_traductions(cache):
    with open(TRAD_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def traduire_nom(nom_en, cache, translator):
    if nom_en in cache:
        return cache[nom_en]
    try:
        result = translator.translate_text(nom_en, target_lang=DEEPL_TARGET)
        cache[nom_en] = result.text
        return result.text
    except Exception as e:
        log(f"Erreur traduction '{nom_en}': {e}")
        return nom_en

MAPPING = {
    # T-Shirts [158]
    158:("T-Shirts",None), 1118:("T-Shirts","3/4 Sleeve"), 1119:("T-Shirts","Athletics"),
    301:("T-Shirts","Baseball"), 317:("T-Shirts","Noirs vierges"), 323:("T-Shirts","Coton 100%"),
    1115:("T-Shirts","Col rond"), 1160:("T-Shirts","À capuchon"), 161:("T-Shirts","Manches longues"),
    235:("T-Shirts","Performance"), 1098:("T-Shirts","À poche"), 1120:("T-Shirts","Polyester 100%"),
    1116:("T-Shirts","Raglan"), 302:("T-Shirts","Ringer"), 1117:("T-Shirts","Manches courtes"),
    159:("T-Shirts","Camisoles"), 163:("T-Shirts","Col en V"), 315:("T-Shirts","Femmes"),
    # Coton ouatés [160]
    160:("Coton ouatés",None), 243:("Coton ouatés","Col arrondi"), 1122:("Coton ouatés","Cordons"),
    1123:("Coton ouatés","Molleton"), 244:("Coton ouatés","Zip complet"), 1124:("Coton ouatés","Haute visibilité"),
    242:("Coton ouatés","À capuchon"), 1127:("Coton ouatés","Zip quart"), 1166:("Coton ouatés","Pantalons"),
    1128:("Coton ouatés","Raglan"),
    # Hoodies [309]
    309:("Hoodies",None), 311:("Hoodies","Polyester"), 313:("Hoodies","Zip complet"),
    312:("Hoodies","Pullover"), 310:("Hoodies","Hommes"), 513:("Hoodies","Performance"), 314:("Hoodies","Femmes"),
    # Polos [162]
    162:("Polos",None), 1134:("Polos","Golf"), 1131:("Polos","Jersey"), 239:("Polos","Performance"),
    237:("Polos","Avec poche"), 1132:("Polos","Piqué"), 1133:("Polos","Enfants"), 236:("Polos","Sport"),
    # Pantalons & Shorts [164]
    164:("Pantalons & Shorts",None), 245:("Pantalons & Shorts","Molletonnés"),
    250:("Pantalons & Shorts","Pantalons"), 251:("Pantalons & Shorts","Shorts"),
    # Outerwear [223]
    223:("Outerwear",None), 1323:("Outerwear","Combinaison"), 1152:("Outerwear","Zip complet"),
    1153:("Outerwear","Capuche"), 1151:("Outerwear","Vestes"), 248:("Outerwear","Lifestyle"),
    247:("Outerwear","Performance"), 249:("Outerwear","Polar Fleece"), 1154:("Outerwear","Doudounes"),
    1155:("Outerwear","Zip quart"), 351:("Outerwear","Imperméable"), 330:("Outerwear","Coupe-vent"),
    1316:("Outerwear","Molleton"),
    # Athletic Wear [227] - Type
    227:("Athletic Wear",None), 1143:("Athletic Wear","Full-Zips"), 1141:("Athletic Wear","Golf"),
    254:("Athletic Wear","Vestes"), 1144:("Athletic Wear","Leggings"), 1146:("Athletic Wear","Pantalons"),
    253:("Athletic Wear","Performance"), 1148:("Athletic Wear","Pullovers"), 1142:("Athletic Wear","Zip quart"),
    1147:("Athletic Wear","Shorts"), 1324:("Athletic Wear","Bas hockey"), 1145:("Athletic Wear","Camisoles"),
    252:("Athletic Wear","Team Wear"),
    # Athletic Wear - Sport Type
    1337:("Athletic Wear","Basketball"), 1328:("Athletic Wear","Baseball"),
    1329:("Athletic Wear","Cyclisme"), 1330:("Athletic Wear","Football"),
    1331:("Athletic Wear","Hockey"), 1332:("Athletic Wear","Lacrosse"),
    1333:("Athletic Wear","Rugby"), 1334:("Athletic Wear","Soccer"),
    1335:("Athletic Wear","Athlétisme"), 1336:("Athletic Wear","Volleyball"),
    # Dress Shirt [226]
    226:("Dress Shirt",None), 1138:("Dress Shirt","Manches longues"), 1139:("Dress Shirt","Plackets"),
    1137:("Dress Shirt","Poches"), 1136:("Dress Shirt","Manches courtes"), 1169:("Dress Shirt","Tissés"),
    # Casquettes [176]
    176:("Casquettes",None), 336:("Casquettes","5 panneaux"), 337:("Casquettes","6 panneaux"),
    338:("Casquettes","7 panneaux"), 1156:("Casquettes","Camouflage"), 256:("Casquettes","Ajustées"),
    344:("Casquettes","Visière plate"), 340:("Casquettes","Profil haut"), 341:("Casquettes","Profil bas"),
    342:("Casquettes","Profil moyen"), 1157:("Casquettes","Dos ouvert"), 258:("Casquettes","Snapback"),
    353:("Casquettes","Trucker"), 261:("Casquettes","Visières"), 1159:("Casquettes","Non structurées"),
    # Toques [255]
    255:("Toques",None), 1114:("Toques","Hommes"), 1112:("Toques","Femmes"), 1113:("Toques","Jeunes"),
    # Sacs [177]
    177:("Sacs",None), 270:("Sacs","Sacs à dos"), 324:("Sacs","Duffles"), 264:("Sacs","Gym sacks"),
    1167:("Sacs","Poches"), 269:("Sacs","Totes"), 1051:("Sacs","Sport"), 268:("Sacs","Trousses"),
    1325:("Sacs","Totes réutilisables"),
    # Accessoires [271]
    271:("Accessoires",None), 229:("Accessoires","Tabliers"), 277:("Accessoires","Couvertures"),
    279:("Accessoires","Ceintures"), 1168:("Accessoires","Bavoirs"), 1107:("Accessoires","Bandeau"),
    1106:("Accessoires","Cache-cou"), 526:("Accessoires","Masques"), 276:("Accessoires","Écharpes"),
    230:("Accessoires","Serviettes"),
    # Sweaters & Workwear
    348:("Sweaters",None), 349:("Workwear",None), 1322:("Tall",None),
}
# ────────────────────────────────────────────────────

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ligne = f"[{ts}] {msg}"
    print(ligne)
    with open(LOG_FILE, "a") as f:
        f.write(ligne + "\n")

def fetch_produits_api():
    tous = []
    page = 1
    while True:
        url = (
            "https://www.tshirtideal.ca/rest/V1/products"
            "?searchCriteria[pageSize]=100"
            f"&searchCriteria[currentPage]={page}"
            "&searchCriteria[filterGroups][0][filters][0][field]=type_id"
            "&searchCriteria[filterGroups][0][filters][0][value]=configurable"
            "&searchCriteria[filterGroups][0][filters][0][conditionType]=eq"
            "&fields=items[id,sku,name,custom_attributes],total_count"
        )
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            data = r.json()
            items = data.get("items", [])
            if not items:
                break
            for item in items:
                attrs = item.get("custom_attributes") or []
                url_key = next((a["value"] for a in attrs if a["attribute_code"] == "url_key"), None)
                cat_ids = next((a["value"] for a in attrs if a["attribute_code"] == "category_ids"), [])
                image_attr = next((a["value"] for a in attrs if a["attribute_code"] == "image"), None)
                image_url = f"https://www.tshirtideal.ca/media/catalog/product{image_attr}" if image_attr else None
                tous.append({
                    "sku": item["sku"],
                    "nom": item["name"],
                    "nom_original": item["name"],
                    "url_key": url_key,
                    "category_ids": cat_ids,
                    "image": image_url,
                })
            total = data.get("total_count", 0)
            log(f"API page {page} — {len(tous)}/{total} produits")
            if len(tous) >= total:
                break
            page += 1
            time.sleep(DELAI)
        except Exception as e:
            log(f"Erreur API page {page}: {e}")
            break
    return tous

def scrape_produit(url_key):
    url = f"https://www.tshirtideal.ca/fr/{url_key}.html"
    HEADERS_BROWSER = {**HEADERS, "Accept": "text/html", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
    try:
        r = requests.get(url, headers=HEADERS_BROWSER, timeout=30)
        html = r.text
        if "initConfigurableSwatchOptions" not in html:
            return [], [], None

        # Images par couleur
        images_data = {}
        img_match = re.search(r'"images":(\{"[0-9]+":.*?\}),\s*"index"', html, re.DOTALL)
        if img_match:
            try:
                images_data = json.loads(img_match.group(1))
            except:
                pass

        # Couleurs
        couleurs = []
        color_match = re.search(r'"code":"color","label":"[^"]+","options":\[(.*?)\],"position"', html, re.DOTALL)
        if color_match:
            try:
                options = json.loads('[' + color_match.group(1) + ']')
                for opt in options:
                    produit_ids = opt.get("products", [])
                    photos = []
                    for pid in produit_ids:
                        if pid in images_data:
                            photos = [img["img"] for img in images_data[pid] if img.get("img")]
                            break
                    couleurs.append({
                        "nom": opt.get("label"),
                        "disponible": len(produit_ids) > 0,
                        "images": photos,
                        "_pids": list(produit_ids)
                    })
            except:
                pass

        # Tailles globales avec product IDs
        tailles_raw = []
        size_match = re.search(r'"code":"size","label":"[^"]+","options":\[(.*?)\],"position"', html, re.DOTALL)
        if size_match:
            try:
                options = json.loads('[' + size_match.group(1) + ']')
                for opt in options:
                    tailles_raw.append({"label": opt.get("label"), "pids": set(opt.get("products", []))})
            except:
                pass
        # Associer tailles à chaque couleur via intersection
        for c in couleurs:
            cpids = set(c.pop("_pids", []))
            if cpids and tailles_raw:
                c["tailles"] = [{"label": t["label"], "disponible": True} for t in tailles_raw if cpids & t["pids"]]
            else:
                c["tailles"] = []
        # Tailles globales produit
        tailles = [{"label": t["label"], "disponible": len(t["pids"]) > 0} for t in tailles_raw]
        prix_match = re.search(r'"finalPrice":\{"amount":([0-9.]+)', html)
        prix = prix_match.group(1) if prix_match else None
        return couleurs, tailles, prix

    except Exception as e:
        log(f"Erreur scrape {url_key}: {e}")
        return [], [], None

def mapper_categories(cat_ids):
    parents, enfants = set(), set()
    for cid in [int(x) for x in cat_ids]:
        if cid in MAPPING:
            parent, enfant = MAPPING[cid]
            parents.add(parent)
            if enfant:
                enfants.add(enfant)
    return list(parents), list(enfants)

def comparer(nouveaux):
    if not os.path.exists(STOCK_FILE):
        return [], [], []
    with open(STOCK_FILE) as f:
        anciens = {p["sku"]: p for p in json.load(f)}
    nouveaux_dict = {p["sku"]: p for p in nouveaux}
    ajoutes   = [p for s, p in nouveaux_dict.items() if s not in anciens]
    supprimes = [p for s, p in anciens.items() if s not in nouveaux_dict]
    modifies  = [p for s, p in nouveaux_dict.items() if s in anciens and p.get("prix") != anciens[s].get("prix")]
    return ajoutes, supprimes, modifies

def envoyer_rapport(produits, erreurs, ajoutes, supprimes, modifies):
    sujet = f"[Scraper TShirtIdeal] Rapport {datetime.now().strftime('%Y-%m-%d')}"
    corps = f"""
Rapport du scraper TShirt Ideal
================================
Date     : {datetime.now().strftime('%Y-%m-%d %H:%M')}
Produits : {len(produits)} au total
Nouveaux : {len(ajoutes)} | Supprimés : {len(supprimes)} | Prix modifiés : {len(modifies)}
"""
    if ajoutes:
        corps += "\nNOUVEAUX :\n" + "\n".join(f"  + {p['sku']} — {p['nom']}" for p in ajoutes[:20])
    if supprimes:
        corps += "\nSUPPRIMES :\n" + "\n".join(f"  - {p['sku']} — {p['nom']}" for p in supprimes[:20])
    if erreurs:
        corps += "\nERREURS :\n" + "\n".join(f"  ! {e}" for e in erreurs)
    msg = MIMEMultipart()
    msg["From"] = GMAIL_USER
    msg["To"] = EMAIL_DEST
    msg["Subject"] = sujet
    msg.attach(MIMEText(corps, "plain"))
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as s:
            s.login(GMAIL_USER, GMAIL_PASSWORD)
            s.send_message(msg)
        log("Rapport envoyé par courriel")
    except Exception as e:
        log(f"Erreur courriel: {e}")

def exporter_csv(produits):
    lines = ["Catégorie parent,Sous-catégorie,SKU,Nom,Image"]
    for p in produits:
        parents = p.get("cat_parent", [])
        enfants = p.get("cat_enfant", [])
        image = p.get("image", "")
        if not parents:
            lines.append(f"(aucune),(aucune),{p['sku']},{p['nom']},{image}")
        else:
            for parent in parents:
                if enfants:
                    for enfant in enfants:
                        lines.append(f"{parent},{enfant},{p['sku']},{p['nom']},{image}")
                else:
                    lines.append(f"{parent},(aucune),{p['sku']},{p['nom']},{image}")
    with open("catalogue.csv", "w", encoding="utf-8-sig") as f:
        f.write("\n".join(lines))
    log(f"CSV exporté: {len(lines)-1} lignes")

def main():
    log("=== DEBUT DU SCRAPING ===")
    erreurs = []
    # Initialiser DeepL et cache traductions
    trad_cache = charger_cache_traductions()
    try:
        translator = deepl.Translator(DEEPL_KEY)
        log("DeepL initialisé ✓")
    except Exception as e:
        translator = None
        log(f"DeepL non disponible: {e}")

    # Étape 1 — Liste via API (avec category_ids et image)
    produits_api = fetch_produits_api()
    log(f"{len(produits_api)} produits trouvés")

    # Étape 2 — Scrape couleurs/tailles/prix + mapping catégories
    produits = []
    for i, item in enumerate(produits_api):
        if not item["url_key"]:
            continue
        log(f"[{i+1}/{len(produits_api)}] {item['nom']}")
        couleurs, tailles, prix = scrape_produit(item["url_key"])
        cat_parent, cat_enfant = mapper_categories(item.get("category_ids", []))
        log(f"  -> {len(couleurs)} couleurs, {len(tailles)} tailles | {cat_parent}")
        nom_fr = traduire_nom(item["nom"], trad_cache, translator) if translator else item["nom"]
        produits.append({
            "sku":        item["sku"],
            "nom":        nom_fr,
            "nom_original": item["nom"],
            "url":        f"https://www.tshirtideal.ca/fr/{item['url_key']}.html",
            "image":      item.get("image"),
            "couleurs":   couleurs,
            "tailles":    tailles,
            "prix":       prix,
            "cat_parent": cat_parent,
            "cat_enfant": cat_enfant,
        })
        time.sleep(DELAI)

    # Étape 3 — Comparer
    ajoutes, supprimes, modifies = comparer(produits)

    # Étape 4 — Sauvegarder
    if os.path.exists(STOCK_FILE):
        os.replace(STOCK_FILE, PREV_FILE)
    with open(STOCK_FILE, "w") as f:
        json.dump(produits, f, ensure_ascii=False, indent=2)
    log(f"Sauvegarde: {len(produits)} produits")

    # Étape 5 — CSV
    exporter_csv(produits)

    # Étape 6 — Rapport
    envoyer_rapport(produits, erreurs, ajoutes, supprimes, modifies)
    log("=== FIN DU SCRAPING ===")

if __name__ == "__main__":
    main()
