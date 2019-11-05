const Store = require('./store.js');

const store = new Store({
    configName: 'easy-reminders'
  });

class Reminder {

    setItem(reminderId, title, startDate, isAllDay, type) {
        if(reminderId == 0) {
            this.addItem(title, startDate, isAllDay, type);
        }
        else {
            this.updateItem(reminderId, title, startDate, isAllDay, type);
        }
    }

    addItem(rmText, time, isAllDay, type) {
        let reminders = this.getItems();
        let id = reminders.length + 1;
        let reminder = this.getReminderObj(id, rmText, time, isAllDay, type);
        reminders.push(reminder);
        store.set("reminders", reminders);
    }

    updateItem(id, rmText, time, isAllDay, type) {
        this.removeReminderById(id);

        let reminders = this.getItems();
        let reminder = this.getReminderObj(id, rmText, time, isAllDay, type);
        reminders.push(reminder);
        store.set("reminders", reminders);
    }

    getReminderObj(id, rmText, time, isAllDay, type) {
        return {
            "id": id,
            "reminder": rmText,
            "time": time,
            "notified": false,
            "isAllDay": isAllDay,
            "type": type
        };
    }

    removeReminderById(reminderId){
        let reminders = this.getItems();
        reminders.forEach(function (item) {
            if(item.id == reminderId) {            
               const index = reminders.indexOf(item);
               reminders.splice(index, 1);

               store.set("reminders", reminders);
            }
        });        
    }

    getItems() {
        //Returns all stored reminders. If it first time return empty array becasue reminder file is not created yet.
        let items = store.get('reminders') || [];

        items.sort(function(a, b) {
            return a.id - b.id;
        });
        
        return items;
    }

    getItemsByType(type) {        
        let items = store.get('reminders') || [];
        var reminders = items.filter(function (el) {
            return el.type == type;
          });

        reminders.sort(function(a, b) {            
            return a.id - b.id;
        });
        
        return reminders;
    }

    getTaskCount() {
        return (this.getItemsByType("task")).length;
    }

    setNotified(reminders, reminder) {
        reminder.notified = true;
        store.set("reminders", reminders);
    }
}

module.exports = Reminder;