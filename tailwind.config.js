/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        game: ['"Exo 2"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          0: '#08080f',
          1: '#0f0f1c',
          2: '#161627',
          3: '#1e1e35',
          4: '#272742',
        },
        brand: {
          purple: '#9333ea',
          pink:   '#db2777',
          blue:   '#2563eb',
          cyan:   '#0891b2',
        }
      },
      animation: {
        'float':       'float 4s ease-in-out infinite',
        'pulse-ring':  'pulseRing 2s ease-out infinite',
        'slide-up':    'slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-down':  'slideDown 0.4s ease-out both',
        'pop-in':      'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'shake':       'shake 0.4s ease-in-out',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'score-fly':   'scoreFly 1.2s ease-out forwards',
        'reveal-card': 'revealCard 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        'confetti-fall':'confettiFall linear forwards',
        'timer-warn':  'timerWarn 0.5s ease-in-out infinite',
      },
      keyframes: {
        float:      { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-10px)'} },
        pulseRing:  { '0%':{transform:'scale(1)',opacity:'0.8'}, '100%':{transform:'scale(1.6)',opacity:'0'} },
        slideUp:    { from:{opacity:'0',transform:'translateY(24px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        slideDown:  { from:{opacity:'0',transform:'translateY(-16px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        popIn:      { '0%':{transform:'scale(0.4)',opacity:'0'}, '70%':{transform:'scale(1.08)'}, '100%':{transform:'scale(1)',opacity:'1'} },
        shake:      { '0%,100%':{transform:'translateX(0)'}, '20%':{transform:'translateX(-6px)'}, '60%':{transform:'translateX(6px)'} },
        glowPulse:  { '0%,100%':{boxShadow:'0 0 8px currentColor'}, '50%':{boxShadow:'0 0 30px currentColor, 0 0 60px currentColor'} },
        scoreFly:   { '0%':{opacity:'0',transform:'scale(0.5) translateY(0)'}, '40%':{opacity:'1',transform:'scale(1.4) translateY(-16px)'}, '100%':{opacity:'0',transform:'scale(1) translateY(-40px)'} },
        revealCard: { '0%':{opacity:'0',transform:'rotateY(-90deg) scale(0.8)'}, '60%':{transform:'rotateY(10deg)'}, '100%':{opacity:'1',transform:'rotateY(0) scale(1)'} },
        timerWarn:  { '0%,100%':{transform:'scale(1)'}, '50%':{transform:'scale(1.15)'} },
      },
      backgroundImage: {
        'gradient-game':  'linear-gradient(135deg, #9333ea 0%, #db2777 50%, #2563eb 100%)',
        'gradient-card':  'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(147,51,234,0.5)',
        'glow-pink':   '0 0 20px rgba(219,39,119,0.5)',
        'glow-green':  '0 0 20px rgba(34,197,94,0.5)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.5)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        'btn':         '0 4px 16px rgba(0,0,0,0.3)',
      },
    }
  },
  plugins: []
}
