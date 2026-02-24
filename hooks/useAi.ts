import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { aiApi } from '@/lib/api/ai.api';
import {
  AiParseRequest,
  AiCategorizeRequest,
  AiChatRequest,
  AiCorrectRequest,
  AiInsightType,
  AiScenarioRequest,
} from '@/types/ai';

// GET Hooks
export function useAiInsights(type: AiInsightType) {
  return useSWR(`/api/ai/insights/${type}`, () => aiApi.getInsights(type));
}

export function useAiForecast() {
  return useSWR('/api/ai/forecast', () => aiApi.getForecast());
}

export function useAiNudges() {
  return useSWR('/api/ai/nudges', () => aiApi.fetchNudges());
}

// POST Mutation Hooks
export function useAiParse() {
  return useSWRMutation(
    '/api/ai/parse',
    (url: string, { arg }: { arg: AiParseRequest }) => aiApi.parseExpense(arg)
  );
}

export function useAiCategorize() {
  return useSWRMutation(
    '/api/ai/categorize',
    (url: string, { arg }: { arg: AiCategorizeRequest }) => aiApi.categorizeExpense(arg)
  );
}

export function useAiCorrect() {
  return useSWRMutation(
    '/api/ai/correct',
    (url: string, { arg }: { arg: AiCorrectRequest }) => aiApi.correctExpense(arg)
  );
}

export function useAiChat() {
  return useSWRMutation(
    '/api/ai/chat',
    (url: string, { arg }: { arg: AiChatRequest }) => aiApi.chat(arg)
  );
}

export function useAiScenario() {
  return useSWRMutation(
    '/api/ai/scenario',
    (url: string, { arg }: { arg: AiScenarioRequest }) => aiApi.runScenario(arg)
  );
}
