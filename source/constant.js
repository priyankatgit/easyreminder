const path = require('path')
const {app} = require('electron')

let constant = {
    TRAY_ICON: "bell.png",
    TRAY_NOTIFY_ICON: "bell_red.png",
    RESOURCE_PATH: path.join(__basedir, 'resources')
}

module.exports = {
    constant: constant
}
