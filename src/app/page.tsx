import { getAllLocations } from "@/lib/locations";
import LocationFilters from "@/app/components/LocationFilters";

export default function Home() {
  const locations = getAllLocations();
  return <LocationFilters locations={locations} />;
}
