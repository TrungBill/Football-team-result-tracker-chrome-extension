const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.football-data.org/v4";

app.use(cors());

app.get('/api/pastResults/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const response = await fetch(`${BASE_URL}/competitions/${leagueId}/matches?status=FINISHED&limit=10`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch past results' });
  }
});

app.get('/api/upcomingFixtures/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const response = await fetch(`${BASE_URL}/competitions/${leagueId}/matches?status=SCHEDULED`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming fixtures' });
  }
});

app.get('/api/leagueTable/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const response = await fetch(`${BASE_URL}/competitions/${leagueId}/standings`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch league table' });
  }
});

app.get('/api/teams/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const response = await fetch(`${BASE_URL}/competitions/${leagueId}/teams`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
