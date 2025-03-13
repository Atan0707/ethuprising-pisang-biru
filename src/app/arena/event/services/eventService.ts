// Define event interface
export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  participants: number;
  maxParticipants: number;
  image: string;
  coordinates: {
    x: number;
    y: number;
  };
  active: boolean;
}

// Sample event data
const EVENTS: Event[] = [
  {
    id: "eth-uprising",
    name: "ETH Uprising Hackathon",
    description: "Join the biggest blockchain gaming hackathon and showcase your Blockmon!",
    location: "Virtual + Singapore",
    date: "March 15-17, 2024",
    participants: 128,
    maxParticipants: 200,
    image: "/images/events/hack.jpg",
    coordinates: { x: 35, y: 25 },
    active: true
  },
  {
    id: "pixel-masters",
    name: "Pixel Masters Tournament",
    description: "Weekly tournament for Blockmon trainers to compete and win exclusive rewards.",
    location: "Virtual",
    date: "Every Saturday",
    participants: 64,
    maxParticipants: 64,
    image: "/images/pika.png",
    coordinates: { x: 65, y: 40 },
    active: true
  },
  {
    id: "community-meetup",
    name: "Blockmon Community Meetup",
    description: "Meet other Blockmon trainers in your area and battle in person!",
    location: "Multiple Locations",
    date: "Monthly",
    participants: 45,
    maxParticipants: 100,
    image: "/images/charizard.png",
    coordinates: { x: 20, y: 60 },
    active: true
  },
  {
    id: "championship",
    name: "Blockmon Championship",
    description: "The ultimate test for the best Blockmon trainers. Compete for the title!",
    location: "Virtual",
    date: "Coming Soon",
    participants: 0,
    maxParticipants: 32,
    image: "/images/charmander.png",
    coordinates: { x: 75, y: 70 },
    active: false
  }
];

// Available images for events
export const AVAILABLE_IMAGES = [
  { path: "/images/events/hack.jpg", name: "Hackathon" },
  { path: "/images/pika.png", name: "Pikachu" },
  { path: "/images/charizard.png", name: "Charizard" },
  { path: "/images/charmander.png", name: "Charmander" },
  { path: "/images/map.webp", name: "Map" },
  { path: "/images/back.jpg", name: "Background" }
];

// In a real application, these functions would make API calls
// For this demo, we're using localStorage to persist data between page refreshes

// Helper to initialize localStorage with default events if empty
const initializeEvents = () => {
  if (typeof window !== 'undefined') {
    const storedEvents = localStorage.getItem('blockmon_events');
    if (!storedEvents) {
      localStorage.setItem('blockmon_events', JSON.stringify(EVENTS));
    }
  }
};

// Get all events
export const getAllEvents = (): Promise<Event[]> => {
  initializeEvents();
  
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      const events = JSON.parse(localStorage.getItem('blockmon_events') || JSON.stringify(EVENTS));
      resolve(events);
    } else {
      resolve(EVENTS);
    }
  });
};

// Get event by ID
export const getEventById = (id: string): Promise<Event | null> => {
  return new Promise((resolve) => {
    getAllEvents().then(events => {
      const event = events.find(e => e.id === id) || null;
      resolve(event);
    });
  });
};

// Create new event
export const createEvent = (event: Event): Promise<Event> => {
  return new Promise((resolve) => {
    getAllEvents().then(events => {
      // Generate slug-like ID if not provided
      if (!event.id) {
        event.id = event.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      
      const newEvents = [...events, event];
      if (typeof window !== 'undefined') {
        localStorage.setItem('blockmon_events', JSON.stringify(newEvents));
      }
      resolve(event);
    });
  });
};

// Update event
export const updateEvent = (event: Event): Promise<Event> => {
  return new Promise((resolve) => {
    getAllEvents().then(events => {
      const newEvents = events.map(e => e.id === event.id ? event : e);
      if (typeof window !== 'undefined') {
        localStorage.setItem('blockmon_events', JSON.stringify(newEvents));
      }
      resolve(event);
    });
  });
};

// Delete event
export const deleteEvent = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    getAllEvents().then(events => {
      const newEvents = events.filter(e => e.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('blockmon_events', JSON.stringify(newEvents));
      }
      resolve(true);
    });
  });
}; 