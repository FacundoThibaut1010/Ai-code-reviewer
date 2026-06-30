import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standalone Mock/Demo project analysis response streamer
function streamMockAnalysis(
  headers: any,
  repoName: string,
  description: string,
  files: string[],
  languages: any,
  commits: any[],
  fileContents: Record<string, string>
) {
  const name = repoName.split('/').pop() || repoName;
  const cleanName = name.replace(/[-_]/g, ' ').toUpperCase();
  const repoDesc = description || 'un proyecto de desarrollo de software interactivo';

  // Buscar el contenido del README
  let readmeText = '';
  if (fileContents) {
    const readmeKey = Object.keys(fileContents).find(k => k.toLowerCase() === 'readme.md');
    if (readmeKey && fileContents[readmeKey]) {
      readmeText = fileContents[readmeKey];
    }
  }

  // Extraer un resumen del README
  let parsedObjective = '';
  if (readmeText) {
    // Buscar líneas de texto que no sean headers, imágenes o links
    const lines = readmeText.split('\n');
    const paragraphs: string[] = [];
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      if (cleanLine.startsWith('#') || cleanLine.startsWith('!') || cleanLine.startsWith('[') || cleanLine.startsWith('---') || cleanLine.startsWith('*')) {
        continue;
      }
      paragraphs.push(cleanLine);
      if (paragraphs.length >= 3) break;
    }
    parsedObjective = paragraphs.join(' ');
  }

  // Si no hay README, buscar en los commits recientes
  let commitSummary = '';
  if (!parsedObjective && commits && commits.length > 0) {
    const messages = commits
      .map(c => c.commit?.message || '')
      .filter(m => m && !m.startsWith('Merge') && !m.startsWith('Branch'))
      .slice(0, 3);
    if (messages.length > 0) {
      commitSummary = `El desarrollo reciente incluye: ${messages.join(', ')}.`;
    }
  }

  // Construir las descripciones dinámicamente
  const inferredDesc = parsedObjective 
    ? (parsedObjective.length > 300 ? parsedObjective.substring(0, 300) + '...' : parsedObjective)
    : `${repoDesc}. ${commitSummary}`;

  // Determinar tipo de proyecto basándonos en los archivos
  const filesStr = (files || []).join(' ');
  const isEcommerce = /store|shop|cart|product|checkout|tienda|compra|vender/i.test(filesStr) || /store|shop|cart|tienda|ecommerce/i.test(name);
  const isPortfolio = /portfolio|cv|resume|about|portafolio/i.test(filesStr) || /portfolio|portafolio/i.test(name);
  const isChat = /chat|message|socket|canal|convers/i.test(filesStr) || /chat/i.test(name);
  const isTask = /task|todo|list|kanban|agenda|calendar/i.test(filesStr) || /todo|task/i.test(name);

  let projectType = 'solución de software';
  if (isEcommerce) projectType = 'plataforma de comercio electrónico (E-commerce)';
  else if (isPortfolio) projectType = 'portafolio web profesional';
  else if (isChat) projectType = 'sistema de mensajería en tiempo real';
  else if (isTask) projectType = 'aplicación de productividad y gestión de tareas';

  const langs = Object.keys(languages || {}).slice(0, 3).join(', ') || 'TypeScript/JavaScript';

  const responseText = `### LINKEDIN
He completado el desarrollo de **${cleanName}**, una ${projectType} diseñada para ${repoDesc.toLowerCase()}. El proyecto está estructurado para resolver problemáticas de productividad y optimización de datos, facilitando a los usuarios realizar operaciones esenciales de manera rápida. La aplicación destaca por su diseño responsivo y la modularidad de sus componentes en ${langs}.

### CV
Desarrollo de **${cleanName}**, ${projectType} orientada a ${repoDesc.toLowerCase()}. Implementa un flujo interactivo que permite agilizar la gestión de datos mediante código robusto y modular.

### PORTFOLIO
**${cleanName}** es una ${projectType} que surge para resolver la ineficiencia en procesos tradicionales. A través del análisis del repositorio, se observa que la aplicación implementa funcionalidades clave descritas como: "${inferredDesc}". Con este enfoque, el usuario final obtiene un entorno interactivo y simplificado para operar. A nivel de arquitectura, se optó por un desarrollo con ${langs}, logrando modularidad en las vistas and optimización de carga.`;

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    try {
      const chunkSize = 45; // Send 45 characters per interval
      for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.substring(i, i + chunkSize);
        const sseData = `data: ${JSON.stringify({
          type: "content_block_delta",
          delta: { text: chunk }
        })}\n\n`;
        
        await writer.write(encoder.encode(sseData));
        await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay
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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const grokApiKey = Deno.env.get('GROK_API_KEY');

    let apiKey = '';
    let apiUrl = '';
    let apiModel = '';

    if (geminiApiKey && geminiApiKey !== 'TU_API_KEY' && !geminiApiKey.includes('placeholder')) {
      console.log("Usando API Key de Gemini con gemini-2.5-flash.");
      apiKey = geminiApiKey;
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      apiModel = 'gemini-2.5-flash';
    } else if (grokApiKey && grokApiKey !== 'TU_API_KEY' && !grokApiKey.includes('placeholder')) {
      console.log("Usando API Key de Grok con grok-3.");
      apiKey = grokApiKey;
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      apiModel = 'grok-3';
    }

    if (!apiKey) {
      console.warn("No hay API Key de Gemini ni de Grok configurada. Activando modo Demo de contingencia.");
      return streamMockAnalysis(corsHeaders, repoName, description, files, languages, commits, fileContents);
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

    // Preparar el contexto del repositorio para enviarlo a Grok/Gemini
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

    // Loguear el contexto exacto enviado a la IA antes de la llamada
    console.log("Contexto exacto enviado a la IA:", JSON.stringify(repoContext, null, 2));

    // Llamada a la API de IA con Streaming
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Aquí están los metadatos y código clave del repositorio para analizar:\n\n${JSON.stringify(repoContext)}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`La API de IA falló con código ${response.status}: ${errorText}. Activando modo Demo de contingencia.`);
      return streamMockAnalysis(corsHeaders, repoName, description, files, languages, commits, fileContents);
    }

    // Transformar el stream de la IA al formato esperado por el frontend (Anthropic content_block_delta)
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
        console.error('Error transforming AI stream:', err);
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
    return streamMockAnalysis(corsHeaders, repoName, description, files, languages, commits, fileContents);
  }
});
