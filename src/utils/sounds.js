class Sound {
  constructor() {
    this._ctx  = null
    this.on    = JSON.parse(localStorage.getItem('psych_snd') ?? 'true')
  }

  ctx() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (this._ctx.state === 'suspended') this._ctx.resume()
    return this._ctx
  }

  // Core tone builder
  tone({ freq = 440, type = 'sine', vol = 0.22, dur = 0.18, delay = 0, rampDown = true }) {
    if (!this.on) return
    try {
      const c   = this.ctx()
      const t   = c.currentTime + delay
      const osc = c.createOscillator()
      const gn  = c.createGain()
      osc.connect(gn); gn.connect(c.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, t)
      gn.gain.setValueAtTime(0, t)
      gn.gain.linearRampToValueAtTime(vol, t + 0.012)
      if (rampDown) gn.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.start(t); osc.stop(t + dur + 0.02)
    } catch {}
  }

  // ── Game sounds ───────────────────────────────────────────────
  start() {
    // Upward chime — game starts
    [262,330,392,523].forEach((f, i) =>
      this.tone({ freq:f, vol:0.18, dur:0.25, delay:i*0.1 }))
  }

  submit() {
    // Two-note lock — answer locked in
    this.tone({ freq:523, vol:0.2, dur:0.12, delay:0 })
    this.tone({ freq:659, vol:0.22, dur:0.18, delay:0.1 })
  }

  vote() {
    // Soft click — vote submitted
    this.tone({ freq:440, vol:0.18, dur:0.1 })
  }

  reveal() {
    // Short dramatic whoosh — card revealed
    this.tone({ freq:660, type:'triangle', vol:0.2, dur:0.22 })
    this.tone({ freq:880, type:'sine',     vol:0.1, dur:0.12, delay:0.08 })
  }

  realAnswer() {
    // Fanfare — real answer revealed
    [523,659,784,1047].forEach((f, i) =>
      this.tone({ freq:f, vol:0.25, dur:0.28, delay:i*0.09 }))
  }

  wrong() {
    // Descending buzzer — wrong answer / no points
    this.tone({ freq:330, type:'sawtooth', vol:0.15, dur:0.15, delay:0 })
    this.tone({ freq:220, type:'sawtooth', vol:0.18, dur:0.25, delay:0.12 })
  }

  psyched() {
    // "Gotcha" — you fooled someone
    this.tone({ freq:392, vol:0.2, dur:0.12, delay:0 })
    this.tone({ freq:523, vol:0.22, dur:0.2,  delay:0.1 })
  }

  tick() {
    // Timer tick — last 5 seconds
    this.tone({ freq:880, vol:0.1, dur:0.06 })
  }

  win() {
    // Victory fanfare
    [262,330,392,523,659,784].forEach((f, i) =>
      this.tone({ freq:f, vol:0.22, dur:0.32, delay:i*0.08 }))
  }

  toggle() {
    this.on = !this.on
    localStorage.setItem('psych_snd', JSON.stringify(this.on))
    return this.on
  }
}

export const sounds = new Sound()
