import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const archivePath = path.join(rootDir, "dist.tar.gz");

if (!fs.existsSync(distDir)) {
  console.error("❌ 'dist' directory not found after build.");
  process.exit(1);
}

try {
  console.log("📦 Packaging dist into dist.tar.gz...");
  // Relative paths + cwd: Windows tar treats "C:" in absolute paths as a remote host
  execSync("tar -czf dist.tar.gz dist", { stdio: "inherit", cwd: rootDir });

  const stats = fs.statSync(archivePath);
  console.log(
    `✅ Successfully created dist.tar.gz (${(stats.size / 1024 / 1024).toFixed(2)} MB) and kept dist/ directory ready for deployment!`
  );
} catch (err) {
  console.error("⚠️ Failed to package dist.tar.gz:", err.message);
  process.exit(1);
}

