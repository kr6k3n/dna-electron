"use strict";
const { spawnSync } = require('child_process');
const os = require('os').platform();
const { whenInViewport } = require('./inView.js')
const { Utf8ArrayToStr } = require('./helpers.js')
/* HELPERS */
//round number to decimals
const roundNum = (number, decimals) => {
    decimals = Math.pow(10,decimals)
    return Math.round(number* decimals)/decimals
}
//reverse a string
String.prototype.reverse = function () {
    return this.split("").reverse().join("");
}
// map method in string
String.prototype.map = function (func) {
  let map = [],
      chars = this.split("")
  for (let i = 0; i < this.length; i++) {
    map.push(func(chars[i]))
  }
  return map.join("")
}

HTMLCollection.prototype.map = function (func) {
  let map = [];
  for (var i = 0; i < this.length; i++) {
    map.push(func(this[i]))
  }
  return map
}


//DOM HELPERS
const removeNode = (node) => {
    if (node == undefined) return;
    node.parentNode.removeChild(node);
}

const copyObj = (sourceObj) => {
    return JSON.parse(JSON.stringify(sourceObj))
}

const removeAllChildren = (node) => {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

const createElementFromHTML = (htmlString) => {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

const makeComparisonList = (elements, comparisons) => {
    var listView = document.createElement('ul');
    let i=0;
    for (var sequence in comparisons) {
        var listViewItem = document.createElement('li');
        listViewItem.appendChild(document.createTextNode(elements[i]));
        listViewItem.appendChild(renderAlignment(comparisons[sequence][0], comparisons[sequence][1]))
        listView.appendChild(listViewItem);
        i++
    }
    listView.setAttribute("id", "resultlist");
    return listView;
}

const mapEventListenerToClass = (className, func, eventType) => {
  document.getElementsByClassName(className).map(element => element.addEventListener(eventType, func))
}

//convert C program output to String




/* UI functions */
//adds a sequence row
const addSequence = () => {
    let sequenceRows = document.getElementsByClassName("sequence-row");
    sequenceAmount = sequenceRows.length;
    sequenceAmount++
    let sequence = document.createElement("TR")
    sequence.setAttribute("class", "sequence-row");
    sequence.innerHTML = sequenceTemplate()
    let table = document.getElementById("sequences");
    table.appendChild(sequence);
    seqUpdateListeners();
    updateSeqInfo();
}

//removes sequence
const removeSequence = (button) => {
    sequenceAmount--
    button.parentNode.parentNode.remove();
    updateSeqInfo();
    seqUpdateListeners();
}

//update sequences list
const getSequences = () => {
    let sequences = {};
    for (var i = 1; i <= sequenceAmount; i++) {
        sequences[(document.getElementById("name" + i).innerHTML)] = document.getElementById("seq" + i).value;
    }
    return sequences
}
//sets the reference sequence
const chooseReferenceSequence = (dropdownItem) => {
    refSequenceName = dropdownItem.innerHTML;
    document.getElementById('reference-sequence-name').innerHTML = refSequenceName;
    updateRefSequenceSelector();
    showComparison(refSequenceName);
}

/* Computing functions */
const showComparison = (refSequenceName) => {
    let refSequence = sequences[refSequenceName];
    comparisons = {};
    for (var sequence in sequences) {
        if (sequence != refSequenceName) {
            let comparison = spawnSync(`${__dirname.slice(0,__dirname.length-4)}/resources/c/needleman_wunsch_${os}`, [ sequences[sequence], refSequence ]);
            console.log(Utf8ArrayToStr(comparison.stdout));
            comparisons[sequence] = Utf8ArrayToStr(comparison.stdout).split("\n").slice(0, 2)

        }
    }
    //displaying part
    //TODO: add lazy loading

    //compute similarity
    let similarity = []
    for (var sequence in comparisons) {
        if (comparisons.hasOwnProperty(sequence)) {
            let comparedSequences = comparisons[sequence]
            let differencesCount = 0
            for (var i = 0; i < comparedSequences[0].length; i++) {
                if (comparedSequences[0][i] != comparedSequences[1][i]) differencesCount++
            }
            differencesCount*= 100/comparedSequences[0].length;
            differencesCount = 100 - differencesCount
            differencesCount = roundNum(differencesCount,3);
            similarity.push(`${sequence}: ${differencesCount}% of similarity`)
        }
    }
    let resultContainer = document.getElementById("results")
    removeNode(document.getElementById('resultlist'))
    resultContainer.appendChild(makeComparisonList(similarity, comparisons))

}


/* UI UPDATES */
const checkSequence = (sequence) => {
  //TODO : add mode for RNA
  let acceptedLetters = "ATGCatgc";
  sequence.value = sequence.value.map(letter => acceptedLetters.indexOf(letter) > -1 ? letter.toUpperCase() : null)
}

const updateSequence = (sequence) => {
  checkSequence(sequence);//sequence is htmlcollection
  sequences = getSequences();
}

const updateSeqInfo = () => {
    seqUpdateListeners();
    updateSeqIds();
    sequences = getSequences();
    updateRefSequenceSelector()
}

const updateSeqIds = () => {
    let sequenceRows = document.getElementsByClassName("sequence-row");
    sequenceAmount = sequenceRows.length;
    for (let i = 0; i < sequenceRows.length; i++) {
        let row = sequenceRows.item(i);
        row.getElementsByTagName('th').item(0).innerHTML = (i + 1); //change row #
        row.getElementsByTagName('input').item(0).id = "seq" + (i + 1); //change sequence
        row.getElementsByClassName("seq-name").item(0).id = "name" + (i + 1);
    }
}

const updateRefSequenceSelector = () => {
    let dropdownMenu = document.getElementById("ref-chooser");
    removeAllChildren(dropdownMenu);
    dropdownMenu.appendChild(createElementFromHTML(`<a class="dropdown-item" onclick="chooseReferenceSequence(this)">${refSequenceName ? refSequenceName : "None"}</a>`));
    dropdownMenu.appendChild(createElementFromHTML('<div role="separator" class="dropdown-divider"></div>'));
    console.log(sequences);
    for (var name in sequences) {
        if (sequences.hasOwnProperty(name) && name != refSequenceName) {
            dropdownMenu.appendChild(createElementFromHTML(`<a class="dropdown-item" onclick="chooseReferenceSequence(this)">${name}</a>`));
        }
    }
}

const seqUpdateListeners = () => {
  document.getElementsByClassName("sequence-input").map(sequence => sequence.addEventListener("keyup",() => updateSequence(sequence)))
  mapEventListenerToClass("seq-name", updateSeqInfo, "keyup")
}

const randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateRandomSequence = (len) => {
    let nucleotides = ["A", "T", "G", "C"];
    let result = "";
    for (var i = 0; i < len; i++) {
        result += nucleotides[randomInt(0, 3)]
    }
    return result
}

const renderAlignment = (seq1, seq2) => { //assuming seq1 & seq2 already aligned ==> same length
    // TODO: add sequence titles
    console.log(seq1,seq2);
    let nucleotideTemplate = nucleotide => (
        `<div class="row nucleotide ${nucleotide} justify-content-center">
            ${nucleotide}
        </div>`);
    let wrapper = createElementFromHTML('<div class="row justify-content-start alignment-wrapper"></div>');
    let nucleotideCol = '<div class="col nucleotide-col justify-content-center"></div>'
    for (let i = 0; i<seq1.length; i++){
        let col = createElementFromHTML(nucleotideCol);
        col.innerHTML += nucleotideTemplate(seq1[i]);
        col.innerHTML += nucleotideTemplate(seq2[i]);
        wrapper.appendChild(col)
    }
    return wrapper
}

const testNucleotides = (number) => {
    let template = `<div class="col nucleotide-col justify-content-center">
                        <div class="row nucleotide A justify-content-center">A</div>
                        <div class="row nucleotide T justify-content-center">T</div>
                    </div>
                    <div class="col nucleotide-col justify-content-center">
                        <div class="row nucleotide G justify-content-center">G</div>
                        <div class="row nucleotide C justify-content-center">C</div>
                    </div>`;
    let wrapper = document.getElementById('test-wrapper')
    for (var i = 0; i < Math.floor(number/2); i++) {
        wrapper.innerHTML += template
    }
}

/* Initalization */

// INIT global variables

//current amount of sequences
var sequenceAmount = 0;
// list containing sequence data / format : {sequence name : sequence value}
var sequences;
//current reference sequence
var refSequenceName = undefined;
//current comparisons
var comparisons = {};

const sequenceTemplate = () => (
    `<th scope="row">x</th>
     <td class="seq-name" contentEditable="true" data-toggle="tooltip" data-placement="top" title="Click to edit name" id="namex" spellcheck="false">Sequence ${sequenceAmount}</td>
     <td><input type="text" class="form-control sequence-input" placeholder="enter sequence" id="seqx"/></td>
     <td><button type="button" class="btn btn-danger" onclick="removeSequence(this);">delete</button></td>`
)

//Initialize Sequences
window.addEventListener('DOMContentLoaded', function main() {
    addSequence();
    addSequence();
    //for dev purposes
    })
