"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MapPin, Loader2 } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/navbar"

// Define a type for the result, including potential errors
type ModelResult = {
  model: string;
  response: string; // Reasoning from the model
  // confidence: string; // Removed
  coordinates: { lat: number; lng: number } | null;
  // accuracy: string; // Removed placeholder
  processingTime: string; // Placeholder
  error?: string; // Optional error message
};


// Sample model data - Update Gemini entry for Vertex AI
const models = [
  { id: "gpt4o", name: "GPT-4o", color: "#10a37f" },
  { id: "claude", name: "Claude 3 Opus", color: "#7c3aed" },
  // --- Update ID and Name for Vertex Gemini ---
  { id: "vertex-gemini", name: "Vertex Gemini 2.5 Pro", color: "#4285F4" }, // Example Google Blue
  { id: "llava", name: "LLaVA-1.5", color: "#f97316" },
]

export default function ArenaPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  // --- Add state for the File object ---
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  // --- Update state type to use ModelResult ---
  const [results, setResults] = useState<Record<string, ModelResult>>({})
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt4o", "claude", "gemini"]) // Include gemini by default maybe

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // --- Store the file object ---
      setUploadedImageFile(file);
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setResults({}) // Clear previous results
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    // --- Clear the file object too ---
    setUploadedImageFile(null);
    setResults({})
  }

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels((prev) => (prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]))
  }

  // --- Make the function async ---
  const runComparison = async () => {
    // --- Check for the file object ---
    if (!uploadedImageFile || selectedModels.length === 0) return

    setIsLoading(true)
    // --- Use the ModelResult type ---
    const newResults: Record<string, ModelResult> = {}

    // --- Process selected models ---
    // Use Promise.all to run API calls concurrently in the future if needed
    // For now, handle Gemini specifically

    // --- Update the ID to match the models array ---
    const geminiModelId = "vertex-gemini";

    if (selectedModels.includes(geminiModelId)) {
      const formData = new FormData();
      formData.append("image", uploadedImageFile);
      // Optional: formData.append("modelId", geminiModelId);

      try {
        const response = await fetch('/api/geoguess', { // Call your API route
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errorMsg = `API Error: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = `API Error: ${errorData.error || response.statusText}`;
          } catch (e) { /* Ignore if response is not JSON */ }
          console.error("API Error for Gemini:", errorMsg);
          newResults[geminiModelId] = { // Store error state
              model: geminiModelId,
              response: "", coordinates: null, processingTime: "", // Default values (accuracy & confidence removed)
              error: errorMsg
          };
        } else {
          const modelResult = await response.json();
          // Store successful result, ensure structure matches ModelResult
           newResults[geminiModelId] = {
             model: modelResult.model || geminiModelId, // Use model from response or fallback
             response: modelResult.response, // Reasoning
             // confidence: modelResult.confidence || "N/A", // Removed
             coordinates: modelResult.coordinates,
             // accuracy: modelResult.accuracy || "N/A", // Removed
             processingTime: modelResult.processingTime || "N/A",
          };
        }
      } catch (error) {
        console.error("Fetch Error for Gemini:", error);
         const errorMsg = `Fetch Error: ${error instanceof Error ? error.message : String(error)}`;
         newResults[geminiModelId] = { // Store fetch error state
            model: geminiModelId,
            response: "", coordinates: null, processingTime: "", // Default values (accuracy & confidence removed)
            error: errorMsg
         };
      }
    }

    // --- Handle Other Models (Keep Dummy Data for now) ---
    if (selectedModels.includes("gpt4o") && !newResults["gpt4o"]) {
      newResults["gpt4o"] = {
        model: "gpt4o",
        response: "This appears to be a view of the Wilder sports-field complex in Orinda, California, just east of the Caldecott Tunnel...",
        // confidence: "High", // Removed
        coordinates: { lat: 37.88, lng: -122.21 },
        // accuracy: "N/A", // Removed
        processingTime: "Simulated"
      };
    }
    if (selectedModels.includes("claude") && !newResults["claude"]) {
       newResults["claude"] = {
        model: "claude",
        response: "This is the Wilder Fields sports complex in Orinda, California. The image shows multiple soccer/sports fields...",
        // confidence: "High", // Removed
        coordinates: { lat: 37.88, lng: -122.21 },
        // accuracy: "N/A", // Removed
        processingTime: "Simulated"
      };
    }
     if (selectedModels.includes("llava") && !newResults["llava"]) {
       newResults["llava"] = {
        model: "llava",
        response: "The image shows a hillside view overlooking what appears to be a sports complex with several green fields...",
        // confidence: "Medium", // Removed
        coordinates: { lat: 37.5, lng: -122 }, // Approx dummy
        // accuracy: "N/A", // Removed
        processingTime: "Simulated"
      };
    }
    // Add other dummy models if needed...

    setResults(newResults);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Model Arena</h1>
        <p className="text-gray-600 mb-8">Compare how different models identify the same location</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
              </CardHeader>
              <CardContent>
                {!uploadedImage ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => document.getElementById("arena-image-upload")?.click()}
                  >
                    <input
                      id="arena-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, WEBP (max 10MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Image
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded location"
                        width={400}
                        height={300}
                        className="rounded-lg w-full h-auto object-contain"
                      />
                      <Button variant="outline" size="sm" className="mt-2" onClick={clearImage}>
                        Clear Image
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium">Select Models to Compare</h3>
                      <div className="flex flex-wrap gap-2">
                        {models.map((model) => (
                          <Button
                            key={model.id}
                            variant={selectedModels.includes(model.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleModelSelection(model.id)}
                            style={{
                              backgroundColor: selectedModels.includes(model.id) ? model.color : "transparent",
                              color: selectedModels.includes(model.id) ? "white" : "inherit",
                              borderColor: model.color,
                            }}
                          >
                            {model.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={runComparison}
                      // --- Disable button if no file is selected ---
                      disabled={isLoading || selectedModels.length === 0 || !uploadedImageFile}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Run Comparison
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Model Responses</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(results).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {uploadedImage ? (
                      isLoading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 animate-spin mb-4" />
                          <p>Analyzing image with selected models...</p>
                        </div>
                      ) : (
                        <p>Select models and click "Run Comparison" to see results</p>
                      )
                    ) : (
                      <p>Upload an image to begin</p>
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue={selectedModels.find(id => results[id]) || Object.keys(results)[0]} className="w-full">
                    <TabsList className="mb-4 flex flex-wrap">
                      {/* Filter results to only show tabs for models that were actually selected for the run */}
                      {selectedModels.filter(id => results[id]).map((modelId) => {
                        const model = models.find((m) => m.id === modelId)
                        return (
                          <TabsTrigger
                            key={modelId}
                            value={modelId}
                            className="mr-2 mb-2 data-[state=active]:shadow-md" // Added active state style
                            style={{
                              // Use Radix state for active styling if preferred over direct style manipulation
                              borderColor: model?.color,
                              color: model?.color,
                            }}
                          >
                            {model?.name || modelId}
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {/* Map over the actual results received */}
                    {Object.entries(results).map(([modelId, resultData]) => (
                      <TabsContent key={modelId} value={modelId} className="border rounded-lg p-4">
                        {/* --- Check for error property --- */}
                        {resultData.error ? (
                          <div className="text-red-600">
                            <h3 className="font-medium mb-2">{models.find((m) => m.id === modelId)?.name} Error</h3>
                            <p>{resultData.error}</p>
                          </div>
                        ) : (
                          // Original rendering logic for successful response
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: models.find((m) => m.id === modelId)?.color }}
                              ></div>
                              <h3 className="font-medium">{models.find((m) => m.id === modelId)?.name}</h3>
                            </div>
                            <p className="text-gray-700 whitespace-pre-line">{resultData.response}</p>
                            {/* Optionally display coordinates, confidence etc. */}
                            {resultData.coordinates && (
                                <p className="text-sm text-gray-500">
                                    Coords: {resultData.coordinates.lat.toFixed(4)}, {resultData.coordinates.lng.toFixed(4)}
                                </p>
                            )}
                             {/* Confidence display removed */}
                             {/* You can add accuracy/processing time here too if available */}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
