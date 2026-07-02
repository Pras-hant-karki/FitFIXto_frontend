"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import {
  BackendTrainer,
  fetchPublicTrainers,
  normalizeTrainerPhotoUrl,
} from "@/features/trainers";
import { usePreferences } from "@/contexts";

const SpecialtyTag = ({ label }: { label: string }) => (
  <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
    {label}
  </span>
);

const getTrainerName = (trainer: BackendTrainer) =>
  `${trainer.userId.firstName || ""} ${trainer.userId.lastName || ""}`.trim() || "FitFIXto Trainer";

const getTrainerPhoto = (trainer: BackendTrainer) =>
  normalizeTrainerPhotoUrl(trainer.userId.profilePicture);

const TrainerCard = ({ trainer }: { trainer: BackendTrainer }) => {
  const trainerName = getTrainerName(trainer);
  const trainerPhoto = getTrainerPhoto(trainer);
  const { formatPrice } = usePreferences();

  return (
    <Link href={`/trainers/${trainer._id}`} className="block bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="relative h-72 bg-gray-100">
        {trainerPhoto ? (
          <img src={trainerPhoto} alt={trainerName} className="w-full h-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-gray-500">
            No photo
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1">{trainerName}</h3>
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-3 h-3 mr-1" />
          {trainer.location || "Nepal"}
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">New</span>
          </div>
          <span className="text-sm text-gray-500">
            0 reviews · {trainer.experienceYears}+ yrs
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {trainer.specialties.length ? (
            trainer.specialties.slice(0, 4).map((specialty) => (
              <SpecialtyTag key={specialty} label={specialty} />
            ))
          ) : (
            <SpecialtyTag label="Personal Training" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(trainer.sessionRate)}
            </span>
            <span className="text-xs text-gray-500">/session</span>
          </div>
          <span className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<BackendTrainer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadTrainers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextTrainers = await fetchPublicTrainers();
        if (isActive) {
          setTrainers(nextTrainers.filter((trainer) => !trainer.isSuspended && trainer.userId.isActive));
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load trainers.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadTrainers();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredTrainers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return trainers;

    return trainers.filter((trainer) => {
      const trainerName = getTrainerName(trainer).toLowerCase();
      const location = (trainer.location || "").toLowerCase();
      const specialties = trainer.specialties.join(" ").toLowerCase();
      const certifications = trainer.certifications.join(" ").toLowerCase();

      return (
        trainerName.includes(query) ||
        location.includes(query) ||
        specialties.includes(query) ||
        certifications.includes(query)
      );
    });
  }, [searchQuery, trainers]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Find your trainer</h1>
          <p className="text-sm text-gray-500">Vetted coaches across Nepal, ready to help you progress.</p>
        </header>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location, specialization..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Loading trainers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{error}</p>
          </div>
        ) : filteredTrainers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainers.map((trainer) => (
              <TrainerCard key={trainer._id} trainer={trainer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No trainers found matching your search.</p>
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="mt-4 text-black font-semibold hover:underline">
                Clear search
              </button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
