import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TurnoverData {
  ano: number;
  admissoes: number;
  demissoes: number;
  turnover: number;
  saldo: number;
}

export function useTurnover(ano?: number) {
  const [turnoverData, setTurnoverData] = useState<TurnoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const anoSelecionado = ano || new Date().getFullYear();

  useEffect(() => {
    fetchTurnoverData();
  }, [anoSelecionado]);

  const fetchTurnoverData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar colaboradores ativos
      const { data: colaboradoresAtivos, error: ativosError } = await supabase
        .from('colaboradores')
        .select('id, admissao')
        .ilike('status', 'ativo')
        .not('admissao', 'is', null);

      if (ativosError) throw ativosError;

      // Buscar admissões do ano selecionado
      const inicioAno = `${anoSelecionado}-01-01`;
      const fimAno = `${anoSelecionado}-12-31`;

      const { data: admissoesAno, error: admissoesError } = await supabase
        .from('colaboradores')
        .select('id, admissao')
        .gte('admissao', inicioAno)
        .lte('admissao', fimAno)
        .not('admissao', 'is', null);

      if (admissoesError) throw admissoesError;

      // Buscar demissões do ano selecionado
      const { data: demissoesAno, error: demissoesError } = await supabase
        .from('demissoes')
        .select('*')
        .gte('data_demissao', inicioAno)
        .lte('data_demissao', fimAno);

      if (demissoesError) throw demissoesError;

      // Calcular colaboradores ativos no início do ano
      const colaboradoresInicioAno = colaboradoresAtivos?.filter(c => {
        const anoAdmissao = new Date(c.admissao).getFullYear();
        return anoAdmissao <= anoSelecionado;
      }) || [];

      const admissoes = admissoesAno?.length || 0;
      const demissoes = demissoesAno?.length || 0;

      // Calcular o número médio de colaboradores durante o ano
      const colaboradoresBaseInicio = colaboradoresInicioAno.length - admissoes;
      const mediaColaboradores = colaboradoresBaseInicio + (admissoes / 2) - (demissoes / 2);

      // Turnover = (Demissões / Média de colaboradores) * 100
      const turnover = mediaColaboradores > 0 ? ((demissoes / mediaColaboradores) * 100) : 0;
      const saldo = admissoes - demissoes;

      setTurnoverData({
        ano: anoSelecionado,
        admissoes,
        demissoes,
        turnover: Number(turnover.toFixed(1)),
        saldo
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { turnoverData, loading, error, refetch: fetchTurnoverData };
}
