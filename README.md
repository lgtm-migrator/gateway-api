[![LICENCE](https://img.shields.io/github/license/HDRUK/gateway-api)](https://github.com/HDRUK/gateway-api/blob/master/LICENSE)
[![Support](https://img.shields.io/badge/Supported%20By-HDR%20UK-blue)](https://hdruk.ac.uk)

# HDR UK GATEWAY - API Server (Express)

This is a NodeJS Express server, which provides the Back End API Server to the Gateway. It negotiates with a back-end datasbase and metdata catalogues to allow users to perform user interactions via the Gateway Front End [gateway-web](https://github.com/HDRUK/gateway-web)

### Installation / Running Instructions

To set up the API on your local do the following steps

#### Step 1
Clone the API repository.

`git clone https://github.com/HDRUK/gateway-api`

#### Step 2 
Run the npm install and add mongoose, express, body-parser, morgan and cors modules via command line.

```
npm install
npm i -S mongoose express body-parser morgan cors
```

#### Step 3
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
AUTH_PROVIDER_URI=
openidClientID=
openidClientSecret=
linkedinClientID=
linkedinClientSecret=
# Sendgrid API Key
SENDGRID_API_KEY=
```

#### Step 4
Start the API via command line.

`node server.js`