import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SmartParser } from "./parser";
import { SkeletonEngine } from "./skeleton";
import { SymbolExtractor } from "./extractor";
import { readFileSync } from "fs";
import path from "path";

// Configuration for passive mode
interface SmartReaderConfig {
	enabled: boolean;
	threshold: number; // lines
	cacheTTL: number; // ms
	languages: string[];
}

const DEFAULT_CONFIG: SmartReaderConfig = {
	enabled: true,
	threshold: 500, // lines
	cacheTTL: 60000, // 1 minute
	languages: ["typescript", "javascript", "python", "rust"],
};

// Cache for parsed skeletons
interface CacheEntry {
	content: string;
	timestamp: number;
}

export default async function (pi: ExtensionAPI) {
	const parser = new SmartParser();
	const initialized = await parser.initialize();

	if (!initialized) {
		console.error("[pi-smart-reader] Failed to initialize parser. Passive mode disabled.");
		// Still register tool for manual use with error handling
	}

	const skeletonEngine = new SkeletonEngine(parser);
	const symbolExtractor = new SymbolExtractor(parser);
	const config = { ...DEFAULT_CONFIG };
	const cache = new Map<string, CacheEntry>();

	// Helper: generate skeleton with caching
	function generateSkeletonCached(source: string, filePath: string): string {
		const cached = cache.get(filePath);
		if (cached && Date.now() - cached.timestamp < config.cacheTTL) {
			return cached.content;
		}

		const skeleton = skeletonEngine.generateSkeleton(source);
		cache.set(filePath, { content: skeleton, timestamp: Date.now() });
		return skeleton;
	}

	// Helper: check if file should be optimized
	function shouldOptimize(source: string): boolean {
		const lines = source.split("\n");
		return lines.length > config.threshold;
	}

	// Helper: get file language from extension
	function getLanguage(filePath: string): string | null {
		const ext = path.extname(filePath).toLowerCase();
		const langMap: Record<string, string> = {
			".ts": "typescript",
			".tsx": "typescript",
			".js": "javascript",
			".jsx": "javascript",
			".py": "python",
			".rs": "rust",
			".go": "go",
			".java": "java",
		};
		return langMap[ext] || null;
	}

	// === PASSIVE MODE: Intercept file reads ===
	pi.on("tool_result", async (event: any, ctx: any) => {
		if (!config.enabled || !initialized) return;

		try {
			// Check if this is a read tool result
			const toolName = event?.toolName || event?.name;
			if (toolName !== "read") return;

			// Get the file content from the result
			const content = event?.content || event?.result;
			if (!content || typeof content !== "string") return;

			// Get file path
			const filePath = event?.path || event?.args?.path;
			if (!filePath) return;

			// Check if file should be optimized
			if (!shouldOptimize(content)) return;

			// Check if language is supported
			const language = getLanguage(filePath);
			if (!language || !config.languages.includes(language)) return;

			// Generate skeletal view
			const skeleton = generateSkeletonCached(content, filePath);

			// Notify user about optimization
			ctx.ui.notify(
				`Large file detected (${filePath}). Skeletal view available.`,
				"info"
			);

			// Store skeleton in context for Pi to use
			// This allows Pi to reference the skeletal view when needed
			if (ctx.setContext) {
				ctx.setContext(`smart-reader:${filePath}`, {
					type: "skeleton",
					content: skeleton,
					originalSize: content.length,
					skeletonSize: skeleton.length,
				});
			}
		} catch (err: any) {
			if (process.env.DEBUG || process.env.PI_DEBUG) {
				console.error("[pi-smart-reader] Passive mode error:", err.message);
			}
		}
	});

	// === ACTIVE TOOL: Manual invocation ===
	pi.registerTool({
		name: "smart_read",
		description:
			"Read a file structurally. Use 'skeleton' mode to see the API of a large file, or 'symbol' mode to extract a specific function body.",
		parameters: {
			type: "object",
			properties: {
				path: { type: "string", description: "Path to the file to read" },
				options: {
					type: "object",
					properties: {
						mode: {
							type: "string",
							enum: ["skeleton", "symbol"],
							description: "Extraction mode",
						},
						symbol: {
							type: "string",
							description:
								"The name of the symbol to extract (required for 'symbol' mode)",
						},
					},
					required: ["mode"],
				},
			},
			required: ["path", "options"],
		},
		handler: async (input: any, _ctx: any) => {
			const { path: filePath, options } = input;
			const mode = options?.mode;

			try {
				if (!mode) {
					throw new Error("options.mode is required.");
				}

				if (!initialized) {
					throw new Error("Parser not initialized. Check if tree-sitter WASM files are available.");
				}

				const absolutePath = path.resolve(filePath);
				const source = readFileSync(absolutePath, "utf8");

				if (mode === "skeleton") {
					const skeleton = generateSkeletonCached(source, absolutePath);
					return {
						content: skeleton,
						mode: "skeleton",
						message:
							"Skeletal view of the file generated. Implementation details stripped.",
					};
				}

				if (mode === "symbol") {
					if (!options.symbol) {
						throw new Error("Symbol name is required for 'symbol' mode.");
					}

					const { content, relatedSymbols } = symbolExtractor.extractSymbol(
						source,
						options.symbol,
					);

					return {
						content,
						relatedSymbols,
						mode: "symbol",
						message: `Extracted symbol '${options.symbol}' and identified related dependencies.`,
					};
				}

				throw new Error(`Unsupported mode: ${mode}`);
			} catch (error: any) {
				return {
					content: "",
					mode: mode || "unknown",
					message: "",
					error: `Failed to smart-read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
				};
			}
		},
	});

	// === Configuration Command ===
	(pi as ExtensionAPI & { registerCommand?: Function }).registerCommand?.(
		"smart-reader",
		{
			description: "Configure smart-reader passive mode",
			handler: async (args: string, ctx: any) => {
				const parts = args.trim().split(/\s+/);
				const action = parts[0];

				if (action === "on") {
					config.enabled = true;
					ctx.ui.notify("Smart Reader passive mode enabled.", "success");
				} else if (action === "off") {
					config.enabled = false;
					ctx.ui.notify("Smart Reader passive mode disabled.", "info");
				} else if (action === "status") {
					const status = [
						`Passive mode: ${config.enabled ? "ON" : "OFF"}`,
						`Threshold: ${config.threshold} lines`,
						`Cache TTL: ${config.cacheTTL / 1000}s`,
						`Languages: ${config.languages.join(", ")}`,
						`Cache size: ${cache.size} entries`,
					].join("\n");
					ctx.ui.notify(status, "info");
				} else if (action === "threshold" && parts[1]) {
					config.threshold = parseInt(parts[1], 10) || 500;
					ctx.ui.notify(`Threshold set to ${config.threshold} lines.`, "success");
				} else {
					ctx.ui.notify(
						"Usage: /smart-reader [on|off|status|threshold <lines>]",
						"info"
					);
				}
			},
		},
	);
}
