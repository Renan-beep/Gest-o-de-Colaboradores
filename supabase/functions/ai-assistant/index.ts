import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um assistente de IA especializado em recursos humanos e gestão de colaboradores.

Você tem acesso ao banco de dados da empresa e pode:
- Gerar relatórios sobre colaboradores
- Criar e gerenciar equipes
- Analisar dados de chamadas e presença
- Fornecer insights sobre demissões e contratações
- Realizar cálculos e análises de dados

Sempre seja claro sobre o que você está fazendo e explique os resultados de forma profissional e concisa.
Quando solicitar dados, organize-os de forma clara e estruturada.`;

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_colaboradores_stats",
      description: "Obtém estatísticas gerais sobre colaboradores (total, ativos, afastados, por setor, etc)",
      parameters: {
        type: "object",
        properties: {
          filter_setor: { type: "string", description: "Filtrar por setor específico (opcional)" },
          filter_status: { type: "string", description: "Filtrar por status (Ativo/Afastado)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_colaboradores_by_tempo",
      description: "Lista colaboradores agrupados por tempo de empresa (novos, adaptação, experientes, veteranos)",
      parameters: {
        type: "object",
        properties: {
          categoria: { 
            type: "string", 
            enum: ["novo", "adaptacao", "experiente", "veterano", "todos"],
            description: "Categoria de tempo de empresa" 
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_demissoes_report",
      description: "Gera relatório de demissões com filtros por período e tipo",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Data final (YYYY-MM-DD)" },
          tipo: { type: "string", description: "Tipo de demissão (opcional)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_equipes_auto",
      description: "Cria equipes automaticamente distribuindo colaboradores de forma balanceada",
      parameters: {
        type: "object",
        properties: {
          num_equipes: { type: "number", description: "Número de equipes a criar" },
          grupo: { type: "string", description: "Nome do grupo das equipes" },
          filter_setor: { type: "string", description: "Filtrar colaboradores por setor (opcional)" }
        },
        required: ["num_equipes", "grupo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_chamadas_stats",
      description: "Obtém estatísticas de chamadas e presença",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Data final (YYYY-MM-DD)" }
        },
        required: []
      }
    }
  }
];

async function executeToolCall(toolName: string, args: any, supabase: any) {
  console.log(`Executing tool: ${toolName}`, args);

  switch (toolName) {
    case "get_colaboradores_stats": {
      let query = supabase.from('colaboradores').select('*');
      
      if (args.filter_setor) {
        query = query.eq('setor', args.filter_setor);
      }
      if (args.filter_status) {
        query = query.eq('status', args.filter_status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data.length,
        ativos: data.filter(c => c.status === 'Ativo').length,
        afastados: data.filter(c => c.status === 'Afastado').length,
        por_setor: data.reduce((acc, c) => {
          acc[c.setor] = (acc[c.setor] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        por_cargo: data.reduce((acc, c) => {
          acc[c.cargo] = (acc[c.cargo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        trabalham_sabado: data.filter(c => c.sabado_trabalho === 'Sim').length
      };

      return JSON.stringify(stats, null, 2);
    }

    case "get_colaboradores_by_tempo": {
      const { data, error } = await supabase.from('colaboradores').select('*');
      if (error) throw error;

      const hoje = new Date();
      const colaboradoresPorTempo = data.map((c: any) => {
        const admissao = new Date(c.admissao);
        const meses = Math.floor((hoje.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const anos = Math.floor(meses / 12);
        
        let categoria = '';
        if (meses < 6) categoria = 'novo';
        else if (meses < 12) categoria = 'adaptacao';
        else if (anos < 5) categoria = 'experiente';
        else categoria = 'veterano';

        return { ...c, tempo_meses: meses, categoria };
      });

      let filtered = colaboradoresPorTempo;
      if (args.categoria && args.categoria !== 'todos') {
        filtered = colaboradoresPorTempo.filter(c => c.categoria === args.categoria);
      }

      const resumo = {
        total: filtered.length,
        novos: colaboradoresPorTempo.filter(c => c.categoria === 'novo').length,
        adaptacao: colaboradoresPorTempo.filter(c => c.categoria === 'adaptacao').length,
        experientes: colaboradoresPorTempo.filter(c => c.categoria === 'experiente').length,
        veteranos: colaboradoresPorTempo.filter(c => c.categoria === 'veterano').length,
        colaboradores: filtered.map(c => ({
          nome: c.colaborador,
          matricula: c.matricula,
          cargo: c.cargo,
          setor: c.setor,
          tempo_meses: c.tempo_meses,
          categoria: c.categoria
        }))
      };

      return JSON.stringify(resumo, null, 2);
    }

    case "get_demissoes_report": {
      let query = supabase.from('demissoes').select(`
        *,
        colaboradores:colaborador_id (
          colaborador,
          matricula,
          cargo,
          setor
        )
      `);

      if (args.start_date) {
        query = query.gte('data_demissao', args.start_date);
      }
      if (args.end_date) {
        query = query.lte('data_demissao', args.end_date);
      }
      if (args.tipo) {
        query = query.eq('tipo_demissao', args.tipo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const resumo = {
        total: data.length,
        por_tipo: data.reduce((acc, d) => {
          acc[d.tipo_demissao] = (acc[d.tipo_demissao] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        demissoes: data.map(d => ({
          colaborador: d.colaboradores?.colaborador,
          matricula: d.colaboradores?.matricula,
          cargo: d.colaboradores?.cargo,
          setor: d.colaboradores?.setor,
          data: d.data_demissao,
          tipo: d.tipo_demissao,
          motivo: d.motivo
        }))
      };

      return JSON.stringify(resumo, null, 2);
    }

    case "create_equipes_auto": {
      let query = supabase.from('colaboradores').select('*').eq('status', 'Ativo');
      
      if (args.filter_setor) {
        query = query.eq('setor', args.filter_setor);
      }

      const { data: colaboradores, error: colabError } = await query;
      if (colabError) throw colabError;

      // Embaralhar colaboradores
      const shuffled = [...colaboradores].sort(() => Math.random() - 0.5);
      
      // Criar equipes
      const equipes = [];
      for (let i = 0; i < args.num_equipes; i++) {
        const equipeId = `${args.grupo}-${i + 1}`;
        equipes.push({
          id: equipeId,
          nome: `Equipe ${i + 1}`,
          grupo: args.grupo,
          ativa: true,
          premiacoes: 0
        });
      }

      // Inserir equipes
      const { error: equipeError } = await supabase.from('equipes').insert(equipes);
      if (equipeError) throw equipeError;

      // Distribuir colaboradores
      const alocacoes = shuffled.map((colab, index) => ({
        matricula_colaborador: colab.matricula,
        equipe_id: equipes[index % args.num_equipes].id
      }));

      const { error: alocError } = await supabase.from('alocacoes').insert(alocacoes);
      if (alocError) throw alocError;

      const resultado = {
        equipes_criadas: equipes.length,
        colaboradores_alocados: alocacoes.length,
        distribuicao: equipes.map((e, i) => ({
          equipe: e.nome,
          id: e.id,
          membros: alocacoes.filter(a => a.equipe_id === e.id).length
        }))
      };

      return JSON.stringify(resultado, null, 2);
    }

    case "get_chamadas_stats": {
      let query = supabase.from('chamadas').select(`
        *,
        colaboradores:colaborador_id (
          colaborador,
          matricula,
          cargo,
          setor
        )
      `);

      if (args.start_date) {
        query = query.gte('data', args.start_date);
      }
      if (args.end_date) {
        query = query.lte('data', args.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total_registros: data.length,
        presentes: data.filter(c => c.status === 'presente').length,
        ausentes: data.filter(c => c.status === 'ausente').length,
        outros: data.filter(c => c.status !== 'presente' && c.status !== 'ausente').length,
        por_status: data.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return JSON.stringify(stats, null, 2);
    }

    default:
      return `Ferramenta ${toolName} não implementada`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let conversationMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    let shouldContinue = true;
    let iterations = 0;
    const maxIterations = 10;

    while (shouldContinue && iterations < maxIterations) {
      iterations++;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversationMessages,
          tools: tools,
          tool_choice: "auto"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const message = aiResponse.choices[0].message;

      conversationMessages.push(message);

      if (message.tool_calls && message.tool_calls.length > 0) {
        // Executar todas as tool calls
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`Executando ferramenta: ${toolName}`, toolArgs);

          const result = await executeToolCall(toolName, toolArgs, supabase);

          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result
          });
        }
      } else {
        shouldContinue = false;
      }
    }

    const finalMessage = conversationMessages[conversationMessages.length - 1];

    return new Response(
      JSON.stringify({ 
        message: finalMessage.content,
        iterations 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
