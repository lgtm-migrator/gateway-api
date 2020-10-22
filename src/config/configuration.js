import oidcProvider from 'oidc-provider';

const { interactionPolicy: { Prompt, base: policy } } = oidcProvider;

// copies the default policy, already has login and consent prompt policies
const interactions2 = policy();

// create a requestable prompt with no implicit checks
const selectAccount = new Prompt({
  name: 'select_account',
  requestable: true,
});

// add to index 0, order goes select_account > login > consent
interactions2.add(selectAccount, 0);

export const clients = [
    {
        //Metadata works
        client_id: process.env.MDWClientID || '',
        client_secret: process.env.MDWClientSecret || '',
        //grant_types: ['authorization_code'],
        grant_types: ['authorization_code', 'implicit'],
        response_types: ['code id_token'],
        //response_types: ['code'],
        redirect_uris: process.env.MDWRedirectURI.split(",") || [''],
        id_token_signed_response_alg: 'HS256',
        post_logout_redirect_uris: ['https://atlas-test.uksouth.cloudapp.azure.com/auth/']
    },
    {
        //BC Platforms
        client_id: process.env.BCPClientID || '',
        client_secret: process.env.BCPClientSecret || '',
        //grant_types: ['authorization_code'],
        grant_types: ['authorization_code', 'implicit'],
        response_types: ['code id_token'],
        //response_types: ['code'],
        redirect_uris: process.env.BCPRedirectURI.split(",") || [''],
        id_token_signed_response_alg: 'HS256'
    }
];

export const interactions = {
    policy: interactions2,
    url(ctx, interaction) {
        return `/api/v1/openid/interaction/${ctx.oidc.uid}`;
    },
};

export const cookies = {
    long: { signed: true, maxAge: (1 * 24 * 60 * 60) * 1000 },
    short: { signed: true },
    keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
};

export const claims = {
    email: ['email'],
    profile: ['firstname', 'lastname'],
};

export const features = {
    devInteractions: { enabled: false },
    deviceFlow: { enabled: true },
    introspection: { enabled: true },
    revocation: { enabled: true },
    encryption: { enabled: true },
    rpInitiatedLogout: {
        enabled: true,
        logoutSource,
        postLogoutSuccessSource
      }
};

export const jwks = require('./jwks.json');

export const ttl = {
    AccessToken: 1 * 60 * 60,
    AuthorizationCode: 10 * 60,
    IdToken: 1 * 60 * 60,
    DeviceCode: 10 * 60,
    RefreshToken: 1 * 24 * 60 * 60,
};

async function logoutSource(ctx, form) {
    // @param ctx - koa request context
    // @param form - form source (id="op.logoutForm") to be embedded in the page and submitted by
    //   the End-User
    ctx.body = `<!DOCTYPE html>
      <head>
        <title>Logout Request</title>
        <style>/* css and html classes omitted for brevity, see lib/helpers/defaults.js */</style>
      </head>
      <body>
        <div>
          <h1>Do you want to sign-out from ${ctx.host}?</h1>
          ${form}
          <button autofocus type="submit" form="op.logoutForm" value="yes" name="logout">Yes, sign me out</button>
          <button type="submit" form="op.logoutForm">No, stay signed in</button>
        </div>
      </body>
      </html>`;
  }

  async function postLogoutSuccessSource(ctx) {
    // @param ctx - koa request context
    ctx.res.clearCookie('jwt');
    ctx.res.status(200).redirect(process.env.homeURL+'/search?search=');
  }