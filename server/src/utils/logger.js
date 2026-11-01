const LEVELS = { info: '🔵', warn: '🟡', error: '🔴', success: '🟢' };

function log(level, ...args) {
  const ts = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](`[${ts}] ${LEVELS[level]}`, ...args);
}

export const logger = {
  info: (...a) => log('info', ...a),
  warn: (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a),
  success: (...a) => log('success', ...a),
};