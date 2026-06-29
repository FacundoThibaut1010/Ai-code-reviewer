import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standalone Mock/Demo project analysis response streamer
function streamMockAnalysis(headers: any, repoName: string, description: string, files: string[], languages: any) {
  const name = repoName.split('/').pop() || repoName;
  const cleanName = name.replace(/[-_]/g, ' ');
  const filesStr = (files || []).join(' ');
  const isEcommerce = /store|shop|cart|product|checkout|tienda|compra|vender/i.test(filesStr) || /store|shop|cart|tienda|ecommerce/i.test(name);
  const isPortfolio = /portfolio|cv|resume|about|portafolio/i.test(filesStr) || /portfolio|portafolio/i.test(name);
  const isChat = /chat|message|socket|canal|convers/i.test(filesStr) || /chat/i.test(name);
  const isTask = /task|todo|list|kanban|agenda|calendar/i.test(filesStr) || /todo|task/i.test(name);

  let projectType = 'desarrollo de software';
  let problemSolved = 'optimizar la gestión de datos y mejorar la experiencia de usuario';
  let concreteAction = 'permitir al usuario interactuar de manera fluida y gestionar información esencial en tiempo real';
  let targetUser = 'usuarios finales y administradores que buscan agilidad en sus operaciones diarias';

  if (isEcommerce) {
    projectType = 'comercio electrónico (E-commerce)';
    problemSolved = 'facilitar la compra y venta de productos en línea de manera segura, reduciendo la fricción en el proceso de pago';
    concreteAction = 'navegar por un catálogo interactivo de productos, gestionar un carrito de compras dinámico y realizar transacciones de pago';
    targetUser = 'clientes finales que buscan una experiencia de compra fluida y vendedores que necesitan administrar su inventario';
  } else if (isPortfolio) {
    projectType = 'portafolio profesional';
    problemSolved = 'centralizar y presentar de manera visual y atractiva los proyectos de software, habilidades técnicas e historial laboral del desarrollador';
    concreteAction = 'visualizar una lista de trabajos realizados con filtros dinámicos, conocer la experiencia técnica del desarrollador y contactarlo directamente';
    targetUser = 'reclutadores, clientes freelance y la comunidad técnica que busca conocer el perfil y capacidades del profesional';
  } else if (isChat) {
    projectType = 'mensajería y comunicación en tiempo real';
    problemSolved = 'conectar a personas de manera instantánea superando las barreras de comunicación tradicionales';
    concreteAction = 'enviar y recibir mensajes instantáneos en salas de chat grupales o directas, con indicadores de estado de conexión';
    targetUser = 'equipos de trabajo o comunidades que necesitan coordinarse rápidamente sin demoras';
  } else if (isTask) {
    projectType = 'gestión de tareas y productividad';
    problemSolved = 'organizar y priorizar las actividades diarias para reducir la dispersión mental y aumentar la productividad';
    concreteAction = 'crear, editar, clasificar y marcar como completadas las tareas cotidianas mediante tableros organizadores';
    targetUser = 'profesionales y estudiantes que buscan una forma estructurada de administrar sus tiempos y entregables';
  }

  const langs = Object.keys(languages || {}).slice(0, 3).join(', ') || 'JavaScript';

  const responseText = `### LINKEDIN
He desarrollado ${cleanName.trim()}, una aplicación web de ${projectType} que resuelve el problema de ${problemSolved}. El sistema permite a los usuarios ${concreteAction}, aportando eficiencia y agilidad en sus tareas cotidianas. Estoy muy conforme con el diseño responsivo y la robustez lógica alcanzada con tecnologías modernas.

### CV
Desarrollo de ${cleanName.trim()}, plataforma de ${projectType} para ${problemSolved}. Permite la interacción directa mediante un flujo optimizado que facilita al usuario ${concreteAction}.

### PORTFOLIO
Este proyecto consiste en una aplicación de ${projectType} diseñada específicamente para ${problemSolved}, brindando una experiencia rápida y simplificada. Desde el punto de vista del usuario final, la herramienta ofrece un panel interactivo para ${concreteAction}. La arquitectura modular del código facilita la integración con APIs externas y optimiza los tiempos de respuesta del sistema, haciéndolo ideal para ${targetUser}. El proyecto fue desarrollado utilizando prácticas de código limpio y estructurado en lenguajes como ${langs}.`;

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
      return streamMockAnalysis(corsHeaders, repoName, description, files, languages);
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

    // Loguear el contexto exacto enviado a Grok antes de la llamada
    console.log("Contexto exacto enviado a Grok:", JSON.stringify(repoContext, null, 2));

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
      return streamMockAnalysis(corsHeaders, repoName, description, files, languages);
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
    return streamMockAnalysis(corsHeaders, repoName, description, files, languages);
  }
});
