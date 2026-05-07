export const initSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS wines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    viniou_id TEXT,
    wine_type TEXT,
    country TEXT,
    region TEXT,
    sub_region TEXT,
    appellation TEXT,
    appellation_type TEXT,
    classification TEXT,
    estate TEXT,
    cuvee TEXT,
    vintage INTEGER,
    alcohol REAL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cellar TEXT,
    location TEXT,
    position TEXT,
    color TEXT,
    youth_min INTEGER,
    youth_max INTEGER,
    maturity_min INTEGER,
    maturity_max INTEGER,
    peak_min INTEGER,
    peak_max INTEGER,
    decline_min INTEGER,
    decline_max INTEGER,
    aging_phases TEXT,
    range TEXT,
    comments TEXT,
    last_purchase_date TEXT,
    last_purchase_unit_price REAL,
    purchase_total_price REAL,
    market_unit_price REAL,
    total_value REAL,
    price_trend TEXT,
    packaging_type TEXT,
    purchase_type TEXT,
    purchase_place TEXT,
    last_out_date TEXT,
    last_out_note TEXT,
    my_lists TEXT,
    grapes TEXT,
    lists TEXT,
    custom_field TEXT,
    bottle_image_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasting_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wine_id INTEGER NOT NULL,
    tasting_date TEXT,
    rating REAL,
    note TEXT NOT NULL,
    context TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (wine_id) REFERENCES wines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wine_enrichments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wine_id INTEGER,
    viniou_id TEXT NOT NULL,
    service_temperature TEXT,
    recommended_aeration TEXT,
    peak_text TEXT,
    stock_amount REAL,
    market_stock_value REAL,
    added_value REAL,
    market_price_month TEXT,
    consumption_status TEXT,
    consumed_quantity INTEGER,
    food_pairing_1_name TEXT,
    food_pairing_1_description TEXT,
    food_pairing_2_name TEXT,
    food_pairing_2_description TEXT,
    food_pairing_3_name TEXT,
    food_pairing_3_description TEXT,
    viniou_review TEXT,
    viniou_review_date TEXT,
    image_url TEXT,
    attached_files TEXT,
    critic_notes TEXT,
    viniou_sheet_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (wine_id) REFERENCES wines(id) ON DELETE SET NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS wines_viniou_id_unique_idx ON wines(viniou_id) WHERE viniou_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS wines_country_idx ON wines(country);
  CREATE INDEX IF NOT EXISTS wines_region_idx ON wines(region);
  CREATE INDEX IF NOT EXISTS wines_color_idx ON wines(color);
  CREATE INDEX IF NOT EXISTS wines_vintage_idx ON wines(vintage);
  CREATE INDEX IF NOT EXISTS wines_peak_min_idx ON wines(peak_min);
  CREATE INDEX IF NOT EXISTS tasting_notes_wine_id_idx ON tasting_notes(wine_id);
  CREATE UNIQUE INDEX IF NOT EXISTS wine_enrichments_viniou_id_unique_idx ON wine_enrichments(viniou_id);
  CREATE INDEX IF NOT EXISTS wine_enrichments_wine_id_idx ON wine_enrichments(wine_id);
`;
