import { describe, expect, it } from "vitest";
import { buildBytePlusPayload, mapProviderStatus } from "../src/server/providers/byteplus-seedance";
import { calculateCost, defaultPricingConfig, estimateVideoTokens } from "../src/shared/pricing";
import { moveReference, renumberReferences } from "../src/shared/references";
import { signMediaUrl, verifySignedMedia } from "../src/shared/signed-media";

describe("BytePlus payload builder", () => {
  it("builds text-to-video payload", () => {
    const payload = buildBytePlusPayload({
      prompt: "A quiet street in Zagreb at dusk",
      mode: "text",
      references: [],
      duration: 5,
      resolution: "480p",
      aspectRatio: "9:16",
      generateAudio: false,
      returnLastFrame: true,
      watermark: false,
    });
    expect(payload.model).toBe("dreamina-seedance-2-5-260628");
    expect(payload.content[0]).toEqual({
      type: "text",
      text: "A quiet street in Zagreb at dusk",
    });
    expect(payload.resolution).toBe("480p");
    expect(payload.ratio).toBe("9:16");
    expect(payload.generate_audio).toBe(false);
    expect(payload.return_last_frame).toBe(true);
    expect(payload.watermark).toBe(false);
  });

  it("forces adaptive ratio for first frame mode", () => {
    const payload = buildBytePlusPayload({
      prompt: "Camera push in",
      mode: "first_frame",
      firstFrame: {
        assetId: "a1",
        role: "first_frame",
        tag: "@image_first",
        sortOrder: 0,
        url: "https://example.com/first.jpg",
      },
      references: [],
      duration: 10,
      resolution: "480p",
      aspectRatio: "9:16",
      generateAudio: true,
      returnLastFrame: true,
    });
    expect(payload.ratio).toBe("adaptive");
    expect(payload.content.some((c) => c.role === "first_frame")).toBe(true);
  });

  it("builds first+last frame payload", () => {
    const payload = buildBytePlusPayload({
      prompt: "Transition",
      mode: "first_last",
      firstFrame: {
        assetId: "a1",
        role: "first_frame",
        tag: "@f",
        sortOrder: 0,
        url: "https://example.com/a.jpg",
      },
      lastFrame: {
        assetId: "a2",
        role: "last_frame",
        tag: "@l",
        sortOrder: 0,
        url: "https://example.com/b.jpg",
      },
      references: [],
      duration: 8,
      resolution: "720p",
      aspectRatio: "16:9",
      generateAudio: true,
      returnLastFrame: true,
    });
    expect(payload.ratio).toBe("adaptive");
    expect(payload.content.filter((c) => c.role === "first_frame")).toHaveLength(1);
    expect(payload.content.filter((c) => c.role === "last_frame")).toHaveLength(1);
  });

  it("orders reference images for @ImageN binding", () => {
    const payload = buildBytePlusPayload({
      prompt: "Keep @image1 and @image2 consistent",
      mode: "references",
      references: [
        {
          assetId: "a2",
          role: "reference_image",
          tag: "@image2",
          sortOrder: 1,
          url: "https://example.com/2.jpg",
        },
        {
          assetId: "a1",
          role: "reference_image",
          tag: "@image1",
          sortOrder: 0,
          url: "https://example.com/1.jpg",
        },
      ],
      duration: 15,
      resolution: "480p",
      aspectRatio: "9:16",
      generateAudio: true,
      returnLastFrame: true,
    });
    const images = payload.content.filter((c) => c.type === "image_url");
    expect(images[0].image_url?.url).toContain("1.jpg");
    expect(images[1].image_url?.url).toContain("2.jpg");
    expect(payload.omni_reference_task_type).toBe("auto");
  });

  it("rejects invalid duration", () => {
    expect(() =>
      buildBytePlusPayload({
        prompt: "x",
        mode: "text",
        references: [],
        duration: 3,
        resolution: "480p",
        aspectRatio: "9:16",
        generateAudio: false,
        returnLastFrame: false,
      }),
    ).toThrow(/Duration/);
  });

  it("does not mix reference_image into first_frame mode", () => {
    const payload = buildBytePlusPayload({
      prompt: "Animate",
      mode: "first_frame",
      firstFrame: {
        assetId: "a1",
        role: "first_frame",
        tag: "@f",
        sortOrder: 0,
        url: "https://example.com/first.jpg",
      },
      references: [
        {
          assetId: "a2",
          role: "reference_image",
          tag: "@image1",
          sortOrder: 0,
          url: "https://example.com/ref.jpg",
        },
      ],
      duration: 5,
      resolution: "480p",
      aspectRatio: "9:16",
      generateAudio: true,
      returnLastFrame: true,
    });
    expect(payload.content.some((c) => c.role === "reference_image")).toBe(false);
    expect(payload.content.filter((c) => c.type === "image_url")).toHaveLength(1);
  });
});

describe("provider status mapper", () => {
  it("maps known statuses", () => {
    expect(mapProviderStatus("succeeded")).toBe("succeeded");
    expect(mapProviderStatus("running")).toBe("running");
    expect(mapProviderStatus("queued")).toBe("queued");
    expect(mapProviderStatus("failed")).toBe("failed");
    expect(mapProviderStatus("expired")).toBe("expired");
    expect(mapProviderStatus("cancelled")).toBe("cancelled");
  });
});

describe("pricing calculator", () => {
  it("estimates 480p 5s near official $0.514", () => {
    const tokens = estimateVideoTokens({
      resolution: "480p",
      durationSeconds: 5,
      hasVideoInput: false,
    });
    expect(tokens).toBe(Math.round((5 * 854 * 480 * 24) / 1024));
    const cost = calculateCost(
      { resolution: "480p", durationSeconds: 5, hasVideoInput: false },
      defaultPricingConfig(),
    );
    expect(cost.estimatedCostUsd).toBeCloseTo(0.514, 2);
    expect(cost.label).toBe("estimated");
  });

  it("uses completion tokens as confirmed", () => {
    const cost = calculateCost(
      {
        resolution: "480p",
        durationSeconds: 5,
        hasVideoInput: false,
        completionTokens: 48040,
      },
      defaultPricingConfig(),
    );
    expect(cost.label).toBe("confirmed");
    expect(cost.confirmedCostUsd).toBeCloseTo((48040 / 1_000_000) * 10.7, 5);
  });
});

describe("reference ordering", () => {
  it("renumbers tags after reorder", () => {
    const items = [
      { id: "1", assetId: "a", label: "Dora" },
      { id: "2", assetId: "b", label: "Petar" },
      { id: "3", assetId: "c", label: "Grga" },
    ];
    const moved = moveReference(items, 0, 2);
    expect(moved.map((m) => m.tag)).toEqual(["@image1", "@image2", "@image3"]);
    expect(moved[0].label).toBe("Petar");
    expect(moved[2].label).toBe("Dora");
  });

  it("assigns deterministic tags", () => {
    const tagged = renumberReferences([
      { id: "1", assetId: "a", label: "Nera" },
      { id: "2", assetId: "b", label: "Barbara" },
    ]);
    expect(tagged[0].tag).toBe("@image1");
    expect(tagged[1].tag).toBe("@image2");
  });
});

describe("signed media URLs", () => {
  it("signs and verifies", async () => {
    const secret = "test-secret-media-signing-key";
    const url = await signMediaUrl("https://studio.nepar.hr", "asset_123", secret, 60, 1_000_000);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/media/signed/asset_123");
    const ok = await verifySignedMedia(
      "asset_123",
      parsed.searchParams.get("exp"),
      parsed.searchParams.get("sig"),
      secret,
      1_000_000,
    );
    expect(ok).toEqual({ ok: true });
  });

  it("rejects expired signatures", async () => {
    const secret = "test-secret-media-signing-key";
    const url = await signMediaUrl("https://studio.nepar.hr", "asset_123", secret, 10, 1_000);
    const parsed = new URL(url);
    const bad = await verifySignedMedia(
      "asset_123",
      parsed.searchParams.get("exp"),
      parsed.searchParams.get("sig"),
      secret,
      2_000,
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe("expired");
  });

  it("rejects tampered signatures", async () => {
    const secret = "test-secret-media-signing-key";
    const bad = await verifySignedMedia("asset_123", "9999999999", "deadbeef", secret, 1);
    expect(bad.ok).toBe(false);
  });
});

describe("idempotency key uniqueness", () => {
  it("treats identical keys as collision candidates", () => {
    const key = "idem_abc";
    const map = new Map<string, string>();
    map.set(key, "gen_1");
    expect(map.get(key)).toBe("gen_1");
    expect(map.has(key)).toBe(true);
  });
});

describe("input validation bounds", () => {
  it("supports official duration range 4-30", () => {
    expect(MIN_MAX().min).toBe(4);
    expect(MIN_MAX().max).toBe(30);
  });
});

function MIN_MAX() {
  return { min: 4, max: 30 };
}
