import Parser from "web-tree-sitter";

export interface ParserConfig {
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
			await Parser.init({
				wasmPath: _config?.wasmPath || "./wasm/tree-sitter.wasm",
			});
			this.parser = new Parser();
			const lang = await Parser.Language.load(
				_config?.languagePath || "./wasm/tree-sitter-typescript.wasm",
			);
			this.parser.setLanguage(lang);
			this.language = lang;
		} catch (error) {
			console.error("[pi-smart-reader] Initialization failed:", error);
			throw new Error("Failed to initialize tree-sitter", { cause: error });
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
