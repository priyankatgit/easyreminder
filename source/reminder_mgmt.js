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
const Badge = require('electron-windows-badge');

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
    minimize: true,
    show: false,
    icon: constant.RESOURCE_PATH + '/images/bell_64.png',
    title: "Reminders"
  });

  win.loadURL(url.format({
    pathname: path.join(__basedir, 'view/reminder_mgmt.html'),
    protocol: 'file:',
    slashes: true
  }));

  new Badge(win, {});

  win.webContents.once('dom-ready', () => {
    win.show();
    win.minimize();
    win.webContents.send('showTaskCount', reminder.getTaskCount());              

    updateReminderToRenderer();
  });

  win.on('close', function (event) {
    if(!app.isQuiting){
        event.preventDefault();
        win.minimize();
    }
    return false;
  });
  
  return win;
}

function ipcMainFunctions(showLauncher) {
  ipcMain.on('onAddReminder', (event) => {
    showLauncher();
  });

  ipcMain.on('onEditReminder', (event, arg) => {
    showLauncher(arg);
  });

  ipcMain.on('onDeleteReminder', (event, arg) => {
    reminder.removeReminderById(arg.id);    
    remindersWindow.webContents.send('showTaskCount', reminder.getTaskCount());
  });
}

function showReminders(showLauncher) {  
  if(remindersWindow == null) {
    remindersWindow = createRemindersWindow();
  }

  ipcMainFunctions(showLauncher);  
  //remindersWindow.webContents.openDevTools();
  return remindersWindow;
}

function getReminderWindow() {
  return remindersWindow;
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
  getReminderWindow: getReminderWindow,
  updateReminderToRenderer: updateReminderToRenderer  
};