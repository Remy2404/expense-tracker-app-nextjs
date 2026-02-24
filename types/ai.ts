export type AiInputSource = 'text' | 'voice' | 'receipt_image';
export type AiModelSource = 'gemini' | 'memory' | 'gemini_vision';
export type AiInsightType = 'daily' | 'weekly' | 'monthly';
export type AiRiskConfidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface AiParseRequest {
  raw_text: string;
  source: AiInputSource;
}

export interface AiParseResponse {
  amount: number | null;
  currency: string | null;
  merchant: string | null;
  date: string | null;
  note: string | null;
  suggested_category_id: string | null;
  confidence: number;
  source: AiModelSource;
  needs_confirmation: boolean;
  gemini_model: string;
  safety_warnings: string[];
}

export interface AiCategorizeRequest {
  expense_id?: string;
  merchant: string;
  note?: string;
}

export interface AiCategorizeResponse {
  category_id: string;
  confidence: number;
  source: 'memory' | 'gemini';
  reason: string;
  needs_confirmation: boolean;
  safety_warnings: string[];
}

export interface AiCorrectRequest {
  expense_id?: string;
  original_category_id?: string;
  corrected_category_id: string;
  merchant: string;
  original_amount?: number;
  corrected_amount?: number;
  original_merchant?: string;
  corrected_merchant?: string;
  correction_reason?: string;
  correction_source?: string;
  confirm_amount_change: boolean;
}

export interface AiCorrectResponse {
  memory_updated: boolean;
  new_override_count: number;
  confidence: number;
  learning_summary?: string | null;
  learned_merchant?: string | null;
  needs_confirmation: boolean;
  safety_warnings: string[];
}

export interface AiChatRequest {
  question: string;
  history?: AiChatHistoryItem[];
  timezone?: string;
  local_now_iso?: string;
  image_present?: boolean;
  attachment_base64?: string;
  attachment_mime?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface AiChatHistoryItem {
  role: AiChatRole;
  content: string;
}

export type AiChatIntent = 'none' | 'add_expense' | 'query_expenses';

export interface AiChatActionPayload {
  amount: number | null;
  category: string | null;
  note: string | null;
  date: string | null;
  merchant: string | null;
}

export interface AiChatExplainability {
  summary: string;
  factors: string[];
  correction_tip: string | null;
}

export interface AiChatSuggestedAction {
  id: string;
  label: string;
  prompt: string;
  icon: string | null;
}

export interface AiChatResponse {
  answer: string;
  query_used: string;
  data_points: number;
  confidence: number;
  intent: AiChatIntent;
  silent_action: boolean;
  payload: AiChatActionPayload | null;
  explainability: AiChatExplainability | null;
  suggested_actions: AiChatSuggestedAction[];
  needs_confirmation: boolean;
  safety_warnings: string[];
  field_confidences?: Record<string, number> | null;
}

export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessage {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: number;
  explainability?: AiChatExplainability | null;
  field_confidences?: Record<string, number> | null;
}

export interface AiInsightHighlight {
  category: string;
  change_pct: number;
  direction: 'up' | 'down';
}

export interface AiInsightPeriod {
  start: string;
  end: string;
}

export interface AiInsightsResponse {
  insight_type: AiInsightType;
  period: AiInsightPeriod;
  summary: string;
  highlights: AiInsightHighlight[];
  confidence: number;
  needs_confirmation: boolean;
  safety_warnings: string[];
}

export interface AiForecastRiskCategory {
  category: string;
  reason: string;
}

export interface AiForecastResponse {
  estimated_month_total: number;
  estimated_savings: number;
  risk_categories: AiForecastRiskCategory[];
  data_confidence: AiRiskConfidence;
  days_of_data: number;
  confidence: number;
  disclaimer: string;
  needs_confirmation: boolean;
  safety_warnings: string[];
}

export type AiParseState = 'idle' | 'parsing' | 'preview' | 'confirmation_required' | 'error';

export interface AiApiError {
  message: string;
  status?: number;
  details?: string;
}

export interface AiScenarioDelta {
  category: string;
  change_pct: number;
  direction: 'increase' | 'decrease';
}

export interface AiScenarioRequest {
  category: string;
  change_pct: number;
  direction: 'increase' | 'decrease';
  months_ahead?: number;
}

export interface AiScenarioResult {
  baseline_monthly: number;
  projected_monthly: number;
  delta_amount: number;
  delta_pct: number;
  narrative: string;
  confidence: number;
  deltas: AiScenarioDelta[];
  needs_confirmation: boolean;
  safety_warnings: string[];
}

export type NudgeSeverity = 'info' | 'warning' | 'critical';

export interface Nudge {
  id: string;
  title: string;
  body: string;
  severity: NudgeSeverity;
  category?: string | null;
  action_label?: string | null;
  action_prompt?: string | null;
}

export interface NudgesResponse {
  nudges: Nudge[];
  generated_at: string;
}

export interface NudgePreferences {
  budgetRisk: boolean;
  spendingSpike: boolean;
  billReminder: boolean;
}
