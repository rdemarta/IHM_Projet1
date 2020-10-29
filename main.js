const { app, BrowserWindow, Tray, Menu, Notification} = require('electron')
const ipc = require('electron').ipcMain
const DataStore = require("./DataStore");
const iconPath = __dirname + '/icon.png'
const notesData = new DataStore({name: 'Notes'}); // Will create a ~/.config/tablonette/Notes.json file

const data = {
  notes: notesData.getNotes()['notes'],
  tasks: [
    {
      title: "Médoc",
      content: "Prendre la pillule bleue",
      dueDate: "2020-10-31 08:30",
      repeatUnit: "day",
      repeatValue: "1"
    },
    {
      title: "Chien",
      content: "Promener mon petit chien",
      dueDate: "2020-11-23 09:30",
      repeatUnit: "day",
      repeatValue: "1"
    }
  ]
};

/**
 * Create the main window
 */
function createWindow () {
  const mainWindow = new BrowserWindow({
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
    mainWindow.webContents.send('received-notes', data)
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
 * IPC for NOTE from renderer
 */
ipc.on("CH_NOTE", (event, note) => {
  notesData.addNote(note);
  console.log(`Successfully stored a new note "${note.title}"`);
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
