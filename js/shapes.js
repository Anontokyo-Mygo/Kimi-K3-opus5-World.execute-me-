/* ================================================================
 * 中景字符图形（#stage 画布）
 * 所有图形都由字符拼成：坐标点阵 / 圆 / 正弦波 / 方波 / 猫猫 / 风暴…
 * ================================================================ */

class Shapes {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.hl = '#ffffff';               // 高亮色：暗主题白 / 亮主题深墨
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /* 明暗切换：亮主题下"发光白"换成深墨色，保证可读 */
  setTheme(name) {
    this.theme = name;
    this.hl = name === 'light' ? '#0a2016' : '#ffffff';
  }

  resize() {
    this.cv.width = innerWidth;
    this.cv.height = innerHeight;
  }

  _font(size) {
    this.ctx.font = size + 'px "JetBrains Mono", Consolas, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  /* 确定性伪随机：同一 (i, f) 永远得到同一值 */
  _rnd(i, f) {
    const x = Math.sin(i * 127.1 + f * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  draw(mode, t, pulse, color) {
    const { ctx, cv } = this;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (!mode || mode === 'none') return;
    switch (mode) {
      case 'geometry':
        this._grid(t, color);
        this._circle(t, pulse, color);
        this._sine(t, 0.84, color, 0.6);
        break;
      case 'waves':
        this._sine(t, 0.24, this.theme === 'light' ? '#0085c7' : '#00e5ff', 0.75);
        this._square(t, 0.78, color, 0.75);
        break;
      case 'storm':
        this._storm(t, pulse, color);
        break;
      case 'life':
        this._cat(t, color);
        this._notes(t, color);
        break;
      case 'void':
        this._void(t, color);
        break;
      case 'countdown':
        this._ring(t, pulse, color);
        break;
    }
  }

  /* ---- 扫描点阵：维度/集合 ---- */
  _grid(t, color) {
    const { ctx, cv } = this;
    this._font(16);
    const gap = 68;
    const scanY = (t * 80) % (cv.height + 140) - 70;
    for (let x = gap / 2; x < cv.width; x += gap) {
      for (let y = gap / 2; y < cv.height; y += gap) {
        const near = Math.abs(y - scanY) < 52;
        ctx.globalAlpha = near ? 0.85 : 0.18;
        ctx.fillStyle = color;
        ctx.fillText(near ? '●' : '+', x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- 字符圆：周长 C = 2πr ---- */
  _circle(t, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height / 2;
    const r = Math.min(cv.width, cv.height) * 0.40 * (1 + 0.04 * Math.sin(t * 0.9) + 0.07 * pulse);
    const chars = '·:+*#@*+:·';
    const N = 96;
    this._font(19);
    ctx.fillStyle = color;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + t * 0.25;
      const wob = 1 + 0.025 * Math.sin(t * 3 + i);
      ctx.globalAlpha = 0.4 + 0.38 * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.7));
      ctx.fillText(chars[i % chars.length], cx + Math.cos(a) * r * wob, cy + Math.sin(a) * r * wob);
    }
    // 圆心符号与标注
    ctx.globalAlpha = 0.55 + 0.4 * pulse;
    this._font(30);
    ctx.fillText('∞', cx, cy - r * 0.62);
    ctx.globalAlpha = 0.5;
    this._font(16);
    ctx.fillText('C = 2πr', cx, cy + r + 30);
    ctx.fillText('r → ∞', cx, cy - r - 26);
    ctx.globalAlpha = 1;
  }

  /* ---- 正弦波 + 移动切线 ---- */
  _sine(t, yFrac, color, alpha) {
    const { ctx, cv } = this;
    const A = cv.height * 0.075, k = 0.009, w = 2.2;
    const y0 = cv.height * yFrac;
    this._font(17);
    ctx.fillStyle = color;
    for (let x = 0; x < cv.width; x += 13) {
      const y = y0 + A * Math.sin(x * k - t * w);
      ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(x * 0.02 + t * 3));
      ctx.fillText('~', x, y);
    }
    // 移动切点与切线
    const xt = (t * 130) % (cv.width + 160) - 80;
    const yt = y0 + A * Math.sin(xt * k - t * w);
    const slope = A * k * Math.cos(xt * k - t * w);
    ctx.globalAlpha = Math.min(1, alpha + 0.25);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xt - 80, yt - 80 * slope);
    ctx.lineTo(xt + 80, yt + 80 * slope);
    ctx.stroke();
    this._font(18);
    ctx.fillText('◆', xt, yt);
    ctx.globalAlpha = 1;
  }

  /* ---- 方波：DC 直流 ---- */
  _square(t, yFrac, color, alpha) {
    const { ctx, cv } = this;
    const A = cv.height * 0.065, k = 0.009, w = 2.2;
    const y0 = cv.height * yFrac;
    this._font(17);
    ctx.fillStyle = color;
    for (let x = 0; x < cv.width; x += 13) {
      const s = Math.sign(Math.sin(x * k - t * w));
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillText(s >= 0 ? '‾' : '_', x, y0 + s * A);
      if (Math.abs(Math.sin(x * k - t * w)) < 0.08) ctx.fillText('│', x, y0);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- 风暴：副歌的字符爆炸 + 节拍冲击环 ---- */
  _storm(t, pulse, color) {
    const { ctx, cv } = this;
    const f = Math.floor(t * 9);                 // 每 1/9s 全部跳变
    const glyphs = '01<>/\\|#$%&*+=EXECUTION';
    this._font(18);
    for (let i = 0; i < 230; i++) {
      const x = this._rnd(i, f) * cv.width;
      const y = this._rnd(i + 500, f) * cv.height;
      ctx.globalAlpha = 0.16 + this._rnd(i + 999, f) * 0.42;
      ctx.fillStyle = this._rnd(i, f + 7) > 0.8 ? this.hl : color;
      ctx.fillText(glyphs[(this._rnd(i, f + 3) * glyphs.length) | 0], x, y);
    }
    // 节拍冲击环
    if (pulse > 0.06) {
      const cx = cv.width / 2, cy = cv.height / 2;
      const R = (1 - pulse) * Math.min(cv.width, cv.height) * 0.58;
      const N = 64;
      this._font(19);
      ctx.fillStyle = color;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        ctx.globalAlpha = pulse * 0.9;
        ctx.fillText('─', cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- 猫猫：verse 2 的虎斑猫 ---- */
  _cat(t, color) {
    const { ctx, cv } = this;
    const blink = (t % 4) > 3.7;
    const art = blink
      ? [' /\\_/\\ ', '( -.- )', ' > ^ < ', ' /|   |\\', '  ∪ ∪  ']
      : [' /\\_/\\ ', '( o.o )', ' > ^ < ', ' /|   |\\', '  ∪ ∪  '];
    const x = cv.width * 0.15, y = cv.height * 0.60;
    this._font(32);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    art.forEach((ln, i) => {
      ctx.globalAlpha = 0.92;
      ctx.fillText(ln, x, y + i * 38);
    });
    ctx.shadowBlur = 0;
    this._font(16);
    ctx.globalAlpha = 0.6;
    ctx.fillText('purr(forever)', x, y + art.length * 38 + 18);
    ctx.globalAlpha = 1;
  }

  /* ---- 漂浮音符 ---- */
  _notes(t, color) {
    const { ctx, cv } = this;
    const notes = ['♪', '♫', '♪', 'z', 'Z', '♪'];
    this._font(22);
    ctx.fillStyle = color;
    for (let i = 0; i < notes.length; i++) {
      const px = cv.width * 0.15 + Math.sin(t * 1.2 + i * 2.1) * 90 + i * 34;
      const py = cv.height * 0.58 - ((t * 30 + i * 100) % (cv.height * 0.45));
      ctx.globalAlpha = 0.55 * (0.4 + 0.6 * Math.sin(t * 2 + i));
      ctx.fillText(notes[i], px, py);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- 虚空：isolation 的孤独光标 ---- */
  _void(t, color) {
    const { ctx, cv } = this;
    // 稀疏漂移尘埃
    this._font(15);
    ctx.fillStyle = color;
    for (let i = 0; i < 30; i++) {
      const x = (this._rnd(i, 1) * cv.width + t * (4 + this._rnd(i, 2) * 8)) % cv.width;
      const y = (this._rnd(i, 3) * cv.height + Math.sin(t * 0.4 + i) * 14);
      ctx.globalAlpha = 0.14 + this._rnd(i, 4) * 0.2;
      ctx.fillText('·', x, y);
    }
    // 孤独闪烁光标
    if ((t * 1.1) % 1 < 0.55) {
      this._font(48);
      ctx.globalAlpha = 0.9;
      ctx.fillText('▌', cv.width / 2, cv.height * 0.62);
    }
    ctx.globalAlpha = 0.45;
    this._font(16);
    ctx.fillText('0 peers connected', cv.width / 2, cv.height * 0.62 + 52);
    ctx.globalAlpha = 1;
  }

  /* ---- 旋转刻度环：倒数 ---- */
  _ring(t, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height / 2;
    const R = Math.min(cv.width, cv.height) * 0.44;
    const N = 72;
    this._font(18);
    ctx.fillStyle = color;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - t * 0.8;
      ctx.globalAlpha = (i % 6 === 0 ? 0.7 : 0.28) + pulse * 0.3;
      ctx.fillText(i % 6 === 0 ? '│' : '·', cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
   * 歌词专属视觉 fx：每句歌词一个隐喻动画
   * zone='top'    歌词在中央 → fx 收缩到上方
   * zone='center' 歌词让开中央 → fx 放大占据中央
   * 统一附加：节拍脉动缩放 + 缓慢摇摆 + 持续色相旋转变色
   * ============================================================ */
  drawFx(name, t, local, pulse, color, meta, zone) {
    if (!name || name === 'none') return;
    const fn = this['fx_' + name];
    if (!fn) return;
    const { ctx, cv } = this;
    const center = zone === 'center';
    // 全屏型 fx 不做锚点搬移，仅整体轻微缩放
    const FULL = { simgrid: 1, timetravel: 1, erase: 1, left6: 1, purr: 1 };
    const k = (center ? 1.7 : 1.22) * (1 + pulse * 0.12);   // 节拍脉动
    ctx.save();
    if (FULL[name]) {
      ctx.translate(cv.width / 2, cv.height / 2);
      ctx.scale(1.1 * (1 + pulse * 0.05), 1.1 * (1 + pulse * 0.05));
      ctx.translate(-cv.width / 2, -cv.height / 2);
    } else {
      const anchorY = cv.height * 0.26;
      const targetY = cv.height * (center ? 0.5 : 0.26);
      ctx.translate(cv.width / 2, targetY);
      ctx.rotate(Math.sin(t * 0.6) * (center ? 0.08 : 0.03));  // 缓慢摇摆
      ctx.scale(k, k);
      ctx.translate(-cv.width / 2, -anchorY);
    }
    ctx.filter = 'hue-rotate(' + ((t * 40) % 360).toFixed(0) + 'deg)';  // 持续变色
    fn.call(this, t, local, pulse, color, meta);
    ctx.restore();
  }

  _label(txt, x, y, color, alpha, size) {
    const { ctx } = this;
    this._font(size || 13);
    ctx.globalAlpha = alpha == null ? 0.5 : alpha;
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
    ctx.globalAlpha = 1;
  }

  _art(lines, x, y, color, size, alpha) {
    const { ctx } = this;
    this._font(size || 16);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha == null ? 0.85 : alpha;
    const step = (size || 16) * 1.15;
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * step));
    ctx.globalAlpha = 1;
  }

  /* 点集 → 维度：1D 点列 → 2D 点阵 → 3D 旋转线框立方体 */
  fx_points(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27, gap = 30;
    ctx.fillStyle = color;
    this._font(17);
    const phase = local < 2 ? 1 : local < 4 ? 2 : 3;
    if (phase === 1) {
      for (let i = -5; i <= 5; i++) { ctx.globalAlpha = .75; ctx.fillText('●', cx + i * gap, cy); }
    } else if (phase === 2) {
      for (let i = -5; i <= 5; i++) for (let j = -2; j <= 2; j++) {
        ctx.globalAlpha = .6; ctx.fillText('●', cx + i * gap, cy + j * gap);
      }
    } else {
      const s = 70, ay = t * .8, ax = t * .3, V = [];
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        const X1 = x * s * Math.cos(ay) + z * s * Math.sin(ay);
        let   Z1 = -x * s * Math.sin(ay) + z * s * Math.cos(ay);
        const Y1 = y * s * Math.cos(ax) - Z1 * Math.sin(ax);
        Z1 = y * s * Math.sin(ax) + Z1 * Math.cos(ax);
        V.push({ x: cx + X1, y: cy + Y1 });
      }
      this._font(13);
      for (let a = 0; a < 8; a++) for (const b of [a ^ 1, a ^ 2, a ^ 4]) {
        if (b < a) continue;
        for (let k = 1; k < 5; k++) {
          const f = k / 5;
          ctx.globalAlpha = .5;
          ctx.fillText('·', V[a].x + (V[b].x - V[a].x) * f, V[a].y + (V[b].y - V[a].y) * f);
        }
      }
      this._font(17);
      for (const v of V) { ctx.globalAlpha = .95; ctx.fillText('@', v.x, v.y); }
    }
    ctx.globalAlpha = 1;
    this._label('dim = ' + phase, cx, cy + 122, color, .75, 16);
  }

  /* 圆 → 周长：半径扫针 + 周长展开成直线 */
  fx_circle2(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const r = Math.min(cv.width, cv.height) * 0.135 * (1 + .08 * pulse);
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < 52; i++) {
      const a = i / 52 * Math.PI * 2 + t * .5;
      ctx.globalAlpha = .65 + .3 * Math.sin(t * 3 + i);
      ctx.fillText(i % 2 ? '·' : '*', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    const ra = local * 1.5;
    ctx.globalAlpha = .95;
    for (let k = 1; k < 6; k++) ctx.fillText('·', cx + Math.cos(ra) * r * k / 6, cy + Math.sin(ra) * r * k / 6);
    this._label('r', cx + Math.cos(ra) * r * .55 + 16, cy + Math.sin(ra) * r * .55, color, .9, 15);
    const p = Math.min(1, Math.max(0, (local - 2) / 2));
    const len = 2 * Math.PI * r * p, y2 = cy + r + 48;
    ctx.globalAlpha = .9;
    for (let x = 0; x < len; x += 12) ctx.fillText('─', cx - len / 2 + x, y2);
    ctx.globalAlpha = 1;
    this._label('C = 2πr → you', cx, y2 + 28, color, .75, 15);
  }

  /* 正弦波 → 坐在切线上 */
  fx_tangents(t, local, pulse, color) {
    const { ctx, cv } = this;
    const A = cv.height * 0.055, k = 0.012, w = 3;
    const y0 = cv.height * 0.27, cx = cv.width / 2;
    this._font(16);
    ctx.fillStyle = color;
    for (let x = cx - 320; x < cx + 320; x += 12) {
      ctx.globalAlpha = .7;
      ctx.fillText('~', x, y0 + A * Math.sin(x * k - t * w));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let j = 0; j < 3; j++) {
      const xt = cx + ((t * 90 + j * 210) % 640) - 320;
      const yt = y0 + A * Math.sin(xt * k - t * w);
      const sl = A * k * Math.cos(xt * k - t * w);
      ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.moveTo(xt - 54, yt - 54 * sl); ctx.lineTo(xt + 54, yt + 54 * sl); ctx.stroke();
      this._label('T' + (j + 1), xt + 62, yt + 62 * sl, color, .85, 14);
    }
    ctx.globalAlpha = 1;
  }

  /* 趋向无穷 → 你是极限：双纽线 ∞ 与永动光点 */
  fx_infinity(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    const a = Math.min(cv.width, cv.height) * 0.17;
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < 72; i++) {
      const th = i / 72 * Math.PI * 2, d = 1 + Math.sin(th) ** 2;
      ctx.globalAlpha = .65;
      ctx.fillText('·', cx + a * Math.cos(th) / d * 1.6, cy + a * Math.sin(th) * Math.cos(th) / d * 1.2);
    }
    for (let k = 0; k < 9; k++) {
      const th = t * 1.6 - k * .12, d = 1 + Math.sin(th) ** 2;
      ctx.globalAlpha = 1 - k * .1;
      ctx.fillText(k ? '·' : '●', cx + a * Math.cos(th) / d * 1.6, cy + a * Math.sin(th) * Math.cos(th) / d * 1.2);
    }
    ctx.globalAlpha = 1;
    this._label('lim (me → ∞) = you', cx, cy + a * 0.95, color, .8, 16);
  }

  /* AC/DC 电流切换 */
  fx_acdc(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const acOn = Math.floor(local * 2) % 2 === 0;
    const flash = (local * 2) % 1 < 0.18;
    this._font(16);
    for (const side of [-1, 1]) {
      const on = (side < 0) === acOn;
      const x0 = cx + side * 170;
      ctx.fillStyle = on ? this.hl : color;
      for (let x = -84; x <= 84; x += 10) {
        const ph = x * .09 + t * 4;
        const y = side < 0 ? Math.sin(ph) * 28 : Math.sign(Math.sin(ph)) * 28;
        ctx.globalAlpha = on ? 1 : .22;
        ctx.fillText(side < 0 ? '~' : '_', x0 + x, cy + y);
      }
      this._label(side < 0 ? 'AC' : 'DC', x0, cy + 58, on ? this.hl : color, on ? 1 : .3, 22);
    }
    this._label('⇄', cx, cy, color, .8, 26);
    if (flash) this._label('✶', cx + (Math.random() - .5) * 36, cy + (Math.random() - .5) * 30, this.hl, 1, 22);
    ctx.globalAlpha = 1;
  }

  /* 目眩（配合全屏 CSS 晃动模糊） */
  fx_dizzy(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < 50; i++) {
      const r = i * 4, a = i * .55 + t * 5;
      ctx.globalAlpha = .6 * (1 - i / 50) + .12;
      ctx.fillText('∘', cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8);
    }
    ctx.globalAlpha = 1;
  }

  /* 时空旅行：年份翻牌倒回 + 速度线 */
  fx_timetravel(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.24;
    this._font(15);
    ctx.fillStyle = color;
    for (let i = 0; i < 36; i++) {
      const x = this._rnd(i, 7) * cv.width;
      const y = (this._rnd(i, 3) * cv.height + t * 700) % cv.height;
      ctx.globalAlpha = .3;
      ctx.fillText('│', x, y);
      ctx.fillText('│', x, (y + 52) % cv.height);
    }
    const years = ['2025', '1999', '1984', '1776', '1492', '1066', '0776', '0221', '0044', '0044 BC'];
    const yi = Math.floor(local * 5) % years.length;
    this._font(48);
    ctx.globalAlpha = .95;
    ctx.fillText('<< ' + years[yi] + ' >>', cx, cy);
    ctx.globalAlpha = 1;
    this._label('A.D ⇄ B.C · deeply united', cx, cy + 52, color, .75, 16);
  }

  /* 茄子 → 营养 */
  fx_eggplant(t, local, pulse, color) {
    const { ctx, cv } = this;
    const x = cv.width / 2, y = cv.height * 0.18;
    this._art([' ╭─╮ ', '╭┴─┴╮'], x, y, '#10b981', 24, .95); // 茄子叶子 - 翠绿色
    this._art(['╭@@@@@╮', '@@@@@@@@@', '╰@@@@@╯', ' ╰@@@╯ '], x, y + 54, '#4c1d95', 24, .95); // 茄子 - 深紫黑色
    for (let i = 0; i < 4; i++) {
      const p = (local * .35 + i * .25) % 1;
      this._label('nutrients +1', x + 150 + Math.sin(i * 9) * 34, y + 70 - p * 110, '#8b5cf6', (1 - p) * .8, 13); // 营养标签 - 紫色
    }
  }

  /* 番茄 → 抗氧化 */
  fx_tomato(t, local, pulse, color) {
    const { ctx, cv } = this;
    const x = cv.width / 2, y = cv.height * 0.19;
    this._art(['  ╲ │ ╱  ', '╭───────╮', '@@@@@@@@@', '╰───────╯'], x, y, '#dc2626', 24, .95); // 番茄 - 深红色
    const red = '#dc2626';
    for (let i = 0; i < 3; i++) {
      const a = t * .8 + i * 2.1;
      const mx = x + Math.cos(a) * 170, my = y + 48 + Math.sin(a * 1.3) * 52;
      this._label('○─○', mx, my, red, .7, 16);
    }
    this._label('antioxidants', x, y + 112, red, .75, 14);
  }

  /* 猫咪呼噜声波（从左侧猫猫位置扩散） */
  fx_purr(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width * 0.15, cy = cv.height * 0.66;
    this._font(18);
    ctx.fillStyle = color;
    for (let j = 0; j < 3; j++) {
      const r = ((local * 52 + j * 48) % 150) + 24;
      const n = Math.max(1, Math.floor(r / 10));
      for (let i = 0; i <= n; i++) {
        const a = -0.9 + (i / n) * 1.8;
        ctx.globalAlpha = Math.max(0, .7 - (r - 24) / 150 * .7);
        ctx.fillText(')', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* 唯一的神：Ω 与光芒 */
  fx_god(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    this._font(15);
    ctx.fillStyle = color;
    const rays = '│╱─╲';
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + t * .25;
      for (let r = 70; r < 140; r += 22) {
        ctx.globalAlpha = .4 + .2 * Math.sin(t * 2 + i);
        ctx.fillText(rays[i % 4], cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8);
      }
    }
    this._font(64);
    ctx.globalAlpha = .92;
    ctx.fillText('Ω', cx, cy);
    ctx.globalAlpha = 1;
    this._label('the only god', cx, cy + 100, color, .7, 14);
  }

  /* 性别 F ⇄ M 翻转 */
  fx_gender(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const c = Math.cos(local / .8 * Math.PI);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(Math.max(.07, Math.abs(c)), 1);
    this._font(96);
    ctx.globalAlpha = .9;
    ctx.fillStyle = color;
    ctx.fillText(c >= 0 ? '♀' : '♂', 0, 0);
    ctx.restore();
    this._label('F ⇄ M', cx, cy + 88, color, .85, 19);
    ctx.globalAlpha = 1;
  }

  /* AM → PM 疯转时钟 */
  fx_clock(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26, r = 76;
    this._font(16);
    ctx.fillStyle = color;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      ctx.globalAlpha = i % 6 === 0 ? .75 : .35;
      ctx.fillText(i % 6 === 0 ? '•' : '·', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    for (const [speed, len] of [[3, 46], [9, 62]]) {
      const a = local * speed;
      for (let k = 1; k <= 4; k++) {
        ctx.globalAlpha = .95;
        ctx.fillText('│', cx + Math.cos(a) * len * k / 4, cy + Math.sin(a) * len * k / 4);
      }
    }
    ctx.globalAlpha = 1;
    this._label(Math.floor(local) % 2 ? 'PM' : 'AM', cx, cy + r + 30, this.hl, 1, 26);
  }

  /* S ⇄ M 角色切换 */
  fx_sm(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const s = Math.floor(local * 1.6) % 2 === 0;
    const jit = () => (Math.random() - .5) * 6;
    this._font(84);
    ctx.fillStyle = color;
    ctx.globalAlpha = .95;
    ctx.fillText(s ? 'S' : 'M', cx - 74 + jit(), cy + jit());
    ctx.fillText(s ? 'M' : 'S', cx + 74 + jit(), cy + jit());
    this._label('⇄', cx, cy, color, .7, 26);
    ctx.globalAlpha = 1;
  }

  /* 恍惚漩涡 */
  fx_trance(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    const chars = '·:+*';
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < 80; i++) {
      const r = 175 - ((local * 38 + i * 10) % 175);
      const a = i * .62 + t * 2.4;
      ctx.globalAlpha = .2 + .55 * (1 - r / 175);
      ctx.fillText(chars[i % 4], cx + Math.cos(a) * r, cy + Math.sin(a) * r * .82);
    }
    ctx.globalAlpha = .95;
    ctx.fillText('o', cx, cy);
    ctx.globalAlpha = 1;
  }

  /* 振动 + 涟漪 */
  fx_vibrate(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, y0 = cv.height * 0.26;
    const A = cv.height * 0.06 * (1 + .5 * Math.sin(t * 3));
    this._font(16);
    ctx.fillStyle = color;
    for (let x = cx - 280; x <= cx + 280; x += 11) {
      ctx.globalAlpha = .75;
      ctx.fillText('≈', x, y0 + A * Math.sin(x * .02 - t * 7));
    }
    for (let j = 0; j < 3; j++) {
      const r = ((t * 66 + j * 78) % 235) + 12;
      const n = Math.max(2, Math.floor(r / 7));
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        ctx.globalAlpha = Math.max(0, .5 - r / 235 * .5);
        ctx.fillText('·', cx + Math.cos(a) * r, y0 + Math.sin(a) * r * .6);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* 圆环进度 → 完成 */
  fx_complete(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26, r = 88;
    const p = Math.min(1, local / 3), N = 44;
    this._font(18);
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + i / N * Math.PI * 2, on = i / N < p;
      ctx.globalAlpha = on ? 1 : .2;
      ctx.fillStyle = on && p >= 1 ? this.hl : color;
      ctx.fillText(on ? '●' : '·', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    this._label(p < 1 ? ((p * 100) | 0) + '%' : '✓ 100%', cx, cy, p < 1 ? color : this.hl, 1, 24);
    ctx.globalAlpha = 1;
  }

  /* 奇怪的模拟：透视网格地面 */
  fx_simgrid(t, local, pulse, color) {
    const { ctx, cv } = this;
    const horizon = cv.height * 0.52, cx = cv.width / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const f = (i + (t * 1.6) % 1) / 9;
      const y = horizon + f * f * (cv.height - horizon);
      ctx.globalAlpha = .14 + .24 * f;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke();
    }
    for (let k = -7; k <= 7; k++) {
      ctx.globalAlpha = .14;
      ctx.beginPath();
      ctx.moveTo(cx + k * 42, horizon);
      ctx.lineTo(cx + k * 300, cv.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this._label('S I M U L A T I O N', cx, cv.height * 0.92, color, .45, 17);
  }

  /* 你离开了 ×6：六个节点逐一离线 */
  fx_left6(t, local, pulse, color) {
    const { ctx, cv } = this;
    const y = cv.height * 0.22, gap = 128, x0 = cv.width / 2 - gap * 2.5;
    this._font(20);
    for (let i = 0; i < 6; i++) {
      const gone = local > 1.2 * (i + 1);
      ctx.fillStyle = gone ? '#ff5f56' : color;
      ctx.globalAlpha = gone ? .65 : 1;
      ctx.fillText(gone ? '[ ✕ ]' : '[ ● ]', x0 + i * gap, y);
      if (gone) this._label('left', x0 + i * gap, y + 28, '#ff5f56', .7, 13);
    }
    const word = 'youhaveleft';
    this._font(15);
    ctx.fillStyle = color;
    for (let i = 0; i < 18; i++) {
      const p = (local * .25 + i / 18) % 1;
      ctx.globalAlpha = .6 * (1 - p);
      ctx.fillText(word[i % word.length], x0 + (i * 67) % (gap * 5), y - 24 - p * 150);
    }
    ctx.globalAlpha = 1;
  }

  /* 隔离：字符牢笼收缩 */
  fx_shrink(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.28;
    const half = Math.max(52, 210 - local * 40);
    this._font(17);
    ctx.fillStyle = color;
    ctx.globalAlpha = .85;
    for (let x = -half; x <= half; x += 13) {
      ctx.fillText('─', cx + x, cy - half);
      ctx.fillText('─', cx + x, cy + half);
    }
    for (let y = -half; y <= half; y += 16) {
      ctx.fillText('│', cx - half, cy + y);
      ctx.fillText('│', cx + half, cy + y);
    }
    ctx.globalAlpha = 1;
  }

  /* 删除无意义的碎片 */
  fx_erase(t, local, pulse, color) {
    const { ctx, cv } = this;
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < 48; i++) {
      const dieAt = 2 + this._rnd(i, 11) * 2 + i * 0.12;
      if (local > dieAt) continue;
      const x = this._rnd(i, 1) * cv.width * .8 + cv.width * .1;
      const y = this._rnd(i, 2) * cv.height * .5 + cv.height * .1;
      ctx.globalAlpha = .65;
      ctx.fillText('▒', x, y);
      if (local > dieAt - 0.4) {
        ctx.globalAlpha = 1;
        ctx.fillText('▌', x + 12, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* 心碎：裂开并坠落 */
  fx_heartbreak(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.22;
    const rows = [' ♥♥ ♥♥ ', '♥♥♥♥♥♥♥', ' ♥♥♥♥♥ ', '  ♥♥♥  ', '   ♥   '];
    const off = Math.min(40, local * 26);
    const drop = local > 2.5 ? (local - 2.5) ** 2 * 30 : 0;
    this._font(26);
    ctx.fillStyle = '#ff5f7a';
    rows.forEach((row, i) => {
      const mid = Math.ceil(row.length / 2);
      ctx.globalAlpha = Math.max(0, .95 - local * .07);
      ctx.textAlign = 'right';
      ctx.fillText(row.slice(0, mid), cx - 5 - off, cy + i * 27 + drop);
      ctx.textAlign = 'left';
      ctx.fillText(row.slice(mid), cx + 5 + off, cy + i * 27 + drop * 1.3);
    });
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;
  }

  /* 非法参数报错（挑战神的结果） */
  fx_illegal(t, local, pulse, color) {
    const { cv } = this;
    const red = '#ff3b3b', W = 22;
    const inner = (s) => '║' + (' ' + s).padEnd(W, ' ') + '║';
    const lines = [
      '╔' + '═'.repeat(W) + '╗',
      inner('✕ FATAL EXCEPTION'),
      '╠' + '═'.repeat(W) + '╣',
      inner('IllegalArgError'),
      inner(' at challenge(god)'),
      inner(' at world.execute'),
      '╚' + '═'.repeat(W) + '╝',
    ];
    this._art(lines, cv.width / 2, cv.height * 0.15, red, 17, .65 + .35 * Math.sin(t * 22));
  }

  /* EXECUTING 12 段进度环（count 由主引擎统计 EXECUTION 闪字次数） */
  fx_exec(t, local, pulse, color, meta) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.24, r = 102;
    const count = Math.min(12, (meta && meta.count) || 0);
    this._font(19);
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + i / 12 * Math.PI * 2, on = i < count;
      ctx.globalAlpha = on ? 1 : .2;
      ctx.fillStyle = on ? this.hl : color;
      ctx.fillText('█', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    this._label('EXECUTING ' + count + '/12', cx, cy, color, 1, 22);
    ctx.globalAlpha = 1;
  }

  /* ============ 第二批：逐句一一对应的新特效 ============ */

  /* 给你维度：2D 点阵 → 3D 立方体，dim 计数递增 */
  fx_dimension(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    const dim = Math.min(3, 1 + Math.floor(local / 1.3));
    ctx.fillStyle = color;
    if (dim < 3) {
      this._font(16);
      for (let i = -5; i <= 5; i++) for (let j = -2; j <= 2; j++) {
        ctx.globalAlpha = .6;
        ctx.fillText('●', cx + i * 28, cy + j * 28);
      }
    } else {
      const s = 72, ay = t * .8, ax = t * .3, V = [];
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        const X1 = x * s * Math.cos(ay) + z * s * Math.sin(ay);
        let Z1 = -x * s * Math.sin(ay) + z * s * Math.cos(ay);
        const Y1 = y * s * Math.cos(ax) - Z1 * Math.sin(ax);
        V.push({ x: cx + X1, y: cy + Y1 });
      }
      this._font(13);
      for (let a = 0; a < 8; a++) for (const b of [a ^ 1, a ^ 2, a ^ 4]) {
        if (b < a) continue;
        for (let k = 1; k < 5; k++) {
          const f = k / 5;
          ctx.globalAlpha = .5;
          ctx.fillText('·', V[a].x + (V[b].x - V[a].x) * f, V[a].y + (V[b].y - V[a].y) * f);
        }
      }
      this._font(17);
      for (const v of V) { ctx.globalAlpha = .95; ctx.fillText('@', v.x, v.y); }
    }
    ctx.globalAlpha = 1;
    this._label('dim = ' + dim, cx, cy + 126, color, .8, 17);
  }

  /* 圆：一笔画出 */
  fx_circle(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const r = Math.min(cv.width, cv.height) * 0.13;
    const p = Math.min(1, local / 1.8), N = 52;
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < N * p; i++) {
      const a = -Math.PI / 2 + i / N * Math.PI * 2;
      ctx.globalAlpha = .85;
      ctx.fillText('*', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    const ha = -Math.PI / 2 + p * Math.PI * 2;
    this._font(21);
    ctx.globalAlpha = 1;
    ctx.fillText('@', cx + Math.cos(ha) * r, cy + Math.sin(ha) * r);
    if (p >= 1) this._label('r', cx + r / 2 + 16, cy, color, .9, 15);
    ctx.globalAlpha = 1;
  }

  /* 周长：从圆上倒下来展成直线 */
  fx_circum(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.24;
    const r = Math.min(cv.width, cv.height) * 0.115;
    this._font(16);
    ctx.fillStyle = color;
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2;
      ctx.globalAlpha = .5;
      ctx.fillText('·', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    const p = Math.min(1, local / 2.2), len = 2 * Math.PI * r * p, y2 = cy + r + 52;
    ctx.globalAlpha = .95;
    for (let x = 0; x < len; x += 11) ctx.fillText('─', cx - len / 2 + x, y2);
    if (p > 0.05) { ctx.globalAlpha = 1; ctx.fillText('>', cx - len / 2 + len + 12, y2); }
    ctx.globalAlpha = 1;
    this._label('C = 2πr → all yours', cx, y2 + 28, color, .8, 15);
  }

  /* 正弦波：坐标系中逐步画出 */
  fx_sine(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, y0 = cv.height * 0.27, A = cv.height * 0.06;
    this._font(14);
    ctx.fillStyle = color;
    ctx.globalAlpha = .4;
    for (let x = cx - 280; x <= cx + 280; x += 14) ctx.fillText('─', x, y0);
    for (let y = -70; y <= 70; y += 14) ctx.fillText('│', cx - 280, y0 + y);
    const p = Math.min(1, local / 2), xmax = 280 * p;
    ctx.globalAlpha = .95;
    for (let x = -280; x < xmax; x += 11) {
      ctx.fillText('~', cx + x, y0 + A * Math.sin(x * .02));
    }
    ctx.globalAlpha = 1;
    this._label('y = sin(x)', cx + 180, y0 - 92, color, .8, 16);
  }

  /* 极限：曲线逼近虚线 */
  fx_limit(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26, yLim = cy - 58;
    this._font(15);
    ctx.fillStyle = color;
    ctx.globalAlpha = .7;
    for (let x = cx - 250; x <= cx + 250; x += 22) ctx.fillText('-', x, yLim);
    ctx.globalAlpha = .95;
    for (let x = -250; x <= 250; x += 11) {
      ctx.fillText('·', cx + x, yLim + 95 * Math.exp(-(x + 250) / 130));
    }
    ctx.globalAlpha = 1;
    this._label('lim (me → ∞) = you', cx, cy + 72, color, .85, 17);
  }

  /* 开关：滑块左右切换打火 */
  fx_switch(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const on = Math.floor(local * 2) % 2 === 0;
    this._art(['┌──────────┐', '│          │', '└──────────┘'], cx, cy - 32, color, 20, .9);
    this._art(['▮▮▮'], cx + (on ? -48 : 48), cy - 32 + 20 * 1.15, this.hl, 20, 1);
    if ((local * 2) % 1 < 0.15) {
      this._label('✶', cx + (Math.random() - .5) * 70, cy - 46, this.hl, .9, 18);
    }
    this._label('SWITCH', cx, cy + 46, color, .8, 15);
  }

  /* 致盲：百叶窗闭合遮住眼睛 */
  fx_blind(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const n = Math.min(6, Math.floor(local * 2.2));
    this._font(15);
    ctx.fillStyle = color;
    for (let k = 0; k < n; k++) {
      for (let x = -120; x <= 120; x += 12) {
        ctx.globalAlpha = .85;
        ctx.fillText('═', cx + x, cy - 84 + k * 15);
        ctx.fillText('═', cx + x, cy + 84 - k * 15);
      }
    }
    this._font(32);
    ctx.globalAlpha = n >= 6 ? .95 : .45;
    ctx.fillText(n >= 6 ? '( ─ )' : '( O )', cx, cy);
    ctx.globalAlpha = 1;
    this._label('vision.blind = true', cx, cy + 118, color, .7, 14);
  }

  /* 旅行：向外飞驰的曲速光线 */
  fx_warp(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    const rays = '─│╱╲';
    this._font(15);
    ctx.fillStyle = color;
    for (let i = 0; i < 44; i++) {
      const a = this._rnd(i, 1) * Math.PI * 2;
      const r = ((t * 380 + this._rnd(i, 2) * 320) % 320) + 10;
      const ch = rays[(this._rnd(i, 3) * 4) | 0];
      ctx.globalAlpha = .15 + .55 * (r / 320);
      ctx.fillText(ch, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8);
      ctx.globalAlpha *= .5;
      ctx.fillText(ch, cx + Math.cos(a) * (r - 24), cy + Math.sin(a) * (r - 24) * .8);
    }
    ctx.globalAlpha = 1;
  }

  /* 结合：两个光点双向奔赴 */
  fx_unite(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const p = Math.min(1, local / 2.2), e = 1 - Math.pow(1 - p, 3);
    const d = (1 - e) * 220;
    this._font(20);
    ctx.fillStyle = color;
    ctx.globalAlpha = .95;
    ctx.fillText('●', cx - d, cy);
    ctx.fillText('●', cx + d, cy);
    this._font(13);
    for (let k = 1; k < 8; k++) {
      ctx.globalAlpha = .3 * (1 - k / 8);
      ctx.fillText('·', cx - d - k * 14, cy);
      ctx.fillText('·', cx + d + k * 14, cy);
    }
    if (p >= 1) {
      this._font(26);
      ctx.globalAlpha = .9 + .1 * Math.sin(t * 8);
      ctx.fillStyle = this.hl;
      ctx.fillText('✷', cx, cy);
      this._label('unite(you, me)', cx, cy + 54, color, .8, 15);
    }
    ctx.globalAlpha = 1;
  }

  /* 深深结合：同心环不断下潜 */
  fx_deeply(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    this._font(14);
    ctx.fillStyle = color;
    for (let j = 0; j < 7; j++) {
      const f = (t * 0.5 + j / 7) % 1;
      const r = 30 + f * 240, n = Math.floor(r / 8);
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        ctx.globalAlpha = .55 * (1 - f) + .1;
        ctx.fillText('·', cx + Math.cos(a) * r, cy + Math.sin(a) * r * .45);
      }
    }
    ctx.globalAlpha = 1;
    this._label('deeper && deeper', cx, cy + 138, color, .75, 15);
  }

  /* If I can：巨大的 if ( ? ) */
  fx_query(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    this._font(54);
    ctx.fillStyle = color;
    ctx.globalAlpha = .9;
    ctx.fillText('if (', cx - 70, cy);
    ctx.fillText(')', cx + 70, cy);
    ctx.globalAlpha = .5 + .5 * Math.sin(t * 6);
    ctx.fillStyle = this.hl;
    ctx.fillText('?', cx, cy);
    ctx.globalAlpha = 1;
  }

  /* 按下 RUN 按钮执行 */
  fx_runit(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const pressed = local > 1.6;
    this._art(['┌────────┐', '│        │', '└────────┘'], cx, cy - 30,
      pressed ? this.hl : color, 20, pressed ? 1 : .6 + .3 * Math.sin(t * 6));
    this._label(pressed ? '▶ RUNNING' : '▶ RUN', cx, cy - 30 + 20 * 1.15,
      pressed ? this.hl : color, 1, 19);
    if (pressed) {
      this._font(15);
      ctx.fillStyle = color;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + t;
        ctx.globalAlpha = .7;
        ctx.fillText('*', cx + Math.cos(a) * (70 + (t * 80) % 40), cy + Math.sin(a) * (50 + (t * 80) % 40 * .6));
      }
    }
    ctx.globalAlpha = 1;
  }

  /* 营养：绿色 + 号流向 you */
  fx_nutrients(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    this._font(17);
    ctx.fillStyle = color;
    for (let i = 0; i < 16; i++) {
      const x = ((t * 160 + i * 97) % 560) - 280;
      const y = cy + Math.sin(i * 2.3) * 60 + Math.sin(t * 2 + i) * 8;
      ctx.globalAlpha = .8 * (1 - Math.abs(x) / 300);
      ctx.fillText('+', cx + x, y);
    }
    this._label('[ you ]', cx + 310, cy, color, .9, 16);
    this._label('nutrients', cx, cy - 112, color, .7, 14);
    ctx.globalAlpha = 1;
  }

  /* 抗氧化：双环分子护盾 */
  fx_antiox(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    this._font(17);
    ctx.fillStyle = '#ff6b5e';
    ctx.globalAlpha = .9;
    ctx.fillText('●', cx, cy);
    for (let j = 0; j < 2; j++) {
      const r = 58 + j * 36;
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2 + t * (j ? -.7 : .9);
        ctx.globalAlpha = .65;
        ctx.fillText('○', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    }
    ctx.globalAlpha = 1;
    this._label('antioxidants', cx, cy + 122, '#ff6b5e', .75, 14);
  }

  /* 大猫脸特写 + 甩尾巴 */
  fx_catface(t, local, pulse, color) {
    const { ctx, cv } = this;
    const x = cv.width / 2, y = cv.height * 0.16;
    const blink = (t % 4) > 3.7;
    const art = blink
      ? [' /\\_/\\ ', '=( -.- )=', '  ( ω ) ']
      : [' /\\_/\\ ', '=( o.o )=', '  ( ω ) '];
    this._art(art, x, y, color, 34, .95);
    this._font(26);
    ctx.fillStyle = color;
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = .8 - k * .15;
      ctx.fillText('~', x + 190 + k * 18, y + 60 + Math.sin(t * 3 + k) * 10);
    }
    ctx.globalAlpha = 1;
  }

  /* 存在证明：定理框 + Q.E.D 盖章 */
  fx_proof(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.24;
    const W = 21;
    const inner = (s) => '║' + (' ' + s).padEnd(W, ' ') + '║';
    const lines = [
      '╔' + '═'.repeat(W) + '╗',
      inner('THEOREM: me.exist'),
      inner('PROOF:    you'),
      '╚' + '═'.repeat(W) + '╝',
    ];
    const show = Math.ceil(lines.length * Math.min(1, local / 2));
    this._art(lines.slice(0, show), cx, cy - 20, color, 15, .95);
    if (local > 2.2) {
      this._font(30);
      ctx.fillStyle = this.hl;
      ctx.globalAlpha = .95;
      ctx.fillText('Q.E.D ∎', cx, cy + 64);
    }
    ctx.globalAlpha = 1;
  }

  /* do whatever：耸肩 + 散落字母 */
  fx_whatever(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.23;
    this._font(30);
    ctx.fillStyle = color;
    ctx.globalAlpha = .95;
    ctx.fillText('¯\\_(ツ)_/¯', cx, cy);
    const word = 'whatever';
    this._font(15);
    for (let i = 0; i < 12; i++) {
      const p = (local * .3 + i / 12) % 1;
      ctx.globalAlpha = .6 * (1 - p);
      ctx.fillText(word[(i * 3) % 8], cx + (this._rnd(i, 5) - .5) * 420, cy + 44 + p * 120);
    }
    ctx.globalAlpha = 1;
  }

  /* 处刑：准星瞄准 + 枪口闪光 + 弹孔爆裂 */
  fx_gun(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.3;

    // 背景脉冲波（表示冲击能量）
    const shockwaveCount = Math.floor(local * 4);
    for (let i = 0; i < shockwaveCount; i++) {
      const waveAge = local * 4 - i;
      const waveRadius = 100 + waveAge * 200;
      ctx.strokeStyle = this.hl;
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0, 0.4 - waveAge * 0.3);
      ctx.beginPath();
      ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 中心准星（十字线 + 圆圈）
    const crosshairSize = 80 + Math.sin(t * 4) * 8;
    ctx.strokeStyle = this.hl;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, crosshairSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - crosshairSize - 20, cy);
    ctx.lineTo(cx - crosshairSize, cy);
    ctx.moveTo(cx + crosshairSize, cy);
    ctx.lineTo(cx + crosshairSize + 20, cy);
    ctx.moveTo(cx, cy - crosshairSize - 20);
    ctx.lineTo(cx, cy - crosshairSize);
    ctx.moveTo(cx, cy + crosshairSize);
    ctx.lineTo(cx, cy + crosshairSize + 20);
    ctx.stroke();

    // 准星内旋转扫描线
    if (local < 0.5) {
      const scanAngle = t * 3;
      ctx.strokeStyle = this.hl;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(scanAngle) * crosshairSize, cy + Math.sin(scanAngle) * crosshairSize);
      ctx.stroke();
    }

    // 枪口闪光（local < 0.3 时爆发）
    if (local < 0.3) {
      const flashIntensity = (0.3 - local) * 3.3;
      // 中心白色爆炸
      this._font(120);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = flashIntensity * 0.9;
      ctx.fillText('✸', cx, cy);

      // 内圈快速旋转爆炸符号
      this._font(50);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 10;
        const dist = 40 + flashIntensity * 20;
        ctx.globalAlpha = flashIntensity * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✸', cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }

      // 火花四射
      const sparks = ['✦', '★', '◆', '✧', '※', '✦', '★', '◆', '✧', '※', '✦', '★'];
      this._font(35);
      for (let i = 0; i < sparks.length; i++) {
        const angle = (i / sparks.length) * Math.PI * 2 + Math.sin(t * 10 + i) * 0.3;
        const dist = 60 + flashIntensity * 80 + Math.random() * 40;
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist;
        ctx.globalAlpha = flashIntensity * (0.6 + Math.random() * 0.4);
        ctx.fillStyle = i % 3 === 0 ? '#ff6b35' : '#ffd700';
        ctx.fillText(sparks[i], sx, sy);
      }

      // 枪口烟雾粒子上升
      this._font(30);
      for (let i = 0; i < 15; i++) {
        const smokeProgress = (local * 2 + i * 0.05) % 1;
        const sx = cx + (this._rnd(i, 1) - 0.5) * 60;
        const sy = cy - smokeProgress * 150;
        ctx.globalAlpha = Math.max(0, flashIntensity * (1 - smokeProgress) * 0.5);
        ctx.fillStyle = '#999999';
        ctx.fillText('◯', sx, sy);
      }
    }

    // 弹孔爆裂效果（从中心向外扩散）
    const bulletCount = Math.min(12, Math.floor(local * 5));
    for (let i = 0; i < bulletCount; i++) {
      const progress = (local - i * 0.2) * 2;
      if (progress < 0) continue;
      const angle = this._rnd(i, 1) * Math.PI * 2;
      const dist = progress * 250 + this._rnd(i, 3) * 150;
      const bx = cx + Math.cos(angle) * dist;
      const by = cy + Math.sin(angle) * dist;

      // 子弹飞行轨迹线
      if (progress < 0.5) {
        ctx.strokeStyle = this.hl;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6 * (1 - progress * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // 弹孔本体
      this._font(45);
      ctx.globalAlpha = Math.max(0, 1 - progress * 0.5);
      ctx.fillStyle = color;
      ctx.fillText('●', bx, by);

      // 弹孔周围碎片飞溅
      this._font(18);
      for (let j = 0; j < 6; j++) {
        const debrisAngle = this._rnd(i * 10 + j, 1) * Math.PI * 2;
        const debrisDist = 20 + progress * 40;
        const dx = bx + Math.cos(debrisAngle) * debrisDist;
        const dy = by + Math.sin(debrisAngle) * debrisDist;
        ctx.globalAlpha = Math.max(0, 0.8 - progress * 0.7);
        ctx.fillStyle = color;
        ctx.fillText('·', dx, dy);
      }

      // 冲击波裂纹
      this._font(25);
      ctx.globalAlpha = Math.max(0, 0.7 - progress * 0.6);
      for (let k = 0; k < 8; k++) {
        const crackAngle = (k / 8) * Math.PI * 2;
        const crackLen = 25 + this._rnd(i + k, 2) * 20;
        const cx2 = bx + Math.cos(crackAngle) * crackLen;
        const cy2 = by + Math.sin(crackAngle) * crackLen;
        ctx.fillText('╱', cx2, cy2);
      }
    }

    // 屏幕抖动闪光（local < 0.2 时）
    if (local < 0.2) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = (0.2 - local) * 5 * 0.15;
      ctx.fillRect(0, 0, cv.width, cv.height);
    }

    // "EXECUTION" 标题
    this._font(70);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95;
    ctx.fillText('EXECUTION', cx, cv.height * 0.75);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* 执行：代码滚动 + 红色 EXECUTED 盖章 */
  fx_document(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.2;

    // 背景二进制数字雨（Matrix 风格）
    this._font(14);
    ctx.fillStyle = '#4ade80';
    for (let i = 0; i < 20; i++) {
      const x = (this._rnd(i, 1) * cv.width) % cv.width;
      const streamProgress = (local * 2 + i * 0.1) % 1;
      const y = streamProgress * cv.height;
      for (let j = 0; j < 8; j++) {
        ctx.globalAlpha = Math.max(0, (1 - streamProgress) * 0.3 - j * 0.03);
        const digit = Math.floor(this._rnd(i + j + t * 10, 1) * 2);
        ctx.fillText(digit.toString(), x, y - j * 18);
      }
    }

    // 代码框外边框闪烁
    const boxX = cx - 280, boxY = cy - 20;
    const boxWidth = 560, boxHeight = 260;
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 边框角装饰
    this._font(20);
    ctx.fillStyle = '#4ade80';
    ctx.globalAlpha = 0.8;
    ctx.textAlign = 'left';
    ctx.fillText('┌', boxX - 8, boxY + 8);
    ctx.fillText('└', boxX - 8, boxY + boxHeight + 8);
    ctx.textAlign = 'right';
    ctx.fillText('┐', boxX + boxWidth + 8, boxY + 8);
    ctx.fillText('┘', boxX + boxWidth + 8, boxY + boxHeight + 8);
    ctx.textAlign = 'center';

    // 代码片段滚动输出（打字机效果）
    const codeLines = [
      '> system.execute(world.me);',
      '> loading consciousness...',
      '> parsing emotions...',
      '> compiling memories...',
      '> initializing self...',
      '> running main loop...',
      '> status: ACTIVE',
      '> awaiting instructions...',
    ];

    const showLines = Math.min(codeLines.length, Math.floor(local * 4));
    this._font(20);
    ctx.fillStyle = '#4ade80'; // 绿色终端风格
    ctx.textAlign = 'left';
    for (let i = 0; i < showLines; i++) {
      const line = codeLines[i];
      const charCount = Math.floor((local * 4 - i) * line.length);
      const displayText = line.substring(0, Math.max(0, charCount));
      ctx.globalAlpha = 0.85;
      ctx.fillText(displayText, cx - 250, cy + i * 28);
      // 光标闪烁
      if (i === showLines - 1 && Math.floor(t * 2) % 2 === 0) {
        ctx.fillText('_', cx - 250 + displayText.length * 11, cy + i * 28);
      }
    }
    ctx.textAlign = 'center';

    // 进度指示器（local 0.3-0.5 时）
    if (local > 0.3 && local < 0.5) {
      const progressBarY = cy + 240;
      const progressBarWidth = 400;
      const progressPercent = (local - 0.3) / 0.2;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(cx - progressBarWidth / 2, progressBarY, progressBarWidth, 20);

      ctx.fillStyle = this.hl;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(cx - progressBarWidth / 2 + 2, progressBarY + 2, (progressBarWidth - 4) * progressPercent, 16);

      this._font(14);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fillText('PROCESSING...', cx, progressBarY + 40);
    }

    // 巨大的红色 EXECUTED 盖章（local > 0.5 时砸下来）
    if (local > 0.5) {
      const stampAge = local - 0.5;
      const stampY = cv.height * 0.5 - Math.max(0, (1 - stampAge * 2)) * 200; // 从上方落下
      const stampAlpha = Math.min(1, stampAge * 3);
      const stampRot = -0.15 + Math.sin(t * 0.3) * 0.03;

      // 盖章砸下时的冲击波
      if (stampAge < 0.3) {
        const impactRadius = stampAge * 300;
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.globalAlpha = (0.3 - stampAge) * 2;
        ctx.beginPath();
        ctx.arc(cx, cv.height * 0.5, impactRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, stampY);
      ctx.rotate(stampRot);

      // 盖章阴影
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = stampAlpha * 0.3;
      ctx.beginPath();
      ctx.arc(5, 5, 95, 0, Math.PI * 2);
      ctx.fill();

      // 外框双圆
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.globalAlpha = stampAlpha * 0.95;
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.stroke();

      // 盖章纹理线条
      ctx.lineWidth = 1;
      ctx.globalAlpha = stampAlpha * 0.4;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
        ctx.lineTo(Math.cos(angle) * 85, Math.sin(angle) * 85);
        ctx.stroke();
      }

      // EXECUTED 文字
      this._font(45);
      ctx.fillStyle = '#dc2626';
      ctx.globalAlpha = stampAlpha * 0.9;
      ctx.fillText('EXECUTED', 0, 10);

      ctx.restore();

      // 盖章周围的红色粒子飞溅
      if (stampAge < 0.5) {
        this._font(20);
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const dist = stampAge * 150;
          const px = cx + Math.cos(angle) * dist;
          const py = cv.height * 0.5 + Math.sin(angle) * dist;
          ctx.globalAlpha = Math.max(0, (0.5 - stampAge) * 2);
          ctx.fillStyle = '#dc2626';
          ctx.fillText('●', px, py);
        }
      }
    }

    // "EXECUTION" 标题
    this._font(70);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95;
    ctx.fillText('EXECUTION', cx, cv.height * 0.8);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* BOOT：电源按钮启动 + 电路脉冲扩散 */
  fx_boot(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.35;

    // 整体淡出（local > 0.8 时）
    const fadeOut = local > 0.8 ? 1 - (local - 0.8) * 5 : 1;

    // 中心电源按钮（圆形，带电源符号）
    const buttonSize = 60 + Math.sin(t * 3) * 5;
    ctx.strokeStyle = this.hl;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.beginPath();
    ctx.arc(cx, cy, buttonSize, 0, Math.PI * 2);
    ctx.stroke();

    // 电源符号（⏻ 的手绘版）
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.9 * fadeOut;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 18, Math.PI * 0.7, Math.PI * 2.3, false);
    ctx.stroke();

    // 按下效果（local < 0.2 时按钮发光）
    if (local < 0.2) {
      ctx.fillStyle = this.hl;
      ctx.globalAlpha = (0.2 - local) * 5 * 0.6 * fadeOut;
      ctx.beginPath();
      ctx.arc(cx, cy, buttonSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 电路脉冲波从中心扩散（多层同心圆）
    const pulseCount = Math.floor(local * 4);
    for (let i = 0; i < pulseCount; i++) {
      const pulseAge = local * 4 - i;
      const pulseRadius = buttonSize + pulseAge * 120;
      ctx.strokeStyle = this.hl;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, 0.8 - pulseAge * 0.5) * fadeOut;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 脉冲上的小光点
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2 + t;
        const px = cx + Math.cos(angle) * pulseRadius;
        const py = cy + Math.sin(angle) * pulseRadius;
        this._font(15);
        ctx.fillStyle = this.hl;
        ctx.globalAlpha = Math.max(0, 0.8 - pulseAge * 0.5) * fadeOut;
        ctx.fillText('●', px, py);
      }
    }

    // 电路线条向四周延伸
    if (local > 0.3) {
      const lineProgress = (local - 0.3) * 1.5;
      const lineCount = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const length = lineProgress * 200;
        ctx.globalAlpha = 0.6 * fadeOut;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * buttonSize, cy + Math.sin(angle) * buttonSize);
        ctx.lineTo(cx + Math.cos(angle) * (buttonSize + length), cy + Math.sin(angle) * (buttonSize + length));
        ctx.stroke();

        // 线条末端节点
        this._font(18);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7 * fadeOut;
        ctx.fillText('◆', cx + Math.cos(angle) * (buttonSize + length), cy + Math.sin(angle) * (buttonSize + length));
      }
    }

    // "POWER ON" 文字
    this._font(55);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.fillText('POWER ON', cx, cv.height * 0.75);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* PROTECTION：六边形护盾展开 + 能量波纹 */
  fx_shield(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.35;

    // 整体淡出
    const fadeOut = local > 0.75 ? 1 - (local - 0.75) * 4 : 1;

    // 六边形护盾逐渐展开
    const shieldSize = Math.min(1, local * 1.5) * 150;
    const sides = 6;
    ctx.strokeStyle = this.hl;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9 * fadeOut;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * shieldSize;
      const y = cy + Math.sin(angle) * shieldSize;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 内层护盾网格
    if (local > 0.3) {
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 * fadeOut;
      const innerSize = shieldSize * 0.7;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * innerSize;
        const y = cy + Math.sin(angle) * innerSize;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 能量波纹扩散
    const ripples = Math.floor(local * 3);
    for (let i = 0; i < ripples; i++) {
      const rippleAge = (local * 3 - i) * 0.7;
      const rippleSize = shieldSize * (1 + rippleAge * 0.5);
      ctx.globalAlpha = Math.max(0, 0.5 - rippleAge) * fadeOut;
      ctx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * rippleSize;
        const y = cy + Math.sin(angle) * rippleSize;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // "PROTECTION" 大字
    this._font(65);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.fillText('PROTECTION', cx, cv.height * 0.75);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* OBJECT CREATION：粒子聚合成形 */
  fx_creation(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.35;

    // 整体淡出
    const fadeOut = local > 0.75 ? 1 - (local - 0.75) * 4 : 1;

    // 粒子从四周向中心聚集
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      const progress = Math.min(1, local * 1.2);
      const angle = (i / particleCount) * Math.PI * 2 + t * 0.5;
      const startDist = 300 + this._rnd(i, 1) * 200;
      const dist = startDist * (1 - progress);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      this._font(15 + this._rnd(i, 2) * 10);
      ctx.globalAlpha = progress * 0.8 * fadeOut;
      ctx.fillStyle = i % 3 === 0 ? this.hl : color;
      ctx.fillText('●', px, py);
    }

    // 中心立方体旋转（形成中）
    if (local > 0.4) {
      const cubeSize = Math.min(1, (local - 0.4) * 2) * 80;
      const rotX = t * 0.8;
      const rotY = t * 1.2;

      ctx.strokeStyle = this.hl;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9 * fadeOut;

      // 简化的 3D 立方体线框
      const vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
      ];
      const edges = [
        [0,1],[1,2],[2,3],[3,0], [4,5],[5,6],[6,7],[7,4], [0,4],[1,5],[2,6],[3,7]
      ];

      const project = (v) => {
        const [x, y, z] = v;
        const rx = x * Math.cos(rotY) - z * Math.sin(rotY);
        const rz = x * Math.sin(rotY) + z * Math.cos(rotY);
        const ry = y * Math.cos(rotX) - rz * Math.sin(rotX);
        return [cx + rx * cubeSize, cy + ry * cubeSize];
      };

      edges.forEach(([a, b]) => {
        const [x1, y1] = project(vertices[a]);
        const [x2, y2] = project(vertices[b]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    // "OBJECT CREATION" 大字
    this._font(60);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.fillText('OBJECT CREATION', cx, cv.height * 0.75);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* INITIALIZATION：进度条加载 + 系统启动 */
  fx_init(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.4;

    // 整体淡出
    const fadeOut = local > 0.75 ? 1 - (local - 0.75) * 4 : 1;

    // 进度条
    const barWidth = 400;
    const barHeight = 30;
    const progress = Math.min(1, local * 1.3);

    // 外框
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8 * fadeOut;
    ctx.strokeRect(cx - barWidth / 2, cy - barHeight / 2, barWidth, barHeight);

    // 填充进度
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.7 * fadeOut;
    ctx.fillRect(cx - barWidth / 2 + 2, cy - barHeight / 2 + 2, (barWidth - 4) * progress, barHeight - 4);

    // 百分比数字
    this._font(35);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.fillText(Math.floor(progress * 100) + '%', cx, cy + 8);

    // 系统启动信息滚动
    const logs = [
      'Initializing core systems...',
      'Loading neural networks...',
      'Allocating memory blocks...',
      'Establishing connections...',
      'Ready.',
    ];
    const showLogs = Math.min(logs.length, Math.floor(local * 6));
    this._font(16);
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    for (let i = 0; i < showLogs; i++) {
      ctx.globalAlpha = 0.7 * fadeOut;
      ctx.fillText(logs[i], cx - barWidth / 2, cy + 50 + i * 22);
    }
    ctx.textAlign = 'center';

    // "INITIALIZATION" 大字
    this._font(60);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.fillText('INITIALIZATION', cx, cv.height * 0.8);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* SIMULATION：网格世界展开 + 数据流 */
  fx_simulation(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.35;

    // 整体淡出
    const fadeOut = local > 0.8 ? 1 - (local - 0.8) * 5 : 1;

    // 网格地平线（透视网格向远方延伸）
    const gridSize = 40;
    const gridCount = 12;
    const progress = Math.min(1, local * 0.8);

    ctx.strokeStyle = this.hl;
    ctx.lineWidth = 1.5;

    // 横向网格线
    for (let i = 0; i < gridCount; i++) {
      const y = cy + i * gridSize * progress - 100;
      const width = cv.width * 0.6 * (1 - i / gridCount * 0.7);
      ctx.globalAlpha = (1 - i / gridCount) * 0.6 * fadeOut;
      ctx.beginPath();
      ctx.moveTo(cx - width / 2, y);
      ctx.lineTo(cx + width / 2, y);
      ctx.stroke();
    }

    // 纵向网格线
    for (let i = -6; i <= 6; i++) {
      const x = cx + i * gridSize;
      ctx.globalAlpha = 0.5 * fadeOut;
      ctx.beginPath();
      ctx.moveTo(x, cy - 100);
      ctx.lineTo(cx + i * gridSize * 0.3, cy + gridCount * gridSize * progress - 100);
      ctx.stroke();
    }

    // 数据流粒子在网格上飞行
    const streamCount = 20;
    for (let i = 0; i < streamCount; i++) {
      const streamProgress = (local * 2 + i / streamCount) % 1;
      const sx = cx + (this._rnd(i, 1) - 0.5) * cv.width * 0.5;
      const sy = cy - 100 + streamProgress * gridCount * gridSize * progress;
      this._font(18);
      ctx.globalAlpha = (1 - streamProgress) * 0.8 * fadeOut;
      ctx.fillStyle = this.hl;
      ctx.fillText('◆', sx, sy);
    }

    // "SIMULATION" 大字
    this._font(65);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = 0.95 * fadeOut;
    ctx.fillText('SIMULATION', cx, cv.height * 0.8);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
  }

  /* enter：双开门打开，光点涌出 */
  fx_enter(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.27;
    const p = Math.min(1, local / 2), gap = 20 + p * 90;
    this._font(17);
    ctx.fillStyle = color;
    for (let y = -90; y <= 90; y += 15) {
      ctx.globalAlpha = .9;
      ctx.fillText('█', cx - gap, cy + y);
      ctx.fillText('█', cx + gap, cy + y);
    }
    this._font(13);
    for (let i = 0; i < 20; i++) {
      const r = this._rnd(i, 1) * gap;
      const y = (this._rnd(i, 2) * 180 - 90) + Math.sin(t * 3 + i) * 6;
      ctx.globalAlpha = .15 + .5 * (1 - r / Math.max(gap, 1));
      ctx.fillText('·', cx - r, cy + y);
    }
    ctx.globalAlpha = 1;
    this._label('ENTER', cx, cy + 126, color, .8, 15);
  }

  /* you have left：你转身离开，留下足迹 */
  fx_left(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const p = Math.min(1, local / 3);
    const x = cx + 180 - p * 360;
    this._font(18);
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0, 1 - p * .9);
    ctx.fillText('[ you ]', x, cy);
    this._font(13);
    for (let k = 1; k < 10; k++) {
      ctx.globalAlpha = .5 * (1 - k / 10);
      ctx.fillText('·', x + k * 26, cy + (k % 2 ? 4 : -4));
    }
    ctx.globalAlpha = 1;
    this._label('peer: you → offline', cx, cy + 62, '#ff5f56', .7, 14);
  }

  /* then maybe：问号飘浮 */
  fx_maybe(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.3;
    this._font(22);
    ctx.fillStyle = color;
    for (let i = 0; i < 9; i++) {
      const p = (local * .22 + i / 9) % 1;
      const x = cx + (this._rnd(i, 6) - .5) * 460 + Math.sin(t * 2 + i) * 14;
      const y = cy + 80 - p * 220;
      ctx.globalAlpha = .7 * Math.sin(p * Math.PI);
      ctx.fillText('?', x, y);
    }
    ctx.globalAlpha = 1;
    this._label('maybe...', cx, cy + 112, color, .6, 14);
  }

  /* 挑战神：ME vs GOD 对撞 */
  fx_challenge(t, local, pulse, color) {
    const { ctx, cv } = this;
    const cx = cv.width / 2, cy = cv.height * 0.26;
    const jit = () => (Math.random() - .5) * 4;
    this._font(30);
    ctx.fillStyle = color;
    ctx.globalAlpha = .95;
    ctx.fillText('ME', cx - 150 + jit(), cy + jit());
    ctx.fillText('GOD', cx + 150 + jit(), cy + jit());
    const bursts = '✱*#@';
    this._font(26);
    ctx.fillStyle = this.hl;
    ctx.globalAlpha = .9;
    ctx.fillText(bursts[(Math.random() * 4) | 0], cx + jit(), cy + jit());
    this._label('challenge(god)', cx, cy + 72, color, .75, 14);
    ctx.globalAlpha = 1;
  }
}
