export const mockCohorts = [
    {
        "_id": {
            "$oid": "610aabea83eb3f2a4d33ddd1"
        },
        "pid": "9a41b63f-5ec5-4966-9d70-f718df24a395",
        "description": "a test 1",
        "uploaders": [{
            "$numberLong": "5999816745288831"
        }, {
            "$numberLong": "6936200071297669"
        }, {
            "$numberLong": "123"
        }, {
            "$numberLong": "6936200071297669"
        }],
        "cohort": {
            "stuff": "stuff"
        },
        "version": 1,
        "changeLog": "",
        "testArr": ["test1", "test2"],
        "id": 1234,
        "name": "myCohort",
        "updatedAt": {
            "$date": "2021-10-07T14:43:55.508Z"
        },
        "activeflag": "archived_version",
        "type": "cohort",
        "relatedObjects": [{
            "_id": {
                "$oid": "6141fae77e4d8d8f758e9fb6"
            },
            "objectId": "4050303073977839",
            "objectType": "project",
            "user": "Ciara Ward",
            "updated": "21 May 2021"
        }, {
            "_id": {
                "$oid": "6141fb4f7e4d8d8f758e9fb7"
            },
            "objectId": "6061998693684476",
            "reason": "cohort add via db",
            "objectType": "tool",
            "user": "Ciara Ward",
            "updated": "11 September 2021"
        }, {
            "_id": {
                "$oid": "61431817508c5aa2dce95cdb"
            },
            "objectId": "5d76d094-446d-4dcc-baa1-076095f30c23",
            "objectType": "dataset",
            "pid": "0bb8d80b-4d92-4bcb-84b7-5a1ff1f86a33",
            "user": "Ciara Ward",
            "updated": "16 September 2021",
            "isLocked": true
        }, {
            "_id": {
                "$oid": "614321de508c5aa2dce95cdc"
            },
            "objectId": "c6d6bbd3-74ed-46af-841d-ac5e05f4da41",
            "objectType": "dataset",
            "pid": "f725187f-7352-482b-a43b-64ebc96e66f2",
            "user": "Ciara Ward",
            "updated": "16 September 2021",
            "isLocked": true
        }],
        "publicflag": true,
        "datasetPids": []
    },
    {
        "_id": {
            "$oid": "610aac0683eb3f2a4d33ddd2"
        },
        "pid": "abc12a3",
        "description": "a test 2",
        "uploaders": [5999816745288800, 947228017269610],
        "cohort": {
            "stuff": "4444"
        },
        "version": 1,
        "changeLog": "",
        "id": 3456,
        "name": "test2 - richard",
        "updatedAt": {
            "$date": "2021-10-20T13:23:09.093Z"
        },
        "activeflag": "active",
        "type": "cohort",
        "publicflag": false,
        "relatedObjects": [{
            "_id": {
                "$oid": "614dcb0e1b5e0aa5019aee12"
            },
            "objectId": "5d76d094-446d-4dcc-baa1-076095f30c23",
            "objectType": "dataset",
            "pid": "0bb8d80b-4d92-4bcb-84b7-5a1ff1f86a33",
            "user": "Ciara Ward",
            "updated": "6 September 2021",
            "isLocked": true
        }, {
            "_id": {
                "$oid": "6155ad4116113e65c26a8a4c"
            },
            "objectId": "4050303073977839",
            "objectType": "project",
            "user": "Ciara Ward",
            "updated": "28 September 2021"
        }, {
            "_id": {
                "$oid": "6155ada116113e65c26a8a4d"
            },
            "reason": "cohort add via db",
            "objectType": "tool",
            "user": "Ciara Ward",
            "updated": "29 September 2021",
            "objectId": "6061998693684476"
        }],
        "datasetPids": []
    }
];