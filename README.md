# @cursorwitness/cli

The CursorWitness offline executable. It consumes `@cursorwitness/core` as a
version-pinned package boundary and owns CLI parsing, filesystem handling,
presentation, and exit-code behavior. It is not published yet.

Development:

```text
pnpm install --ignore-workspace
pnpm run verify
```

The CLI remains offline by default. It does not load wallet credentials or
connect to live RPC providers.
