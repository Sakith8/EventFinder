# EventFinder - AI-Powered Event Recommender

A beautiful, production-ready event recommendation system powered by AI and built with Express.js.

## Features

- 🎯 **AI-Powered Recommendations**: Get personalized event suggestions using machine learning
- 🔍 **Smart Search**: Search by event ID or name with intelligent matching
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- ⚡ **Fast Performance**: Optimized for speed with efficient backend processing
- 📱 **Mobile-First**: Fully responsive design that works on all devices
- 🎭 **Fallback Mode**: Demo data when Python ML model is unavailable

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python 3.x with your ML model
- npm or yarn

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update Python path** in `app.js`:
   ```javascript
   pythonPath: '/path/to/your/python/environment/bin/python3'
   ```

4. **Ensure your Python script** (`recommendation_model.py`) is in the root directory

5. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:3000`

## File Structure

```
event-recommender/
├── app.js                 # Main Express server
├── package.json          # Dependencies and scripts
├── views/
│   └── index.ejs         # Main template
├── public/
│   └── style.css         # Styles and animations
├── recommendation_model.py # Your Python ML model
└── README.md             # This file
```

## Usage

1. **Search for events** by entering:
   - Event ID (e.g., `bmnbu9rwetus3sze9c`)
   - Event name or keywords (e.g., `japanese`, `tech`, `music`)

2. **View recommendations** - The system will show up to 5 personalized event recommendations

3. **Explore suggestions** - Use the quick suggestion buttons for popular searches

## Customization

### Styling
- Modify `public/style.css` to customize colors, fonts, and layout
- The design uses CSS Grid and Flexbox for responsive layouts
- Includes dark mode support and accessibility features

### Backend Logic
- Update `app.js` to modify search logic or add new endpoints
- Integrate with your existing database or API
- Add authentication or user preferences

### Python Integration
- Ensure your `recommendation_model.py` returns JSON format
- Handle errors gracefully with fallback data
- Optimize timeout settings based on your model's performance

## API Endpoints

- `GET /` - Main application page
- `POST /search` - Process search requests
- `GET /api/search` - JSON API for AJAX requests

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- Lazy loading for images
- CSS animations with reduced motion support
- Optimized bundle size
- Efficient DOM manipulation
- Responsive images and layouts

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus management

## License

MIT License - feel free to use this in your projects!# EventFinder
