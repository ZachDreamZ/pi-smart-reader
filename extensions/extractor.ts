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
		const root = tree.rootNode;

		const targetNode = this.findSymbolNode(root, symbolName);

		if (!targetNode) {
			throw new Error(`Symbol '${symbolName}' not found in file.`);
		}

		const content = source.slice(targetNode.startIndex, targetNode.endIndex);
		const related = this.findRelatedSymbols(targetNode, source);

		return {
			content,
			relatedSymbols: related,
		};
	}

	private findSymbolNode(node: Node, name: string): Node | null {
		const findIdentifierNode = (n: Node): Node | null => {
			if (n.type === "identifier" || n.type === "property_identifier") {
				if (n.text === name) {
					console.log(`Found identifier ${name} at ${n.startIndex}`);
					return n;
				}
			}
			for (const child of n.namedChildren) {
				const found = findIdentifierNode(child);
				if (found) return found;
			}
			return null;
		};

		const idNode = findIdentifierNode(node);
		if (!idNode) {
			console.log(`Identifier ${name} not found in AST.`);
			return null;
		}

		let current: Node | null = idNode;
		while (current) {
			console.log(`Climbing: ${current.type}`);
			if (
				current.type === "function_declaration" ||
				current.type === "method_definition" ||
				current.type === "variable_declarator" ||
				current.type === "class_declaration"
			) {
				console.log(`Found symbol container: ${current.type}`);
				return current;
			}
			current = current.parent;
		}

		console.log(`Reached root without finding a symbol container for ${name}.`);
		return null;
	}

	private findRelatedSymbols(node: Node, _source: string): string[] {
		const related: string[] = [];

		// Scan the subtree for call expressions
		const walk = (n: Node) => {
			if (n.type === "call_expression") {
				const call = n.namedChildren.find((c) => c.type === "identifier");
				if (call) {
					related.push(call.text);
				}
			}
			for (const child of n.namedChildren) {
				walk(child);
			}
		};

		walk(node);
		return [...new Set(related)]; // Unique only
	}
}
