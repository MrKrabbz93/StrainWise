const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const currentLevel = process.env.LOG_LEVEL || 'info';

class Logger {
    private level: number;

    constructor() {
        this.level = LOG_LEVELS[currentLevel as keyof typeof LOG_LEVELS] || LOG_LEVELS.info;
    }

    log(level: string, message: string, meta: any = {}) {
        if (LOG_LEVELS[level as keyof typeof LOG_LEVELS] <= this.level) {
            const timestamp = new Date().toISOString();
            console.log(JSON.stringify({ timestamp, level, message, ...meta }));
        }
    }

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR', isOperational: boolean = true) {
    }

    error(message: string, meta: any = {}) {
        this.log('error', message, meta);
    }

    warn(message: string, meta: any = {}) {
        this.log('warn', message, meta);
    }

    info(message: string, meta: any = {}) {
        this.log('info', message, meta);
    }

    debug(message: string, meta: any = {}) {
        this.log('debug', message, meta);
    }
}

export const logger = new Logger();
