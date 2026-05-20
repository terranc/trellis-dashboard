import { describe, expect, it } from "vitest";
import { parseArgs } from "../cli.js";

describe("cli args", () => {
  it("uses defaults", () => {
    expect(parseArgs([])).toEqual({ port: 3777, open: true });
  });

  it("parses port and no-open", () => {
    expect(parseArgs(["--port", "4010", "--no-open"])).toEqual({
      port: 4010,
      open: false,
    });
  });

  it("rejects invalid ports", () => {
    expect(() => parseArgs(["--port", "nope"])).toThrow("positive integer");
  });
});
