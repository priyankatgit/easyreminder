const Store = require('./store.js');

const store = new Store({
    configName: 'easy-reminders'
  });

class Reminder {
    addReminder(rmText, time) {
        var reminders = this.getReminders();
        reminders.push({
            "id": reminders.length + 1,
            "reminder": rmText,
            "time": time,
            "notified": false
        })
        store.set("reminders", reminders)
    }

    removeReminder(reminder) {
        let reminders = this.getReminders();
        const index = reminders.indexOf(reminder);
        reminders.splice(index, 1);

        store.set("reminders", reminders)
    }

    removeReminderById(reminderId){
        let reminders = this.getReminders();
        reminders.forEach(function (item) {
            if(item.id == reminderId) {
               const index = reminders.indexOf(item);
               reminders.splice(index, 1);

               store.set("reminders", reminders)
            }
        });        
    }

    getReminders() {
        //Returns all stored reminders. If it first time return empty array becasue reminder file is not created yet.
        let reminders = store.get('reminders') || [];
        return reminders;
    }

    setNotified(reminders, reminder) {
        reminder.notified = true;
        store.set("reminders", reminders)
    }
}

module.exports = Reminder;