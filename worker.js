// Cloudflare Workers entry point
// This file wraps the Express app with httpServerHandler
import { httpServerHandler } from 'cloudflare:node';
import app from './server.js';

export default httpServerHandler(app);
