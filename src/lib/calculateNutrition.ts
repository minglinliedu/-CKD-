export type Gender = 'male' | 'female';
export type ActivityIntensity = 'light' | 'moderate' | 'heavy';

export interface PatientData {
  gender: Gender;
  age: number;
  weight: number;
  ckdStage: number;
  isDialysis: boolean;
  activityIntensity: ActivityIntensity;
}

export interface NutritionResult {
  totalEnergy: number;
  totalProtein: number;
  highQualityProtein: number;
  mealSuggestion: string;
}

export function calculateNutrition(data: PatientData): NutritionResult {
  const { gender, age, weight, isDialysis, activityIntensity } = data;

  // Calculate Energy (kcal/kg)
  let energyPerKg = 0;
  if (age >= 1 && age <= 3) {
    energyPerKg = 90;
  } else if (age >= 4 && age <= 10) {
    energyPerKg = 70;
  } else if (age >= 11 && age <= 14) {
    energyPerKg = gender === 'male' ? 55 : 47;
  } else if (age >= 15 && age <= 18) {
    energyPerKg = gender === 'male' ? 45 : 40;
  } else {
    // Default fallback
    energyPerKg = 40;
  }

  let totalEnergy = energyPerKg * weight;
  if (activityIntensity === 'moderate') {
    totalEnergy *= 1.2;
  } else if (activityIntensity === 'heavy') {
    totalEnergy *= 1.4; // Assuming heavy uses 1.4 multiplier
  }

  // Calculate Protein (g/kg)
  let proteinPerKg = 0;
  if (isDialysis) {
    proteinPerKg = 1.8;
  } else {
    if (age >= 1 && age <= 3) {
      proteinPerKg = 1.1;
    } else if (age >= 4 && age <= 10) {
      proteinPerKg = 0.9;
    } else if (age >= 11 && age <= 18) {
      proteinPerKg = 0.85;
    } else {
      // Default fallback
      proteinPerKg = 0.8;
    }
  }

  const totalProtein = proteinPerKg * weight;
  const highQualityProtein = totalProtein * 0.6;

  let mealSuggestion = "";
  if (isDialysis) {
    mealSuggestion = "建议增加优质蛋白质摄入（如瘦肉、鱼、蛋、奶），以弥补透析造成的丢失，同时注意控制水和电解质。";
  } else {
    mealSuggestion = "建议优先选择优质蛋白食物，避免过多的植物蛋白以减轻肾脏代谢负担，碳水化合物和脂肪需提供足够热量。";
  }

  return {
    totalEnergy: Math.round(totalEnergy),
    totalProtein: Number(totalProtein.toFixed(1)),
    highQualityProtein: Number(highQualityProtein.toFixed(1)),
    mealSuggestion
  };
}
