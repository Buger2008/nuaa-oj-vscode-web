import * as vscode from 'vscode';

/**
 * 仅用于兼容原 service 中“清理已通过代码”的文件遍历代码。
 * 实际读写全部转成 vscode.workspace.fs，绝不导入 Node 的 fs。
 */

export function existsSync(_filePath: string): boolean {
  // workspace.fs 没有同步 stat；调用处会再走 readdir 的 catch 分支处理不存在。
  return true;
}

interface DirentLike {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
}

function uriOf(filePath: string): vscode.Uri {
  return vscode.Uri.file(filePath);
}

export const promises = {
  async readdir(dirPath: string, _options?: { withFileTypes?: boolean }): Promise<DirentLike[]> {
    const entries = await vscode.workspace.fs.readDirectory(uriOf(dirPath));
    return entries.map(([name, type]) => ({
      name,
      isDirectory: () => type === vscode.FileType.Directory,
      isFile: () => type === vscode.FileType.File,
    }));
  },
  async rm(filePath: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await vscode.workspace.fs.delete(uriOf(filePath), {
      recursive: !!options?.recursive,
      useTrash: false,
    });
  },
  async rmdir(dirPath: string): Promise<void> {
    await vscode.workspace.fs.delete(uriOf(dirPath), { recursive: false, useTrash: false });
  },
};
