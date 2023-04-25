import dotenv from 'dotenv';

export const envs = dotenv.config().parsed || {};
