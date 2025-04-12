import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.body.recaptchaToken;
  // console.log(1);
  if (!token) {
    return res.status(400).json({ error: 'reCAPTCHA token missing' });
  }
  // console.log(2);
  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      }
    });

    const { success, score, action } = response.data;

    if (!success) {
      return res.status(403).json({ error: 'reCAPTCHA verification failed' });
    }

    // Optional: if using reCAPTCHA v3, you can check `score` and `action`
    // if (score < 0.5 || action !== "login") {
    //   return res.status(403).json({ error: "reCAPTCHA suspicious" });
    // }

    next();
  } catch (err) {
    console.error('reCAPTCHA error:', err);
    return res.status(500).json({ error: 'reCAPTCHA verification error' });
  }
};
