const {
  app,
  BrowserWindow,
  globalShortcut,
  clipboard,
  ipcMain
} = require('electron');

const { constant } = require('./constant.js');

const path = require('path');
const url = require('url');
const Store = require('./store.js');
const Reminder = require('./reminder.js');
const Sherlock = require('sherlockjs');
const notifier = require('electron-notifications');

let remindersWindow = null;
let trayIcon = constant.TRAY_ICON;
let resourcePath = '';
const reminder = new Reminder();
let appTray = null;

function createRemindersWindow() {
  let win = new BrowserWindow({
    width: 900,
    height: 700,
    frame: true,
    resizable: true,
    transparent: false,
    alwaysOnTop: true,
    show:false,
    icon: constant.RESOURCE_PATH + '/images/bell_64.png',
    title: "Reminders"
  });

  win.loadURL(url.format({
    pathname: path.join(__basedir, 'view/reminder_mgmt.html'),
    protocol: 'file:',
    slashes: true
  }));
  
  return win;
}

function ipcMainFunctions(showLauncher, reminderWin) {
  ipcMain.on('onAddReminder', (event) => {
    showLauncher();
  });

  ipcMain.on('onEditReminder', (event, arg) => {
    showLauncher(arg);
  });

  ipcMain.on('onDeleteReminder', (event, arg) => {
    reminder.removeReminder(arg);    
    reminderWin().webContents.send('showTaskCount', reminder.getTaskCount());
  });
}

function showReminders(showLauncher, reminderWin) {
  remindersWindow = createRemindersWindow();
  remindersWindow.once('ready-to-show', () => {
    remindersWindow.show();
    updateReminderToRenderer();
  });

  ipcMainFunctions(showLauncher, reminderWin);

  //remindersWindow.webContents.openDevTools();
}

function updateReminderToRenderer() {
  if (remindersWindow == null) {
    return;
  }
  if (remindersWindow.isDestroyed()) {
    return;
  }

  let reminders = reminder.getItems();
  remindersWindow.webContents.send('onShowReminders', reminders);
}

module.exports = {
  showReminders: showReminders,
  updateReminderToRenderer: updateReminderToRenderer  
};