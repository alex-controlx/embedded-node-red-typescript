import { envs } from './env.config';
import Logger from './utils/logger';
import { UiService } from './services/ui_service';

process.title = 'your_app_name';
const logger = new Logger(module);

start().catch(err => logger.error(err));

/**
 * Main entry point of the app.
 */
async function start() {

    logger.info('Initialisation of the app');
    logger.info('Using environment variables: ' + Object.keys(envs).join(', '));

    logger.info('Initialisation of UI Service');
    await UiService.initAsync();

    // the rest of the program here
}
