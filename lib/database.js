
// Re-export sequelize-backed DB modules for compatibility with plugins
import * as dbIndex from './database/index.js';

export const personalDB = dbIndex.personalDB;
export const groupDB = dbIndex.groupDB;
export const initSessions = dbIndex.initSessions;
export const saveSession = dbIndex.saveSession;
export const getSession = dbIndex.getSession;
export const getAllSessions = dbIndex.getAllSessions;
export const deleteSession = dbIndex.deleteSession;
