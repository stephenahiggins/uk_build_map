import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { ProjectStatus } from "./types/projectEvidence";

const DEFAULT_STAGE_DIR = "staging";

export type StagedPayload = {
  createdAt: string;
  source: string;
  projects: ProjectStatus[];
};

export async function writeStageFile(
  projects: ProjectStatus[],
  source: string,
  stageDir: string = DEFAULT_STAGE_DIR
) {
  await mkdir(stageDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(stageDir, `stage-${timestamp}.json`);
  const payload: StagedPayload = {
    createdAt: new Date().toISOString(),
    source,
    projects,
  };
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return filePath;
}

export async function listStageFiles(stageDir: string = DEFAULT_STAGE_DIR) {
  try {
    const entries = await readdir(stageDir);
    return entries
      .filter((entry) => entry.endsWith(".json"))
      .map((entry) => path.join(stageDir, entry));
  } catch {
    return [];
  }
}

export async function readStageFile(filePath: string): Promise<StagedPayload> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as StagedPayload;
}
