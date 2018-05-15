const {
    app,
    Menu,
    Tray
  } = require('electron')

const { constant } = require('./constant.js');
const { initLauncher, showLauncher } = require('./launcher.js');
const AutoLaunch = require('auto-launch');

function setupTray() {
  let tray = new Tray(constant.RESOURCE_PATH + '/images/bell.png');
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Add reminder(Ctrl+Shift+R)',
    type: 'normal',
    click: () => {
      showLauncher();
    }
  },
  {
    label: 'Exit',
    type: 'normal',
    click: () => {
      app.exit();
    }
  }
  ])

  tray.setToolTip('Easy reminder')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    showReminderNotifcation(true);
  });

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
  }

  