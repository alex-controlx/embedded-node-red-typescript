import Logger from '../utils/logger';
import { registerCallbackOnIncomingUiMessages, sendUiMessage } from '../classes/ui/backend_apis';
import EmbeddedNodeRed from '../classes/ui/embedded_nodered';

const logger = new Logger(module);
const SETTINGS_FILE_NAME = 'nodered.settings.js';

export class UiService {
    private static isInitialised = false;

    static async initAsync() {
        if (this.isInitialised) return; // execute this method only once

        registerCallbackOnIncomingUiMessages(UiService.messageReceivedFromUi);

        const nodeRedApp = new EmbeddedNodeRed(SETTINGS_FILE_NAME);
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
            sendUiMessage(
                '__every_second_data',
                { payload: Math.random().toFixed(2), topic: '__every_second_data' },
            );
        }, 1000);

        this.isInitialised = true;
    }


    static messageReceivedFromUi(projectTopic: string, msg: any) {
        const payload = (msg.payload != null ? msg.payload : {}) as {[key: string]: any};

        if (projectTopic === '__example_from_node_red') {
            sendUiMessage('__example_from_backend', { payload, topic: '__example_from_backend' });
        }
    }
}
