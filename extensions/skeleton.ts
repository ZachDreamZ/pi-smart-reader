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

		let skeleton = "";
		const lines = source.split("\\n");

		const walkAndLog = (node: any, depth = 0) => {
			if (node.text.includes("login")) {
				console.log(`Depth ${depth} | Type: ${node.type} | Text: ${node.text}`);
			}
			for (const child of node.namedChildren) {
				walkAndLog(child, depth + 1);
			}
		};
		walkAndLog(root);

		// We iterate through the top-level named children
		for (const node of root.namedChildren) {
			if (this.isSignatureNode(node)) {
				skeleton += this.extractSignature(node, lines) + "\\n";
			} else if (node.type === "comment") {
				skeleton += node.text + "\\n";
			}
		}

		return skeleton || "// No structural symbols found in this file.";
	}

	private isSignatureNode(node: Node): boolean {
		const types = [
			"function_declaration",
			"method_definition",
			"class_declaration",
			"variable_declaration",
		];
		return types.includes(node.type);
	}

	private extractSignature(node: Node, lines: string[]): string {
		const startLine = node.startPosition.row;
		const endLine = node.endPosition.row;

		// For signatures, we want the line where the name/params are,
		// but we want to stop before the opening brace '{'
		let result = "";
		for (let i = startLine; i <= endLine; i++) {
			const line = lines[i] || "";
			if (line.includes("{")) {
				result += line.split("{")[0] + " { // ... implementation";
				break;
			}
			result += line + "\\n";
		}

		// Trim trailing newlines
		return result.trimEnd();
	}
}
