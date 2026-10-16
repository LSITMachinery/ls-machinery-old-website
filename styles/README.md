# LS styles

The public website loads **site.css** once. Rebuild it after editing any source:

```text
node scripts/build-styles.cjs
node scripts/build-styles.cjs --check
```

`tokens.css` owns global colors, fonts and content dimensions. `shared.css` owns the common section layout, type and header container rules. `manifest.json` lists component sources in build order. The existing source files remain readable at their original paths so supporting prototype scripts and tests keep working. Public pages do not load those individual files.

The old annotation overrides have been merged into the navigation, industrial and brand components. Make changes in those components, rather than adding another correction stylesheet. Component layout and image dimensions preserve the reviewed design.

Some older component selectors still overlap across the original visual, reference and revision sources. These have been kept in a deterministic order to avoid a broad visual redesign during launch cleanup. Consolidating every historical component rule remains further refactoring work; the build is not a claim that all cascade debt has disappeared.
