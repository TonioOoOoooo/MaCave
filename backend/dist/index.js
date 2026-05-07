import cors from "cors";
import express from "express";
import { migrate } from "./db.js";
import { errorHandler } from "./http.js";
import { winesRouter } from "./routes/wines.routes.js";
migrate();
const app = express();
const port = Number(process.env.PORT ?? 3000);
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.get("/api/health", (_req, res) => {
    res.json({
        ok: true,
        service: "ma-cave",
        timestamp: new Date().toISOString()
    });
});
app.use("/api/wines", winesRouter);
app.use(errorHandler);
app.listen(port, () => {
    console.log(`Ma Cave listening on :${port}`);
});
