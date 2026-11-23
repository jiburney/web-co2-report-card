import { browserAPI } from './browser-polyfill';

export interface UserSettings {
  darkMode: boolean;
  // Set once the user has read the data disclosure and chosen to start tracking.
  // Nothing is recorded before this is true.
  trackingEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  darkMode: true,
  trackingEnabled: false
};

export class SettingsStorage {
  static readonly SETTINGS_KEY = 'user_settings';

  async getSettings(): Promise<UserSettings> {
    const result = await browserAPI.storage.local.get(SettingsStorage.SETTINGS_KEY);
    const stored = result[SettingsStorage.SETTINGS_KEY];
    if (!stored || typeof stored !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async setSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await browserAPI.storage.local.set({ [SettingsStorage.SETTINGS_KEY]: settings });
  }

  async toggleDarkMode(): Promise<boolean> {
    const settings = await this.getSettings();
    const newValue = !settings.darkMode;
    await this.setSetting('darkMode', newValue);
    return newValue;
  }
}
