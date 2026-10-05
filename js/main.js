/* ================================================================
 * 主引擎：时钟 / 场景调度 / 歌词渲染 / 节拍脉冲 / 故障特效
 * ================================================================ */

(() => {
  const $ = (id) => document.getElementById(id);
  const app = $('app');

  /* ---------- 模块实例 ---------- */
  const rain   = new Rain($('rain'));
  const shapes = new Shapes($('stage'));
  const log    = new LogTerm($('log-lines'));
  const typer  = new CodeTyper($('code-content'), $('code-filename'));
  const lyricBox  = $('lyric-box');
  const lyricMain = $('lyric-main');
  const lyricSub  = $('lyric-sub');
  const flashEl   = $('flash-text');
  const glitchCv  = $('glitchfx');
  const glitchCtx = glitchCv.getContext('2d');

  /* 歌词九宫格位置（vw/vh 百分比） */
  const POS = {
    tl: [20, 27], tc: [50, 23], tr: [80, 27],
    ml: [21, 50], mc: [50, 50], mr: [79, 50],
    bl: [23, 73], bc: [50, 75], br: [77, 73],
  };

  const resizeGlitch = () => { glitchCv.width = innerWidth; glitchCv.height = innerHeight; };
  resizeGlitch();
  addEventListener('resize', resizeGlitch);

  /* ---------- 全局状态 ---------- */
  let mode = 'idle';           // idle | demo | audio
  let audio = null;
  let startStamp = 0;
  let pauseStart = 0;
  let paused = false;
  let ended = false;

  let scene = null;
  let pulse = 0;               // 节拍脉冲 1→0
  let lastBeat = -1;
  let logTimer = 0;
  let lastFrame = performance.now();

  /* ---------- 明暗主题：场景 theme 字段驱动，L 键循环 自动→亮→暗 ---------- */
  let themeMode = 'auto';      // auto | light | dark
  let theme = '';              // 当前生效的主题
  const pal = () => (theme === 'light' ? (CONFIG.colorsLight || CONFIG.colors) : CONFIG.colors);

  const lyrics = TIMELINE.filter(e => e.type === 'lyric').sort((a, b) => a.t - b.t);
  const flashes = TIMELINE.filter(e => e.type === 'flash').sort((a, b) => a.t - b.t);
  const logs = TIMELINE.filter(e => e.type === 'log').sort((a, b) => a.t - b.t);
  // fx 事件：歌词行附带的 fx + 独立 type:'fx' 事件
  const fxEvents = TIMELINE
    .filter(e => (e.type === 'lyric' && e.fx) || e.type === 'fx')
    .map(e => ({ t: e.t, name: e.fx || e.name, dur: e.dur || 0 }))
    .sort((a, b) => a.t - b.t);
  let lyricIdx = -1, flashKey = '', logIdx = -1;

  const GLYPHS = '!<>-_\\/[]{}=+*^?#%&@$01';

  /* ---------- 演示模式合成节拍（WebAudio） ---------- */
  class DemoBeat {
    constructor() {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ac.destination);
      this.muted = false;
      this.scale = [220, 261.63, 293.66, 329.63, 392, 440];
    }
    _env(gain, peak, dur) {
      const t0 = this.ac.currentTime;
      gain.gain.setValueAtTime(peak, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    }
    kick() {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      const t0 = this.ac.currentTime;
      o.frequency.setValueAtTime(150, t0);
      o.frequency.exponentialRampToValueAtTime(38, t0 + 0.12);
      this._env(g, 0.9, 0.16);
      o.connect(g); g.connect(this.master);
      o.start(); o.stop(t0 + 0.18);
    }
    hat() {
      const len = this.ac.sampleRate * 0.045;
      const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ac.createBufferSource(); src.buffer = buf;
      const hp = this.ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
      const g = this.ac.createGain(); this._env(g, 0.22, 0.05);
      src.connect(hp); hp.connect(g); g.connect(this.master);
      src.start();
    }
    blip(freq) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = 'square'; o.frequency.value = freq;
      this._env(g, 0.08, 0.22);
      o.connect(g); g.connect(this.master);
      const t0 = this.ac.currentTime;
      o.start(); o.stop(t0 + 0.24);
    }
    beat(i, intense) {
      this.kick();
      if (i % 2 === 1) this.hat();
      if (i % 4 === 2) this.blip(this.scale[((i / 4) | 0) % this.scale.length]);
      if (intense && i % 2 === 0) this.hat();
    }
    toggleMute() {
      this.muted = !this.muted;
      this.master.gain.value = this.muted ? 0 : 0.16;
    }
  }
  let demoBeat = null;

  /* ---------- 时钟 ---------- */
  const now = () => {
    if (mode === 'audio' && audio) return audio.currentTime;
    if (mode === 'demo') {
      const base = paused ? pauseStart : performance.now();
      return (base - startStamp) / 1000;
    }
    return 0;
  };
  const totalDuration = () =>
    (mode === 'audio' && audio && audio.duration) ? audio.duration : CONFIG.duration;

  /* ---------- 场景调度 ---------- */
  function sceneAt(t) {
    for (let i = SCENES.length - 1; i >= 0; i--) {
      if (t >= SCENES[i].t) return SCENES[i];
    }
    return SCENES[0];
  }

  function applyScene(s) {
    scene = s;
    applyTheme();
    document.body.dataset.color = s.color;
    const code = CODE_SNIPPETS[s.name];
    if (code) {
      const m = code.match(/^\/\/\s*(\S+)/);
      typer.show(code, m ? m[1] : s.name + '.js');
    }
    log.push('scene → ' + s.name);
  }

  /* 解析当前应生效的主题并应用到 body / 代码雨 / 中景画布 */
  function applyTheme() {
    const want = themeMode === 'auto' ? ((scene && scene.theme) || 'dark') : themeMode;
    if (want !== theme) {
      theme = want;
      document.body.dataset.theme = theme;
      rain.setTheme(theme);
      shapes.setTheme(theme);
      log.push('theme → ' + theme);
    }
    if (scene) rain.setTarget(scene.rain, scene.speed, pal()[scene.color] || pal().green);
    // 已显示的歌词按新调色板重染（不重播入场动画）
    const cur = lyrics[lyricIdx];
    if (cur && cur.t <= now()) applyLyricLayout(cur);
  }

  /* ---------- 歌词渲染 ---------- */
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* 应用歌词布局：位置 / 大小 / 角度 / 颜色（带 CSS 过渡，歌词会"飞"过去） */
  function applyLyricLayout(entry) {
    const posKey = entry.pos || 'mc';
    const p = POS[posKey] || POS.mc;
    const size = entry.size || 1;
    const rot = entry.rot || 0;
    const col = (entry.color && (pal()[entry.color] || entry.color)) || null;
    lyricBox.style.left = p[0] + '%';
    lyricBox.style.top = p[1] + '%';
    lyricBox.style.transform =
      `translate(-50%,-50%) rotate(${rot}deg) scale(${size})`;
    // 侧边位置收窄文本框防止出血
    lyricBox.style.maxWidth = (posKey === 'mc' || posKey === 'tc' || posKey === 'bc') ? '64vw' : '40vw';
    if (col) {
      lyricBox.style.color = col;
      lyricMain.style.color = col;
      lyricMain.style.textShadow = `0 0 10px ${col}, 0 0 42px ${col}88`;
    }
  }

  function scrambleText(text, progress) {
    const settled = Math.floor(progress * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      if (i < settled || text[i] === ' ') out += text[i];
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    return out;
  }

  let layoutIdx = -2;   // 已应用布局的歌词索引

  function renderLyric(t, activeFx) {
    // 推进歌词索引
    while (lyricIdx + 1 < lyrics.length && lyrics[lyricIdx + 1].t <= t) lyricIdx++;
    const cur = lyrics[lyricIdx];
    if (!cur || cur.t > t) {
      lyricMain.textContent = '';
      lyricMain.dataset.text = '';
      lyricMain.classList.remove('glitch');
      lyricSub.textContent = lyrics[0] ? '» ' + lyrics[0].text : '';
      return;
    }

    // 新歌词入场，或 fx 活跃状态变化时重新计算位置
    const wantPos = (activeFx && !cur.pos) ? 'bc' : (cur.pos || 'mc');
    if (layoutIdx !== lyricIdx || lyricBox._lastPos !== wantPos) {
      layoutIdx = lyricIdx;
      lyricBox._lastPos = wantPos;
      // 临时覆盖 pos 来移位，不修改原数据
      const overridden = wantPos !== (cur.pos || 'mc')
        ? { ...cur, pos: wantPos }
        : cur;
      applyLyricLayout(overridden);
      lyricBox.classList.remove('pop');
      void lyricBox.offsetWidth;
      lyricBox.classList.add('pop');
    }

    const next = lyrics[lyricIdx + 1];
    const dt = t - cur.t;
    const style = cur.style || 'type';
    let shown = cur.text;
    let caret = false;

    if (style === 'type') {
      const win = next ? Math.min(2.8, Math.max(0.8, next.t - cur.t - 0.25)) : 2.8;
      const rate = cur.text.length / win;
      const n = Math.min(cur.text.length, Math.floor(dt * rate));
      shown = cur.text.slice(0, n);
      caret = n < cur.text.length;
      lyricMain.classList.remove('glitch');
    } else if (style === 'scramble') {
      shown = scrambleText(cur.text, Math.min(1, dt / 0.7));
      lyricMain.classList.remove('glitch');
    } else if (style === 'glitch') {
      lyricMain.classList.add('glitch');
    }

    lyricMain.dataset.text = shown;
    lyricMain.innerHTML = esc(shown) + (caret ? '<span class="caret">▌</span>' : '');
    lyricSub.textContent = next ? '» ' + next.text : '';
    // 节拍脉冲（glitch 的 jitter 动画会覆盖 transform，自然失效，不冲突）
    lyricMain.style.transform = 'scale(' + (1 + pulse * 0.08) + ')';
  }

  /* ---------- 闪现大字 ---------- */
  // 根据文字内容自动分配视觉变体
  const FLASH_VARIANT = (() => {
    const execute = /^(EXECUTE|EXECUTION|RUN)$/;
    const keyword = /^(DIMENSION|CIRCUMFERENCE|TANGENTS|LIMITATIONS|STIMULATIONS|SATISFACTION|SIMULATION|VIBRATIONS|COMPLETION|ISOLATION|FRAGMENTS|DISHEARTENED|ILLEGAL ARGUMENTS|OBJECT CREATION|INITIALIZATION|PROTECTION)$/;
    const life    = /^(NUTRIENTS|ANTIOXIDANTS|ENJOYMENT|EXISTENCE)$/;
    const count   = /^(EIN|DOS|TROIS|NE|FEM|LIU)$/;
    const love    = /^LO-O-OVE$/;
    return (text) => {
      if (execute.test(text)) return 'fv-execute';
      if (keyword.test(text)) return 'fv-keyword';
      if (life.test(text))    return 'fv-life';
      if (count.test(text))   return 'fv-count';
      if (love.test(text))    return 'fv-love';
      return '';   // 默认样式
    };
  })();

  function renderFlash(t) {
    let active = null;
    for (const f of flashes) {
      if (f.t <= t && t < f.t + (f.dur || 0.6)) active = f;
      if (f.t > t) break;
    }
    if (active) {
      const key = active.t + active.text;
      if (key !== flashKey) {
        flashKey = key;
        flashEl.textContent = active.text;
        // 每次闪现随机倾斜一点，画面更活
        flashEl.style.setProperty('--fr', (Math.random() * 6 - 3).toFixed(1) + 'deg');
        // 清除旧变体类，加新变体类
        flashEl.className = '';
        const variant = FLASH_VARIANT(active.text);
        if (variant) flashEl.classList.add(variant);
        flashEl.classList.remove('show');
        void flashEl.offsetWidth;      // 重启动画
        flashEl.classList.add('show');
        if ((scene && scene.glitch) >= 0.5) shake();
      }
    } else if (flashKey !== '') {
      flashKey = '';
      flashEl.classList.remove('show');
    }
  }

  /* ---------- 故障切片 ---------- */
  function renderGlitchFx() {
    const { width: w, height: h } = glitchCv;
    glitchCtx.clearRect(0, 0, w, h);
    const g = scene ? scene.glitch : 0;
    if (g <= 0 || Math.random() > g * 0.6) return;
    const n = 2 + Math.floor(g * 6);
    for (let i = 0; i < n; i++) {
      const sy = Math.random() * h;
      const sh = 6 + Math.random() * 38;
      const dx = (Math.random() - 0.5) * 90 * g;
      glitchCtx.drawImage(shapes.cv, 0, sy, w, sh, dx, sy, w, sh);
    }
    // 偶发色相反转
    if (g > 0.7 && Math.random() < 0.05) {
      app.classList.add('invert');
      setTimeout(() => app.classList.remove('invert'), 90);
    }
  }

  function shake() {
    app.classList.remove('shake');
    void app.offsetWidth;
    app.classList.add('shake');
  }

  /* ---------- 节拍 ---------- */
  function onBeat(i, t) {
    pulse = 1;
    rain.pulse = 1;
    if (demoBeat) demoBeat.beat(i, scene && scene.glitch >= 0.7);
    if (scene && scene.glitch >= 0.6 && i % 2 === 0) shake();
    if (i % 4 === 0) log.random(LOG_POOL);
  }

  /* ---------- 主循环 ---------- */
  function frame() {
    requestAnimationFrame(frame);
    const nowMs = performance.now();
    const dt = Math.min(0.05, (nowMs - lastFrame) / 1000);
    lastFrame = nowMs;

    const t = now();

    // 场景
    const s = sceneAt(t);
    if (s !== scene) applyScene(s);

    // 节拍
    const beatIdx = Math.floor(t * CONFIG.bpm / 60);
    if (beatIdx !== lastBeat) { lastBeat = beatIdx; onBeat(beatIdx, t); }
    pulse *= Math.pow(0.02, dt);

    // 画布
    rain.tick(dt);
    shapes.draw(scene.shape, t, pulse, pal()[scene.color]);
    renderGlitchFx();

    // 歌词专属视觉 fx（取最近一个 fx 事件，dur 到期自动清除）
    let fxEv = null;
    for (const ev of fxEvents) { if (ev.t <= t) fxEv = ev; else break; }
    let fxName = '', fxLocal = 0;
    if (fxEv && fxEv.name !== 'none' && !(fxEv.dur && t > fxEv.t + fxEv.dur)) {
      fxName = fxEv.name;
      fxLocal = t - fxEv.t;
    }
    // 歌词有 fx 时自动移到底部让开中央；歌词自带 pos 时以 pos 为准
    const curLyric = lyrics[lyricIdx];
    const hasFx = fxName && fxName !== 'none';
    const fxZone = (curLyric && curLyric.pos && curLyric.pos !== 'mc') ? 'center' : 'top';

    // 有 fx 活跃且歌词没有指定位置时，把歌词框推到底部
    if (hasFx && curLyric && !curLyric.pos) {
      const p = POS['bc'];
      lyricBox.style.left = p[0] + '%';
      lyricBox.style.top  = p[1] + '%';
    }
    const fxMeta = { count: flashes.filter(f => f.text === 'EXECUTION' && f.t <= t).length };
    shapes.drawFx(fxName, t, fxLocal, pulse, pal()[scene.color], fxMeta, fxZone);
    app.classList.toggle('dizzy', fxName === 'dizzy');

    // HUD
    typer.tick(dt, scene.glitch > 0.5 ? 2.4 : 1);
    logTimer -= dt;
    if (logTimer <= 0) {
      log.random(LOG_POOL);
      logTimer = 1.7 / (1 + scene.glitch * 2);
    }
    // 时间轴上的固定日志
    while (logIdx + 1 < logs.length && logs[logIdx + 1].t <= t) {
      logIdx++;
      log.push(logs[logIdx].text);
    }

    if (mode !== 'idle') {
      renderLyric(t, fxName);
      renderFlash(t);
    }

    // 底部状态栏
    const dur = totalDuration();
    const pct = Math.min(100, (t / dur) * 100);
    $('progress-fill').style.width = pct + '%';
    $('progress-pct').textContent = pct.toFixed(1) + '%';
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(Math.floor(t % 60)).padStart(2, '0');
    const ff = String(Math.floor((t % 1) * 30)).padStart(2, '0');
    $('timecode').textContent = `${mm}:${ss}:${ff}`;
    $('beat-lamp').classList.toggle('on', pulse > 0.55);

    // 结束
    if (!ended && mode !== 'idle' && t >= dur) showEnd();
  }

  /* ---------- 开始 / 结束 ---------- */
  function begin(m) {
    mode = m;
    $('start-overlay').classList.add('hidden');
    startStamp = performance.now();
    lyricIdx = -1; flashKey = ''; logIdx = -1; lastBeat = -1;
    log.push('world.execute(me) → running');
  }

  function showEnd() {
    ended = true;
    $('end-overlay').classList.remove('hidden');
  }

  // 文件图标点击事件 - 自动检测 audio.mp3 或者提示用户
  $('file-icon').addEventListener('click', () => {
    // 先尝试加载 audio.mp3
    fetch('audio.mp3', { method: 'HEAD' })
      .then(r => {
        if (r.ok) {
          // 找到了 audio.mp3，直接播放
          audio = new Audio('audio.mp3');
          audio.addEventListener('ended', showEnd);
          audio.play();
          begin('audio');
        } else {
          // 没有找到，提示用户把文件放到目录
          alert('未找到 audio.mp3 文件\n\n请将音频文件重命名为 audio.mp3 并放在本目录，然后刷新页面重试。');
        }
      })
      .catch(() => {
        // file:// 协议下 fetch 失败，尝试直接加载
        audio = new Audio('audio.mp3');
        audio.addEventListener('ended', showEnd);
        audio.addEventListener('error', () => {
          alert('未找到 audio.mp3 文件\n\n请将音频文件重命名为 audio.mp3 并放在本目录，然后刷新页面重试。');
        });
        audio.play().then(() => begin('audio')).catch(() => {});
      });
  });

  /* ---------- 对轴模式：T 开始/结束，J 打点，自动导出校准后的时间轴 ---------- */
  let syncMode = false, taps = [];
  const syncHud = $('sync-hud');

  function toggleSync() {
    if (mode === 'idle') return;
    syncMode = !syncMode;
    if (syncMode) {
      taps = [];
      syncHud.classList.remove('hidden');
      syncHud.innerHTML =
        '<b>◉ 对轴模式</b> · 每句歌词开唱瞬间按 <b>J</b> 打点（共 ' + lyrics.length + ' 句）<br>' +
        '已记录 <b>0</b> / ' + lyrics.length + ' 点 ｜ 打完按 <b>T</b> 导出 ｜ <b>Esc</b> 取消';
      log.push('sync mode ON');
    } else {
      log.push('sync mode OFF · taps=' + taps.length);
      exportTaps();
    }
  }

  function tap() {
    taps.push(now());
    syncHud.innerHTML =
      '<b>◉ 对轴模式</b> · 每句歌词开唱瞬间按 <b>J</b> 打点（共 ' + lyrics.length + ' 句）<br>' +
      '已记录 <b>' + taps.length + '</b> / ' + lyrics.length + ' 点 · 最近 @ ' +
      taps[taps.length - 1].toFixed(2) + 's ｜ 打完按 <b>T</b> 导出';
    log.push('tap ' + taps.length + ' @ ' + taps[taps.length - 1].toFixed(2) + 's');
    if (taps.length >= lyrics.length) toggleSync();   // 打满自动导出
  }

  function exportTaps() {
    const q = (s) => s.replace(/'/g, "\\'");
    const lines = lyrics.map((e, i) => {
      const t = taps[i] != null ? taps[i] : e.t;
      let s = "{ t: " + t.toFixed(2) + ", type: 'lyric', text: '" + q(e.text) +
              "', style: '" + (e.style || 'type') + "'";
      if (e.fx)    s += ", fx: '" + e.fx + "'";
      if (e.pos)   s += ", pos: '" + e.pos + "'";
      if (e.size != null) s += ', size: ' + e.size;
      if (e.rot != null)  s += ', rot: ' + e.rot;
      if (e.color) s += ", color: '" + e.color + "'";
      return s + ' },';
    });
    const note = taps.length < lyrics.length
      ? '// 注意：只打了 ' + taps.length + '/' + lyrics.length + ' 个点，剩余保持原时间\n'
      : '// 对轴完成：' + taps.length + ' 句歌词时间已校准\n';
    const out = note + lines.join('\n');
    console.log('\n===== 对轴结果（贴回 js/lyrics.js 的 TIMELINE）=====\n' + out);
    syncHud.innerHTML =
      '<b>✓ 对轴完成</b> · 已尝试复制到剪贴板，并输出到控制台（F12）<br>' +
      '<textarea readonly>' + out.replace(/</g, '&lt;') + '</textarea><br>' +
      '贴回 js/lyrics.js 替换 TIMELINE 中的 lyric 行 ｜ 按 <b>Esc</b> 关闭';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out).catch(() => {
        const ta = syncHud.querySelector('textarea');
        if (ta) { ta.focus(); ta.select(); }
      });
    }
  }

  /* ---------- 快捷键 ---------- */
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (mode === 'audio' && audio) {
        audio.paused ? audio.play() : audio.pause();
      } else if (mode === 'demo') {
        if (paused) { startStamp += performance.now() - pauseStart; paused = false; demoBeat.ac.resume(); }
        else { pauseStart = performance.now(); paused = true; demoBeat.ac.suspend(); }
      }
    } else if (e.key === 'ArrowLeft') {
      // 后退 5 秒
      e.preventDefault();
      if (mode === 'audio' && audio) {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
      }
    } else if (e.key === 'ArrowRight') {
      // 快进 5 秒
      e.preventDefault();
      if (mode === 'audio' && audio) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      }
    } else if (e.key >= '0' && e.key <= '9') {
      // 数字键 0-9 跳转到 0%-90% 位置
      e.preventDefault();
      if (mode === 'audio' && audio && audio.duration) {
        audio.currentTime = audio.duration * (parseInt(e.key) / 10);
      }
    } else if (e.key === 't' || e.key === 'T') {
      toggleSync();
    } else if (e.key === 'l' || e.key === 'L') {
      // 明暗主题：自动(跟随场景) → 强制亮 → 强制暗
      themeMode = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto';
      log.push('theme mode → ' + themeMode);
      applyTheme();
    } else if ((e.key === 'j' || e.key === 'J') && syncMode) {
      tap();
    } else if (e.key === 'Escape') {
      syncMode = false;
      syncHud.classList.add('hidden');
    } else if (e.key === 'm' || e.key === 'M') {
      if (audio) audio.muted = !audio.muted;
      if (demoBeat) demoBeat.toggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (e.key === 'r' || e.key === 'R') {
      location.reload();
    }
  });

  frame();
})();
