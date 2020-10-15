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
        grant_types: ['authorization_code'],
        //grant_types: ['authorization_code', 'implicit'],
        response_types: ['code'],
        //response_types: ['code'],
        redirect_uris: process.env.MDWRedirectURI.split(",") || [''],
        id_token_signed_response_alg: 'HS256'
    },
    {
        //BC Platforms
        client_id: process.env.BCPClientID || '',
        client_secret: process.env.BCPClientSecret || '',
        grant_types: ['authorization_code'],
        //grant_types: ['authorization_code', 'implicit'],
        response_types: ['code'],
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
};

export const jwks = require('./jwks.json');

export const ttl = {
    AccessToken: 1 * 60 * 60,
    AuthorizationCode: 10 * 60,
    IdToken: 1 * 60 * 60,
    DeviceCode: 10 * 60,
    RefreshToken: 1 * 24 * 60 * 60,
};
