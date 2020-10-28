const { ipcRenderer } = require('electron');

// When we received some notes -> Create the notes DOM and display it
ipcRenderer.on('received-notes', (event, data) => { // IPC event listener
    let mainBoard = document.getElementById('main-board');

    // Display notes
    for (let note of data.notes) {
        let noteElem = document.createElement("div");
        noteElem.className = "item item--note";

        let noteTitleElem = document.createElement("div");
        noteTitleElem.className = "item__title item--note__title";
        noteTitleElem.textContent = note.title;

        let noteContentElem = document.createElement("div");
        noteContentElem.className = "item__content item--note__content";
        noteContentElem.innerHTML = note.content; // innerHTML to interpret html tag as <br>

        noteElem.appendChild(noteTitleElem);
        noteElem.appendChild(noteContentElem);

        mainBoard.append(noteElem);
    }

    // Display tasks
    for (let task of data.tasks) {
        let taskElem = document.createElement("div");
        taskElem.className = "item item--task";

        let taskTitleElem = document.createElement("div");
        taskTitleElem.className = "item__title item--task__title";
        taskTitleElem.textContent = task.title;

        let taskSubtitleElem = document.createElement("div");
        taskSubtitleElem.className = "item__title item--task__subtitle";
        taskSubtitleElem.textContent = 'Pour le ' + task.dueDate;

        let taskContentElem = document.createElement("div");
        taskContentElem.className = "item__content item--task__content";
        taskContentElem.innerHTML = task.content; // innerHTML to interpret html tag as <br>

        taskElem.appendChild(taskTitleElem);
        taskElem.appendChild(taskSubtitleElem);
        taskElem.appendChild(taskContentElem);

        mainBoard.append(taskElem);
    }

});
