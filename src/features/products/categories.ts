export type ProductCategoryOption = {
  label: string;
  value: string;
  subcategories: string[];
};

export const productCategoryTree: ProductCategoryOption[] = [
  {
    label: "Strength Equipment",
    value: "strength_equipment",
    subcategories: ["Dumbbells", "Barbells", "Kettlebells", "Weight Plates", "Benches", "Power Racks", "Smith Machines"],
  },
  {
    label: "Cardio Equipment",
    value: "cardio_equipment",
    subcategories: ["Treadmills", "Exercise Bikes", "Rowing Machines", "Ellipticals"],
  },
  {
    label: "Functional Training",
    value: "functional_training",
    subcategories: ["Battle Ropes", "Resistance Bands", "Medicine Balls", "Plyo Boxes", "Agility Ladders"],
  },
  {
    label: "Accessories",
    value: "accessories",
    subcategories: ["Gloves", "Belts", "Wrist Wraps", "Knee Sleeves", "Shaker Bottles", "Gym Bags"],
  },
  {
    label: "Supplements",
    value: "supplements",
    subcategories: ["Whey Protein", "Creatine", "Mass Gainers", "Pre-Workout", "BCAA / EAA", "Vitamins"],
  },
  {
    label: "Recovery & Mobility",
    value: "recovery_mobility",
    subcategories: ["Foam Rollers", "Massage Guns", "Mobility Bands", "Yoga Mats", "Recovery Boots"],
  },
];

export const legacyCategoryMap: Record<string, string> = {
  gym_equipment: "strength_equipment",
};

export const getCategoryOption = (category: string) =>
  productCategoryTree.find((option) => option.value === category) ||
  productCategoryTree.find((option) => option.value === legacyCategoryMap[category]);

export const getCategoryLabel = (category: string) => getCategoryOption(category)?.label || category;

export const getDefaultSubcategory = (category: string) => getCategoryOption(category)?.subcategories[0] || "";
