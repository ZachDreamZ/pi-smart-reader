import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SmartParser } from "./parser";
import { SkeletonEngine } from "./skeleton";
import { SymbolExtractor } from "./extractor";
import { readFileSync } from "fs";

export default async function (pi: ExtensionAPI) {
	const parser = new SmartParser();

	// Configuration for JS/TS (using hosted WASM for simplicity in this version)
	const config = {
		wasmPath:
			"https://github.com/tree-sitter/tree-sitter-wasm/releases/download/v0.20.0/tree-sitter.wasm",
		languagePath:
			"https://github.com/tree-sitter/tree-sitter-typescript/releases/download/v0.20.0/tree-sitter-typescript.wasm",
	};

	await parser.initialize(config);
	const skeletonEngine = new SkeletonEngine(parser);
	const symbolExtractor = new SymbolExtractor(parser);

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
			const { path, options } = input;

			try {
				const source = readFileSync(path, "utf8");

				if (options.mode === "skeleton") {
					return {
						content: skeletonEngine.generateSkeleton(source),
						mode: "skeleton",
						message:
							"Skeletal view of the file generated. Implementation details stripped.",
					};
				}

				if (options.mode === "symbol") {
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

				throw new Error(`Unsupported mode: ${options.mode}`);
			} catch (error: any) {
				return {
					error: `Failed to smart-read ${path}: ${error.message}`,
				};
			}
		},
	});
}
