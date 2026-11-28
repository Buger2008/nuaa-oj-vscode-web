# NUAA OJ Web Client

在 VS Code for the Web 中使用的 NUAA OJ 扩展，与桌面版共享界面和云端 API 逻辑；不包含本地编译、终端或调试器，所有测试与提交都走 OJ 云端。

> 适用于南京航空航天大学 OJ：<https://oj.nuaa.edu.cn>

## 功能

- **登录与账号**：账号密码登录、JWT 自动续登、退出登录；凭据保存在浏览器扩展存储中。
- **题目**：自由练习题库搜索、难度与状态展示；普通题、训练题、测验题均可打开并创建代码文件。
- **云端测试**：调用 OJ 在线调试接口进行样例测试和自定义输入测试；不支持本地编译。
- **提交与记录**：云端提交、实时轮询评测结果、我的/全部提交、提交详情与测试点结果。
- **测验 / 比赛（完整支持）**：比赛列表、私有/保护赛密码注册、比赛题目、比赛提交、全部提交记录、ACM/OI 排名、倒计时、赛制/状态筛选、简介和公告。
- **其它**：排名、个人主页、系统通知、AI 助手、设置等；受服务端 CORS 限制的功能默认隐藏。
- **文件与存储**：使用 `vscode.workspace.fs`；支持 File System Access API 时可打开本地文件夹，否则降级为单文件/扩展存储，并给出提示。
- **跨平台**：面向最新版 Chrome / Edge / Firefox / Safari；不依赖 Node.js 的 `fs`、`path`、`child_process` 或 `Buffer`。

## 使用

1. 在 VS Code Web / vscode.dev 中加载本扩展。
2. 登录 NUAA OJ。
3. 从侧边栏打开自由练习、课内实验或「测验」。
4. 做题后使用「云端测试」或「提交代码」，在扩展内查看结果、提交记录和排名。

## 开发

```bash
npm install
npm run compile   # tsc --noEmit 类型检查
npm run build     # esbuild 打包 dist/web/extension.js
npx vsce package --no-dependencies --allow-missing-repository
```

调试 Web 扩展建议使用 `@vscode/test-web`，或在 vscode.dev 中加载构建产物。

## 发布

当前版本：`0.1.17`

```bash
npx vsce package --no-dependencies --allow-missing-repository
gh release create 0.1.17 -R Buger2008/nuaa-oj-vscode-web --title 0.1.17 --notes "..." --target <commit>
gh release upload 0.1.17 nuaa-oj-vscode-web-0.1.17.vsix -R Buger2008/nuaa-oj-vscode-web --clobber
```

## 已知限制

- `recommendation-api/**`（作业、学径、在线自测、能力画像等）需要服务端配置 CORS；浏览器环境默认隐藏这些入口，可用 `nuaaOj.features.recommendationApi` 开启。
- 浏览器不支持本地编译器，因此没有本地样例测试和 F5 调试；桌面版仍保留这些能力。
- 文件系统访问能力取决于浏览器；不支持 File System Access API 时只能使用单文件或扩展内部存储。
