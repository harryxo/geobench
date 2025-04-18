import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">About GeoGuesser Benchmark</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                The GeoGuesser Benchmark aims to evaluate and compare the geographic reasoning capabilities of
                multimodal AI models. By providing a standardized set of location images and metrics, we enable
                researchers and developers to better understand the strengths and limitations of different models in
                identifying real-world locations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our benchmark consists of 50 carefully selected location images from around the world. Each model is
                presented with these images and asked to identify the location as precisely as possible. We measure
                performance based on geographic accuracy (distance from actual location), detail level, and confidence
                calibration.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Benchmark Methodology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Evaluation Metrics</h3>
                <p className="text-gray-700">We use three primary metrics to evaluate model performance:</p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>
                    <span className="font-medium">Geographic Accuracy:</span> Measured as the distance in kilometers
                    between the predicted and actual location coordinates.
                  </li>
                  <li>
                    <span className="font-medium">Detail Score:</span> A rating from 0-10 based on the quality and
                    specificity of the location description, including identification of landmarks and contextual
                    information.
                  </li>
                  <li>
                    <span className="font-medium">Confidence Calibration:</span> How well the model's expressed
                    confidence correlates with its actual accuracy.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-1">Location Dataset</h3>
                <p className="text-gray-700">
                  Our dataset includes 50 diverse locations spanning all continents and various environment types:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Urban centers and famous landmarks</li>
                  <li>Rural and remote locations</li>
                  <li>Natural landscapes and geographic features</li>
                  <li>Various climate zones and ecosystems</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Have questions or suggestions about the GeoGuesser Benchmark? We'd love to hear from you.
            </p>
            <p className="text-gray-700">
              Email:{" "}
              <a href="mailto:contact@geoguessrbenchmark.ai" className="text-emerald-600 hover:underline">
                contact@geoguessrbenchmark.ai
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
