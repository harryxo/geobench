"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/navbar"
import dynamic from "next/dynamic"

// Import map component dynamically to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>,
})

// Sample location data
const locationQuestions = [
  {
    id: 1,
    imageUrl: "/images/location1.png",
    name: "Mount Mansfield, Vermont",
    coordinates: { lat: 44.45, lng: -72.71 },
    description: "The highest mountain in Vermont, with a distinctive ridge that resembles a human face in profile.",
  },
  {
    id: 2,
    imageUrl: "/images/location2.png",
    name: "Wilder Fields, Orinda, California",
    coordinates: { lat: 37.88, lng: -122.21 },
    description: "Sports complex near the Caldecott Tunnel in the East Bay area of California.",
  },
  // More locations would be added here
]

// Sample model data
const models = [
  { id: "gpt4o", name: "GPT-4o", color: "#10a37f" },
  { id: "claude", name: "Claude 3 Opus", color: "#7c3aed" },
  { id: "gemini", name: "Gemini 1.5 Pro", color: "#1a73e8" },
  { id: "llava", name: "LLaVA-1.5", color: "#f97316" },
]

export default function PlaygroundPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null)
  const [modelGuesses, setModelGuesses] = useState<Record<string, { lat: number; lng: number }>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const currentQuestion = locationQuestions[currentQuestionIndex]

  // Simulate model guesses when question changes
  useEffect(() => {
    if (currentQuestion) {
      const newModelGuesses: Record<string, { lat: number; lng: number }> = {}

      // Simulate different levels of accuracy for each model
      models.forEach((model) => {
        // Random offset from the actual location (more accurate models have smaller offsets)
        const accuracy = model.id === "gpt4o" ? 0.05 : model.id === "claude" ? 0.1 : model.id === "gemini" ? 0.15 : 0.2
        const latOffset = (Math.random() - 0.5) * accuracy * 2
        const lngOffset = (Math.random() - 0.5) * accuracy * 2

        newModelGuesses[model.id] = {
          lat: currentQuestion.coordinates.lat + latOffset,
          lng: currentQuestion.coordinates.lng + lngOffset,
        }
      })

      setModelGuesses(newModelGuesses)
      setUserGuess(null)
      setShowResults(false)
    }
  }, [currentQuestionIndex, currentQuestion])

  const handleMapClick = (lat: number, lng: number) => {
    setUserGuess({ lat, lng })
  }

  const handleSubmitGuess = () => {
    if (!userGuess) return

    // Calculate distance and update score
    const distance = calculateDistance(
      userGuess.lat,
      userGuess.lng,
      currentQuestion.coordinates.lat,
      currentQuestion.coordinates.lng,
    )

    // Score based on distance (closer = higher score)
    const questionScore = Math.max(0, Math.floor(100 - distance * 10))
    setScore((prevScore) => prevScore + questionScore)

    setShowResults(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < locationQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // End of questions
      alert(`Quiz complete! Your final score: ${score}`)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Haversine formula to calculate distance between coordinates in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Location Challenge</h1>
          <div className="flex items-center gap-4">
            <span className="font-medium">
              Question {currentQuestionIndex + 1}/{locationQuestions.length}
            </span>
            <span className="font-medium">Score: {score}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Image */}
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <div className="relative w-full h-[400px]">
                <Image
                  src={currentQuestion.imageUrl || "/placeholder.svg?height=400&width=600"}
                  alt="Location to guess"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-medium mb-1">Where is this location?</h2>
                <p className="text-gray-600 text-sm">Click on the map to place your guess</p>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardContent className="p-4">
              <MapComponent
                onMapClick={handleMapClick}
                userGuess={userGuess}
                actualLocation={showResults ? currentQuestion.coordinates : null}
                modelGuesses={showResults ? modelGuesses : {}}
                models={models}
              />

              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {!showResults ? (
                  <Button
                    onClick={handleSubmitGuess}
                    disabled={!userGuess}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Submit Guess
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion} className="bg-emerald-500 hover:bg-emerald-600">
                    Next Location
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {showResults && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Actual Location</h3>
                  <p className="text-sm mb-1">{currentQuestion.name}</p>
                  <p className="text-xs text-gray-600">
                    {currentQuestion.coordinates.lat.toFixed(4)}°, {currentQuestion.coordinates.lng.toFixed(4)}°
                  </p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Your Guess</h3>
                  {userGuess && (
                    <>
                      <p className="text-sm mb-1">
                        Distance:{" "}
                        {calculateDistance(
                          userGuess.lat,
                          userGuess.lng,
                          currentQuestion.coordinates.lat,
                          currentQuestion.coordinates.lng,
                        ).toFixed(1)}{" "}
                        km
                      </p>
                      <p className="text-xs text-gray-600">
                        {userGuess.lat.toFixed(4)}°, {userGuess.lng.toFixed(4)}°
                      </p>
                    </>
                  )}
                </div>

                {models.map((model) => (
                  <div key={model.id} className="p-4 rounded-lg" style={{ backgroundColor: `${model.color}15` }}>
                    <h3 className="font-medium mb-2">{model.name}</h3>
                    {modelGuesses[model.id] && (
                      <>
                        <p className="text-sm mb-1">
                          Distance:{" "}
                          {calculateDistance(
                            modelGuesses[model.id].lat,
                            modelGuesses[model.id].lng,
                            currentQuestion.coordinates.lat,
                            currentQuestion.coordinates.lng,
                          ).toFixed(1)}{" "}
                          km
                        </p>
                        <p className="text-xs text-gray-600">
                          {modelGuesses[model.id].lat.toFixed(4)}°, {modelGuesses[model.id].lng.toFixed(4)}°
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
