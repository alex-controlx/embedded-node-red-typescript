import * as http from "http";
import express from "express";
import Logger from "../utils/logger";
import nodeRed from "node-red";
import {LocalSettings, Permission} from "@node-red/runtime";
import {sendUiMessage, UiBackend} from "../classes/ui_backend";

const logger = new Logger(module);

export interface IAppGuiConfig {
    credentialSecret?: string;
    host?: string;
    port?: number
}

export class UiService {
    private static isInitialised = false;

    static async initAsync(config?: IAppGuiConfig) {
        if (this.isInitialised) return; // execute this method only once

        const nodeRedApp = new NodeRedService(config);
        await nodeRedApp.start();

        // add your initialisation code to send messages to the UI
        // an example:
        // const yourClass = new YourClass();
        // yourClass.on('change', (state: boolean) => {
        //     this.publishMessage('__change_example', {payload: state, topic: 'your_class'});
        // });

        // ==========================
        // Below is an example of sending messages every second
        setInterval(() => {
            sendUiMessage('__every_second_data',
                {payload: Math.random().toFixed(2), topic: '__every_second_data'}
            )
        }, 1000);


        this.isInitialised = true;
    }
}


class NodeRedService {
    private settings: LocalSettings = {
        uiHost: "0.0.0.0", uiPort: 1880,
        credentialSecret: "a-secret-key",
        httpAdminRoot: "/admin",
        httpNodeRoot: "",
        flowFile: process.cwd() + "/nodered_flows.json",
        flowFilePretty: true,
        userDir: "./nodered/",
        functionGlobalContext: {
            backend: UiBackend
        },
        paletteCategories: ['dashboard'],
        logging: {
            console: {
                level: Logger.debugModules.includes('node-red') ? 'debug' : 'warn',
                audit: false,
                metrics: false
            },
        },
        adminAuth: {
           type: "credentials",
           users: []
        },
        editorTheme: {
            page: {
                title: "Admin panel",
                favicon: process.cwd() + "/assets/favicon_admin.png",
            },
            header: {
                title: "Admin panel",
                image: process.cwd() + "/assets/company_logo.png",
                url: "https://github.com/alex-controlx/embedded-node-red-typescript"
            },
            projects: { enabled: false }
        },
        ui: { path: "" },
        contextStorage: {
            default: { module: "memory" },
            fs : { module: "localfilesystem" }
        }
    };

    constructor(config?: IAppGuiConfig) {
        config = config || {};

        if (config.host) this.settings.uiHost = config.host;
        if (process.env.DEFAULT_RED_HOST) this.settings.uiHost = process.env.DEFAULT_RED_HOST;

        if (config.port) this.settings.uiPort = config.port;
        if (Number(process.env.DEFAULT_RED_PORT)) this.settings.uiPort = Number(process.env.DEFAULT_RED_PORT);

        if (config.credentialSecret) this.settings.credentialSecret = config.credentialSecret;

        if (process.env.NODE_RED_ADMIN_USER && process.env.NODE_RED_ADMIN_PASSWORD_HASH) {
            const username = {
               username: process.env.NODE_RED_ADMIN_USER,
               password: process.env.NODE_RED_ADMIN_PASSWORD_HASH,
               permissions: ('*' as Permission)
           }
           if (this.settings.adminAuth?.users && Array.isArray(this.settings.adminAuth.users)) {
               this.settings.adminAuth?.users.push(username);
           }
        }


        // setting up ExpressJS Server
        const app = express();
        const server = http.createServer(app);
        app.use("/",express.static("assets"));
        nodeRed.init(server, this.settings);
        app.use(this.settings.httpAdminRoot || "", nodeRed.httpAdmin);
        app.use(this.settings.httpNodeRoot || "", nodeRed.httpNode);
        server.listen(this.settings.uiPort, this.settings.uiHost);
    }

    async start() {
        return new Promise<void>((accept, reject) => {
            logger.debug("Starting Node-RED");
            const host = this.settings.uiHost;
            const port = this.settings.uiPort;

            nodeRed.runtime.events.once("flows:started", () => {
                logger.debug("Node-RED Flows started");
                accept();
            });

            // Starting RED
            nodeRed.start().then(() => {
                logger.info(`Node-RED running on http://${host}:${port}${this.settings.httpAdminRoot}/`);
                logger.info(`Node-RED UI is on http://${host}:${port}${this.settings.httpNodeRoot}/`);
            }).catch(reject);
        })
    }
}