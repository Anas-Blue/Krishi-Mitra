/**
 * Python AI service client.
 * All calls authenticated with X-Service-Key.
 * Node never exposes this key to the React client.
 */
const axios = require('axios');
const FormData = require('form-data');

function pythonClient() {
  const baseURL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  const serviceKey = process.env.SERVICE_KEY || '';

  const headers = {
    'X-Service-Key': serviceKey,
    'Content-Type': 'application/json',
  };

  const client = axios.create({ baseURL, headers, timeout: 45000 });

  async function predictYield(payload) {
    const resp = await client.post('/predict-yield', payload);
    return resp.data.data;
  }

  async function challenge(recommendation, evidence) {
    const resp = await client.post('/challenge', { recommendation, evidence });
    return resp.data.data;
  }

  async function vision(imageBuffer, mimetype) {
    const form = new FormData();
    form.append('file', imageBuffer, { filename: 'crop.jpg', contentType: mimetype });
    const resp = await axios.post(`${baseURL}/vision`, form, {
      headers: {
        ...form.getHeaders(),
        'X-Service-Key': serviceKey,
      },
      timeout: 45000,
    });
    return resp.data.data;
  }

  async function explain(language, advisory) {
    const resp = await client.post('/explain', { language, advisory });
    return resp.data.data;
  }

  return { predictYield, challenge, vision, explain };
}

module.exports = pythonClient();
