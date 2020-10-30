const Store = require('electron-store');

class DataStoreNotes extends Store {

    constructor(settings) {
        super(settings);

        this.notes = this.get('notes') || [];
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

    deleteNote(uuid) {
        // Filter out the target note uuid
        this.notes = this.notes.filter(note => note.uuid !== uuid);

        return this.saveNotes();
    }

}

module.exports = DataStoreNotes;
