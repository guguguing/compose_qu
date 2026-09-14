# 合成大西瓜

纯静态网页小游戏，可直接部署到 GitHub Pages。它使用 Matter.js 实现重力、圆形碰撞、摩擦、弹性、堆叠和合成。

## 本地试玩

双击 `index.html`。首次打开需要联网加载 Matter.js。

## 图片与地面

- 把自己的 JPG 改名为 `assets/fruit-0.jpg` 至 `assets/fruit-10.jpg` 并放入文件夹即可；缺少的图片会自动显示默认 SVG。
- 图片在游戏和“待投放水果”预览中都会自动裁为圆形。
- `game.js` 中的 `FLOOR_Y` 同时是 Matter.js 碰撞地面的上表面和 Canvas 绘制地面的上沿；两者使用同一坐标，不依赖 CSS 定位。

## 发布到 GitHub Pages

新建一个 Public GitHub 仓库后，在本项目文件夹打开终端并运行：

```bash
git init
git add .
git commit -m "发布合成大西瓜游戏"
git branch -M main
git remote add origin https://github.com/你的用户名/watermelon-game.git
git push -u origin main
```

然后到仓库的 **Settings → Pages**，选择 **Deploy from a branch**，选择 `main` 和 `/(root)`，保存。网址为 `https://你的用户名.github.io/watermelon-game/`。
