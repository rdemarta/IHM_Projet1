const { ipcRenderer } = require('electron');

// When we received some notes -> Create the notes DOM and display it
ipcRenderer.on('received-notes', (event, notes) => { // IPC event listener
    let mainBoard = document.getElementById('main-board');
    for (note of notes) {
        let noteElem = document.createElement("div");
        noteElem.className = "note";

        let noteTitleElem = document.createElement("div");
        noteTitleElem.className = "note__title";
        noteTitleElem.textContent = note.title;

        let noteContentElem = document.createElement("div");
        noteContentElem.className = "note__content";
        noteContentElem.innerHTML = note.content; // innerHTML to interpret html tag as <br>

        noteElem.appendChild(noteTitleElem);
        noteElem.appendChild(noteContentElem);
        
        mainBoard.append(noteElem);
    }

});