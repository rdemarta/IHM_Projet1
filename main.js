const { app, BrowserWindow, Menu, Notification, globalShortcut} = require('electron')
const ipc = require('electron').ipcMain
const UUID = require('uuid-v4');
const DataStoreNotes = require("./DataStoreNotes");
const DataStoreTasks = require("./DataStoreTasks");
const iconPath = __dirname + '/icon.png'
const notesData = new DataStoreNotes({name: 'Notes'}); // Will create a ~/.config/tablonette/Notes.json file
const tasksData = new DataStoreTasks({name: 'Tasks'}); // Will create a ~/.config/tablonette/Tasks.json file
let mainWindow;

const data = {
  notes: notesData.getNotes()['notes'],
  tasks: tasksData.getTasks()['tasks']
};
const intervalCheckTaskDueDate = 30000;
let tasksNotified = new Set();

/**
 * Create the main window
 */
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    center: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      //worldSafeExecuteJavaScript: true,
      //contextIsolation: true
    }
  })

  mainWindow.loadFile('index.html')

  // All content loads
  mainWindow.webContents.on('did-finish-load', () => {
    // Send all data (tasks and notes) to renderer process
    mainWindow.webContents.send('received-items', data);
    // Run the async task that check each interval times all due task
    checkTaskDueInfiniteProcess(mainWindow);
  })
}

app.whenReady().then(() => {
    // Unregister some refresh shortcut (register nothing to disable)
    globalShortcut.register('F5', () => {});
    globalShortcut.register('CommandOrControl+R', () => {});
    globalShortcut.register('CommandOrControl+Shift+R', () => {});
}).then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/**
 * IPC to add note from renderer
 */
ipc.on("ADD_NOTE", (event, note) => {
  notesData.addNote(note);
  console.log(`Successfully stored a new note "${note.title}"`);
});

/**
 * IPC to add task from renderer
 */
ipc.on("ADD_TASK", (event, task) => {
  tasksData.addTask(task);
  console.log(`Successfully stored a new note "${task.title}"`);
});

/**
 * IPC to delete note from renderer
 */
ipc.on("DELETE_NOTE", (event, uuid) => {
  notesData.deleteNote(uuid);
  console.log(`Successfully deleted note "${uuid}"`);
});

/**
 * IPC to delete task from renderer
 */
ipc.on("DELETE_TASK", (event, uuid) => {
  tasksData.deleteTask(uuid);
  console.log(`Successfully deleted task "${uuid}"`);
});

/**
 * IPC to complete a task (and create the next one)
 */
ipc.on("COMPLETE_TASK", (event, uuid) =>

{
  let task = tasksData.getTask(uuid);

  // Check if the task should repeat
  if(task.isRepeated) {
    // Create new task
    let newDate = new Date(task.dueDate);
    let valueToAdd = parseInt(task.repeatValue);

    switch(task.repeatUnit) {
        case 'heures':
            newDate.setHours(newDate.getHours() + valueToAdd)
            break;
        case 'jours':
            newDate.setDate(newDate.getDate() + valueToAdd)
            break;
        case 'mois':
            newDate.setMonth(newDate.getMonth() + valueToAdd)
            break;
        case 'années':
            newDate.setFullYear(newDate.getFullYear() + valueToAdd)
            break;
        default:
            break;
    }

    // Renew task
    task.uuid = UUID();
    task.dueDate = newDate;
    tasksData.addTask(task);

    // Ask renderer to display new task
    mainWindow.webContents.send('received-items', {notes:[], tasks: [task]});
  }

  tasksData.deleteTask(uuid);
});

/**
 * IPC received when user clicked on a task that is ringing (due for now)
 */
ipc.on("TERMINATE_RING_TASK", (event, uuid) => {
    // Remove from the tasksNotified, to be able to be notified again if the user don't want to complete the task
    tasksNotified.delete(uuid);
    // Remove 1 badge count
    if(app.getBadgeCount() > 0){
        app.setBadgeCount(app.getBadgeCount() - 1);
    }
});


/**
 * Each interval in ms, we'll check if a task is due
 * @param mainWindow The main window of the app
 */
function checkTaskDueInfiniteProcess(mainWindow) {
    // First time, call it directly to await waiting
    checkTaskDue(mainWindow);
    setInterval(function(){
        checkTaskDue(mainWindow);
    }, intervalCheckTaskDueDate);
}

/**
 * Check if a task is due. If yes => send to the renderer process that the task is due
 * and add badgeCount and window notification (if main window not focused) only if we not already sent one notif and
 * that the user has not acknowledged
 * @param mainWindow The main window of the app
 */
function checkTaskDue(mainWindow) {
    const tasks = tasksData.getTasks()['tasks'];
    for(const task of tasks) {
        if(Date.now() >= new Date(task.dueDate).getTime()){
            // Send to the renderer process the due task
            mainWindow.webContents.send('taskDue', task)

            if(!tasksNotified.has(task.uuid)) {
                // Add the task uuid to the SET contains all notified tasks and set the Badge (badges only visible in production app)
                tasksNotified.add(task.uuid)
                app.setBadgeCount(app.getBadgeCount() + 1);

                // Display notifications only if the windows is not focused AND we not already send it
                if (!mainWindow.isFocused()) {

                    const notification = new Notification({
                        title: "Une tâche est arrivée à échéance",
                        body: task.title,
                        icon: iconPath,
                        timeoutType: "never",
                    })

                    notification.on('click', (event, arg) => {
                        mainWindow.show();
                    })

                    notification.show();
                }
            }
        }
    }
}
