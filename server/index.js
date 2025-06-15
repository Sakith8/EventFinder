const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Sample event data
const events = [
  {
    id: 'EVT001',
    name: 'Tech Summit 2024',
    description: 'Join industry leaders for cutting-edge technology discussions and networking opportunities.',
    date: '2024-03-15T09:00:00Z',
    location: 'San Francisco Convention Center',
    category: 'Technology',
    price: 299,
    attendees: 1250,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT002',
    name: 'Music Festival Extravaganza',
    description: 'Three days of incredible music featuring top artists from around the world.',
    date: '2024-04-20T18:00:00Z',
    location: 'Central Park, New York',
    category: 'Music',
    price: 150,
    attendees: 5000,
    rating: 4.9,
    image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT003',
    name: 'Art Exhibition: Modern Masters',
    description: 'Explore contemporary art from renowned artists in this exclusive exhibition.',
    date: '2024-03-25T10:00:00Z',
    location: 'Metropolitan Museum, NYC',
    category: 'Art',
    price: 45,
    attendees: 800,
    rating: 4.7,
    image: 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT004',
    name: 'Startup Pitch Competition',
    description: 'Watch innovative startups pitch their ideas to top investors and industry experts.',
    date: '2024-04-10T14:00:00Z',
    location: 'Silicon Valley Hub',
    category: 'Business',
    price: 75,
    attendees: 300,
    rating: 4.6,
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT005',
    name: 'Food & Wine Festival',
    description: 'Taste exquisite dishes and fine wines from world-class chefs and vintners.',
    date: '2024-05-05T12:00:00Z',
    location: 'Napa Valley',
    category: 'Food',
    price: 120,
    attendees: 600,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT006',
    name: 'AI & Machine Learning Conference',
    description: 'Deep dive into the latest AI technologies and machine learning innovations.',
    date: '2024-03-30T09:00:00Z',
    location: 'Boston Tech Center',
    category: 'Technology',
    price: 350,
    attendees: 900,
    rating: 4.9,
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT007',
    name: 'Jazz Night Live',
    description: 'An intimate evening with legendary jazz musicians in a cozy venue.',
    date: '2024-04-15T20:00:00Z',
    location: 'Blue Note, NYC',
    category: 'Music',
    price: 85,
    attendees: 200,
    rating: 4.7,
    image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT008',
    name: 'Digital Marketing Masterclass',
    description: 'Learn advanced digital marketing strategies from industry experts.',
    date: '2024-04-25T10:00:00Z',
    location: 'Chicago Business Center',
    category: 'Business',
    price: 199,
    attendees: 450,
    rating: 4.5,
    image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT009',
    name: 'Photography Workshop',
    description: 'Master the art of photography with hands-on training and expert guidance.',
    date: '2024-05-10T09:00:00Z',
    location: 'Los Angeles Studio',
    category: 'Art',
    price: 180,
    attendees: 150,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'EVT010',
    name: 'Culinary Arts Workshop',
    description: 'Learn professional cooking techniques from Michelin-starred chefs.',
    date: '2024-05-15T11:00:00Z',
    location: 'Culinary Institute, NYC',
    category: 'Food',
    price: 250,
    attendees: 80,
    rating: 4.9,
    image: 'https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

// Helper function to search events
function searchEvents(query) {
  const searchTerm = query.toLowerCase();
  return events.filter(event => 
    event.name.toLowerCase().includes(searchTerm) ||
    event.id.toLowerCase().includes(searchTerm) ||
    event.category.toLowerCase().includes(searchTerm)
  );
}

// Helper function to get similar events
function getSimilarEvents(eventId, category, limit = 5) {
  return events
    .filter(event => event.id !== eventId && event.category === category)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    events: [], 
    similarEvents: [], 
    searchQuery: '',
    hasSearched: false
  });
});

app.get('/search', async (req, res) => {
  const { q: query } = req.query;
  
  if (!query || !query.trim()) {
    return res.json({ events: [], similarEvents: [] });
  }

  try {
    const searchResults = searchEvents(query);
    let similarEvents = [];
    
    if (searchResults.length > 0) {
      similarEvents = getSimilarEvents(
        searchResults[0].id, 
        searchResults[0].category, 
        5
      );
    }

    res.json({
      events: searchResults,
      similarEvents: similarEvents
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/search', (req, res) => {
  const { query } = req.body;
  
  if (!query || !query.trim()) {
    return res.render('index', { 
      events: [], 
      similarEvents: [], 
      searchQuery: '',
      hasSearched: false
    });
  }

  try {
    const searchResults = searchEvents(query);
    let similarEvents = [];
    
    if (searchResults.length > 0) {
      similarEvents = getSimilarEvents(
        searchResults[0].id, 
        searchResults[0].category, 
        5
      );
    }

    res.render('index', {
      events: searchResults,
      similarEvents: similarEvents,
      searchQuery: query,
      hasSearched: true
    });
  } catch (error) {
    console.error('Search error:', error);
    res.render('index', { 
      events: [], 
      similarEvents: [], 
      searchQuery: query,
      hasSearched: true,
      error: 'Search failed. Please try again.'
    });
  }
});

// API endpoints for React frontend
app.get('/api/events/search', (req, res) => {
  const { q: query } = req.query;
  
  if (!query || !query.trim()) {
    return res.json([]);
  }

  const results = searchEvents(query);
  res.json(results);
});

app.get('/api/events/similar/:id/:category', (req, res) => {
  const { id, category } = req.params;
  const similar = getSimilarEvents(id, category, 5);
  res.json(similar);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});