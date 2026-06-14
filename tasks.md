# Implementation Tasks: pi-smart-reader

## Phase 1: Foundation
- [x] Initialize project with `package.json` and `tsconfig.json`.
- [x] Setup `web-tree-sitter` WASM loader and language bindings.

## Phase 2: The Skeleton Engine
- [x] Implement Tree-sitter queries to find function/class signatures.
- [x] Implement the logic to strip function bodies and replace with `// ...`.
- [x] Create a test suite with large TS/JS files to verify skeletal output.

## Phase 3: Precision Extraction
- [x] Implement symbol lookup logic (mapping name $\to$ byte range).
- [x] Implement the content slicing mechanism.
- [x] Implement internal dependency scanning (finding calls within a function).

## Phase 4: Pi Tool Integration
- [x] Define the `smart_read` tool schema.
- [x] Implement the `smart_read` handler in the extension.
- [x] Integrate the logic from Phase 2 and 3 into the handler.

## Phase 5: Benchmarking & Optimization
- [ ] Compare token usage: `read` vs `smart_read(skeleton)` vs `smart_read(symbol)`.
- [ ] Optimize AST queries for speed.
- [x] Handle edge cases (anonymous functions, complex nested classes).

## Phase 6: Release
- [x] Write professional README.md.
- [x] Publish to npm and GitHub.

---

## Post-Release: Audit & Stability (v0.2.0)
- [x] Full multi-agent audit (Null safety, Logic, Functional, Pi Integration, Quality)
- [x] Fix Critical: Byte vs Character slicing bug in SymbolExtractor
- [x] Fix Critical: Newline split bug in SkeletonEngine
- [x] Fix High: tsconfig rootDir and include paths
- [x] Fix High: Sandbox `fs` usage and error handling
- [x] Fix High: Startup model detection ordering
- [x] Fix Medium: Compression ratio and unclosed backticks
- [x] Integration: cross-tool workflow with `pi-impact-analyzer`
- [x] Comprehensive Jest test suite (53 tests passing)
