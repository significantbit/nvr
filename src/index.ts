#! /usr/bin/env node
import path from "node:path";
import { execSync } from "node:child_process";
import { move, readFile, rm, writeFile } from "fs-extra";

// Vercel build paths
const vercelPath = path.resolve(".vercel");
const vercelBackupPath = path.resolve(".vercel.bak");

/** Read and write JSON config files */
const readJsonConfig = async (path: string) => {
  const json = JSON.parse(await readFile(path, "utf8"));
  return {
    json,
    save: () => writeFile(path, JSON.stringify(json, null, 2)),
  };
};

/** Get the function name for a given runtime */
const getFuncName = (suffix: string) =>
  ["__nitro", suffix.replace(/[^\w-]/, "")].filter((s) => s).join("-");

/** Get the path to a function with an optional suffix */
const getFunctionPath = (suffix = "") =>
  `output/functions/${getFuncName(suffix)}.func`;

/**
 * Set the Vercel runtime for a given route
 * @param routes Route to set the runtime for
 * @param runtime Runtime to use for the route
 */
async function setVercelRuntime(routes: string[], runtime: string) {
  // Backup current build
  await move(vercelPath, vercelBackupPath, { overwrite: true });

  // Build with Node runtime
  execSync("NITRO_PRESET=vercel NVR_RUNNING=1 npm run build", {
    stdio: "inherit",
  });

  // Copy Node build to backup
  const target = path.resolve(vercelPath, getFunctionPath());
  const destination = path.resolve(vercelBackupPath, getFunctionPath(runtime));
  await move(target, destination);
  await rm(vercelPath, { recursive: true });
  await move(vercelBackupPath, vercelPath);

  const vercelConfigPath = path.resolve(vercelPath, "output/config.json");
  const vercelConfig = await readJsonConfig(vercelConfigPath);
  const routesConfig = vercelConfig.json.routes as Array<{
    src: string;
    dest: string;
  }>;

  // Insert custom runtime route before default route
  const index = routesConfig.findIndex((route) => route.src === "/(.*)");
  if (index === -1) {
    throw new Error("Could not find default route in Vercel config");
  }

  // Save the new route
  routesConfig.splice(
    index,
    0,
    ...routes.map((route) => ({ src: route, dest: `/${getFuncName(runtime)}` }))
  );
  await vercelConfig.save();
}

(async () => {
  // Since build is run twice, we only want to run this once
  if (process.env.NVR_RUNNING !== "1") {
    const func = process.argv.slice(2);
    if (func.length === 0) {
      console.error(
        "Usage: npx @sigbit/nvr <function> [function...]"
      );
      process.exit(1);
    }

    const runtime = process.env.NVR_RUNTIME || "nodejs18.x";
    await setVercelRuntime(func, runtime);
  }
})();
