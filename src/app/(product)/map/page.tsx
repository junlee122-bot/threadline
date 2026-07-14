import type { Metadata } from "next";
import { DependencyMap } from "@/components/map/dependency-map";

export const metadata: Metadata = {
  title: "System Map",
  description: "Explore service ownership, dependency direction, operational risk, and recent activity.",
};

export default function MapPage() {
  return <DependencyMap />;
}
