/**
 * Tavily search service — finds active cyclone/flood warnings for a location.
 * Only called when HAZARD_ALERT event detection runs.
 */
const axios = require('axios');

const TAVILY_API_URL = 'https://api.tavily.com/search';

async function searchHazards(district, state) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { hazardFound: false, evidence: [], reason: 'Tavily API key not configured' };
  }

  const query = `cyclone flood warning ${district} ${state} India site:ndma.gov.in OR site:imd.gov.in OR site:india.gov.in`;

  try {
    const resp = await axios.post(
      TAVILY_API_URL,
      {
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      },
      { timeout: 10000 }
    );

    const results = resp.data.results || [];
    const hazardKeywords = ['cyclone', 'flood', 'warning', 'alert', 'emergency', 'disaster'];
    const hits = results.filter((r) =>
      hazardKeywords.some((kw) =>
        (r.title + ' ' + r.content).toLowerCase().includes(kw)
      )
    );

    if (hits.length === 0) {
      return { hazardFound: false, evidence: [], reason: 'No active hazard warnings found' };
    }

    return {
      hazardFound: true,
      evidence: hits.map((h) => ({ title: h.title, url: h.url, snippet: h.content?.slice(0, 200) })),
      reason: `${hits.length} hazard warning(s) found for ${district}, ${state}`,
    };
  } catch (err) {
    return { hazardFound: false, evidence: [], reason: `Tavily error: ${err.message}` };
  }
}

module.exports = { searchHazards };
