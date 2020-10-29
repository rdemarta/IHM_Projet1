const { ipcRenderer } = require('electron');
const UUID = require('uuid-v4');

// When we received some notes -> Create the notes and tasks DOM and display it
ipcRenderer.on('received-notes', (event, data) => { // IPC event listener
    let mainBoard = document.getElementById('main-board');

    // Display notes
    for (let note of data.notes) {
        addNoteToBoard(mainBoard, note);
    }

    // Display tasks
    for (let task of data.tasks) {
        addTaskToBoard(mainBoard, task);
    }

});

/**
 * Add a note object into a HTML board
 * @param board The HTML board element
 * @param note The note object
 */
function addNoteToBoard(board, note) {
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

    board.append(noteElem);
}

/**
 * Add a task object into a HTML board
 * @param board The HTML board element
 * @param task The task object
 */
function addTaskToBoard(board, task) {
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

    let taskButton = document.createElement("div");
    taskButton.className = "btn btn--task btn--task-item";
    taskButton.innerHTML = 'Terminer';

    taskElem.appendChild(taskButton);
    taskElem.appendChild(taskTitleElem);
    taskElem.appendChild(taskSubtitleElem);
    taskElem.appendChild(taskContentElem);

    board.append(taskElem);
}

/**
 * Show a specific modal element
 * @param modal
 */
function showModal(modal){
    modal.parentElement.style.display = "block";
    modal.style.display = "block";
}

/**
 * Hide a specific modal element
 * @param modal
 */
function hideModal(modal) {
    modal.parentElement.style.display = "none";
    modal.style.display = "none";
}

// Close modals on click functionality
const btnsCloseModal = document.getElementsByClassName('modal__btn--close');
for(let btnCloseModal of btnsCloseModal) {
    btnCloseModal.addEventListener("click", (event) => {
        hideModal(btnCloseModal.parentElement);
    })
}


const btnNewNote = document.getElementById("btnNewNote");
const btnNewTask = document.getElementById("btnNewTask");

btnNewNote.addEventListener("click", (event) => {
    const modalNote = document.getElementById("modal__newNote");
    console.log(modalNote);
    showModal(modalNote);
})

btnNewTask.addEventListener("click", (event) => {
    const modalNote = document.getElementById("modal__newTask");
    showModal(modalNote);
})
