export type User = {
  id: string;
  fullName: string;
  email: string;
};

export type Assessment = {
  userId: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  fitnessGoal: string;
  activityLevel: string;
  dietaryPreference: string;
  medicalConditions: string;
};

export type Plan = {
  id: string;
  userId: string;
  createdAt: string;
  goal: string;
  calorieTarget: number;
  proteinTarget: number;
  trainingDays: number;
  aiNarrative: string;
  assessment: Assessment;
};
