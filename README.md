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
# MongoDB connection parameters
user=
password=
cluster=
database=

homeURL=http://localhost:3000

# Auth parameters
googleClientID=
googleClientSecret=
JWTSecret=
AUTH_PROVIDER_URI=
openidClientID=
openidClientSecret=
linkedinClientID=
linkedinClientSecret=

# Sendgrid API Key
SENDGRID_API_KEY=

# Datacustodian email address used for testing data access request locally, place with your email!
DATA_CUSTODIAN_EMAIL=your@email.com

# Discourse integration
DISCOURSE_API_KEY=
DISCOURSE_URL=
DISCOURSE_CATEGORY_TOOLS_ID=
DISCOURSE_SSO_SECRET=
```

## Step 4
Start the API via command line.
```node server.js```