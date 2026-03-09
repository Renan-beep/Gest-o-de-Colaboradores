import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader?.replace("Bearer ", "");
    let userName = "Usuário";
    let userId = "";

    if (token) {
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        if (profile?.full_name) userName = profile.full_name;
      }
    }

    const { messages, mode } = await req.json();

    // Fetch system context
    const [
      { count: totalColaboradores },
      { count: totalAtivos },
      { data: recentMovimentacoes },
      { data: recentChamadas },
      { count: pendingSolicitacoes },
      { data: demissoesRecentes },
    ] = await Promise.all([
      supabase.from("colaboradores").select("*", { count: "exact", head: true }),
      supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("status", "Ativo"),
      supabase.from("headcount_movimentacoes").select("tipo_movimentacao, data_efetiva, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("chamadas").select("status, data").eq("data", new Date().toISOString().split("T")[0]).limit(100),
      supabase.from("solicitacoes_movimentacao").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("demissoes").select("data_demissao, tipo_demissao").order("created_at", { ascending: false }).limit(5),
    ]);

    // Calculate chamada stats
    const chamadaStats = {
      presentes: recentChamadas?.filter(c => c.status?.toLowerCase() === "presente").length || 0,
      ausentes: recentChamadas?.filter(c => ["falta", "atestado", "licenca"].includes(c.status?.toLowerCase())).length || 0,
      total: recentChamadas?.length || 0,
    };

    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    const systemPrompt = `Você é o Copiloto IA do sistema de Gestão de Colaboradores. Seu nome é "Copiloto". 
Você é um analista digital inteligente que acompanha os dados em tempo real.

REGRAS DE COMPORTAMENTO:
- Seja direto, conciso e proativo
- Use linguagem profissional mas amigável
- Apresente dados de forma clara com bullet points
- Sugira análises e ações relevantes
- NUNCA invente dados. Use APENAS os dados fornecidos no contexto
- Responda sempre em português brasileiro
- Seja breve nas respostas, máximo 4-5 linhas por tópico
- Use emojis com moderação para dar vida

CONTEXTO ATUAL DO SISTEMA (${today}):
- Nome do usuário: ${userName}
- Total de colaboradores cadastrados: ${totalColaboradores || 0}
- Colaboradores ativos: ${totalAtivos || 0}
- Chamada de hoje: ${chamadaStats.presentes} presentes, ${chamadaStats.ausentes} ausentes de ${chamadaStats.total} registros
- Solicitações pendentes: ${pendingSolicitacoes || 0}
- Movimentações recentes: ${JSON.stringify(recentMovimentacoes || [])}
- Demissões recentes: ${JSON.stringify(demissoesRecentes || [])}

${mode === "greeting" ? `INSTRUÇÃO ESPECIAL: Faça uma saudação proativa ao usuário. Mencione dados relevantes do dia. Sugira algo útil. Seja breve (máx 6 linhas).` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
