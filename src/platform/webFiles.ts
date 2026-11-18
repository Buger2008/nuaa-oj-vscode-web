import * as vscode from 'vscode';
import {
  ProblemContext,
  defaultFileName,
  languageToExtension,
  problemFolderName,
  saveContext,
  templateForLanguage,
} from '../context';

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Web 版题目文件存储：
 * - 工作区有文件夹时写入工作区（VS Code Web 的虚拟工作区同样支持 workspace.fs）；
 * - 没有打开文件夹时写入扩展 globalStorage，实现“浏览器内部存储”的单文件模式。
 */
export class WebProblemFiles {
  constructor(private storageUri: vscode.Uri) {}

  root(): vscode.Uri {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) return folders[0].uri;
    return vscode.Uri.joinPath(this.storageUri, 'problems');
  }

  problemDir(ctx: ProblemContext): vscode.Uri {
    const base = vscode.workspace.getConfiguration('nuaaOj').get<string>('problemFolder', 'nuaa-oj');
    return vscode.Uri.joinPath(this.root(), base, problemFolderName(ctx));
  }

  private storageProblemDir(ctx: ProblemContext): vscode.Uri {
    const base = vscode.workspace.getConfiguration('nuaaOj').get<string>('problemFolder', 'nuaa-oj');
    return vscode.Uri.joinPath(this.storageUri, 'problems', base, problemFolderName(ctx));
  }

  async prepare(ctx: ProblemContext, language: string): Promise<{ dir: vscode.Uri; file: vscode.Uri }> {
    let dir = this.problemDir(ctx);
    try {
      await vscode.workspace.fs.createDirectory(dir);
    } catch {
      // 工作区只读或浏览器不允许写入工作区时，退回扩展内部存储的单文件模式。
      dir = this.storageProblemDir(ctx);
      await vscode.workspace.fs.createDirectory(dir);
    }
    await saveContext(dir, ctx);
    const ext = languageToExtension(language);
    const file = vscode.Uri.joinPath(dir, defaultFileName(language));
    const templates = ctx.codeTemplates || {};
    const exact = templates[language];
    const matched = Object.entries(templates).find(([lang]) => languageToExtension(lang) === ext)?.[1];
    if (!(await exists(file))) {
      const content = exact || matched || templateForLanguage(language);
      await vscode.workspace.fs.writeFile(file, new TextEncoder().encode(content));
    }
    // 其余语言的模板也准备好，方便切换语言。
    for (const [lang, code] of Object.entries(templates)) {
      const tplFile = vscode.Uri.joinPath(dir, defaultFileName(lang));
      if (!(await exists(tplFile))) {
        await vscode.workspace.fs.writeFile(tplFile, new TextEncoder().encode(code || templateForLanguage(lang)));
      }
    }
    return { dir, file };
  }
}
