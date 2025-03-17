// extension/background.js
console.log("Background service worker has started.");

import { API_KEY } from './config.js';

const BASE_URL = "https://api.football-data.org/v4";
const FETCH_INTERVAL_MINUTES = 600; // Changed to hourly to avoid API rate limits

// Fetch delayed scores (finished matches)
async function fetchPastResults(competitionId) {
  try {
    console.log("Fetching past results...");
    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/matches?status=FINISHED`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    console.log("Past results data:", data);
    // Save data per competition – here we assume a single competition for simplicity
    chrome.storage.local.set({ pastResults: data.matches });
  } catch (error) {
    console.error("Error fetching past results:", error);
  }
}

// Fetch upcoming fixtures (scheduled matches)
async function fetchUpcomingFixtures(competitionId) {
  try {
    console.log("Fetching upcoming fixtures...");
    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/matches?status=SCHEDULED`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    console.log("Upcoming fixtures data:", data);
    chrome.storage.local.set({ upcomingFixtures: data.matches });
  } catch (error) {
    console.error("Error fetching fixtures:", error);
  }
}

// Fetch league table (standings)
async function fetchLeagueTable(competitionId) {
  try {
    console.log("Fetching league table...");
    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/standings`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    const data = await response.json();
    console.log("League table data:", data);
    chrome.storage.local.set({ leagueTable: data.standings[0].table });
  } catch (error) {
    console.error("Error fetching league table:", error);
  }
}

// For example, use competition ID "2021" for Premier League
const competitionId = "2021";

// Fetch data immediately when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed - fetching initial data");
  fetchPastResults(competitionId);
  fetchUpcomingFixtures(competitionId);
  fetchLeagueTable(competitionId);
});

// Set an alarm to periodically fetch data
chrome.alarms.create("fetchData", { periodInMinutes: FETCH_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchData") {
    console.log("Alarm triggered - fetching updated data");
    fetchPastResults(competitionId);
    fetchUpcomingFixtures(competitionId);
    fetchLeagueTable(competitionId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "updateLeague") {
      const newCompetitionId = message.leagueId;
      // Call your fetch functions with the new competition ID
      fetchPastResults(newCompetitionId);
      fetchUpcomingFixtures(newCompetitionId);
      fetchLeagueTable(newCompetitionId);
      sendResponse({ status: "League data updated" });
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTeams") {
      const leagueId = request.leagueId;
      fetch(`https://api.football-data.org/v4/competitions/${leagueId}/teams`, {
        headers: {
          "X-Auth-Token": API_KEY // Use the imported key
        }
      })
      .then(response => response.json())
      .then(data => {
        sendResponse({ teams: data.teams });
      })
      .catch(error => {
        console.error("Error fetching teams:", error);
        sendResponse({ error: "Failed to fetch teams" });
      });
      return true; // Needed for async sendResponse
    }
  });