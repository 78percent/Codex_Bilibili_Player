# Third-party notices

The project's original code and the geometric player icon in `assets/app.svg`
and `assets/app.ico` are distributed under the root MIT license. That license
does not relicense third-party software, fonts, trademarks, or media.

## Software

- React and React DOM: MIT, Meta Platforms, Inc. and affiliates.
- dash.js: BSD-3-Clause, Dash Industry Forum. No patent rights are granted by
  its license.
- Lucide: ISC with Feather-derived MIT portions; both notices are retained.
- node-qrcode: MIT.
- Electron: MIT. The distributed runtime also contains Chromium, Node.js,
  FFmpeg and other components with their own licenses. Keep Electron's
  `LICENSE` and `LICENSES.chromium.html` with the runtime.

Full notices for installed production npm packages are retained in `licenses/`.
The dependency inventory records the packaged versions, including browser
polyfills embedded inside the prebuilt dash.js bundle; their full notices
and the upstream bundle notice are retained alongside the npm notices. Development tools,
including Vite, TypeScript and electron-builder, retain their own upstream
licenses in the source installation.

## Fonts

Inter, Source Han Sans CN and JetBrains Mono use the SIL Open Font License 1.1.
Their notices are in `public/fonts/` and are included in the built assets.
The font software is not relicensed under MIT. System fallback fonts are not
distributed by this project.

## Service icon and media

The Bilibili service mark at `src/assets/icons/bilibili.svg` comes from Simple
Icons 16.0.0 (CC0-1.0); provenance is in the adjacent README and the CC0 text
is in `licenses/`. CC0 does not grant trademark rights. The mark identifies
the connected service and does not imply affiliation or endorsement.

Video covers, avatars, subtitles and videos fetched from Bilibili are remote
service content. They are not project assets and are not covered by this
repository's MIT license. Users must respect the service terms and the
rights and access restrictions attached to that content.

## Identity and earlier versions

This is an independent project, not an official OpenAI or Bilibili product.
OpenAI, Codex and Bilibili names remain the property of their owners.
Version 1.4.0 replaces the application icon copied from a third-party desktop
package and removes an unused third-party logo from the distributed assets.
Earlier commits and releases are retained for history; the new license and
asset changes do not retroactively establish redistribution rights for those
third-party materials.
