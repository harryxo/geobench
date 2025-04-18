import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Link href="/leaderboard" className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Leaderboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Scoring Methodology</h1>
        <p className="text-gray-600 mb-8 max-w-3xl">
          How we evaluate and score multimodal AI models on their geographic reasoning capabilities
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Metrics</CardTitle>
              <CardDescription>The key metrics used to evaluate model performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">1. Geographic Accuracy</h3>
                  <p className="text-gray-600">
                    Measures how close the model's predicted coordinates are to the actual location. We use the
                    Haversine formula to calculate the distance between predicted and actual coordinates.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">2. Detail Score</h3>
                  <p className="text-gray-600">
                    Evaluates the quality and specificity of the location description, including identification of
                    landmarks, terrain features, and contextual information.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">3. Confidence Calibration</h3>
                  <p className="text-gray-600">
                    Assesses how well the model's confidence level correlates with its actual accuracy. Well-calibrated
                    models express appropriate uncertainty.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring Formula</CardTitle>
              <CardDescription>How individual metrics are combined into a total score</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                The total score is calculated using a weighted formula that balances the different aspects of geographic
                reasoning:
              </p>

              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="font-mono">
                  Total Score = (0.5 × Accuracy) + (0.3 × Detail Score) + (0.2 × Confidence Calibration)
                </p>
              </div>

              <p className="text-gray-600">Where:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Accuracy is inversely proportional to distance error</li>
                <li>Detail Score ranges from 0-10 based on expert evaluation</li>
                <li>Confidence Calibration measures how well confidence matches actual performance</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Benchmark Dataset</CardTitle>
            <CardDescription>Information about our testing dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Our benchmark uses a diverse dataset of 1,000 location images carefully curated to test various aspects of
              geographic reasoning:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Geographic Distribution</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>North America: 25%</li>
                  <li>Europe: 25%</li>
                  <li>Asia: 20%</li>
                  <li>Africa: 10%</li>
                  <li>South America: 10%</li>
                  <li>Oceania: 5%</li>
                  <li>Antarctica: 5%</li>
                </ul>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Environment Types</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Urban: 30%</li>
                  <li>Rural: 25%</li>
                  <li>Natural landmarks: 20%</li>
                  <li>Coastlines: 15%</li>
                  <li>Mountains: 10%</li>
                </ul>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Difficulty Levels</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Easy (iconic landmarks): 20%</li>
                  <li>Medium (recognizable features): 40%</li>
                  <li>Hard (subtle cues only): 30%</li>
                  <li>Very hard (minimal context): 10%</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-600">
              All images are manually verified and geotagged with precise coordinates. The dataset is regularly updated
              to include new locations and maintain diversity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testing Protocol</CardTitle>
            <CardDescription>How models are evaluated in a fair and consistent manner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Standardized Prompting</h3>
                <p className="text-gray-600">
                  All models receive the same prompt: "You're in geogussr. Where is this, to the best of your ability?"
                  This ensures consistency across evaluations.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Controlled Environment</h3>
                <p className="text-gray-600">
                  Models are tested with identical image quality, resolution, and format to eliminate technical
                  advantages.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Regular Re-evaluation</h3>
                <p className="text-gray-600">
                  Models are re-tested monthly with both existing and new images to track improvements and ensure
                  consistency.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Human Verification</h3>
                <p className="text-gray-600">
                  A team of geography experts reviews model responses to ensure fair scoring, especially for the detail
                  and contextual components.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
