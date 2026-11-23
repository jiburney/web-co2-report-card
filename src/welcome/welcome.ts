import { browserAPI } from '../shared/browser-polyfill';
import { SettingsStorage } from '../shared/settings';

const settings = new SettingsStorage();
const startBtn = document.getElementById('start') as HTMLButtonElement;
const intro = document.getElementById('intro') as HTMLElement;
const done = document.getElementById('done') as HTMLElement;

function showDone() {
  intro.hidden = true;
  done.hidden = false;
}

settings.getSettings().then((s) => {
  if (s.trackingEnabled) showDone();
});

startBtn.addEventListener('click', () => {
  browserAPI.runtime.sendMessage({ type: 'ENABLE_TRACKING' }, () => showDone());
});
