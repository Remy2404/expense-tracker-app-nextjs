import {
  AiCategorizeRequest,
  AiCategorizeResponse,
  AiChatHistoryResponse,
  AiChatRequest,
  AiChatResponse,
  AiCorrectRequest,
  AiCorrectResponse,
  AiForecastResponse,
  AiInsightType,
  AiInsightsResponse,
  AiParseRequest,
  AiParseResponse,
  AiScenarioRequest,
  AiScenarioResult,
  NudgesResponse,
  RealtimeSessionResponse,
} from '@/types/ai';
import { aiHttpClient, normalizeAiApiError } from './http';

type UnknownRecord = Record<string, unknown>;

const assertObject = (value: unknown, endpoint: string): UnknownRecord => {
  if (!value || typeof value !== 'object') {
    throw new Error(`Invalid ${endpoint} response payload.`);
  }
  return value as UnknownRecord;
};

const assertNumber = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (typeof payload[key] !== 'number') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a number.`);
  }
};

const assertString = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (typeof payload[key] !== 'string') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a string.`);
  }
};

const assertBoolean = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (typeof payload[key] !== 'boolean') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a boolean.`);
  }
};

const assertOptionalBoolean = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (payload[key] !== undefined && typeof payload[key] !== 'boolean') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a boolean when provided.`);
  }
};

const assertStringArray = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (!Array.isArray(payload[key]) || !payload[key].every((item) => typeof item === 'string')) {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a string array.`);
  }
};

const assertNullableNumber = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (payload[key] !== null && typeof payload[key] !== 'number') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a number or null.`);
  }
};

const assertNullableString = (payload: UnknownRecord, key: string, endpoint: string): void => {
  if (payload[key] !== null && typeof payload[key] !== 'string') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a string or null.`);
  }
};

const assertOptionalNullableString = (
  payload: UnknownRecord,
  key: string,
  endpoint: string
): void => {
  if (payload[key] === undefined) {
    payload[key] = null;
    return;
  }
  assertNullableString(payload, key, endpoint);
};

const assertOptionalNullableNumber = (
  payload: UnknownRecord,
  key: string,
  endpoint: string
): void => {
  if (payload[key] === undefined) {
    payload[key] = null;
    return;
  }
  assertNullableNumber(payload, key, endpoint);
};

const assertOptionalNullableBoolean = (
  payload: UnknownRecord,
  key: string,
  endpoint: string
): void => {
  if (payload[key] === undefined) {
    payload[key] = null;
    return;
  }
  if (payload[key] !== null && typeof payload[key] !== 'boolean') {
    throw new Error(`Invalid ${endpoint} response: "${key}" must be a boolean or null.`);
  }
};

const normalizeActionPayloadKeys = (rawPayload: unknown): unknown => {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return rawPayload;
  }

  const payload = rawPayload as UnknownRecord;
  return {
    ...payload,
    categoryType: payload.categoryType ?? payload.category_type ?? null,
    categoryId: payload.categoryId ?? payload.category_id ?? null,
    noteSummary: payload.noteSummary ?? payload.note_summary ?? null,
    totalAmount: payload.totalAmount ?? payload.total_amount ?? null,
    targetAmount: payload.targetAmount ?? payload.target_amount ?? null,
    currentAmount: payload.currentAmount ?? payload.current_amount ?? null,
    startDate: payload.startDate ?? payload.start_date ?? null,
    endDate: payload.endDate ?? payload.end_date ?? null,
    notificationEnabled: payload.notificationEnabled ?? payload.notification_enabled ?? null,
    notificationDaysBefore:
      payload.notificationDaysBefore ?? payload.notification_days_before ?? null,
  };
};

const assertNullableActionPayload = (rawPayload: unknown, endpoint: string): void => {
  if (rawPayload === null || rawPayload === undefined) {
    return;
  }
  const actionPayload = assertObject(normalizeActionPayloadKeys(rawPayload), endpoint);
  assertOptionalNullableString(actionPayload, 'kind', endpoint);
  assertOptionalNullableString(actionPayload, 'type', endpoint);
  assertNullableNumber(actionPayload, 'amount', endpoint);
  assertOptionalNullableString(actionPayload, 'currency', endpoint);
  assertNullableString(actionPayload, 'category', endpoint);
  assertOptionalNullableString(actionPayload, 'categoryType', endpoint);
  assertOptionalNullableString(actionPayload, 'categoryId', endpoint);
  assertNullableString(actionPayload, 'note', endpoint);
  assertOptionalNullableString(actionPayload, 'noteSummary', endpoint);
  assertNullableString(actionPayload, 'date', endpoint);
  assertOptionalNullableString(actionPayload, 'merchant', endpoint);
  assertOptionalNullableString(actionPayload, 'month', endpoint);
  assertOptionalNullableNumber(actionPayload, 'totalAmount', endpoint);
  assertOptionalNullableString(actionPayload, 'name', endpoint);
  assertOptionalNullableNumber(actionPayload, 'targetAmount', endpoint);
  assertOptionalNullableNumber(actionPayload, 'currentAmount', endpoint);
  assertOptionalNullableString(actionPayload, 'deadline', endpoint);
  assertOptionalNullableString(actionPayload, 'color', endpoint);
  assertOptionalNullableString(actionPayload, 'icon', endpoint);
  assertOptionalNullableString(actionPayload, 'frequency', endpoint);
  assertOptionalNullableString(actionPayload, 'startDate', endpoint);
  assertOptionalNullableString(actionPayload, 'endDate', endpoint);
  assertOptionalNullableBoolean(actionPayload, 'notificationEnabled', endpoint);
  assertOptionalNullableNumber(actionPayload, 'notificationDaysBefore', endpoint);
};

const assertSuggestedActions = (payload: UnknownRecord, endpoint: string): void => {
  const rawActions = payload.suggested_actions;
  if (rawActions === undefined) {
    payload.suggested_actions = [];
    return;
  }

  if (!Array.isArray(rawActions)) {
    throw new Error(`Invalid ${endpoint} response: "suggested_actions" must be an array.`);
  }

  rawActions.forEach((item) => {
    const actionPayload = assertObject(item, endpoint);
    assertString(actionPayload, 'id', endpoint);
    assertString(actionPayload, 'label', endpoint);
    assertString(actionPayload, 'prompt', endpoint);
    assertNullableString(actionPayload, 'icon', endpoint);
  });
};

const assertExplainability = (payload: UnknownRecord, endpoint: string): void => {
  const rawExplainability = payload.explainability;
  if (rawExplainability === undefined || rawExplainability === null) {
    payload.explainability = null;
    return;
  }

  const explainabilityPayload = assertObject(rawExplainability, endpoint);
  assertString(explainabilityPayload, 'summary', endpoint);

  const factors = explainabilityPayload.factors;
  if (factors === undefined) {
    explainabilityPayload.factors = [];
  } else if (
    !Array.isArray(factors) ||
    !factors.every((item) => typeof item === 'string')
  ) {
    throw new Error(`Invalid ${endpoint} response: \"factors\" must be a string array.`);
  }

  assertOptionalNullableString(explainabilityPayload, 'correction_tip', endpoint);
};

const assertNudgeActions = (payload: UnknownRecord, endpoint: string): void => {
  const rawActions = payload.actions;
  if (rawActions === undefined) {
    payload.actions = [];
    return;
  }

  if (!Array.isArray(rawActions)) {
    throw new Error(`Invalid ${endpoint} response: "actions" must be an array.`);
  }

  rawActions.forEach((item) => {
    const actionPayload = assertObject(item, endpoint);
    assertString(actionPayload, 'id', endpoint);
    assertString(actionPayload, 'label', endpoint);
    assertString(actionPayload, 'action', endpoint);
  });
};

const validateParse = (data: unknown): AiParseResponse => {
  const payload = assertObject(data, '/api/ai/parse');
  assertNumber(payload, 'confidence', '/api/ai/parse');
  assertBoolean(payload, 'needs_confirmation', '/api/ai/parse');
  assertString(payload, 'gemini_model', '/api/ai/parse');
  assertStringArray(payload, 'safety_warnings', '/api/ai/parse');
  return payload as unknown as AiParseResponse;
};

const validateCategorize = (data: unknown): AiCategorizeResponse => {
  const payload = assertObject(data, '/api/ai/categorize');
  assertString(payload, 'category_id', '/api/ai/categorize');
  assertNumber(payload, 'confidence', '/api/ai/categorize');
  assertString(payload, 'reason', '/api/ai/categorize');
  assertBoolean(payload, 'needs_confirmation', '/api/ai/categorize');
  assertStringArray(payload, 'safety_warnings', '/api/ai/categorize');
  return payload as unknown as AiCategorizeResponse;
};

const validateCorrect = (data: unknown): AiCorrectResponse => {
  const payload = assertObject(data, '/api/ai/correct');
  assertBoolean(payload, 'memory_updated', '/api/ai/correct');
  assertNumber(payload, 'new_override_count', '/api/ai/correct');
  assertNumber(payload, 'confidence', '/api/ai/correct');
  assertOptionalNullableString(payload, 'learning_summary', '/api/ai/correct');
  assertOptionalNullableString(payload, 'learned_merchant', '/api/ai/correct');
  assertBoolean(payload, 'needs_confirmation', '/api/ai/correct');
  assertStringArray(payload, 'safety_warnings', '/api/ai/correct');
  return payload as unknown as AiCorrectResponse;
};

const validateChat = (data: unknown): AiChatResponse => {
  const payload = assertObject(data, '/api/ai/chat');
  assertString(payload, 'answer', '/api/ai/chat');
  assertString(payload, 'query_used', '/api/ai/chat');
  assertNumber(payload, 'data_points', '/api/ai/chat');
  assertNumber(payload, 'confidence', '/api/ai/chat');
  assertString(payload, 'intent', '/api/ai/chat');
  assertBoolean(payload, 'silent_action', '/api/ai/chat');
  assertBoolean(payload, 'needs_confirmation', '/api/ai/chat');
  assertOptionalBoolean(payload, 'image_present', '/api/ai/chat');
  assertStringArray(payload, 'safety_warnings', '/api/ai/chat');
  assertExplainability(payload, '/api/ai/chat');
  assertSuggestedActions(payload, '/api/ai/chat');

  assertNullableActionPayload(payload.payload, '/api/ai/chat');
  payload.payload = normalizeActionPayloadKeys(payload.payload);

  const rawTransactions = payload.transactions;
  if (rawTransactions !== undefined && rawTransactions !== null) {
    if (!Array.isArray(rawTransactions)) {
      throw new Error('Invalid /api/ai/chat response: "transactions" must be an array.');
    }
    payload.transactions = rawTransactions.map((transaction) => {
      assertNullableActionPayload(transaction, '/api/ai/chat');
      return normalizeActionPayloadKeys(transaction);
    }) as AiChatResponse['transactions'];
  }

  const confidences = payload.field_confidences;
  if (confidences !== undefined && confidences !== null) {
    const confidencesObj = assertObject(confidences, '/api/ai/chat');
    Object.values(confidencesObj).forEach((val) => {
      if (typeof val !== 'number') {
        throw new Error('Invalid /api/ai/chat response: "field_confidences" values must be numbers.');
      }
    });
  }

  return payload as unknown as AiChatResponse;
};

const validateChatHistory = (data: unknown): AiChatHistoryResponse => {
  const payload = assertObject(data, '/api/ai/chat/history');
  if (!Array.isArray(payload.messages)) {
    throw new Error('Invalid /api/ai/chat/history response: "messages" must be an array.');
  }
  (payload.messages as unknown[]).forEach((item) => {
    const message = assertObject(item, '/api/ai/chat/history');
    assertString(message, 'id', '/api/ai/chat/history');
    assertString(message, 'role', '/api/ai/chat/history');
    assertString(message, 'content', '/api/ai/chat/history');
    assertString(message, 'created_at', '/api/ai/chat/history');
  });
  return payload as unknown as AiChatHistoryResponse;
};

const validateRealtimeSession = (data: unknown): RealtimeSessionResponse => {
  const payload = assertObject(data, '/api/realtime/session');
  assertString(payload, 'token', '/api/realtime/session');
  assertString(payload, 'socket_url', '/api/realtime/session');
  assertNumber(payload, 'expires_at_epoch_seconds', '/api/realtime/session');
  return payload as unknown as RealtimeSessionResponse;
};

const validateInsights = (data: unknown): AiInsightsResponse => {
  const payload = assertObject(data, '/api/ai/insights');
  assertString(payload, 'insight_type', '/api/ai/insights');
  assertString(payload, 'summary', '/api/ai/insights');
  assertNumber(payload, 'confidence', '/api/ai/insights');
  assertBoolean(payload, 'needs_confirmation', '/api/ai/insights');
  assertStringArray(payload, 'safety_warnings', '/api/ai/insights');
  return payload as unknown as AiInsightsResponse;
};

const validateForecast = (data: unknown): AiForecastResponse => {
  const payload = assertObject(data, '/api/ai/forecast');
  assertNumber(payload, 'estimated_month_total', '/api/ai/forecast');
  assertNumber(payload, 'estimated_savings', '/api/ai/forecast');
  assertString(payload, 'data_confidence', '/api/ai/forecast');
  assertNumber(payload, 'days_of_data', '/api/ai/forecast');
  assertNumber(payload, 'confidence', '/api/ai/forecast');
  assertString(payload, 'disclaimer', '/api/ai/forecast');
  assertBoolean(payload, 'needs_confirmation', '/api/ai/forecast');
  assertStringArray(payload, 'safety_warnings', '/api/ai/forecast');
  return payload as unknown as AiForecastResponse;
};

export const aiApi = {
  async parseExpense(request: AiParseRequest): Promise<AiParseResponse> {
    try {
      const response = await aiHttpClient.post('/api/ai/parse', request);
      return validateParse(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async categorizeExpense(request: AiCategorizeRequest): Promise<AiCategorizeResponse> {
    try {
      const response = await aiHttpClient.post('/api/ai/categorize', request);
      return validateCategorize(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async correctExpense(request: AiCorrectRequest): Promise<AiCorrectResponse> {
    try {
      const response = await aiHttpClient.post('/api/ai/correct', request);
      return validateCorrect(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async getInsights(type: AiInsightType): Promise<AiInsightsResponse> {
    try {
      const response = await aiHttpClient.get('/api/ai/insights', {
        params: { type },
      });
      return validateInsights(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async getForecast(): Promise<AiForecastResponse> {
    try {
      const response = await aiHttpClient.get('/api/ai/forecast');
      return validateForecast(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    try {
      const response = await aiHttpClient.post('/api/ai/chat', request);
      return validateChat(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async streamChat(request: AiChatRequest): Promise<AiChatResponse> {
    try {
      const response = await aiHttpClient.post('/api/ai/chat/stream', request);
      return validateChat(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async getChatHistory(limit = 40): Promise<AiChatHistoryResponse> {
    try {
      const response = await aiHttpClient.get('/api/ai/chat/history', {
        params: { limit },
      });
      return validateChatHistory(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async clearChatHistory(): Promise<void> {
    try {
      await aiHttpClient.delete('/api/ai/chat/history');
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async getRealtimeSession(): Promise<RealtimeSessionResponse> {
    try {
      const response = await aiHttpClient.get('/api/realtime/session');
      return validateRealtimeSession(response.data);
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async runScenario(request: AiScenarioRequest): Promise<AiScenarioResult> {
    try {
      const response = await aiHttpClient.post('/api/ai/scenario', request);
      const payload = assertObject(response.data, '/api/ai/scenario');
      assertNumber(payload, 'baseline_monthly', '/api/ai/scenario');
      assertNumber(payload, 'projected_monthly', '/api/ai/scenario');
      assertNumber(payload, 'delta_amount', '/api/ai/scenario');
      assertNumber(payload, 'delta_pct', '/api/ai/scenario');
      assertString(payload, 'narrative', '/api/ai/scenario');
      assertNumber(payload, 'confidence', '/api/ai/scenario');
      assertBoolean(payload, 'needs_confirmation', '/api/ai/scenario');
      assertStringArray(payload, 'safety_warnings', '/api/ai/scenario');
      return payload as unknown as AiScenarioResult;
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async fetchNudges(): Promise<NudgesResponse> {
    try {
      const response = await aiHttpClient.get('/api/ai/nudges');
      const payload = assertObject(response.data, '/api/ai/nudges');
      assertString(payload, 'generated_at', '/api/ai/nudges');
      if (!Array.isArray(payload.nudges)) {
        throw new Error('Invalid /api/ai/nudges response: "nudges" must be an array.');
      }
      (payload.nudges as unknown[]).forEach((item) => {
        const nudge = assertObject(item, '/api/ai/nudges');
        assertString(nudge, 'id', '/api/ai/nudges');
        assertString(nudge, 'type', '/api/ai/nudges');
        assertString(nudge, 'title', '/api/ai/nudges');
        assertString(nudge, 'body', '/api/ai/nudges');
        assertString(nudge, 'severity', '/api/ai/nudges');
        assertNudgeActions(nudge, '/api/ai/nudges');
        assertOptionalNullableString(nudge, 'category', '/api/ai/nudges');
        assertOptionalNullableString(nudge, 'generated_at', '/api/ai/nudges');
      });
      return payload as unknown as NudgesResponse;
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },
};
