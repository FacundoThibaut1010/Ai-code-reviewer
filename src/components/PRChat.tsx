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
  const [chatOpen, setChatOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAvatar() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.avatar_url) {
          setAvatarUrl(session.user.user_metadata.avatar_url);
        }
      } catch (e) {
        console.error('Error fetching avatar:', e);
      }
    }
    fetchAvatar();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatOpen) {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }
    return () => {
      document.body.classList.remove('chat-open');
    };
  }, [chatOpen]);

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
    <>
      {/* Floating Chat Trigger Circle Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 z-[80] group"
        title="Hablar con el Asistente de IA"
      >
        <MessageSquareCode className="h-6 w-6 group-hover:rotate-6 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse"></span>
      </button>

      {/* Centered Modal macOS Styled Chat Window */}
      {chatOpen && (
        <>
          {/* Backdrop Blur overlay */}
          <div 
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-200"
          />

          {/* Modal Container */}
          <div 
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex flex-col z-[10000] transition-all duration-300 ease-out animate-sileo-pop ${
              isMaximized 
                ? 'w-[90vw] max-w-4xl h-[80vh]' 
                : 'w-[90vw] max-w-lg h-[520px]'
            }`}
          >
            {/* macOS Title Bar */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between select-none shrink-0 relative">
              {/* Traffic Light Circles (macOS style) */}
              <div className="flex items-center space-x-2 z-10">
                {/* Red: Close */}
                <button 
                  onClick={() => setChatOpen(false)}
                  className="h-3 w-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group"
                  title="Cerrar"
                >
                  <span className="text-[8px] text-rose-950 font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                </button>
                {/* Yellow: Minimize/Close to button */}
                <button 
                  onClick={() => setChatOpen(false)}
                  className="h-3 w-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center group"
                  title="Minimizar"
                >
                  <span className="text-[8px] text-amber-950 font-bold opacity-0 group-hover:opacity-100 transition-opacity">-</span>
                </button>
                {/* Green: Toggle size */}
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="h-3 w-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center group"
                  title={isMaximized ? "Restaurar" : "Maximizar"}
                >
                  <span className="text-[7px] text-emerald-950 font-bold opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                </button>
              </div>

              {/* Title in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-200 tracking-wide font-sans">Asistente de Código IA</span>
              </div>

              {/* Status indicator on the right */}
              <div className="flex items-center space-x-1.5 z-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En línea</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/20">
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
                      ) : avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Usuario"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm border ${
                        isAssistant
                          ? 'bg-slate-900/60 border-slate-800/80 text-slate-350 rounded-tl-sm font-sans'
                          : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-100 rounded-tr-sm font-sans'
                      }`}
                    >
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 bg-slate-900/30 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Preguntale a la IA sobre los hallazgos o mejoras..."
                  disabled={isStreaming}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 shadow-inner focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 disabled:opacity-50 font-sans"
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
        </>
      )}
    </>
  );
}
