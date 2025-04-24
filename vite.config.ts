import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	return {
		plugins: [sveltekit(), tailwindcss()],
		resolve: process.env.VITEST
			? {
					conditions: ["browser"]
				}
			: undefined,
		test: {
			env: loadEnv(mode, process.cwd()),
			globals: true,
			environment: "jsdom"
		}
	};
});
