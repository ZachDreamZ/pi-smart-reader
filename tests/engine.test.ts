import { SkeletonEngine } from "../extensions/skeleton";
import { SymbolExtractor } from "../extensions/extractor";
import { SmartParser } from "../extensions/parser";

// Mocking web-tree-sitter for unit tests since we can't easily load WASM in a test environment
jest.mock("web-tree-sitter", () => {
	return {
		__esModule: true,
		default: class MockParser {
			static init = jest.fn().mockResolvedValue(undefined);
			static Language: any = {
				load: jest.fn().mockResolvedValue({
					types: { function_declaration: "function_declaration" },
				}),
			};
			constructor() {}
			setLanguage = jest.fn();
			parse = jest.fn().mockReturnValue({
				rootNode: {
					type: "program",
					namedChildren: [],
					startIndex: 0,
					endIndex: 0,
					startPosition: { row: 0, column: 0 },
					endPosition: { row: 0, column: 0 },
				},
			});
		},
	};
});

describe("pi-smart-reader Engine Tests", () => {
	let parser: SmartParser;
	let skeletonEngine: SkeletonEngine;
	let symbolExtractor: SymbolExtractor;

	beforeAll(async () => {
		parser = new SmartParser();
		await parser.initialize();
		skeletonEngine = new SkeletonEngine(parser);
		symbolExtractor = new SymbolExtractor(parser);
	});

	describe("SkeletonEngine", () => {
		it("should return fallback message for empty source", () => {
			const result = skeletonEngine.generateSkeleton("");
			expect(result).toBe("// No structural symbols found in this file.");
		});
	});

	describe("SymbolExtractor", () => {
		it("should throw error if symbol not found", () => {
			expect(() => {
				symbolExtractor.extractSymbol("const x = 1;", "nonExistentSymbol");
			}).toThrow("Symbol 'nonExistentSymbol' not found in file.");
		});
	});
});
