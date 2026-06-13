# pi-smart-reader 🔍

A structural code analysis extension for [Pi](https://pi.dev/) that eliminates "token bloat" by providing skeletal views and targeted symbol extraction.

[![Pi Package](https://img.shields.io/badge/Pi-Package-blue)](https://pi.dev/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/pi-smart-reader.svg)](https://www.npmjs.com/package/pi-smart-reader)

## 🚩 The Problem
Reading entire files is the most expensive operation for an AI agent. In large codebases, loading a 2,000-line file just to understand a single function:
- **Wastes Tokens**: Consumes a huge portion of the context window.
- **Dilutes Attention**: Buries the "signal" in a sea of "noise," leading to hallucinations or missed details.
- **Increases Cost**: Significantly raises the token count per request.

## ✨ The Solution
`pi-smart-reader` replaces blind reading with **Structural Extraction**. Instead of reading the whole file, the agent can now "skim" the API and surgically extract only the necessary logic.

## 🚀 Features

### 1. Skeleton View (`mode: "skeleton"`)
Generates a high-level map of the file. It preserves all class and function signatures but strips the implementation bodies.
- **Example**: 2,000 lines of code $\to$ 50 lines of API signatures.
- **Benefit**: Allows the agent to understand the file's capabilities without loading the whole content.

### 2. Targeted Symbol Extraction (`mode: "symbol"`)
Extracts the exact source code for a specific function, method, or variable.
- **Precision**: Uses AST (Abstract Syntax Tree) parsing to find the precise byte range of the symbol.
- **Efficiency**: Loads only the required logic into the context.

### 3. Dependency Awareness
When extracting a symbol, the sentinel scans the function body for calls to other symbols within the same file and suggests them as related dependencies.

## 🛠️ Installation

```bash
pi install npm:pi-smart-reader
```

## 📖 Quick Start

The extension adds the `smart_read` tool to your agent.

### Step 1: Get the Skeleton
Instead of `read(path)`, use:
```json
{
  "tool": "smart_read",
  "input": {
    "path": "src/services/UserService.ts",
    "options": { "mode": "skeleton" }
  }
}
```
*The agent now sees all available methods without the noise of their implementations.*

### Step 2: Extract the Logic
Once the agent identifies the target method (e.g., `validateToken`), it extracts it:
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

## ⚙️ Technical Details
- **Engine**: Powered by `tree-sitter` for robust, language-aware parsing.
- **Complexity**: $O(N)$ parsing time, but $O(1)$ context impact after extraction.
- **Language Support**: Full support for TypeScript and JavaScript.

## 📜 License
MIT
