const Store = require('electron-store');

class DataStoreTasks extends Store {

    constructor(settings) {
        super(settings);

        this.tasks = this.get('tasks') || [];
    }

    saveTasks() {
        // Save tasks to json files
        this.set('tasks', this.tasks);
        // Return this for chaining
        return this;
    }

    getTasks() {
        // Set object tasks to tasks in JSON file
        this.tasks = this.get('tasks') || [];

        return this;
    }

    getTask(uuid) {
        for(let task of this.get('tasks')) {
            if(task.uuid === uuid) {
                return task;
            }
        }

        return null;
    }

    addTask(task) {
        // Merge existing tasks with new task
        this.tasks  =  [...this.tasks, task];

        return this.saveTasks()
    }

    deleteTask(uuid) {
        // Filter out the target task uuid
        this.tasks = this.tasks.filter(task => task.uuid !== uuid);

        return this.saveTasks();
    }

}

module.exports = DataStoreTasks;
