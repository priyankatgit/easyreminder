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
  const { updateReminderToRenderer } = require('./reminder_mgmt');
  const Badge = require('electron-windows-badge');
  
  let win = null;
  let trayIcon = constant.TRAY_ICON;
  let resourcePath = '';
  const reminder = new Reminder();
  let appTray = null;

  function setLauncherWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 100,
        frame: false,
        resizable: false,
        transparent: true,
        alwaysOnTop: true,
        show: true,
        minimize: true,
        icon: constant.RESOURCE_PATH + '/images/bell_64.png',
        title: "Easy Reminder"
      });
    
      win.loadURL(url.format({
        pathname: path.join(__basedir, 'view/launcher.html'),
        protocol: 'file:',
        slashes: true
      }));

      new Badge(win, {});
      
      win.webContents.once('dom-ready', () => {
        win.webContents.send('showTaskCount', reminder.getTaskCount());      
        win.minimize();      
      });
  }

  function registerShortcuts() {  
    globalShortcut.register('Ctrl+Shift+R', () => {
        showLauncher();
    });
  }

  function showLauncher(reminder) {    
    win.webContents.send('showReminerWin', reminder);
    win.restore();
    //win.webContents.openDevTools();
  }

  function onReminderEscaped() {
    ipcMain.on('onReminderEscap', (event, arg) => {
      win.minimize();   
      win.webContents.send('showReminerWin', null);
    });
  }
  
  function onReminderEntered() {
    ipcMain.on('onReminderEnter', (event, arg) => {
      
      let data = Sherlock.parse(arg.reminderText);
      
      let title = arg.reminderText;
      let startDate = data.startDate;
      let isAllDay = data.isAllDay;
  
      let errorTitle = '',
        errorMessage = '';

      var type = "reminder";
      if(title.toLowerCase().startsWith("#t ")) {
          type = "task";
      }
  
      if (type == "reminder" && startDate == null) {
        errorTitle = 'Error 404!';
        errorMessage = 'Reminder time is missing';
      }
  
      if (errorTitle == '' && title == null) {
        errorTitle = 'Error 404!';
        errorMessage = 'Reminder subject is missing';
      }
      
      //Validated reminder input
      if (errorTitle != '') {
  
        const errorNotification = notifier.notify(errorTitle, {
          message: errorMessage,
          icon: path.join(__basedir, 'resources/images/no-bell.png'),
          duration: 5000,
          buttons: ['Dismiss']
        });
  
        errorNotification.on('buttonClicked', (text, buttonIndex, options) => {
          notification.close();
        });
  
        return;
      }
  
      reminder.setItem(arg.reminderId, title, startDate, isAllDay, type);
      win.minimize();
      win.webContents.send('showTaskCount', reminder.getTaskCount());

      updateReminderToRenderer();
      
      //Donot popup notification if reminder is updated
      if(arg.reminderId != 0) {
        const addNotification = notifier.notify("Added", {
          message: "Reminder added for " + title,
          icon: path.join(__basedir, 'resources/images/bell_64.png'),
          duration: 5000,
          buttons: ['Dismiss']
        });

        addNotification.on('buttonClicked', (text, buttonIndex, options) => {
          addNotification.close();
        });
      }
    });
  }
  
  function reminderWatcher() {
    setInterval(function () {
      appTray.setImage(constant.RESOURCE_PATH + '/images/bell.png');
  
      showReminderNotifcation(false);
    }, 1000);
  }
  
  function showReminderNotifcation(showNotifiedReminder) {
    let reminders = reminder.getItems();
    if (reminders.length == 0) {
      appTray.setImage(constant.RESOURCE_PATH + '/images/bell.png');
    }
  
    reminders.forEach(function (item) {

      if(item.time == null && item.type == "task") {
        return;
      }

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
          });
  
          notification.on('buttonClicked', (text, buttonIndex, options) => {
            if (text === 'Snooze') {
              win.webContents.send('showReminerWin', options.reminderItem);
              win.restore();
            }
  
            reminder.removeReminderById(options.reminderItem.id);
            notification.close();

            updateReminderToRenderer();
          });
        }
      }
    });
  }

  function getReminderWin() {
    return win;
  }

 function initLauncher(tray) {
    appTray = tray;

    setLauncherWindow();

    reminderWatcher();
    
    onReminderEntered();

    onReminderEscaped();

    registerShortcuts();
  }

  module.exports = {
      initLauncher: initLauncher,
      showLauncher: showLauncher,
      reminderWin: getReminderWin
  };