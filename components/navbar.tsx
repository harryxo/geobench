import Link from "next/link"
import { MapPin } from "lucide-react"

export default function Navbar() {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between border-b">
      <Link href="/" className="flex items-center gap-2">
        <MapPin className="h-6 w-6" />
        <span className="font-bold text-lg">geogussr_</span>
      </Link>

      <nav>
        <ul className="flex items-center gap-8">
          <li>
            <Link href="/playground" className="text-gray-700 hover:text-emerald-500 transition-colors">
              Playground
            </Link>
          </li>
          <li>
            <Link href="/arena" className="text-gray-700 hover:text-emerald-500 transition-colors">
              Arena
            </Link>
          </li>
          <li>
            <Link href="/leaderboard" className="text-gray-700 hover:text-emerald-500 transition-colors">
              Leaderboard
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-gray-700 hover:text-emerald-500 transition-colors">
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
