import {LocalSettings} from "@node-red/runtime";
import Logger, {isDev} from "../../utils/logger";
import express from "express";
import http from "http";
import nodeRed from "node-red";
import path from "path";
import fs from "fs-extra";


const logger = new Logger(module);


export default class EmbeddedNodeRed {
    constructor(private settingsFileName: string) {
        const settings: LocalSettings = this.getSettingsFile();

        const level = Logger.debugModules.includes('node-red') ?
             'debug' : (isDev ? 'info' : 'warn');
        if (settings.logging?.console)
            settings.logging.console.level = level;

        // setting up ExpressJS Server
        const app = express();
        const server = http.createServer(app);
        app.use("/",express.static("assets"));
        nodeRed.init(server, settings);
        app.use(settings.httpAdminRoot || "", nodeRed.httpAdmin);
        app.use(settings.httpNodeRoot || "", nodeRed.httpNode);
        server.listen(settings.uiPort, settings.uiHost);
    }

    async start() {
        return new Promise<void>((accept, reject) => {
            logger.debug("Starting Node-RED");

            nodeRed.runtime.events.once("flows:started", () => {
                logger.debug("Node-RED Flows started");
                accept();
            });

            // Starting RED
            nodeRed.start().then(() => {
                const host = nodeRed.settings.get('uiHost');
                const port = nodeRed.settings.get('uiPort');
                const httpAdminRoot = nodeRed.settings.get('httpAdminRoot');
                const httpNodeRoot = nodeRed.settings.get('httpNodeRoot');

                logger.info(`Node-RED running on http://${host}:${port}${httpAdminRoot}/`);
                logger.info(`Node-RED UI is on http://${host}:${port}${httpNodeRoot}/`);
            }).catch(reject);
        })
    }

    getSettingsFile(): LocalSettings {
        let settingsFile;
        const userSettingsFile = path.join(process.cwd(), this.settingsFileName);
        if (fs.existsSync(userSettingsFile)) {
            // "<current project folder>/nodered.settings.js" exists
            settingsFile = userSettingsFile;
        } else {
            const defaultSettings = path.join(process.cwd(), 'assets', 'nodered.defaults.js');
            const settingsStat = fs.statSync(defaultSettings);
            if (settingsStat.mtime.getTime() <= settingsStat.ctime.getTime()) {
                // Default settings file has not been modified - safe to copy
                fs.copySync(defaultSettings, userSettingsFile);
                settingsFile = userSettingsFile;
            } else {
                // Use default settings.js as it has been modified
                settingsFile = defaultSettings;
            }
        }
        return require(settingsFile);
    }
}