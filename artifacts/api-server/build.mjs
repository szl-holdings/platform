import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, readFile, readdir, cp, mkdir } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(artifactDir, "../..");

async function buildWorkspacePackageMap() {
  const libDir = path.join(workspaceRoot, "lib");
  const packageMap = {};
  try {
    const entries = await readdir(libDir, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
      if (!entry.isDirectory()) return;
      const packageDir = path.join(libDir, entry.name);
      const pkgPath = path.join(packageDir, "package.json");
      try {
        const pkgContent = await readFile(pkgPath, "utf8");
        const pkg = JSON.parse(pkgContent);
        if (!pkg.name) return;
        packageMap[pkg.name] = { dir: packageDir, exports: pkg.exports ?? {} };
      } catch {
        // skip packages without package.json
      }
    }));
  } catch {
    // lib dir not found
  }
  return packageMap;
}

function resolveExportPath(exports, subpath) {
  const key = subpath === "" ? "." : `./${subpath}`;
  const entry = exports[key];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry.import ?? entry.default ?? null;
}

function workspacePlugin(packageMap) {
  return {
    name: "workspace-resolver",
    setup(build) {
      build.onResolve({ filter: /^@workspace\// }, (args) => {
        const importPath = args.path;
        let pkgName = null;
        let subpath = "";
        for (const name of Object.keys(packageMap)) {
          if (importPath === name) {
            pkgName = name;
            subpath = "";
            break;
          }
          if (importPath.startsWith(name + "/")) {
            pkgName = name;
            subpath = importPath.slice(name.length + 1);
            break;
          }
        }
        if (!pkgName) return null;
        const pkg = packageMap[pkgName];
        const relFile = resolveExportPath(pkg.exports, subpath);
        if (!relFile) return null;
        return { path: path.join(pkg.dir, relFile) };
      });
    },
  };
}

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  const workspacePackageMap = await buildWorkspacePackageMap();

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    nodePaths: [path.join(artifactDir, "node_modules")],
    // Some packages may not be bundleable, so we externalize them, we can add more here as needed.
    // Some of the packages below may not be imported or installed, but we're adding them in case they are in the future.
    // Examples of unbundleable packages:
    // - uses native modules and loads them dynamically (e.g. sharp)
    // - use path traversal to read files (e.g. @google-cloud/secret-manager loads sibling .proto files)
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "@react-pdf/renderer",
      "react",
      "react-dom",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
      // Large packages externalized to reduce bundle size and heap usage
      "pdfkit",
      "swagger-ui-express",
      "swagger-ui-dist",
    ],
    sourcemap: process.env.NODE_ENV === "production" ? "linked" : false,
    plugins: [
      workspacePlugin(workspacePackageMap),
      // pino relies on workers to handle logging, instead of externalizing it we use a plugin to handle it
      esbuildPluginPino({ transports: ["pino-pretty"] })
    ],
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

async function copyPdfkitData() {
  let pdfkitDataSrc;
  const searchPaths = [
    artifactDir,
    path.join(artifactDir, "node_modules"),
    workspaceRoot,
  ];
  try {
    const pdfkitMain = globalThis.require.resolve("pdfkit", { paths: searchPaths });
    const pdfkitRoot = path.dirname(path.dirname(pdfkitMain));
    pdfkitDataSrc = path.join(pdfkitRoot, "js", "data");
  } catch {
    const pnpmStore = path.resolve(workspaceRoot, "node_modules/.pnpm");
    try {
      const entries = await readdir(pnpmStore, { withFileTypes: true });
      const pdfkitEntry = entries.find(e => e.isDirectory() && e.name.startsWith("pdfkit@"));
      if (pdfkitEntry) {
        pdfkitDataSrc = path.join(pnpmStore, pdfkitEntry.name, "node_modules/pdfkit/js/data");
      } else {
        throw new Error("pdfkit not found in .pnpm store");
      }
    } catch (e) {
      console.warn("Warning: could not locate pdfkit:", e.message);
      return;
    }
  }
  const distDataDest = path.join(artifactDir, "dist/data");
  try {
    await mkdir(distDataDest, { recursive: true });
    await cp(pdfkitDataSrc, distDataDest, { recursive: true });
    console.log("Copied pdfkit data (AFM fonts) to dist/data from:", pdfkitDataSrc);
  } catch (err) {
    console.warn("Warning: could not copy pdfkit data directory:", err.message);
  }
}

buildAll().then(() => copyPdfkitData()).catch((err) => {
  console.error(err);
  process.exit(1);
});
