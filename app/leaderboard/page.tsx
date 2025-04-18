import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Medal } from "lucide-react"
import Navbar from "@/components/navbar"
import fs from 'fs/promises'; // Import Node.js file system module
import path from 'path'; // Import Node.js path module

// Define types for benchmark results (matching run_benchmark.ts)
interface ModelPrediction {
  latitude: number | null;
  longitude: number | null;
  reasoning: string;
  confidence: string;
  error?: string;
}

interface BenchmarkResult {
  name: string;
  latitude: number;
  longitude: number;
  predicted: ModelPrediction;
  distanceKm: number | null;
  isCorrect: boolean | null;
  processingTimeMs?: number;
  // Add model identifier if results file might contain multiple models
  modelName?: string; // Assuming run_benchmark.ts adds this in the future
}

// Define the structure for leaderboard data
interface LeaderboardEntry {
  rank: number;
  model: string;
  organization: string;
  accuracy: number; // Percentage
  avgDistance: number | null; // Kilometers, null if no valid predictions
  totalScore: number; // Using accuracy for now
  internalId?: string; // Added for mapping
}


// Initial mock data - we will update this with real results
let leaderboardData: LeaderboardEntry[] = [
  { rank: 1, model: "GPT-4o", organization: "OpenAI", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 2, model: "Claude 3 Opus", organization: "Anthropic", accuracy: 0, avgDistance: null, totalScore: 0 },
  // --- Match the model name used in benchmark_results.json if different ---
  // Let's assume the benchmark script identifies the model as "gemini-2.5-pro-exp-03-25"
  // We'll map this to a display name like "Gemini 2.5 Pro"
  { rank: 3, model: "Gemini 2.5 Pro", organization: "Google", accuracy: 0, avgDistance: null, totalScore: 0, internalId: "gemini-2.5-pro-exp-03-25" }, // Add internalId for mapping
  { rank: 4, model: "Claude 3 Sonnet", organization: "Anthropic", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 5, model: "LLaVA-1.5", organization: "LLaVA Team", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 6, model: "CogVLM", organization: "THUDM", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 7, model: "Qwen-VL", organization: "Alibaba", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 8, model: "BLIP-2", organization: "Salesforce", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 9, model: "Fuyu-8B", organization: "Adept", accuracy: 0, avgDistance: null, totalScore: 0 },
  { rank: 10, model: "IDEFICS", organization: "Hugging Face", accuracy: 0, avgDistance: null, totalScore: 0 },
].map(item => ({ ...item, internalId: item.internalId || item.model.toLowerCase().replace(/ /g, '-') })); // Add default internalId


// --- Function to load and process benchmark results ---
async function loadBenchmarkData(): Promise<LeaderboardEntry[]> {
  const resultsFilePath = path.join(process.cwd(), 'benchmark_results.json');
  let benchmarkResults: BenchmarkResult[] = [];

  try {
    const fileContent = await fs.readFile(resultsFilePath, 'utf-8');
    benchmarkResults = JSON.parse(fileContent);

    // --- Assume results are for a single model for now ---
    // In the future, you might group results by modelName if the file contains multiple models
    const modelInternalId = "gemini-2.5-pro-exp-03-25"; // Hardcoded for now, match run_benchmark.ts output

    const processedResults = benchmarkResults.filter(r => r.predicted.error !== "Skipped: Missing panoId");
    const validResults = processedResults.filter(r => r.predicted.error === undefined);
    const resultsWithCoords = validResults.filter(r => r.distanceKm !== null);
    const correctPredictions = resultsWithCoords.filter(r => r.isCorrect).length;

    const totalProcessed = processedResults.length;
    const accuracy = totalProcessed > 0 ? (correctPredictions / totalProcessed) * 100 : 0;

    const avgDistance = resultsWithCoords.length > 0
      ? resultsWithCoords.reduce((sum, r) => sum + r.distanceKm!, 0) / resultsWithCoords.length
      : null;

    // --- Update the leaderboard data ---
    const modelIndex = leaderboardData.findIndex(item => item.internalId === modelInternalId);
    if (modelIndex !== -1) {
      leaderboardData[modelIndex].accuracy = accuracy;
      leaderboardData[modelIndex].avgDistance = avgDistance;
      leaderboardData[modelIndex].totalScore = accuracy; // Use accuracy as score for now
    } else {
      console.warn(`Model ${modelInternalId} from results not found in initial leaderboard data.`);
      // Optionally add it if not found
      // leaderboardData.push({ rank: 0, model: "Gemini 2.5 Pro", organization: "Google", accuracy, avgDistance, totalScore: accuracy, internalId: modelInternalId });
    }

    // --- Sort by totalScore (accuracy) and update ranks ---
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    leaderboardData.forEach((item, index) => {
      item.rank = index + 1;
    });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Benchmark results file not found at ${resultsFilePath}. Displaying initial data.`);
      // Keep initial ranks if file not found
      leaderboardData.sort((a, b) => a.rank - b.rank);
    } else {
      console.error("Error loading or processing benchmark data:", error);
      // Keep initial ranks on other errors
       leaderboardData.sort((a, b) => a.rank - b.rank);
    }
  }

  return leaderboardData;
}


export default async function LeaderboardPage() {
  // --- Load data when the component renders on the server ---
  const finalLeaderboardData = await loadBenchmarkData();

  // Helper function to get medal color
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-500";
      case 2: return "text-gray-400"; // Silver
      case 3: return "text-amber-700"; // Bronze
      default: return "";
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Model Leaderboard</h1>
            <p className="text-gray-600 max-w-2xl">
              Comparing multimodal AI models on their ability to identify locations from images. Updated daily with the
              latest benchmark results.
            </p>
          </div>
        </div>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
            <TabsTrigger value="distance">Distance Error</TabsTrigger>
          </TabsList>

          {/* Overall Tab */}
          <TabsContent value="overall">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Overall Performance Ranking</CardTitle>
                 <p className="text-sm text-gray-500 pt-1">Ranked primarily by accuracy.</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left font-semibold">Rank</th>
                        <th className="py-3 px-2 text-left font-semibold">Model</th>
                        <th className="py-3 px-2 text-left font-semibold">Organization</th>
                        <th className="py-3 px-2 text-right font-semibold">Accuracy (%)</th>
                        <th className="py-3 px-2 text-right font-semibold">Avg. Distance (km)</th>
                        {/* <th className="py-3 px-2 text-right font-semibold">Total Score</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {finalLeaderboardData.map((item) => (
                        <tr key={item.internalId} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="py-3 px-2">
                            <div className="flex items-center">
                              {item.rank <= 3 && (
                                <Medal className={`h-5 w-5 mr-1.5 ${getMedalColor(item.rank)}`} />
                              )}
                              <span className={item.rank > 3 ? 'ml-[26px]' : ''}>{item.rank}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-medium">{item.model}</td>
                          <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{item.organization}</td>
                          <td className="py-3 px-2 text-right">{item.accuracy.toFixed(1)}</td>
                          <td className="py-3 px-2 text-right">
                            {item.avgDistance !== null ? item.avgDistance.toFixed(1) : "N/A"}
                          </td>
                          {/* <td className="py-3 px-2 text-right font-bold">{item.totalScore.toFixed(1)}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accuracy Tab */}
          <TabsContent value="accuracy">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Ranking</CardTitle>
                <p className="text-sm text-gray-500 pt-1">
                  Models ranked by percentage of locations correctly identified within 100km.
                </p>
              </CardHeader>
              <CardContent>
                 <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left font-semibold">Rank</th>
                        <th className="py-3 px-2 text-left font-semibold">Model</th>
                        <th className="py-3 px-2 text-right font-semibold">Accuracy (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...finalLeaderboardData] // Create a copy to sort
                        .sort((a, b) => b.accuracy - a.accuracy) // Sort by accuracy desc
                        .map((item, index) => (
                          <tr key={item.internalId} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                {index + 1 <= 3 && (
                                  <Medal className={`h-5 w-5 mr-1.5 ${getMedalColor(index + 1)}`} />
                                )}
                                <span className={index + 1 > 3 ? 'ml-[26px]' : ''}>{index + 1}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-medium">{item.model}</td>
                            <td className="py-3 px-2 text-right font-bold">{item.accuracy.toFixed(1)}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distance Error Tab */}
          <TabsContent value="distance">
            <Card>
              <CardHeader>
                <CardTitle>Distance Error Ranking</CardTitle>
                <p className="text-sm text-gray-500 pt-1">
                  Models ranked by average distance error (lower is better). Only includes models with successful predictions.
                </p>
              </CardHeader>
              <CardContent>
                 <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left font-semibold">Rank</th>
                        <th className="py-3 px-2 text-left font-semibold">Model</th>
                        <th className="py-3 px-2 text-right font-semibold">Avg. Distance (km)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...finalLeaderboardData] // Create a copy
                        .filter(item => item.avgDistance !== null) // Only models with distance calculated
                        .sort((a, b) => a.avgDistance! - b.avgDistance!) // Sort by distance asc (lower is better)
                        .map((item, index) => (
                          <tr key={item.internalId} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                             <td className="py-3 px-2">
                              <div className="flex items-center">
                                {index + 1 <= 3 && (
                                  <Medal className={`h-5 w-5 mr-1.5 ${getMedalColor(index + 1)}`} />
                                )}
                                <span className={index + 1 > 3 ? 'ml-[26px]' : ''}>{index + 1}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-medium">{item.model}</td>
                            <td className="py-3 px-2 text-right font-bold">{item.avgDistance!.toFixed(1)}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}
