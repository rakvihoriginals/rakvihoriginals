import { fetchHomepage4CategoriesLatest, Homepage4Categories } from "@/lib/fetchProducts";
import HomeClient from "./HomeClient";

// Revalidate homepage categories every 60 seconds (ISR)
export const revalidate = 60;

export default async function Home() {
    let initialCategories: Homepage4Categories = {
        handbags: [],
        footwear: [],
        belts: [],
        stoles: [],
    };

    try {
        initialCategories = await fetchHomepage4CategoriesLatest(8);
    } catch (error) {
        console.error("Error pre-fetching homepage products on server:", error);
    }

    return <HomeClient initialCategories={initialCategories} />;
}
