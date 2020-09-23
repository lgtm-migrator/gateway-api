/* eslint-disable no-console */

const path = require('path');
const url = require('url');

const set = require('lodash/set');
const express = require('express'); // eslint-disable-line import/no-unresolved
const helmet = require('helmet');

const { Provider } = require('../lib'); // require('oidc-provider');

const Account = require('./support/account');
const configuration = require('./support/configuration');
const routes = require('./routes/express');

const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;
configuration.findAccount = Account.findAccount;

const app = express();
app.use(helmet());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let server;
(async () => {
  let adapter;
  if (process.env.MONGODB_URI) {
    adapter = require('./adapters/mongodb'); // eslint-disable-line global-require
    await adapter.connect();
  }

  const provider = new Provider(ISSUER, { adapter, ...configuration });

  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    provider.proxy = true;
    set(configuration, 'cookies.short.secure', true);
    set(configuration, 'cookies.long.secure', true);

    app.use((req, res, next) => {
      if (req.secure) {
        next();
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        res.redirect(url.format({
          protocol: 'https',
          host: req.get('host'),
          pathname: req.originalUrl,
        }));
      } else {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'do yourself a favor and only use https',
        });
      }
    });
  }

  routes(app, provider);
  app.use(provider.callback);
  server = app.listen(PORT, () => {
    console.log(`application is listening on port ${PORT}, check its /.well-known/openid-configuration`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});



{
    "authorization_endpoint": "http://localhost:3001/auth",
    "claims_parameter_supported": false,
    "claims_supported": [
        "sub",
        "sid",
        "auth_time",
        "iss"
    ],
    "code_challenge_methods_supported": [
        "S256"
    ],
    "end_session_endpoint": "http://localhost:3001/session/end",
    "grant_types_supported": [
        "implicit",
        "authorization_code",
        "refresh_token"
    ],
    "id_token_signing_alg_values_supported": [
        "HS256",
        "RS256"
    ],
    "issuer": "http://localhost:3001",
    "jwks_uri": "http://localhost:3001/jwks",
    "response_modes_supported": [
        "form_post",
        "fragment",
        "query"
    ],
    "response_types_supported": [
        "code id_token",
        "code",
        "id_token",
        "none"
    ],
    "scopes_supported": [
        "openid",
        "offline_access"
    ],
    "subject_types_supported": [
        "public"
    ],
    "token_endpoint_auth_methods_supported": [
        "none",
        "client_secret_basic",
        "client_secret_jwt",
        "client_secret_post",
        "private_key_jwt"
    ],
    "token_endpoint_auth_signing_alg_values_supported": [
        "HS256",
        "RS256",
        "PS256",
        "ES256",
        "EdDSA"
    ],
    "token_endpoint": "http://localhost:3001/token",
    "request_object_signing_alg_values_supported": [
        "HS256",
        "RS256",
        "PS256",
        "ES256",
        "EdDSA"
    ],
    "request_parameter_supported": false,
    "request_uri_parameter_supported": true,
    "require_request_uri_registration": true,
    "userinfo_endpoint": "http://localhost:3001/me",
    "userinfo_signing_alg_values_supported": [
        "HS256",
        "RS256"
    ],
    "introspection_endpoint": "http://localhost:3001/token/introspection",
    "introspection_endpoint_auth_methods_supported": [
        "none",
        "client_secret_basic",
        "client_secret_jwt",
        "client_secret_post",
        "private_key_jwt"
    ],
    "introspection_endpoint_auth_signing_alg_values_supported": [
        "HS256",
        "RS256",
        "PS256",
        "ES256",
        "EdDSA"
    ],
    "revocation_endpoint": "http://localhost:3001/token/revocation",
    "revocation_endpoint_auth_methods_supported": [
        "none",
        "client_secret_basic",
        "client_secret_jwt",
        "client_secret_post",
        "private_key_jwt"
    ],
    "revocation_endpoint_auth_signing_alg_values_supported": [
        "HS256",
        "RS256",
        "PS256",
        "ES256",
        "EdDSA"
    ],
    "claim_types_supported": [
        "normal"
    ]
}


http://localhost:3001/test2/auth?client_id=test_implicit_app&redirect_uri=https://www.google.com&response_type=id_token&scope=openid profile api1&nonce=123&state=321

http://localhost:3001/session/end


Client ID
Client secret
redirect URL






http://localhost:3001/auth
?client_id=test_implicit_app
&redirect_uri=https://www.google.com
&response_type=id_token
&scope=openid profile api1
&nonce=123
&state=321


https://www.google.com/
#id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleXN0b3JlLUNIQU5HRS1NRSJ9.eyJzdWIiOiJ2ZXdmZXciLCJub25jZSI6IjEyMyIsInNfaGFzaCI6ImpTUFBiSWJvTktlcWJ0N1ZUQ2JPS3ciLCJhdWQiOiJ0ZXN0X2ltcGxpY2l0X2FwcCIsImV4cCI6MTU5OTYwNjQ4OCwiaWF0IjoxNTk5NjAyODg4LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEifQ.AkRfvCJ_8bx8A0CnNGVf2IjCPMjvrXtqLnepFqlmibCybYCfH5xoavHeFRXXVUNTVUdKOcTS8LUiMwuFt2k5C9RmB_Y7iAZrDDGTtpyAH1xBDtVokxN90DLgHsmSX9Vr9pOrxA-F9-mWRj1wnkrq5IMBLFdByXbuVKTrj4_MnRNiirLeoKHMrSyMWtte7tLvzOWeYdpT3NlC6lVI440jKGyBzcHHXLzK_3VZWZUuWMGqF2srzRDa41gLsZ_n8ZHoTRycJcRT6W8uMSS2FHI6ftBW0Ojvj7dTVP5DgxixY7VzwnV8_X-X4Ib1KkN9vujGNG0btB2Bt72IjnJruO37eQ
&state=321





https://sandbox.orcid.org/oauth/authorize
${requestScope.orcidURL}
?client_id=${requestScope.clientID}
&response_type=code
&scope=/authenticate
&show_login=true
&redirect_uri=${requestScope.redirectURL}register?user=${requestScope.email}

https://sandbox.orcid.org/oauth/token
nameValuePairs.add(new BasicNameValuePair("client_id", clientID));
nameValuePairs.add(new BasicNameValuePair("client_secret", clientSecret));
nameValuePairs.add(new BasicNameValuePair("grant_type", "authorization_code"));
nameValuePairs.add(new BasicNameValuePair("code", code));
nameValuePairs.add(new BasicNameValuePair("redirect_uri", redirectURL +redirectLink+"?user="+email));



http://localhost:3001/interaction/kR1lHiweJBsG8L6p5hpxr
{
    authorization: '/auth',
    introspection: '/token/introspection',
    token: '/token',

    
    check_session: '/session/check',
    code_verification: '/device',
    device_authorization: '/device/auth',
    end_session: '/session/end',
    jwks: '/jwks',
    pushed_authorization_request: '/request',
    registration: '/reg',
    revocation: '/token/revocation',
    userinfo: '/me'
  }


  curl --location --request POST 'http://localhost:3001/api/v1/openid/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Basic N0NEMkEzRTg5MjI0QkNGRDoxQWVuMXUxQTBaVzUySDhrQ0dtU2IyRm5ldXFiMFlEeg==' \
--data-raw 'client_id=7CD2A3E89224BCFD&grant_type=authorization_code&code=vvsP0VaGU3n_qfCEfkItsA-AHiKjyXsc0OHctcO4O28'


curl --location --request GET 'http://localhost:3001/api/v1/openid/me?access_token=nt7r0Rw8siQ1Umj3S3vrKiRV_7ZM1BUyiJujpz0Q0R0'




{
    "authorization_endpoint": "http://localhost:3001/api/v1/openid/auth",
    "device_authorization_endpoint": "http://localhost:3001/api/v1/openid/device/auth",
    "claims_parameter_supported": false,
    "claims_supported": ["sub", "address", "email", "email_verified", "phone_number", "phone_number_verified", "birthdate", "family_name", "gender", "given_name", "locale", "middle_name", "name", "nickname", "picture", "preferred_username", "profile", "updated_at", "website", "zoneinfo", "sid", "auth_time", "iss"],
    "code_challenge_methods_supported": ["S256"],
    "end_session_endpoint": "http://localhost:3001/api/v1/openid/session/end",
    "grant_types_supported": ["implicit", "authorization_code", "refresh_token", "urn:ietf:params:oauth:grant-type:device_code"],
    "id_token_signing_alg_values_supported": ["HS256", "ES256", "EdDSA", "PS256", "RS256"],
    "issuer": "http://localhost:3001",
    "jwks_uri": "http://localhost:3001/api/v1/openid/jwks",
    "response_modes_supported": ["form_post", "fragment", "query"],
    "response_types_supported": ["code id_token", "code", "id_token", "none"],
    "scopes_supported": ["openid", "offline_access", "address", "email", "phone", "profile"],
    "subject_types_supported": ["public"],
    "token_endpoint_auth_methods_supported": ["none", "client_secret_basic", "client_secret_jwt", "client_secret_post", "private_key_jwt"],
    "token_endpoint_auth_signing_alg_values_supported": ["HS256", "RS256", "PS256", "ES256", "EdDSA"],
    "token_endpoint": "http://localhost:3001/api/v1/openid/token",
    "request_object_signing_alg_values_supported": ["HS256", "RS256", "PS256", "ES256", "EdDSA"],
    "request_parameter_supported": false,
    "request_uri_parameter_supported": true,
    "require_request_uri_registration": true,
    "userinfo_endpoint": "http://localhost:3001/api/v1/openid/me",
    "userinfo_signing_alg_values_supported": ["HS256", "ES256", "EdDSA", "PS256", "RS256"],
    "introspection_endpoint": "http://localhost:3001/api/v1/openid/token/introspection",
    "introspection_endpoint_auth_methods_supported": ["none", "client_secret_basic", "client_secret_jwt", "client_secret_post", "private_key_jwt"],
    "introspection_endpoint_auth_signing_alg_values_supported": ["HS256", "RS256", "PS256", "ES256", "EdDSA"],
    "revocation_endpoint": "http://localhost:3001/api/v1/openid/token/revocation",
    "revocation_endpoint_auth_methods_supported": ["none", "client_secret_basic", "client_secret_jwt", "client_secret_post", "private_key_jwt"],
    "revocation_endpoint_auth_signing_alg_values_supported": ["HS256", "RS256", "PS256", "ES256", "EdDSA"],
    "id_token_encryption_alg_values_supported": ["A128KW", "A256KW", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A256KW", "RSA-OAEP"],
    "id_token_encryption_enc_values_supported": ["A128CBC-HS256", "A128GCM", "A256CBC-HS512", "A256GCM"],
    "userinfo_encryption_alg_values_supported": ["A128KW", "A256KW", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A256KW", "RSA-OAEP"],
    "userinfo_encryption_enc_values_supported": ["A128CBC-HS256", "A128GCM", "A256CBC-HS512", "A256GCM"],
    "request_object_encryption_alg_values_supported": ["A128KW", "A256KW", "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A256KW", "RSA-OAEP"],
    "request_object_encryption_enc_values_supported": ["A128CBC-HS256", "A128GCM", "A256CBC-HS512", "A256GCM"],
    "claim_types_supported": ["normal"]
}