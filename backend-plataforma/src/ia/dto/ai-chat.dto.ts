/** Un turno previo de la conversación (el frontend guarda el historial en memoria). */
export class ChatMessageDto {
  role!: 'user' | 'assistant';
  content!: string;
}

/** Cuerpo de POST /projects/:id/ai/chat. */
export class AiChatDto {
  message!: string;
  history?: ChatMessageDto[];
}
