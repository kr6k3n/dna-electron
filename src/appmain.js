"use strict";
const { spawn } = require('child_process');

/* HELPERS */
const removeNode = function(node) {
    node.parentNode.removeChild(node);
}
//remove from list
Array.prototype.removeValue = function(value) {
    let newArray = [...this];
    newArray.splice(newArray.indexOf(value), 1);
    return newArray
}
//reverse a string
String.prototype.reverse = function() {
    return this.split("").reverse().join("");
}

const copyObj = function(sourceObj) {
    return JSON.parse(JSON.stringify(sourceObj))
}

const removeAllChildren = function(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

//current amount of sequences
var sequenceAmount = 0;
// list containing sequence data / format : {sequence name : sequence value}
var sequences;
//current reference sequence
var refSequenceName;



const sequenceTemplate = function() {
    return `<th scope="row">x</th>
                  <td class="seq-name" contentEditable="true" data-toggle="tooltip" data-placement="top" title="Click to edit name" id="namex" spellcheck="false">Sequence ${sequenceAmount}</td>
                  <td><input type="text" class="form-control sequence-input" placeholder="enter sequence" id="seqx"/></td>
                  <td><button type="button" class="btn btn-danger" onclick="removeSequence(this);">delete</button></td>`
}

//adds a sequence row
const addSequence = function() {
    let sequenceRows = document.getElementsByClassName("sequence-row");
    sequenceAmount = sequenceRows.length;
    sequenceAmount++
    let sequence = document.createElement("TR")
    sequence.setAttribute("class", "sequence-row");
    sequence.innerHTML = sequenceTemplate()
    let table = document.getElementById("sequences");
    table.appendChild(sequence);
    updateSeqInfo();
    seqUpdateListeners();
}

//removes sequence
const removeSequence = function(button) {
    sequenceAmount--
    button.parentNode.parentNode.remove();
    updateSeqInfo();
    seqUpdateListeners();
}

//update sequences list
const getSequences = function() {
    let sequences = {};
    for (var i = 1; i <= sequenceAmount; i++) {
        sequences[(document.getElementById("name" + i).innerHTML)] = document.getElementById("seq" + i).value;
    }
    return sequences
}
//sets the reference sequence
const chooseReferenceSequence = function(dropdownItem) {
    refSequenceName = dropdownItem.innerHTML
    updateRefSequenceSelector()
    showComparison(refSequenceName)
}

const showComparison = function(refSequenceName) {
    let comparisons = {};
    let refSequence = sequences[refSequenceName];
    for (var sequence in sequences) {
        if (sequence != refSequenceName) {
            let comparison = spawn('./resources/c/needleman_wunsch', ["--freestartgap", "--freeendgap", refSequence, sequences[sequence]]);
            comparison.stdout.on('data', (data) => {
              comparisons[sequence] = `${data}`.split("\n").slice(0,2)
            });
        }
    }
    console.log(comparisons);
}

window.addEventListener('DOMContentLoaded', function main() {
    seqUpdateListeners()
    addSequence();
    addSequence();
    updateSeqInfo()
})

/* UI UPDATES */

const updateSeqInfo = function() {
    console.log("updated info");
    seqUpdateListeners()
    updateSeqIds()
    updateRefSequenceSelector()
    sequences = getSequences();
}
//on delete
const updateSeqIds = function() {
    let sequenceRows = document.getElementsByClassName("sequence-row");
    sequenceAmount = sequenceRows.length;
    for (let i = 0; i < sequenceRows.length; i++) {
        let row = sequenceRows.item(i);
        row.getElementsByTagName('th').item(0).innerHTML = (i + 1); //change row #
        row.getElementsByTagName('input').item(0).id = "seq" + (i + 1); //change sequence
        row.getElementsByClassName("seq-name").item(0).id = "name" + (i + 1);
    }
}

const updateRefSequenceSelector = function () {
    let dropdownMenu = document.getElementById("ref-chooser");
    removeAllChildren(dropdownMenu);
    dropdownMenu.appendChild(createElementFromHTML(`<a class="dropdown-item" onclick="chooseReferenceSequence(this)">${refSequenceName ? refSequenceName : "None"}</a>`));
    dropdownMenu.appendChild(createElementFromHTML('<div role="separator" class="dropdown-divider"></div>'));
    for (var name in sequences) {
        if (sequences.hasOwnProperty(name) && name != refSequenceName) {
            dropdownMenu.appendChild(createElementFromHTML(`<a class="dropdown-item" onclick="chooseReferenceSequence(this)">${name}</a>`));
        }
    }
}

const seqUpdateListeners = function() {
    let sequenceNames = document.getElementsByClassName("seq-name"),
        sequenceInputs = document.getElementsByClassName("sequence-input");
    for (let i = 0; i < sequenceNames.length; i++) {
        sequenceNames.item(i).addEventListener("keyup", updateSeqInfo)
    }
    for (let i = 0; i < sequenceInputs.length; i++) {
        sequenceInputs.item(i).addEventListener("keyup", updateSeqInfo)
    }
}

const randomInt = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min +1)) + min;
}

const generateRandomSequence = function(len){
    let nucleotides = ["A","T","G","C"];
    let result = [];
    for (var i = 0; i < len; i++) {
        result.push(nucleotides[randomInt(0,3)])
    }
    return result.join("")
}
