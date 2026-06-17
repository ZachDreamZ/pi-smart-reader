import Parser from "web-tree-sitter";
import { readFileSync } from "fs";
import path from "path";

/**
 * Resolve path to a WASM file relative to this package.
 * Tries both dist/extensions/ (built) and extensions/ (ts-jest) modes.
 */
function resolveWasmPath(wasmFile: string): string {
	const locations = [
		path.join(__dirname, "..", "..", "wasm", wasmFile),
		path.join(__dirname, "..", "wasm", wasmFile),
	];
	for (const loc of locations) {
		try {
			readFileSync(loc);
			return loc;
		} catch {
		}
	}
	return locations[0];
}

export interface ParserConfig {
	wasmPath?: string;
	languagePath?: string;
}

export class SmartParser {
	private parser: Parser | null = null;
	private language: any | null = null;

	/**
	 * Initializes the tree-sitter parser with TypeScript support.
	 * @returns true if initialization succeeded, false otherwise
	 */
	public async initialize(_config?: ParserConfig): Promise<boolean> {
		try {
			await Parser.init({});
			this.parser = new Parser();

			// Resolve language WASM file
			const wasmPath =
				_config?.languagePath ||
				resolveWasmPath("tree-sitter-typescript.wasm");
			const wasmBytes = readFileSync(wasmPath);

			const lang = await (Parser as any).Language.load(wasmBytes);
			this.parser.setLanguage(lang);
			this.language = lang;
			return true;
		} catch (error) {
			console.error("[pi-smart-reader] Initialization failed:", error);
			return false;
		}
	}

	/**
	 * Parses the source code into an AST.
	 */
	public parse(source: string) {
		if (!this.parser) {
			throw new Error("Parser not initialized. Call initialize() first.");
		}
		return this.parser.parse(source);
	}

	public getLanguage(): any {
		return this.language;
	}

	public isInitialized(): boolean {
		return this.parser !== null && this.language !== null;
	}
}
