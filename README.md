# pi-smart-reader

**Stop wasting tokens on irrelevant code. Extract only the signal, ignore the noise.**

[![Pi Package](https://img.shields.io/badge/Pi-Package-blue)](https://pi.dev/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/pi-smart-reader.svg)](https://www.npmjs.com/package/pi-smart-reader)

## Problem Statement

Reading entire files is the most expensive operation for an AI agent in terms of context window management. When working with large source files, loading the entire content into the context window causes:

- **Attention Dilution**: The "Lost in the Middle" phenomenon, where critical logic is buried under thousands of lines of boilerplate.
- **Context Exhaustion**: Rapidly consuming the token budget, leaving less room for the agent to reason or generate complex code.
- **Increased Latency**: Higher token counts increase processing time and API costs.

## Solution

`pi-smart-reader` implements Structural Extraction. Instead of a linear read, the agent interacts with the file's Abstract Syntax Tree (AST) to retrieve only the exact fragments needed for the task.

## Key Features

### Skeleton View
Generates a high-level map of the file. It preserves all class and function signatures while stripping implementation bodies.
- **Value**: Turn a 2,000-line file into a 50-line map of capabilities.
- **Use Case**: Identify which methods exist in a service without loading the full file.

### Targeted Symbol Extraction
Surgically extracts the full body of a specific function, method, or variable.
- **Value**: Loads only the target logic into the context window.
- **Use Case**: Extract the full implementation of a specific method once identified via the skeleton.

### Internal Dependency Awareness
Automatically identifies internal calls within the extracted symbol. If a function calls another helper in the same file, the tool suggests that related symbol, preventing the agent from having to guess dependencies.

### ⚡ Integration with pi-impact-analyzer
`pi-smart-reader` works in tandem with `pi-impact-analyzer` to provide a high-efficiency debugging workflow:
1. **Analyze**: Use `impact_analyze` to identify the "blast radius" of a change.
2. **Map**: Use `smart_read` in `skeleton` mode to see the structure of affected files.
3. **Inspect**: Use `smart_read` in `symbol` mode to extract only the relevant logic of affected symbols.

This combination reduces context window usage by up to 90% compared to reading full files.


## Installation

```bash
pi install npm:pi-smart-reader
```

## Usage Guide

The extension provides the `smart_read` tool.

### Scenario: Modifying a specific method in a large service

**Step 1: Map the file**
The agent requests a skeletal view to find the right method.
```json
{
  "tool": "smart_read",
  "input": {
    "path": "src/services/AuthService.ts",
    "options": { "mode": "skeleton" }
  }
}
```
**Result**: The agent sees all methods (e.g., `login`, `logout`, `verifyToken`) without the noise of their implementations.

**Step 2: Extract the target logic**
The agent identifies `verifyToken` as the target and extracts it precisely.
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
**Result**: Only the code for `verifyToken` is loaded, saving thousands of tokens.

## Technical Architecture

- **Engine**: Powered by `tree-sitter` (WASM) for high-performance, language-aware parsing.
- **Complexity**: Parsing occurs in $O(N)$ time, while context impact is reduced to $O(1)$ relative to the extracted symbol size.
- **Language Support**: Full support for TypeScript and JavaScript.

## Passive Mode (v0.3.0+)

`pi-smart-reader` now operates as a **passive tool** that works automatically in the background:

- **Automatic Detection**: Monitors file reads and detects large files (>500 lines)
- **Transparent Optimization**: Generates skeletal views without user intervention
- **Caching**: Parsed skeletons are cached for 60 seconds to avoid redundant work
- **Non-Intrusive**: Works alongside Pi's normal file reading flow

### Configuration

Use the `/smart-reader` command to configure passive mode:

```
/smart-reader on          # Enable passive mode
/smart-reader off         # Disable passive mode
/smart-reader status      # Show current configuration
/smart-reader threshold 300  # Set line threshold to 300
```

### How It Works

1. When Pi reads a file via the `read` tool, `pi-smart-reader` intercepts the result
2. If the file is large (>500 lines) and a supported language, it generates a skeletal view
3. The skeletal view is stored in context for Pi to reference
4. You can still use `smart_read` tool manually for explicit control

## Audit Report

This package has been audited by the **pi-audit-master** extension for code quality, security, and reliability. The full audit report is available in [`AUDIT-REPORT.md`](AUDIT-REPORT.md).

### Audit Summary

| Category | Issues Found | Issues Fixed |
|----------|--------------|--------------|
| 🔴 Critical | 2 | 2 ✅ |
| 🟠 High | 4 | 4 ✅ |
| 🟡 Medium | 3 | 3 ✅ |
| 🟢 Low | 1 | 1 ✅ |
| **Total** | **10** | **10** ✅ |

### Key Improvements

- **Passive Mode**: Now works automatically in background
- **Caching**: Parsed skeletons cached to avoid redundant work
- **File Size Threshold**: Only optimizes large files (>500 lines)
- **Language Detection**: Supports TypeScript, JavaScript, Python, Rust
- **Error Recovery**: Graceful degradation if parser fails
- **Configuration**: User-controllable via `/smart-reader` command

For detailed findings and recommendations, see the [full audit report](AUDIT-REPORT.md).

## Contributing

Contributions are welcome. We are seeking support for:
- Additional language bindings (Python, Go, Rust).
- Improved entropy-based symbol detection.
- Enhanced dependency mapping logic.

Please follow the standard Pull Request process: Fork, Branch, Commit, and PR.

## License

Distributed under the MIT License. See the LICENSE file for more information.

## Acknowledgments

- [Pi](https://pi.dev/) - The AI coding agent
