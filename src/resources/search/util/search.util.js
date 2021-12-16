const orderArrayByValue = (array) => {
	return array.sort((a,b) => ((a < b) ? -1 : ((a > b) ? 1 : 0)));
}

const arrayToTree = (array) => {
    let tree = [];
    for (let i = 0; i < array.length; i++) {
        let arr = array[i].split(',');
        let parent = tree;
        for (let j = 0; j < arr.length; j++) {
            let label = arr[j];
            let child = parent.find(function(el) {
                el.value == label;
                return el.label == label;
            });
            if (child) {
                parent = child.children;
            } else {
                child = {
                    value: label,
                    label: label,
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