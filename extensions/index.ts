import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { SmartParser } from "./parser";
import { SkeletonEngine } from "./skeleton";
import { SymbolExtractor } from "./extractor";
import { readFileSync } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * pi-smart-reader v0.4.0
 *
 * Passive token optimization for Pi sessions.
 * Works out-of-the-box - no configuration required.
 *
 * Features:
 * - Auto-optimizes large files (300+ lines)
 * - Integrates with pi-impact-analyzer
 * - Intelligent caching with file hashing
 * - Supports TypeScript, JavaScript, Python, Rust, Go
 */

// ============ Configuration ============

const DEFAULT_CONFIG = {
	/** Always enabled by default - no toggle needed */
	enabled: true,
	/** Auto-optimize files larger than this (lines) */
	threshold: 300,
	/** Cache TTL in milliseconds (5 minutes) */
	cacheTTL: 300_000,
	/** Supported programming languages */
	languages: new Set([
		"typescript",
		"javascript",
		"python",
		"rust",
		"go",
		"java",
	]),
	/** Enable debug logging */
	debug: false,
	/** Maximum cache size */
	maxCacheSize: 1000,
	/** Pre-generate skeletons for impact-analyzer affected files */
	preGenerateForImpact: true,
};

type Config = typeof DEFAULT_CONFIG;

// ============ Cache Types ============

interface CacheEntry {
	content: string;
	timestamp: number;
	hash: string;
	accessCount: number;
	lastAccessed: number;
}

interface SkeletonCache {
	skeletons: Map<string, CacheEntry>;
	fileHashes: Map<string, string>;
}

// ============ Global State ============

const config: Config = { ...DEFAULT_CONFIG };
const skeletonCache: SkeletonCache = {
	skeletons: new Map(),
	fileHashes: new Map(),
};

// ============ Logging ============

function log(...args: unknown[]): void {
	if (config.debug) {
		console.log("[pi-smart-reader]", ...args);
	}
}

// ============ Cache Management ============

function calculateHash(content: string): string {
	return crypto.createHash("md5").update(content).digest("hex");
}

function isFileChanged(filePath: string, content: string): boolean {
	const newHash = calculateHash(content);
	const oldHash = skeletonCache.fileHashes.get(filePath);

	if (oldHash === newHash) {
		return false;
	}

	skeletonCache.fileHashes.set(filePath, newHash);
	return true;
}

function getCachedSkeleton(filePath: string, content: string): string | null {
	const cached = skeletonCache.skeletons.get(filePath);

	if (!cached) {
		return null;
	}

	// Check TTL
	if (Date.now() - cached.timestamp > config.cacheTTL) {
		skeletonCache.skeletons.delete(filePath);
		return null;
	}

	// Check if content changed
	if (!isFileChanged(filePath, content)) {
		// Update access stats
		cached.accessCount++;
		cached.lastAccessed = Date.now();
		return cached.content;
	}

	return null;
}

function setCachedSkeleton(
	filePath: string,
	content: string,
	skeleton: string,
): void {
	// Evict old entries if cache is full
	if (skeletonCache.skeletons.size >= config.maxCacheSize) {
		evictOldestEntries();
	}

	skeletonCache.skeletons.set(filePath, {
		content: skeleton,
		timestamp: Date.now(),
		hash: calculateHash(content),
		accessCount: 1,
		lastAccessed: Date.now(),
	});

	skeletonCache.fileHashes.set(filePath, calculateHash(content));
}

function evictOldestEntries(): void {
	const entries = Array.from(skeletonCache.skeletons.entries());
	entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

	// Remove oldest 10%
	const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
	for (let i = 0; i < toRemove; i++) {
		skeletonCache.skeletons.delete(entries[i][0]);
	}
}

function clearCache(): void {
	skeletonCache.skeletons.clear();
	skeletonCache.fileHashes.clear();
	log("Cache cleared");
}

// ============ Helper Functions ============

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

function shouldOptimize(source: string): boolean {
	const lines = source.split("\n");
	return lines.length > config.threshold;
}

function getLineCount(source: string): number {
	return source.split("\n").length;
}

// ============ Main Extension ============

export default async function (pi: ExtensionAPI) {
	const parser = new SmartParser();
	const initialized = await parser.initialize();

	if (!initialized) {
		console.error(
			"[pi-smart-reader] Failed to initialize parser. Passive mode disabled.",
		);
	}

	const skeletonEngine = new SkeletonEngine(parser);
	const symbolExtractor = new SymbolExtractor(parser);

	// ============ Passive Mode: Auto-Optimize ============

	// Auto-optimize large files on read
	pi.on("tool_result", async (event: any, ctx: any) => {
		if (!config.enabled || !initialized) return;

		try {
			const toolName = event?.toolName || event?.name;
			if (toolName !== "read") return;

			const content = event?.content || event?.result;
			if (!content || typeof content !== "string") return;

			const filePath = event?.path || event?.args?.path;
			if (!filePath) return;

			if (!shouldOptimize(content)) return;

			const language = getLanguage(filePath);
			if (!language || !config.languages.has(language)) return;

			// Generate skeleton (with caching)
			let skeleton = getCachedSkeleton(filePath, content);
			if (!skeleton) {
				skeleton = skeletonEngine.generateSkeleton(content);
				setCachedSkeleton(filePath, content, skeleton);
			}

			// Notify about optimization
			const originalLines = getLineCount(content);
			const skeletonLines = getLineCount(skeleton);
			const reduction = Math.round((1 - skeletonLines / originalLines) * 100);

			ctx.ui.notify(
				`Large file optimized: ${filePath} (${originalLines} → ${skeletonLines} lines, ${reduction}% reduction)`,
				"info",
			);

			// Store skeleton in context
			if (ctx.setContext) {
				ctx.setContext(`smart-reader:${filePath}`, {
					type: "skeleton",
					content: skeleton,
					originalSize: content.length,
					skeletonSize: skeleton.length,
					reduction: `${reduction}%`,
				});
			}
		} catch (err: any) {
			if (config.debug) {
				console.error("[pi-smart-reader] Passive mode error:", err.message);
			}
		}
	});

	// ============ Impact Analyzer Integration ============

	// Pre-generate skeletons for files affected by impact analysis
	pi.on("impact_detected", async (event: any, _ctx: any) => {
		if (!config.enabled || !initialized || !config.preGenerateForImpact) return;

		try {
			const { impact } = event;
			if (!impact?.affected?.length) return;

			// Pre-generate skeletons for top affected files
			const affectedFiles: string[] = impact.affected
				.slice(0, 10)
				.map((a: any) => a.file as string);

			for (const filePath of affectedFiles) {
				try {
					const content = readFileSync(filePath, "utf8");
					if (shouldOptimize(content)) {
						let skeleton = getCachedSkeleton(filePath, content);
						if (!skeleton) {
							skeleton = skeletonEngine.generateSkeleton(content);
							setCachedSkeleton(filePath, content, skeleton);
							log(`Pre-generated skeleton for affected file: ${filePath}`);
						}
					}
				} catch {
					// Skip unreadable files
				}
			}
		} catch (err: any) {
			if (config.debug) {
				console.error(
					"[pi-smart-reader] Impact integration error:",
					err.message,
				);
			}
		}
	});

	// ============ Context Optimization ============

	// Auto-optimize when context is getting full
	pi.on("context", async (_event: any, ctx: any) => {
		if (!config.enabled || !initialized) return;

		try {
			// Check context usage
			const usage = ctx.getContextUsage?.() || { percent: 0 };
			if (usage.percent < 70) return;

			// Find large files in context that could be optimized
			const largeFiles = findLargeFilesInContext(ctx);

			if (largeFiles.length > 0) {
				for (const file of largeFiles.slice(0, 3)) {
					try {
						const content = readFileSync(file.path, "utf8");
						if (shouldOptimize(content)) {
							let skeleton = getCachedSkeleton(file.path, content);
							if (!skeleton) {
								skeleton = skeletonEngine.generateSkeleton(content);
								setCachedSkeleton(file.path, content, skeleton);
							}

							// Replace in context
							if (ctx.setContext) {
								ctx.setContext(`smart-reader:${file.path}`, {
									type: "skeleton",
									content: skeleton,
									originalSize: content.length,
									skeletonSize: skeleton.length,
									reason: "context_optimization",
								});
							}
						}
					} catch {
						// Skip unreadable files
					}
				}

				ctx.ui.notify(
					`Context optimization: ${largeFiles.length} files optimized`,
					"info",
				);
			}
		} catch (err: any) {
			if (config.debug) {
				console.error(
					"[pi-smart-reader] Context optimization error:",
					err.message,
				);
			}
		}
	});

	function findLargeFilesInContext(
		ctx: any,
	): Array<{ path: string; size: number }> {
		// This is a heuristic - in practice, we'd need to check Pi's actual context
		const files: Array<{ path: string; size: number }> = [];

		// Check if ctx has a way to get current files
		if (ctx.getFilesInContext) {
			const contextFiles = ctx.getFilesInContext();
			for (const file of contextFiles) {
				if (file.path && file.size > config.threshold * 50) {
					// Rough estimate: 50 chars per line
					files.push({ path: file.path, size: file.size });
				}
			}
		}

		return files.sort((a, b) => b.size - a.size);
	}

	// ============ Active Tool: Manual Invocation ============

	pi.registerTool({
		name: "smart_read",
		label: "Smart Read",
		description:
			"Read a file structurally. Use 'skeleton' mode to see the API of a large file, or 'symbol' mode to extract a specific function body.",
		parameters: Type.Object({
			path: Type.String({ description: "Path to the file to read" }),
			options: Type.Object({
				mode: StringEnum(["skeleton", "symbol"] as const, {
					description: "Extraction mode",
				}),
				symbol: Type.Optional(
					Type.String({
						description:
							"The name of the symbol to extract (required for 'symbol' mode)",
					}),
				),
			}),
		}),
		execute: async (
			_toolCallId: string,
			params: any,
			_signal: AbortSignal | undefined,
			_onUpdate: any,
			_ctx: any,
		) => {
			const { path: filePath, options } = params;
			const mode = options?.mode;

			try {
				if (!mode) {
					return {
						content: [{ type: "text", text: "Error: options.mode is required." }],
						isError: true,
					};
				}

				if (!initialized) {
					return {
						content: [
							{
								type: "text",
								text: "Parser not initialized. Check if tree-sitter WASM files are available.",
							},
						],
						isError: true,
					};
				}

				const absolutePath = path.resolve(filePath);
				const source = readFileSync(absolutePath, "utf8");

				if (mode === "skeleton") {
					let skeleton = getCachedSkeleton(absolutePath, source);
					if (!skeleton) {
						skeleton = skeletonEngine.generateSkeleton(source);
						setCachedSkeleton(absolutePath, source, skeleton);
					}

					const originalLines = getLineCount(source);
					const skeletonLines = getLineCount(skeleton);
					const reduction = Math.round(
						(1 - skeletonLines / originalLines) * 100,
					);

					return {
						content: [{ type: "text", text: skeleton }],
						details: {
							mode: "skeleton",
							message: `Skeletal view generated (${originalLines} → ${skeletonLines} lines, ${reduction}% reduction).`,
						},
					};
				}

				if (mode === "symbol") {
					if (!options.symbol) {
						return {
							content: [
								{
									type: "text",
									text: "Symbol name is required for 'symbol' mode.",
								},
							],
							isError: true,
						};
					}

					const { content, relatedSymbols } = symbolExtractor.extractSymbol(
						source,
						options.symbol,
					);

					return {
						content: [{ type: "text", text: content }],
						details: {
							mode: "symbol",
							message: `Extracted symbol '${options.symbol}' and identified ${relatedSymbols.length} related dependencies.`,
							relatedSymbols,
						},
					};
				}

				return {
					content: [{ type: "text", text: `Unsupported mode: ${mode}` }],
					isError: true,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to smart-read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	});

	// ============ Configuration Command ============

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
						`Languages: ${Array.from(config.languages).join(", ")}`,
						`Cache size: ${skeletonCache.skeletons.size} entries`,
						`Pre-generate for impact: ${config.preGenerateForImpact ? "ON" : "OFF"}`,
					].join("\n");
					ctx.ui.notify(status, "info");
				} else if (action === "threshold" && parts[1]) {
					config.threshold = parseInt(parts[1], 10) || 300;
					ctx.ui.notify(
						`Threshold set to ${config.threshold} lines.`,
						"success",
					);
				} else if (action === "clear") {
					clearCache();
					ctx.ui.notify("Cache cleared.", "success");
				} else {
					ctx.ui.notify(
						"Usage: /smart-reader [on|off|status|threshold <lines>|clear]",
						"info",
					);
				}
			},
		},
	);

	// ============ Status Function ============

	function getStatus() {
		return {
			initialized,
			enabled: config.enabled,
			threshold: config.threshold,
			cacheSize: skeletonCache.skeletons.size,
			languages: Array.from(config.languages),
		};
	}

	// Expose status for other tools via the module's named export
	updateSmartReaderState({ getStatus, clearCache });

	// ============ Session Lifecycle ============

	pi.on("session_start", async () => {
		log("Session started, smart-reader ready (passive mode)");
	});

	pi.on("session_shutdown", async () => {
		log("Session ending, cache stats:", {
			size: skeletonCache.skeletons.size,
		});
	});

	log("Extension loaded (passive mode, always on)");
}

// ============ External API for other extensions ============

let _getStatus: (() => any) | null = null;
let _clearCache: (() => void) | null = null;

/** Internal: update the shared state (called from the extension factory) */
export function updateSmartReaderState(state: {
	getStatus: () => any;
	clearCache: () => void;
}): void {
	_getStatus = state.getStatus;
	_clearCache = state.clearCache;
}

/** Named export for external access by other Pi extensions */
export function smartReader() {
	return {
		getStatus: () => (_getStatus ? _getStatus() : null),
		clearCache: () => {
			if (_clearCache) _clearCache();
		},
	};
}
