import type { SmartParser } from "./parser";
import type { Node } from "web-tree-sitter";

export class SymbolExtractor {
	constructor(private parser: SmartParser) {}

	/**
	 * Extracts the full body of a specific symbol by name.
	 */
	public extractSymbol(
		source: string,
		symbolName: string,
	): { content: string; relatedSymbols: string[] } {
		const tree = this.parser.parse(source);
		if (!tree) throw new Error("Failed to parse source code.");
		const root = tree.rootNode;
		if (!root) throw new Error("Parsed tree has no root node.");

		const targetNode = this.findSymbolNode(root, symbolName);

		if (!targetNode) {
			throw new Error(`Symbol '${symbolName}' not found in file.`);
		}

		// Tree-sitter provides byte offsets.
		// To safely slice a UTF-8 string in JS, we convert to Buffer first.
		const buffer = Buffer.from(source, "utf8");
		const content = buffer
			.slice(targetNode.startIndex, targetNode.endIndex)
			.toString("utf8");
		const related = this.findRelatedSymbols(targetNode);

		return {
			content,
			relatedSymbols: related,
		};
	}

	private findSymbolNode(node: Node, name: string): Node | null {
		const symbolNodeTypes = new Set([
			"function_declaration",
			"method_definition",
			"generator_function_declaration",
			"arrow_function",
			"class_declaration",
		]);

		const walk = (n: Node): Node | null => {
			if (this.isSymbolNodeWithName(n, name)) {
				return this.getSymbolContainer(n);
			}

			for (const child of n.namedChildren) {
				const found = walk(child);
				if (found) return found;
			}

			return null;
		};

		return walk(node);
	}

	private isSymbolNodeWithName(node: Node, name: string): boolean {
		if (node.type === "function_declaration") {
			return this.nodeHasIdentifier(node, name);
		}

		if (node.type === "method_definition") {
			return this.nodeHasIdentifier(node, name);
		}

		if (node.type === "generator_function_declaration") {
			return this.nodeHasIdentifier(node, name);
		}

		if (node.type === "class_declaration") {
			return this.nodeHasIdentifier(node, name);
		}

		if (node.type === "arrow_function") {
			return this.arrowFunctionHasName(node, name);
		}

		return false;
	}

	private nodeHasIdentifier(node: Node, name: string): boolean {
		const walk = (n: Node): boolean => {
			if (
				(n.type === "identifier" || n.type === "property_identifier") &&
				n.text === name
			) {
				return true;
			}

			for (const child of n.namedChildren) {
				if (walk(child)) return true;
			}

			return false;
		};

		return walk(node);
	}

	private arrowFunctionHasName(node: Node, name: string): boolean {
		const parent = node.parent;
		if (!parent || parent.type !== "variable_declarator") {
			return false;
		}

		return this.nodeHasIdentifier(parent, name);
	}

	private getSymbolContainer(node: Node): Node {
		if (node.type === "arrow_function") {
			const parent = node.parent;
			if (parent?.type === "variable_declarator") {
				const grandparent = parent.parent;
				if (grandparent?.type === "lexical_declaration") {
					return grandparent;
				}
				return parent;
			}
		}

		return node;
	}

	private findRelatedSymbols(node: Node): string[] {
		const related: string[] = [];
		const seen = new Set<string>();

		const walk = (n: Node) => {
			if (n.type === "call_expression") {
				this.extractCallNames(n, related, seen);
			}

			for (const child of n.namedChildren) {
				walk(child);
			}
		};

		walk(node);
		return related;
	}

	private extractCallNames(
		node: Node,
		related: string[],
		seen: Set<string>,
	): void {
		const callee = node.namedChildren[0];
		if (!callee) return;

		const names = this.extractIdentifierNames(callee);
		for (const name of names) {
			if (!seen.has(name)) {
				seen.add(name);
				related.push(name);
			}
		}
	}

	private extractIdentifierNames(node: Node): string[] {
		const names: string[] = [];

		if (node.type === "identifier" || node.type === "property_identifier") {
			names.push(node.text);
		}

		for (const child of node.namedChildren) {
			names.push(...this.extractIdentifierNames(child));
		}

		return names;
	}
}
