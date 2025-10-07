const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.path === '/real.html') {
    return res.status(403).send('Access denied. Please use the proper authentication flow.');
  }
  next();
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/verify-captcha', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.json({ success: false, error: 'No token provided' });
  }

  try {
    const secretKey = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();
    
    if (data.success) {
      res.cookie('captcha_pass', 'verified', { maxAge: 24*60*60*1000, httpOnly: true });
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'reCAPTCHA verification failed' });
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.json({ success: false, error: 'Verification failed' });
  }
});

app.post('/verify', (req, res) => {
  const { answer, a, b } = req.body;
  if (parseInt(answer) === parseInt(a) + parseInt(b)) {
    res.cookie('verified', 'true', { maxAge: 5*60*1000, httpOnly: true });
    res.redirect('/real');
  } else {
    res.redirect('/?error=1');
  }
});

app.get('/real', (req, res) => {
  if (req.cookies.verified === 'true' || req.cookies.captcha_pass === 'verified') {
    res.sendFile(__dirname + '/public/real.html');
  } else {
    res.redirect('/');
  }
});

app.get('/real.html', (req, res) => {
  res.redirect('/real');
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
