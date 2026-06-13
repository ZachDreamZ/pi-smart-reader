# Implementation Tasks: pi-smart-reader

## Phase 1: Foundation
- [ ] Initialize project with `package.json` and `tsconfig.json`.
- [ ] Setup `web-tree-sitter` WASM loader and language bindings.

## Phase 2: The Skeleton Engine
- [ ] Implement Tree-sitter queries to find function/class signatures.
- [ ] Implement the logic to strip function bodies and replace with `// ...`.
- [ ] Create a test suite with large TS/JS files to verify skeletal output.

## Phase 3: Precision Extraction
- [ ] Implement symbol lookup logic (mapping name $\to$ byte range).
- [ ] Implement the content slicing mechanism.
- [ ] Implement internal dependency scanning (finding calls within a function).

## Phase 4: Pi Tool Integration
- [ ] Define the `smart_read` tool schema.
- [ ] Implement the `smart_read` handler in the extension.
- [ ] Integrate the logic from Phase 2 and 3 into the handler.

## Phase 5: Benchmarking & Optimization
- [ ] Compare token usage: `read` vs `smart_read(skeleton)` vs `smart_read(symbol)`.
- [ ] Optimize AST queries for speed.
- [ ] Handle edge cases (anonymous functions, complex nested classes).

## Phase 6: Release
- [ ] Write professional README.md.
- [ ] Publish to npm and GitHub.
