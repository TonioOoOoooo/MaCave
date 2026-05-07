import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { HttpError } from "../http.js";
import { tastingNotes } from "../schema.js";
import { getWineById } from "./wine.service.js";
export function listTastingNotes(wineId) {
    getWineById(wineId);
    return db.select().from(tastingNotes).where(eq(tastingNotes.wineId, wineId)).orderBy(desc(tastingNotes.createdAt)).all();
}
export function createTastingNote(wineId, input) {
    getWineById(wineId);
    const now = new Date().toISOString();
    return db.insert(tastingNotes)
        .values({
        wineId,
        tastingDate: input.tastingDate ?? new Date().toISOString().slice(0, 10),
        rating: input.rating ?? null,
        note: input.note,
        context: input.context ?? null,
        createdAt: now,
        updatedAt: now
    })
        .returning()
        .get();
}
export function updateTastingNote(noteId, input) {
    const existing = getTastingNote(noteId);
    return db.update(tastingNotes)
        .set({
        tastingDate: Object.hasOwn(input, "tastingDate") ? input.tastingDate ?? null : existing.tastingDate,
        rating: Object.hasOwn(input, "rating") ? input.rating ?? null : existing.rating,
        note: input.note ?? existing.note,
        context: Object.hasOwn(input, "context") ? input.context ?? null : existing.context,
        updatedAt: new Date().toISOString()
    })
        .where(eq(tastingNotes.id, noteId))
        .returning()
        .get();
}
export function deleteTastingNote(noteId) {
    getTastingNote(noteId);
    db.delete(tastingNotes).where(eq(tastingNotes.id, noteId)).run();
}
function getTastingNote(noteId) {
    const note = db.select().from(tastingNotes).where(eq(tastingNotes.id, noteId)).get();
    if (!note)
        throw new HttpError(404, "Tasting note not found");
    return note;
}
