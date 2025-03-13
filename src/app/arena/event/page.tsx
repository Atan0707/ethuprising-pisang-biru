"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppKitAccount } from "@reown/appkit/react";
import { RetroButton } from "@/components/ui/retro-button";
import { Event, getAllEvents } from "./services/eventService";

export default function EventsPage() {
  const { address, isConnected } = useAppKitAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const closeEventDetails = () => {
    setShowEventDetails(false);
  };

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
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-purple-900/70"></div>

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/arena" className="text-white hover:text-blue-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-pixel tracking-wide">Back to Arena</span>
          </Link>
           
          {/* Admin Link */}
          {isConnected && address && (
            <Link href="/arena/event/admin" className="text-white hover:text-blue-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-pixel tracking-wide">Admin Panel</span>
            </Link>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
          Community Events
        </h1>

        <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 font-retro tracking-wide uppercase">
              Event Map
            </h2>
            <p className="text-gray-300 mb-6 font-pixel tracking-wide">
              Explore and join community events happening around the Blockmon world. Connect with other trainers and participate in battles!
            </p>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center items-center py-4 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-white font-pixel">Loading events...</span>
              </div>
            )}

            {/* Interactive Map */}
            <div className="relative w-full h-[400px] bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-lg border border-white/20 overflow-hidden mb-6">
              {/* Map Background */}
              <div className="absolute inset-0 bg-[url('/images/map.webp')] bg-cover bg-center opacity-80"></div>
              
              {/* Event Markers */}
              {events.map((event) => (
                <button
                  key={event.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    event.active 
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-110 animate-pulse" 
                      : "bg-gray-700 opacity-50"
                  }`}
                  style={{ left: `${event.coordinates.x}%`, top: `${event.coordinates.y}%` }}
                  onClick={() => handleEventClick(event)}
                  disabled={!event.active}
                >
                  <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{event.name.substring(0, 2)}</span>
                  </div>
                </button>
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

            {/* Event List */}
            <h3 className="text-lg font-bold text-white mb-4 font-retro tracking-wide uppercase">
              Available Events
            </h3>
            {events.filter(event => event.active).length === 0 && !isLoading ? (
              <div className="bg-black/30 p-4 rounded-lg text-center">
                <p className="text-gray-400 font-pixel">No active events found. Check back later!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.filter(event => event.active).map((event) => (
                  <div 
                    key={event.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="h-32 bg-gradient-to-r from-blue-900/50 to-purple-900/50 relative">
                      {/* Event image */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image 
                          src={event.image}
                          alt={event.name}
                          fill
                          className="object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <span className="absolute bottom-2 left-2 text-white font-bold text-sm z-10">{event.name}</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10">
                        {event.participants}/{event.maxParticipants}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-white font-bold mb-1 font-retro tracking-wide">{event.name}</h4>
                      <p className="text-gray-300 text-sm mb-2 font-pixel tracking-wide line-clamp-2">{event.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{event.location}</span>
                        <span>{event.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {mounted && showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white font-retro tracking-wide">{selectedEvent.name}</h3>
                <button 
                  onClick={closeEventDetails}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="h-48 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <Image 
                  src={selectedEvent.image}
                  alt={selectedEvent.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-300 mb-4 font-pixel tracking-wide">{selectedEvent.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/30 p-3 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Location</h4>
                    <p className="text-white font-pixel tracking-wide">{selectedEvent.location}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Date</h4>
                    <p className="text-white font-pixel tracking-wide">{selectedEvent.date}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Participants</h4>
                    <p className="text-white font-pixel tracking-wide">{selectedEvent.participants}/{selectedEvent.maxParticipants}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Status</h4>
                    <p className="text-white font-pixel tracking-wide">{selectedEvent.active ? "Active" : "Coming Soon"}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <Link href={`/arena/event/${selectedEvent.id}`} className="block">
                  <RetroButton variant="default" size="full" className="w-full">
                    Join Event
                  </RetroButton>
                </Link>
                
                <Link href={`/arena/event/${selectedEvent.id}/participants`} className="block">
                  <RetroButton variant="blue" size="full" className="w-full">
                    View Participants
                  </RetroButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
