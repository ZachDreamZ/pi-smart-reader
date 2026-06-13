import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";

export interface ParserConfig {
	// Not strictly needed for native tree-sitter but kept for API compatibility
	wasmPath?: string;
	languagePath?: string;
}

export class SmartParser {
	private parser: Parser | null = null;
	private language: any | null = null;

	/**
	 * Initializes the tree-sitter parser with TypeScript support.
	 */
	public async initialize(_config?: ParserConfig): Promise<void> {
		try {
			this.parser = new Parser();
			this.language = TypeScript.typescript;
			this.parser.setLanguage(this.language);
		} catch (error) {
			console.error("[pi-smart-reader] Initialization failed:", error);
			throw new Error(`Failed to initialize tree-sitter: ${error}`);
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

	public getLanguage() {
		return this.language;
	}

	public isInitialized(): boolean {
		return this.parser !== null && this.language !== null;
	}
}
