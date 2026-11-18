import * as vscode from 'vscode';

export interface BrowserCapabilities {
  isWeb: boolean;
  hasFileSystemAccess: boolean;
  hasLocalStorage: boolean;
}

/**
 * 检测浏览器能力。扩展在 web worker 中运行时 navigator 可能不可用，
 * 因此所有能力判断都做防御性处理；缺失时降级为单文件/扩展内部存储。
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  const nav = (globalThis as any).navigator;
  return {
    isWeb: vscode.env.uiKind === vscode.UIKind.Web,
    hasFileSystemAccess: !!nav?.storage && typeof nav.storage.getDirectory === 'function',
    hasLocalStorage: typeof (globalThis as any).localStorage !== 'undefined',
  };
}

export async function notifyBrowserCapabilities(context: vscode.ExtensionContext): Promise<void> {
  const caps = detectBrowserCapabilities();
  if (!caps.isWeb || caps.hasFileSystemAccess) return;
  const key = 'nuaaOj.web.capabilityNoticeShown';
  if (context.globalState.get<boolean>(key)) return;
  await context.globalState.update(key, true);
  void vscode.window.showInformationMessage(
    '当前浏览器不支持 File System Access API。可以继续使用单文件模式，题目和代码会保存在扩展内部存储中；需要打开本地文件夹时请使用最新版 Chrome/Edge。',
  );
}
