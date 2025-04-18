"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { ModelResponse } from "@/components/model-response"

export default function BenchmarkPage() {
  const [selectedTab, setSelectedTab] = useState("upload")
  const [selectedModel, setSelectedModel] = useState("all")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setResults(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    setResults(null)
  }

  const runBenchmark = () => {
    if (!uploadedImage) return

    setIsLoading(true)

    // Simulate API call with timeout
    setTimeout(() => {
      // Mock results
      setResults([
        {
          model: "GPT-4o",
          response:
            "This appears to be a view of the Wilder sports-field complex in Orinda, California, just east of the Caldecott Tunnel. The bright striped turf pitches belong to the Wilder development. The freeway snaking up the valley is CA-24, heading toward Oakland. The three concrete columns on the opposite ridge are the Caldecott Tunnel ventilation stacks. This location is approximately at 37.88°N, 122.21°W in the East Bay area.",
          confidence: 92,
          coordinates: { lat: 37.88, lng: -122.21 },
          accuracy: "High",
          processingTime: "2.1s",
        },
        {
          model: "Claude 3 Opus",
          response:
            "This is the Wilder Fields sports complex in Orinda, California. The image shows multiple soccer/sports fields with distinctive green striping. The location is in the hills east of Oakland, with Highway 24 visible running through the valley. Based on the perspective, this photo was taken from a hillside south of the fields, looking north/northwest. The approximate coordinates are 37.88°N, 122.21°W.",
          confidence: 89,
          coordinates: { lat: 37.87, lng: -122.2 },
          accuracy: "High",
          processingTime: "2.4s",
        },
        {
          model: "Gemini 1.5 Pro",
          response:
            "This appears to be the Robert Sibley Volcanic Regional Preserve or nearby area in the Oakland Hills, California. I can see what looks like sports fields in a valley with hills surrounding them. This is likely in the East Bay region near Berkeley/Oakland. The approximate coordinates would be around 37.8°N, 122.2°W.",
          confidence: 76,
          coordinates: { lat: 37.8, lng: -122.2 },
          accuracy: "Medium",
          processingTime: "1.9s",
        },
      ])
      setIsLoading(false)
      setSelectedTab("results")
    }, 3000)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">GeoGuesser Benchmark</h1>
        <p className="text-gray-600 mb-8">Upload an image to test how well AI models can identify the location</p>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Upload Location Image</CardTitle>
                  <CardDescription>Upload an image of a location to test AI models</CardDescription>
                </CardHeader>
                <CardContent>
                  {!uploadedImage ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PNG, JPG, WEBP (max 10MB)</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <Image
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded location"
                        width={800}
                        height={500}
                        className="rounded-lg w-full h-auto object-contain max-h-[400px]"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black/90"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benchmark Settings</CardTitle>
                  <CardDescription>Configure which models to test</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Models</label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select models to benchmark" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Available Models</SelectItem>
                          <SelectItem value="gpt4o">GPT-4o</SelectItem>
                          <SelectItem value="claude">Claude 3 Opus</SelectItem>
                          <SelectItem value="gemini">Gemini 1.5 Pro</SelectItem>
                          <SelectItem value="custom">Custom Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={runBenchmark}
                      disabled={!uploadedImage || isLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Run Benchmark
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results">
            {results && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Benchmark Results</CardTitle>
                    <CardDescription>How well different models identified your location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <Image
                          src={uploadedImage! || "/placeholder.svg"}
                          alt="Benchmarked location"
                          width={400}
                          height={300}
                          className="rounded-lg w-full h-auto object-contain"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium mb-4">Model Responses</h3>
                        <div className="space-y-4">
                          {results.map((result, index) => (
                            <ModelResponse key={index} result={result} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
