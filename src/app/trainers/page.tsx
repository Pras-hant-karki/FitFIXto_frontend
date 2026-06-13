"use client";

import React, { useState } from 'react';
import { Search, SlidersHorizontal, Star, MapPin } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
interface Trainer {
  id: number;
  image: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  experience: string;
  specialties: string[];
  price: number;
}

// ─── Mock Data ───────────────────────────────────────
const TRAINERS: Trainer[] = [
  {
    id: 1,
    image: 'trainer-marcus.png',
    name: 'Marcus Reed',
    location: 'Kathmandu, NP',
    rating: 4.9,
    reviews: 218,
    experience: '12+ yrs',
    specialties: ['Strength', 'Powerlifting', 'Hypertrophy'],
    price: 65,
  },
  {
    id: 2,
    image: 'trainer-aria.png',
    name: 'Aria Sharma',
    location: 'Pokhara, NP',
    rating: 4.8,
    reviews: 164,
    experience: '8+ yrs',
    specialties: ['HIIT', 'Fat Loss', 'Mobility'],
    price: 55,
  },
  {
    id: 3,
    image: 'trainer-dev.png',
    name: 'Dev Khatri',
    location: 'Lalitpur, NP',
    rating: 4.9,
    reviews: 302,
    experience: '15+ yrs',
    specialties: ['Bodybuilding', 'Nutrition', 'Contest Prep'],
    price: 80,
  },
  {
    id: 4,
    image: 'trainer-sita.png',
    name: 'Sita Tamang',
    location: 'Bhaktapur, NP',
    rating: 4.7,
    reviews: 129,
    experience: '5+ yrs',
    specialties: ['Yoga', 'Pre/Postnatal', 'Recovery'],
    price: 45,
  },
];

// ─── Specialty Tag ───────────────────────────────────
const SpecialtyTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
    {label}
  </span>
);

// ─── Trainer Card ────────────────────────────────────
const TrainerCard: React.FC<{ trainer: Trainer }> = ({ trainer }) => (
  <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
    {/* Image */}
    <div className="relative h-72 bg-gray-100">
      <img
        src={trainer.image}
        alt={trainer.name}
        className="w-full h-full object-cover"
      />
    </div>

    {/* Content */}
    <div className="p-4">
      {/* Name & Location */}
      <h3 className="font-bold text-gray-900 text-lg mb-1">{trainer.name}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <MapPin className="w-3 h-3 mr-1" />
        {trainer.location}
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{trainer.rating}</span>
        </div>
        <span className="text-sm text-gray-500">
          ({trainer.reviews}) · {trainer.experience}
        </span>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-2 mb-4">
        {trainer.specialties.map((spec) => (
          <SpecialtyTag key={spec} label={spec} />
        ))}
      </div>

      {/* Price & Book */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-gray-900">${trainer.price}</span>
          <span className="text-xs text-gray-500">/session</span>
        </div>
        <button className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
          Book Now
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Trainers Component ─────────────────────────
const Trainers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter trainers based on search
  const filteredTrainers = TRAINERS.filter((trainer) => {
    const query = searchQuery.toLowerCase();
    return (
      trainer.name.toLowerCase().includes(query) ||
      trainer.location.toLowerCase().includes(query) ||
      trainer.specialties.some((s) => s.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Find your trainer</h1>
          <p className="text-sm text-gray-500">
            Vetted coaches across Nepal, ready to help you progress.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Trainers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>

        {filteredTrainers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No trainers found matching your search.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-black font-semibold hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trainers;
