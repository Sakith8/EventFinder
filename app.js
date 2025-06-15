const express = require('express');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Mock events for fallback/demo purposes
const mockEvents = [
    {
        event_id: 'EVT001',
        title: 'Tech Innovation Summit 2024',
        category: 'Technology',
        city: 'San Francisco',
        dynamic_price: 299.00,
        phq_attendance: 1200,
        predicted_event_spend: 5000000
    },
    {
        event_id: 'EVT002',
        title: 'Global Music Festival',
        category: 'Music',
        city: 'New York',
        dynamic_price: 150.00,
        phq_attendance: 5000,
        predicted_event_spend: 10000000
    },
    {
        event_id: 'EVT003',
        title: 'Art & Design Expo',
        category: 'Art',
        city: 'Los Angeles',
        dynamic_price: 45.00,
        phq_attendance: 800,
        predicted_event_spend: 2000000
    },
    {
        event_id: 'EVT004',
        title: 'Japanese Cultural Festival',
        category: 'Culture',
        city: 'Seattle',
        dynamic_price: 25.00,
        phq_attendance: 600,
        predicted_event_spend: 1500000
    },
    {
        event_id: 'EVT005',
        title: 'Food & Wine Festival',
        category: 'Food',
        city: 'Napa Valley',
        dynamic_price: 120.00,
        phq_attendance: 1500,
        predicted_event_spend: 3000000
    }
];

// Routes
app.get('/', (req, res) => {
    console.log('Rendering initial index page');
    res.render('index', { 
        inputEvent: null,
        recommendations: [], 
        error: null, 
        searchQuery: '',
        hasSearched: false,
        fallbackMode: false,
        categoryHistory: {}
    });
});

app.post('/search', (req, res) => {
    const query = req.body.eventId || '';
    console.log(`Received query: ${query}, Starting search process`);
    
    if (!query.trim()) {
        return res.render('index', { 
            inputEvent: null,
            recommendations: [], 
            error: 'Please enter an event ID or keyword to search',
            searchQuery: query,
            hasSearched: true,
            fallbackMode: false,
            categoryHistory: {}
        });
    }

    const pythonPath = '/Users/sakith/Downloads/event-recommender/.venv/bin/python3';
    if (!fs.existsSync(pythonPath)) {
        console.error(`Python executable not found at ${pythonPath}`);
        const fallbackResults = mockEvents.filter(event => 
            event.event_id.toLowerCase() === query.toLowerCase() ||
            event.title.toLowerCase().includes(query.toLowerCase()) ||
            event.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        return res.render('index', { 
            inputEvent: fallbackResults.length ? fallbackResults[0] : null,
            recommendations: fallbackResults.slice(1),
            error: null,
            searchQuery: query,
            hasSearched: true,
            fallbackMode: true,
            categoryHistory: {}
        });
    }

    const options = {
        mode: 'text',
        pythonPath: pythonPath,
        pythonOptions: ['-u'],
        scriptPath: path.join(__dirname),
        args: [query],
        timeout: 10000
    };

    console.log('Initiating PythonShell run');
    const pyshell = new PythonShell('recommendation_model.py', options);
    let outputBuffer = '';

    pyshell.on('message', (message) => {
        console.log('Python message:', message);
        outputBuffer += message;
    });

    pyshell.on('error', (err) => {
        console.error('PythonShell error event:', err);
        const fallbackResults = mockEvents.filter(event => 
            event.event_id.toLowerCase() === query.toLowerCase() ||
            event.title.toLowerCase().includes(query.toLowerCase()) ||
            event.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        res.render('index', { 
            inputEvent: fallbackResults.length ? fallbackResults[0] : null,
            recommendations: fallbackResults.slice(1),
            error: 'Error executing recommendation model',
            searchQuery: query,
            hasSearched: true,
            fallbackMode: true,
            categoryHistory: {}
        });
    });

    pyshell.on('timeout', () => {
        console.error('PythonShell timeout');
        res.render('index', { 
            inputEvent: null,
            recommendations: [], 
            error: 'Request timed out. Please try again.',
            searchQuery: query,
            hasSearched: true,
            fallbackMode: false,
            categoryHistory: {}
        });
    });

    pyshell.end((err, code, signal) => {
        console.log('PythonShell process ended', { err, code, signal });
        if (err) {
            const fallbackResults = mockEvents.filter(event => 
                event.event_id.toLowerCase() === query.toLowerCase() ||
                event.title.toLowerCase().includes(query.toLowerCase()) ||
                event.category.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);
            
            res.render('index', { 
                inputEvent: fallbackResults.length ? fallbackResults[0] : null,
                recommendations: fallbackResults.slice(1),
                error: 'Error processing recommendation',
                searchQuery: query,
                hasSearched: true,
                fallbackMode: true,
                categoryHistory: {}
            });
            return;
        }
        
        console.log('Python raw output from buffer:', outputBuffer.trim());
        if (outputBuffer.trim()) {
            try {
                const result = JSON.parse(outputBuffer.trim());
                console.log('Parsed result:', result);
                if (result.error) {
                    res.render('index', { 
                        inputEvent: null,
                        recommendations: [], 
                        error: result.error,
                        searchQuery: query,
                        hasSearched: true,
                        fallbackMode: false,
                        categoryHistory: {}
                    });
                } else {
                    res.render('index', { 
                        inputEvent: result.input_event,
                        recommendations: result.recommendations.slice(0, 5),
                        error: null,
                        searchQuery: query,
                        hasSearched: true,
                        fallbackMode: false,
                        categoryHistory: result.metadata.category_history || {}
                    });
                }
            } catch (e) {
                console.error('JSON parse error:', e, 'Raw data:', outputBuffer);
                res.render('index', { 
                    inputEvent: null,
                    recommendations: [], 
                    error: 'Invalid data format from recommendation system',
                    searchQuery: query,
                    hasSearched: true,
                    fallbackMode: false,
                    categoryHistory: {}
                });
            }
        } else {
            console.log('No recommendations returned from Python');
            res.render('index', { 
                inputEvent: null,
                recommendations: [], 
                error: 'No results found for this query. Try a different event ID or keyword.',
                searchQuery: query,
                hasSearched: true,
                fallbackMode: false,
                categoryHistory: {}
            });
        }
    });

    console.log('PythonShell run initiated, awaiting end');
});

app.get('/api/search', (req, res) => {
    const query = req.query.q || '';
    const results = mockEvents.filter(event => 
        event.event_id.toLowerCase() === query.toLowerCase() ||
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    res.json(results);
});

app.listen(port, () => {
    console.log(`Event Recommender Server running at http://localhost:${port}`);
});