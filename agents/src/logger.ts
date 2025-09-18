import fs from "fs";
import path from "path";

const globalLogFilePath = path.resolve(process.cwd(), "cli.log");
fs.writeFileSync(globalLogFilePath, "");
const globalLogStream = fs.createWriteStream(globalLogFilePath, { flags: "a" });

export function log(...args: any[]) {
  const msg = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
    .join(" ");
  console.log(...args);
  globalLogStream.write(msg + "\n");
}
