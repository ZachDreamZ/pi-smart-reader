# pi-smart-reader

A structural code analysis extension for [Pi](https://pi.dev/) designed to optimize token usage by providing skeletal views and targeted symbol extraction for large source files.

[![Pi Package](https://img.shields.io/badge/Pi-Package-blue)](https://pi.dev/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/pi-smart-reader.svg)](https://www.npmjs.com/package/pi-smart-reader)

## Problem Statement

Reading entire files is one of the most expensive operations for an AI agent in terms of context window management. In large codebases, loading a multi-thousand-line file to understand a single function leads to:

- **Token Exhaustion**: Rapid consumption of the context window, reducing the space available for reasoning and output.
- **Attention Dilution**: The "Lost in the Middle" phenomenon, where critical details are obscured by irrelevant noise.
- **Increased Latency**: Higher token counts can lead to increased processing time and API costs.

## Solution

`pi-smart-reader` implements Structural Extraction. Instead of a linear read, the agent can interact with the file's Abstract Syntax Tree (AST) to retrieve only the specific information required for the current task.

## Key Features

### Skeleton View
The extension generates a skeletal representation of the file. It preserves all class and function signatures while stripping implementation bodies.
- **Context Compression**: Reduces thousands of lines of code to a concise list of API signatures.
- **Architectural Mapping**: Allows the agent to understand the file's structure and capabilities without loading the full content.

### Targeted Symbol Extraction
Enables the precision extraction of a specific function, method, or variable.
- **AST-Based Precision**: Uses Tree-sitter to locate the exact byte range of a symbol.
- **Minimized Noise**: Loads only the target logic into the context window.

### Internal Dependency Awareness
During symbol extraction, the tool scans the target body for calls to other functions within the same file and identifies them as related symbols, assisting the agent in building a complete logical map.

## Installation

```bash
pi install npm:pi-smart-reader
```

## Usage

The extension provides the `smart_read` tool.

### 1. Requesting a Skeleton
To map the API of a large file without reading the entire content:

```json
{
  "tool": "smart_read",
  "input": {
    "path": "src/services/UserService.ts",
    "options": { "mode": "skeleton" }
  }
}
```

### 2. Extracting a Specific Symbol
Once the target symbol is identified via the skeleton, extract the full implementation:

```json
{
  "tool": "smart_read",
  "input": {
    "path": "src/services/UserService.ts",
    "options": { 
      "mode": "symbol", 
      "symbol": "validateToken" 
    }
  }
}
```

## Technical Architecture

- **Parsing Engine**: Utilizes `tree-sitter` for high-performance, language-aware parsing.
- **Complexity**: Parsing occurs in $O(N)$ time, while context impact is reduced to $O(1)$ relative to the extracted symbol size.
- **Language Support**: Primary support for TypeScript and JavaScript.

## Compatibility

- Compatible with all Pi-supported LLMs.
- Zero performance overhead during standard operations.
- Safe for use in production environments.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Pi](https://pi.dev/) - The AI coding agent
