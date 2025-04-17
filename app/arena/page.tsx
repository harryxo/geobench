"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MapPin, Loader2 } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/navbar"

// Sample model data
const models = [
  { id: "gpt4o", name: "GPT-4o", color: "#10a37f" },
  { id: "claude", name: "Claude 3 Opus", color: "#7c3aed" },
  { id: "gemini", name: "Gemini 1.5 Pro", color: "#1a73e8" },
  { id: "llava", name: "LLaVA-1.5", color: "#f97316" },
]

export default function ArenaPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, string>>({})
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt4o", "claude"])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setResults({})
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    setResults({})
  }

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels((prev) => (prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]))
  }

  const runComparison = () => {
    if (!uploadedImage || selectedModels.length === 0) return

    setIsLoading(true)

    // Simulate API calls with timeout
    setTimeout(() => {
      const newResults: Record<string, string> = {}

      // Mock responses for each model
      if (selectedModels.includes("gpt4o")) {
        newResults["gpt4o"] =
          "This appears to be a view of the Wilder sports-field complex in Orinda, California, just east of the Caldecott Tunnel. The bright striped turf pitches belong to the Wilder development. The freeway snaking up the valley is CA-24, heading toward Oakland. The three concrete columns on the opposite ridge are the Caldecott Tunnel ventilation stacks. This location is approximately at 37.88°N, 122.21°W in the East Bay area."
      }

      if (selectedModels.includes("claude")) {
        newResults["claude"] =
          "This is the Wilder Fields sports complex in Orinda, California. The image shows multiple soccer/sports fields with distinctive green striping. The location is in the hills east of Oakland, with Highway 24 visible running through the valley. Based on the perspective, this photo was taken from a hillside south of the fields, looking north/northwest. The approximate coordinates are 37.88°N, 122.21°W."
      }

      if (selectedModels.includes("gemini")) {
        newResults["gemini"] =
          "This appears to be the Robert Sibley Volcanic Regional Preserve or nearby area in the Oakland Hills, California. I can see what looks like sports fields in a valley with hills surrounding them. This is likely in the East Bay region near Berkeley/Oakland. The approximate coordinates would be around 37.8°N, 122.2°W."
      }

      if (selectedModels.includes("llava")) {
        newResults["llava"] =
          "The image shows a hillside view overlooking what appears to be a sports complex with several green fields. This looks like it could be in California based on the dry golden hills and the layout. I can see what might be a highway or road in the valley. Without more specific landmarks, I would estimate this is somewhere in the western United States, possibly in California near a suburban area. The coordinates might be approximately 37-38°N, 122°W."
      }

      setResults(newResults)
      setIsLoading(false)
    }, 3000)
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
                      disabled={isLoading || selectedModels.length === 0}
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
                  <Tabs defaultValue={Object.keys(results)[0]} className="w-full">
                    <TabsList className="mb-4 flex flex-wrap">
                      {Object.keys(results).map((modelId) => {
                        const model = models.find((m) => m.id === modelId)
                        return (
                          <TabsTrigger
                            key={modelId}
                            value={modelId}
                            className="mr-2 mb-2"
                            style={{
                              borderColor: model?.color,
                              color: model?.color,
                            }}
                          >
                            {model?.name || modelId}
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {Object.entries(results).map(([modelId, response]) => (
                      <TabsContent key={modelId} value={modelId} className="border rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: models.find((m) => m.id === modelId)?.color }}
                            ></div>
                            <h3 className="font-medium">{models.find((m) => m.id === modelId)?.name}</h3>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line">{response}</p>
                        </div>
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
