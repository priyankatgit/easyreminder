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
const notifier = require('electron-notifications')
const AutoLaunch = require('auto-launch');

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
    label: 'Add reminder(Ctrl+Shift+R)',
    type: 'normal',
    click: () => {
      showReminderWindow();
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
  })
}

function registerShortcuts() {
  globalShortcut.register('Escape', () => {
    win.hide();
  })

  globalShortcut.register('Ctrl+Shift+R', () => {
    showReminderWindow();
  })
}

function showReminderWindow() {
  let clipboardText = clipboard.readText();

  win.webContents.send('showReminerWin', clipboardText);
  win.show();
}

function onReminderEntered() {
  ipcMain.on('onReminderEnter', (event, arg) => {

    let data = Sherlock.parse(arg);

    let title = arg;
    let startDate = data.startDate;
    let isAllDay = data.isAllDay;

    let errorTitle = '',
      errorMessage = '';

    if (startDate == null) {
      errorTitle = 'Error 404!';
      errorMessage = 'Reminder time is missing'
    }

    if (errorTitle == '' && title == null) {
      errorTitle = 'Error 404!';
      errorMessage = 'Reminder subject is missing'
    }
    
    //Validated reminder input
    if (errorTitle != '') {

      const errorNotification = notifier.notify(errorTitle, {
        message: errorMessage,
        icon: path.join(__dirname, 'resources/images/no-bell.png'),
        duration: 5000,
        buttons: ['Dismiss']
      })

      errorNotification.on('buttonClicked', (text, buttonIndex, options) => {
        notification.close()
      })

      return;
    }


    reminder.addReminder(title, startDate, isAllDay)
    win.hide();

    const addNotification = notifier.notify("Added", {
      message: "Reminder added for " + title,
      icon: path.join(__dirname, 'resources/images/bell_64.png'),
      duration: 5000,
      buttons: ['Dismiss']
    })

    addNotification.on('buttonClicked', (text, buttonIndex, options) => {
      addNotification.close()
    })
  })
}

function reminderWatcher() {
  setInterval(function () {
    tray.setImage(resourcePath + '/images/bell.png');

    showReminderNotifcation(false);
  }, 1000);
}

function showReminderNotifcation(showNotifiedReminder) {
  let reminders = reminder.getReminders();
  if (reminders.length == 0) {
    tray.setImage(resourcePath + '/images/bell.png');
  }

  reminders.forEach(function (item) {
    var reminderTime = Date.parse(item.time);
    if (reminderTime <= (new Date())) {

      if (trayIcon == 'bell.png') {
        trayIcon = 'bell_red.png';
      } else {
        trayIcon = 'bell.png';
      }

      tray.setImage(resourcePath + '/images/' + trayIcon);

      if (item.notified == showNotifiedReminder) {
        reminder.setNotified(reminders, item);

        const notification = notifier.notify("Reminder", {
          message: item.reminder,
          icon: path.join(__dirname, 'resources/images/ringing-bell.png'),
          duration: 5184000,
          buttons: ['Dismiss', 'Snooze'],
          reminderItem: item
        })

        notification.on('buttonClicked', (text, buttonIndex, options) => {
          if (text === 'Snooze') {

            //If triggered reminder was type of all day then it is proposed to snooze by tomorrow default.
            let isAllDayReminder = options.isAllDay || false;
            let remindeAt = " by an hour";
            if (isAllDayReminder) {
              remindeAt = " by tomorrow";
            }

            let reminderText = options.reminderItem.reminder + " " + remindeAt;
            win.webContents.send('showReminerWin', reminderText);
            win.show();
          }

          reminder.removeReminderById(options.reminderItem.id);
          notification.close()
        })
      }
    }
  });
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

app.setAppUserModelId("1");

app.on('ready', () => {

  resourcePath = path.join(__dirname, 'resources');

  loadWindow();

  registerShortcuts();

  setupTray();

  onReminderEntered();

  reminderWatcher();

  setAppAutoLaunch();
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})