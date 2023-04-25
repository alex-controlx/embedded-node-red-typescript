import nodeRed, { Node, NodeDef, NodeMessage } from 'node-red';
import Logger from '../../utils/logger';

type TopicListeners = Map<string, Node>;
const uiListeners = new Map<string, TopicListeners>();
const logger = new Logger(module);
let uiServiceCallback: (topic: string, msg: NodeMessage) => void;
export let globalContext: any;

export function sendUiMessage(topic: string, msg: NodeMessage) {
    const topicListeners = uiListeners.get(topic);
    if (!topicListeners) return;

    topicListeners.forEach(listener => listener.send(msg));
}

export function registerCallbackOnIncomingUiMessages(_callback: (topic: string, msg: NodeMessage) => void) {
    uiServiceCallback = _callback;
}

/**
 * This class exposed to Node-RED Admin for receiving and sending messages between Node-RED and the project logic.
 */
export class UiBackend {
    static send(msg: NodeMessage, nodeDef: NodeDef) {
        if (!globalContext) setGlobalContext(nodeDef);
        const projectTopic = nodeDef.name;
        logger.debug('Message from ' + projectTopic + ': ', msg.payload != null ? msg.payload : msg);
        uiServiceCallback(projectTopic, msg);
    }

    static listener(nodeDef: NodeDef) {
        if (!globalContext) setGlobalContext(nodeDef);
        const topic = nodeDef.name;
        logger.debug('Subscribing to topic ' + topic);

        // @ts-ignore
        const functionNode = (nodeRed.nodes.getNode(nodeDef.id) as Node | undefined);
        if (!functionNode) {
            logger.error('Node Function not found with id ' + nodeDef.id);
            return;
        }

        let topicListeners = uiListeners.get(topic);

        // adding the listener to the topic
        if (!topicListeners) {
            topicListeners = new Map<string, Node>();
            uiListeners.set(topic, topicListeners);
        }

        // if exists, remove the old listener. It's needed at Node-RED clears nodes and creates
        // new ones with the same ID on Flows Restart, etc.
        topicListeners.delete(functionNode.id);
        topicListeners.set(functionNode.id, functionNode);
    }
}

function setGlobalContext(nodeDef: NodeDef) {
    // @ts-ignore
    const functionNode = (nodeRed.nodes.getNode(nodeDef.id) as Node | undefined);
    if (!functionNode) {
        logger.error('Node Function not found with id ' + nodeDef.id);
        return;
    }

    globalContext = functionNode.context().global;
}
