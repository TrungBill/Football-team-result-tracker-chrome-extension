console.log("Background service worker has started.");

const BASE_URL = "http://localhost:3000/api"; // Backend server URL

function initializeApp() {
  const FETCH_INTERVAL_MINUTES = 600; // Changed to hourly to avoid API rate limits

  // Add debugging to help identify which leagues are supported
  function fetchPastResults(leagueId) {
    return new Promise((resolve, reject) => {
      fetch(`${BASE_URL}/pastResults/${leagueId}`)
        .then(response => {
          if (!response.ok) {
            console.error(`Error fetching past results for ${leagueId}: HTTP ${response.status}`);
            return response.text().then(text => {
              try {
                return Promise.reject(JSON.parse(text));
              } catch {
                return Promise.reject(text);
              }
            });
          }
          return response.json();
        })
        .then(data => {
          console.log(`Successful data fetch for ${leagueId} past results:`, 
            data.matches ? `${data.matches.length} matches` : 'No matches found');
          chrome.storage.local.set({ [`pastResults_${leagueId}`]: data.matches || [] });
          resolve(data);
        })
        .catch(error => {
          console.error(`Error processing past results for league ${leagueId}:`, error);
          chrome.storage.local.set({ [`pastResults_${leagueId}`]: [] });
          reject(error);
        });
    });
  }

  // Fetch upcoming fixtures (scheduled matches)
  function fetchUpcomingFixtures(leagueId) {
    return new Promise((resolve, reject) => {
      fetch(`${BASE_URL}/upcomingFixtures/${leagueId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          chrome.storage.local.set({ [`upcomingFixtures_${leagueId}`]: data.matches || [] });
          resolve(data);
        })
        .catch(error => {
          console.error(`Error fetching upcoming fixtures for league ${leagueId}:`, error);
          reject(error);
        });
    });
  }

  // Update the fetchLeagueTable function in background.js
  function fetchLeagueTable(leagueId) {
    return new Promise((resolve, reject) => {
      fetch(`${BASE_URL}/leagueTable/${leagueId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Log the data structure to understand what we're receiving
          console.log(`League table data for ${leagueId}:`, data);
          
          // Handle different possible data structures
          let tableData = [];
          
          if (data.standings && Array.isArray(data.standings) && data.standings.length > 0) {
            tableData = data.standings[0].table || [];
          } else if (data.standing && Array.isArray(data.standing)) {
            // Some API versions use "standing" instead of "standings"
            tableData = data.standing;
          } else if (data.table && Array.isArray(data.table)) {
            // Direct table array in response
            tableData = data.table;
          }
          
          // Save whatever valid data we found
          chrome.storage.local.set({ [`leagueTable_${leagueId}`]: tableData });
          resolve(data);
        })
        .catch(error => {
          console.error(`Error fetching league table for league ${leagueId}:`, error);
          chrome.storage.local.set({ [`leagueTable_${leagueId}`]: [] });
          reject(error);
        });
    });
  }

  function fetchLeagueData(leagueId) {
    console.log(`Attempting to fetch data for league: ${leagueId}`);
    
    // Track fetch completion status
    const fetchStatus = {
      pastResults: false,
      upcomingFixtures: false,
      leagueTable: false
    };
    
    // Fetch past results
    fetchPastResults(leagueId)
      .then(() => {
        fetchStatus.pastResults = true;
        console.log(`Successfully fetched past results for ${leagueId}`);
      })
      .catch(error => {
        console.error(`Error fetching past results for ${leagueId}:`, error);
        // Store empty array on error to avoid undefined errors
        chrome.storage.local.set({ [`pastResults_${leagueId}`]: [] });
      });
    
    // Fetch upcoming fixtures
    fetchUpcomingFixtures(leagueId)
      .then(() => {
        fetchStatus.upcomingFixtures = true;
        console.log(`Successfully fetched upcoming fixtures for ${leagueId}`);
      })
      .catch(error => {
        console.error(`Error fetching upcoming fixtures for ${leagueId}:`, error);
        chrome.storage.local.set({ [`upcomingFixtures_${leagueId}`]: [] });
      });
    
    // Fetch league table
    fetchLeagueTable(leagueId)
      .then(() => {
        fetchStatus.leagueTable = true;
        console.log(`Successfully fetched league table for ${leagueId}`);
      })
      .catch(error => {
        console.error(`Error fetching league table for ${leagueId}:`, error);
        chrome.storage.local.set({ [`leagueTable_${leagueId}`]: [] });
      });
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
    if (message.action === "fetchTeams") {
      const leagueId = message.leagueId;
      
      fetch(`${BASE_URL}/teams/${leagueId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          sendResponse({ teams: data.teams });
        })
        .catch(error => {
          console.error("Error fetching teams:", error);
          sendResponse({ error: "Failed to fetch teams" });
        });
      
      return true; // Important: keeps the message channel open for the async response
    }
    
    if (message.type === "updateLeague") {
      const leagueId = message.leagueId;
      fetchLeagueData(leagueId);
      sendResponse({ status: "League data fetch initiated" });
      return true; // Keep message channel open
    }
  });
}

// In server.js
app.get('/api/leagueTable/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  try {
    const response = await fetch(`${BASE_URL}/competitions/${leagueId}/standings`, {
      headers: { "X-Auth-Token": API_KEY }
    });
    
    const data = await response.json();
    
    // Log data structure to help with debugging
    console.log(`League ${leagueId} standings response:`, 
                data.standings ? 'Has standings data' : 'No standings data');
    
    // Return the full data object, let the client handle the structure
    res.json(data);
  } catch (error) {
    console.error('Error fetching league table:', error);
    res.status(500).json({ error: 'Failed to fetch league table' });
  }
});

// Start the app
initializeApp();