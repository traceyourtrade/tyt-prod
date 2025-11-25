// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'loadPlain': 'loadPlain 5s linear forwards',
        'loadPlainSlow': 'loadPlain 12s linear forwards',
      },
      keyframes: {
        loadPlain: {
          'from': { width: '0px' },
          'to': { width: '320px' }
        }
      }
    }
  }
}