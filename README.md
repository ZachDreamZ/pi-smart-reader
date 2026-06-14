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
