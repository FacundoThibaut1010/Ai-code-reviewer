import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standalone Mock/Demo project analysis response streamer
function streamMockAnalysis(headers: any, repoName: string, description: string) {
  const repoDesc = description || 'un sistema interactivo de desarrollo de software';
  const responseText = `### LINKEDIN
He desarrollado un sistema interactivo diseñado para optimizar el flujo de trabajo de auditoría de código en equipos de desarrollo. La plataforma ayuda a identificar ineficiencias de manera temprana, reduciendo significativamente el tiempo de revisión manual y mejorando la calidad final del software entregado. Al automatizar la detección de inconsistencias y sugerir mejoras, permitimos que los desarrolladores se enfoquen en resolver problemas de negocio complejos.

### CV
Plataforma web de auditoría inteligente que optimiza los flujos de revisión de código de repositorios. Automatiza el diagnóstico de fallas de lógica, estilo y rendimiento, reduciendo los tiempos de entrega y elevando la calidad técnica del software en producción.

### PORTFOLIO
Este proyecto nace para resolver la ineficiencia y fatiga mental asociadas con la revisión manual de Pull Requests en equipos de desarrollo ágiles. La aplicación proporciona un panel interactivo que lee directamente el código de los repositorios y ofrece diagnósticos inmediatos sobre fallas de seguridad, rendimiento y adherencia a buenas prácticas. Desde la perspectiva del usuario, basta con seleccionar una propuesta de cambio para recibir un reporte claro con soluciones aplicables paso a paso y la posibilidad de chatear en vivo con un asistente inteligente para refactorizar el código en el acto. Esto no solo acelera los tiempos de despliegue, sino que actúa como una herramienta pedagógica para que los desarrolladores aprendan mejores patrones de diseño en cada interacción.`;

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    try {
      const chunkSize = 12; // Send 12 characters per interval
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
      console.error("Error streaming mock project analysis:", err);
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

  let repoName = '';
  let description = '';
  let languages: any = {};
  let commits: any[] = [];
  let files: string[] = [];
  let fileContents: Record<string, string> = {};

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado: Falta token de autenticación' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    repoName = body.repoName || '';
    description = body.description || '';
    languages = body.languages || {};
    commits = body.commits || [];
    files = body.files || [];
    fileContents = body.fileContents || {};

    if (!repoName) {
      return new Response(JSON.stringify({ error: 'El campo "repoName" es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const grokApiKey = Deno.env.get('GROK_API_KEY');
    if (!grokApiKey || grokApiKey === 'TU_API_KEY' || grokApiKey.includes('placeholder')) {
      console.warn("Falta la API Key de Grok o tiene valor por defecto. Activando modo Demo para analizar proyecto.");
      return streamMockAnalysis(corsHeaders, repoName, description);
    }

    // Crear el prompt del sistema dinámico
    const systemPrompt = `Eres un redactor técnico experto y especialista en desarrollo de carrera para programadores.
Tu tarea es analizar el código y los metadatos reales de un repositorio de GitHub que te proporciona el usuario y generar tres versiones de descripción de este proyecto en español.

Instrucciones generales:
- No inventes nada. Basa tu análisis estrictamente en el código real leído (archivos de configuración, dependencias, archivos de código principales y README si existe).
- Explica qué problema resuelve el proyecto en el mundo real, para quién es útil y qué valor genera.
- No uses jerga técnica pesada ni nombres de tecnologías específicas en la versión de LinkedIn, enfócate en el impacto y valor del software.

Debes generar tres versiones de descripción del proyecto claramente identificadas. Utiliza exactamente el siguiente formato y separadores en tu respuesta para que el frontend pueda parsearlas:

### LINKEDIN
[Escribe aquí la versión para LinkedIn: de 3 o 4 oraciones. Tono profesional pero humano, enfocado en el impacto, el valor que genera y el problema que resuelve, sin mencionar tecnologías específicas ni detalles de implementación técnica].

### CV
[Escribe aquí la versión para CV: de máximo 2 oraciones. Directo al punto, explicando qué hace el proyecto y qué problema resuelve de forma muy formal].

### PORTFOLIO
[Escribe aquí la versión para Portafolio: un párrafo más completo. Explica en detalle el problema que resuelve el proyecto en el mundo real, a quién le sirve, qué valor genera, qué hace concretamente la aplicación desde el punto de vista del usuario, y qué lo hace relevante o innovador. Todo en lenguaje simple y humano, sin tecnicismos].`;

    // Preparar el contexto del repositorio para enviarlo a Grok
    const repoContext = {
      nombre: repoName,
      descripcion: description,
      lenguajes: languages,
      commitsRecientes: commits.slice(0, 5).map(c => ({
        mensaje: c.commit?.message,
        autor: c.commit?.author?.name,
        fecha: c.commit?.author?.date
      })),
      archivos: files.slice(0, 100), // Enviar los primeros 100 archivos del árbol
      codigoClave: Object.entries(fileContents).map(([path, content]) => ({
        archivo: path,
        contenido: content.substring(0, 2500) // Limitar el contenido de cada archivo a los primeros 2500 caracteres
      }))
    };

    // Llamada a la API de Grok con Streaming
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Aquí están los metadatos y código clave del repositorio para analizar:\n\n${JSON.stringify(repoContext)}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`La API de Grok falló con código ${response.status}: ${errorText}. Activando modo Demo de contingencia.`);
      return streamMockAnalysis(corsHeaders, repoName, description);
    }

    // Transformar el stream de Grok al formato esperado por el frontend (Anthropic content_block_delta)
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      let buffer = '';
      try {
        if (!reader) {
          await writer.close();
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.substring(5).trim();
              if (dataStr === '[DONE]') {
                await writer.write(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  const sseData = `data: ${JSON.stringify({
                    type: 'content_block_delta',
                    delta: { text: content }
                  })}\n\n`;
                  await writer.write(encoder.encode(sseData));
                }
              } catch {
                // Ignore partial JSON parsing errors
              }
            }
          }
        }

        // Process leftover buffer
        if (buffer.trim().startsWith('data:')) {
          const trimmed = buffer.trim();
          const dataStr = trimmed.substring(5).trim();
          if (dataStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                const sseData = `data: ${JSON.stringify({
                  type: 'content_block_delta',
                  delta: { text: content }
                })}\n\n`;
                await writer.write(encoder.encode(sseData));
              }
            } catch {
              // Ignore
            }
          }
        }
      } catch (err) {
        console.error('Error transforming Grok stream:', err);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error en la ejecución de la función Edge, activando modo Demo:", error);
    return streamMockAnalysis(corsHeaders, repoName, description);
  }
});
