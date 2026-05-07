import { Router } from "express";
import {
  consumeWine,
  createWine,
  deleteWine,
  getWineById,
  listWines,
  updateWine
} from "../services/wine.service.js";
import {
  createTastingNote,
  deleteTastingNote,
  listTastingNotes,
  updateTastingNote
} from "../services/tasting-note.service.js";
import {
  idParamSchema,
  tastingNoteCreateSchema,
  tastingNoteIdParamSchema,
  tastingNoteUpdateSchema,
  wineCreateSchema,
  wineQuerySchema,
  wineUpdateSchema
} from "../validation.js";

export const winesRouter = Router();

winesRouter.get("/", (req, res) => {
  const query = wineQuerySchema.parse(req.query);
  res.json(listWines(query));
});

winesRouter.get("/:id", (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(getWineById(id));
});

winesRouter.post("/", (req, res) => {
  const body = wineCreateSchema.parse(req.body);
  res.status(201).json(createWine(body));
});

winesRouter.put("/:id", (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = wineUpdateSchema.parse(req.body);
  res.json(updateWine(id, body));
});

winesRouter.delete("/:id", (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  deleteWine(id);
  res.status(204).send();
});

winesRouter.post("/:id/consume", (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(consumeWine(id));
});

winesRouter.get("/:id/tasting-notes", (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(listTastingNotes(id));
});

winesRouter.post("/:id/tasting-notes", (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = tastingNoteCreateSchema.parse(req.body);
  res.status(201).json(createTastingNote(id, body));
});

winesRouter.put("/tasting-notes/:noteId", (req, res) => {
  const { noteId } = tastingNoteIdParamSchema.parse(req.params);
  const body = tastingNoteUpdateSchema.parse(req.body);
  res.json(updateTastingNote(noteId, body));
});

winesRouter.delete("/tasting-notes/:noteId", (req, res) => {
  const { noteId } = tastingNoteIdParamSchema.parse(req.params);
  deleteTastingNote(noteId);
  res.status(204).send();
});
