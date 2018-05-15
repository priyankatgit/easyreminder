const {
    app,
    BrowserWindow,
    globalShortcut,
    clipboard,
    ipcMain
  } = require('electron')

  const { constant } = require('./constant.js');
  const path = require('path')
  const url = require('url')
  const Store = require('./store.js');
  const Reminder = require('./reminder.js');
  const Sherlock = require('sherlockjs');
  const notifier = require('electron-notifications')
  
  let win = null;
  let trayIcon = constant.TRAY_ICON;
  let resourcePath = ''
  const reminder = new Reminder();
  let appTray = null;

  function setBrowserWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 100,
        frame: false,
        resizable: false,
        transparent: true,
        alwaysOnTop: true,
      })
    
      win.loadURL(url.format({
        pathname: path.join(__basedir, 'index.html'),
        protocol: 'file:',
        slashes: true
      }))
    
      win.hide();
  }

  function registerShortcuts() {
    globalShortcut.register('Escape', () => {
      win.hide();
    })
  
    globalShortcut.register('Ctrl+Shift+R', () => {
        showLauncher();
    })
  }

  function showLauncher() {
    let clipboardText = clipboard.readText();
    win.webContents.send('showReminerWin', clipboardText);
    win.show();
    console.log(win)
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
          icon: path.join(__basedir, 'resources/images/no-bell.png'),
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
        icon: path.join(__basedir, 'resources/images/bell_64.png'),
        duration: 5000,
        buttons: ['Dismiss']
      })
  
      addNotification.on('buttonClicked', (text, buttonIndex, options) => {
        addNotification.close()
      })
    })
  }

  function triggerAction() {
    
  }
  
  function reminderWatcher() {
    setInterval(function () {
      appTray.setImage(constant.RESOURCE_PATH + '/images/bell.png');
  
      showReminderNotifcation(false);
    }, 1000);
  }
  
  function showReminderNotifcation(showNotifiedReminder) {
    let reminders = reminder.getReminders();
    if (reminders.length == 0) {
      appTray.setImage(constant.RESOURCE_PATH + '/images/bell.png');
    }
  
    reminders.forEach(function (item) {
      var reminderTime = Date.parse(item.time);
      if (reminderTime <= (new Date())) {
  
        if (trayIcon == constant.TRAY_ICON) {
          trayIcon = constant.TRAY_NOTIFY_ICON;
        } else {
          trayIcon = constant.TRAY_ICON;
        }
  
        appTray.setImage(constant.RESOURCE_PATH + '/images/' + trayIcon);
  
        if (item.notified == showNotifiedReminder) {
          reminder.setNotified(reminders, item);
  
          const notification = notifier.notify("Reminder", {
            message: item.reminder,
            icon: path.join(__basedir, 'resources/images/ringing-bell.png'),
            duration: 5184000,
            buttons: ['Dismiss', 'Snooze'],
            reminderItem: item
          })
  
          notification.on('buttonClicked', (text, buttonIndex, options) => {
            if (text === 'Snooze') {
              let reminderText = options.reminderItem.reminder;
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

 function initLauncher(tray) {
    appTray = tray;

    setBrowserWindow();

    reminderWatcher();
    
    onReminderEntered();

    registerShortcuts();
  }

  module.exports = {
      initLauncher: initLauncher,
      showLauncher: showLauncher
  }