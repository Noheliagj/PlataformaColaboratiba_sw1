import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResult {
  reply: string;
  actions: string[];
}

/** RF11: POST /projects/:id/ai/chat — comando en lenguaje natural sobre el diagrama. */
export async function sendAiMessage(
  projectId: string,
  message: string,
  history: ChatMessage[],
): Promise<AiChatResult> {
  const { data } = await api.post<AiChatResult>(`/projects/${projectId}/ai/chat`, {
    message,
    history,
  });
  return data;
}
