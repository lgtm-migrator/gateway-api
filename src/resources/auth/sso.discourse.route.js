import express from 'express';
import discourse_sso from 'discourse-sso';

router.get('/sso/discourse', async (req, res) => {
  const sso = new discourse_sso(process.env.DISCOURSE_SSO_SECRET);

  const payload = req.query.sso;
  const sig = req.query.sig;

  if (!sso.validate(payload, sig)) {

    return res.status(400).json({ success: false, error: 'There was an error.' });
  }

  const nonce = sso.getNonce(payload);

  console.log(nonce);

  console.log(sig);

  const userparams = {
    // Required, will throw exception otherwise
    nonce: nonce,
    external_id: 5919565324664553,
    email: 'diegofrison@gmail.com',
    // Optional
    username: 'dfrison',
    name: 'Diego Frison',
  };

  const q = sso.buildLoginString(userparams);

  res.redirect(`${process.env.DISCOURSE_URL}/session/sso_login?${q}`);
});
