# Dependency Vulnerability Report

**Generated:** 2026-10-08T02:18:33.250Z
**Policy:** unmitigated High/Critical advisories block; exact local patches must be registered, digest-bound, behavior-tested, and unexpired; Moderate/Low remain reported
**Command:** `pnpm audit --json --audit-level=high`
**Expected package manager:** `pnpm@10.26.1`
**Observed package manager:** `pnpm@10.26.1`
**Package-manager attestation:** PASS
**Version-check timeout:** 10000 ms
**Command exit status:** 1
**Command termination signal:** NONE
**Audit timeout:** 120000 ms
**Parsed schema:** legacy-advisories
**Total dependencies reported by audit:** 2006

## Blocking verdict

PASS — no unmitigated parsed High/Critical advisory (2 exact local patch mitigation(s) verified).

## Parsed counts

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 2 |
| Moderate | 2 |
| Low | 0 |

## Verified local patch mitigations

| Package | Advisory | Version | Patch SHA-256 | Behavior verification | Expires | Upstream |
|---|---|---:|---|---|---:|---|
| `node-forge` | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | `1.4.0` | `de8829eac6e09806b4b749a7221e7a2a62e6d88c796d38880d0f61bb2eb035ec` | `dependency-patches/node-forge-digestalgorithm-v1` | 2026-11-05 | [patch source](https://github.com/digitalbazaar/forge/pull/1152/commits/ceba34402e329f0365134f23fe19898756527d65) |
| `braces` | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | `3.0.3` | `c056b5c1123a999cfcaa5ad56c70e69a1120e186c410ee091a1f86e941411cf9` | `dependency-patches/braces-recursive-nesting-v1` | 2026-11-05 | [patch source](https://github.com/micromatch/braces/issues/70) |

## Reported Moderate / Low findings

| Package | Advisory | Severity | Vulnerable range |
|---|---|---|---|
| `sprintf-js` | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | MODERATE | `<=1.1.3` |

1 Moderate/Low finding(s) were present only in pnpm's aggregate metadata for this audit-level response; their missing detail is not inferred.

## Workspace overrides

| Package | Pinned version |
|---|---|
| `@types/react` | `19.2.15` |
| `@types/react-dom` | `^19.2.3` |
| `react` | `19.1.0` |
| `react-dom` | `19.1.0` |
| `path-to-regexp` | `8.4.2` |
| `serve-handler>path-to-regexp` | `3.3.0` |
| `brace-expansion` | `5.0.12` |
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
| `proxy-addr` | `2.0.8` |
| `@xmldom/xmldom` | `^0.9.12` |
| `fast-xml-parser` | `^5.8.0` |
| `postcss` | `8.5.23` |
| `uuid` | `^14.0.0` |
| `qs` | `6.16.0` |
| `ws` | `^8.20.1` |
| `hono` | `^4.13.5` |
| `@hono/node-server` | `2.1.1` |
| `browserslist` | `4.28.7` |
| `body-parser` | `2.3.0` |
| `compression` | `1.8.2` |
| `image-size` | `link:packages/image-size-safe` |
| `shell-quote` | `1.11.0` |
| `source-map-js` | `1.2.2` |
| `tsx>esbuild` | `0.28.1` |
| `vite>esbuild` | `0.28.1` |
| `drizzle-kit>esbuild` | `0.28.1` |
| `esbuild-register>esbuild` | `0.28.1` |
| `undici` | `>=6.28.1 <7` |
| `@grpc/grpc-js` | `>=1.14.5` |
| `adm-zip` | `>=0.6.1` |
| `js-yaml@>=4.0.0 <4.3.2` | `4.3.2` |
| `js-yaml@>=5.0.0 <5.2.2` | `5.2.2` |
| `js-yaml@>=3.0.0 <4.0.0` | `3.15.2` |
| `nanoid@<4` | `3.3.18` |
| `nanoid@>=4 <5.1.16` | `5.1.16` |
| `ip-address` | `10.7.1` |
| `fast-uri` | `^3.1.7` |
| `linkify-it` | `5.0.2` |
| `sharp` | `0.35.5` |
| `nodemailer` | `10.0.9` |
| `@opentelemetry/propagator-jaeger` | `2.9.0` |
| `dompurify` | `3.4.16` |
| `fast-copy` | `4.1.2` |
| `postcss-selector-parser` | `7.1.6` |
| `@opentelemetry/instrumentation-cassandra-driver` | `0.66.0` |
| `@opentelemetry/instrumentation-knex` | `0.65.0` |
| `@opentelemetry/instrumentation-mongoose` | `0.67.0` |
| `@opentelemetry/instrumentation-mysql2` | `0.67.0` |
| `@opentelemetry/instrumentation-mysql` | `0.67.0` |
| `@opentelemetry/instrumentation-oracledb` | `0.46.0` |
| `@opentelemetry/instrumentation-pg` | `0.73.0` |
| `@opentelemetry/instrumentation-tedious` | `0.40.0` |
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
| `vitest` | `^4.1.11` |
| `@vitest/mocker` | `^4.1.11` |

_CI fails closed on unmitigated High/Critical findings, expired or mismatched local patch evidence, and audit execution/parser failure. Moderate/Low findings remain visible and non-promotional._
