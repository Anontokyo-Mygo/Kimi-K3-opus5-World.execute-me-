/* ================================================================
 * 代码雨（Matrix Rain）
 * 每个字符列有独立的密度门限 gate，密度变化时平滑增减列数
 * ================================================================ */

class Rain {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.fs = 16;                       // 字号/列宽
    this.chars = 'アイウエオカキクケコサシスセソタチツテト01<>[]{}()=+-*/;:.#$%&!?→⇒∞∫π';
    // 目标值 / 当前值（平滑过渡）
    this.density = 0.3;  this._density = 0.3;
    this.speed   = 1.0;  this._speed   = 1.0;
    this.pulse   = 0;                    // 节拍脉冲 1→0 衰减
    this.setColor('#00ff9c');
    this.setTheme('dark');               // 明暗主题（拖尾底色 / 亮头颜色）
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /* 明暗切换：dark = 黑底白亮头，light = 纸白底深墨亮头 */
  setTheme(name) {
    this.theme = name;
    if (name === 'light') {
      this.bgFade = 'rgba(238, 246, 240, 0.16)';
      this.head = [8, 30, 20];
    } else {
      this.bgFade = 'rgba(2, 6, 4, 0.16)';
      this.head = [255, 255, 255];
    }
  }

  resize() {
    this.cv.width = innerWidth;
    this.cv.height = innerHeight;
    const n = Math.ceil(this.cv.width / this.fs);
    this.drops = Array.from({ length: n }, () => this._newDrop(true));
  }

  _newDrop(anywhere) {
    return {
      y: anywhere ? Math.random() * (this.cv.height / this.fs) : Math.random() * -20,
      v: 0.3 + Math.random() * 0.9,
      gate: Math.random(),              // 密度门限：gate < density 时显示
    };
  }

  setTarget(density, speed, colorHex) {
    this.density = density;
    this.speed = speed;
    if (colorHex) this.setColor(colorHex);
  }

  setColor(hex) {
    this.rgb = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  _mixHead(f) {  // 向亮头色混合 f∈[0,1]
    const [r, g, b] = this.rgb;
    const [hr, hg, hb] = this.head;
    const m = (c, h) => Math.round(c + (h - c) * f);
    return `rgb(${m(r, hr)},${m(g, hg)},${m(b, hb)})`;
  }

  rndChar() {
    return this.chars[(Math.random() * this.chars.length) | 0];
  }

  tick(dt) {
    const k = Math.min(1, dt * 2);
    this._density += (this.density - this._density) * k;
    this._speed   += (this.speed   - this._speed)   * k;
    this.pulse *= Math.pow(0.02, dt);               // 脉冲快速衰减
    this.time = (this.time || 0) + dt;              // 风摆计时

    const { ctx, cv, fs } = this;
    // 拖尾：半透明底色覆盖
    ctx.fillStyle = this.bgFade;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = fs + 'px "JetBrains Mono", Consolas, monospace';
    ctx.textBaseline = 'top';

    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      if (d.gate > this._density) continue;
      // 风：整列随正弦缓慢摆动
      const x = i * fs + Math.sin(this.time * 0.9 + i * 0.25) * 6;
      const y = d.y * fs;

      // 头部亮字符（节拍脉冲时更亮）
      ctx.fillStyle = this._mixHead(0.25 + this.pulse * 0.7 * (1 - d.gate));
      ctx.fillText(this.rndChar(), x, y);
      // 上一格残影
      const [r, g, b] = this.rgb;
      ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
      ctx.fillText(this.rndChar(), x, y - fs);

      d.y += d.v * this._speed * dt * 10;
      if (y - 20 * fs > cv.height) Object.assign(d, this._newDrop(false));
    }
  }
}
