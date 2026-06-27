import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standalone Mock/Demo chat response streamer
function streamMockChat(headers: any, messages: any[]) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const responseText = `[MODO DEMO] Hola. He recibido tu mensaje: "${lastMessage}". Como no se ha configurado una API Key de Anthropic válida, estoy respondiendo en modo demo. Puedo ver los cambios y el reporte generado en esta Pull Request. ¿Deseas que profundicemos en alguna sección del código o en los bugs reportados?`;

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    try {
      const chunkSize = 8; // Send 8 characters per interval
      for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.substring(i, i + chunkSize);
        const sseData = `data: ${JSON.stringify({
          type: "content_block_delta",
          delta: { text: chunk }
        })}\n\n`;
        
        await writer.write(encoder.encode(sseData));
        await new Promise((resolve) => setTimeout(resolve, 25)); // 25ms delay for typing feel
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (err) {
      console.error("Error streaming mock chat:", err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...headers,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

serve(async (req) => {
  // Manejo del preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let diff = '';
  let review: any = {};
  let messages: any[] = [];

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado: Falta token de autenticación' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    diff = body.diff || '';
    review = body.review || {};
    messages = body.messages || [];

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'El campo "messages" es requerido y no debe estar vacío' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey || anthropicApiKey === 'TU_API_KEY' || anthropicApiKey.includes('placeholder')) {
      console.warn("Falta la API Key de Anthropic o tiene valor por defecto. Activando modo Demo para el chat.");
      return streamMockChat(corsHeaders, messages);
    }

    // Crear el prompt del sistema dinámico
    const systemPrompt = `Eres un asistente de IA de revisión de código experto. Estás conversando con el usuario sobre una Pull Request (PR) específica.

El diff de la PR es el siguiente:
${diff}

El reporte de revisión automática generado previamente es el siguiente:
${JSON.stringify(review)}

Instrucciones:
- Responde las preguntas del usuario en español de manera clara, constructiva, profesional y concisa.
- Haz referencia a las líneas de código y hallazgos específicos si es necesario.
- Si el usuario te hace una pregunta que no tiene relación con el código o con la PR, recuérdale amablemente que estás para ayudarlo con la revisión de este código.
- Usa formato Markdown simple para estructurar tus respuestas (ej. negritas, listas o bloques de código si es necesario).`;

    // Formatear los mensajes para la API de Claude.
    // La API de Claude requiere alternar entre 'user' y 'assistant'.
    // Nos aseguramos de filtrar/mapear los roles correctos.
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    }));

    // Llamada a la API de Anthropic Claude con Streaming
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`La API de Claude falló con código ${response.status}: ${errorText}. Activando modo Demo de contingencia.`);
      return streamMockChat(corsHeaders, messages);
    }

    // Redirigir el stream de Claude directamente al cliente
    const { readable, writable } = new TransformStream();
    response.body?.pipeTo(writable);

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error en la ejecución de la función Edge de chat, activando modo Demo:", error);
    return streamMockChat(corsHeaders, messages);
  }
});
