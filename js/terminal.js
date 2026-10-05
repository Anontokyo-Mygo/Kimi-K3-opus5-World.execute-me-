/* ================================================================
 * HUD：左侧日志终端 + 右侧自动打字代码编辑器
 * ================================================================ */

class LogTerm {
  constructor(el) {
    this.el = el;
    this.max = 12;
  }

  push(text) {
    const div = document.createElement('div');
    div.className = 'ln';
    div.textContent = '› ' + text;
    // 旧的行逐渐变暗
    [...this.el.children].forEach(c => c.classList.add('old'));
    this.el.appendChild(div);
    while (this.el.children.length > this.max) {
      this.el.removeChild(this.el.firstChild);
    }
  }

  /* 从随机池生成一条日志 */
  random(pool) {
    const tpl = pool[(Math.random() * pool.length) | 0];
    const text = tpl
      .replace('%n', String((Math.random() * 4096) | 0))
      .replace('%h', ((Math.random() * 0xffff) | 0).toString(16).padStart(4, '0'));
    this.push(text);
  }
}

/* ---------------------------------------------------------------- */

const TK_RE = /(\/\/[^\n]*)|('[^'\n]*'|"[^"\n]*")|\b(import|export|from|class|extends|constructor|function|return|const|let|var|new|if|else|for|while|this|await|async|switch|case|break|continue|true|false|null|try|catch|throw|of|in|typeof)\b|(\b\d+(?:\.\d+)?\b)/g;

function highlight(src) {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(TK_RE, (m, com, str, kw, num) => {
    if (com) return '<span class="tk-com">' + m + '</span>';
    if (str) return '<span class="tk-str">' + m + '</span>';
    if (kw)  return '<span class="tk-kw">'  + m + '</span>';
    if (num) return '<span class="tk-num">' + m + '</span>';
    return m;
  });
}

class CodeTyper {
  constructor(preEl, nameEl) {
    this.el = preEl;
    this.nameEl = nameEl;
    this.code = '';
    this.typed = 0;
    this.carry = 0;
    this.speed = 26;      // 字符/秒
  }

  show(code, filename) {
    this.code = code;
    this.typed = 0;
    this.carry = 0;
    if (filename && this.nameEl) this.nameEl.textContent = filename;
    this.render();
  }

  tick(dt, speedMul) {
    if (this.typed >= this.code.length) return;
    this.carry += dt * this.speed * (speedMul || 1);
    const step = Math.floor(this.carry);
    if (step > 0) {
      this.typed = Math.min(this.code.length, this.typed + step);
      this.carry -= step;
      this.render();
    }
  }

  render() {
    this.el.innerHTML = highlight(this.code.slice(0, this.typed)) +
      '<span class="caret">▌</span>';
  }
}
