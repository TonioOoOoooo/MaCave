import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WinesList } from "./WinesList";

const wine = {
  id: 1,
  viniouId: null,
  wineType: "Rouge",
  country: "France",
  region: "Bordeaux",
  subRegion: null,
  appellation: "Pauillac",
  appellationType: null,
  classification: null,
  estate: "Chateau Test",
  cuvee: "Reserve",
  vintage: 2018,
  alcohol: null,
  quantity: 3,
  cellar: null,
  location: null,
  position: null,
  color: "Rouge",
  youthMin: null,
  youthMax: null,
  maturityMin: null,
  maturityMax: null,
  peakMin: null,
  peakMax: null,
  declineMin: null,
  declineMax: null,
  agingPhases: null,
  range: null,
  comments: null,
  lastPurchaseDate: null,
  lastPurchaseUnitPrice: null,
  purchaseTotalPrice: null,
  marketUnitPrice: null,
  totalValue: null,
  priceTrend: null,
  packagingType: null,
  purchaseType: null,
  purchasePlace: null,
  lastOutDate: null,
  lastOutNote: null,
  myLists: null,
  grapes: null,
  lists: null,
  customField: null,
  bottleImagePath: null,
  createdAt: "2026-05-07T00:00:00.000Z",
  updatedAt: "2026-05-07T00:00:00.000Z"
};

describe("WinesList", () => {
  it("renders wines and allows selecting one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      items: [wine],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
      sortBy: "region",
      sortOrder: "asc"
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const onSelectWine = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <WinesList onSelectWine={onSelectWine} />
      </QueryClientProvider>
    );

    const card = await screen.findByRole("button", { name: /Chateau Test - Reserve/i });
    expect(screen.getByText("1 vins")).toBeInTheDocument();

    await userEvent.click(card);

    expect(onSelectWine).toHaveBeenCalledWith(1);
  });
});
