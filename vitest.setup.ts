import { vi } from "vitest";

vi.mock("$env/static/public", () => ({
	PUBLIC_NODE_ENV: "test"
}));
