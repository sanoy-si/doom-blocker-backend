(function() {
  class TopazLogger {
    constructor(scope = 'Topaz') {
      this.scope = scope;
      this.level = 'info'; // debug|info|warn|error
    }
    setLevel(level) {
      this.level = level;
    }
    debug(...args) { if (this._ok('debug')) console.debug(`[${this.scope}]`, ...args); }
    info(...args)  { if (this._ok('info'))  console.info(`[${this.scope}]`,  ...args); }
    warn(...args)  { if (this._ok('warn'))  console.warn(`[${this.scope}]`,  ...args); }
    error(...args) { if (this._ok('error')) console.error(`[${this.scope}]`, ...args); }
    _ok(level) {
      const order = { debug: 0, info: 1, warn: 2, error: 3 };
      const current = order[this.level] ?? 1;
      return (order[level] ?? 1) >= current;
    }
  }
  // expose globally in content context
  window.TopazLogger = TopazLogger;
})();
