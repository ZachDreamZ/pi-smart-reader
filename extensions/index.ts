import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SmartParser } from "./parser";
import { SkeletonEngine } from "./skeleton";
import { SymbolExtractor } from "./extractor";
import { readFileSync } from "fs";
import path from "path";

export default async function (pi: ExtensionAPI) {
	const parser = new SmartParser();
	await parser.initialize();
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
			const { path: filePath, options } = input;
			const mode = options?.mode;

			try {
				if (!mode) {
					throw new Error("options.mode is required.");
				}

				const absolutePath = path.resolve(filePath);
				const source = readFileSync(absolutePath, "utf8");

				if (mode === "skeleton") {
					return {
						content: skeletonEngine.generateSkeleton(source),
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
}
