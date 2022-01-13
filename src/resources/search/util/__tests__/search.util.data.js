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
        "children": []
    },
    {
        "value": "Pakistan",
        "label": "Pakistan",
        "children": []
    },
    {
        "value": "India",
        "label": "India",
        "children": []
    },
    {
        "value": "United Kingdom",
        "label": "United Kingdom",
        "children": [
            {
                "value": "England",
                "label": "England",
                "children": [
                    {
                        "value": "London",
                        "label": "London",
                        "children": []
                    }
                ]
            },
            {
                "value": "Northern Ireland",
                "label": "Northern Ireland",
                "children": []
            },
            {
                "value": "Scotland",
                "label": "Scotland",
                "children": []
            },
            {
                "value": "Wales",
                "label": "Wales",
                "children": []
            }
        ]
    },
    {
        "value": "Worldwide",
        "label": "Worldwide",
        "children": []
    }
];

export default {
    arrayUnOrdered,
    arrayOrdered,
    tree,
} 