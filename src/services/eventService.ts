const API_BASE_URL = 'http://localhost:3001/api';

export const searchEvents = async (query: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};

export const getSimilarEvents = async (eventId: string, category: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/similar/${eventId}/${category}`);
    if (!response.ok) {
      throw new Error('Failed to get similar events');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting similar events:', error);
    return [];
  }
};