const Database = require("../node_modules/better-sqlite3");
const db = new Database("data/cave.db", { readonly: true });

function log(title, query) {
  console.log("\n## " + title);
  console.table(db.prepare(query).all());
}

// ─── 1. Enrichissements en base ───────────────────────────────────────────────
log("Enrichissements (stock_amount, market_stock_value, added_value)", `
  SELECT
    e.viniou_id,
    w.estate,
    w.quantity          AS qty_wines,
    e.stock_amount,
    e.market_stock_value,
    e.added_value,
    w.market_unit_price,
    w.total_value       AS total_value_wines,
    (w.quantity * COALESCE(w.market_unit_price, 0)) AS qty_x_price
  FROM wine_enrichments e
  LEFT JOIN wines w ON w.viniou_id = e.viniou_id
  ORDER BY e.market_stock_value DESC
`);

// ─── 2. Origine des écarts de valeur ─────────────────────────────────────────
// Le service dashboard utilise : enrichment.marketStockValue ?? wine.totalValue
// Si marketStockValue est calculé sur un ancien stock, il est périmé.
log("Écart enrichment.marketStockValue vs qty*price actuel", `
  SELECT
    w.estate,
    w.quantity,
    w.market_unit_price,
    (w.quantity * COALESCE(w.market_unit_price, 0)) AS prix_actuel,
    e.market_stock_value                            AS valeur_enrichment,
    (e.market_stock_value - w.quantity * COALESCE(w.market_unit_price, 0)) AS ecart
  FROM wine_enrichments e
  JOIN wines w ON w.viniou_id = e.viniou_id
  WHERE e.market_stock_value IS NOT NULL
    AND ABS(e.market_stock_value - w.quantity * COALESCE(w.market_unit_price, 0)) > 0.01
  ORDER BY ABS(ecart) DESC
`);

// ─── 3. Valeur totale selon 3 méthodes ───────────────────────────────────────
const raw = db.prepare(`
  SELECT SUM(w.quantity * COALESCE(w.market_unit_price, 0)) as total
  FROM wines w
`).get();

const dashboardStyle = db.prepare(`
  SELECT SUM(
    CASE
      WHEN e.market_stock_value IS NOT NULL THEN e.market_stock_value
      ELSE w.total_value
    END
  ) as total
  FROM wines w
  LEFT JOIN wine_enrichments e ON e.viniou_id = w.viniou_id
`).get();

const viniouRef = 1815.00;
console.log("\n## Comparaison méthodes de calcul valeur totale");
console.table([{
  methode_sql_qty_x_price:  raw.total.toFixed(2),
  methode_dashboard_enrichment_priority: dashboardStyle.total.toFixed(2),
  viniou_reference: viniouRef,
  ecart_sql_vs_viniou: (viniouRef - raw.total).toFixed(2),
  ecart_dashboard_vs_viniou: (viniouRef - dashboardStyle.total).toFixed(2),
}]);

// ─── 4. Plus-value : même problème ? ─────────────────────────────────────────
const addedDash = db.prepare(`
  SELECT SUM(COALESCE(e.added_value, 0)) as total
  FROM wine_enrichments e
`).get();

console.log("\n## Plus-value enrichments vs Viniou");
console.table([{
  added_value_enrichments: addedDash.total.toFixed(2),
  viniou_reference: 1699,
  ecart: (1699 - addedDash.total).toFixed(2),
}]);

// ─── 5. avgPurchasePrice : recalcul correct ───────────────────────────────────
// Viniou : 116 € / 9 bouteilles = 12.89 €
const purchaseAudit = db.prepare(`
  SELECT
    SUM(COALESCE(purchase_total_price, 0)) as total_achat,
    SUM(CASE WHEN purchase_total_price > 0 THEN quantity ELSE 0 END) as bouteilles_avec_prix,
    SUM(CASE WHEN purchase_total_price > 0 THEN 1 ELSE 0 END) as lignes_avec_prix
  FROM wines
`).get();

const avg = purchaseAudit.total_achat / purchaseAudit.bouteilles_avec_prix;
console.log("\n## avgPurchasePrice recalcul");
console.table([{
  total_achat: purchaseAudit.total_achat,
  bouteilles_avec_prix: purchaseAudit.bouteilles_avec_prix,
  lignes_avec_prix: purchaseAudit.lignes_avec_prix,
  avg_calcule: avg.toFixed(2),
  viniou_reference: 12.89,
}]);

// ─── 6. Couleurs : classification correcte (wine_type comme discriminant) ─────
log("Couleurs avec wine_type comme discriminant effervescent", `
  SELECT
    CASE WHEN wine_type LIKE '%Effervescent%' THEN 'Effervescent' ELSE 'Tranquille' END AS categorie,
    color,
    SUM(quantity) as qty,
    COUNT(*) as rows
  FROM wines
  GROUP BY categorie, color
  ORDER BY categorie, qty DESC
`);

// ─── 7. peakYearCounts : buckets Viniou (<2026 / 2026 / 2027 / 2028 / >2028) ─
// Viniou : <2026=10, 2026=8, 2027=3, 2028=3, >2028=56
const currentYear = 2026;
log(`peakYearCounts Viniou-style (buckets autour de ${currentYear})`, `
  SELECT
    CASE
      WHEN peak_min IS NULL OR peak_max IS NULL THEN 'Sans apogée'
      WHEN peak_max < ${currentYear}               THEN '<${currentYear}'
      WHEN peak_min <= ${currentYear} AND peak_max >= ${currentYear} THEN '${currentYear}'
      WHEN peak_min <= ${currentYear+1} AND peak_max >= ${currentYear+1} THEN '${currentYear+1}'
      WHEN peak_min <= ${currentYear+2} AND peak_max >= ${currentYear+2} THEN '${currentYear+2}'
      ELSE '>${currentYear+2}'
    END AS bucket,
    SUM(quantity) as qty,
    COUNT(*) as rows
  FROM wines
  WHERE quantity > 0
  GROUP BY bucket
  ORDER BY
    CASE bucket
      WHEN '<${currentYear}'   THEN 1
      WHEN '${currentYear}'    THEN 2
      WHEN '${currentYear+1}'  THEN 3
      WHEN '${currentYear+2}'  THEN 4
      WHEN '>${currentYear+2}' THEN 5
      ELSE 6
    END
`);

// ─── 8. Gamme : vérifier l'écart vs Viniou (Premium 12, Inter 56, Acc 12) ────
log("Gamme par quantité (quantity > 0 seulement)", `
  SELECT range, SUM(quantity) as qty, COUNT(*) as rows
  FROM wines
  WHERE quantity > 0
  GROUP BY range
  ORDER BY qty DESC
`);

// ─── 9. Modèle de données : limitation historique mouvements ─────────────────
console.log("\n## Diagnostic modèle : mouvements de stock");
const cols = db.prepare("SELECT name FROM pragma_table_info('wines') WHERE name LIKE '%out%' OR name LIKE '%movement%' OR name LIKE '%history%'").all();
console.log("Colonnes liées aux sorties dans wines :", cols.map(c => c.name));
console.log("Table stock_movements existe ?", db.prepare("SELECT name FROM sqlite_master WHERE name='stock_movements'").get() ?? "NON");
console.log("Table wine_outputs existe ?", db.prepare("SELECT name FROM sqlite_master WHERE name='wine_outputs'").get() ?? "NON");

db.close();
