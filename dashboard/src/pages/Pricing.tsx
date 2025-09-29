import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Basic filtering, plus basic AI filtering.",
    price: "$0",
    yearlyPrice: "$0",
    features: [
      "Core AI Filtering",
      "Basic Blocking Categories",
      "Basic analytics",
      "Limited Custom Rules",
      "Community Support",
    ],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    description:
      "Get full access to all our tools for complete control and freedom online.",
    price: "$15",
    yearlyPrice: "$150",
    yearlyDiscount: "$30",
    features: [
      "Enhanced AI Filtering",
      "Unlimited Custom Rules",
      "Focus Mode",
      "Priority Support",
      "Advanced Privacy Controls",
    ],
    buttonText: "Purchase",
    popular: true,
  },
];

export default function Pricing() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Check out our affordable pricing plans
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${plan.name === "Free" ? "border-2" : ""}`}
            style={
              plan.name === "Free"
                ? {
                    borderColor: "#f8c23e",
                    backgroundColor: "rgba(248, 194, 62, 0.1)",
                  }
                : {}
            }
          >
            {plan.name === "Free" && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                  This is your current plan
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-xl font-semibold">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>

              <div className="mt-6">
                <div className="text-4xl font-bold text-foreground">
                  {plan.price}
                </div>
                {plan.name !== "Free" && (
                  <div className="text-sm text-muted-foreground mt-1">
                    per month
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span
                      className={
                        feature.startsWith("Everything in") ? "font-medium" : ""
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.name !== "Free" && (
                <Button
                  className="w-full"
                  style={{ backgroundColor: "#f8c23e", color: "#000" }}
                >
                  {plan.buttonText}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
