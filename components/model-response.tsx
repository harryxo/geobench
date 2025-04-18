import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/button"
import { MapPin, Clock, BarChart } from "lucide-react"

interface ModelResponseProps {
  result: {
    model: string
    response: string
    confidence: number
    coordinates: { lat: number; lng: number }
    accuracy: string
    processingTime: string
  }
}

export function ModelResponse({ result }: ModelResponseProps) {
  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case "High":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600"
    if (confidence >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">{result.model}</h4>
            <Badge variant="outline" className={getAccuracyColor(result.accuracy)}>
              {result.accuracy} Accuracy
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-4">{result.response}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {result.coordinates.lat.toFixed(2)}°N, {Math.abs(result.coordinates.lng).toFixed(2)}°W
            </div>
            <div className="flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              Confidence:{" "}
              <span className={`ml-1 font-medium ${getConfidenceColor(result.confidence)}`}>{result.confidence}%</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Processing time: {result.processingTime}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
