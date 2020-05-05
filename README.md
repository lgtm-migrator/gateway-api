# HDR UK API
To set up the API on your local do the following steps

## Step 1
* Clone the API repository.
* ```git clone ssh://xxxx.xxxx@xxxx.xxx@source.developers.google.com:2022/p/hdrukrdt-tonyespley/r/hdruk-rdt-api```

## Step 2 
Run the npm install and add mongoose, express, body-parser, morgan and cors modules via command line.
* ```npm install```
* ```npm i -S mongoose express body-parser morgan cors```

## Step 3
Create a .env file in the root of the project with this content:

```
# db user
user=
# db password
password=
# db cluster
cluster=
# db name
database=
googleClientID=
googleClientSecret=
JWTSecret=
homeURL=http://localhost:3000
PORT=3001
```

## Step 4
Start the API via command line.
```node server.js```