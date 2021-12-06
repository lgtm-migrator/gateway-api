const orderArrayByValue = (array) => {
	return array.sort((a,b) => ((a < b) ? -1 : ((a > b) ? 1 : 0)));
}

const arrayToTree = (array) => {
    var tree = [];
    for (var i = 0; i < array.length; i++) {
        var arr = array[i].split(',');
        var parent = tree;
        for (var j = 0; j < arr.length; j++) {
            var label = arr[j];
            var child = parent.find(function(el) {
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