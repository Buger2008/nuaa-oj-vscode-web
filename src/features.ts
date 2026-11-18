import * as vscode from 'vscode';

/**
 * Temporary capability switch for features backed by `/recommendation-api/**`.
 *
 * The OJ server currently exposes CORS headers only for `/api/**`; browser
 * fetches to `/recommendation-api/**` are blocked at the preflight stage. The
 * desktop extension is unaffected because it runs in the Node.js extension
 * host. Keep the implementation in this web client, but hide every UI entry
 * point until the server adds CORS for `/recommendation-api/**`.
 *
 * Set `nuaaOj.features.recommendationApi` to true after the server-side fix to
 * restore homework, learning path, AI assistant, ability profile and online
 * self-tests without touching their code.
 */
export function recommendationApiEnabled(): boolean {
  return vscode.workspace.getConfiguration('nuaaOj').get<boolean>('features.recommendationApi', false);
}
