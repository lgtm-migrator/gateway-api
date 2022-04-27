const orderArrayByValue = (array) => {
	return array.sort((a,b) => ((a < b) ? -1 : ((a > b) ? 1 : 0)));
}

const convertStringToArray = (string) => {
    let decodedString = decodeURIComponent(string);
    return decodedString.replace('::', ',').split(',').map(item => item.trim());
}

const arrayToTree = (array, stringCompare = '') => {
    let tree = [];
    let arrayCompare = convertStringToArray(stringCompare);

    for (let i = 0; i < array.length; i++) {
        let arr = array[i].split(',');
        let parent = tree;
        for (let j = 0; j < arr.length; j++) {
            let label = arr[j];
            let checkingIfExist = arrayCompare.includes(label) ? true : false;
            let child = parent.find(function(el) {
                el.value == label;
                el.checked == checkingIfExist;
                return el.label == label;
            });
            if (child) {
                parent = child.children;
            } else {
                child = {
                    value: label,
                    label: label,
                    checked: checkingIfExist,
                    children: []
                };
                parent.push(child);
                parent = child.children;
            }
        }
    }
    return tree;
}

export default {
    orderArrayByValue,
    arrayToTree,
} 