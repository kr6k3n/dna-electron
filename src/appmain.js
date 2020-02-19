"use strict";
const { spawnSync } = require('child_process');
const os = require('os').platform();
/* HELPERS */
//round number to decimals
const roundNum = (number, decimals) => {
    decimals = Math.pow(10,decimals)
    return Math.round(number* decimals)/decimals
}
//reverse a string
String.prototype.reverse = () => {
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

const createHTMLList = (elements) => {
    var listView = document.createElement('ul');
    for (var i = 0; i < elements.length; i++) {
        var listViewItem = document.createElement('li');
        listViewItem.appendChild(document.createTextNode(elements[i]));
        listView.appendChild(listViewItem);
    }
    return listView;
}

const mapEventListenerToClass = (className, func, eventType) => {
  document.getElementsByClassName(className).map(element => element.addEventListener(eventType, func))
}

//convert C program output to String
const Utf8ArrayToStr = (array) => {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }
    return out;
}


/* INIT values */
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

const showComparison = (refSequenceName) => {
    let refSequence = sequences[refSequenceName];
    comparisons = {};
    for (var sequence in sequences) {
        if (sequence != refSequenceName) {
            let comparison = spawnSync(`${__dirname.slice(0,__dirname.length-4)}/resources/c/needleman_wunsch_${os}`, [ sequences[sequence], refSequence]);
            console.log(Utf8ArrayToStr(comparison.stdout));
            comparisons[sequence] = Utf8ArrayToStr(comparison.stdout).split("\n").slice(0, 2)

        }
    }
    //displaying part
    //TODO: add alignement display with lazy loading

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

    let resultContainer = document.getElementById('results');
    removeNode(resultContainer.firstChild)
    resultContainer.appendChild(createHTMLList(similarity))

}

window.addEventListener('DOMContentLoaded', function main() {
    addSequence();
    addSequence();
    testNucleotides(10)
})

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
    //  console.log("updated info");
    seqUpdateListeners();
    updateSeqIds();
    sequences = getSequences();
    updateRefSequenceSelector()
}
//on delete
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
    let result = [];
    for (var i = 0; i < len; i++) {
        result.push(nucleotides[randomInt(0, 3)])
    }
    return result.join("")
}

const testNucleotides = (number) => {
    let template = `<div class="col nucleotide-col">
        <div class="row nucleotide">A</div>
        <div class="row nucleotide">T</div>
    </div>`
    let wrapper = document.getElementById('test-wrapper')
    for (var i = 0; i < number; i++) {
        wrapper.innerHTML += template
    }
}
