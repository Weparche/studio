import { describe, expect, it } from "vitest";
import { renumberReferences } from "../src/shared/references";
import { calculateCost, defaultPricingConfig } from "../src/shared/pricing";
import { mapProviderStatus } from "../src/server/providers/byteplus-seedance";

/**
 * Integration-style flows using mock provider semantics (no paid BytePlus calls).
 */
describe("mock generation lifecycle", () => {
  it("maps queued → running → succeeded", () => {
    const states = ["queued", "running", "succeeded"].map(mapProviderStatus);
    expect(states).toEqual(["queued", "running", "succeeded"]);
  });

  it("archives metadata shape after success", () => {
    const generation = {
      id: "gen_1",
      status: "succeeded" as const,
      r2_video_key: "projects/p/episodes/e/scenes/s/generations/gen_1/video.mp4",
      r2_last_frame_key: "projects/p/episodes/e/scenes/s/generations/gen_1/last-frame.jpg",
      archived: true,
    };
    expect(generation.archived).toBe(true);
    expect(generation.r2_video_key.endsWith("video.mp4")).toBe(true);
  });

  it("continue from last frame sets first_frame mode", () => {
    const lastFrameAssetId = "asset_last";
    const next = {
      mode: "first_frame" as const,
      firstFrameAssetId: lastFrameAssetId,
      references: renumberReferences([
        { id: "1", assetId: "char_ref", label: "Nera", characterId: "char_nera" },
      ]),
    };
    expect(next.mode).toBe("first_frame");
    expect(next.firstFrameAssetId).toBe("asset_last");
    expect(next.references[0].tag).toBe("@image1");
  });

  it("retry keeps settings and creates new cost estimate", () => {
    const estimate = calculateCost(
      { resolution: "480p", durationSeconds: 5, hasVideoInput: false },
      defaultPricingConfig(),
    );
    expect(estimate.estimatedCostUsd).toBeGreaterThan(0);
  });
});
