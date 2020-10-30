const { ipcRenderer } = require('electron');
const UUID = require('uuid-v4');
const mainBoard = document.getElementById('main-board');
const notesBoard = document.getElementById('notes-board');
const tasksBoard = document.getElementById('tasks-board');

// When we received some notes -> Create the notes and tasks DOM and display it
ipcRenderer.on('received-notes', (event, data) => { // IPC event listener
    // Display notes
    for (let note of data.notes) {
        addNoteToBoard(notesBoard, note);
    }

    // Display tasks
    for (let task of data.tasks) {
        addTaskToBoard(tasksBoard, task);
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
    noteElem.dataset.uuid = note.uuid;

    let noteTitleElem = document.createElement("div");
    noteTitleElem.className = "item__title item--note__title";
    noteTitleElem.textContent = note.title;

    let noteContentElem = document.createElement("div");
    noteContentElem.className = "item__content item--note__content";
    noteContentElem.innerHTML = note.content; // innerHTML to interpret html tag as <br>

    noteElem.appendChild(noteTitleElem);
    noteElem.appendChild(noteContentElem);

    // Add dynamically a click listener to show the note modal
    noteElem.addEventListener("click", (event) => showNote(note));

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

function showNote(note) {
    const showNoteModalID = "modal--showNote";
    let showNoteModal = document.getElementById(showNoteModalID)
    for(let child of showNoteModal.children[0].children){
        if(child.className === 'modal__title modal__title--note'){
            child.children[0].innerHTML = note.title;
        }
        if(child.className === 'modal__content'){
            child.innerHTML = note.content;
        }
        if(child.id === 'btn__delete--note'){
            child.dataset.uuid = note.uuid;
        }
    }
    toggleById(showNoteModalID);
}

function deleteNoteByUUID(uuid) {
    // send uuid to main process to delete it
    ipcRenderer.send("DELETE_NOTE", uuid);

    // remove the note from HTML
    // (when we add the note to board, we add a data-uuid dataset, so we can use it to fetch the item--note element)
    for(const itemNote of document.getElementsByClassName('item--note')){
        if(itemNote.dataset.uuid === uuid){
            itemNote.remove();
            break;
        }
    }

    // Hide the showNote modal (from where we can delete the note)
    toggleById('modal--showNote');
}

/**
 * Show a specific element
 * @param id
 * @param displayStyle
 */
function toggleById(id, displayStyle = 'block'){
    let element = document.getElementById(id);
    if(window.getComputedStyle(element).display === 'none') { // Show element
        element.style.display = displayStyle;
    } else { // Hide element
        element.style.display = 'none';
    }
}

/**
 * Loop through all form data, fetch them and create an object to return it
 * @param form The form element
 * @returns An object that contains all form data
 */
function fetchFormDataAsObject(form) {
    // Retrieve data from the form and populate the note object
    let obj = {};
    const formData = new FormData(form);
    for (let pair of formData.entries()) {
        obj[pair[0]] = pair[1];
    }

    return obj;
}

const formCreateNote = document.getElementById('formCreateNote');
formCreateNote.onsubmit = (event) => {
    event.preventDefault();

    // Generate new note
    let note = fetchFormDataAsObject(formCreateNote)
    note.uuid = UUID();

    // Add the note to the board
    addNoteToBoard(mainBoard, note);

    // Reset the form and close the modal
    formCreateNote.reset();
    toggleById('modal--newNote');

    // send note to main process to store it
    ipcRenderer.send("ADD_NOTE", note);
}


/**
 * Each time we press the escape key, will hide all modal open
 * (Not opti because call a lof if long press but works, no need refactor now)
 */
document.addEventListener('keydown', (event) =>{
   if(event.key === 'Escape'){
       for(let modal of document.getElementsByClassName('modal__container')) {
           if(window.getComputedStyle(modal).display === 'block') { // Show element
               modal.style.display = 'none';
           }
       }
   }
});


