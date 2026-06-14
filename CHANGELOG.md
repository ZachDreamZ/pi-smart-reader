# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-14

### Added
- **Comprehensive Test Suite**: Added Jest + ts-jest with 50+ tests covering symbol extraction, skeletal views, and edge cases.
- **Pi-Impact-Analyzer Integration**: Added cross-tool workflow suggestions in impact reports.

### Fixed
- **Critical: Byte vs Char Slicing**: Fixed `SymbolExtractor` to use Buffer slicing for UTF-8 accuracy, preventing corrupted text with Unicode.
- **Critical: Newline Splitting**: Fixed `SkeletonEngine` to split on actual newlines instead of literal `\\n` characters.
- **Build Issues**: Fixed `tsconfig.json` rootDir and include paths to enable successful compilation.
- **Sandbox Compatibility**: Wrapped `fs.readFileSync` with `path.resolve` and added robust error handling for Pi runtime sandbox.
- **Skeletal View logic**: Updated `extractSignature` to use AST node offsets instead of string splitting, correctly handling destructuring in parameters.
- **Null Safety**: Added guards for `tree`, `rootNode`, and `namedChildren` throughout the engine.
- **Regex Accuracy**: Added `\b` boundaries to all internal patterns to prevent false positives.

### Changed
- **Skeletal View**: Now recursively walks the AST to find nested classes and methods.
- **WASM Loading**: Defaulted to local WASM files in `./wasm/` for stability.

## [0.1.8] - 2026-06-14
Initial release.
