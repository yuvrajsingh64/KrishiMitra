const axios = require('axios');

/**
 * Middleware to verify Google reCAPTCHA v2 token.
 * Expects `captchaToken` in the request body.
 * Skips verification if RECAPTCHA_SECRET_KEY is not configured (dev mode).
 */
const verifyCaptcha = async (req, res, next) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Skip captcha in dev if secret key is not set
  if (!secretKey) {
    return next();
  }

  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: 'Please complete the CAPTCHA verification.' });
  }

  try {
    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: captchaToken,
        },
      }
    );

    if (!data.success) {
      return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    next();
  } catch (error) {
    console.error('CAPTCHA verification error:', error.message);
    return res.status(500).json({ message: 'CAPTCHA verification error. Please try again.' });
  }
};

module.exports = { verifyCaptcha };
