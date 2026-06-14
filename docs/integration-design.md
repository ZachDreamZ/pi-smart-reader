# Integration Design: pi-smart-reader + pi-impact-analyzer

**Date:** 2026-06-14  
**Author:** Automated audit & design  
**Status:** Draft — ready for implementation

---

## 1. Current State

### pi-impact-analyzer (v0.2.0)
- `extensions/parser.ts` — `TreeSitterParser`: loads TypeScript + TSX WASM from local `wasm/`
- `extensions/graph-builder.ts` — `GraphBuilder`: builds call graph from parsed ASTs
- `extensions/impact-analyzer.ts` — `ImpactAnalyzer`: BFS reverse-dependency analysis
- `extensions/index.ts` — Registers `impact_analyze` tool (symbol/file/diff modes, JSON/table/markdown output)
- **Mature**: TSX support, local WASM, file-type detection, DIFF parsing, orphan finding

### pi-smart-reader (v0.1.8)
- `extensions/parser.ts` — `SmartParser`: loads WASM from **remote GitHub URLs** (fragile)
- `extensions/skeleton.ts` — `SkeletonEngine`: strips function bodies, keeps signatures
- `extensions/extractor.ts` — `SymbolExtractor`: finds a symbol by name and returns its body + related calls
- `extensions/index.ts` — Registers `smart_read` tool (skeleton/symbol modes)
- **Issues**: `rootDir: "./src"` in tsconfig (source is in `./extensions/`), remote WASM URLs, `\\n` double-escape bug

### Shared pattern
Both packages:
- Use `web-tree-sitter` to parse TypeScript/JavaScript
- Are Pi extensions registered via `pi.extensions`
- Work with file paths and source content

---

## 2. Integration Strategy (Phased)

### Phase 1: Shared Parser — Refactor smart-reader to use TreeSitterParser

**Problem:** Both packages initialize tree-sitter WASM independently. Smart-reader loads from remote URLs (no local WASM, fragile). Impact-analyzer has a mature parser with local WASM + TSX.

**Solution:** Replace smart-reader's `SmartParser` with a wrapper around impact-analyzer's `TreeSitterParser`.

**Implementation:**

1. In smart-reader, replace `extensions/parser.ts` with a thin wrapper:
   ```typescript
   // extensions/parser.ts
   import { TreeSitterParser } from "pi-impact-analyzer";
   export { TreeSitterParser as SmartParser };
   export type { ParserConfig } from "pi-impact-analyzer";
   ```

2. Add `pi-impact-analyzer` as a dependency in `package.json`:
   ```json
   "dependencies": {
     "pi-impact-analyzer": "^0.2.0"
   }
   ```

3. Update `extensions/skeleton.ts` — import `type { Node }` from `"web-tree-sitter"` (already works since impact-analyzer's parser returns standard tree-sitter types)

4. Update `extensions/extractor.ts` — no changes needed, it only uses `this.parser.parse(source)` which is the same API

5. Fix the `\\n` double-escape bug in `skeleton.ts` line 20:
   ```typescript
   const lines = source.split("\n");  // not "\\n"
   ```

6. Fix `tsconfig.json`: change `rootDir` to `"./extensions"` and `include` to `["extensions/**/*"]`

**Benefits:**
- Single WASM initialization for both packages
- Smart-reader gets TSX support for free
- Local WASM loading (no remote URL fragility)
- Reduced bundle size

---

### Phase 2: Enhanced Markdown Output — Include skeleton views

**Problem:** When `impact_analyze` outputs affected files (especially in markdown mode), the user sees file paths and risk scores but not the actual code structure. They must then call `smart_read` manually.

**Solution:** In `impact-analyzer`'s markdown formatter, optionally import `SkeletonEngine` from smart-reader and include skeletal views of the top-risk affected files.

**Implementation:**

1. Add `pi-smart-reader` as an optional dependency in `pi-impact-analyzer/package.json`:
   ```json
   "optionalDependencies": {
     "pi-smart-reader": "^0.2.0"
   }
   ```

2. In `pi-impact-analyzer/extensions/index.ts` (markdown formatter), add an import:
   ```typescript
   let SkeletonEngine: any;
   try {
     const sr = require("pi-smart-reader");
     SkeletonEngine = sr.SkeletonEngine;
   } catch {
     // smart-reader not installed; skip skeleton views
   }
   ```

3. After the affected symbols table in markdown output, append:
   ```typescript
   if (SkeletonEngine && result.affected.length > 0) {
     lines.push("### Affected File Structure");
     lines.push("");
     // Get unique files, sorted by risk
     const files = [...new Set(result.affected.map(a => a.file))];
     for (const file of files.slice(0, 3)) { // Top 3 files
       try {
         const source = fs.readFileSync(file, "utf8");
         const skeleton = skeletonEngine.generateSkeleton(source);
         lines.push(`**${file}** (skeleton view):`);
         lines.push("```typescript");
         lines.push(skeleton);
         lines.push("```");
         lines.push("");
       } catch { /* skip unreadable files */ }
     }
   }
   ```

**Benefits:**
- Immediate code structure context in impact analysis output
- No extra tool call needed
- Graceful degradation if smart-reader isn't installed

---

### Phase 3: Combined `impact_inspect` Tool

**Problem:** User must make two separate tool calls (impact_analyze + smart_read) to understand what to change.

**Solution:** Create a new Pi tool that combines both operations in one call.

**Implementation:**

Add to `pi-impact-analyzer/extensions/index.ts`:

```typescript
pi.registerTool({
  name: "impact_inspect",
  description:
    "Analyze impact of changing a symbol/file and smart-read affected files. " +
    "Combines impact_analyze + smart_read in one call.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["symbol", "file"],
        description: "Same as impact_analyze type" },
      target: { type: "string",
        description: "Symbol name or file path to analyze" },
      maxFiles: { type: "number",
        description: "Max affected files to show skeleton views for (default: 3)" },
    },
    required: ["type", "target"],
  },
  handler: async (input: any, _ctx: any) => {
    // 1. Run impact analysis
    const impactResult = await impactAnalyzeHandler(input);

    if (typeof impactResult === "string") {
      // Already formatted as table/markdown; return as-is
      return impactResult;
    }

    // 2. Smart-read top affected files
    const files = [...new Set(impactResult.affected.map(a => a.file))];
    const maxFiles = input.maxFiles || 3;
    const skeletons: Record<string, string> = {};

    for (const file of files.slice(0, maxFiles)) {
      try {
        const source = fs.readFileSync(file, "utf8");
        const tree = parser.parse(source);
        // Use SkeletonEngine from smart-reader if available
        if (smartReaderAvailable) {
          skeletons[file] = skeletonEngine.generateSkeleton(source);
        }
      } catch { /* skip */ }
    }

    // 3. Return combined result
    return {
      impact: impactResult,
      fileSkeletons: skeletons,
      _prompt: "Impact analysis complete. File skeletons show structure of affected files.",
    };
  },
});
```

**Benefits:**
- Single tool call for the full picture
- Works standalone (without smart-reader) — just returns impact data if smart-reader isn't available

---

## 3. Implementation Priority

| Phase | Effort | Risk | Value | Recommended Order |
|-------|--------|------|-------|-------------------|
| 1 (Shared Parser) | Low (4 files) | Low | High | **1st** |
| 2 (Enhanced Markdown) | Low-Medium (2 files) | Low | Medium | **2nd** |
| 3 (Combined Tool) | Medium (1 file) | Low | High | **3rd** |

---

## 4. Files to Change

### Phase 1 — Shared Parser

| File | Change |
|------|--------|
| `pi-smart-reader/package.json` | Add `pi-impact-analyzer` dependency |
| `pi-smart-reader/extensions/parser.ts` | Replace with thin wrapper importing from `pi-impact-analyzer` |
| `pi-smart-reader/extensions/skeleton.ts` | Fix `\\n` → `\n` bug (line 20) |
| `pi-smart-reader/tsconfig.json` | Fix `rootDir: "./extensions"`, `include: ["extensions/**/*"]` |
| `pi-smart-reader/extensions/index.ts` | Update imports, remove remote WASM URLs |

### Phase 2 — Enhanced Markdown

| File | Change |
|------|--------|
| `pi-impact-analyzer/package.json` | Add optional `pi-smart-reader` dependency |
| `pi-impact-analyzer/extensions/index.ts` | Add SkeletonEngine import + skeleton views in `formatAsMarkdown()` |

### Phase 3 — Combined Tool

| File | Change |
|------|--------|
| `pi-impact-analyzer/extensions/index.ts` | Register new `impact_inspect` tool |

---

## 5. Migration Path for Smart-Reader Users

After Phase 1, smart-reader v0.2.0:
- No longer loads WASM from remote URLs
- Uses impact-analyzer's local WASM (must also have impact-analyzer installed, or smart-reader bundles its own fallback WASM)
- `smart_read` tool API is unchanged (same parameters, same return format)
- Fixes the `\\n` double-escape bug in skeleton mode

---

## 6. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Smart-reader depends on impact-analyzer — circular if impact-analyzer also depends on smart-reader | Keep impact-analyzer's smart-reader dependency as **optional** — only enabled when both packages are installed |
| Breaking smart-reader's tool API | Phase 1 changes are internal (parser impl only); tool name, parameters, and return format stay identical |
| WASM path resolution after refactor | Smart-reader uses impact-analyzer's `TreeSitterParser` which already resolves from local `wasm/`; delete smart-reader's own `wasm/` to avoid confusion |
| Version compatibility | Pin major version in dependencies, document required versions |

---

## 7. Summary Recommendation

**Start with Phase 1** — it's the lowest effort, highest impact fix, and unblocks Phases 2-3:

1. Fix smart-reader's tsconfig and `\\n` bug (prerequisite)
2. Refactor parser to use impact-analyzer's `TreeSitterParser`
3. Add optional dependency + enhanced markdown in impact-analyzer
4. Add combined `impact_inspect` tool

This gives users the full workflow:
- **What will break?** → `impact_analyze` or `impact_inspect`
- **What does the affected code look like?** → skeletal views included in output
- **Show me more detail** → `smart_read` symbol mode for exact function bodies
