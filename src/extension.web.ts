import * as vscode from 'vscode';
import { AuthManager } from './auth';
import { HomeCallbacks, HomeViewProvider } from './homeView';
import { LoginPanel } from './loginPanel';
import { notifyBrowserCapabilities } from './platform/browser';
import { setStorageRoot } from './context';
import { WebOjService } from './service.web';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  setStorageRoot(context.globalStorageUri);
  const auth = new AuthManager(context);
  await auth.restore();
  await notifyBrowserCapabilities(context);

  const output = vscode.window.createOutputChannel('NUAA OJ Web');
  const providerRef: { current?: HomeViewProvider } = {};
  const service = new WebOjService(auth, output, context, context.extensionUri, () => providerRef.current?.refresh());
  const callbacks: HomeCallbacks = createCallbacks(auth, service, providerRef);
  providerRef.current = new HomeViewProvider(auth, context.extensionUri, callbacks);
  context.subscriptions.push(output);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(HomeViewProvider.viewType, providerRef.current, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand('nuaaOj.login', () =>
      LoginPanel.show(auth, baseUrl(), () => providerRef.current?.refresh()),
    ),
    vscode.commands.registerCommand('nuaaOj.logout', async () => {
      await auth.logout();
      providerRef.current?.refresh();
    }),
    vscode.commands.registerCommand('nuaaOj.openProblem', () => service.openProblemPrompt()),
    vscode.commands.registerCommand('nuaaOj.openFromClipboard', () => service.openFromClipboard()),
    vscode.commands.registerCommand('nuaaOj.testCurrent', () => service.testCurrent()),
    vscode.commands.registerCommand('nuaaOj.submitCurrent', () => service.submitCurrent()),
    vscode.commands.registerCommand('nuaaOj.showProblem', () => service.showProblemForActive()),
    vscode.commands.registerCommand('nuaaOj.openInBrowser', () => service.openInBrowserActive()),
    vscode.commands.registerCommand('nuaaOj.refreshProblems', () => providerRef.current?.refresh()),
    vscode.commands.registerCommand('nuaaOj.openAssistantGeneral', () => service.openAssistantGeneral()),
    vscode.commands.registerCommand('nuaaOj.openSettings', () => service.openSettings()),
  );

  // 供调试查看，避免 provider/service 被误判未使用。
  console.log('[nuaa-oj-web] activated', { service, provider: providerRef.current });
}

function baseUrl(): string {
  return vscode.workspace.getConfiguration('nuaaOj').get<string>('baseUrl', 'https://oj.nuaa.edu.cn').replace(/\/+$/, '');
}

function createCallbacks(
  auth: AuthManager,
  service: WebOjService,
  providerRef: { current?: HomeViewProvider },
): HomeCallbacks {
  return {
    openProblem: async (value) => {
      await service.openProblem(value);
    },
    openLogin: () => LoginPanel.show(auth, baseUrl(), () => providerRef.current?.refresh()),
    logout: async () => {
      await auth.logout();
      providerRef.current?.refresh();
    },
    openUrl: (url) => void vscode.env.openExternal(vscode.Uri.parse(url)),
    openProfile: () => void service.openProfile(),
    openSettings: () => void service.openSettings(),
    openMessages: () => void service.openMessages(),
    openMyHome: () => void service.openMyHome(),
    openLearning: () => void service.openLearning(),
    openUser: (uid, username) => void service.openUserHome(uid, username),
    openSubmission: (submitId) => void service.openSubmission(submitId),
    cleanAccepted: () => void service.cleanAcceptedCode(),
    onChange: () => providerRef.current?.refresh(),
  };
}

export function deactivate(): void {
  // no-op
}
