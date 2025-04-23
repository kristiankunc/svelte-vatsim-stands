import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./vitest.setup.ts",
		include: ["src/**/*.{test,spec}.{js,ts}"],
		alias: {
			$lib: "/src/lib",
			$routes: "/src/routes",
			$components: "/src/components",
			$stores: "/src/stores",
			$utils: "/src/utils",
			$assets: "/src/assets"
		}
	}
});
