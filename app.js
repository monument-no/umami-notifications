require('dotenv').config();
const axios = require('axios');

const UMAMI_URL = process.env.UMAMI_URL;
const UMAMI_ID_WEBSITE_ID = process.env.UMAMI_ID_WEBSITE_ID;
const UMAMI_USERNAME = process.env.UMAMI_USERNAME;
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function getAuthToken() {
  const res = await axios.post(`${UMAMI_URL}/api/auth/login`, {
    username: UMAMI_USERNAME,
    password: UMAMI_PASSWORD,
  });
  return res.data.token;
}

async function getYesterdayStats(token) {
  const now = new Date();
  const end = new Date(now.setHours(0, 0, 0, 0)).getTime();
  const start = end - 24 * 60 * 60 * 1000;

  const response = await axios.get(
    `${UMAMI_URL}/api/websites/${UMAMI_ID_WEBSITE_ID}/stats?startAt=${start}&endAt=${end}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

async function postToSlack(message) {
  await axios.post(SLACK_WEBHOOK_URL, {
    text: message,
  });
}

const main = async () => {
  try {
    const token = await getAuthToken();
    const stats = await getYesterdayStats(token);
    const message = `📊 *MNMT Analytics (Yesterday)*\n• Pageviews: ${stats.pageviews}\n• Visitors: ${stats.uniques}`;
    await postToSlack(message);
    console.log('Slack report sent successfully.');
  } catch (err) {
    console.error('Error sending Slack report:', err.message);
  }
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
