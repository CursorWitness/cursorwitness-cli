# Security policy

The CLI is offline by default. It rejects unsafe output paths, limits input
sizes, and does not load wallets or private keys. Do not add live RPC access or
credential handling without a separate security review.

Report suspected vulnerabilities privately through GitHub Security Advisories
for `CursorWitness/cursorwitness-cli`. Do not include secrets or sensitive
event payloads in public issues.
