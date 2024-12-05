import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import * as d3 from 'd3';

const ActivityHeatmap = ({ data }) => {
  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!data || !heatmapRef.current) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    d3.select(heatmapRef.current).html('');

    const svg = d3.select(heatmapRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const hours = d3.range(24);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const x = d3.scaleBand()
      .domain(hours)
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleBand()
      .domain(days)
      .range([0, height])
      .padding(0.1);

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(data, d => d.value)])
      .interpolator(d3.interpolateBlues);

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.hour))
      .attr('y', d => y(d.day))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('rx', 2)
      .attr('ry', 2);

    const xAxis = d3.axisBottom(x)
      .tickFormat(d => `${d}:00`);
    const yAxis = d3.axisLeft(y);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g')
      .call(yAxis);

  }, [data]);

  return <div ref={heatmapRef} />;
};

// Simple Line Chart Component
const LineChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    d3.select(chartRef.current).html('');

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.views)])
      .nice()
      .range([height, 0]);

    const line = d3.line()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.views))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

  }, [data]);

  return <div ref={chartRef} />;
};

const ProfileAnalytics = ({ userId }) => {

  // Function to generate sample data
  const generateSampleData = () => ({
    weeklyActivity: [
      { day: 'Mon', count: Math.floor(Math.random() * 30) + 10 },
      { day: 'Tue', count: Math.floor(Math.random() * 30) + 15 },
      { day: 'Wed', count: Math.floor(Math.random() * 30) + 20 },
      { day: 'Thu', count: Math.floor(Math.random() * 30) + 18 },
      { day: 'Fri', count: Math.floor(Math.random() * 30) + 25 },
      { day: 'Sat', count: Math.floor(Math.random() * 30) + 12 },
      { day: 'Sun', count: Math.floor(Math.random() * 30) + 8 }
    ],
    contentTypes: {
      text: Math.floor(Math.random() * 50) + 30,
      image: Math.floor(Math.random() * 40) + 20,
      link: Math.floor(Math.random() * 30) + 10
    },
    averageResponseTime: `${(Math.random() * 4 + 1).toFixed(1)}h`,
    responseRate: `${Math.floor(Math.random() * 30) + 70}%`,
    peakHours: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 50) + 10
    }))
  });

  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    totalMessages: 0,
    totalGroups: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    totalLikes: 0,
    totalComments: 0,
    totalLikesReceived: 0,
    totalCommentsReceived: 0,
    activityPattern: [],
    peakHours: [],
    profileViews: {
      totalViews: 0,
      uniqueViewers: 0,
      viewsBySource: [],
      recentViews: []
    },
    activitySummary: [],
    viewTrend: [],
    ...generateSampleData()
  });

  const getMessageCounts = async (userId) => {
    try {
      const res = await axios.get(`/api/messages/count/${userId}`, {
        headers: {
          'x-auth-token': localStorage.getItem('token'),
        },
      });
      setAnalytics(prevAnalytics => ({
        ...prevAnalytics,
        messagesSent: res.data.messagesSent,
        messagesReceived: res.data.messagesReceived,
        totalMessages: res.data.totalMessages
      }));
    } catch (err) {
      console.error('Error fetching message counts:', err);
    }
  };
  
  const recalculateCounts = async (userId) => {
    try {
      const res = await axios.post(`/api/messages/recalculate-counts/${userId}`, null, {
        headers: {
          'x-auth-token': localStorage.getItem('token'),
        },
      });
      setAnalytics(prevAnalytics => ({
        ...prevAnalytics,
        messagesSent: res.data.messagesSent,
        messagesReceived: res.data.messagesReceived,
        totalMessages: res.data.totalMessages
      }));
    } catch (err) {
      console.error('Error recalculating counts:', err);
    }
  };

  const chartRef = useRef(null);
  // New refs for additional charts
  const activityTimelineRef = useRef(null);
  const contentDistributionRef = useRef(null);

  useEffect(() => {
    console.log('User ID from ProfileAnalytics.js:', userId);

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`/api/profileAnalytics/${userId}`, {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        });
        setAnalytics(prev => ({
          ...prev,
          ...res.data,
          // Initialize new fields if not provided by API
          weeklyActivity: res.data.weeklyActivity || prev.weeklyActivity,
          contentTypes: res.data.contentTypes || prev.contentTypes,
          averageResponseTime: res.data.averageResponseTime || prev.averageResponseTime,
          responseRate: res.data.responseRate || prev.responseRate,
          peakHours: res.data.peakHours || prev.peakHours
        }));

        await getMessageCounts(userId);
      } catch (err) {
        console.error('Error fetching analytics:', err.message);
      }
    };

    fetchAnalytics();
  }, [userId]);

  useEffect(() => {
    const fetchExtendedAnalytics = async () => {
      try {
        // Fetch activity pattern
        const activityRes = await axios.get(`/api/user-activity/pattern/${userId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
  
        // Fetch peak hours
        const peakHoursRes = await axios.get(`/api/user-activity/peak-hours/${userId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
  
        // Fetch profile view stats
        const viewsRes = await axios.get(`/api/profile-views/stats/${userId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
  
        // Fetch view trend
        const trendRes = await axios.get(`/api/profile-views/trend/${userId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
  
        setAnalytics(prev => ({
          ...prev,
          activityPattern: activityRes.data,
          peakHours: peakHoursRes.data,
          profileViews: viewsRes.data,
          viewTrend: trendRes.data
        }));
  
      } catch (err) {
        console.error('Error fetching extended analytics:', err.message);
      }
    };
  
    fetchExtendedAnalytics();
  }, [userId]);

  const engagementRate =
    analytics.totalPosts > 0
      ? (
          (analytics.totalLikesReceived + analytics.totalCommentsReceived) /
          analytics.totalPosts
        ).toFixed(2)
      : 0;

  const chartData = [
    { name: 'Total Posts', value: analytics.totalPosts },
    { name: 'Total Likes Received', value: analytics.totalLikesReceived },
    { name: 'Total Comments Received', value: analytics.totalCommentsReceived },
    { name: 'Engagement Rate', value: parseFloat(engagementRate) },
  ];

  useEffect(() => {
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(chartRef.current).html('');

    // Create the SVG element with improved styling
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up the x and y scales with padding
    const x = d3
      .scaleBand()
      .domain(chartData.map(d => d.name))
      .range([0, width])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, d => d.value) * 1.1]) // Add 10% padding to top
      .nice()
      .range([height, 0]);

    // Add gradient for bars
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1');

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#818cf8');

    // Add bars with animation and hover effects
    svg
      .selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.name))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', 'url(#bar-gradient)')
      .attr('rx', 6) // Rounded corners
      .transition()
      .duration(800)
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));

    // Add value labels on top of bars
    svg
      .selectAll('.value-label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => x(d.name) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#4b5563')
      .text(d => d.value);

    // Add styled axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    // Add and style x-axis
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#4b5563')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

    // Add and style y-axis
    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#4b5563');

    // Add grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
      .style('stroke', '#e5e7eb')
      .style('stroke-opacity', '0.3');

  }, [analytics]);

  useEffect(() => {
    if (!activityTimelineRef.current) return;

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    d3.select(activityTimelineRef.current).html('');

    const svg = d3.select(activityTimelineRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(analytics.weeklyActivity.map(d => d.day))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(analytics.weeklyActivity, d => d.count)])
      .nice()
      .range([height, 0]);

    // Add line path
    const line = d3.line()
      .x(d => x(d.day) + x.bandwidth() / 2)
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(analytics.weeklyActivity)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    svg.selectAll('.dot')
      .data(analytics.weeklyActivity)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.day) + x.bandwidth() / 2)
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', '#6366f1');

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));
  }, [analytics.weeklyActivity]);

  const stats = [
    { label: 'Posts', value: analytics.totalPosts },
    { label: 'Messages Sent', value: analytics.messagesSent || 0 },
    { label: 'Messages Received', value: analytics.messagesReceived || 0 },
    { label: 'Total Messages', value: analytics.totalMessages },
    { label: 'Groups', value: analytics.totalGroups },
    { label: 'Likes', value: analytics.totalLikes },
    { label: 'Comments', value: analytics.totalComments },
    { label: 'Notifications', value: `${analytics.unreadNotifications}/${analytics.totalNotifications}` },
    { label: 'Profile Views', value: analytics.profileViews.totalViews },
    { label: 'Unique Viewers', value: analytics.profileViews.uniqueViewers }
  ];

    // Additional stats
    const additionalStats = [
      { label: 'Avg Response Time', value: analytics.averageResponseTime },
      { label: 'Response Rate', value: analytics.responseRate }
    ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <h3 style={styles.statValue}>{stat.value}</h3>
              <p style={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* New activity timeline section */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Weekly Activity</h2>
          <div ref={activityTimelineRef} style={styles.chartContainer}></div>
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Engagement Overview</h2>
          <div ref={chartRef} style={styles.chartContainer}></div>
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Activity Pattern</h2>
          <div style={styles.chartContainer}>
            <ActivityHeatmap data={analytics.activityPattern} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Profile Views Trend</h2>
          <div style={styles.chartContainer}>
            <LineChart data={analytics.viewTrend.map(item => ({
              date: item._id,
              views: item.count
            }))} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Views by Source</h2>
          <div style={styles.sourceGrid}>
            {analytics.profileViews.viewsBySource.map((source, index) => (
              <div key={index} style={styles.sourceCard}>
                <h3 style={styles.sourceLabel}>{source._id}</h3>
                <p style={styles.sourceValue}>{source.count} views</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Recent Profile Visitors</h2>
          <div style={styles.visitorsList}>
            {analytics.profileViews.recentViews.map((view, index) => (
              <div key={index} style={styles.visitorCard}>
                <img 
                  src={view.viewerId.avatar} 
                  alt={view.viewerId.name}
                  style={styles.visitorAvatar}
                />
                <div style={styles.visitorInfo}>
                  <h4>{view.viewerId.name}</h4>
                  <p>{new Date(view.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional stats */}
        <div style={styles.statsGrid}>
          {additionalStats.map((stat, index) => (
            <div key={index} style={{...styles.statCard, backgroundColor: '#f8fafc'}}>
              <h3 style={styles.statValue}>{stat.value}</h3>
              <p style={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '150px',
    padding: '24px',
    backgroundColor: '#f3f4f6',
    minHeight: 'calc(100vh - 150px)',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    border: '1px solid rgba(229, 231, 235, 1)',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(229, 231, 235, 1)',
  },
  chartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '20px',
    padding: '0 16px',
  },
  chartContainer: {
    width: '100%',
    overflowX: 'auto',
    padding: '16px',
  },
  activityChart: {
    marginTop: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(229, 231, 235, 1)',
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    padding: '20px',
  },
  sourceCard: {
    backgroundColor: '#f3f4f6',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  sourceLabel: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '5px',
  },
  sourceValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  visitorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '15px',
  },
  visitorCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  visitorAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '15px',
  },
  visitorInfo: {
    flex: 1,
  }
};

// Redux connection remains unchanged
const mapStateToProps = (state) => {
  console.log('Current Redux State:', state);
  return {
    userId: state.auth.user._id,
  };
};

export default connect(mapStateToProps)(ProfileAnalytics);