import { fetchOriginalHub } from "@/lib/fetchOriginalHub";
import OriginalHubPage from "./ProductListingClient";

export default async function Page() {
  const initialData = await fetchOriginalHub();
  return <OriginalHubPage initialData={initialData} />;
}
