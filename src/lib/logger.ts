const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const currentLevel = process.env.LOG_LEVEL || 'info';

class Logger {
    constructor() {
        this.level = LOG_LEVELS[currentLevel] || LOG_LEVELS.info;
    }

    log(level, message, meta = {}) {
        if (LOG_LEVELS[level] <= this.level) {
            const timestamp = new Date().toISOString();
            console.log(JSON.stringify({ timestamp, level, message, ...meta }));
        }
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }
}

export const logger = new Logger();
