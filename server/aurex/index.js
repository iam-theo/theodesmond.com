import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, cpSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { query, initDb } from "../db.js";
import { aurexWorkspacePath, projectFolder, type RunStatus, type ProjectStatus } from "./aurex/shared/src/index.js";

const here = dirname(fileURLToPath(import.meta.url));

// Configuration
const AUREX_WORKSPACE_ROOT = process.env.AUREX_WORKSPACE_ROOT || join(here, "..", "..", "aurex-workspaces");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Types
export interface AurexRunRequest {
  prompt: string;
  projectId?: string;
  files?: Record<string, string>;
  model?: string;
  timeoutMs?: number;
}

export interface AurexRunResult {
  id: string;
  status: RunStatus;
  result?: string;
  error?: string;
  files?: Record<string, string>;
  exitCode?: number;
  startedAt: string;
  completedAt?: string;
}

export interface FileOperation {
  type: "read" | "write" | "delete" | "list";
  path: string;
  content?: string;
  recursive?: boolean;
}

export interface FileOperationResult {
  success: boolean;
  content?: string;
  files?: Array<{ name: string; type: "file" | "directory"; size: number }>;
  error?: string;
}

export interface DiffResult {
  path: string;
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
}

/**
 * AureX Engine - Standalone integration for theodesmond.com
 * Provides code execution, file operations, and project management
 * without tight coupling to the main AureX SaaS infrastructure.
 */
export class AurexEngine {
  private workspaceRoot: string;
  private dbInitialized: boolean = false;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || AUREX_WORKSPACE_ROOT;
    this.ensureWorkspaceRoot();
  }

  private ensureWorkspaceRoot() {
    if (!this.dbInitialized) {
      // Database will be initialized on first use
      this.dbInitialized = true;
    }
    mkdirSync(this.workspaceRoot, { recursive: true });
  }

  /**
   * Initialize database tables for AureX projects and runs
   */
  async initializeDatabase() {
    await initDb();
    // Tables will be created by the main schema.sql
  }

  /**
   * Create a new project
   */
  async createProject(name: string, description?: string): Promise<{ id: string; name: string; path: string }> {
    const folder = projectFolder(name);
    const projectPath = join(this.workspaceRoot, folder);
    
    mkdirSync(projectPath, { recursive: true });
    
    const { rows } = await query(
      `insert into projects (name, description, status, path) values ($1, $2, 'active', $3) returning id`,
      [name, description || "", projectPath]
    );
    
    return { id: rows[0].id, name, path: projectPath };
  }

  /**
   * Get project by ID
   */
  async getProject(id: string) {
    const { rows } = await query("select * from projects where id = $1", [id]);
    return rows[0] || null;
  }

  /**
   * List all projects
   */
  async listProjects() {
    const { rows } = await query("select * from projects order by created_at desc");
    return rows;
  }

  /**
   * Read file content
   */
  async readFile(projectId: string, filePath: string): Promise<FileOperationResult> {
    const project = await this.getProject(projectId);
    if (!project) return { success: false, error: "Project not found" };

    const fullPath = join(project.path, filePath);
    
    try {
      if (!fullPath.startsWith(this.workspaceRoot)) {
        return { success: false, error: "Access denied: path outside workspace" };
      }
      
      const content = readFileSync(fullPath, "utf-8");
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Read failed" };
    }
  }

  /**
   * Write file content
   */
  async writeFile(projectId: string, filePath: string, content: string): Promise<FileOperationResult> {
    const project = await this.getProject(projectId);
    if (!project) return { success: false, error: "Project not found" };

    const fullPath = join(project.path, filePath);
    
    try {
      if (!fullPath.startsWith(this.workspaceRoot)) {
        return { success: false, error: "Access denied: path outside workspace" };
      }
      
      if (Buffer.byteLength(content, "utf-8") > MAX_FILE_SIZE) {
        return { success: false, error: "File too large" };
      }

      // Ensure directory exists
      const dir = dirname(fullPath);
      mkdirSync(dir, { recursive: true });
      
      writeFileSync(fullPath, content, "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Write failed" };
    }
  }

  /**
   * Delete file or directory
   */
  async deleteFile(projectId: string, filePath: string, recursive = false): Promise<FileOperationResult> {
    const project = await this.getProject(projectId);
    if (!project) return { success: false, error: "Project not found" };

    const fullPath = join(project.path, filePath);
    
    try {
      if (!fullPath.startsWith(this.workspaceRoot)) {
        return { success: false, error: "Access denied: path outside workspace" };
      }
      
      rmSync(fullPath, { recursive, force: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
    }
  }

  /**
   * List directory contents
   */
  async listFiles(projectId: string, dirPath = ""): Promise<FileOperationResult> {
    const project = await this.getProject(projectId);
    if (!project) return { success: false, error: "Project not found" };

    const fullPath = join(project.path, dirPath);
    
    try {
      if (!fullPath.startsWith(this.workspaceRoot)) {
        return { success: false, error: "Access denied: path outside workspace" };
      }
      
      const entries = readdirSync(fullPath, { withFileTypes: true });
      const files = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        size: entry.isFile() ? statSync(join(fullPath, entry.name)).size : 0
      }));
      
      return { success: true, files };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "List failed" };
    }
  }

  /**
   * Generate unified diff between two strings
   */
  generateDiff(oldContent: string, newContent: string, path: string): DiffResult {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    
    let additions = 0;
    let deletions = 0;
    
    // Simple diff algorithm
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === undefined) {
        additions++;
      } else if (newLine === undefined) {
        deletions++;
      } else if (oldLine !== newLine) {
        deletions++;
        additions++;
      }
    }
    
    return { path, oldContent, newContent, additions, deletions };
  }

  /**
   * Apply a diff (for preview)
   */
  applyDiff(oldContent: string, diff: DiffResult): string {
    return diff.newContent;
  }

  /**
   * Execute a command in the project directory
   */
  async executeCommand(projectId: string, command: string, timeoutMs = 60000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    
    try {
      const result = execSync(command, {
        cwd: project.path,
        timeout: timeoutMs,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
      return { stdout: result.toString(), stderr: "", exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout?.toString() || "",
        stderr: err.stderr?.toString() || err.message,
        exitCode: err.status ?? 1
      };
    }
  }

  /**
   * Git operations
   */
  async gitStatus(projectId: string): Promise<string> {
    const result = await this.executeCommand(projectId, "git status --short");
    return result.stdout;
  }

  async gitDiff(projectId: string, cached = false): Promise<string> {
    const flag = cached ? "--cached" : "";
    const result = await this.executeCommand(projectId, `git diff ${flag}`);
    return result.stdout;
  }

  async gitCommit(projectId: string, message: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    const result = await this.executeCommand(projectId, `git add -A && git commit -m "${message.replace(/"/g, '\\"')}"`);
    if (result.exitCode === 0) {
      const hashResult = await this.executeCommand(projectId, "git rev-parse HEAD");
      return { success: true, hash: hashResult.stdout.trim() };
    }
    return { success: false, error: result.stderr };
  }

  /**
   * Search files by content
   */
  async searchFiles(projectId: string, pattern: string, filePattern?: string): Promise<Array<{ file: string; line: number; content: string }>> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    
    const cmd = `grep -r -n ${filePattern ? `--include="${filePattern}" ` : ""}"${pattern.replace(/"/g, '\\"')}" .`;
    const result = await this.executeCommand(projectId, cmd);
    
    const results = [];
    for (const line of result.stdout.split("\n")) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        results.push({ file: match[1], line: parseInt(match[2]), content: match[3] });
      }
    }
    return results;
  }
}

/**
 * Create a singleton instance
 */
let aurexEngineInstance: AurexEngine | null = null;

export function getAurexEngine(): AurexEngine {
  if (!aurexEngineInstance) {
    aurexEngineInstance = new AurexEngine();
  }
  return aurexEngineInstance;
}

export { AurexEngine as default };