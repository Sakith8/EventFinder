const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock event data
const events = [
  {
    id: 'EVT001',
    name: 'Tech Innovation Summit 2024',
    description: 'Join industry leaders and innovators for a day of cutting-edge technology discussions, networking, and breakthrough announcements.',
    date: '2024-03-15T09:00:00Z',
    location: 'Silicon Valley Convention Center',
    category: 'Technology',
    price: 299,
    attendees: 1200,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT002',
    name: 'Global Music Festival',
    description: 'Experience an unforgettable weekend of live music featuring top artists from around the world across multiple stages.',
    date: '2024-04-20T16:00:00Z',
    location: 'Central Park, New York',
    category: 'Music',
    price: 150,
    attendees: 5000,
    rating: 4.9,
    image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT003',
    name: 'Art & Design Expo',
    description: 'Discover the latest trends in contemporary art and design with exhibitions from renowned artists and emerging talents.',
    date: '2024-03-22T10:00:00Z',
    location: 'Modern Art Museum',
    category: 'Art',
    price: 45,
    attendees: 800,
    rating: 4.6,
    image: 'https://images.pexels.com/photos/1182825/pexels-photo-1182825.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT004',
    name: 'Startup Pitch Competition',
    description: 'Watch innovative startups present their groundbreaking ideas to a panel of investors and industry experts.',
    date: '2024-03-18T14:00:00Z',
    location: 'Innovation Hub Downtown',
    category: 'Business',
    price: 75,
    attendees: 600,
    rating: 4.7,
    image: 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT005',
    name: 'Food & Wine Festival',
    description: 'Indulge in exquisite culinary experiences with world-class chefs and premium wine tastings.',
    date: '2024-04-05T12:00:00Z',
    location: 'Waterfront Plaza',
    category: 'Food',
    price: 85,
    attendees: 1500,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT006',
    name: 'Digital Marketing Conference',
    description: 'Learn the latest digital marketing strategies and trends from industry experts and successful entrepreneurs.',
    date: '2024-03-25T09:30:00Z',
    location: 'Business Center',
    category: 'Technology',
    price: 199,
    attendees: 800,
    rating: 4.5,
    image: 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT007',
    name: 'Jazz Night Live',
    description: 'An intimate evening of smooth jazz performances by renowned musicians in a cozy venue.',
    date: '2024-04-12T20:00:00Z',
    location: 'Blue Note Club',
    category: 'Music',
    price: 65,
    attendees: 200,
    rating: 4.9,
    image: 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT008',
    name: 'Photography Workshop',
    description: 'Master the art of photography with hands-on workshops covering both digital and film techniques.',
    date: '2024-03-30T10:00:00Z',
    location: 'Creative Arts Studio',
    category: 'Art',
    price: 120,
    attendees: 50,
    rating: 4.7,
    image: 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT009',
    name: 'AI & Machine Learning Summit',
    description: 'Explore the future of artificial intelligence with leading researchers and industry pioneers.',
    date: '2024-05-10T09:00:00Z',
    location: 'Tech Campus, Seattle',
    category: 'Technology',
    price: 399,
    attendees: 1500,
    rating: 4.9,
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT010',
    name: 'Culinary Masterclass',
    description: 'Learn from Michelin-starred chefs in this exclusive hands-on cooking experience.',
    date: '2024-04-28T14:00:00Z',
    location: 'Culinary Institute',
    category: 'Food',
    price: 180,
    attendees: 60,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

// Helper function to search events
const searchEvents = (query) => {
  if (!query) return [];
  
  const lowerQuery = query.toLowerCase();
  return events.filter(event => 
    event.id.toLowerCase().includes(lowerQuery) || 
    event.name.toLowerCase().includes(lowerQuery) ||
    event.category.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to get similar events (top 5 only)
const getSimilarEvents = (eventId, category, limit = 5) => {
  return events
    .filter(event => event.id !== eventId && event.category === category)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    searchResults: [],
    similarEvents: [],
    searchQuery: '',
    hasSearched: false
  });
});

app.get('/search', (req, res) => {
  const query = req.query.q || '';
  const searchResults = searchEvents(query);
  let similarEvents = [];
  
  if (searchResults.length > 0) {
    similarEvents = getSimilarEvents(searchResults[0].id, searchResults[0].category);
  }
  
  res.render('index', {
    searchResults,
    similarEvents,
    searchQuery: query,
    hasSearched: true
  });
});

app.post('/search', (req, res) => {
  const query = req.body.query || '';
  const searchResults = searchEvents(query);
  let similarEvents = [];
  
  if (searchResults.length > 0) {
    similarEvents = getSimilarEvents(searchResults[0].id, searchResults[0].category);
  }
  
  res.render('index', {
    searchResults,
    similarEvents,
    searchQuery: query,
    hasSearched: true
  });
});

// API endpoints for AJAX requests
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const searchResults = searchEvents(query);
  let similarEvents = [];
  
  if (searchResults.length > 0) {
    similarEvents = getSimilarEvents(searchResults[0].id, searchResults[0].category);
  }
  
  res.json({
    searchResults,
    similarEvents
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});