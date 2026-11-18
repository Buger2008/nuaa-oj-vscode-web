# NUAA OJ Web

NUAA OJ 的 VS Code for the Web 版本骨架。

## 定位

- 复用桌面版的界面与 API 层（侧边栏、题目、题面、记录、排名、AI 助手等）。
- 不包含本地编译器、终端和 F5 调试；测试与提交全部走云端。
- 文件读写统一使用 `vscode.workspace.fs`，不依赖 Node.js 的 `fs` / `path` / `child_process` / `Buffer`。
- 浏览器支持 File System Access API 时可打开本地文件夹；不支持时降级为单文件/扩展内置存储，并给出提示。

## 开发

```bash
npm install
npm run compile   # tsc --noEmit 类型检查
npm run build     # esbuild 打包 dist/web/extension.js
```

调试 Web 扩展建议使用 `@vscode/test-web`，或在 vscode.dev 中加载本地构建产物。

## 当前状态

- 已迁移：`api.ts`、`auth.ts`、全部面板与 `homeView.ts`、`resources/`。
- 已接入：题目打开/代码文件创建、云端样例测试、正式提交与轮询、记录/提交详情、排名、个人主页、学习/学径、设置、系统通知、AI 助手等云端 API。
- 已适配：浏览器 `globalState` 登录凭据、`vscode.workspace.fs` 文件读写、工作区不可写时回退到扩展内部存储、临时目录使用 `globalStorageUri`。
- 下一步：用 `@vscode/test-web` 或 vscode.dev 做真实浏览器加载和 OJ API/CORS 实测，再处理剩余平台差异。
