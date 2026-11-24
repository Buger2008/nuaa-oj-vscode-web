import * as vscode from 'vscode';
import { ProblemDetail } from './types';
import { Sample, parseSamples } from './samples';

export type ProblemKind = 'problem' | 'training' | 'contest';

export interface ProblemContext {
  version: 1;
  kind: ProblemKind;
  displayId: string;
  pid: number;
  tid?: number;
  cid?: number;
  gid?: number;
  title: string;
  timeLimit: number;
  memoryLimit: number;
  isFileIO: boolean;
  ioReadFileName?: string | null;
  ioWriteFileName?: string | null;
  samples: Sample[];
  language?: string;
  /** Languages this problem actually allows (from detail.languages). */
  allowedLanguages?: string[];
  /** User-preferred submission language (must be within allowedLanguages). */
  selectedLanguage?: string;
  /** Raw problem description HTML (used to extract "code to modify"). */
  description?: string;
  /** Problem-specific code templates per language (from detail.codeTemplate). */
  codeTemplates?: Record<string, string>;
  url: string;
  solutionFile?: string;
}

export const META_FILENAME = '.nuaa-oj.json';

const EXT_BY_LANGUAGE: Array<[RegExp, string]> = [
  [/^C With O2$/i, '.c'],
  [/^C$/i, '.c'],
  [/^C\+\+/i, '.cpp'],
  [/^Java$/i, '.java'],
  [/^(Python|PyPy)/i, '.py'],
  [/^Golang$/i, '.go'],
  [/^C#$/, '.cs'],
  [/^PHP$/i, '.php'],
  [/^JavaScript/i, '.js'],
  [/^Ruby$/i, '.rb'],
  [/^Rust$/i, '.rs'],
];

const LANGUAGE_BY_EXT: Record<string, string> = {
  '.c': 'C',
  '.cc': 'C++',
  '.cpp': 'C++',
  '.cxx': 'C++',
  '.hpp': 'C++',
  '.java': 'Java',
  '.py': 'Python3',
  '.go': 'Golang',
  '.cs': 'C#',
  '.php': 'PHP',
  '.js': 'JavaScript Node',
  '.mjs': 'JavaScript Node',
  '.rb': 'Ruby',
  '.rs': 'Rust',
};

export function languageToExtension(language: string): string {
  for (const [re, ext] of EXT_BY_LANGUAGE) {
    if (re.test(language)) return ext;
  }
  return '.txt';
}

export function extensionToLanguage(ext: string): string | undefined {
  return LANGUAGE_BY_EXT[ext.toLowerCase()];
}

export function defaultFileName(language: string): string {
  const ext = languageToExtension(language);
  if (ext === '.java') return 'Main.java';
  if (ext === '.cs') return 'Main.cs';
  return 'main' + ext;
}

const TEMPLATES: Record<string, string> = {
  '.c': '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n',
  '.cpp':
    '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    return 0;\n}\n',
  '.java':
    'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n',
  '.py': '# -*- coding: utf-8 -*-\nimport sys\n\ndef main():\n    data = sys.stdin.read().split()\n    \n\nif __name__ == "__main__":\n    main()\n',
  '.go': 'package main\n\nimport (\n\t"bufio"\n\t"fmt"\n\t"os"\n)\n\nfunc main() {\n\t_ = bufio.NewReader(os.Stdin)\n\t_ = fmt.Print\n}\n',
  '.cs': 'using System;\n\nclass Program {\n    static void Main() {\n        \n    }\n}\n',
  '.php': '<?php\n\n$input = trim(stream_get_contents(STDIN));\n\n',
  '.js': "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\n\n",
  '.rb': '# frozen_string_literal: true\n\n',
  '.rs': 'use std::io::{self, Read};\n\nfn main() {\n    let mut s = String::new();\n    io::stdin().read_to_string(&mut s).unwrap();\n}\n',
};

export function templateForLanguage(language: string): string {
  return TEMPLATES[languageToExtension(language)] ?? '\n';
}

export function sanitizeName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .slice(0, 60);
}

function extName(filePath: string): string {
  const clean = filePath.split(/[?#]/)[0];
  const slash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  const dot = clean.lastIndexOf('.');
  return dot > slash ? clean.slice(dot).toLowerCase() : '';
}

export function buildContext(
  kind: ProblemKind,
  detail: ProblemDetail,
  baseUrl: string,
  tid?: number,
  gid?: number,
  cid?: number,
  displayId?: string,
): ProblemContext {
  const p = detail.problem;
  const did = displayId || String(p.problemId);
  const url =
    kind === 'training'
      ? `${baseUrl}/training/${tid}/problem/${did}`
      : kind === 'contest'
        ? `${baseUrl}/contest/${cid}/problem/${did}`
        : `${baseUrl}/problem/${did}`;
  return {
    version: 1,
    kind,
    displayId: did,
    pid: p.id,
    tid,
    cid,
    gid: gid ?? p.gid ?? undefined,
    title: p.title,
    timeLimit: p.timeLimit,
    memoryLimit: p.memoryLimit,
    isFileIO: !!p.isFileIO,
    ioReadFileName: p.ioReadFileName ?? null,
    ioWriteFileName: p.ioWriteFileName ?? null,
    samples: parseSamples(p.examples),
    allowedLanguages: Array.isArray(detail.languages) && detail.languages.length ? detail.languages.slice() : undefined,
    description: p.description,
    codeTemplates: detail.codeTemplate && typeof detail.codeTemplate === 'object' ? detail.codeTemplate : undefined,
    url,
  };
}

/**
 * Determine the language to use, honoring per-problem restrictions.
 * - If the problem allows exactly one language, it is forced.
 * - Otherwise prefer user's selected language, then the file's language, then the default,
 *   but only if it is allowed.
 */
export function pickLanguage(
  ctx: ProblemContext,
  fileLanguage: string | undefined,
  configDefault: string,
): string {
  const allowed = ctx.allowedLanguages && ctx.allowedLanguages.length ? ctx.allowedLanguages : undefined;
  if (allowed && allowed.length === 1) return allowed[0];
  const candidates = [ctx.selectedLanguage, fileLanguage, configDefault].filter(Boolean) as string[];
  for (const c of candidates) {
    if (!allowed || allowed.includes(c)) return c;
  }
  if (allowed) return allowed[0];
  return configDefault || fileLanguage || 'C';
}

export function isLanguageLocked(ctx: ProblemContext): boolean {
  return !!ctx.allowedLanguages && ctx.allowedLanguages.length === 1;
}

/**
 * The submission language should follow the actual file being submitted.
 * A user-selected language is honored only when its file extension matches the
 * active file (e.g. "C With O2" on a .c file), otherwise we use the file extension.
 */
export function submissionLanguage(ctx: ProblemContext, filePath: string): string | undefined {
  const ext = extName(filePath);
  const fileLang = extensionToLanguage(ext);
  const sel = ctx.selectedLanguage;
  if (sel && languageToExtension(sel) === ext) {
    if (!ctx.allowedLanguages || ctx.allowedLanguages.length === 0 || ctx.allowedLanguages.includes(sel)) {
      return sel;
    }
  }
  return fileLang;
}

export function problemFolderName(ctx: ProblemContext): string {
  // Use the problem number/ID only. Titles are often Chinese and non-ASCII paths can
  // break toolchain paths; the same rule is kept on Web for stable folder names.
  if (ctx.kind === 'contest' && ctx.cid) return sanitizeName(`contest-${ctx.cid}-${ctx.displayId}`) || 'problem';
  return sanitizeName(ctx.displayId) || 'problem';
}

let storageRoot: vscode.Uri | undefined;
let tempRoot: vscode.Uri | undefined;

/** Called once from activate() with context.globalStorageUri. */
export function setStorageRoot(uri: vscode.Uri | undefined): void {
  storageRoot = uri;
}

export function setTempRoot(uri: vscode.Uri | undefined): void {
  tempRoot = uri;
}

function randomId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Create (once) a browser-internal temp workspace under extension global storage. */
export async function ensureTempRoot(): Promise<vscode.Uri> {
  if (tempRoot) return tempRoot;
  if (!storageRoot) throw new Error('Web 存储根目录未初始化');
  tempRoot = vscode.Uri.joinPath(storageRoot, 'temp', 'nuaa-oj-' + randomId());
  await vscode.workspace.fs.createDirectory(tempRoot);
  return tempRoot;
}

export async function cleanupTempRoot(): Promise<void> {
  if (!tempRoot) return;
  const root = tempRoot;
  tempRoot = undefined;
  try {
    await vscode.workspace.fs.delete(root, { recursive: true, useTrash: false });
  } catch {
    /* ignore */
  }
}

export function hasWorkspaceFolder(): boolean {
  const folders = vscode.workspace.workspaceFolders;
  return !!folders && folders.length > 0;
}

export function workspaceRoot(): vscode.Uri | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) return folders[0].uri;
  return tempRoot;
}

export function problemFolderUri(ctx: ProblemContext): vscode.Uri | undefined {
  const root = workspaceRoot();
  if (!root) return undefined;
  const base = vscode.workspace.getConfiguration('nuaaOj').get<string>('problemFolder', 'nuaa-oj');
  return vscode.Uri.joinPath(root, base, problemFolderName(ctx));
}

export async function saveContext(folder: vscode.Uri, ctx: ProblemContext): Promise<void> {
  await vscode.workspace.fs.createDirectory(folder);
  const metaUri = vscode.Uri.joinPath(folder, META_FILENAME);
  const data = new TextEncoder().encode(JSON.stringify(ctx, null, 2));
  await vscode.workspace.fs.writeFile(metaUri, data);
}

/** Load a problem context whose solution file lives in `dirUri`. */
export async function loadContextFromDir(dirUri: vscode.Uri): Promise<ProblemContext | undefined> {
  const metaUri = vscode.Uri.joinPath(dirUri, META_FILENAME);
  try {
    const raw = await vscode.workspace.fs.readFile(metaUri);
    const ctx = JSON.parse(new TextDecoder().decode(raw)) as ProblemContext;
    if (ctx && ctx.version === 1 && ctx.displayId) return ctx;
  } catch {
    /* not found */
  }
  return undefined;
}

export async function loadContextForFile(fileUri: vscode.Uri): Promise<ProblemContext | undefined> {
  return loadContextFromDir(vscode.Uri.joinPath(fileUri, '..'));
}

export async function findContextInWorkspaceByDisplayId(
  displayId: string,
): Promise<{ ctx: ProblemContext; dir: vscode.Uri } | undefined> {
  const root = workspaceRoot();
  if (!root) return undefined;
  const base = vscode.workspace.getConfiguration('nuaaOj').get<string>('problemFolder', 'nuaa-oj');
  const baseUri = vscode.Uri.joinPath(root, base);
  try {
    const entries = await vscode.workspace.fs.readDirectory(baseUri);
    for (const [name, type] of entries) {
      if (type !== vscode.FileType.Directory) continue;
      const dir = vscode.Uri.joinPath(baseUri, name);
      const ctx = await loadContextFromDir(dir);
      if (ctx && ctx.displayId === displayId) return { ctx, dir };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
