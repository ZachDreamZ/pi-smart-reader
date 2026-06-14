declare module 'web-tree-sitter' {
	export default class Parser {
		static init(options: { wasmPath: string }): Promise<void>;
		constructor();
		setLanguage(language: any): void;
		parse(source: string): Tree;

		static Language: {
			load(path: string): Promise<any>;
		};
	}

	export interface Tree {
		rootNode: Node;
	}

	export interface Node {
		id: number;
		type: string;
		text: string;
		startPosition: { row: number; column: number };
		endPosition: { row: number; column: number };
		startIndex: number;
		endIndex: number;
		children: Node[];
		parent: Node | null;
		namedChildren: Node[];
	}
}
