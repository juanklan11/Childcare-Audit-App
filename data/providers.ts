// /data/providers.ts
export type ProviderRow = {
  name: string;
  services: number;        // number of services/centres (seed values; update with official counts)
  states: string[];        // e.g., ["NSW","VIC","QLD"]
  auditNeed: "High" | "Medium" | "Low";
  priority: number;        // 1 = highest priority
};

// Seed data — replace with official counts from StartingBlocks “Large Providers”.
const providers: ProviderRow[] = [
  { name: "Goodstart Early Learning", services: 650, states: ["NSW","VIC","QLD","WA","SA","ACT","NT","TAS"], auditNeed: "High",   priority: 1 },
  { name: "G8 Education",             services: 430, states: ["NSW","VIC","QLD","WA","SA","ACT"],           auditNeed: "High",   priority: 2 },
  { name: "Busy Bees",                services: 200, states: ["NSW","VIC","QLD","WA","SA","ACT"],           auditNeed: "High",   priority: 3 },
  { name: "Affinity Education",       services: 190, states: ["NSW","VIC","QLD","WA","NT"],                 auditNeed: "High",   priority: 4 },
  { name: "Guardian Childcare",       services: 180, states: ["NSW","VIC","QLD","WA","SA","ACT"],           auditNeed: "Medium", priority: 5 },
  { name: "Only About Children",      services: 70,  states: ["NSW","VIC","QLD"],                           auditNeed: "Medium", priority: 6 },
  { name: "KU Children’s Services",   services: 120, states: ["NSW","VIC","ACT"],                           auditNeed: "Medium", priority: 7 },
  { name: "Green Leaves",             services: 50,  states: ["NSW","VIC","QLD","WA","SA"],                 auditNeed: "Medium", priority: 8 },
  { name: "Edge Early Learning",      services: 50,  states: ["QLD","NSW","VIC"],                           auditNeed: "Medium", priority: 9 },
  { name: "C&K",                      services: 330, states: ["QLD"],                                       auditNeed: "Medium", priority: 10 },
  { name: "Nido Early School",        services: 80,  states: ["NSW","VIC","QLD","WA","SA","ACT"],           auditNeed: "Low",    priority: 11 },
  { name: "Little Zak’s Academy",     services: 30,  states: ["NSW"],                                       auditNeed: "Low",    priority: 12 },
];

export default providers;
