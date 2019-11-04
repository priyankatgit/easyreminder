const {
  app,
  Menu,
  Tray
} = require('electron');

const {
  constant
} = require('./constant');

const {
  initLauncher,
  showLauncher,
  reminderWin
} = require('./launcher');

const AutoLaunch = require('auto-launch');
const { showReminders } = require('./reminder_mgmt');
const path = require('path');

function setupTray() {
  let tray = new Tray(constant.RESOURCE_PATH + '/images/bell.png');
  const contextMenu = Menu.buildFromTemplate([{
      label: 'Add reminder (Ctrl+Shift+R)',
      type: 'normal',
      click: () => {
        showLauncher();
      }
    },
    {
      label: 'View reminders',
      type: 'normal',
      click: () => {
        showReminders(showLauncher, reminderWin);
      }
    },
    {
      label: 'Exit',
      type: 'normal',
      click: () => {
        app.exit();
      }
    }
  ]);

  tray.setToolTip('Easy reminder');
  tray.setContextMenu(contextMenu);   
  return tray;
}

function setAppAutoLaunch() {
  let autoLaunch = new AutoLaunch({
    name: 'easyreminder',
    path: app.getPath('exe'),
  });

  autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.enable();
  });
}

function initApp() {
  setAppAutoLaunch();
  let tray = setupTray();
  
  initLauncher(tray);
}

module.exports = {
  initApp: initApp
};