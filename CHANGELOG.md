# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-06-16

### Added
- **Passive by Default** — Always-on operation with no configuration required. Works out-of-the-box.
- **Impact Analyzer Integration** — Listens to `impact_detected` events and pre-generates skeletons for affected files.
- **Context Optimization** — Auto-optimizes when context usage exceeds 70%.
- **Intelligent Caching** — File hashing + LRU eviction for optimal cache management.
- **5-Minute Cache TTL** — Longer cache lifetime (300,000ms) for better performance.
- **Max Cache Size** — Configurable cache limit (1000 entries) with automatic eviction.
- **Session Lifecycle** — Proper initialization and cleanup on session start/end.
- **Configuration API** — `updateConfig()`, `getConfig()`, `clearCache()` for programmatic control.

### Changed
- **Default Threshold** — Lowered from 500 to 300 lines for better optimization.
- **Cache TTL** — Increased from 60s to 5 minutes for fresh skeletons.
- **Language Support** — Added Go and Java to supported languages.
- **Error Handling** — Returns graceful results instead of throwing.
- **Performance** — Optimized skeleton generation with intelligent caching.

### Fixed
- **Type Errors** — Fixed `unknown` type issues in impact integration.
- **Duplicate Properties** — Fixed serialization issues in cache saving.
- **Unused Parameters** — Added underscore prefix for unused event handler parameters.

## [0.3.0] - 2026-06-16

### Added
- **Passive Mode**: Smart Reader now works automatically in the background without explicit invocation.
- **Event Integration**: Hooks into Pi's `tool_result` events to intercept file reads.
- **File Size Threshold**: Only optimizes files larger than 500 lines (configurable).
- **Caching**: Parsed skeletons are cached for 60 seconds to avoid redundant work.
- **Language Detection**: Automatically detects TypeScript, JavaScript, Python, Rust from file extensions.
- **Configuration Command**: `/smart-reader` command to enable/disable passive mode and adjust settings.
- **Error Recovery**: Graceful degradation if parser initialization fails.
- **Debug Logging**: Optional logging via `DEBUG=1` or `PI_DEBUG=1` environment variables.

### Fixed
- **Deprecated Buffer.slice()**: Replaced with `buffer.subarray()` for Node.js compatibility.
- **Unused Variable**: Removed unused `symbolNodeTypes` variable in extractor.
- **Parser Initialization**: Now returns boolean instead of throwing, allowing graceful fallback.

### Changed
- **Version**: Bumped to 0.3.0 for passive mode feature.
- **Architecture**: Tool now works both actively (manual invocation) and passively (automatic).

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
