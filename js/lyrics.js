/* ================================================================
 *  world.execute(me); — MV 时间轴与视觉配置
 * ----------------------------------------------------------------
 *  ★★ 如何换成真实歌词 ★★
 *  1. 下面 TIMELINE 中每条 type:'lyric' 的 text 换成对应真实歌词
 *  2. 按歌曲实际时间微调 t（秒），可用空格暂停对轴
 *  3. 场景切换时间（SCENES）与总时长（CONFIG.duration）同样可调
 *
 *  说明：本项目不内置版权歌词，占位文本为原创代码诗，
 *        结构已按 前奏/主歌1/预副歌/副歌/主歌2/副歌2/间奏/终曲 排好。
 * ================================================================ */

const CONFIG = {
  title: 'world.execute(me);',
  bpm: 128,          // 节拍脉冲（控制闪烁/震动/演示节拍速度）
  duration: 215,     // 演示模式总时长（秒）；载入真实音频后以音频为准
  colors: {
    green: '#00ff9c',
    cyan: '#00e5ff',
    pink: '#ff2d78',
    amber: '#ffd166',
    violet: '#b388ff',
  },
};

/* ----------------------------------------------------------------
 * 场景表：到 t 秒时切换为该场景
 *   rain   代码雨密度 0~1      speed  雨速倍率
 *   glitch 故障强度 0~1        color  主色调（对应 CONFIG.colors）
 *   shape  中景字符图形: none / geometry / waves / storm / life / void / countdown
 * ---------------------------------------------------------------- */
const SCENES = [
  // intro：从近乎黑暗慢慢亮起
  { t: 0, name: 'boot', rain: 0.12, speed: 0.4, glitch: 0, color: 'green', shape: 'none' },
  { t: 7, name: 'init', rain: 0.25, speed: 0.7, glitch: 0, color: 'cyan', shape: 'none' },
  { t: 16, name: 'sim', rain: 0.35, speed: 0.9, glitch: 0.05, color: 'green', shape: 'none' },
  // verse 1：几何图形登场
  { t: 29, name: 'geometry', rain: 0.40, speed: 1.0, glitch: 0, color: 'green', shape: 'geometry' },
  // pre-chorus 1：电流切换，cyan 主调
  { t: 44, name: 'current', rain: 0.55, speed: 1.3, glitch: 0.15, color: 'cyan', shape: 'waves' },
  { t: 51, name: 'travel', rain: 0.70, speed: 1.6, glitch: 0.30, color: 'violet', shape: 'waves' },
  { t: 55, name: 'unite', rain: 0.85, speed: 1.9, glitch: 0.50, color: 'pink', shape: 'waves' },
  // chorus 1：全力爆发
  { t: 59, name: 'chorus', rain: 1.00, speed: 2.2, glitch: 0.80, color: 'pink', shape: 'storm' },
  { t: 66, name: 'chorus-b', rain: 1.00, speed: 2.5, glitch: 0.90, color: 'pink', shape: 'storm' },
  // verse 2：亮色生命段
  { t: 74, name: 'life', rain: 0.28, speed: 0.8, glitch: 0, color: 'amber', shape: 'life', theme: 'light' },
  { t: 81, name: 'life-b', rain: 0.28, speed: 0.8, glitch: 0, color: 'green', shape: 'life', theme: 'light' },
  { t: 85, name: 'life-c', rain: 0.28, speed: 0.8, glitch: 0, color: 'violet', shape: 'life', theme: 'light' },
  // pre-chorus 2：角色切换，渐入暗色
  { t: 88, name: 'roles', rain: 0.55, speed: 1.3, glitch: 0.15, color: 'violet', shape: 'waves' },
  { t: 95, name: 'roles-b', rain: 0.70, speed: 1.6, glitch: 0.35, color: 'pink', shape: 'waves' },
  { t: 99, name: 'trance', rain: 0.85, speed: 1.9, glitch: 0.55, color: 'violet', shape: 'waves' },
  // chorus 2
  { t: 103, name: 'chorus2', rain: 1.00, speed: 2.4, glitch: 0.90, color: 'pink', shape: 'storm' },
  { t: 110, name: 'chorus2-b', rain: 1.00, speed: 2.6, glitch: 1.00, color: 'pink', shape: 'storm' },
  // isolation bridge：极度收敛，只留氛围
  { t: 117, name: 'isolation', rain: 0.10, speed: 0.3, glitch: 0.03, color: 'cyan', shape: 'void' },
  { t: 125, name: 'challenge', rain: 0.20, speed: 0.5, glitch: 0.20, color: 'amber', shape: 'void' },
  { t: 131, name: 'illegal', rain: 0.40, speed: 0.8, glitch: 0.60, color: 'pink', shape: 'void' },
  // EXECUTION ×12：分三段递进
  { t: 147, name: 'exec-1', rain: 0.80, speed: 2.2, glitch: 0.80, color: 'pink', shape: 'storm' },
  { t: 151, name: 'exec-2', rain: 0.90, speed: 2.6, glitch: 0.90, color: 'pink', shape: 'storm' },
  { t: 155, name: 'exec-3', rain: 1.00, speed: 3.0, glitch: 1.00, color: 'pink', shape: 'storm' },
  // countdown
  { t: 158, name: 'countdown', rain: 0.50, speed: 1.0, glitch: 0.40, color: 'green', shape: 'countdown' },
  // coda：再现副歌，cyan 变色区分第一次
  { t: 162, name: 'coda', rain: 1.00, speed: 2.5, glitch: 0.85, color: 'cyan', shape: 'storm' },
  { t: 169, name: 'coda-b', rain: 1.00, speed: 2.7, glitch: 0.95, color: 'pink', shape: 'storm' },
  // love outro：亮色，极简，呼吸感
  { t: 177, name: 'love', rain: 0.12, speed: 0.3, glitch: 0, color: 'violet', shape: 'void', theme: 'light' },
  { t: 184, name: 'love-b', rain: 0.12, speed: 0.3, glitch: 0, color: 'amber', shape: 'void', theme: 'light' },
  { t: 191, name: 'love-c', rain: 0.18, speed: 0.4, glitch: 0.05, color: 'cyan', shape: 'void', theme: 'light' },
  // final execution：最后一击
  { t: 205, name: 'finale', rain: 1.00, speed: 3.0, glitch: 1.00, color: 'pink', shape: 'storm' },
];

/* ----------------------------------------------------------------
 * 歌词 / 事件时间轴（单位：秒）
 *   type: 'lyric'  中央大歌词
 *         style: 'type' 打字机 | 'scramble' 乱码浮现 | 'glitch' 故障抖动
 *   type: 'flash'  全屏闪现大字（dur 持续秒数，默认 0.6）
 *   type: 'log'    只写入左侧日志面板
 * ---------------------------------------------------------------- */
const TIMELINE = [
  /* ---- intro · boot (0–16s) ---- */
  { t: 0.1, type: 'log', text: '$ boot world.kernel --safe-mode' },
  { t: 0.1, type: 'fx', fx: 'boot', dur: 2.8 },
  { t: 0.1, type: 'lyric', text: 'Switch on the power line', style: 'type', pos: 'mc', size: 0.9, color: 'green' },
  { t: 1.74, type: 'lyric', text: 'Remember to put on', style: 'type', pos: 'mc', size: 0.85, color: 'green' },
  { t: 2.92, type: 'fx', fx: 'shield', dur: 1.5 },
  { t: 3.87, type: 'lyric', text: 'Lay down your pieces', style: 'type', pos: 'mc', size: 0.85, color: 'cyan' },
  { t: 5.49, type: 'log', text: 'mount /dev/heart ............ OK' },
  { t: 6.38, type: 'fx', fx: 'creation', dur: 1.8 },
  { t: 7.45, type: 'lyric', text: 'Fill in my data parameters', style: 'type', pos: 'mc', size: 0.9, color: 'cyan' },
  { t: 10.09, type: 'fx', fx: 'init', dur: 1.5 },
  { t: 11.10, type: 'lyric', text: 'Set up our new world', style: 'type', pos: 'tc', size: 1.0, color: 'green' },
  { t: 13.89, type: 'fx', fx: 'simulation', dur: 2.5 },
  { t: 16.0, type: 'lyric', text: 'world.execute(me);', style: 'type', pos: 'mc', size: 1.3, color: 'green' },
  { t: 28.0, type: 'log', text: 'process started · pid 0001' },

  /* ---- verse 1 · geometry (29.7–43.5s) ---- */
  { t: 29.71, type: 'lyric', text: 'If I\'m a set of points', style: 'type', fx: 'points', pos: 'tl', size: 0.85, rot: -2, color: 'green' },
  { t: 31.12, type: 'lyric', text: 'Then I will give you my', style: 'type', fx: 'dimension', pos: 'tr', size: 0.85, rot: 2, color: 'green' },
  { t: 32.68, type: 'flash', text: 'DIMENSION', dur: 0.7 },
  { t: 33.41, type: 'lyric', text: 'If I\'m a circle', style: 'type', fx: 'circle', pos: 'ml', size: 0.9, rot: -1, color: 'cyan' },
  { t: 34.65, type: 'lyric', text: 'Then I will give you my', style: 'type', fx: 'circum', pos: 'mr', size: 0.9, rot: 1, color: 'cyan' },
  { t: 36.29, type: 'flash', text: 'CIRCUMFERENCE', dur: 0.7 },
  { t: 37.07, type: 'lyric', text: 'If I\'m a sine wave', style: 'type', fx: 'sine', pos: 'tl', size: 0.85, rot: -3, color: 'green' },
  { t: 38.60, type: 'lyric', text: 'Then you can sit on all my', style: 'type', fx: 'tangents', pos: 'br', size: 0.85, rot: 2, color: 'green' },
  { t: 40.05, type: 'flash', text: 'TANGENTS', dur: 0.6 },
  { t: 40.71, type: 'lyric', text: 'If I approach infinity', style: 'type', fx: 'infinity', pos: 'ml', size: 1.0, rot: -1, color: 'cyan' },
  { t: 42.35, type: 'lyric', text: 'Then you can be my', style: 'type', fx: 'limit', pos: 'mc', size: 1.1, color: 'green' },
  { t: 43.51, type: 'flash', text: 'LIMITATIONS', dur: 0.9 },

  /* ---- pre-chorus 1 · current (44.5–58s) ---- */
  { t: 44.45, type: 'lyric', text: 'Switch my current', style: 'scramble', fx: 'switch', pos: 'tc', size: 1.0, color: 'cyan' },
  { t: 45.85, type: 'lyric', text: 'To AC to DC', style: 'scramble', fx: 'acdc', pos: 'mc', size: 1.1, color: 'cyan' },
  { t: 47.67, type: 'lyric', text: 'And then blind my vision', style: 'scramble', fx: 'blind', pos: 'ml', size: 0.9, rot: -2, color: 'cyan' },
  { t: 49.53, type: 'lyric', text: 'So dizzy so dizzy', style: 'scramble', fx: 'dizzy', pos: 'mc', size: 1.2, rot: 3, color: 'violet' },
  { t: 51.36, type: 'lyric', text: 'Oh we can travel', style: 'scramble', fx: 'warp', pos: 'tr', size: 0.9, rot: -1, color: 'violet' },
  { t: 53.23, type: 'lyric', text: 'To A.D to B.C', style: 'scramble', fx: 'timetravel', pos: 'mc', size: 1.1, color: 'violet' },
  { t: 55.08, type: 'lyric', text: 'And we can unite', style: 'scramble', fx: 'unite', pos: 'mc', size: 1.2, color: 'pink' },
  { t: 56.92, type: 'lyric', text: 'So deeply so deeply', style: 'scramble', fx: 'deeply', pos: 'bc', size: 1.1, color: 'pink' },
  { t: 58.5, type: 'log', text: 'WARN: voltage rising ...' },

  /* ---- chorus 1 · execution (59.2–73.5s) ---- */
  { t: 59.22, type: 'flash', text: 'EXECUTE', dur: 0.6 },
  { t: 59.69, type: 'lyric', text: 'If I can give you all the', style: 'glitch', fx: 'query', pos: 'tl', size: 1.1, rot: -8, color: 'pink' },
  { t: 61.96, type: 'flash', text: 'STIMULATIONS', dur: 0.6 },
  { t: 62.59, type: 'lyric', text: 'Then I can be your only', style: 'glitch', fx: 'vibrate', pos: 'mr', size: 1.1, rot: 7, color: 'pink' },
  { t: 65.40, type: 'flash', text: 'SATISFACTION', dur: 0.7 },
  { t: 66.60, type: 'lyric', text: 'If I can make you happy', style: 'glitch', fx: 'complete', pos: 'ml', size: 1.0, rot: -10, color: 'pink' },
  { t: 68.25, type: 'lyric', text: 'I will run the', style: 'glitch', fx: 'runit', pos: 'bc', size: 1.3, rot: 5, color: 'pink' },
  { t: 69.26, type: 'flash', text: 'EXECUTION', dur: 0.7 },
  { t: 70.08, type: 'lyric', text: 'Though we are trapped', style: 'glitch', fx: 'simgrid', pos: 'tl', size: 0.9, rot: -12, color: 'pink' },
  { t: 71.76, type: 'lyric', text: 'In this strange strange', style: 'glitch', fx: 'simgrid', pos: 'br', size: 0.9, rot: 11, color: 'pink' },
  { t: 73.17, type: 'flash', text: 'SIMULATION', dur: 0.8 },
  { t: 73.5, type: 'log', text: 'WARN: reality.mismatch (ignored)' },

  /* ---- verse 2 · life (74.0–88.5s) — 亮色，文字更柔和居中 ---- */
  { t: 74.05, type: 'lyric', text: 'If I\'m an eggplant', style: 'type', fx: 'eggplant', pos: 'tl', size: 0.9, rot: -1, color: 'amber' },
  { t: 75.42, type: 'lyric', text: 'Then I will give you my', style: 'type', fx: 'nutrients', pos: 'tr', size: 0.9, rot: 1, color: 'amber' },
  { t: 76.96, type: 'flash', text: 'NUTRIENTS', dur: 0.6 },
  { t: 77.58, type: 'lyric', text: 'If I\'m a tomato', style: 'type', fx: 'tomato', pos: 'ml', size: 0.9, rot: -1, color: 'amber' },
  { t: 79.23, type: 'lyric', text: 'Then I will give you', style: 'type', fx: 'antiox', pos: 'mr', size: 0.9, rot: 1, color: 'amber' },
  { t: 80.62, type: 'flash', text: 'ANTIOXIDANTS', dur: 0.7 },
  { t: 81.35, type: 'lyric', text: 'If I\'m a tabby cat', style: 'type', fx: 'catface', pos: 'tl', size: 0.95, rot: -2, color: 'green' },
  { t: 82.83, type: 'lyric', text: 'Then I will purr for your', style: 'type', fx: 'purr', pos: 'bc', size: 0.95, color: 'green' },
  { t: 84.27, type: 'flash', text: 'ENJOYMENT', dur: 0.7 },
  { t: 85.08, type: 'lyric', text: 'If I\'m the only god', style: 'type', fx: 'god', pos: 'mc', size: 1.1, color: 'violet' },
  { t: 86.54, type: 'lyric', text: 'Then you\'re the proof of my', style: 'type', fx: 'proof', pos: 'bc', size: 1.0, color: 'violet' },
  { t: 87.92, type: 'flash', text: 'EXISTENCE', dur: 0.6 },
  { t: 88.4, type: 'log', text: 'lifeforms.spawn(4) · purr engine ready' },

  /* ---- pre-chorus 2 · roles (88.6–103s) ---- */
  { t: 88.59, type: 'lyric', text: 'Switch my gender', style: 'scramble', fx: 'gender', pos: 'tc', size: 1.0, color: 'violet' },
  { t: 90.20, type: 'lyric', text: 'To F to M', style: 'scramble', fx: 'switch', pos: 'mc', size: 1.2, color: 'violet' },
  { t: 92.02, type: 'lyric', text: 'And then do whatever', style: 'scramble', fx: 'whatever', pos: 'mr', size: 0.9, rot: 2, color: 'violet' },
  { t: 93.95, type: 'lyric', text: 'From AM to PM', style: 'scramble', fx: 'clock', pos: 'mc', size: 1.1, color: 'violet' },
  { t: 95.47, type: 'lyric', text: 'Oh switch my role', style: 'scramble', fx: 'sm', pos: 'tc', size: 1.0, color: 'pink' },
  { t: 97.74, type: 'lyric', text: 'To S to M', style: 'scramble', fx: 'sm', pos: 'mc', size: 1.3, color: 'pink' },
  { t: 99.35, type: 'lyric', text: 'So we can enter', style: 'scramble', fx: 'enter', pos: 'ml', size: 1.0, rot: -2, color: 'pink' },
  { t: 101.47, type: 'lyric', text: 'The trance the trance', style: 'scramble', fx: 'trance', pos: 'mc', size: 1.2, color: 'violet' },
  { t: 102.8, type: 'log', text: 'enter(trance.trance)' },

  /* ---- chorus 2 · completion (103.5–117s) ---- */
  { t: 103.49, type: 'flash', text: 'EXECUTE', dur: 0.6 },
  { t: 104.20, type: 'lyric', text: 'If I can feel your', style: 'glitch', fx: 'vibrate', pos: 'tl', size: 1.1, rot: -9, color: 'pink' },
  { t: 106.29, type: 'flash', text: 'VIBRATIONS', dur: 0.7 },
  { t: 107.22, type: 'lyric', text: 'Then I can finally be', style: 'glitch', fx: 'complete', pos: 'tr', size: 1.1, rot: 8, color: 'pink' },
  { t: 110.22, type: 'flash', text: 'COMPLETION', dur: 0.6 },
  { t: 110.90, type: 'lyric', text: 'Though you have left', style: 'glitch', fx: 'left', pos: 'ml', size: 1.0, rot: -11, color: 'pink' },
  { t: 112.22, type: 'lyric', text: 'You have left × 5', style: 'glitch', fx: 'left6', pos: 'mc', size: 1.2, rot: 6, color: 'pink' },
  { t: 115.78, type: 'lyric', text: 'You have left me in', style: 'glitch', fx: 'shrink', pos: 'bc', size: 1.0, rot: -7, color: 'cyan' },
  { t: 117.27, type: 'flash', text: 'ISOLATION', dur: 0.8 },
  { t: 117.6, type: 'log', text: 'peer disconnected ×6' },

  /* ---- bridge · isolation (118–147s) ---- */
  { t: 118.33, type: 'lyric', text: 'If I can erase all the pointless', style: 'type', fx: 'erase', pos: 'mc', size: 0.95, color: 'cyan' },
  { t: 120.86, type: 'flash', text: 'FRAGMENTS', dur: 0.7 },
  { t: 121.73, type: 'lyric', text: 'Then maybe you won\'t leave me so', style: 'type', fx: 'maybe', pos: 'mc', size: 0.95, color: 'cyan' },
  { t: 124.89, type: 'flash', text: 'DISHEARTENED', dur: 0.8 },
  { t: 125.71, type: 'lyric', text: 'Challenging your god', style: 'scramble', fx: 'challenge', pos: 'mc', size: 1.1, color: 'amber' },
  { t: 128.66, type: 'lyric', text: 'You have made some', style: 'scramble', fx: 'heartbreak', pos: 'mc', size: 1.0, color: 'pink' },
  { t: 131.22, type: 'flash', text: 'ILLEGAL ARGUMENTS', dur: 1.2 },
  { t: 132.5, type: 'log', text: 'heartbeat: 0 peers connected' },
  { t: 138.0, type: 'log', text: 'challenging(god) → IllegalArgumentException' },
  { t: 145.0, type: 'log', text: 'process suspended ...' },

  /* ---- finale · EXECUTION ×12 (147.7–158.9s) ---- */
  { t: 147.66, type: 'lyric', text: 'execute( execute( execute( … ) ) )', style: 'glitch', fx: 'exec', pos: 'mc', size: 1.0, color: 'pink' },
  { t: 147.66, type: 'fx', fx: 'gun', dur: 2.5 },
  { t: 149.52, type: 'fx', fx: 'document', dur: 2.5 },
  { t: 151.52, type: 'fx', fx: 'gun', dur: 2.5 },
  { t: 153.16, type: 'fx', fx: 'document', dur: 2.5 },
  { t: 155.20, type: 'fx', fx: 'gun', dur: 2.5 },
  { t: 157.04, type: 'fx', fx: 'document', dur: 2.5 },

  /* ---- countdown (158.9–161.6s) ---- */
  { t: 158.90, type: 'flash', text: 'EIN', dur: 0.40 },
  { t: 159.32, type: 'flash', text: 'DOS', dur: 0.33 },
  { t: 159.66, type: 'flash', text: 'TROIS', dur: 0.56 },
  { t: 160.24, type: 'flash', text: 'NE', dur: 0.43 },
  { t: 160.69, type: 'flash', text: 'FEM', dur: 0.43 },
  { t: 161.12, type: 'flash', text: 'LIU', dur: 0.44 },

  /* ---- coda · chorus repeat (162–177s) ---- */
  { t: 162.63, type: 'flash', text: 'EXECUTION', dur: 0.9 },
  { t: 163.32, type: 'lyric', text: 'If I can give them all the', style: 'glitch', fx: 'query', pos: 'tl', size: 1.1, rot: -2, color: 'cyan' },
  { t: 165.17, type: 'flash', text: 'EXECUTION', dur: 0.8 },
  { t: 166.02, type: 'lyric', text: 'Then I can be your only', style: 'glitch', fx: 'vibrate', pos: 'mr', size: 1.1, rot: 2, color: 'cyan' },
  { t: 168.91, type: 'flash', text: 'EXECUTION', dur: 0.8 },
  { t: 169.82, type: 'lyric', text: 'If I can have you back', style: 'glitch', fx: 'complete', pos: 'ml', size: 1.0, rot: -1, color: 'pink' },
  { t: 171.87, type: 'lyric', text: 'I will run the', style: 'glitch', fx: 'runit', pos: 'bc', size: 1.3, color: 'pink' },
  { t: 172.71, type: 'flash', text: 'EXECUTION', dur: 0.9 },
  { t: 173.64, type: 'lyric', text: 'Though we are trapped', style: 'glitch', fx: 'simgrid', pos: 'tl', size: 0.9, rot: -3, color: 'pink' },
  { t: 174.98, type: 'lyric', text: 'We are trapped ah', style: 'glitch', fx: 'simgrid', pos: 'br', size: 0.9, rot: 3, color: 'pink' },

  /* ---- love outro (177–205s) — 亮色，呼吸感，居中为主 ---- */
  { t: 177.25, type: 'lyric', text: 'I\'ve studied', style: 'type', fx: 'proof', pos: 'mc', size: 1.1, color: 'violet' },
  { t: 179.93, type: 'flash', text: 'LO-O-OVE', dur: 0.9 },
  { t: 180.86, type: 'lyric', text: 'Question me — I can answer all', style: 'type', fx: 'query', pos: 'mc', size: 0.95, color: 'violet' },
  { t: 183.65, type: 'flash', text: 'LO-O-OVE', dur: 0.9 },
  { t: 184.54, type: 'lyric', text: 'I know the algebraic expression of', style: 'type', fx: 'limit', pos: 'mc', size: 0.9, color: 'amber' },
  { t: 187.67, type: 'flash', text: 'LO-O-OVE', dur: 0.8 },
  { t: 188.48, type: 'lyric', text: 'Though you are free — I am trapped', style: 'scramble', fx: 'shrink', pos: 'mc', size: 1.0, color: 'cyan' },
  { t: 191.36, type: 'lyric', text: 'Trapped in', style: 'scramble', fx: 'trance', pos: 'mc', size: 1.4, color: 'violet' },
  { t: 191.36, type: 'log', text: 'me.state = LOVE // infinite loop detected' },
  { t: 200.0, type: 'log', text: 'heartbeat resumed · 1 peer online' },

  /* ---- final EXECUTION (205s) ---- */
  { t: 205.81, type: 'flash', text: 'EXECUTION', dur: 1.5 },
  { t: 207.5, type: 'lyric', text: 'return 0;', style: 'type', pos: 'mc', size: 1.2, color: 'green' },
  { t: 211.0, type: 'log', text: 'process exited with code 0' },
];

/* ----------------------------------------------------------------
 * 右侧代码编辑器：每个场景对应一段自动打字的代码（原创）
 * ---------------------------------------------------------------- */
const CODE_SNIPPETS = {
  boot:
    `// world.js
import { Me } from './me.js';

const world = new World({
  gravity: 9.8,
  time: Date.now(),
  render: 'chars',
});

world.on('ready', () => {
  world.execute(me);
});`,

  geometry:
    `// geometry.js
class Me extends Shape {
  dimension()     { return Infinity; }
  circumference() { return 2 * Math.PI * this.r; }
  tangent(x) {
    return Math.cos(x) / Math.sin(x);
  }
  limit(to) {
    // me -> ∞, you = my limit
    return to.you;
  }
}`,

  current:
    `// circuit.js
let current = 'AC';

function switchCurrent(me) {
  current = current === 'AC' ? 'DC' : 'AC';
  me.vision.blind = true;
  me.dizziness += 1;
  return travel('A.D', 'B.C');
}`,

  chorus:
    `// execute.js
async function chorus(me, you) {
  if (await me.can(stimulate(you))) {
    me.become(you.onlySatisfaction);
  }
  if (me.makes(you.happy)) {
    return me.run(EXECUTION);
  }
  // trapped in this strange simulation
}`,

  life:
    `// life.js
const forms = [
  { as: 'Eggplant', gives: 'nutrients' },
  { as: 'Tomato',   gives: 'antioxidants' },
  { as: 'TabbyCat', does: () => purr() },
  { as: 'God',      proof: (you) => you },
];

for (const f of forms) me.become(f);`,

  roles:
    `// roles.js
function switchRole(me) {
  me.gender = toggle('F', 'M');
  me.role   = toggle('S', 'M');
  schedule('AM', 'PM', () => {
    enter(trance.trance);
  });
}`,

  chorus2:
    `// completion.js
try {
  me.feel(you.vibrations);
  me.state = COMPLETION;
} catch (e) {
  // you have left
  me.state = ISOLATION;
  throw e;
}`,

  isolation:
    `// isolation.js
while (you.gone) {
  me.wait(Infinity);
}
peers.disconnect();      // 0 online
heartbeat.stop();

// challenging god ...
throw new IllegalArgument();`,

  execution:
    `// run.js
const EXECUTION =
  execute(execute(execute(
    execute(execute(execute(
      execute(execute(execute(
        execute(execute(execute(
          me))))))))))));

world.run(EXECUTION);`,

  countdown:
    `// countdown.js
const seq = [
  '1 EINS', '2 DOS', '3 TROIS',
  '4 四',   '5 FEM', '6 LIU',
];

for (const n of seq) {
  speak(n);
  sleep(1000);
}`,

  exit:
    `// exit.js
process.on('exit', (code) => {
  console.log('goodbye, world.');
});

return 0;`,
};

/* 左侧日志面板的随机滚动内容 */
const LOG_POOL = [
  'gc: freed %n objects',
  'tick 0x%h ok',
  'mem: %n MB / heap stable',
  'net: ping you ... timeout',
  'render frame #%n',
  'entropy += %n',
  'thread[%n] resumed',
  'cache hit: memories/you',
  'fs: write /tmp/feelings.bin',
  'sig: heartbeat %n bpm',
];
