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
    accuracy: 89.7,
    avgDistance: 42.3,
    detailScore: 8.9,
    totalScore: 92.4,
  },
  {
    rank: 2,
    model: "Claude 3 Opus",
    organization: "Anthropic",
    accuracy: 87.2,
    avgDistance: 51.6,
    detailScore: 9.1,
    totalScore: 90.8,
  },
  {
    rank: 3,
    model: "Gemini 1.5 Pro",
    organization: "Google",
    accuracy: 85.9,
    avgDistance: 58.4,
    detailScore: 8.7,
    totalScore: 88.3,
  },
  {
    rank: 4,
    model: "Claude 3 Sonnet",
    organization: "Anthropic",
    accuracy: 82.3,
    avgDistance: 67.2,
    detailScore: 8.5,
    totalScore: 84.6,
  },
  {
    rank: 5,
    model: "LLaVA-1.5",
    organization: "LLaVA Team",
    accuracy: 79.8,
    avgDistance: 72.5,
    detailScore: 7.9,
    totalScore: 81.2,
  },
  {
    rank: 6,
    model: "CogVLM",
    organization: "THUDM",
    accuracy: 77.4,
    avgDistance: 81.3,
    detailScore: 7.6,
    totalScore: 78.9,
  },
  {
    rank: 7,
    model: "Qwen-VL",
    organization: "Alibaba",
    accuracy: 75.1,
    avgDistance: 89.7,
    detailScore: 7.4,
    totalScore: 76.3,
  },
  {
    rank: 8,
    model: "BLIP-2",
    organization: "Salesforce",
    accuracy: 68.5,
    avgDistance: 112.4,
    detailScore: 6.8,
    totalScore: 70.2,
  },
  {
    rank: 9,
    model: "Fuyu-8B",
    organization: "Adept",
    accuracy: 65.3,
    avgDistance: 124.8,
    detailScore: 6.5,
    totalScore: 67.1,
  },
  {
    rank: 10,
    model: "IDEFICS",
    organization: "Hugging Face",
    accuracy: 62.7,
    avgDistance: 138.2,
    detailScore: 6.2,
    totalScore: 64.5,
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
            <TabsTrigger value="detail">Detail Score</TabsTrigger>
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
                        <th className="py-4 px-2 text-right">Detail Score</th>
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
                          <td className="py-4 px-2 text-right">{item.detailScore.toFixed(1)}/10</td>
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

          <TabsContent value="detail">
            <Card>
              <CardHeader>
                <CardTitle>Detail Score Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Models ranked by quality and specificity of location descriptions.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
