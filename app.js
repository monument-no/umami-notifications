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

async function getWeeklyStats(token) {
  const now = new Date();
  const end = new Date(now.setHours(0, 0, 0, 0)).getTime(); // Today at 00:00
  const start = end - 7 * 24 * 60 * 60 * 1000;

  const response = await axios.get(
    `${UMAMI_URL}/api/websites/${UMAMI_ID_WEBSITE_ID}/stats?startAt=${start}&endAt=${end}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return { stats: response.data, start, end };
}

async function postToSlack(message) {
  await axios.post(SLACK_WEBHOOK_URL, {
    text: message,
  });
}

const main = async () => {
  try {
    const token = await getAuthToken();

    const { stats, start, end } = await getWeeklyStats(token);

    const formatDate = (timestamp) =>
      new Date(timestamp).toISOString().split('T')[0];

    const formatChange = (change) => `${change >= 0 ? '+' : ''}${change}`;

    const message = `📊 *MNMT.no Analytics* (${formatDate(
      start
    )} → ${formatDate(end - 1)})

• *Pageviews:* ${stats.pageviews.value} (${formatChange(
      stats.pageviews.change
    )})
• *Unique visitors:* ${stats.visitors.value} (${formatChange(
      stats.visitors.change
    )})
• *Total time on site:* ${stats.totaltime.value}s (${formatChange(
      stats.totaltime.change
    )}s)
`;

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
