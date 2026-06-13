# Technical Specification: pi-smart-reader

## 1. Architecture Overview
`pi-smart-reader` is a Pi extension that provides a specialized tool `smart_read` which leverages AST parsing via `web-tree-sitter` to selectively extract code fragments.

## 2. Detection & Extraction Logic

### A. The Skeleton Engine
The engine uses Tree-sitter queries to identify "headers" of code blocks.
**Query Logic (TS/JS)**:
- Find all `function_declaration`, `method_definition`, and `variable_declaration` (with arrow functions).
- Extract the name and the parameter list.
- Replace the body (`{ ... }`) with a comment `// ... implementation`.

### B. Symbol Extraction
When a `symbol` name is provided:
1. The AST is scanned for a node whose identifier matches the symbol name.
2. The `start` and `end` byte offsets of that node are identified.
3. The original file content is sliced using these offsets.

### C. Dependency Scanning
While extracting a symbol body:
1. The body is parsed for `call_expression` nodes.
2. The identifiers of these calls are collected.
3. Any identifiers that match other symbols in the same file are returned as `relatedSymbols`.

## 3. Tool API Design

**Tool Name**: `smart_read`

**Input Schema**:
```json
{
  "path": "string",
  "options": {
    "mode": "skeleton" | "symbol",
    "symbol": "string (optional)",
    "includeDependencies": "boolean (optional)"
  }
}
```

**Output Format**:
- `mode: "skeleton"` $\to$ Returns the skeletal version of the file.
- `mode: "symbol"` $\to$ Returns the code fragment and a list of related symbols.

## 4. Implementation Details

### A. Parser Strategy
Use `web-tree-sitter` for WASM-based parsing.
- **Language**: `tree-sitter-typescript` (covers JS and TS).
- **Loading**: Load the WASM binary on extension startup.

### B. Integration with Pi
The extension registers `smart_read` as a custom tool via `pi.registerTool()`.

## 5. Performance & Complexity
- **Time Complexity**: $O(N)$ to parse the file, where $N$ is file size.
- **Space Complexity**: $O(T)$ where $T$ is the size of the extracted fragment.
- **Token Impact**: Moves from $O(FileSize)$ to $O(SymbolSize)$.
