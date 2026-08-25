# 《我在精神病院斩神》人生模拟器

一个纯前端的中文人生模拟器，适合直接部署到 GitHub Pages。

斩神一键网页玩，点点星标。

## 本地运行

在项目目录执行：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000
```

## 一键发布到 GitHub Pages

1. 新建一个公开 GitHub 仓库。
2. 把整个项目推到 `main` 分支。
3. 仓库里的 GitHub Actions 会自动打包并发布到 Pages。
4. 第一次需要在仓库 Settings 里把 Pages Source 设为 `GitHub Actions`。
5. 之后每次 `git push`，都会自动更新站点。

## 说明

这是静态站点，不依赖后端。  
手机、平板、电脑都可以直接打开。
