import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Medal } from "lucide-react"
import Navbar from "@/components/navbar"

// Mock data for the leaderboard
const leaderboardData = [
  {
    rank: 1,
    model: "GPT-4o",
    organization: "OpenAI",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 8.9, // Removed
    totalScore: 0,
  },
  {
    rank: 2,
    model: "Claude 3 Opus",
    organization: "Anthropic",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 9.1, // Removed
    totalScore: 0,
  },
  {
    rank: 3,
    model: "Gemini 1.5 Pro",
    organization: "Google",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 8.7, // Removed
    totalScore: 0,
  },
  {
    rank: 4,
    model: "Claude 3 Sonnet",
    organization: "Anthropic",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 8.5, // Removed
    totalScore: 0,
  },
  {
    rank: 5,
    model: "LLaVA-1.5",
    organization: "LLaVA Team",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 7.9, // Removed
    totalScore: 0,
  },
  {
    rank: 6,
    model: "CogVLM",
    organization: "THUDM",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 7.6, // Removed
    totalScore: 0,
  },
  {
    rank: 7,
    model: "Qwen-VL",
    organization: "Alibaba",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 7.4, // Removed
    totalScore: 0,
  },
  {
    rank: 8,
    model: "BLIP-2",
    organization: "Salesforce",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 6.8, // Removed
    totalScore: 0,
  },
  {
    rank: 9,
    model: "Fuyu-8B",
    organization: "Adept",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 6.5, // Removed
    totalScore: 0,
  },
  {
    rank: 10,
    model: "IDEFICS",
    organization: "Hugging Face",
    accuracy: 0,
    avgDistance: 0,
    // detailScore: 6.2, // Removed
    totalScore: 0,
  },
]

export default function LeaderboardPage() {
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
          <TabsList className="mb-6">
            <TabsTrigger value="overall">Overall Performance</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
            <TabsTrigger value="distance">Distance Error</TabsTrigger>
            {/* <TabsTrigger value="detail">Detail Score</TabsTrigger> */} {/* Removed */}
          </TabsList>

          <TabsContent value="overall">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Overall Performance Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-4 px-2 text-left">Rank</th>
                        <th className="py-4 px-2 text-left">Model</th>
                        <th className="py-4 px-2 text-left">Organization</th>
                        <th className="py-4 px-2 text-right">Accuracy (%)</th>
                        <th className="py-4 px-2 text-right">Avg. Distance (km)</th>
                        {/* <th className="py-4 px-2 text-right">Detail Score</th> */} {/* Removed */}
                        <th className="py-4 px-2 text-right">Total Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((item) => (
                        <tr key={item.rank} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-2">
                            {item.rank <= 3 ? (
                              <div className="flex items-center">
                                <Medal
                                  className={`h-5 w-5 mr-1 ${
                                    item.rank === 1
                                      ? "text-yellow-500"
                                      : item.rank === 2
                                        ? "text-gray-400"
                                        : "text-amber-700"
                                  }`}
                                />
                                {item.rank}
                              </div>
                            ) : (
                              item.rank
                            )}
                          </td>
                          <td className="py-4 px-2 font-medium">{item.model}</td>
                          <td className="py-4 px-2 text-gray-600">{item.organization}</td>
                          <td className="py-4 px-2 text-right">{item.accuracy.toFixed(1)}</td>
                          <td className="py-4 px-2 text-right">{item.avgDistance.toFixed(1)}</td>
                          {/* <td className="py-4 px-2 text-right">{item.detailScore.toFixed(1)}/10</td> */} {/* Removed */}
                          <td className="py-4 px-2 text-right font-bold">{item.totalScore.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accuracy">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Models ranked by percentage of locations correctly identified within 100km.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distance">
            <Card>
              <CardHeader>
                <CardTitle>Distance Error Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Models ranked by average distance error in kilometers.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="detail">
            <Card>
              <CardHeader>
                <CardTitle>Detail Score Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Models ranked by quality and specificity of location descriptions.</p>
              </CardContent>
            </Card>
          </TabsContent> */} {/* Removed */}
        </Tabs>
      </main>
    </div>
  )
}
