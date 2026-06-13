import { SmartParser } from "./src/parser";
import { SkeletonEngine } from "./src/skeleton";
import { SymbolExtractor } from "./src/extractor";
import { readFileSync } from "fs";

async function runBenchmark() {
	console.log("📊 Starting pi-smart-reader Performance Benchmark...");

	const parser = new SmartParser();
	await parser.initialize({
		wasmPath:
			"https://github.com/tree-sitter/tree-sitter-wasm/releases/download/v0.20.0/tree-sitter.wasm",
		languagePath:
			"https://github.com/tree-sitter/tree-sitter-typescript/releases/download/v0.20.0/tree-sitter-typescript.wasm",
	});

	const skeletonEngine = new SkeletonEngine(parser);
	const symbolExtractor = new SymbolExtractor(parser);

	const filePath = "benchmark_file.ts";
	const source = readFileSync(filePath, "utf8");
	const fullSize = source.length;

	console.log(`\nFile: ${filePath}`);
	console.log(`Full File Size: ${fullSize} characters`);

	// 1. Test Skeleton
	const skeleton = skeletonEngine.generateSkeleton(source);
	const skeletonSize = skeleton.length;
	const skeletonReduction = ((1 - skeletonSize / fullSize) * 100).toFixed(2);

	console.log(`\n--- Skeleton View ---`);
	console.log(`Skeleton Size: ${skeletonSize} characters`);
	console.log(`Reduction: ${skeletonReduction}%`);

	// 2. Test Symbol Extraction
	const targetSymbol = "login";
	const { content, relatedSymbols } = symbolExtractor.extractSymbol(
		source,
		targetSymbol,
	);
	const symbolSize = content.length;
	const symbolReduction = ((1 - symbolSize / fullSize) * 100).toFixed(2);

	console.log(`\n--- Symbol Extraction [${targetSymbol}] ---`);
	console.log(`Symbol Size: ${symbolSize} characters`);
	console.log(`Reduction: ${symbolReduction}%`);
	console.log(`Related Symbols Found: ${relatedSymbols.join(", ") || "None"}`);

	console.log(
		`\nConclusion: pi-smart-reader reduced context from ${fullSize} to as little as ${Math.min(skeletonSize, symbolSize)} characters.`,
	);
}

runBenchmark().catch(console.error);
