# Watch history implementation plan

**Goal:** Integrate the approved history UI, real account history search, playback handoff, retained state, and avatar/clock motion.
**Architecture:** A feature provider owns the two history presentations and account-scoped cache; a portal renders the account menu and shared history panel. Electron owns authenticated history requests and playback heartbeats. Existing video selection remains the single playback session.
**Spec:** `docs/prototypes/watch-history-design.md`, with the user's latest removal of footer explanations.
**Constraints:** Work in the current checkout on top of existing parallel edits. No tests, lint, type checking, application launch, build or packaging. No new dependencies. Do not commit unrelated changes. Preserve existing search/player work.

- [x] Add history list/search and heartbeat operations, normalize server results, preserve account isolation.
- [x] Add account-scoped result/filter/scroll storage and actual-playback local markers; reuse current playback session including history CID and resume position.
- [x] Implement avatar menu, quick card, 500px manager, retained exit/enter animations and custom selects; omit redundant footer captions.
- [x] Wire avatar/clock, center all rail hit areas, set avatar to 24px in a 36px button; retain automation through More.
- [x] Read the changed source and diffs only; document unverified live behavior and prohibited checks.

Review focus: stale account responses; switching or closing during animations; failed requests preserving prior results; actual playback versus merely selecting a video; multi-part video resume; keyboard dropdown dismissal.

Static review identified loss of final progress when load() discards the queued pause event during a video change. The player now emits a synchronous before-reset notification; the observer captures the old media position and Electron serializes validated heartbeat payloads with an account check at execution. Closing a pending quick selection also invalidates its UI completion so it cannot dismiss a reopened panel. Animation interruption retains the visible dimensions during exit.

Verification boundary: source/diff inspection only, including an independent read-only review. No tests, lint, type checks, build, package or application launch were run. Real history endpoints, account search semantics, heartbeat acceptance, playback resume and rendered animations remain unverified.
