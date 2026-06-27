'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAlert } from '@/components/AlertProvider';
import { AIReviewContent } from '@/types';
import { Send, User, MessageSquareCode } from 'lucide-react';
import RobotLogo from '@/components/RobotLogo';

interface PRChatProps {
  diffText: string;
  review: AIReviewContent;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function PRChat({ diffText, review }: PRChatProps) {
  const { showAlert } = useAlert();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! He analizado esta Pull Request y la revisión automática de código. ¿Tenés alguna duda sobre los bugs detectados, las sugerencias de estilo o la complejidad? Estoy listo para responder y ayudarte a optimizar el código.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);

    // Agregar mensaje del usuario
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessageContent },
    ];
    setMessages(updatedMessages);

    // Agregar mensaje vacío del asistente que se llenará con streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Tu sesión ha expirado. Por favor, volvé a iniciar sesión.');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/pr-chat`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diff: diffText,
          review,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error en el servidor de chat: ${response.status} ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('El navegador no soporta lectura de flujos en streaming.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let textAccumulator = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Mantener la última línea incompleta en el búfer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            try {
              const dataStr = trimmed.substring(5).trim();
              if (dataStr === '[DONE]') continue;

              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                textAccumulator += parsed.delta.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  if (copy.length > 0) {
                    copy[copy.length - 1] = {
                      role: 'assistant',
                      content: textAccumulator,
                    };
                  }
                  return copy;
                });
              }
            } catch {
              // Ignorar errores parciales de parseo
            }
          }
        }
      }

      // Procesar último fragmento residual si queda algo en buffer
      if (buffer.trim().startsWith('data:')) {
        try {
          const dataStr = buffer.trim().substring(5).trim();
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            textAccumulator += parsed.delta.text;
            setMessages((prev) => {
              const copy = [...prev];
              if (copy.length > 0) {
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: textAccumulator,
                };
              }
              return copy;
            });
          }
        } catch {
          // Ignorar
        }
      }

    } catch (err: unknown) {
      console.error('Error during AI Chat streaming:', err);
      const errMsg = err instanceof Error ? err.message : 'Error al conectar con la IA.';
      showAlert({
        type: 'error',
        title: 'Error de Chat',
        message: errMsg,
      });

      // Remover el mensaje vacío del asistente si falló
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].content === '') {
          copy.pop();
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const renderMessageContent = (content: string) => {
    if (!content) {
      return (
        <span className="flex items-center space-x-1.5 text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
        </span>
      );
    }

    // Dividir por bloques de código: ```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : part.substring(3, part.length - 3);

        return (
          <div key={index} className="my-3 font-mono text-xs text-left max-w-full">
            {language && (
              <div className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-t-xl border-t border-x border-slate-800/80 select-none">
                {language}
              </div>
            )}
            <pre className={`bg-slate-950/70 p-4 rounded-b-xl overflow-x-auto border border-slate-800/80 ${!language ? 'rounded-t-xl' : ''}`}>
              <code className="text-emerald-400">{code}</code>
            </pre>
          </div>
        );
      } else {
        const textParts = part.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
        return (
          <span key={index} className="whitespace-pre-wrap leading-relaxed">
            {textParts.map((tPart, tIndex) => {
              if (tPart.startsWith('**') && tPart.endsWith('**')) {
                return (
                  <strong key={tIndex} className="font-bold text-white">
                    {tPart.slice(2, -2)}
                  </strong>
                );
              }
              if (tPart.startsWith('`') && tPart.endsWith('`')) {
                return (
                  <code
                    key={tIndex}
                    className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-orange-400 font-mono text-xs"
                  >
                    {tPart.slice(1, -1)}
                  </code>
                );
              }
              return tPart;
            })}
          </span>
        );
      }
    });
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/10 backdrop-blur-md overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquareCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Asistente de Código IA</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Consultá detalles técnicos sobre la Pull Request</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 md:p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar flex-1 bg-slate-950/20">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-[85%] ${
                isAssistant ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-left'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border text-xs font-semibold ${
                  isAssistant
                    ? 'border-slate-800 bg-slate-900 text-indigo-400'
                    : 'border-indigo-500/30 bg-indigo-600/10 text-indigo-300'
                }`}
              >
                {isAssistant ? (
                  <div className="text-indigo-400 scale-90">
                    <RobotLogo size={20} interactive={false} />
                  </div>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-sm border ${
                  isAssistant
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 rounded-tl-sm'
                    : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-100 rounded-tr-sm'
                }`}
              >
                {renderMessageContent(msg.content)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Preguntale a la IA sobre los hallazgos o mejoras..."
            disabled={isStreaming}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 shadow-inner focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors active:scale-[0.97] disabled:bg-slate-800 disabled:text-slate-500 disabled:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
