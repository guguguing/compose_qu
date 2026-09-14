# 合成大群u

纯静态网页小游戏，可直接部署到 GitHub Pages。它使用 Matter.js 实现重力、圆形碰撞、摩擦、弹性、堆叠和合成。

## 本地试玩

双击 `index.html`。首次打开需要联网加载 Matter.js。

## 图片与地面

- 把自己的 JPG 改名为 `assets/fruit-0.jpg` 至 `assets/fruit-10.jpg` 并放入文件夹即可；缺少的图片会自动显示默认 SVG。
- 图片在游戏和“待投放群u”预览中都会自动裁为圆形。
- `game.js` 中的 `FLOOR_Y` 同时是 Matter.js 碰撞地面的上表面和 Canvas 绘制地面的上沿；两者使用同一坐标，不依赖 CSS 定位。
