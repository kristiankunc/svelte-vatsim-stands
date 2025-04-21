import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	resolve: process.env.VITEST
		? {
				conditions: ["browser"]
			}
		: undefined,
	test: {
		env: loadEnv(".env", process.cwd())
	}
});
