# EXE distribution review and targeted refactoring

**Goal:** Review the current working tree for failures and privacy risks on another user's Windows PC, then correct demonstrated source-level defects.
**Architecture:** Keep Electron/React and the single playback session. Separate media URL policy from the proxy and desktop window construction from application lifecycle. Preserve the existing history/search retention behavior.
**Scope:** The user's review, optimization and necessary refactoring request; existing `AGENTS.md` constraints apply. No tests, lint, type checking, application launches, build or packaging. No dependency upgrades, publication, or commits. Existing uncommitted work is the review baseline and stays in this checkout.

## Tasks

- [x] Isolate each prepared media source with a fresh URL token; handle malformed local requests without unhandled rejections; extract CDN URL policy.
- [x] Make logout invalidate visible account state even if disk cleanup fails; clean encrypted temporary files; prevent API operations from resuming across a session reset.
- [x] Separate window creation from lifecycle, handle startup errors, deny unnecessary renderer permissions, and add a production CSP configured for local DASH playback (runtime compatibility unverified).
- [x] Avoid redundant full-state persistence when idle; check core persisted collections; invalidate restored history pagination so it refreshes on opening.
- [x] Inspect the patch and document unresolved privacy, runtime, release and third-party resource risks, distinguishing static evidence from unperformed runtime verification.

## Review focus

Old requests after a video change; logout while requests or file writes are pending; unavailable loopback port or frontend assets; corrupt local state; old cached history and private data retained on the same Windows account.

## Decisions

Targeted repairs are appropriate because the existing feature modules already separate account, search, history and video. A wholesale rewrite would disrupt unfinished work without resolving release compatibility. Plaintext history retention was explicitly designed in the existing history plan; this review documents it rather than silently deleting user data or changing that contract.

Completed source/diff inspection and one independent static review. The reviewer identified denial of clipboard-sanitized-write as a regression; this permission is now allowed only for the main window. No other confirmed new high/medium severity issue was reported in that bounded review. All runtime checks remain prohibited and unperformed. Review and remaining risks: `docs/reviews/2026-11-16-exe-distribution.md`.
