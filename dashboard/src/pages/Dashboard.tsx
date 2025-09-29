import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Temporarily removed recharts import to fix dependency issues
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
import {
  Shield,
  Video,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Clock,
  Hash,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Mock data for blocked videos
const blockedVideos = [
  {
    id: "1",
    title: "10 Things That Will Waste Your Time Today",
    channel: "TimeWaster TV",
    thumbnail: "/api/placeholder/120/68",
    blockedAt: "2024-01-20T10:30:00Z",
    reason: "productivity",
    keywords: ["waste", "time"],
  },
  {
    id: "2",
    title: "You Won't Believe These Crazy Life Hacks!",
    channel: "ClickBait Central",
    thumbnail: "/api/placeholder/120/68",
    blockedAt: "2024-01-20T09:15:00Z",
    reason: "clickbait",
    keywords: ["won't believe", "crazy"],
  },
  {
    id: "3",
    title: "SHOCKING Celebrity Drama Revealed",
    channel: "Drama Channel",
    thumbnail: "/api/placeholder/120/68",
    blockedAt: "2024-01-20T08:45:00Z",
    reason: "drama",
    keywords: ["shocking", "drama"],
  },
  {
    id: "4",
    title: "Procrastination is Actually Good For You",
    channel: "Lazy Life",
    thumbnail: "/api/placeholder/120/68",
    blockedAt: "2024-01-19T16:20:00Z",
    reason: "procrastination",
    keywords: ["procrastination"],
  },
  {
    id: "5",
    title: "Why You Should Quit Your Job Right Now",
    channel: "Bad Advice Hub",
    thumbnail: "/api/placeholder/120/68",
    blockedAt: "2024-01-19T14:10:00Z",
    reason: "negative",
    keywords: ["quit", "job"],
  },
];

// Weekly blocking statistics
const weeklyStats = [
  { week: "Week 1", blocked: 12, productivity: 85 },
  { week: "Week 2", blocked: 18, productivity: 78 },
  { week: "Week 3", blocked: 8, productivity: 92 },
  { week: "Week 4", blocked: 15, productivity: 81 },
];

// Chart data for different time periods
const chartData = {
  "7days": [
    { date: "Jun 24", blocked: 8, potential: 15 },
    { date: "Jun 25", blocked: 12, potential: 20 },
    { date: "Jun 26", blocked: 15, potential: 25 },
    { date: "Jun 27", blocked: 18, potential: 30 },
    { date: "Jun 28", blocked: 22, potential: 35 },
    { date: "Jun 29", blocked: 25, potential: 40 },
    { date: "Jun 30", blocked: 20, potential: 32 },
  ],
  "30days": [
    { date: "Jun 1", blocked: 45, potential: 60 },
    { date: "Jun 5", blocked: 52, potential: 75 },
    { date: "Jun 10", blocked: 38, potential: 55 },
    { date: "Jun 15", blocked: 67, potential: 85 },
    { date: "Jun 20", blocked: 73, potential: 95 },
    { date: "Jun 25", blocked: 89, potential: 110 },
    { date: "Jun 30", blocked: 94, potential: 120 },
  ],
  "3months": [
    { date: "Apr", blocked: 180, potential: 250 },
    { date: "May", blocked: 220, potential: 300 },
    { date: "Jun", blocked: 280, potential: 380 },
    { date: "Jul", blocked: 320, potential: 420 },
    { date: "Aug", blocked: 290, potential: 390 },
    { date: "Sep", blocked: 340, potential: 450 },
  ],
};

// Blocked keywords
const blockedKeywords = [
  { keyword: "clickbait", count: 24, category: "low-quality" },
  { keyword: "drama", count: 18, category: "entertainment" },
  { keyword: "waste time", count: 15, category: "productivity" },
  { keyword: "procrastination", count: 12, category: "productivity" },
  { keyword: "shocking", count: 9, category: "sensational" },
  { keyword: "you won't believe", count: 7, category: "clickbait" },
];

const stats = [
  {
    title: "Total Blocked Videos",
    value: "1,247",
    change: "+23 this week",
    trend: "up",
    icon: Shield,
    color: "text-red-500",
  },
  {
    title: "Videos Blocked Today",
    value: "8",
    change: "+60% vs yesterday",
    trend: "up",
    icon: Video,
    color: "text-orange-500",
  },
  {
    title: "Active Keywords",
    value: "156",
    change: "+12 new this week",
    trend: "up",
    icon: Hash,
    color: "text-blue-500",
  },
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "7days" | "30days" | "3months"
  >("7days");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const currentData = chartData[selectedPeriod];
  const maxValue = Math.max(
    ...currentData.map((d) => Math.max(d.blocked, d.potential))
  );

  // Generate SVG path for the area chart
  const generatePath = (
    data: typeof currentData,
    key: "blocked" | "potential"
  ) => {
    const points = data.map((item, index) => {
      const x = 50 + index * (700 / (data.length - 1));
      const y = 270 - (item[key] / maxValue) * 180;
      return `${x},${y}`;
    });

    const pathData = `M ${points[0]} ${points
      .slice(1)
      .map((p) => `L ${p}`)
      .join(" ")} L ${50 + 700} 270 L 50 270 Z`;
    return pathData;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className="text-green-500">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blocked Videos Trend - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blocked Videos Trend</CardTitle>
            <CardDescription>
              Interactive chart showing blocking activity over time
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={selectedPeriod === "7days" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedPeriod("7days")}
              style={
                selectedPeriod === "7days"
                  ? { backgroundColor: "#f8c23e", color: "#000" }
                  : {}
              }
            >
              Last 7 days
            </Button>
            <Button
              variant={selectedPeriod === "30days" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedPeriod("30days")}
              style={
                selectedPeriod === "30days"
                  ? { backgroundColor: "#f8c23e", color: "#000" }
                  : {}
              }
            >
              Last 30 days
            </Button>
            <Button
              variant={selectedPeriod === "3months" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedPeriod("3months")}
              style={
                selectedPeriod === "3months"
                  ? { backgroundColor: "#f8c23e", color: "#000" }
                  : {}
              }
            >
              Last 3 months
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] relative bg-background rounded-lg overflow-hidden">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 800 320"
              className="absolute inset-0"
            >
              <defs>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(59, 130, 246)"
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(59, 130, 246)"
                    stopOpacity="0.1"
                  />
                </linearGradient>
              </defs>

              {/* Area Path */}
              <path
                d={generatePath(currentData, "blocked")}
                fill="url(#areaGradient)"
                className="transition-all duration-500 ease-in-out"
              />

              {/* Top stroke line */}
              <path
                d={
                  generatePath(currentData, "blocked")
                    .split(" L ")[0]
                    .replace("M ", "M") +
                  currentData
                    .slice(1)
                    .map((item, index) => {
                      const x =
                        50 + (index + 1) * (700 / (currentData.length - 1));
                      const y = 270 - (item.blocked / maxValue) * 180;
                      return ` L ${x} ${y}`;
                    })
                    .join("")
                }
                stroke="rgb(59, 130, 246)"
                strokeWidth="3"
                fill="none"
                className="transition-all duration-500 ease-in-out"
              />

              {/* Interactive data points */}
              {currentData.map((item, index) => {
                const x = 50 + index * (700 / (currentData.length - 1));
                const y = 270 - (item.blocked / maxValue) * 180;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r={hoveredPoint === index ? "6" : "4"}
                      fill="rgb(59, 130, 246)"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text
                      x={x}
                      y={305}
                      textAnchor="middle"
                      className="text-sm fill-muted-foreground"
                    >
                      {item.date}
                    </text>

                    {/* Hover tooltip */}
                    {hoveredPoint === index && (
                      <g>
                        <rect
                          x={x - 30}
                          y={y - 40}
                          width="60"
                          height="25"
                          fill="hsl(var(--background))"
                          stroke="hsl(var(--border))"
                          rx="4"
                        />
                        <text
                          x={x}
                          y={y - 22}
                          textAnchor="middle"
                          className="text-xs font-medium fill-foreground"
                        >
                          {item.blocked} blocked
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Chart statistics overlay */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-xs text-muted-foreground">
                  Blocked Videos
                </span>
              </div>
            </div>

            {/* Current stats */}
            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border">
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {currentData[currentData.length - 1]?.blocked || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPeriod === "7days"
                    ? "Today"
                    : selectedPeriod === "30days"
                    ? "This Week"
                    : "This Month"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Videos</CardTitle>
          <CardDescription>
            Recent videos blocked by your content filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Video
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Reason/Keywords
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {blockedVideos.map((video, index) => (
                  <tr
                    key={video.id}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Play className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {video.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {video.channel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {video.keywords.map((keyword, keywordIndex) => (
                          <span
                            key={keywordIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(video.blockedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
