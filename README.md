# pi-smart-reader 🔍

**Stop wasting tokens on irrelevant code. Extract only the signal, ignore the noise.**

[![Pi Package](https://img.shields.io/badge/Pi-Package-blue)](https://pi.dev/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/pi-smart-reader.svg)](https://www.npmjs.com/package/pi-smart-reader)

## 🚩 The Problem: Token Bloat
Reading entire files is the most expensive operation for an AI agent. When working with large source files, loading the entire content into the context window causes:

- **Attention Dilution**: The "Lost in the Middle" phenomenon, where critical logic is buried under thousands of lines of boilerplate.
- **Context Exhaustion**: Rapidly consuming the token budget, leaving less room for the agent to reason or generate complex code.
- **Increased Latency**: Higher token counts increase processing time and API costs.

## ✨ The Solution: Structural Extraction
`pi-smart-reader` shifts the paradigm from **Linear Reading** to **Structural Extraction**. Instead of reading a file from top to bottom, the agent interacts with the file's Abstract Syntax Tree (AST) to retrieve only the exact fragments needed for the task.

## 🚀 Key Features

### 1. Skeleton View (`mode: "skeleton"`)
Instantly map the API of any large file. The sentinel strips all implementation bodies, leaving only the signatures of classes and functions.
- **Value**: Turn a 2,000-line file into a 50-line map of capabilities.
- **Use Case**: "I need to know which methods exist in `UserService.ts` without loading the whole file."

### 2. Precision Symbol Extraction (`mode: "symbol"`)
Surgically extract the full body of a specific function, method, or variable.
- **Value**: Loads only the target logic into the context window.
- **Use Case**: "I've seen the skeleton; now give me the full implementation of `validateToken`."

### 3. Internal Dependency Awareness
Automatically identifies internal calls within the extracted symbol. If a function calls another helper in the same file, the tool suggests that related symbol, preventing the agent from having to guess dependencies.

## 🛠️ Installation

```bash
pi install npm:pi-smart-reader
```

## 📖 Usage Guide

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

## ⚙️ Technical Architecture

- **Engine**: Powered by `tree-sitter` (WASM) for high-performance, language-aware parsing.
- **Efficiency**: Parsing occurs in $O(N)$ time, while context impact is reduced to $O(1)$ relative to the extracted symbol size.
- **Language Support**: Full support for TypeScript and JavaScript.

## 🤝 Contributing

Contributions are welcome! We are looking for help with:
- Adding support for more languages (Python, Go, Rust).
- Improving the entropy-based symbol detection.
- Enhancing the dependency mapping logic.

Please follow the standard PR process: Fork $\to$ Branch $\to$ Commit $\to$ PR.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments
- [Pi](https://pi.dev/) - The AI coding agent
