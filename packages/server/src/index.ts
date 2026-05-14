/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting, you can see "Raw usage" from the documentation.
 *
 * See: https://docs.colyseus.io/server
 */
import './load-env.js';

import { listen } from '@colyseus/tools';

// Import Colyseus config
import app from './app.config.js';

/** Self-host default when `PORT` is unset. Colyseus Cloud still binds per platform rules. */
const DEFAULT_PORT = 4527;
const port = Number(process.env.PORT) || DEFAULT_PORT;

listen(app, port);
