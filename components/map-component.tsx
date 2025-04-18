"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapComponentProps {
  onMapClick: (lat: number, lng: number) => void
  userGuess: { lat: number; lng: number } | null
  actualLocation: { lat: number; lng: number } | null
  modelGuesses: Record<string, { lat: number; lng: number }>
  models: Array<{ id: string; name: string; color: string }>
}

export default function MapComponent({
  onMapClick,
  userGuess,
  actualLocation,
  modelGuesses,
  models,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const actualMarkerRef = useRef<L.Marker | null>(null)
  const modelMarkersRef = useRef<Record<string, L.Marker>>({})

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([20, 0], 2)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current)

      // Add click handler
      mapRef.current.on("click", (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [onMapClick])

  // Update user marker when userGuess changes
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    // Add new marker if we have a guess
    if (userGuess) {
      const userIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      userMarkerRef.current = L.marker([userGuess.lat, userGuess.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindTooltip("Your Guess")
    }
  }, [userGuess])

  // Update actual location marker when it becomes available
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing marker
    if (actualMarkerRef.current) {
      actualMarkerRef.current.remove()
      actualMarkerRef.current = null
    }

    // Add new marker if we have the actual location
    if (actualLocation) {
      const actualIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      actualMarkerRef.current = L.marker([actualLocation.lat, actualLocation.lng], { icon: actualIcon })
        .addTo(mapRef.current)
        .bindTooltip("Actual Location")

      // If we have both user guess and actual location, fit bounds to include both
      if (userGuess) {
        const bounds = L.latLngBounds([userGuess.lat, userGuess.lng], [actualLocation.lat, actualLocation.lng])

        // Add model guesses to bounds
        Object.values(modelGuesses).forEach((guess) => {
          bounds.extend([guess.lat, guess.lng])
        })

        // Add some padding
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [actualLocation, userGuess, modelGuesses])

  // Update model guess markers
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing markers
    Object.values(modelMarkersRef.current).forEach((marker) => marker.remove())
    modelMarkersRef.current = {}

    // Add new markers for each model guess
    if (actualLocation) {
      models.forEach((model) => {
        const guess = modelGuesses[model.id]
        if (guess) {
          const modelIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${model.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })

          modelMarkersRef.current[model.id] = L.marker([guess.lat, guess.lng], { icon: modelIcon })
            .addTo(mapRef.current!)
            .bindTooltip(model.name)
        }
      })
    }
  }, [modelGuesses, models, actualLocation])

  return <div id="map" className="w-full h-[400px] rounded-lg" />
}
