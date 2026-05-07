import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeWine, listWines } from "./client";

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds wine list query parameters", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0, sortBy: "region", sortOrder: "asc" }));

    await listWines({ page: 2, pageSize: 10, search: " Bordeaux " });

    expect(fetchMock).toHaveBeenCalledWith("/api/wines?page=2&pageSize=10&search=Bordeaux", expect.any(Object));
  });

  it("uses POST when consuming a bottle", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: 1, quantity: 2 }));

    await consumeWine(1);

    expect(fetchMock).toHaveBeenCalledWith("/api/wines/1/consume", expect.objectContaining({ method: "POST" }));
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
