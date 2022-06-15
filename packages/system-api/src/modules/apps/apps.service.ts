import si from 'systeminformation';
import { AppConfig, AppStatusEnum } from '@runtipi/common';
import { createFolder, fileExists, readFile, readJsonFile } from '../fs/fs.helpers';
import { checkAppExists, checkAppRequirements, checkEnvFile, ensureAppState, generateEnvFile, getAvailableApps, getInitalFormValues, getStateFile, runAppScript } from './apps.helpers';

const startApp = async (appName: string): Promise<void> => {
  checkAppExists(appName);
  checkEnvFile(appName);

  // Regenerate env file
  const form = getInitalFormValues(appName);
  generateEnvFile(appName, form);

  // Run script
  await runAppScript(['start', appName]);

  ensureAppState(appName, true);
};

const installApp = async (id: string, form: Record<string, string>): Promise<void> => {
  const appExists = fileExists(`/app-data/${id}`);

  if (appExists) {
    await startApp(id);
  } else {
    const appIsValid = await checkAppRequirements(id);

    if (!appIsValid) {
      throw new Error(`App ${id} requirements not met`);
    }

    // Create app folder
    createFolder(`/app-data/${id}`);

    // Create env file
    generateEnvFile(id, form);
    ensureAppState(id, true);

    // Run script
    await runAppScript(['install', id]);
  }

  return Promise.resolve();
};

const listApps = async (): Promise<AppConfig[]> => {
  const apps: AppConfig[] = getAvailableApps()
    .map((app) => {
      try {
        return readJsonFile(`/apps/${app}/config.json`);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);

  const dockerContainers = await si.dockerContainers();

  const state = getStateFile();
  const installed: string[] = state.installed.split(' ').filter(Boolean);

  apps.forEach((app) => {
    app.installed = installed.includes(app.id);
    app.status = (dockerContainers.find((container) => container.name === `${app.id}`)?.state as AppStatusEnum) || AppStatusEnum.STOPPED;
    app.description = readFile(`/apps/${app.id}/metadata/description.md`);
  });

  return apps;
};

const getAppInfo = async (id: string): Promise<AppConfig> => {
  const dockerContainers = await si.dockerContainers();
  const configFile: AppConfig = readJsonFile(`/apps/${id}/config.json`);

  const state = getStateFile();
  const installed: string[] = state.installed.split(' ').filter(Boolean);
  configFile.installed = installed.includes(id);
  configFile.status = (dockerContainers.find((container) => container.name === `${id}`)?.state as AppStatusEnum) || AppStatusEnum.STOPPED;
  configFile.description = readFile(`/apps/${id}/metadata/description.md`);

  return configFile;
};

const updateAppConfig = async (id: string, form: Record<string, string>): Promise<void> => {
  checkAppExists(id);
  generateEnvFile(id, form);
};

const stopApp = async (id: string): Promise<void> => {
  checkAppExists(id);
  // Run script
  await runAppScript(['stop', id]);
};

const uninstallApp = async (id: string): Promise<void> => {
  checkAppExists(id);
  ensureAppState(id, false);

  // Run script
  await runAppScript(['uninstall', id]);
};

export default { installApp, startApp, listApps, getAppInfo, updateAppConfig, stopApp, uninstallApp };
