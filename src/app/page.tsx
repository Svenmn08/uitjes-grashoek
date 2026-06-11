import { getAllLocations } from "@/lib/locationData";
import LocationFilters from "@/app/components/LocationFilters";

export default function Home() {
  const locations = getAllLocations();
  return <LocationFilters locations={locations} />;
}
