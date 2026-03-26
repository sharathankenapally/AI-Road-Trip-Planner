import { addMinutes, format, parseISO } from "date-fns";

type VehicleCheckRequest = {
  travelers: number;
  vehicleType: string;
  destination?: string;
};

type VehicleCheckResponse = {
  suitable: boolean;
  suitabilityScore: number;
  issues: string[];
  recommendations: {
    vehicleType: string;
    reason: string;
    capacity: number;
    features: string[];
  }[];
  message: string;
};

type TripPlanRequest = {
  travelers: number;
  vehicleType: string;
  startLocation: string;
  destination: string;
  startTime: string;
  preferences?: string[];
};

type TripPlanResponse = {
  routes: Route[];
  selectedRoute?: Route;
  stops: Stop[];
  mealRecommendations: MealStop[];
  estimatedArrival: string;
  totalDistance: string;
  summary: string;
};

type Route = {
  id: string;
  name: string;
  type: "fastest" | "scenic" | "balanced";
  duration: string;
  distance: string;
  highlights: string[];
  description: string;
};

type Stop = {
  id: string;
  name: string;
  type: "attraction" | "viewpoint" | "rest_area" | "gas_station" | "town" | "landmark";
  description: string;
  estimatedArrivalTime: string;
  estimatedStopDuration: string;
  distanceFromStart: string;
  mustVisit: boolean;
  openHours?: string;
  isOpen: boolean;
  coordinates?: { lat: number; lng: number };
};

type MealStop = {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  cuisine: string;
  description: string;
  estimatedArrivalTime: string;
  location: string;
  priceRange: "$" | "$$" | "$$$";
  openHours?: string;
  isOpen: boolean;
  mustTry: string[];
  alternativeOptions?: {
    name: string;
    cuisine: string;
    priceRange: string;
    openHours?: string;
    reason: string;
  }[];
};

type TripAdjustRequest = {
  originalRequest: TripPlanRequest;
  delayMinutes: number;
  currentLocation?: string;
  reason?: string;
};

const VEHICLE_DATA: Record<string, { capacity: number; features: string[] }> = {
  sedan: { capacity: 5, features: ["Fuel-efficient", "Comfortable for highways", "Easy parking"] },
  suv: { capacity: 7, features: ["Spacious cargo", "4WD option", "Comfortable for long drives", "Good visibility"] },
  minivan: { capacity: 8, features: ["Maximum passenger space", "Sliding doors", "Lots of storage", "Great for families"] },
  sports_car: { capacity: 2, features: ["Fast", "Fun to drive", "Limited luggage space"] },
  pickup_truck: { capacity: 5, features: ["Large cargo bed", "Towing capacity", "Off-road capable"] },
  motorcycle: { capacity: 2, features: ["Fuel-efficient", "Scenic experience", "Limited luggage"] },
  rv: { capacity: 8, features: ["Built-in sleeping", "Kitchen and bathroom", "Ultimate road trip vehicle", "Self-contained"] },
};

export function checkVehicleSuitability(req: VehicleCheckRequest): VehicleCheckResponse {
  const { travelers, vehicleType } = req;
  const vehicle = VEHICLE_DATA[vehicleType] ?? { capacity: 4, features: [] };
  const capacity = vehicle.capacity;

  const issues: string[] = [];
  let score = 100;

  if (travelers > capacity) {
    issues.push(`Your ${vehicleType} only seats ${capacity} people, but you have ${travelers} travelers`);
    score -= 50;
  } else if (travelers > capacity * 0.8) {
    issues.push(`Your vehicle will be near full capacity — consider a larger option for comfort`);
    score -= 20;
  }

  if (vehicleType === "motorcycle" && travelers > 1) {
    issues.push("Motorcycles are only practical for 1-2 people with minimal luggage");
    score -= 30;
  }
  if (vehicleType === "sports_car" && travelers > 2) {
    issues.push("Sports cars are typically only comfortable for 2 passengers");
    score -= 30;
  }

  const recommendations: VehicleCheckResponse["recommendations"] = [];

  if (travelers > 2 && (vehicleType === "motorcycle" || vehicleType === "sports_car")) {
    recommendations.push({
      vehicleType: "sedan",
      reason: "Comfortable for up to 5 passengers with good fuel economy",
      capacity: 5,
      features: VEHICLE_DATA.sedan.features,
    });
  }
  if (travelers > 5) {
    recommendations.push({
      vehicleType: "minivan",
      reason: "Best option for large groups — seats up to 8 with plenty of luggage space",
      capacity: 8,
      features: VEHICLE_DATA.minivan.features,
    });
  }
  if (travelers > 2 && travelers <= 7 && vehicleType !== "suv") {
    recommendations.push({
      vehicleType: "suv",
      reason: "Great balance of passenger space, cargo room, and road trip comfort",
      capacity: 7,
      features: VEHICLE_DATA.suv.features,
    });
  }
  if (travelers > 4) {
    recommendations.push({
      vehicleType: "rv",
      reason: "Perfect for the ultimate road trip — includes sleeping, kitchen, and bathroom",
      capacity: 8,
      features: VEHICLE_DATA.rv.features,
    });
  }

  const suitable = score >= 70;
  const message = suitable
    ? `Your ${vehicleType} is a ${score >= 90 ? "great" : "good"} choice for ${travelers} traveler${travelers > 1 ? "s" : ""}!`
    : `Your ${vehicleType} may not be ideal for ${travelers} traveler${travelers > 1 ? "s" : ""}. Consider one of the alternatives below.`;

  return { suitable, suitabilityScore: Math.max(0, score), issues, recommendations, message };
}

function timeStr(dt: Date): string {
  return dt.toISOString();
}

function isOpenAtTime(openHours: string, dt: Date): boolean {
  const hour = dt.getHours();
  const min = dt.getMinutes();
  const time = hour * 60 + min;

  const parse = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const ranges = openHours.split(",").map((r) => r.trim());
  for (const range of ranges) {
    const [start, end] = range.split("-").map((s) => parse(s.trim()));
    if (time >= start && time <= end) return true;
  }
  return false;
}

export function generateTripPlan(req: TripPlanRequest): TripPlanResponse {
  const startTime = parseISO(req.startTime);
  const isScenic = req.preferences?.includes("scenic");

  const fastestDriveMinutes = 270;
  const scenicDriveMinutes = 360;
  const balancedDriveMinutes = 315;

  const routes: Route[] = [
    {
      id: "fastest",
      name: "Fastest Route",
      type: "fastest",
      duration: "4h 30m",
      distance: "285 miles",
      highlights: ["Interstate highways", "Minimal stops", "Fastest arrival"],
      description: `Take the most direct interstate route from ${req.startLocation} to ${req.destination}. Best for late departures or when time matters most.`,
    },
    {
      id: "scenic",
      name: "Scenic Route",
      type: "scenic",
      duration: "6h 0m",
      distance: "340 miles",
      highlights: ["Mountain passes", "Coastal views", "Historic towns", "Photo opportunities"],
      description: `Wind through scenic byways and charming small towns on this breathtaking route. Ideal for travelers who enjoy the journey as much as the destination.`,
    },
    {
      id: "balanced",
      name: "Balanced Route",
      type: "balanced",
      duration: "5h 15m",
      distance: "310 miles",
      highlights: ["Mix of highway and scenic roads", "Key attractions", "Good meal options"],
      description: `The best of both worlds — efficient travel with several worthwhile detours for attractions and meals. Recommended for most travelers.`,
    },
  ];

  const driveMinutes = isScenic ? scenicDriveMinutes : balancedDriveMinutes;
  const selectedRoute = routes.find((r) => r.id === (isScenic ? "scenic" : "balanced"));
  const arrivalTime = addMinutes(startTime, driveMinutes + 90);

  const stop1Time = addMinutes(startTime, 60);
  const stop2Time = addMinutes(startTime, 150);
  const stop3Time = addMinutes(startTime, 220);

  const stops: Stop[] = [
    {
      id: "stop-1",
      name: "Mountain Vista Overlook",
      type: "viewpoint",
      description: "A stunning panoramic viewpoint offering sweeping views of the valley below. Perfect for photos and a quick stretch.",
      estimatedArrivalTime: timeStr(stop1Time),
      estimatedStopDuration: "30 min",
      distanceFromStart: "65 miles",
      mustVisit: true,
      openHours: "0:00-24:00",
      isOpen: isOpenAtTime("0:00-24:00", stop1Time),
      coordinates: { lat: 37.5, lng: -119.5 },
    },
    {
      id: "stop-2",
      name: "Pioneer Heritage Museum",
      type: "landmark",
      description: "An award-winning museum showcasing the rich pioneer history of the region. Features interactive exhibits and local artifacts.",
      estimatedArrivalTime: timeStr(stop2Time),
      estimatedStopDuration: "1 hour",
      distanceFromStart: "145 miles",
      mustVisit: true,
      openHours: "9:00-17:00",
      isOpen: isOpenAtTime("9:00-17:00", stop2Time),
      coordinates: { lat: 37.8, lng: -120.1 },
    },
    {
      id: "stop-3",
      name: "Riverside State Park",
      type: "attraction",
      description: "A beautiful state park with hiking trails, a river for wading, and picnic areas. Great for families and nature lovers.",
      estimatedArrivalTime: timeStr(stop3Time),
      estimatedStopDuration: "45 min",
      distanceFromStart: "210 miles",
      mustVisit: false,
      openHours: "7:00-20:00",
      isOpen: isOpenAtTime("7:00-20:00", stop3Time),
      coordinates: { lat: 38.1, lng: -120.6 },
    },
  ];

  const startHour = startTime.getHours();
  const mealRecommendations: MealStop[] = [];

  if (startHour < 10) {
    const breakfastTime = addMinutes(startTime, 45);
    mealRecommendations.push({
      id: "meal-breakfast",
      name: "The Morning Roost Diner",
      mealType: "breakfast",
      cuisine: "American Diner",
      description: "A beloved local institution serving hearty breakfasts since 1958. Famous for fluffy pancakes and fresh-ground coffee.",
      estimatedArrivalTime: timeStr(breakfastTime),
      location: "Riverside Junction, 50 miles from start",
      priceRange: "$",
      openHours: "6:00-14:00",
      isOpen: isOpenAtTime("6:00-14:00", breakfastTime),
      mustTry: ["Blue Ribbon Pancakes", "Country Skillet Hash", "Fresh-squeezed OJ"],
      alternativeOptions: [
        { name: "Highway Perk Coffee", cuisine: "Cafe", priceRange: "$", openHours: "5:30-15:00", reason: "Opens earlier, great for grab-and-go" },
        { name: "Sunrise Bakery", cuisine: "Bakery", priceRange: "$", openHours: "7:00-13:00", reason: "Famous fresh pastries and local honey" },
      ],
    });
  }

  const lunchTime = addMinutes(startTime, 160);
  mealRecommendations.push({
    id: "meal-lunch",
    name: "The Trailhead Bistro",
    mealType: "lunch",
    cuisine: "Farm-to-Table American",
    description: "A charming bistro sourcing ingredients from local farms. Perfect pit stop with a shaded outdoor patio.",
    estimatedArrivalTime: timeStr(lunchTime),
    location: "Cedar Falls, 155 miles from start",
    priceRange: "$$",
    openHours: "11:00-16:00",
    isOpen: isOpenAtTime("11:00-16:00", lunchTime),
    mustTry: ["Harvest Bowl", "Smoked Brisket Sandwich", "Locally-brewed Root Beer"],
    alternativeOptions: [
      { name: "Cedar Falls Market", cuisine: "Deli", priceRange: "$", openHours: "8:00-20:00", reason: "Grab picnic supplies for the state park stop" },
      { name: "Mama Rosa's Cantina", cuisine: "Mexican", priceRange: "$", openHours: "10:30-21:00", reason: "Consistently rated best tacos on the route" },
    ],
  });

  if (driveMinutes > 240) {
    const dinnerTime = addMinutes(startTime, driveMinutes + 30);
    mealRecommendations.push({
      id: "meal-dinner",
      name: "Summit House Restaurant",
      mealType: "dinner",
      cuisine: "Contemporary American",
      description: "A celebrated destination restaurant near your arrival point. Seasonal menu with breathtaking views — book ahead if possible.",
      estimatedArrivalTime: timeStr(dinnerTime),
      location: `Near ${req.destination}`,
      priceRange: "$$$",
      openHours: "17:00-22:00",
      isOpen: isOpenAtTime("17:00-22:00", dinnerTime),
      mustTry: ["Dry-Aged Ribeye", "Wild Mushroom Risotto", "Craft Cocktails"],
      alternativeOptions: [
        { name: "The Local Tap", cuisine: "Pub Food", priceRange: "$$", openHours: "16:00-23:00", reason: "Great burgers, local craft beers, no reservation needed" },
        { name: "Golden Dragon", cuisine: "Chinese", priceRange: "$$", openHours: "17:00-22:30", reason: "Authentic dim sum, perfect for groups" },
      ],
    });
  }

  return {
    routes,
    selectedRoute,
    stops,
    mealRecommendations,
    estimatedArrival: timeStr(arrivalTime),
    totalDistance: selectedRoute?.distance ?? "310 miles",
    summary: `Your road trip from ${req.startLocation} to ${req.destination} will take approximately ${selectedRoute?.duration ?? "5h 15m"} of driving with ${stops.length} stops along the way. You'll cover ${selectedRoute?.distance ?? "310 miles"} and arrive around ${format(arrivalTime, "h:mm a")}.`,
  };
}

export function adjustTripPlan(req: TripAdjustRequest): TripPlanResponse {
  const { originalRequest, delayMinutes } = req;
  const plan = generateTripPlan(originalRequest);

  const shiftStop = (stop: Stop): Stop => {
    const newArrival = addMinutes(parseISO(stop.estimatedArrivalTime), delayMinutes);
    const newIsOpen = stop.openHours ? isOpenAtTime(stop.openHours, newArrival) : true;

    if (!newIsOpen && stop.openHours) {
      return {
        ...stop,
        estimatedArrivalTime: newArrival.toISOString(),
        isOpen: false,
        description: `[CLOSED at updated arrival time] ${stop.description}. Consider visiting a nearby open attraction instead.`,
      };
    }
    return { ...stop, estimatedArrivalTime: newArrival.toISOString(), isOpen: newIsOpen };
  };

  const shiftMeal = (meal: MealStop): MealStop => {
    const newArrival = addMinutes(parseISO(meal.estimatedArrivalTime), delayMinutes);
    const newIsOpen = meal.openHours ? isOpenAtTime(meal.openHours, newArrival) : true;

    if (!newIsOpen) {
      const alt = meal.alternativeOptions?.[0];
      if (alt) {
        const altOpenHours = alt.openHours;
        const altIsOpen = altOpenHours ? isOpenAtTime(altOpenHours, newArrival) : true;
        if (altIsOpen) {
          return {
            ...meal,
            id: `${meal.id}-alt`,
            name: alt.name,
            cuisine: alt.cuisine,
            priceRange: alt.priceRange as "$" | "$$" | "$$$",
            openHours: alt.openHours,
            isOpen: true,
            estimatedArrivalTime: newArrival.toISOString(),
            description: `[Switched from ${meal.name} — now closed] ${alt.reason}`,
            mustTry: meal.mustTry,
            alternativeOptions: meal.alternativeOptions?.slice(1),
          };
        }
      }
      return {
        ...meal,
        estimatedArrivalTime: newArrival.toISOString(),
        isOpen: false,
        description: `[CLOSED at updated arrival time] ${meal.description}. Check the alternatives below.`,
      };
    }
    return { ...meal, estimatedArrivalTime: newArrival.toISOString(), isOpen: newIsOpen };
  };

  const newArrival = addMinutes(parseISO(plan.estimatedArrival), delayMinutes);

  return {
    ...plan,
    stops: plan.stops.map(shiftStop),
    mealRecommendations: plan.mealRecommendations.map(shiftMeal),
    estimatedArrival: newArrival.toISOString(),
    summary: `[Updated after ${delayMinutes}-minute delay] ${plan.summary} Some stops or meals may have been replaced with open alternatives.`,
  };
}
