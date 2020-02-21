/* DOM HELPERS */
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
module.exports = {
    removeNode: removeNode,
    copyObj : copyObj,
    removeAllChildren: removeAllChildren,
    createElementFromHTML: createElementFromHTML
}
