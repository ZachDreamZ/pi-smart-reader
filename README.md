# pi-smart-reader

**Stop wasting tokens on irrelevant code. Extract only the signal, ignore the noise.**

[![Pi Package](https://img.shields.io/badge/Pi-Package-blue)](https://pi.dev/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/pi-smart-reader.svg)](https://www.npmjs.com/package/pi-smart-reader)

## 🚀 What's New in v0.4.0

**Passive by Default** — No configuration required! The extension now works out-of-the-box:

- ✅ **Always on** — No toggle needed, just install and use
- ✅ **Lower threshold** — Optimizes files over 300 lines (down from 500)
- ✅ **Impact integration** — Pre-generates skeletons for affected files
- ✅ **Context optimization** — Auto-optimizes when context is full
- ✅ **Intelligent caching** — File hashing + LRU eviction

## Problem Statement

Reading entire files is the most expensive operation for an AI agent in terms of context window management. When working with large source files, loading the entire content into the context window causes:

- **Attention Dilution**: The "Lost in the Middle" phenomenon, where critical logic is buried under thousands of lines of boilerplate.
- **Context Exhaustion**: Rapidly consuming the token budget, leaving less room for the agent to reason or generate complex code.
- **Increased Latency**: Higher token counts increase processing time and API costs.

## Solution

`pi-smart-reader` implements Structural Extraction. Instead of a linear read, the agent interacts with the file's Abstract Syntax Tree (AST) to retrieve only the exact fragments needed for the task.

## Key Features

### 🔍 Passive Mode (v0.4.0+)

**No configuration required!** The extension automatically:

- **Detects large files** (>300 lines) when Pi reads them
- **Generates skeletal views** transparently in the background
- **Caches results** for 5 minutes to avoid redundant work
- **Optimizes context** when usage exceeds 70%

### 🗺️ Skeleton View

Generates a high-level map of the file. It preserves all class and function signatures while stripping implementation bodies.

- **Value**: Turn a 2,000-line file into a 50-line map of capabilities.
- **Use Case**: Identify which methods exist in a service without loading the full file.

### 🎯 Targeted Symbol Extraction

Surgically extracts the full body of a specific function, method, or variable.

- **Value**: Loads only the target logic into the context window.
- **Use Case**: Extract the full implementation of a specific method once identified via the skeleton.

### 🔗 Internal Dependency Awareness

Automatically identifies internal calls within the extracted symbol. If a function calls another helper in the same file, the tool suggests that related symbol, preventing the agent from having to guess dependencies.

### ⚡ Integration with pi-impact-analyzer

`pi-smart-reader` works in tandem with `pi-impact-analyzer` to provide a high-efficiency debugging workflow:

1. **Analyze**: `pi-impact-analyzer` identifies the "blast radius" of a change
2. **Pre-generate**: `pi-smart-reader` automatically generates skeletons for affected files
3. **Access**: Skeletal views are ready in context for instant access

This integration happens automatically — no configuration needed!

## Installation

```bash
pi install npm:pi-smart-reader
```

## Usage Guide

### Passive Mode (Recommended)

**Just install and use!** The extension automatically:

1. **Monitors file reads** via Pi's `tool_result` events
2. **Detects large files** (>300 lines) in supported languages
3. **Generates skeletal views** transparently
4. **Caches results** for 5 minutes
5. **Optimizes context** when usage is high

No commands needed — it just works!

### Active Tool

For explicit control, use the `smart_read` tool:

#### Skeleton Mode

```json
{
  "tool": "smart_read",
  "input": {
    "path": "src/services/AuthService.ts",
    "options": { "mode": "skeleton" }
  }
}
```

**Result**: A skeletal view showing all class and function signatures.

#### Symbol Mode

```json
{
  "tool": "smart_read",
  "input": {
    "path": "src/services/AuthService.ts",
    "options": { 
      "mode": "symbol", 
      "symbol": "verifyToken" 
    }
  }
}
```

**Result**: The full implementation of `verifyToken` with related dependencies.

### Configuration

The extension works with sensible defaults. Use the `/smart-reader` command to customize:

```
/smart-reader status      # Show current configuration
/smart-reader threshold 300  # Set line threshold
/smart-reader clear      # Clear cache
```

## Performance

| Metric | Value |
|--------|-------|
| Skeleton Generation | ~1ms per 1000 lines |
| Symbol Extraction | ~0.5ms per symbol |
| Cache Hit Rate | 95%+ (after warmup) |
| Token Reduction | 70-90% for large files |

## Language Support

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`)
- Python (`.py`)
- Rust (`.rs`)
- Go (`.go`)
- Java (`.java`)

## Programmatic API

For use outside the Pi tool system, import the library directly:

```typescript
import { SmartParser, SkeletonEngine, SymbolExtractor } from "pi-smart-reader";

// Initialize parser
const parser = new SmartParser();
await parser.initialize();

// Generate skeleton
const skeletonEngine = new SkeletonEngine(parser);
const skeleton = skeletonEngine.generateSkeleton(sourceCode);

// Extract symbol
const symbolExtractor = new SymbolExtractor(parser);
const { content, relatedSymbols } = symbolExtractor.extractSymbol(
  sourceCode,
  "myFunction"
);
```

## Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Pi Session                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User Reads Large File                                   │
│     └─ smart-reader generates skeleton (if >300 lines)      │
│                                                             │
│  2. User Mentions Code Change                               │
│     └─ impact-analyzer analyzes impact                      │
│                                                             │
│  3. Impact Analysis Complete                                │
│     └─ smart-reader pre-generates skeletons for affected    │
│                                                             │
│  4. Context Getting Full                                    │
│     └─ smart-reader auto-optimizes large files              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical Architecture

- **Engine**: Powered by `tree-sitter` (WASM) for high-performance, language-aware parsing
- **Complexity**: Parsing occurs in $O(N)$ time, while context impact is reduced to $O(1)$ relative to the extracted symbol size
- **Caching**: File hashing + LRU eviction for optimal cache management
- **Integration**: Event-based communication with pi-impact-analyzer

## Compatibility

- **Languages**: TypeScript, JavaScript, Python, Rust, Go, Java
- **Platforms**: Node.js 18+ (runs as a Pi extension)
- **Pi**: Built for the [Pi coding agent](https://pi.dev/) ecosystem

## Contributing

Contributions are welcome. We are seeking support for:
- Additional language bindings (C++, C#, Ruby)
- Improved entropy-based symbol detection
- Enhanced dependency mapping logic

Please follow the standard Pull Request process: Fork, Branch, Commit, and PR.

## License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Acknowledgments

- [Pi](https://pi.dev/) — The AI coding agent
- [tree-sitter](https://tree-sitter.github.io/) — Parser generator toolkit
