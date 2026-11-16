# Codex profile static research — 2026-11-16

Scope: read-only inspection of the installed application package. No application launch, runtime interaction, test, lint, type check, or user-account data read.

## Target

- Windows package: `OpenAI.Codex_26.1111.2228.0_x64__2p2nqsd0c76g0` (queried with Get-AppxPackage).
- ASAR: `C:/Program Files/WindowsApps/OpenAI.Codex_26.1111.2228.0_x64__2p2nqsd0c76g0/app/resources/app.asar`.
- The project's previous research targets 26.1103.7773.0; these findings describe the newer installed package.
- REA ASAR SHA-256: `2551cba1057a05cdc5cf5d75b146fac4092bff4ce77a10c43e3286c88d24c82d`.
- Completed REA parent Evidence: `ev_dc54f17b025afbf795a9617011e815c2fceaa80371ec2e383aa2b099f61214b0`; summary Evidence: `ev_c8a3ecdee14ee0423da32a1499ddc98e8fbf449dd76a42f6286294d94f805d0b`.

## Findings from packaged JavaScript

1. `webview/assets/async/200114.81334159bb.js`, string `codex.profileFooter.openProfileMenu` (character offset 143151): sidebar footer renders the profile avatar. Compact mode uses avatar component size `sm`, a `size-6` loading placeholder and no text label. Noncompact mode uses avatar size `xs` and a truncated display-name label. The button uses secondary/ghost styling. Its trigger is passed to the profile-dropdown component; it does not directly navigate to the profile page.
2. The same file uses `rounded-full` for avatar placeholders and a screen-reader-only loading status. Navigation rail classes include a vertical flex layout, `gap-2`, `px-2`, and `pb-2`; exact physical pixels depend on the existing style tokens.
3. `webview/assets/async/583085.4250d5c902.js`, `codex.profileDropdown.profile` (character offset 55121): menu item explicitly describes opening the profile page. At character offset 104680, the handler closes the dropdown and navigates to `/profile`.
4. `webview/assets/async/122012.a9fc760edd.js`, `profile.editProfileTitle` (character offset 133267): a separate edit-profile dialog declares upload-photo, display-name, bio, optional username editing, cancel and save. This is not proof of the main profile page's layout, and these editing functions are outside this Bilibili task.

Offsets are zero-based Python Unicode character offsets, not byte offsets. Findings were read directly from the named ASAR members; packaged code was not executed.

## Recommended application mapping

- Follow the user's explicit location: Bilibili avatar below the existing gear.
- Avatar opens a compact menu; Profile opens a separate page.
- Real Bilibili avatar, nickname, UID, membership, phone-binding status and logout are the scoped data/actions.
- Favorites, history and following can remain entry points only, per the user's decision.
- Reuse existing project's typography, surfaces, controls and spacing rather than introduce a new design system.

## Limits

- Exact relative placement of the original Codex gear and avatar, main profile-page layout, and runtime visibility were not established.
- The bundle has workspace/account/feature conditions. A static component declaration does not prove it is currently visible to this user.
- REA's first inventory attempt reported an unrelated unpacked serialport native module integrity mismatch: `node_modules/@worklouder/device-kit-oai/node_modules/@serialport/bindings-cpp/build/Release/bindings.node`. The requested JavaScript analysis used the tool's `record-and-continue` option and must retain that limitation. No target code was run and no integrity issue was repaired.
- The completed REA result records 8 integrity contradictions in unpacked native companions, partial graph coverage, bounded alias expansion and semantic-retention ceilings. Only `webview/assets/async/122012.a9fc760edd.js` was selected for semantic analysis. The other two members' focused findings above come from direct inert-text inspection, not a completed REA semantic trace. No further analysis was run because the confirmed literal handlers already answer the interaction question.
