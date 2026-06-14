import type { SmartParser } from "./parser";
import type { Node } from "web-tree-sitter";

export class SkeletonEngine {
	constructor(private parser: SmartParser) {}

	/**
	 * Generates a skeletal view of the source code.
	 * Keeps signatures of functions and classes, but strips bodies.
	 */
	public generateSkeleton(source: string): string {
		const tree = this.parser.parse(source);
		const root = tree.rootNode;
		const lines = source.split("\n");

		const signatures: string[] = [];
		this.walkAndExtract(root, lines, signatures, 0);

		return (
			signatures.join("\n\n") || "// No structural symbols found in this file."
		);
	}

	private walkAndExtract(
		node: Node,
		lines: string[],
		signatures: string[],
		depth: number,
	): void {
		if (this.isSignatureNode(node)) {
			signatures.push(this.extractSignature(node, lines, depth));
		}

		for (const child of node.namedChildren) {
			this.walkAndExtract(child, lines, signatures, depth + 1);
		}
	}

	private isSignatureNode(node: Node): boolean {
		if (
			node.type === "function_declaration" ||
			node.type === "method_definition" ||
			node.type === "generator_function_declaration" ||
			node.type === "class_declaration"
		) {
			return true;
		}

		if (node.type === "lexical_declaration") {
			return node.namedChildren.some((child) => {
				if (child.type !== "variable_declarator") return false;
				return child.namedChildren.some((grandchild) => {
					return (
						grandchild.type === "arrow_function" ||
						grandchild.type === "function"
					);
				});
			});
		}

		return false;
	}

	private extractSignature(node: Node, lines: string[], depth: number): string {
		const indent = "  ".repeat(depth);

		// Find the block node recursively to handle nested declarations (e.g. lexical_declaration -> variable_declarator -> arrow_function -> block)
		const findBlock = (n: Node): Node | null => {
			if (n.type === "block") return n;
			for (const child of n.namedChildren) {
				const found = findBlock(child);
				if (found) return found;
			}
			return null;
		};

		const block = findBlock(node);

		if (block) {
			const fullText = lines.join("\n");
			const signatureText = fullText
				.slice(node.startIndex, block.startIndex)
				.trimEnd();
			return `${indent}${signatureText} { // ... implementation`;
		}

		const startLine = node.startPosition.row;
		const endLine = node.endPosition.row;
		const text = lines
			.slice(startLine, endLine + 1)
			.join("\n")
			.trimEnd();
		return `${indent}${text}`;
	}
}
