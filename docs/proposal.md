# Proposal: pi-smart-reader

## 1. Problem Statement
When working with large files, AI agents typically use the `read` tool, which loads the entire file content into the conversation context. This leads to several critical issues:
- **Token Exhaustion**: Large files quickly consume the context window, leaving less room for reasoning and output.
- **Attention Dilution**: The "Lost in the Middle" phenomenon occurs where the model overlooks critical details buried in noise.
- **Cost**: Higher token usage increases API costs.

## 2. Goal
Create a Pi extension that replaces "blind" file reading with **Structural Extraction**. The agent should be able to understand the "shape" of a file without reading its entire content, and then surgically extract only the relevant fragments of code needed for the task.

## 3. Core Features
### A. Skeleton View (`mode: "skeleton"`)
Instead of the full file, the sentinel generates a "Skeletal" version. It strips all implementation details (function bodies, class internals) and preserves only the signatures.
- **Example**: A 2,000-line file becomes a 50-line list of exported functions and classes.

### B. Targeted Symbol Extraction (`mode: "symbol"`)
Allows the agent to request a specific function, method, or variable by name.
- **Precision**: Using AST (Abstract Syntax Tree) parsing, the tool extracts only the exact range of the requested symbol.
- **Efficiency**: Only the relevant code is loaded into the context.

### C. Dependency Mapping
When extracting a symbol, the tool scans for internal calls to other functions in the same file and suggests those related symbols to the agent.

## 4. Success Criteria
- **Token Reduction**: At least a 70-90% reduction in tokens used when analyzing large files.
- **Accuracy**: The agent must be able to identify the correct function to modify using only the Skeleton view.
- **Language Support**: Initial support for TypeScript and JavaScript using `web-tree-sitter`.

## 5. Non-Goals
- This is not a replacement for `read` when the entire file is actually needed (e.g., for a full refactor).
- It will not perform cross-file dependency resolution (that is the role of LSP).
