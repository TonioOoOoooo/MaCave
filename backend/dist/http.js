import { ZodError } from "zod";
export function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
export function errorHandler(error, _req, res, _next) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            error: "Validation error",
            issues: error.issues
        });
    }
    if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
}
export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
