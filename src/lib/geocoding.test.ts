import { describe, expect, it } from "vitest";
import { COUNTRY_OPTIONS, buildLocationQuery } from "./geocoding";

describe("geocoding helpers", () => {
  it("includes United Arab Emirates in the available country list", () => {
    expect(COUNTRY_OPTIONS.some((country) => country.value === "AE")).toBe(true);
    expect(COUNTRY_OPTIONS.find((country) => country.value === "AE")?.label).toBe("United Arab Emirates");
  });

  it("builds location queries with the country when provided", () => {
    expect(
      buildLocationQuery({
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
      })
    ).toBe("Dubai, Dubai, 00000, United Arab Emirates");
  });
});
