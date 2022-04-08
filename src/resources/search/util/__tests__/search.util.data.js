const arrayUnOrdered = [ 
    'Malaysia',
    'Pakistan',
    'India',
    'United Kingdom',
    'United Kingdom,England',
    'United Kingdom,England,London',
    'United Kingdom,Northern Ireland',
    'United Kingdom,Scotland',
    'United Kingdom,Wales',
    'Worldwide',
];

const arrayOrdered = [
    "India", 
    "Malaysia", 
    "Pakistan", 
    "United Kingdom", 
    "United Kingdom,England", 
    "United Kingdom,England,London", 
    "United Kingdom,Northern Ireland", 
    "United Kingdom,Scotland", 
    "United Kingdom,Wales", 
    "Worldwide"
];

const tree = [
    {
        "value": "Malaysia",
        "label": "Malaysia",
        "checked": false,
        "children": []
    },
    {
        "value": "Pakistan",
        "label": "Pakistan",
        "checked": false,
        "children": []
    },
    {
        "value": "India",
        "label": "India",
        "checked": false,
        "children": []
    },
    {
        "value": "United Kingdom",
        "label": "United Kingdom",
        "checked": false,
        "children": [
            {
                "value": "England",
                "label": "England",
                "checked": false,
                "children": [
                    {
                        "value": "London",
                        "label": "London",
                        "checked": false,
                        "children": []
                    }
                ]
            },
            {
                "value": "Northern Ireland",
                "label": "Northern Ireland",
                "checked": false,
                "children": []
            },
            {
                "value": "Scotland",
                "label": "Scotland",
                "checked": false,
                "children": []
            },
            {
                "value": "Wales",
                "label": "Wales",
                "checked": false,
                "children": []
            }
        ]
    },
    {
        "value": "Worldwide",
        "label": "Worldwide",
        "checked": false,
        "children": []
    }
];

export default {
    arrayUnOrdered,
    arrayOrdered,
    tree,
} 