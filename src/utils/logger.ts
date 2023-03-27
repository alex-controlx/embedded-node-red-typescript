import path from "path";

import DotEnvDebug from "./debug_tracker";

export const isDev = !process.env.NODE_ENV || process.env.NODE_ENV.trim() !== "production";
let lastLoggedAt = Date.now();

/**
 * Custom Logger class
 * The log includes the timestamp, module name, log level, the message and the time since the last log.
 * 2023-03-11 23:53:30.965 - main - INFO - Starting app3 [1006ms]
 */
export default class Logger {
    static isDebugAll = false;
    static debugModules: string[] = [];
    private readonly name: string;

    constructor(module: NodeModule) {
        this.name = path.parse(module.filename).name;
    }

    public debug(...args: any) {
        if (Logger.isDebugAll || Logger.debugModules.includes(this.name)) {
            let caller = '';
            if (isDev) {
                const callerProps = new Error().stack?.split("\n")[2]?.trim().split(" ") || [];
                caller = callerProps.length < 3 ? '<constructor>' : callerProps[1];
            }
            const prefix = this.prefix('DEBUG', caller);
            console.log(prefix, ...args);
        }
    }

    public info(...args: any) {
        let caller = '';
        if (isDev) {
            const callerProps = new Error().stack?.split("\n")[2]?.trim().split(" ") || [];
            caller = callerProps.length < 3 ? '<constructor>' : callerProps[1];
        }
        const prefix = this.prefix('INFO', caller);
        console.log(prefix, ...args);
    }

    public warn(...args: any) {
        let caller = '';
        if (isDev) {
            const callerProps = new Error().stack?.split("\n")[2]?.trim().split(" ") || [];
            caller = callerProps.length < 3 ? '<constructor>' : callerProps[1];
        }
        const prefix = this.prefix('WARN', caller);
        console.warn(prefix, ...args);
    }

    public error(error: Error | string) {
        let caller = '';
        if (isDev) {
            const callerProps = new Error().stack?.split("\n")[2]?.trim().split(" ") || [];
            caller = callerProps.length < 3 ? '<constructor>' : callerProps[1];
        }
        const prefix = this.prefix('ERROR', caller);
        const message = typeof error === "string" ? error : (error.message ? error.message : error);
        console.error(prefix, message);
    }

    private prefix(level: string, callerName?: string): string {
        const now = new Date();
        const diff = now.getTime() - lastLoggedAt;
        lastLoggedAt = now.getTime();
        callerName = callerName ? this.name + '.' + callerName : this.name;
        return Logger.timePrefix(now) + ' [' + diff + 'ms]' + ' - ' + level + ' - ' + callerName + " -";
    }

    static timePrefix(now?: Date): string {
        // Get correct time format
        now = now || new Date();
        // Offset the timezone
        const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return date
            .toISOString()
            .replace('T', ' ')
            .replace('Z', '');
    }

    static timestampedMessage(message: string): string {
        return Logger.timePrefix() + ' - ' + message;
    }
}


const envDebugPath = ".env.debug";
const logger = new Logger(module);
logger.info(` ====== Starting the module in ${isDev ? "DEVELOPMENT" : "PRODUCTION"} mode ====== `);

try {
    new DotEnvDebug(Logger.debugModules, envDebugPath, logger);
    if (Logger.debugModules.includes('all'))
        Logger.isDebugAll = true;
} catch (err: any) {
    logger.error(err);
    Logger.isDebugAll = true;
}
