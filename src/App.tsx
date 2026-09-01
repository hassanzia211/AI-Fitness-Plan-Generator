import { FormEvent, useEffect, useMemo, useState } from 'react';
import { backendConfigured, generatePlan, login, register } from './api';
import type { Assessment, Plan, User } from './types';

type View = 'home' | 'register' | 'login' | 'assessment' | 'generating' | 'dashboard';

const USER_KEY = 'baryalai_user';
const PLAN_KEY = 'baryalai_plan';

const goalOptions = ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness', 'Maintenance'];
const activityOptions = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const dietOptions = ['No Preference', 'High Protein', 'Vegetarian', 'Vegan', 'Other'];

function Brand() {
  return (
    <div className="brand" aria-label="Baryalai">
      <span className="mark">▲</span>
      <span>BARYALAI</span>
      <span className="pashto" dir="rtl">بریالی</span>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;
  return (
    <label className="field">
      <span>{label}</span>
      <input {...input} />
    </label>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      const storedPlan = localStorage.getItem(PLAN_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedPlan) setPlan(JSON.parse(storedPlan));
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PLAN_KEY);
    }
  }, []);

  const saveUser = (next: User) => {
    setUser(next);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  };

  const savePlan = (next: Plan) => {
    setPlan(next);
    localStorage.setItem(PLAN_KEY, JSON.stringify(next));
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PLAN_KEY);
    setUser(null);
    setPlan(null);
    setView('home');
  };

  const startAssessment = () => {
    setError('');
    setView(user ? 'assessment' : 'register');
  };

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <button className="brand-button" onClick={() => setView('home')}><Brand /></button>
        <nav>
          {user && <span className="user-chip">{user.fullName}</span>}
          {plan && <button className="link-btn" onClick={() => setView('dashboard')}>My plan</button>}
          {user ? (
            <button className="ghost-btn" onClick={logout}>Sign out</button>
          ) : (
            <>
              <button className="link-btn" onClick={() => setView('login')}>Sign in</button>
              <button className="gold-btn small" onClick={() => setView('register')}>Create account</button>
            </>
          )}
        </nav>
      </header>

      {!backendConfigured && (
        <div className="config-banner no-print">
          Backend not configured. Copy <code>.env.example</code> to <code>.env.local</code> and add the three production n8n webhook URLs.
        </div>
      )}

      <main>
        {view === 'home' && <Home onStart={startAssessment} onLogin={() => setView('login')} />}
        {view === 'register' && <RegisterView onSuccess={(next) => { saveUser(next); setView('assessment'); }} onLogin={() => setView('login')} />}
        {view === 'login' && <LoginView onSuccess={(next) => { saveUser(next); setView(plan ? 'dashboard' : 'assessment'); }} onRegister={() => setView('register')} />}
        {view === 'assessment' && user && (
          <AssessmentView
            user={user}
            error={error}
            onSubmit={async (assessment) => {
              setError('');
              setView('generating');
              try {
                const next = await generatePlan(assessment);
                savePlan(next);
                setView('dashboard');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Plan generation failed.');
                setView('assessment');
              }
            }}
          />
        )}
        {view === 'generating' && <GeneratingView />}
        {view === 'dashboard' && plan && user && <Dashboard user={user} plan={plan} onNewPlan={() => setView('assessment')} />}
      </main>

      <footer className="footer no-print">
        <Brand />
        <span>Discipline • Patience • Progress</span>
      </footer>
    </div>
  );
}

function Home({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <section className="hero page">
      <div className="hero-copy">
        <span className="eyebrow">PERSONAL PERFORMANCE SYSTEM</span>
        <h1>Built from where you are.<br /><em>Designed for where you're going.</em></h1>
        <p className="lead">A focused training and nutrition experience powered by your real profile, n8n automation, and an AI-generated coaching plan.</p>
        <div className="hero-actions">
          <button className="gold-btn" onClick={onStart}>Build my plan</button>
          <button className="ghost-btn" onClick={onLogin}>I already have an account</button>
        </div>
      </div>
      <div className="hero-panel">
        <div className="mountain">▲</div>
        <div className="metric"><span>01</span><strong>Authenticate</strong><small>Registration + Login through n8n</small></div>
        <div className="metric"><span>02</span><strong>Assess</strong><small>Body, goal, activity, diet</small></div>
        <div className="metric"><span>03</span><strong>Generate</strong><small>OpenAI fitness plan via n8n</small></div>
      </div>
      <div className="values-grid">
        <article><span>ثبات</span><h3>Consistency</h3><p>Systems beat short bursts of motivation.</p></article>
        <article><span>صبر</span><h3>Patience</h3><p>Progress compounds when the process is respected.</p></article>
        <article><span>بریا</span><h3>Victory</h3><p>Baryalai means successful — earned through disciplined action.</p></article>
      </div>
    </section>
  );
}

function RegisterView({ onSuccess, onLogin }: { onSuccess: (user: User) => void; onLogin: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get('fullName') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    const confirm = String(fd.get('confirm') || '');
    if (!fullName || !email || !password) return setMessage('Complete all fields.');
    if (password.length < 8) return setMessage('Password must be at least 8 characters.');
    if (password !== confirm) return setMessage('Passwords do not match.');
    try {
      setBusy(true);
      onSuccess(await register(fullName, email, password));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your Baryalai profile" subtitle="Your account is created by the n8n registration workflow.">
      <form onSubmit={submit} className="form-grid">
        <Field label="Full name" name="fullName" autoComplete="name" />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" />
        {message && <p className="form-error">{message}</p>}
        <button className="gold-btn full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already registered? <button onClick={onLogin}>Sign in</button></p>
    </AuthCard>
  );
}

function LoginView({ onSuccess, onRegister }: { onSuccess: (user: User) => void; onRegister: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    const fd = new FormData(e.currentTarget);
    try {
      setBusy(true);
      onSuccess(await login(String(fd.get('email') || ''), String(fd.get('password') || '')));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Credentials are verified by the n8n login workflow.">
      <form onSubmit={submit} className="form-grid">
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
        {message && <p className="form-error">{message}</p>}
        <button className="gold-btn full" disabled={busy}>{busy ? 'Authenticating…' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">Need an account? <button onClick={onRegister}>Register</button></p>
    </AuthCard>
  );
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="auth-page page">
      <div className="auth-card">
        <Brand />
        <span className="eyebrow">SECURE ENTRY</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

function AssessmentView({ user, error, onSubmit }: { user: User; error: string; onSubmit: (assessment: Assessment) => void }) {
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [gender, setGender] = useState('Male');
  const [fitnessGoal, setGoal] = useState('Strength');
  const [activityLevel, setActivity] = useState('Moderately Active');
  const [dietaryPreference, setDiet] = useState('No Preference');
  const [medicalConditions, setMedical] = useState('None');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (age < 14 || age > 95) return;
    if (height < 100 || height > 240 || weight < 35 || weight > 250) return;
    onSubmit({ userId: user.id, age, gender, height, weight, fitnessGoal, activityLevel, dietaryPreference, medicalConditions: medicalConditions.trim() || 'None' });
  }

  return (
    <section className="assessment page">
      <div className="section-head"><span className="eyebrow">ATHLETE PROFILE</span><h2>Build your performance baseline.</h2><p>These exact values are sent to the fitness n8n webhook.</p></div>
      <form className="assessment-card" onSubmit={submit}>
        <div className="three-col">
          <Field label="Age" type="number" min={14} max={95} value={age} onChange={(e) => setAge(Number(e.target.value))} />
          <Field label="Height (cm)" type="number" min={100} max={240} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          <Field label="Weight (kg)" type="number" min={35} max={250} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </div>
        <SelectField label="Gender" value={gender} onChange={setGender} options={['Male', 'Female', 'Prefer not to say']} />
        <SelectField label="Primary goal" value={fitnessGoal} onChange={setGoal} options={goalOptions} />
        <SelectField label="Activity level" value={activityLevel} onChange={setActivity} options={activityOptions} />
        <SelectField label="Dietary preference" value={dietaryPreference} onChange={setDiet} options={dietOptions} />
        <label className="field"><span>Medical conditions / notes</span><textarea value={medicalConditions} onChange={(e) => setMedical(e.target.value)} rows={4} /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="gold-btn full">Generate my Baryalai plan</button>
      </form>
    </section>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
  );
}

function GeneratingView() {
  return (
    <section className="generating page">
      <div className="pulse-ring"><span>▲</span></div>
      <span className="eyebrow">N8N + OPENAI</span>
      <h2>Building your plan…</h2>
      <p>The app is waiting for the live workflow response. It will not fabricate a plan if the backend fails.</p>
      <div className="progress"><span /></div>
    </section>
  );
}

function Dashboard({ user, plan, onNewPlan }: { user: User; plan: Plan; onNewPlan: () => void }) {
  const lines = useMemo(() => plan.aiNarrative.split('\n').filter(Boolean), [plan.aiNarrative]);
  return (
    <section className="dashboard page print-area">
      <div className="dashboard-head">
        <div><span className="eyebrow">ACTIVE PERFORMANCE SYSTEM</span><h2>{user.fullName}'s plan</h2><p>{plan.goal} · Plan {plan.id}</p></div>
        <div className="dashboard-actions no-print"><button className="ghost-btn" onClick={onNewPlan}>New assessment</button><button className="gold-btn small" onClick={() => window.print()}>Print / Save PDF</button></div>
      </div>
      <div className="stats-grid">
        <Stat label="Daily calories" value={`${plan.calorieTarget}`} unit="kcal" />
        <Stat label="Protein target" value={`${plan.proteinTarget}`} unit="g/day" />
        <Stat label="Training cadence" value={`${plan.trainingDays}`} unit="days/week" />
        <Stat label="Activity" value={plan.assessment.activityLevel} />
      </div>
      <div className="profile-strip">
        <span>{plan.assessment.age} years</span><span>{plan.assessment.height} cm</span><span>{plan.assessment.weight} kg</span><span>{plan.assessment.dietaryPreference}</span>
      </div>
      <article className="ai-plan">
        <div className="ai-plan-title"><div><span className="eyebrow">AI COACHING BRIEF</span><h3>Your personalized training & nutrition plan</h3></div><span className="verified">LIVE N8N RESPONSE</span></div>
        <div className="narrative">{lines.map((line, i) => <p key={`${i}-${line.slice(0, 16)}`} className={/^\d+[).]|^[A-Z][A-Za-z /&-]+:$/.test(line) ? 'narrative-heading' : ''}>{line}</p>)}</div>
      </article>
      <aside className="philosophy"><span className="pashto large" dir="rtl">بریالی</span><div><strong>Victory through disciplined repetition.</strong><p>Keep the plan practical, track progress, and adjust with evidence instead of emotion.</p></div></aside>
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong>{unit && <small>{unit}</small>}</div>;
}
