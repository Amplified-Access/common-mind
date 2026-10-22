// The civic categories items are tagged with; mirrors web/components/civic/data.ts.
const categoryLabels: Record<string, string> = {
  "community-problems": "Community concerns",
  "public-services": "Public services",
  "local-government": "Local government",
  elections: "Elections",
  accountability: "Public accountability",
  priorities: "Community priorities",
  rights: "Civic rights",
  "public-meetings": "Public meetings",
  promises: "Political commitments",
  development: "Local development",
  feedback: "Citizen feedback",
};

export const categoryLabel = (id: string) => categoryLabels[id] ?? id;
