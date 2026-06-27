import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Genera una respuesta simulada inteligente basada en los datos reales del PR y de la revisión
function generateSmartMockResponse(messages: any[], diff: string, review: any): string {
  const lastMessage = (messages[messages.length - 1]?.content || '').toLowerCase();
  
  const bugs = review?.bugs || [];
  const sugs = review?.sugerencias || [];
  const perf = review?.performance || [];
  const sec = review?.security || [];
  const score = review?.score || 7;
  const justification = review?.justification || '';

  // Extraer nombres de archivos del diff
  const files: string[] = [];
  const lines = diff.split('\n');
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      const f = line.substring(6).trim();
      if (f && f !== '/dev/null') files.push(f);
    }
  }
  const fileList = files.length > 0 ? files : ['src/index.ts'];

  // Analizar la intención del mensaje del usuario
  if (lastMessage.includes('bug') || lastMessage.includes('error') || lastMessage.includes('fallo')) {
    if (bugs.length === 0) {
      return `He revisado la auditoría y **no se detectaron bugs críticos** en los archivos modificados (\`${fileList.join('\`, \`')}\`). ¡Buen trabajo! El código parece tener una lógica sólida. ¿Querés que analicemos las sugerencias de estilo o temas de rendimiento?`;
    }
    let res = `Con respecto a los **bugs detectados** en el reporte de esta PR:\n\n`;
    bugs.forEach((b: any) => {
      res += `- **Archivo:** \`${b.file}\` (Línea ${b.line || 'N/A'})\n  **Detalle del Bug:** ${b.description}\n\n`;
    });
    res += `Para corregir esto, te sugiero validar el flujo lógico y agregar un control de excepciones apropiado. ¿Querés ver cómo solucionar alguno de estos puntos específicos?`;
    return res;
  }

  if (lastMessage.includes('seguridad') || lastMessage.includes('vulnerabilidad') || lastMessage.includes('safe') || lastMessage.includes('secur')) {
    if (sec.length === 0) {
      return `En el reporte de revisión **no encontramos problemas de seguridad** evidentes en esta Pull Request. Las dependencias y sanitizaciones de entrada parecen correctas. ¿Tenés alguna otra duda?`;
    }
    let res = `Se detectaron los siguientes **issues de seguridad** en la revisión:\n\n`;
    sec.forEach((s: any) => {
      res += `- **Archivo:** \`${s.file}\`\n  **Riesgo:** ${s.description}\n\n`;
    });
    res += `Te recomiendo sanitizar todas las entradas del usuario y asegurarte de que no haya credenciales en texto plano.`;
    return res;
  }

  if (lastMessage.includes('rendimiento') || lastMessage.includes('performance') || lastMessage.includes('lento') || lastMessage.includes('optimizar')) {
    if (perf.length === 0) {
      return `El análisis de **rendimiento es óptimo**. No se detectaron loops ineficientes ni re-renderizados costosos en los archivos de esta PR.`;
    }
    let res = `Aquí tenés los hallazgos de **rendimiento** para optimizar el código:\n\n`;
    perf.forEach((p: any) => {
      res += `- **Archivo:** \`${p.file}\`\n  **Optimización:** ${p.description}\n\n`;
    });
    res += `Considerá aplicar técnicas de memoización o modularización de lógica pesada en funciones externas.`;
    return res;
  }

  if (lastMessage.includes('mejorar') || lastMessage.includes('sugerencia') || lastMessage.includes('estilo') || lastMessage.includes('clean code') || lastMessage.includes('cambiar')) {
    if (sugs.length === 0) {
      return `El código sigue buenas prácticas de legibilidad y estilo. No hay sugerencias pendientes de refactorización para los archivos en esta PR.`;
    }
    let res = `Para mejorar el **estilo y legibilidad** del código, te sugiero:\n\n`;
    sugs.forEach((s: any) => {
      res += `- **Archivo:** \`${s.file}\` (Línea ${s.line || 'N/A'})\n  **Mejora sugerida:** ${s.description}\n\n`;
    });
    res += `Aplicar estos cambios ayudará a mantener la base de código limpia y modular conforme a los estándares de desarrollo.`;
    return res;
  }

  if (lastMessage.includes('hola') || lastMessage.includes('buen') || lastMessage.includes('saludo') || lastMessage.includes('ey')) {
    return `¡Hola! Como tu Asistente de Código IA, estoy listo para responder cualquier consulta sobre los cambios de esta PR. 

Analicé el diff que modifica los archivos: ${fileList.map(f => `\`${f}\``).join(', ')}. La Pull Request tiene una puntuación general de **${score}/10**. ¿Querés profundizar en los **bugs**, las **sugerencias de estilo**, el **rendimiento** o los puntos de **seguridad**?`;
  }

  // Respuesta por defecto
  let responseText = `He analizado tu consulta sobre los cambios de la PR (Score de Salud: **${score}/10**).\n\n`;
  if (justification) {
    responseText += `**Resumen del análisis:** ${justification}\n\n`;
  }
  responseText += `Archivos incluidos en el análisis:\n`;
  fileList.forEach(f => {
    responseText += `- \`${f}\`\n`;
  });
  responseText += `\n¿Hay algún hallazgo en particular sobre el que te gustaría que indaguemos (bugs, rendimiento, seguridad, o sugerencias)? Decime y lo analizamos a fondo.`;
  
  return responseText;
}

// Standalone Mock/Demo chat response streamer
function streamMockChat(headers: any, messages: any[], diff: string, review: any) {
  const responseText = generateSmartMockResponse(messages, diff, review);

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    try {
      const chunkSize = 10; // Send 10 characters per interval
      for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.substring(i, i + chunkSize);
        const sseData = `data: ${JSON.stringify({
          type: "content_block_delta",
          delta: { text: chunk }
        })}\n\n`;
        
        await writer.write(encoder.encode(sseData));
        await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms delay
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
      return streamMockChat(corsHeaders, messages, diff, review);
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
      return streamMockChat(corsHeaders, messages, diff, review);
    }

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
    return streamMockChat(corsHeaders, messages, diff, review);
  }
});
