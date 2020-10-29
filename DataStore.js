const Store = require('electron-store');

class DataStore extends Store {

    constructor(settings) {
        super(settings);

        this.notes = this.get('notes') || [];
        //this.tasks = this.get('tasks') || [];
    }

    saveNotes() {
        // Save notes to json files
        this.set('notes', this.notes);
        // Return this for chaining
        return this;
    }

    getNotes() {
        // Set object notes to notes in JSON file
        this.notes = this.get('notes') || [];

        return this;
    }

    addNote(note) {
        // Merge existing notes with new note
        this.notes  =  [...this.notes, note];

        return this.saveNotes()
    }

}

module.exports = DataStore;
