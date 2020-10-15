const { ipcRenderer } = require('electron');

ipcRenderer.on("channel", (event, data) => { // IPC event listener
    console.log(data.text);    
});