/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "web-tree-sitter" {
	export default class Parser {
		static init(options: { wasmPath?: string }): Promise<void>;
		constructor();
		setLanguage(language: any): void;
		parse(source: string): Tree;
		parse(source: string, oldTree?: Tree): Tree;

		static Language: {
			load(path: string): Promise<any>;
		};

		reset(): void;
		getLanguage(): any;
	}

	export interface Tree {
		rootNode: Node;
		language: any;
		edit(edit: Edit): void;
		copy(): Tree;
		delete(): void;
		getChangedRanges(other: Tree): Range[];
	}

	export interface Node {
		id: number;
		type: string;
		text: string;
		startPosition: Point;
		endPosition: Point;
		startIndex: number;
		endIndex: number;
		children: Node[];
		parent: Node | null;
		namedChildren: Node[];
		childCount: number;
		namedChildCount: number;
		firstChild: Node | null;
		lastChild: Node | null;
		firstNamedChild: Node | null;
		lastNamedChild: Node | null;
		nextSibling: Node | null;
		previousSibling: Node | null;
		nextNamedSibling: Node | null;
		previousNamedSibling: Node | null;
		isNamed: boolean;
		isMissing: boolean;
		isError: boolean;
		isExtra: boolean;
		hasChanges: boolean;
		hasError: boolean;
		descendantCount: number;
		child(index: number): Node | null;
		namedChild(index: number): Node | null;
		childForFieldName(fieldName: string): Node | null;
		descendantsOfType(
			type: string | string[],
			start?: Point,
			end?: Point,
		): Node[];
		descendantForIndex(start: number, end?: number): Node;
		namedDescendantForIndex(start: number, end?: number): Node;
		descendantForPosition(point: Point): Node;
		namedDescendantForPosition(point: Point): Node;
	}

	export interface Point {
		row: number;
		column: number;
	}

	export interface Range {
		startIndex: number;
		endIndex: number;
		startPosition: Point;
		endPosition: Point;
	}

	export interface Edit {
		startIndex: number;
		oldEndIndex: number;
		newEndIndex: number;
		startPosition: Point;
		oldEndPosition: Point;
		newEndPosition: Point;
	}

	export interface Match {
		pattern: number;
		captures: Capture[];
	}

	export interface Capture {
		name: string;
		node: Node;
	}
}
