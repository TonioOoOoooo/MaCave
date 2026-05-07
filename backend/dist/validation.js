import { z } from "zod";
const emptyToNull = (value) => value === "" ? null : value;
const nullableText = z.preprocess(emptyToNull, z.string().trim().nullable());
const nullableInt = z.preprocess(emptyToNull, z.number().int().nullable());
const nullableNumber = z.preprocess(emptyToNull, z.number().nullable());
export const importedWineSchema = z.object({
    viniouId: nullableText,
    wineType: nullableText,
    country: nullableText,
    region: nullableText,
    subRegion: nullableText,
    appellation: nullableText,
    appellationType: nullableText,
    classification: nullableText,
    estate: nullableText,
    cuvee: nullableText,
    vintage: nullableInt,
    alcohol: nullableNumber,
    quantity: z.number().int().min(0),
    cellar: nullableText,
    location: nullableText,
    position: nullableText,
    color: nullableText,
    youthMin: nullableInt,
    youthMax: nullableInt,
    maturityMin: nullableInt,
    maturityMax: nullableInt,
    peakMin: nullableInt,
    peakMax: nullableInt,
    declineMin: nullableInt,
    declineMax: nullableInt,
    agingPhases: nullableText,
    range: nullableText,
    comments: nullableText,
    lastPurchaseDate: nullableText,
    lastPurchaseUnitPrice: nullableNumber,
    purchaseTotalPrice: nullableNumber,
    marketUnitPrice: nullableNumber,
    totalValue: nullableNumber,
    priceTrend: nullableText,
    packagingType: nullableText,
    purchaseType: nullableText,
    purchasePlace: nullableText,
    lastOutDate: nullableText,
    lastOutNote: nullableText,
    myLists: nullableText,
    grapes: nullableText,
    lists: nullableText,
    customField: nullableText,
    bottleImagePath: nullableText,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
}).strict();
export const wineQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    search: z.string().trim().optional(),
    filters: z.preprocess(parseFilters, z.record(z.union([z.string(), z.number()])).default({})),
    sortBy: z.enum(["vintage", "totalValue", "region", "quantity", "peakMin", "createdAt"]).default("region"),
    sortOrder: z.enum(["asc", "desc"]).default("asc")
}).strict();
export const wineCreateSchema = importedWineSchema
    .omit({ createdAt: true, updatedAt: true })
    .partial()
    .extend({
    quantity: z.coerce.number().int().min(0).default(0),
    vintage: z.coerce.number().int().nullable().optional(),
    alcohol: z.coerce.number().nullable().optional(),
    lastPurchaseUnitPrice: z.coerce.number().nullable().optional(),
    purchaseTotalPrice: z.coerce.number().nullable().optional(),
    marketUnitPrice: z.coerce.number().nullable().optional(),
    totalValue: z.coerce.number().nullable().optional(),
    youthMin: z.coerce.number().int().nullable().optional(),
    youthMax: z.coerce.number().int().nullable().optional(),
    maturityMin: z.coerce.number().int().nullable().optional(),
    maturityMax: z.coerce.number().int().nullable().optional(),
    peakMin: z.coerce.number().int().nullable().optional(),
    peakMax: z.coerce.number().int().nullable().optional(),
    declineMin: z.coerce.number().int().nullable().optional(),
    declineMax: z.coerce.number().int().nullable().optional()
})
    .strict();
export const wineUpdateSchema = wineCreateSchema.partial().strict();
export const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
});
export const tastingNoteCreateSchema = z.object({
    tastingDate: nullableText.optional(),
    rating: z.coerce.number().min(0).max(20).nullable().optional(),
    note: z.string().trim().min(1),
    context: nullableText.optional()
}).strict();
export const tastingNoteUpdateSchema = tastingNoteCreateSchema.partial().strict();
export const tastingNoteIdParamSchema = z.object({
    noteId: z.coerce.number().int().positive()
});
function parseFilters(value) {
    if (typeof value !== "string")
        return value;
    if (!value.trim())
        return {};
    try {
        return JSON.parse(value);
    }
    catch {
        return {};
    }
}
