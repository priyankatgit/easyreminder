const Store = require('./store.js');

const store = new Store({
    configName: 'easy-reminders'
  });

class Reminder {

    setReminder(reminderId, title, startDate, isAllDay) {
        if(reminderId == 0) {
            this.addReminder(title, startDate, isAllDay)
        }
        else {
            this.updateReminder(reminderId, title, startDate, isAllDay)
        }
    }

    addReminder(rmText, time, isAllDay) {
        let reminders = this.getReminders();
        let id = reminders.length + 1
        let reminder = this.getReminderObj(id, rmText, time, isAllDay);
        reminders.push(reminder)
        store.set("reminders", reminders)
    }

    updateReminder(id, rmText, time, isAllDay) {
        this.removeReminderById(id);

        let reminders = this.getReminders();
        let reminder = this.getReminderObj(id, rmText, time, isAllDay);
        reminders.push(reminder)
        store.set("reminders", reminders)
    }

    getReminderObj(id, rmText, time, isAllDay) {
        return {
            "id": id,
            "reminder": rmText,
            "time": time,
            "notified": false,
            "isAllDay": isAllDay
        }
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

        reminders.sort(function(a, b) {
            return a.id - b.id;
        });
        
        return reminders;
    }

    setNotified(reminders, reminder) {
        reminder.notified = true;
        store.set("reminders", reminders)
    }
}

module.exports = Reminder;