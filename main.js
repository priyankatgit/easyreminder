const {
  app,
  globalShortcut
} = require('electron')

global.__basedir = __dirname;
const { initApp } = require('./source/app.js');

app.setAppUserModelId("1");

app.on('ready', () => {
  initApp();
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})