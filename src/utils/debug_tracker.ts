import dotenv from 'dotenv';
import path from 'path';
import fs, { Stats } from 'fs';
import Logger from './logger';

export default class DotEnvDebug {
    /**
     * Reading file in `path` and setting the `MODULES` variable to the `modules` array
     * @param modules - Important it will be mutated
     * @param path
     * @param logger
     */
    constructor(private modules: string[], private path: string, private logger?: Logger) {
        if (!this.path) throw new Error('path is required');

        try {
            this.reloadDotEnvFile();
            this.watchDotEnvFileForChange();
        } catch (e: any) {
            (this.logger || console).error(e);
        }
    }

    private watchDotEnvFileForChange() {
        (this.logger || console).info(`Watching ${this.path} file for changes`);
        const filePath = path.resolve(process.cwd(), this.path);
        fs.watchFile(filePath, (curr: Stats, prev) => {
            if (curr.mtime !== prev.mtime) this.reloadDotEnvFile();
        });
    }

    private reloadDotEnvFile() {
        const envDebug = dotenv.config({ path: this.path });
        if (envDebug.error) throw envDebug.error;

        const newDebugModules: string | undefined = envDebug.parsed?.MODULES;
        if (newDebugModules != null) {
            this.modules.length = 0;
            this.modules.push(...newDebugModules.split(',').map(debugModule => debugModule.trim()));
            if (this.modules.length) (this.logger || console).info(`Current debug modules: ${this.modules.join(', ')}`);
        }
    }
}
