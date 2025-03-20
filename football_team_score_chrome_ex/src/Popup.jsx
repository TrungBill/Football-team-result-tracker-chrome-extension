// src/Popup.jsx
import React, { useEffect, useState } from 'react';
import './Popup.css'; // Import the CSS file

// Add this helper function to calculate relative dates
const formatRelativeDate = (dateString) => {
  // Parse the fixture date
  const fixtureDate = new Date(dateString);
  // Get current date
  const currentDate = new Date();
  
  // Reset time part for accurate day difference calculation
  const fixtureDateNoTime = new Date(fixtureDate);
  fixtureDateNoTime.setHours(0, 0, 0, 0);
  const currentDateNoTime = new Date(currentDate);
  currentDateNoTime.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const differenceInTime = fixtureDateNoTime.getTime() - currentDateNoTime.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  // Format the time (HH:MM)
  const hours = fixtureDate.getHours().toString().padStart(2, '0');
  const minutes = fixtureDate.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  
  // Create the final string
  let relativeDate;
  if (differenceInDays === 0) {
    relativeDate = `Today at ${timeString}`;
  } else if (differenceInDays === 1) {
    relativeDate = `Tomorrow at ${timeString}`;
  } else {
    relativeDate = `in ${differenceInDays} days at ${timeString}`;
  }
  
  return relativeDate;
};

// Enhanced match rendering for side-by-side display
function renderMatchDetails(match) {
  const { homeTeam, awayTeam, score, utcDate, status } = match;
  
  // Extract the correct score properties
  const homeScore = score?.fullTime?.home ?? "-";
  const awayScore = score?.fullTime?.away ?? "-";
  
  // Format the date nicely for standard display
  const matchDate = new Date(utcDate);
  
  // Determine if this is an upcoming match (no score yet)
  const isUpcoming = homeScore === "-" && awayScore === "-";
  
  let formattedDate;
  
  // If it's an upcoming match, use relative date format
  if (isUpcoming) {
    formattedDate = formatRelativeDate(utcDate);
    console.log("Using relative date format:", formattedDate); // Debug log
  } else {
    // For past matches, use day + month format
    const day = matchDate.getDate();
    const month = matchDate.toLocaleString('default', { month: 'short' });
    formattedDate = `${day} ${month}`;
  }
  
  return {
    formattedDate: formattedDate,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeWin: homeScore > awayScore,
    awayWin: awayScore > homeScore,
    draw: homeScore === awayScore
  };
}

export default function Popup() {
  const [pastResults, setPastResults] = useState([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("Tottenham Hotspur FC");
  const [teamCrest, setTeamCrest] = useState("");
  
  // New state for team selection feature
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamsInLeague, setTeamsInLeague] = useState([]);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  
  // Add this state for loading indicator
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Fetch available leagues
  useEffect(() => {
    chrome.storage.local.get("availableLeagues", (data) => {
      console.log("Retrieved available leagues:", data.availableLeagues);
      if (data.availableLeagues && data.availableLeagues.length > 0) {
        setAvailableLeagues(data.availableLeagues);
        // Set initial league if not already set
        if (!selectedLeague) {
          setSelectedLeague(data.availableLeagues[0].id);
        }
      } else {
        // Example leagues if none are stored
        const defaultLeagues = [
          { id: 'PL', name: 'Premier League', country: 'England' },
          { id: 'PD', name: 'LaLiga', country: 'Spain' },
          { id: 'SA', name: 'Serie A', country: 'Italy' },
          { id: 'BL1', name: 'Bundesliga', country: 'Germany' },
          { id: 'FL1', name: 'Ligue 1', country: 'France' },
          { id: 'CL', name: 'UEFA Champions League', country: 'Europe' },
          { id: 'WC', name: 'FIFA World Cup', country: 'International' },
          { id: 'DED', name: 'Eredivisie', country: 'Netherlands' },
          { id: 'PPL', name: 'Primeira Liga', country: 'Portugal' },
          { id: 'ELC', name: 'EFL Championship', country: 'England' },
          { id: 'BSA', name: 'Brasileirão', country: 'Brazil' },
          
        ];
        setAvailableLeagues(defaultLeagues);
        setSelectedLeague('PL'); // Default to Premier League
      }
    });
  }, []);

  // Add a new useEffect for loading the favorite team
  useEffect(() => {
    // Load the favorite team if it exists
    chrome.storage.local.get("favoriteTeam", (data) => {
      if (data.favoriteTeam) {
        setSelectedTeam(data.favoriteTeam.name);
        setSelectedLeague(data.favoriteTeam.leagueId);
        
        // If there's a stored crest, use it as initial value
        if (data.favoriteTeam.crest) {
          setTeamCrest(data.favoriteTeam.crest);
        }
        
        // Trigger data loading for this league
        chrome.runtime.sendMessage(
          { 
            type: "updateLeague", 
            leagueId: data.favoriteTeam.leagueId 
          }
        );
      }
    });
  }, []);

  // Modify the useEffect for team loading to fetch from API when needed
  useEffect(() => {
    if (!selectedLeague) return;
    
    setIsLoadingTeams(true);
    
    chrome.storage.local.get(`teams_${selectedLeague}`, (data) => {
      console.log(`Retrieved teams for ${selectedLeague}:`, data[`teams_${selectedLeague}`]);
      
      if (data[`teams_${selectedLeague}`]) {
        // If teams are in storage, use them
        setTeamsInLeague(data[`teams_${selectedLeague}`]);
        setIsLoadingTeams(false);
      } else {
        // If no teams are stored, fetch them from the API
        // This assumes your background script has a message handler for "fetchTeams"
        chrome.runtime.sendMessage(
          { 
            action: "fetchTeams", 
            leagueId: selectedLeague 
          },
          (response) => {
            if (response && response.teams) {
              // Store teams in local storage for future use
              chrome.storage.local.set({ 
                [`teams_${selectedLeague}`]: response.teams 
              });
              
              setTeamsInLeague(response.teams);
            } else {
              console.error("Failed to fetch teams or invalid response");
              setTeamsInLeague([]);
            }
            setIsLoadingTeams(false);
          }
        );
      }
    });
  }, [selectedLeague]);

  // Update the main data fetching logic to be league-specific
  useEffect(() => {
    if (!selectedLeague) return;
    
    // Set loading states
    const setLoading = () => {
      setPastResults([]);
      setUpcomingFixtures([]);
      setLeagueTable([]);
    };
    
    setLoading();
    
    // Get data from storage
    chrome.storage.local.get(
      [
        `pastResults_${selectedLeague}`, 
        `upcomingFixtures_${selectedLeague}`, 
        `leagueTable_${selectedLeague}`
      ], 
      (data) => {
        console.log(`Data availability for ${selectedLeague}:`);
        console.log(`- Past results: ${data[`pastResults_${selectedLeague}`]?.length || 0} matches`);
        console.log(`- Upcoming fixtures: ${data[`upcomingFixtures_${selectedLeague}`]?.length || 0} matches`);
        console.log(`- League table: ${data[`leagueTable_${selectedLeague}`]?.length || 0} entries`);
        
        setPastResults(data[`pastResults_${selectedLeague}`] || []);
        setUpcomingFixtures(data[`upcomingFixtures_${selectedLeague}`] || []);
        setLeagueTable(data[`leagueTable_${selectedLeague}`] || []);
      }
    );
    
  }, [selectedLeague]); // Re-run when selectedLeague changes

  // Find team info including crest
  useEffect(() => {
    // Check for team logo in results or fixtures
    const findTeamCrest = () => {
      for (const match of [...pastResults, ...upcomingFixtures]) {
        if (match.homeTeam.name === selectedTeam) {
          return match.homeTeam.crest;
        } else if (match.awayTeam.name === selectedTeam) {
          return match.awayTeam.crest;
        }
      }
      return "";
    };
    
    setTeamCrest(findTeamCrest());
  }, [pastResults, upcomingFixtures, selectedTeam]);

  // Filter function to show only matches for the selected team
  const filterMatchesByTeam = (matches) => {
    if (!selectedTeam) return matches;
    return matches.filter(match => 
      match.homeTeam.name === selectedTeam || 
      match.awayTeam.name === selectedTeam
    );
  };

  // Get filtered results and sort them by date
  const filteredPastResults = filterMatchesByTeam(pastResults)
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate)); // Most recent first
    
  const filteredUpcomingFixtures = filterMatchesByTeam(upcomingFixtures)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)); // Soonest first
  
  // Get the most recent past result and next upcoming fixture
  const mostRecentResult = filteredPastResults.length > 0 ? filteredPastResults[0] : null;
  const nextFixture = filteredUpcomingFixtures.length > 0 ? filteredUpcomingFixtures[0] : null;
  
  // Prepare match details
  const recentMatchDetails = mostRecentResult ? renderMatchDetails(mostRecentResult) : null;
  const nextMatchDetails = nextFixture ? renderMatchDetails(nextFixture) : null;

  // Add near where you're processing the next fixture
  console.log("Next fixture data:", nextFixture);

  // Change team handler
  const handleTeamChange = (teamName, teamObj) => {
    setSelectedTeam(teamName);
    setShowTeamSelector(false);
    
    // Save the current selection as the favorite team with its league
    chrome.storage.local.set({ 
      favoriteTeam: {
        name: teamName,
        leagueId: selectedLeague,
        crest: teamObj?.crest || ""
      }
    });
  };
  
  // Update the handleLeagueChange function
  const handleLeagueChange = (leagueId) => {
    console.log(`Changing league to: ${leagueId}`);
    setSelectedLeague(leagueId);
    
    // Clear current team selection
    setSelectedTeam(null);
    
    // Show loading state
    setIsLoadingTeams(true);
    
    // Fetch new data for this league
    chrome.runtime.sendMessage(
      { 
        type: "updateLeague", 
        leagueId: leagueId 
      },
      (response) => {
        console.log("League data update response:", response);
        
        // Force a refresh of the league data after 2 seconds to give time for the fetch to complete
        setTimeout(() => {
          chrome.storage.local.get([
            `pastResults_${leagueId}`, 
            `upcomingFixtures_${leagueId}`, 
            `leagueTable_${leagueId}`
          ], (data) => {
            setPastResults(data[`pastResults_${leagueId}`] || []);
            setUpcomingFixtures(data[`upcomingFixtures_${leagueId}`] || []);
            setLeagueTable(data[`leagueTable_${leagueId}`] || []);
          });
        }, 2000);
      }
    );
  };

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: 'black', 
      minWidth: '400px', 
      color: '#a0a0a0',
      position: 'relative',
      margin: 0,
      boxSizing: 'border-box',
      border: 'none',
      outline: 'none'
    }}>
      {/* Favourite Team Button - Now positioned at top right */}
      <button 
        onClick={() => setShowTeamSelector(!showTeamSelector)}
        style={{
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 12px',
          fontSize: '0.75rem',
          cursor: 'pointer',
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: '10' // Ensure it stays on top
        }}
      >
        {showTeamSelector ? 'Close' : 'Set Favourite'}
      </button>
      
      {/* Team Selection Header - Fixed positioning */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingTop: '1rem' // Add some padding at top to account for the button
      }}>
        {/* Fixed-size container for the crest */}
        <div style={{
          width: '4rem',  // Fixed width container
          height: '4rem', // Fixed height container
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem',
          flexShrink: 0 // Prevent shrinking when team name is long
        }}>
          {teamCrest ? (
            <img 
              src={teamCrest} 
              alt={`${selectedTeam} logo`} 
              style={{ 
                maxHeight: '3rem', 
                maxWidth: '3rem',
                objectFit: 'contain' // Maintains aspect ratio
              }}
            />
          ) : (
            // Placeholder if no crest
            <div style={{ 
              height: '3rem', 
              width: '3rem', 
              backgroundColor: '#222',
              borderRadius: '50%' 
            }}></div>
          )}
        </div>
        
        {/* Team name with consistent placement */}
        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: 'bold',
          color: '#e6e6e6',
          margin: 0, // Remove default margins
          lineHeight: 1.1, // Tighter line height
          wordBreak: 'break-word' // Handle very long team names
        }}>
          {selectedTeam}
        </h1>
      </div>
      
      {/* Team Selector Panel */}
      {showTeamSelector && (
        <div style={{
          backgroundColor: '#111',
          padding: '0.75rem',
          borderRadius: '0.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.5)'
        }}>
          {/* League Selection */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>Select League:</label>
            <select 
              value={selectedLeague || ''} 
              onChange={(e) => handleLeagueChange(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#222',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #444'
              }}
            >
              {availableLeagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.country} - {league.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Team Selection */}
          <div>
            <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>Select Team:</label>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#222',
              borderRadius: '4px',
              border: '1px solid #444'
            }}>
              {isLoadingTeams ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#a0a0a0' }}>
                  Loading teams...
                </div>
              ) : teamsInLeague.length > 0 ? teamsInLeague.map(team => (
                <div 
                  key={team.id}
                  onClick={() => handleTeamChange(team.name, team)} // Pass the full team object
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #333',
                    backgroundColor: team.name === selectedTeam ? '#444' : 'transparent',
                    color: team.name === selectedTeam ? 'white' : '#a0a0a0'
                  }}
                >
                  {team.crest && (
                    <img 
                      src={team.crest} 
                      alt={`${team.name} logo`}
                      style={{ height: '1.5rem', width: '1.5rem', marginRight: '0.5rem' }}
                    />
                  )}
                  {team.name}
                </div>
              )) : (
                <div style={{ padding: '0.5rem', color: '#777' }}>No teams available for this league</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Results and Fixtures Side by Side */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        {/* Past Result - Left Side */}
        <div style={{ width: '50%', paddingRight: '0.5rem', borderRight: '1px solid #444' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#a0a0a0' }}>Previous</h2>
          {recentMatchDetails ? (
            <div style={{ backgroundColor: '#111', padding: '0.75rem', borderRadius: '0.25rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.5)' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>{recentMatchDetails.formattedDate}</p>
              
              {/* Vertical stacking layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Home Team Row */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0'
                }}>
                  <span style={{ 
                    fontWeight: '500',
                    color: recentMatchDetails.homeWin ? 'white' : '#a0a0a0',
                    flex: 1
                  }}>
                    {recentMatchDetails.homeTeam.shortName || recentMatchDetails.homeTeam.name}
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: recentMatchDetails.homeWin ? 'white' : '#a0a0a0',
                    fontSize: '1rem',
                    minWidth: '1.5rem',
                    textAlign: 'right'
                  }}>
                    {recentMatchDetails.homeScore}
                  </span>
                </div>
                
                {/* Away Team Row */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0'
                }}>
                  <span style={{ 
                    fontWeight: '500',
                    color: recentMatchDetails.awayWin ? 'white' : '#a0a0a0',
                    flex: 1
                  }}>
                    {recentMatchDetails.awayTeam.shortName || recentMatchDetails.awayTeam.name}
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: recentMatchDetails.awayWin ? 'white' : '#a0a0a0',
                    fontSize: '1rem',
                    minWidth: '1.5rem',
                    textAlign: 'right'
                  }}>
                    {recentMatchDetails.awayScore}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>No past results</p>
          )}
        </div>
        
        {/* Upcoming Fixture - Right Side */}
        <div style={{ width: '50%', paddingLeft: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#a0a0a0' }}>Next Fixture</h2>
          {nextMatchDetails ? (
            <div style={{ backgroundColor: '#111', padding: '0.75rem', borderRadius: '0.25rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.5)' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                {nextMatchDetails.formattedDate}
              </p>
              
              {/* Vertical stacking layout - same as past results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Home Team Row */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0'
                }}>
                  <span style={{ 
                    fontWeight: '500',
                    color: 'white',
                    flex: 1
                  }}>
                    {nextMatchDetails.homeTeam.shortName || nextMatchDetails.homeTeam.name}
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: '#777',
                    fontSize: '1rem',
                    minWidth: '1.5rem',
                    textAlign: 'right'
                  }}>
                    -
                  </span>
                </div>
                
                {/* Away Team Row */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0'
                }}>
                  <span style={{ 
                    fontWeight: '500',
                    color: 'white',
                    flex: 1
                  }}>
                    {nextMatchDetails.awayTeam.shortName || nextMatchDetails.awayTeam.name}
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: '#777',
                    fontSize: '1rem',
                    minWidth: '1.5rem',
                    textAlign: 'right'
                  }}>
                    -
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>No upcoming fixtures</p>
          )}
        </div>
      </div>
      
      {/* League Position - Compact Table showing just the team's position */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#a0a0a0' }}>League Position</h2>
        {leagueTable.length > 0 && selectedTeam ? (
          leagueTable
            .filter(standing => standing.team.name === selectedTeam)
            .map((standing) => (
              <div key={standing.position} style={{ 
                backgroundColor: '#111', // Dark background like other sections
                padding: '0.75rem', 
                borderRadius: '0.25rem', 
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.5)', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <span style={{ 
                  fontWeight: '700', 
                  marginRight: '0.75rem', 
                  fontSize: '1.25rem',
                  color: 'white' // White position number
                }}>{standing.position}</span>
                <div style={{ flex: '1' }}>
                  <p style={{ 
                    fontWeight: '500',
                    color: 'white' // White team name
                  }}>{standing.team.name}</p>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#a0a0a0' // Gray stats
                  }}>
                    P: {standing.playedGames} | W: {standing.won} | D: {standing.draw} | L: {standing.lost}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    fontWeight: '700', 
                    fontSize: '1.125rem',
                    color: 'white' // White points number
                  }}>{standing.points}</p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#a0a0a0' // Gray "points" text
                  }}>points</p>
                </div>
              </div>
            ))
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>No league position data</p>
        )}
      </div>
    </div>
  );
}
