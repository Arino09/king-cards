import { describe, expect, it } from "vitest";
import { compareKinds } from "./compare";

describe("compareKinds", () => {
  it("同牌双败", () => {
    expect(compareKinds("国王", "国王")).toBe("双败");
  });
  it("平民胜国王", () => {
    expect(compareKinds("平民", "国王")).toBe("先手胜");
    expect(compareKinds("国王", "平民")).toBe("后手胜");
  });
  it("国王胜大臣", () => {
    expect(compareKinds("国王", "大臣")).toBe("先手胜");
  });
  it("盗贼负于国王", () => {
    expect(compareKinds("国王", "盗贼")).toBe("先手胜");
  });
  it("平民胜盗贼", () => {
    expect(compareKinds("平民", "盗贼")).toBe("先手胜");
  });
});
