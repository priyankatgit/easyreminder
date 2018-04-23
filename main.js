const {
  app,
  Menu,
  Tray,
  BrowserWindow,
  globalShortcut,
  clipboard,
  ipcMain,
  Notification
} = require('electron')

const path = require('path')
const url = require('url')
const Store = require('./store.js');
const Reminder = require('./reminder.js');
const Sherlock = require('sherlockjs');
const notifier = require('node-notifier');

let tray = null
let win = null;
let trayIcon = 'bell.png'
let resourcePath = ''
const reminder = new Reminder();


function loadWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 100,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.hide();
}

function setupTray() {
  tray = new Tray(resourcePath + '/images/bell.png')
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Exit',
    type: 'normal',
    click: () => {
      app.exit();
    }
  }])
  tray.setToolTip('Easy reminder')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    showReminderNotifcation(true);
  })
}

function registerShortcuts() {
  globalShortcut.register('Escape', () => {
    win.hide();
  })

  globalShortcut.register('Ctrl+Shift+R', () => {
    let clipboardText = clipboard.readText();

    win.webContents.send('showReminerWin', clipboardText);
    win.show();
  })
}

function onReminderEntered() {
  ipcMain.on('onReminderEnter', (event, arg) => {

    let data = Sherlock.parse(arg);

    let title = data.eventTitle;
    let startDate = data.startDate;
    let isAllDay = data.isAllDay;

    if (startDate == null || title == null) {

      let errorTitle = '',
        errorMessage = '';

      if (startDate == null) {
        errorTitle = 'Time info missing';
        errorMessage = 'Please mention time for your reminder.'
      }

      if (title == null) {
        errorTitle = 'Subject is missing';
        errorMessage = 'Please mention subject for your reminder.'
      }

      notifier.notify({
        title: errorTitle,
        message: errorMessage,
        icon: resourcePath + '/images/stopwatch_e.png',
        sound: true,
        wait: false,
        timeout: 5,
      }, );
      return;
    }

    reminder.addReminder(title, startDate)
    win.hide();

    notifier.notify({
      title: "Reminder added",
      message: "Reminder added for "+ title,
      icon: resourcePath + '/images/stopwatch_s.png',
      sound: true,
      wait: false,
      timeout: 5,
    }, );
  })
}

function reminderWatcher() {
  setInterval(function () {
    tray.setImage(resourcePath+'/images/bell.png');
   
    showReminderNotifcation(false);
  }, 1000);
}

function showReminderNotifcation(showNotifiedReminder) {
  let reminders = reminder.getReminders();  
  if(reminders.length == 0) {
    tray.setImage(resourcePath+'/images/bell.png');
  }  

  reminders.forEach(function (item) {
    var reminderTime = Date.parse(item.time);
    if (reminderTime <= (new Date())) {

      if(trayIcon == 'bell.png') {
        trayIcon = 'bell_red.png';
      }
      else {
        trayIcon = 'bell.png';
      }      

      tray.setImage(resourcePath+'/images/'+trayIcon);

      if (item.notified == showNotifiedReminder) {
        reminder.setNotified(reminders, item);

        notifier.notify({
          title: 'Reminder',
          message: item.reminder,
          icon: resourcePath + '/images/alarm-clock.png',
          sound: true,
          wait: true,
          timeout: 10,
          reminderId: item.id
        });
      }
    }
  });
}

app.setAppUserModelId("1");

app.on('ready', () => {

  resourcePath = path.join(__dirname, 'resources');

  loadWindow();

  registerShortcuts();

  setupTray();

  onReminderEntered();

  reminderWatcher();

  notifier.on('click', function (notifierObject, options) {
    console.log(options);
    reminder.removeReminderById(options.reminderId);
  });
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})