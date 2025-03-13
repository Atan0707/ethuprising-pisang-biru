"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppKitAccount } from "@reown/appkit/react";
import { RetroButton } from "@/components/ui/retro-button";
import { 
  Event, 
  AVAILABLE_IMAGES, 
  getAllEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from "../services/eventService";

export default function EventAdminPage() {
  const { address, isConnected } = useAppKitAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Event>({
    id: "",
    name: "",
    description: "",
    location: "",
    date: "",
    participants: 0,
    maxParticipants: 0,
    image: AVAILABLE_IMAGES[0].path,
    coordinates: { x: 50, y: 50 },
    active: true
  });

  // Fetch events on component mount
  useEffect(() => {
    setMounted(true);
    loadEvents();
  }, []);

  // Load events from service
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const eventData = await getAllEvents();
      setEvents(eventData);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin authentication check (simplified for demo)
  const isAdmin = isConnected && address; // In a real app, you would check if the address is an admin

  const handleEditEvent = (event: Event) => {
    setFormData(event);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreateEvent = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      location: "",
      date: "",
      participants: 0,
      maxParticipants: 100,
      image: AVAILABLE_IMAGES[0].path,
      coordinates: { x: 50, y: 50 },
      active: true
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setIsLoading(true);
      try {
        await deleteEvent(eventId);
        await loadEvents(); // Reload events after deletion
      } catch (error) {
        console.error("Failed to delete event:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "x" || name === "y") {
      setFormData({
        ...formData,
        coordinates: {
          ...formData.coordinates,
          [name]: parseInt(value)
        }
      });
    } else if (name === "participants" || name === "maxParticipants") {
      setFormData({
        ...formData,
        [name]: parseInt(value)
      });
    } else if (name === "active") {
      setFormData({
        ...formData,
        active: value === "true"
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate form
    if (!formData.name || !formData.description || !formData.location || !formData.date) {
      setFormError("All fields are required");
      return;
    }

    setIsLoading(true);
    try {
      // Generate slug-like ID if creating a new event
      if (isCreating) {
        formData.id = formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }

      if (isEditing) {
        await updateEvent(formData);
      } else {
        await createEvent(formData);
      }

      // Reload events after update
      await loadEvents();

      // Reset form
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to save event:", error);
      setFormError("Failed to save event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelForm = () => {
    setIsEditing(false);
    setIsCreating(false);
    setFormError("");
  };

  if (!mounted) return null;

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="relative min-h-screen">
        {/* Background image - positioned to respect navbar */}
        <div
          className="fixed inset-0 top-16 -z-10"
          style={{
            backgroundImage: "url('/images/back.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-purple-900/70"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/arena/event" className="text-white hover:text-blue-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-pixel tracking-wide">Back to Events</span>
            </Link>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 p-8 text-center">
            <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
              Access Denied
            </h1>
            <p className="text-gray-300 mb-6 font-pixel tracking-wide">
              You need to connect your wallet and have admin privileges to access this page.
            </p>
            <RetroButton variant="default" size="default">
              Connect Wallet
            </RetroButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image - positioned to respect navbar */}
      <div
        className="fixed inset-0 top-16 -z-10"
        style={{
          backgroundImage: "url('/images/back.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-purple-900/70"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/arena/event" className="text-white hover:text-blue-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-pixel tracking-wide">Back to Events</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
          Event Administration
        </h1>

        {/* Admin Dashboard */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white font-retro tracking-wide uppercase">
                Manage Events
              </h2>
              <RetroButton variant="blue" size="default" onClick={handleCreateEvent} disabled={isLoading}>
                Create New Event
              </RetroButton>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-white font-pixel">Loading...</span>
              </div>
            )}

            {/* Event Form (Edit/Create) */}
            {(isEditing || isCreating) && (
              <div className="bg-black/60 rounded-lg p-6 mb-8 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 font-retro tracking-wide uppercase">
                  {isEditing ? "Edit Event" : "Create New Event"}
                </h3>
                
                {formError && (
                  <div className="bg-red-900/50 text-red-200 p-3 rounded-lg mb-4 font-pixel">
                    {formError}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Event Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Date</label>
                      <input
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={handleFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Current Participants</label>
                      <input
                        type="number"
                        name="participants"
                        value={formData.participants}
                        onChange={handleFormChange}
                        min="0"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Max Participants</label>
                      <input
                        type="number"
                        name="maxParticipants"
                        value={formData.maxParticipants}
                        onChange={handleFormChange}
                        min="1"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Event Image</label>
                      <select
                        name="image"
                        value={formData.image}
                        onChange={handleFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      >
                        {AVAILABLE_IMAGES.map((img) => (
                          <option key={img.path} value={img.path}>
                            {img.name}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 h-20 w-20 relative">
                        <Image
                          src={formData.image}
                          alt="Event image preview"
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-1 font-pixel">Map X Position (%)</label>
                        <input
                          type="number"
                          name="x"
                          value={formData.coordinates.x}
                          onChange={handleFormChange}
                          min="0"
                          max="100"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1 font-pixel">Map Y Position (%)</label>
                        <input
                          type="number"
                          name="y"
                          value={formData.coordinates.y}
                          onChange={handleFormChange}
                          min="0"
                          max="100"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1 font-pixel">Status</label>
                      <select
                        name="active"
                        value={formData.active.toString()}
                        onChange={handleFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-pixel"
                        disabled={isLoading}
                      >
                        <option value="true">Active</option>
                        <option value="false">Coming Soon</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="col-span-1 md:col-span-2 flex gap-4 mt-4">
                    <RetroButton variant="default" size="default" type="submit" disabled={isLoading}>
                      {isEditing ? "Update Event" : "Create Event"}
                    </RetroButton>
                    <RetroButton variant="purple" size="default" type="button" onClick={cancelForm} disabled={isLoading}>
                      Cancel
                    </RetroButton>
                  </div>
                </form>
              </div>
            )}

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-black/50 text-left">
                    <th className="p-3 font-retro text-white">Event</th>
                    <th className="p-3 font-retro text-white">Location</th>
                    <th className="p-3 font-retro text-white">Date</th>
                    <th className="p-3 font-retro text-white">Participants</th>
                    <th className="p-3 font-retro text-white">Status</th>
                    <th className="p-3 font-retro text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-400 font-pixel">
                        No events found. Create your first event!
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event.id} className="border-b border-gray-800 hover:bg-black/30">
                        <td className="p-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 relative mr-3">
                              <Image
                                src={event.image}
                                alt={event.name}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                            <span className="font-pixel text-white">{event.name}</span>
                          </div>
                        </td>
                        <td className="p-3 font-pixel text-gray-300">{event.location}</td>
                        <td className="p-3 font-pixel text-gray-300">{event.date}</td>
                        <td className="p-3 font-pixel text-gray-300">
                          {event.participants}/{event.maxParticipants}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-pixel ${
                            event.active ? "bg-green-900/50 text-green-300" : "bg-gray-800 text-gray-400"
                          }`}>
                            {event.active ? "Active" : "Coming Soon"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 px-3 py-1 rounded-md text-xs font-pixel"
                              disabled={isLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="bg-red-900/50 hover:bg-red-800 text-red-300 px-3 py-1 rounded-md text-xs font-pixel"
                              disabled={isLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 font-retro tracking-wide uppercase">
              Event Map Preview
            </h2>
            
            <div className="relative w-full h-[400px] bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-lg border border-white/20 overflow-hidden">
              {/* Map Background */}
              <div className="absolute inset-0 bg-[url('/images/map.webp')] bg-cover bg-center opacity-80"></div>
              
              {/* Event Markers */}
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center ${
                    event.active 
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                      : "bg-gray-700 opacity-50"
                  }`}
                  style={{ left: `${event.coordinates.x}%`, top: `${event.coordinates.y}%` }}
                >
                  <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{event.name.substring(0, 2)}</span>
                  </div>
                </div>
              ))}
              
              {/* Map Legend */}
              <div className="absolute bottom-2 right-2 bg-black/70 rounded-lg p-2 text-xs text-white">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mr-2"></div>
                  <span>Active Event</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-700 mr-2"></div>
                  <span>Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 