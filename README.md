# world.execute(me); — 代码风 MV

一个纯前端（HTML + Canvas + WebAudio）的代码风音乐视频页面：
代码雨、字符几何图形、打字机/乱码/故障歌词特效、双侧终端 HUD、节拍脉冲、副歌全屏故障闪字。

## 快速开始

双击 `index.html` 即可打开（无需服务器、无依赖）。

| 模式 | 说明 |
|---|---|
| ▶ 播放 audio.mp3 | 把歌曲文件命名为 `audio.mp3` 放在本目录，按钮会自动出现 |
快捷键：`空格` 暂停/继续 · `M` 静音 · `F` 全屏 · `R` 重新开始 · **`T` 对轴模式** · **`L` 明暗切换**

## 和音乐对齐（对轴模式）

内置时间轴已按真实歌曲结构排布（约 3:33），但要做到逐句精确对齐：

1. 载入音频开始播放（文件选择或 audio.mp3）
2. 按 **`T`** 进入对轴模式
3. **每句歌词开唱的瞬间按 `J`** 打一个时间点（共 20 句歌词；场景/闪字时间随之顺延即可）
4. 打完（或打满自动）按 `T` → 自动生成校准后的 TIMELINE 代码，
   **复制到剪贴板**并输出在控制台（F12），贴回 `js/lyrics.js` 替换对应 lyric 行
5. `Esc` 可随时取消

对轴时建议：跟着歌曲从开头连续打完 20 个点；打错了按 `R` 重来。
导出的代码会保留每句的 fx/pos/size/rot/color 编排，只更新 `t`。

## 换成真实歌词 / 校准时间轴

所有可配置内容都在 **`js/lyrics.js`**：

```js
// 歌词行：t = 出现时间（秒），style 出场特效，fx 专属视觉
//         pos 位置 / size 大小倍率 / rot 旋转角度 / color 颜色
{ t: 8.5, type: 'lyric', text: '真实歌词写这里', style: 'type', fx: 'points',
  pos: 'ml', size: 0.95, rot: -3, color: 'cyan' },

// 独立视觉事件（不占歌词位，dur = 持续秒数）
{ t: 48.5, type: 'fx', name: 'dizzy', dur: 4 },

// 全屏闪现大字（dur = 持续秒数）
{ t: 60.2, type: 'flash', text: 'EXECUTE', dur: 0.7 },

// 只写入左侧日志
{ t: 0.2, type: 'log', text: '$ boot world.kernel' },
```

- `style` 可选：`type` 打字机 ｜ `scramble` 乱码浮现 ｜ `glitch` RGB 分裂故障
- `pos` 九宫格位置：`tl tc tr / ml mc mr / bl bc br`（默认 `mc` 中央），
  歌词切换时会平滑飞到新位置
- `size` 大小倍率（副歌建议 1.4+）｜ `rot` 倾斜角度（如 -3 / 2）｜
  `color` 颜色（`green/cyan/pink/amber/violet` 或 '#hex'）
- **换词时保留 `fx`/`pos`/`size`/`rot`/`color` 字段**，时间轴注释里标注了
  每句对应原歌词的含义（点集/圆/切线/茄子/性别切换……），对照粘贴即可
- `SCENES` 表控制每个时间段的 代码雨密度/速度、故障强度、主色调、中景图形、**明暗主题**
- 明暗主题：场景加 `theme: 'light'` 即到点自动切亮色（纸白底深墨绿）；
  播放中按 `L` 手动循环 **自动(跟随场景) → 强制亮 → 强制暗**。
  亮色配色在 `CONFIG.colorsLight`，暗色在 `CONFIG.colors`
- `CONFIG.bpm` 改节拍脉冲速度；`CONFIG.duration` 改演示模式总时长
- 主色调在 `CONFIG.colors`，也可在 `css/style.css` 的 `:root` 里改

> 本项目未内置版权歌词，占位文本为原创代码诗，结构已按
> 前奏 → 主歌1 → 预副歌 → 副歌 → 主歌2 → 副歌2 → 间奏(isolation) → EXECUTION 终曲 → 倒数 排布，
> 逐条替换文本并对照歌曲微调 `t` 即可完成同步（边播边按空格对轴）。

## 歌词专属视觉（fx 系统）

每句歌词都有贴合词义的字符动画（`js/shapes.js` 中 `fx_*` 方法，共 44 种，一句一特效）：

| fx | 对应歌词含义 | 视觉 |
|---|---|---|
| `points` | 如果我是点集 | 扫描点阵铺开 |
| `dimension` | 给你我的维度 | 点阵 1D→2D→旋转线框立方体 3D，dim 计数递增 |
| `circle` | 如果我是圆 | 一笔画出的圆（@ 笔头 + r 标注） |
| `circum` | 给你我的周长 | 圆周展开成直线 C=2πr，全部给你 |
| `sine` | 如果我是正弦波 | 坐标系中逐笔绘出 y=sin(x) |
| `circle2` | 圆周长（旧组合） | 半径扫针 + 周长展开 |
| `tangents` | 坐上我的切线 | 三条滑动切线 T1/T2/T3 |
| `infinity` | 如果我趋向无穷 | ∞ 双纽线 + 永动光点 |
| `limit` | 你就是我的极限 | 指数曲线逼近虚线 lim(me→∞)=you |
| `switch` | 切换我的电流/性别/角色 | 滑块开关左右切换打火 |
| `acdc` | 交流到直流 | 正弦/方波两侧高亮切换 + 打火 |
| `blind` | 蒙蔽我的双眼 | 百叶窗闭合遮住眼睛 ( O )→( ─ ) |
| `dizzy` | 天旋地转 | 眩晕螺旋 + 全屏晃动模糊 |
| `warp` | 穿越时间 | 向外飞驰的曲速光线 |
| `timetravel` | 公元→公元前 | 年份翻牌倒回 + 速度线 |
| `unite` | 让我们结合 | 两个光点双向奔赴合并 ✷ |
| `deeply` | 深深结合 | 同心环不断下潜 |
| `query` | 如果我能… | 巨大的 if ( ? ) 问号闪烁 |
| `vibrate` | 感受你的振动 | 波浪 + 涟漪扩散 |
| `complete` | 我就是完整 | 圆环进度走到 100% ✓ |
| `runit` | 执行我 | ▶ RUN 按钮按下 + 火花 |
| `simgrid` | 困在模拟中 | 复古透视网格地面滚动 |
| `eggplant` / `tomato` | 茄子 / 番茄 | 字符果蔬 |
| `nutrients` | 给你营养 | 绿色 + 号流向 [ you ] |
| `antiox` | 给你抗氧化物 | 双环分子护盾 |
| `catface` | 虎斑猫 | 大猫脸特写 =( o.o )= 眨眼甩尾 |
| `purr` | 为你呼噜 | 从猫猫扩散的声波弧 |
| `god` | 唯一的神 | Ω 与 16 道光芒 |
| `proof` | 存在的证明 | THEOREM 定理框 + Q.E.D ∎ 盖章 |
| `gender` | 女到男 | ♀ ♂ 符号翻转 |
| `whatever` | 做你想要的一切 | ¯\_(ツ)_/¯ 耸肩 + 散落字母 |
| `clock` | 清晨到夜晚 | 双针疯转时钟 + AM/PM 翻牌 |
| `sm` | S到M | S/M 大字抖动互换 |
| `enter` | 让我进入 | 双开门打开光点涌出 |
| `trance` | 进入恍惚 | 向心迷幻漩涡 |
| `left` | 你离开了我 | [ you ] 转身走远，peer offline |
| `left6` | 你已离开 ×6 | 六个节点逐一变红离线 + 字符飘散 |
| `shrink` | 孤独隔离 | 字符牢笼不断收缩 |
| `erase` | 删除碎片 | 碎片被光标逐一删除 |
| `maybe` | 那么也许… | 问号成群飘浮 |
| `heartbreak` | 心碎 | 心脏裂开两半坠落 |
| `challenge` | 挑战你的神 | ME vs GOD 对撞火花 |
| `illegal` | 非法参数 | 红色 FATAL EXCEPTION 报错弹窗 |
| `exec` | EXECUTION ×12 | 12 段进度环，自动跟随闪字计数 |

## 中景字符图形

`js/shapes.js` 中每个场景一种字符画，全部由字符拼成：

- `geometry`：扫描点阵 + 字符圆（C = 2πr）+ 正弦波与移动切线
- `waves`：正弦波(AC) / 方波(DC)
- `storm`：副歌字符爆炸 + 节拍冲击环
- `life`：会眨眼的 ASCII 猫猫 + 漂浮音符
- `void`：isolation 的孤独光标
- `countdown`：旋转刻度环


## 文件结构

```
world-execute-me/
├── index.html        页面结构
├── css/style.css     霓虹/故障/扫描线等全部样式
└── js/
    ├── lyrics.js     ★ 时间轴 & 场景 & 文案配置（主要改这里）
    ├── rain.js       代码雨
    ├── shapes.js     字符几何图形
    ├── terminal.js   日志终端 & 自动打字代码编辑器
    └── main.js       主引擎（时钟/调度/特效）
```
