# Dependency Vulnerability Report

**Generated:** 2026-09-05T16:23:51.423Z
**Policy:** parsed High/Critical advisories block; Moderate/Low remain reported
**Command:** `pnpm audit --json --audit-level=high`
**Command exit status:** 0
**Parsed schema:** legacy-advisories
**Total dependencies reported by audit:** 1795

## Blocking verdict

PASS — no parsed High/Critical advisory.

## Parsed counts

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |

## Workspace overrides

| Package | Pinned version |
|---|---|
| `@types/react` | `19.2.15` |
| `@types/react-dom` | `^19.2.3` |
| `react` | `19.1.0` |
| `react-dom` | `19.1.0` |
| `path-to-regexp` | `8.4.2` |
| `serve-handler>path-to-regexp` | `3.3.0` |
| `brace-expansion` | `5.0.9` |
| `fflate` | `0.8.3` |
| `vite` | `8.0.16` |
| `form-data@2` | `2.5.6` |
| `form-data@4` | `4.0.6` |
| `lodash` | `4.18.1` |
| `micromatch>picomatch` | `2.3.2` |
| `tinyglobby>picomatch` | `4.0.4` |
| `@tootallnate/once` | `3.0.1` |
| `@esbuild-kit/core-utils>esbuild` | `0.28.1` |
| `protobufjs` | `7.6.5` |
| `protocol-buffers-schema` | `^3.6.1` |
| `@xmldom/xmldom` | `^0.9.12` |
| `fast-xml-parser` | `^5.8.0` |
| `postcss` | `8.5.23` |
| `uuid` | `^14.0.0` |
| `qs` | `6.16.0` |
| `ws` | `^8.20.1` |
| `hono` | `4.12.34` |
| `@hono/node-server` | `2.1.1` |
| `browserslist` | `4.28.7` |
| `body-parser` | `2.3.0` |
| `image-size` | `link:packages/image-size-safe` |
| `shell-quote` | `1.9.0` |
| `tsx>esbuild` | `0.28.1` |
| `vite>esbuild` | `0.28.1` |
| `drizzle-kit>esbuild` | `0.28.1` |
| `esbuild-register>esbuild` | `0.28.1` |
| `undici` | `>=6.28.0` |
| `adm-zip` | `>=0.6.0` |
| `js-yaml@>=4.0.0 <4.3.1` | `4.3.1` |
| `js-yaml@>=5.0.0 <5.2.2` | `5.2.2` |
| `js-yaml@>=3.0.0 <4.0.0` | `3.15.1` |
| `nanoid@<4` | `3.3.18` |
| `nanoid@>=4 <5.1.16` | `5.1.16` |
| `ip-address` | `10.3.1` |
| `fast-uri` | `3.1.6` |
| `linkify-it` | `5.0.2` |
| `sharp` | `0.35.3` |
| `@opentelemetry/propagator-jaeger` | `2.9.0` |
| `dompurify` | `>=3.4.13` |
| `@opentelemetry/core` | `>=2.8.0` |
| `tar` | `7.5.21` |
| `@esbuild-kit/esm-loader` | `npm:tsx@^4.21.0` |
| `@expo/ngrok-bin>@expo/ngrok-bin-darwin-arm64` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-darwin-x64` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-freebsd-ia32` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-freebsd-x64` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-linux-arm` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-linux-arm64` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-linux-ia32` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-sunos-x64` | `-` |
| `@expo/ngrok-bin>@expo/ngrok-bin-win32-ia32` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-android-arm64` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-darwin-arm64` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-darwin-x64` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-freebsd-x64` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-linux-arm-gnueabihf` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-linux-arm64-gnu` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-linux-arm64-musl` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-linux-x64-musl` | `-` |
| `@tailwindcss/oxide>@tailwindcss/oxide-win32-arm64-msvc` | `-` |
| `esbuild` | `0.28.1` |
| `esbuild>@esbuild/aix-ppc64` | `-` |
| `esbuild>@esbuild/android-arm` | `-` |
| `esbuild>@esbuild/android-arm64` | `-` |
| `esbuild>@esbuild/android-x64` | `-` |
| `esbuild>@esbuild/darwin-arm64` | `-` |
| `esbuild>@esbuild/darwin-x64` | `-` |
| `esbuild>@esbuild/freebsd-arm64` | `-` |
| `esbuild>@esbuild/freebsd-x64` | `-` |
| `esbuild>@esbuild/linux-arm` | `-` |
| `esbuild>@esbuild/linux-arm64` | `-` |
| `esbuild>@esbuild/linux-ia32` | `-` |
| `esbuild>@esbuild/linux-loong64` | `-` |
| `esbuild>@esbuild/linux-mips64el` | `-` |
| `esbuild>@esbuild/linux-ppc64` | `-` |
| `esbuild>@esbuild/linux-riscv64` | `-` |
| `esbuild>@esbuild/linux-s390x` | `-` |
| `esbuild>@esbuild/netbsd-arm64` | `-` |
| `esbuild>@esbuild/netbsd-x64` | `-` |
| `esbuild>@esbuild/openbsd-arm64` | `-` |
| `esbuild>@esbuild/openbsd-x64` | `-` |
| `esbuild>@esbuild/openharmony-arm64` | `-` |
| `esbuild>@esbuild/sunos-x64` | `-` |
| `esbuild>@esbuild/win32-arm64` | `-` |
| `esbuild>@esbuild/win32-ia32` | `-` |
| `lightningcss>lightningcss-android-arm64` | `-` |
| `lightningcss>lightningcss-darwin-arm64` | `-` |
| `lightningcss>lightningcss-darwin-x64` | `-` |
| `lightningcss>lightningcss-freebsd-x64` | `-` |
| `lightningcss>lightningcss-linux-arm-gnueabihf` | `-` |
| `lightningcss>lightningcss-linux-arm64-gnu` | `-` |
| `lightningcss>lightningcss-linux-arm64-musl` | `-` |
| `lightningcss>lightningcss-linux-x64-musl` | `-` |
| `lightningcss>lightningcss-win32-arm64-msvc` | `-` |
| `rollup>@rollup/rollup-android-arm-eabi` | `-` |
| `rollup>@rollup/rollup-android-arm64` | `-` |
| `rollup>@rollup/rollup-darwin-arm64` | `-` |
| `rollup>@rollup/rollup-darwin-x64` | `-` |
| `rollup>@rollup/rollup-freebsd-arm64` | `-` |
| `rollup>@rollup/rollup-freebsd-x64` | `-` |
| `rollup>@rollup/rollup-linux-arm-gnueabihf` | `-` |
| `rollup>@rollup/rollup-linux-arm-musleabihf` | `-` |
| `rollup>@rollup/rollup-linux-arm64-gnu` | `-` |
| `rollup>@rollup/rollup-linux-arm64-musl` | `-` |
| `rollup>@rollup/rollup-linux-loong64-gnu` | `-` |
| `rollup>@rollup/rollup-linux-loong64-musl` | `-` |
| `rollup>@rollup/rollup-linux-ppc64-gnu` | `-` |
| `rollup>@rollup/rollup-linux-ppc64-musl` | `-` |
| `rollup>@rollup/rollup-linux-riscv64-gnu` | `-` |
| `rollup>@rollup/rollup-linux-s390x-gnu` | `-` |
| `rollup>@rollup/rollup-linux-x64-musl` | `-` |
| `rollup>@rollup/rollup-openbsd-x64` | `-` |
| `rollup>@rollup/rollup-openharmony-arm64` | `-` |
| `rollup>@rollup/rollup-win32-arm64-msvc` | `-` |
| `rollup>@rollup/rollup-win32-ia32-msvc` | `-` |
| `rollup>@rollup/rollup-win32-x64-gnu` | `-` |

_CI fails closed on High/Critical findings and on audit execution/parser failure. Moderate/Low findings remain visible and non-promotional._
