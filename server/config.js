/* All settings come from environment variables (set them in Vercel → Settings →
 * Environment Variables, or in a local .env file). Read lazily so they are
 * always current. */

const num = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export const config = {
  get dailyScenarioLimit() {
    return num(process.env.DAILY_SCENARIO_LIMIT, 3);
  },
  get globalDailyAiCap() {
    return num(process.env.GLOBAL_DAILY_AI_CAP, 1200);
  },
  get sessionSecret() {
    return process.env.SESSION_SECRET || 'local-dev-secret-change-me';
  },
  get mockAi() {
    return process.env.MOCK_AI === 'true';
  },
  get geminiKey() {
    return process.env.GEMINI_API_KEY || '';
  },
  get geminiModel() {
    return process.env.GEMINI_MODEL || 'gemini-flash-latest';
  },
  get groqKey() {
    return process.env.GROQ_API_KEY || '';
  },
  get groqModel() {
    return process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  },
  get dashboardPassword() {
    return process.env.DASHBOARD_PASSWORD || '';
  },
  get supabaseUrl() {
    return (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  },
  get supabaseKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  },
  get useSupabase() {
    return Boolean(this.supabaseUrl && this.supabaseKey);
  },
};

// Bump when the grading prompts change, so results can be compared across versions.
export const PROMPT_VERSION = 'v1';
