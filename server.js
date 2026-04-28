const express = require('express');
const { chromium } = require('playwright');

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PDF_API_KEY || '';

app.use(express.json({ limit: '25mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true });
});

app.post('/pdf', async (req, res) => {
  let browser;

  try {
    if (API_KEY) {
      const key = req.headers['x-api-key'];
      if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const html = req.body.html;

    if (!html) {
      return res.status(400).json({ error: 'Missing HTML' });
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);

  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
