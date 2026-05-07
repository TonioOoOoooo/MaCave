export function clean(value) {
    if (value === undefined || value === null)
        return null;
    const text = String(value).trim();
    return text === "" ? null : text;
}
export function parseFrenchNumber(value) {
    const text = clean(value);
    if (!text)
        return null;
    const normalized = text
        .replace(/\s/g, "")
        .replace("€", "")
        .replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}
export function parseInteger(value, zeroIsNull = false) {
    const parsed = parseFrenchNumber(value);
    if (parsed === null)
        return null;
    const integer = Math.trunc(parsed);
    return zeroIsNull && integer === 0 ? null : integer;
}
export function parseFrenchDate(value) {
    const text = clean(value);
    if (!text)
        return null;
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match)
        return text;
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
export function mapViniouRow(row) {
    const quantity = parseInteger(row["Quantité en Stock"]) ?? 0;
    const marketUnitPrice = parseFrenchNumber(row["Prix Marché Unitaire Actuelle"]);
    const exportedTotalValue = parseFrenchNumber(row["Valeur Totale"]);
    const totalValue = exportedTotalValue ?? (marketUnitPrice !== null ? marketUnitPrice * quantity : null);
    const now = new Date().toISOString();
    return {
        viniouId: clean(row["Identifiant"]),
        wineType: clean(row["Type de Vin"]),
        country: clean(row["Pays"]),
        region: clean(row["Région Viticole"]),
        subRegion: clean(row["Sous Région"]),
        appellation: clean(row["Appellation"]),
        appellationType: clean(row["Type d’Appellation"] ?? row["Type d'Appellation"]),
        classification: clean(row["Classification"]),
        estate: clean(row["Domaine ou Château"]),
        cuvee: clean(row["Nom de la Cuvée"]),
        vintage: parseInteger(row["Année du Millésime"], true),
        alcohol: parseFrenchNumber(row["Degré d'alcool"]),
        quantity,
        cellar: clean(row["Nom de la Cave"]),
        location: clean(row["Emplacement"]),
        position: clean(row["Position (X-Y)"]),
        color: clean(row["Couleur"]),
        youthMin: parseInteger(row["Jeunesse Min"], true),
        youthMax: parseInteger(row["Jeunesse Max"], true),
        maturityMin: parseInteger(row["Maturité Min"], true),
        maturityMax: parseInteger(row["Maturité Max"], true),
        peakMin: parseInteger(row["Apogée Min"], true),
        peakMax: parseInteger(row["Apogée Max"], true),
        declineMin: parseInteger(row["Déclin Min"], true),
        declineMax: parseInteger(row["Déclin Max"], true),
        agingPhases: clean(row["Phases de vieillissement"]),
        range: clean(row["Gamme du vin"]),
        comments: clean(row["Commentaires"]),
        lastPurchaseDate: parseFrenchDate(row["Date Dernier Achat"]),
        lastPurchaseUnitPrice: parseFrenchNumber(row["Prix Unitaire Dernier Achat"]),
        purchaseTotalPrice: parseFrenchNumber(row["Prix Total Achat"]),
        marketUnitPrice,
        totalValue,
        priceTrend: clean(row["Tendance prix"]),
        packagingType: clean(row["Type de Conditionnement"]),
        purchaseType: clean(row["Type Achat"]),
        purchasePlace: clean(row["Lieu Achat"]),
        lastOutDate: parseFrenchDate(row["Date Dernière Sortie"]),
        lastOutNote: clean(row["Note Dernière Sortie"]),
        myLists: clean(row["Mes listes"]),
        grapes: clean(row["Cépages"]),
        lists: clean(row["Listes"]),
        customField: clean(row["Champ personnalisé"]),
        bottleImagePath: null,
        createdAt: now,
        updatedAt: now
    };
}
