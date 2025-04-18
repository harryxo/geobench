import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import Navbar from "@/components/navbar"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      {/* Background code snippets */}
      <div className="absolute inset-0 overflow-hidden opacity-5 z-0 select-none pointer-events-none">
        <div className="text-xs md:text-sm text-black font-mono p-8">
          <div className="mb-4">assert(trace.length &gt; 0.0);</div>
          <div className="mb-4 ml-20">assert.isTrue(value);</div>
          <div className="mb-4 ml-40">expect();</div>
          <div className="mb-4 ml-60">assert.isNotNull(value);</div>
          <div className="mb-4">expect(geoDistance(actual, expected) &lt; 10.0);</div>
          <div className="mb-4 ml-20">assert(countCities(locations) &gt; 0);</div>
          <div className="mb-4 ml-40">expect(identifyLandmark(image)).toBeTruthy();</div>
          <div className="mb-4 ml-60">assert.isValidCoordinate(lat, lng);</div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 relative mx-auto">
            <MapPin className="w-full h-full text-black" />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-2 flex items-center">
          geogussr<span className="text-emerald-500">_</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">The AI Location Benchmark</p>

        <Link href="/playground">
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg h-auto">
            Playground
          </Button>
        </Link>
      </div>
    </main>
  )
}
