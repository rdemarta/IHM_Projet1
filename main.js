const { app, BrowserWindow, Tray, Menu, Notification} = require('electron')
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

/**
 * Create the main window
 */
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      //worldSafeExecuteJavaScript: true,
      //contextIsolation: true
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('received-items', data)
  })

  // Create and manage tray
  //createTray(mainWindow);
  testNotification(mainWindow);

}

app.whenReady().then(createWindow)

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
ipc.on("COMPLETE_TASK", (event, uuid) => {
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
 * Create and manage tray
 *
 * It will create a tray in processbar of the OS, and when we close the window
 * it will still work in background and can be accessible on the tray to show it again or close it.
 * @param mainWindow
 */
function createTray(mainWindow){
  let tray = new Tray(iconPath)

  let contextMenu = Menu.buildFromTemplate([
    { label: 'Ouvrir', click:  function(){
      mainWindow.show();
    } },
    { label: 'Quitter', click:  function(){
        app.isQuiting = true;
        app.quit();
    } }
  ]);

  tray.setToolTip('Tablonette')
  tray.setContextMenu(contextMenu)

  /*
  mainWindow.on('minimize',function(event){
    event.preventDefault();
    mainWindow.hide();
  });*/

  // When we close the window, just hide it and to show it again or really quit it, use the tray
  mainWindow.on('close', function (event) {
      if(!app.isQuiting){
          event.preventDefault();
          mainWindow.hide();
      }

      return false;
  });

}

function testNotification(mainWindow) {
  setTimeout(function() {
    const notification = new Notification({
      title: "Tâche à effectuer",
      body: "Promener le chien",
      icon: iconPath,
      timeoutType: "never",
    })

    notification.on('click', (event, arg)=>{
      mainWindow.show();
    })

    notification.on('show', (event, arg)=>{
      app.setBadgeCount(2);
      console.log(app.getBadgeCount());
    })

    notification.show();
  }, 2000);
}
