const { ipcRenderer } = require('electron');
const UUID = require('uuid-v4');
const mainBoard = document.getElementById('main-board');
const notesBoard = document.getElementById('notes-board');
const tasksBoard = document.getElementById('tasks-board');
const todayBoard = document.getElementById('today-board');

// When we received some notes -> Create the notes and tasks DOM and display it
ipcRenderer.on('received-items', (event, data) => { // IPC event listener
    // Display notes
    for (let note of data.notes) {
        addNoteToBoard(note);
    }

    // Display tasks
    for (let task of data.tasks) {
        addTaskToBoard(task);
    }

    // Prepare date input
    let d = new Date();
    document.getElementById('datePicker').defaultValue =
        d.getFullYear() + '-' + asDateDigit(d.getMonth()+1) + '-' + asDateDigit(d.getDate()) + 'T' + asDateDigit(d.getHours()) + ':' + asDateDigit(d.getMinutes());

});

// When a task is due
ipcRenderer.on('taskDue', (event, task) => {
    for(let taskElement of document.getElementsByClassName('item--task')){
        // taskDue is the current task
        if(taskElement.dataset.uuid === task.uuid){
            // Is not ringing => add to html the ring div
            if(!taskElement.firstElementChild.classList.contains('ring')){
                // First element is now the "Terminate" button, we hide it
                taskElement.firstElementChild.style.display = 'none';

                // We add as first element (prepend) the ring div
                let taskRingElem = document.createElement("div");
                taskRingElem.className = "ring";
                let ringTitleElem = document.createElement("h2");
                ringTitleElem.textContent = "Arrêter";
                let ringImgElem = document.createElement("img");
                ringImgElem.className = "bell";
                ringImgElem.src = "images/bell.png";
                taskRingElem.alt = "Ring";

                taskRingElem.appendChild(ringTitleElem);
                taskRingElem.appendChild(ringImgElem);
                taskElement.prepend(taskRingElem);
            }
        }
    }
});

/**
 * Add a note object into a HTML board
 * @param note The note object
 */
function addNoteToBoard(note) {
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

    notesBoard.append(noteElem);
}

/**
 * Add a task object into a HTML board
 * @param task The task object
 */
function addTaskToBoard(task) {
    let taskElem = document.createElement("div");
    taskElem.className = "item item--task";
    taskElem.dataset.uuid = task.uuid;

    let taskTitleElem = document.createElement("div");
    taskTitleElem.className = "item__title item--task__title";
    taskTitleElem.textContent = task.title;


    let taskContentElem = document.createElement("div");
    taskContentElem.className = "item__content item--task__content";
    taskContentElem.innerHTML = task.content; // innerHTML to interpret html tag as <br>

    let taskButton = document.createElement("div");
    taskButton.className = "btn btn--task btn--task-item";
    taskButton.innerHTML = 'Terminer';

    taskElem.appendChild(taskButton);
    taskElem.appendChild(taskTitleElem);

    if(task.dueDate !== '') {
        let taskSubtitleElem = document.createElement("div");
        taskSubtitleElem.className = "item__title item--task__subtitle";
        taskSubtitleElem.innerHTML = displayableDueDate(task.dueDate);

        if(task.isRepeated) {
            taskSubtitleElem.innerHTML += '<br>' + displayRepeat(task.repeatValue, task.repeatUnit);
        }

        taskElem.appendChild(taskSubtitleElem);
    }

    taskElem.appendChild(taskContentElem);

    // Click event listener to open task detail
    taskElem.addEventListener("click", (event) => showTask(taskElem, task));

    (isToday(task.dueDate) ? todayBoard : tasksBoard).append(taskElem);
}

/**
 * Fill the show note modal with the current clicked note and
 * display the modal
 * @param note The clicked note object
 */
function showNote(note) {
    const showNoteModalID = "modal--showNote";
    let showNoteModal = document.getElementById(showNoteModalID)
    for(let child of showNoteModal.children[0].children){
        // Fill the title
        if(child.className === 'modal__title modal__title--note'){
            child.children[0].innerHTML = note.title;
        }

        // Fill the content
        if(child.className === 'modal__content'){
            child.innerHTML = note.content;
        }

        // Add the data-uuid into delete btn html
        // (useful to pass the uuid with the html onClick() function)
        if(child.id === 'btn__delete--note'){
            child.dataset.uuid = note.uuid;
        }
    }

    // Display the modal
    toggleById(showNoteModalID);
}

/**
 * Fill the show note modal with the current clicked note and
 * display the modal
 * @param taskHtmlElem The clicked html item--task element
 * @param task The clicked note object
 */
function showTask(taskHtmlElem, task) {
    // We want to show a ringing task => Remove the ring div to show the task that is ringing
    if(taskHtmlElem.firstChild.classList.contains('ring')){
        taskHtmlElem.firstChild.remove(); // FirstChild here is the ring div
        taskHtmlElem.firstChild.style.display = 'block' // Now the firstChild is the "terminate" button that we want to show again
        ipcRenderer.send("TERMINATE_RING_TASK", task.uuid);
    }
    // We want to show a non-ringing task
    else {
        const showTaskModalID = "modal--showTask";
        let showTaskModal = document.getElementById(showTaskModalID)
        for (let child of showTaskModal.children[0].children) {
            // Fill the title
            if (child.className === 'modal__title modal__title--task') {
                child.children[0].innerHTML = task.title;
                if(task.dueDate !== '') {
                    child.children[1].innerHTML = displayableDueDate(task.dueDate);
                    if(task.isRepeated) {
                        child.children[1].innerHTML += '<br>' + displayRepeat(task.repeatValue, task.repeatUnit);
                    }
                } else {
                    child.children[1].innerHTML = '';
                }
            }

            // Fill the content
            if (child.className === 'modal__content') {
                child.innerHTML = task.content;
            }

            // Add the data-uuid into delete btn html
            // (useful to pass the uuid with the html onClick() function)
            if (child.id === 'btn__delete--task' || child.id === 'btn__complete') {
                child.dataset.uuid = task.uuid;
            }
        }

        // Display the modal
        toggleById(showTaskModalID);
    }
}

/**
 * Returns true if the given date  is today.
 * @param date
 * @returns {boolean}
 */
function isToday(date) {
    let d = new Date(date);
    let now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function asDateDigit(value) {
    return (value < 10 ? '0' : '') + value;
}

/**
 * Transforms a given date string into a pretty european format, with bold tags and labels.
 * @param date
 * @returns {string}
 */
function displayableDueDate(date) {
    let d = new Date(date);
    return'Pour le <b>'
        + asDateDigit(d.getDate()) + '.' + (asDateDigit(d.getMonth()+1)) + '.' + d.getFullYear() + '</b>'
        + ' à <b>' + asDateDigit(d.getHours()) + ':' + asDateDigit(d.getMinutes()) + '</b>';
}

function displayRepeat(repeatValue, repeatUnit) {
    return 'A faire chaque <b>' + repeatValue + ' ' + repeatUnit + '</b>';
}

/**
 * Empties form fields and hide specific sections (date and repeat).
 */
function resetCreateTaskForm() {
    resetFormById('formCreateTask');
    toggleById('repeatDiv', undefined,false);
    toggleById('dueDateDiv', undefined,false);
}

/**
 * Resets the field to its initial state.
 * @param id
 */
function resetFormById(id) {
    document.getElementById(id).reset();
}

/**
 * Delete a note by its uuid
 * Send to the main process a message to delete it and hide the modal
 * @param uuid The note uuid we want to delete
 */
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
 * Delete a task by its uuid
 * Send to the main process a message to delete it and hide the modal
 * @param uuid The note uuid we want to delete
 */
function deleteTaskByUUID(uuid) {
    // send uuid to main process to delete it
    ipcRenderer.send("DELETE_TASK", uuid);

    // remove the note from HTML
    // (when we add the note to board, we add a data-uuid dataset, so we can use it to fetch the item--note element)
    for(const itemTask of document.getElementsByClassName('item--task')){
        if(itemTask.dataset.uuid === uuid){
            itemTask.remove();
            break;
        }
    }

    // Hide the showNote modal (from where we can delete the task)
    toggleById('modal--showTask');
}

function completeTask(uuid) {
    ipcRenderer.send("COMPLETE_TASK", uuid);

    // Hide completed task
    for(const task of document.getElementsByClassName('item--task')){
        if(task.dataset.uuid === uuid){
            task.remove();
            break;
        }
    }

    // Close modal window
    toggleById('modal--showTask');
}

/**
 * Toggles a specific element
 * @param id
 * @param displayStyle
 * @param force specifies if the element should be shown (true) or hidden (false). If not specified, toggles automatically.
 */
function toggleById(id, displayStyle = 'block', force = null){
    let element = document.getElementById(id);

    if(force === true || (force === null && window.getComputedStyle(element).display === 'none')) {
        // Show element
        element.style.display = displayStyle;
    } else {
        // Hide element
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
    console.log("note");
    console.log(note);
    note.uuid = UUID();

    // Add the note to the board
    addNoteToBoard(note);

    // Reset the form and close the modal
    formCreateNote.reset();
    toggleById('modal--newNote');

    // send note to main process to store it
    ipcRenderer.send("ADD_NOTE", note);
}

const formCreateTask = document.getElementById('formCreateTask');
formCreateTask.onsubmit = (event) => {
    event.preventDefault();

    // Generate new task
    let task = fetchFormDataAsObject(formCreateTask)
    task.uuid = UUID();
    task.isRepeated = task.toggleDueDate != null && task.toggleRepeat != null && task.dueDate != null;

    // Add the task to the board
    addTaskToBoard(task);

    // Reset the form and close the modal
    formCreateTask.reset();
    toggleById('modal--newTask');

    // send task to main process to store it
    ipcRenderer.send("ADD_TASK", task);
    resetCreateTaskForm();
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


