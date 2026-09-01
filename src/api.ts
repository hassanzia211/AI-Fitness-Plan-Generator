import type { Assessment, Plan, User } from './types';

const REGISTER_URL = import.meta.env.VITE_REGISTER_WEBHOOK_URL?.trim() || '';
const LOGIN_URL = import.meta.env.VITE_LOGIN_WEBHOOK_URL?.trim() || '';
const FITNESS_URL = import.meta.env.VITE_FITNESS_WEBHOOK_URL?.trim() || '';

export const backendConfigured = Boolean(REGISTER_URL && LOGIN_URL && FITNESS_URL);

async function postJson(url: string, body: unknown, label: string) {
  if (!url) throw new Error(`${label} webhook is not configured.`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Could not reach the ${label.toLowerCase()} service.`);
  }

  const raw = await response.text();
  let data: any;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }

  if (!response.ok) throw new Error(data?.message || `${label} failed (${response.status}).`);
  if (String(data?.status || '').toLowerCase() !== 'success') {
    throw new Error(data?.message || `${label} failed.`);
  }
  return data;
}

export async function register(fullName: string, email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await postJson(
    REGISTER_URL,
    { fullName: fullName.trim(), email: normalizedEmail, password },
    'Registration',
  );
  if (!data.userId) throw new Error('Registration succeeded without a userId.');
  return { id: String(data.userId), fullName: fullName.trim(), email: normalizedEmail };
}

export async function login(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await postJson(LOGIN_URL, { email: normalizedEmail, password }, 'Login');
  const user = data.user || {};
  if (!user.userId) throw new Error('Login succeeded without a userId.');
  return {
    id: String(user.userId),
    fullName: String(user.fullName || normalizedEmail.split('@')[0]),
    email: String(user.email || normalizedEmail),
  };
}

function buildPresentationPlan(assessment: Assessment, planId: string, aiNarrative: string): Plan {
  const activityFactor: Record<string, number> = {
    Sedentary: 1.2,
    'Lightly active': 1.375,
    'Lightly Active': 1.375,
    'Moderately active': 1.55,
    'Moderately Active': 1.55,
    'Very active': 1.725,
    'Very Active': 1.725,
  };
  const factor = activityFactor[assessment.activityLevel] || 1.4;
  const base = 10 * assessment.weight + 6.25 * assessment.height - 5 * assessment.age + (assessment.gender === 'Female' ? -161 : 5);
  let calories = Math.round(base * factor);
  if (/loss/i.test(assessment.fitnessGoal)) calories = Math.round(calories * 0.82);
  if (/gain|muscle/i.test(assessment.fitnessGoal)) calories = Math.round(calories * 1.1);
  const protein = Math.round(assessment.weight * (/loss|muscle|strength/i.test(assessment.fitnessGoal) ? 2.0 : 1.7));
  const trainingDays = /very/i.test(assessment.activityLevel) ? 5 : /moderately/i.test(assessment.activityLevel) ? 4 : 3;

  return {
    id: planId,
    userId: assessment.userId,
    createdAt: new Date().toLocaleDateString(),
    goal: assessment.fitnessGoal,
    calorieTarget: calories,
    proteinTarget: protein,
    trainingDays,
    aiNarrative,
    assessment,
  };
}

export async function generatePlan(assessment: Assessment): Promise<Plan> {
  const data = await postJson(FITNESS_URL, assessment, 'Fitness plan generation');
  if (!data.planId || !data.fitnessPlan) {
    throw new Error('Fitness workflow returned an incomplete plan response.');
  }
  return buildPresentationPlan(assessment, String(data.planId), String(data.fitnessPlan));
}
