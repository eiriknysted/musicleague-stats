import { useState, useEffect } from 'react'
import './App.css'

function RankingsChart({ history, competitors }) {
  const width = 1000
  const height = 500
  const padding = { top: 40, right: 150, bottom: 60, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Generate colors for each competitor
  const colors = [
    '#646cff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#fd79a8', '#fdcb6e', '#00b894', '#e17055',
    '#a29bfe', '#fab1a0'
  ]

  // Get competitor color
  const getCompetitorColor = (competitorId) => {
    const index = competitors.findIndex(c => c.id === competitorId)
    return colors[index % colors.length]
  }

  // Build line data for each competitor
  const lines = competitors.map(competitor => {
    const points = history.map((round, index) => {
      const standing = round.standings.find(s => s.id === competitor.id)
      return {
        x: padding.left + (index / (history.length - 1)) * chartWidth,
        y: padding.top + ((standing?.rank || competitors.length) - 1) / (competitors.length - 1) * chartHeight,
        rank: standing?.rank || competitors.length,
        roundName: round.roundName
      }
    })
    return {
      competitor,
      points,
      color: getCompetitorColor(competitor.id)
    }
  })

  return (
    <div className="rankings-chart">
      <svg width={width} height={height}>
        {/* Grid lines */}
        {competitors.map((_, index) => (
          <line
            key={`grid-${index}`}
            x1={padding.left}
            y1={padding.top + (index / (competitors.length - 1)) * chartHeight}
            x2={width - padding.right}
            y2={padding.top + (index / (competitors.length - 1)) * chartHeight}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels (ranks) */}
        {competitors.map((_, index) => (
          <text
            key={`rank-${index}`}
            x={padding.left - 10}
            y={padding.top + (index / (competitors.length - 1)) * chartHeight + 5}
            fill="rgba(255,255,255,0.7)"
            fontSize="12"
            textAnchor="end"
          >
            {index + 1}
          </text>
        ))}

        {/* X-axis labels (rounds) */}
        {history.map((round, index) => (
          <g key={`round-label-${index}`}>
            <line
              x1={padding.left + (index / (history.length - 1)) * chartWidth}
              y1={height - padding.bottom}
              x2={padding.left + (index / (history.length - 1)) * chartWidth}
              y2={height - padding.bottom + 5}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
            />
            <text
              x={padding.left + (index / (history.length - 1)) * chartWidth}
              y={height - padding.bottom + 20}
              fill="rgba(255,255,255,0.7)"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(-45, ${padding.left + (index / (history.length - 1)) * chartWidth}, ${height - padding.bottom + 20})`}
            >
              {(round.roundName || 'Round ' + (index + 1)).substring(0, 15)}
            </text>
          </g>
        ))}

        {/* Lines for each competitor */}
        {lines.map(({ competitor, points, color }) => (
          <g key={competitor.id}>
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2"
              opacity="0.8"
            />
            {/* Dots at each point */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={color}
                opacity="0.9"
              >
                <title>{`${competitor.name} - Round ${index + 1}: Rank ${point.rank}`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* Legend */}
        {competitors.map((competitor, index) => (
          <g key={`legend-${competitor.id}`}>
            <line
              x1={width - padding.right + 10}
              y1={padding.top + index * 20}
              x2={width - padding.right + 30}
              y2={padding.top + index * 20}
              stroke={getCompetitorColor(competitor.id)}
              strokeWidth="2"
            />
            <text
              x={width - padding.right + 35}
              y={padding.top + index * 20 + 5}
              fill="rgba(255,255,255,0.9)"
              fontSize="12"
            >
              {competitor.name}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={padding.left - 35}
          y={height / 2}
          fill="rgba(255,255,255,0.7)"
          fontSize="14"
          textAnchor="middle"
          transform={`rotate(-90, ${padding.left - 35}, ${height / 2})`}
        >
          Rank
        </text>
        <text
          x={width / 2}
          y={height - 5}
          fill="rgba(255,255,255,0.7)"
          fontSize="14"
          textAnchor="middle"
        >
          Rounds
        </text>
      </svg>
    </div>
  )
}

function App() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalRounds: 0, totalVotes: 0 })
  const [rankingsHistory, setRankingsHistory] = useState([])
  const [rounds, setRounds] = useState([])
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [votingPatterns, setVotingPatterns] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load all CSV files
      const [competitorsData, votesData, submissionsData, roundsData] = await Promise.all([
        fetch('/assets/competitors.csv').then(r => r.text()),
        fetch('/assets/votes.csv').then(r => r.text()),
        fetch('/assets/submissions.csv').then(r => r.text()),
        fetch('/assets/rounds.csv').then(r => r.text())
      ])

      // Parse competitors
      const competitors = parseCSV(competitorsData)
      const competitorMap = new Map(
        competitors.slice(1).map(row => [row[0], row[1]])
      )

      // Parse votes
      const votes = parseCSV(votesData)
      
      // Parse submissions
      const submissions = parseCSV(submissionsData)
      const submissionMap = new Map(
        submissions.slice(1).map(row => [row[0], { submitterId: row[4], roundId: row[7] }]) // Map Spotify URI to submitter and round
      )

      // Build a set of competitors who have submitted at least one song
      const competitorsWithSubmissions = new Set()
      submissions.slice(1).forEach(row => {
        const submitterId = row[4]
        if (submitterId) {
          competitorsWithSubmissions.add(submitterId)
        }
      })

      // Build a map of who submitted in each round
      const submittersPerRound = new Map()
      submissions.slice(1).forEach(row => {
        const submitterId = row[4]
        const roundId = row[7]
        
        if (submitterId && roundId) {
          if (!submittersPerRound.has(roundId)) {
            submittersPerRound.set(roundId, new Set())
          }
          submittersPerRound.get(roundId).add(submitterId)
        }
      })

      // Build a set of who voted in each round
      const votersPerRound = new Map()
      votes.slice(1).forEach(row => {
        const voterId = row[1]
        const roundId = row[5]
        
        if (!votersPerRound.has(roundId)) {
          votersPerRound.set(roundId, new Set())
        }
        votersPerRound.get(roundId).add(voterId)
      })

      // Calculate points for each competitor
      const pointsMap = new Map()
      
      // Track who voted for whom (voter -> recipient -> points)
      const votesGiven = new Map() // who each person voted for
      const votesReceived = new Map() // who voted for each person
      
      // Initialize all competitors who have submitted songs
      competitorMap.forEach((name, id) => {
        if (competitorsWithSubmissions.has(id)) {
          pointsMap.set(id, 0)
          votesGiven.set(id, new Map())
          votesReceived.set(id, new Map())
        }
      })

      // Count votes (skip header row)
      // Only award points if the submitter voted in that round
      let totalVotes = 0
      const fivePointerCount = new Map() // Track who gave the most 5-pointers
      
      competitorMap.forEach((name, id) => {
        if (competitorsWithSubmissions.has(id)) {
          fivePointerCount.set(id, 0)
        }
      })
      
      votes.slice(1).forEach(row => {
        const spotifyUri = row[0]
        const voterId = row[1]
        const pointsAssigned = parseInt(row[3]) || 0
        const submissionData = submissionMap.get(spotifyUri)
        
        // Track 5-pointers
        if (pointsAssigned === 5 && fivePointerCount.has(voterId)) {
          fivePointerCount.set(voterId, fivePointerCount.get(voterId) + 1)
        }
        
        if (submissionData) {
          const { submitterId, roundId } = submissionData
          const roundVoters = votersPerRound.get(roundId) || new Set()
          
          // Only award points if the submitter voted in this round
          if (pointsMap.has(submitterId) && roundVoters.has(submitterId)) {
            pointsMap.set(submitterId, pointsMap.get(submitterId) + pointsAssigned)
            totalVotes++
          }

          // Track voting patterns (regardless of whether points were awarded)
          if (voterId && submitterId && voterId !== submitterId) {
            // Track who this voter gave points to
            const givenMap = votesGiven.get(voterId) || new Map()
            givenMap.set(submitterId, (givenMap.get(submitterId) || 0) + pointsAssigned)
            votesGiven.set(voterId, givenMap)

            // Track who gave points to this submitter
            const receivedMap = votesReceived.get(submitterId) || new Map()
            receivedMap.set(voterId, (receivedMap.get(voterId) || 0) + pointsAssigned)
            votesReceived.set(submitterId, receivedMap)
          }
        }
      })

      // Find most voted for and most received from for each competitor
      const findTopVoter = (votesMap) => {
        if (!votesMap || votesMap.size === 0) return null
        let maxVotes = 0
        let topVoterId = null
        votesMap.forEach((points, voterId) => {
          if (points > maxVotes) {
            maxVotes = points
            topVoterId = voterId
          }
        })
        return topVoterId ? { id: topVoterId, points: maxVotes } : null
      }

      // Find least support from (lowest non-zero points received)
      const findLeastSupporter = (votesMap) => {
        if (!votesMap || votesMap.size === 0) return null
        let minVotes = Infinity
        let leastVoterId = null
        votesMap.forEach((points, voterId) => {
          if (points > 0 && points < minVotes) {
            minVotes = points
            leastVoterId = voterId
          }
        })
        return leastVoterId ? { id: leastVoterId, points: minVotes } : null
      }

      // Create leaderboard array
      const leaderboardData = Array.from(pointsMap.entries())
        .map(([id, points]) => {
          const mostVotedFor = findTopVoter(votesGiven.get(id))
          const mostReceivedFrom = findTopVoter(votesReceived.get(id))
          const leastReceivedFrom = findLeastSupporter(votesReceived.get(id))
          
          return {
            id,
            name: competitorMap.get(id) || 'Unknown',
            points,
            mostVotedFor: mostVotedFor ? {
              name: competitorMap.get(mostVotedFor.id) || 'Unknown',
              points: mostVotedFor.points
            } : null,
            mostReceivedFrom: mostReceivedFrom ? {
              name: competitorMap.get(mostReceivedFrom.id) || 'Unknown',
              points: mostReceivedFrom.points
            } : null,
            leastReceivedFrom: leastReceivedFrom ? {
              name: competitorMap.get(leastReceivedFrom.id) || 'Unknown',
              points: leastReceivedFrom.points
            } : null
          }
        })
        .sort((a, b) => b.points - a.points)

      // Parse rounds for stats
      const rounds = parseCSV(roundsData)
      const roundsList = rounds.slice(1).map(row => ({
        id: row[0],
        name: row[2]
      }))

      // Calculate rankings after each round
      const history = calculateRankingsHistory(
        roundsList,
        votes.slice(1),
        submissionMap,
        submittersPerRound,
        votersPerRound,
        competitorsWithSubmissions,
        competitorMap
      )
      
      // Build voting patterns data
      const votingPatternsData = Array.from(fivePointerCount.entries())
        .map(([id, count]) => ({
          id,
          name: competitorMap.get(id) || 'Unknown',
          fivePointers: count
        }))
        .sort((a, b) => b.fivePointers - a.fivePointers)
      
      // Calculate performance metrics - top 3 finishes in individual rounds
      const top3Count = new Map()
      competitorsWithSubmissions.forEach(id => {
        top3Count.set(id, 0)
      })
      
      // For each round, calculate who placed top 3 based on points earned in THAT round only
      roundsList.forEach(round => {
        // Calculate points for this round only
        const roundPoints = new Map()
        const roundVoters = votersPerRound.get(round.id) || new Set()
        const roundSubmitters = submittersPerRound.get(round.id) || new Set()
        
        // Initialize points for participants in this round
        roundSubmitters.forEach(submitterId => {
          if (roundVoters.has(submitterId)) {
            roundPoints.set(submitterId, 0)
          }
        })
        
        // Calculate points for this round
        votes.slice(1).forEach(row => {
          const spotifyUri = row[0]
          const pointsAssigned = parseInt(row[3]) || 0
          const roundId = row[5]
          
          if (roundId === round.id) {
            const submissionData = submissionMap.get(spotifyUri)
            
            if (submissionData) {
              const { submitterId } = submissionData
              
              // Only award points if the submitter voted in this round
              if (roundPoints.has(submitterId) && roundVoters.has(submitterId)) {
                roundPoints.set(submitterId, roundPoints.get(submitterId) + pointsAssigned)
              }
            }
          }
        })
        
        // Rank competitors for this round and count top 3
        const roundStandings = Array.from(roundPoints.entries())
          .map(([id, points]) => ({ id, points }))
          .sort((a, b) => b.points - a.points)
          .map((competitor, index) => ({
            ...competitor,
            rank: index + 1
          }))
        
        // Count top 3 finishes
        roundStandings.forEach(competitor => {
          if (competitor.rank <= 3) {
            top3Count.set(competitor.id, (top3Count.get(competitor.id) || 0) + 1)
          }
        })
      })
      
      const performanceMetricsData = Array.from(top3Count.entries())
        .map(([id, count]) => ({
          id,
          name: competitorMap.get(id) || 'Unknown',
          top3Finishes: count
        }))
        .sort((a, b) => b.top3Finishes - a.top3Finishes)
      
      setLeaderboard(leaderboardData)
      setRankingsHistory(history)
      setRounds(roundsList)
      setVotingPatterns(votingPatternsData)
      setPerformanceMetrics(performanceMetricsData)
      setStats({
        totalRounds: rounds.length - 1, // Subtract header
        totalVotes
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  function parseCSV(text) {
    const rows = []
    let currentRow = []
    let currentField = ''
    let inQuotes = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\n' && !inQuotes) {
        // End of row
        currentRow.push(currentField.trim())
        if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
        currentField = ''
      } else if (char === '\r' && !inQuotes) {
        // Skip carriage return
        continue
      } else {
        currentField += char
      }
    }
    
    // Add last field and row
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim())
      if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
        rows.push(currentRow)
      }
    }
    
    return rows
  }

  function calculateRankingsHistory(roundsList, votes, submissionMap, submittersPerRound, votersPerRound, competitorsWithSubmissions, competitorMap) {
    const history = []
    
    // Initialize cumulative points for each competitor
    const cumulativePoints = new Map()
    competitorsWithSubmissions.forEach(id => {
      cumulativePoints.set(id, 0)
    })
    
    // Track which competitors have participated in at least one round so far
    const hasParticipated = new Set()

    // Process each round
    roundsList.forEach((round, roundIndex) => {
      // Track who participated in this round (submitted AND voted)
      const roundVoters = votersPerRound.get(round.id) || new Set()
      const roundSubmitters = submittersPerRound.get(round.id) || new Set()
      
      // A participant must have both submitted AND voted
      roundSubmitters.forEach(submitterId => {
        if (roundVoters.has(submitterId)) {
          hasParticipated.add(submitterId)
        }
      })
      
      // Add points from this round
      votes.forEach(row => {
        const spotifyUri = row[0]
        const pointsAssigned = parseInt(row[3]) || 0
        const roundId = row[5]
        
        if (roundId === round.id) {
          const submissionData = submissionMap.get(spotifyUri)
          
          if (submissionData) {
            const { submitterId, roundId: subRoundId } = submissionData
            
            // Only award points if the submitter voted in this round
            if (cumulativePoints.has(submitterId) && roundVoters.has(submitterId)) {
              cumulativePoints.set(submitterId, cumulativePoints.get(submitterId) + pointsAssigned)
            }
          }
        }
      })

      // Calculate rankings for this round - include everyone who has participated in any round so far
      const standings = Array.from(cumulativePoints.entries())
        .filter(([id]) => hasParticipated.has(id))
        .map(([id, points]) => ({
          id,
          name: competitorMap.get(id) || 'Unknown',
          points
        }))
        .sort((a, b) => b.points - a.points)
        .map((competitor, index) => ({
          ...competitor,
          rank: index + 1
        }))

      history.push({
        roundIndex,
        roundName: round.name,
        standings
      })
    })

    return history
  }

  if (loading) {
    return <div className="loading">Loading statistics...</div>
  }

  return (
    <div>
      <h1>🎵 Music League Statistics</h1>
      
      <div className="stats-summary">
        <div className="stat-card">
          <h3>Total Rounds</h3>
          <p>{stats.totalRounds}</p>
        </div>
        <div className="stat-card">
          <h3>Total Votes</h3>
          <p>{stats.totalVotes}</p>
        </div>
        <div className="stat-card">
          <h3>Competitors</h3>
          <p>{leaderboard.length}</p>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button 
          className={`tab ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          Rankings Over Time
        </button>
        <button 
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Metrics
        </button>
        <button 
          className={`tab ${activeTab === 'voting' ? 'active' : ''}`}
          onClick={() => setActiveTab('voting')}
        >
          Voting Patterns
        </button>
      </div>

      {activeTab === 'rankings' && rankingsHistory.length > 0 && (
        <div className="rankings-chart-section">
          <h2>Rankings Over Time</h2>
          <RankingsChart history={rankingsHistory} competitors={leaderboard} />
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="performance-metrics-section">
          <h2>Performance Metrics</h2>
          
          <div className="pattern-section">
            <h3>Top 3 Finishes</h3>
            <p className="section-description">Number of times each competitor placed in the top 3</p>
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="rank">Rank</th>
                  <th>Competitor</th>
                  <th className="stat-value">Top 3 Finishes</th>
                </tr>
              </thead>
              <tbody>
                {performanceMetrics.map((competitor, index) => (
                  <tr key={competitor.id}>
                    <td className={`rank rank-${index + 1}`}>
                      {index + 1}
                    </td>
                    <td className="competitor-name">{competitor.name}</td>
                    <td className="stat-value">{competitor.top3Finishes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'voting' && (
        <div className="voting-patterns-section">
          <h2>Voting Patterns</h2>
          
          <div className="pattern-section">
            <h3>Most 5-Pointers Given</h3>
            <p className="section-description">Who's most generous with their top votes?</p>
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="rank">Rank</th>
                  <th>Competitor</th>
                  <th className="stat-value">5-Pointers Given</th>
                </tr>
              </thead>
              <tbody>
                {votingPatterns.map((competitor, index) => (
                  <tr key={competitor.id}>
                    <td className={`rank rank-${index + 1}`}>
                      {index + 1}
                    </td>
                    <td className="competitor-name">{competitor.name}</td>
                    <td className="stat-value">{competitor.fivePointers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard">
        <h2>Leaderboard</h2>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank">Rank</th>
              <th>Competitor</th>
              <th className="points">Total Points</th>
              <th className="voting-stats">Most Voted For</th>
              <th className="voting-stats">Most Support From</th>
              <th className="voting-stats">Least Support From</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((competitor, index) => (
              <tr key={competitor.id}>
                <td className={`rank rank-${index + 1}`}>
                  {index + 1}
                </td>
                <td className="competitor-name">{competitor.name}</td>
                <td className="points">{competitor.points}</td>
                <td className="voting-detail">
                  {competitor.mostVotedFor ? (
                    <>
                      <span className="voter-name">{competitor.mostVotedFor.name}</span>
                      <span className="vote-count">({competitor.mostVotedFor.points} pts)</span>
                    </>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>
                <td className="voting-detail">
                  {competitor.mostReceivedFrom ? (
                    <>
                      <span className="voter-name">{competitor.mostReceivedFrom.name}</span>
                      <span className="vote-count">({competitor.mostReceivedFrom.points} pts)</span>
                    </>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>
                <td className="voting-detail">
                  {competitor.leastReceivedFrom ? (
                    <>
                      <span className="voter-name">{competitor.leastReceivedFrom.name}</span>
                      <span className="vote-count">({competitor.leastReceivedFrom.points} pts)</span>
                    </>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

export default App
