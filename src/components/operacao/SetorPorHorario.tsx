import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Users } from "lucide-react";
import { IndicadoresConcentracao } from "./IndicadoresConcentracao";

interface ColaboradorTurno {
  id: string;
  colaborador: string;
  setor: string;
  turno: string | null;
}

interface SetorPorHorarioProps {
  colaboradores: ColaboradorTurno[];
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const parseTurno = (turno: string): { start: number; end: number } | null => {
  const match = turno.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const start = toMin(match[1]);
  let end = toMin(match[2]);
  if (end <= start) end += 24 * 60;
  return { start, end };
};

const HORA_INICIO = 6 * 60;
const HORA_FIM = 30 * 60;
const STEP = 60;

const formatHora = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  return `${String(h).padStart(2, "0")}:00`;
};

const maiorFaixaContigua = (
  slots: number[],
  totais: Record<number, number>,
  alvo: number
): string => {
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (const s of slots) {
    if (totais[s] === alvo) {
      if (curLen === 0) curStart = s;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curLen = 0;
    }
  }
  if (bestStart < 0) return "—";
  return `${formatHora(bestStart)} - ${formatHora(bestStart + bestLen * STEP)}`;
};

export function SetorPorHorario({ colaboradores }: SetorPorHorarioProps) {
  const setoresData = useMemo(() => {
    const map = new Map<string, ColaboradorTurno[]>();
    colaboradores.forEach((c) => {
      if (!c.setor || !c.turno) return;
      const arr = map.get(c.setor) || [];
      arr.push(c);
      map.set(c.setor, arr);
    });
    return Array.from(map.entries())
      .map(([setor, colabs]) => ({ setor, colabs }))
      .sort((a, b) => b.colabs.length - a.colabs.length);
  }, [colaboradores]);

  const slots = useMemo(() => {
    const arr: number[] = [];
    for (let m = HORA_INICIO; m < HORA_FIM; m += STEP) arr.push(m);
    return arr;
  }, []);

  const matriz = useMemo(() => {
    const result: Record<string, Record<number, ColaboradorTurno[]>> = {};
    setoresData.forEach(({ setor, colabs }) => {
      result[setor] = {};
      slots.forEach((slotStart) => {
        const slotEnd = slotStart + STEP;
        const presentes = colabs.filter((c) => {
          const t = parseTurno(c.turno!);
          if (!t) return false;
          const overlap = (s: number, e: number) => s < slotEnd && e > slotStart;
          return overlap(t.start, t.end) || overlap(t.start - 1440, t.end - 1440);
        });
        result[setor][slotStart] = presentes;
      });
    });
    return result;
  }, [setoresData, slots]);

  const totaisPorSlot = useMemo(() => {
    const totais: Record<number, number> = {};
    slots.forEach((s) => {
      totais[s] = setoresData.reduce(
        (acc, { setor }) => acc + (matriz[setor]?.[s]?.length || 0),
        0
      );
    });
    return totais;
  }, [matriz, setoresData, slots]);

  const maxPorSetor = useMemo(() => {
    const max: Record<string, number> = {};
    setoresData.forEach(({ setor }) => {
      max[setor] = Math.max(
        ...slots.map((s) => matriz[setor]?.[s]?.length || 0),
        1
      );
    });
    return max;
  }, [matriz, setoresData, slots]);

  const maxTotalSlot = Math.max(...Object.values(totaisPorSlot), 1);

  const { picoFaixa, valeFaixa, picoEntidade, valeEntidade } = useMemo(() => {
    const slotsComDados = slots.filter((s) => totaisPorSlot[s] > 0);
    let picoF: { faixa: string; qtd: number } | null = null;
    let valeF: { faixa: string; qtd: number } | null = null;
    if (slotsComDados.length > 0) {
      const valores = slotsComDados.map((s) => totaisPorSlot[s]);
      const maxVal = Math.max(...valores);
      const minVal = Math.min(...valores);
      picoF = { faixa: maiorFaixaContigua(slots, totaisPorSlot, maxVal), qtd: maxVal };
      valeF = { faixa: maiorFaixaContigua(slots, totaisPorSlot, minVal), qtd: minVal };
    }
    let picoE = null;
    let valeE = null;
    if (setoresData.length > 0) {
      const sorted = [...setoresData].sort((a, b) => a.colabs.length - b.colabs.length);
      const max = sorted[sorted.length - 1];
      const min = sorted[0];
      picoE = { label: max.setor, qtd: max.colabs.length };
      valeE = { label: min.setor, qtd: min.colabs.length };
    }
    return { picoFaixa: picoF, valeFaixa: valeF, picoEntidade: picoE, valeEntidade: valeE };
  }, [slots, totaisPorSlot, setoresData]);

  if (setoresData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum colaborador com setor e turno definidos.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <IndicadoresConcentracao
        entidadeLabel="Setor"
        picoFaixa={picoFaixa}
        valeFaixa={valeFaixa}
        picoEntidade={picoEntidade}
        valeEntidade={valeEntidade}
      />
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Distribuição de Setores por Horário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quantidade de colaboradores ativos por setor ao longo do dia. Clique nas células para ver detalhes.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 bg-muted/40 z-10 text-left px-3 py-2 font-semibold min-w-[200px]">
                  Setor
                </th>
                {slots.map((s) => (
                  <th
                    key={s}
                    className="px-2 py-2 font-medium text-center whitespace-nowrap min-w-[80px]"
                  >
                    {formatHora(s)} - {formatHora(s + STEP)}
                  </th>
                ))}
                <th className="px-2 py-2 font-semibold text-center bg-primary/10 min-w-[60px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {setoresData.map(({ setor, colabs }) => (
                <tr key={setor} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="sticky left-0 bg-background z-10 px-3 py-2 font-medium whitespace-nowrap border-r">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[180px]">{setor}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {colabs.length}
                      </span>
                    </div>
                  </td>
                  {slots.map((s) => {
                    const presentes = matriz[setor]?.[s] || [];
                    const qtd = presentes.length;
                    const intensidade = qtd / maxPorSetor[setor];
                    const opacity = qtd === 0 ? 0 : Math.max(0.15, intensidade);
                    return (
                      <Tooltip key={s}>
                        <TooltipTrigger asChild>
                          <td
                            className="text-center px-1 py-2 cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:ring-inset"
                            style={{
                              backgroundColor:
                                qtd > 0 ? `hsl(var(--primary) / ${opacity})` : undefined,
                            }}
                          >
                            <span
                              className={`font-semibold ${
                                opacity > 0.5 ? "text-primary-foreground" : "text-foreground"
                              }`}
                            >
                              {qtd > 0 ? qtd : ""}
                            </span>
                          </td>
                        </TooltipTrigger>
                        {qtd > 0 && (
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="text-xs">
                              <p className="font-semibold mb-1">
                                {setor} • {formatHora(s)}–{formatHora(s + STEP)}
                              </p>
                              <p className="text-muted-foreground mb-1">
                                {qtd} colaborador(es) ativo(s)
                              </p>
                              <ul className="max-h-40 overflow-auto space-y-0.5">
                                {presentes.slice(0, 15).map((c) => (
                                  <li key={c.id} className="text-[11px]">
                                    • {c.colaborador}
                                  </li>
                                ))}
                                {presentes.length > 15 && (
                                  <li className="text-[11px] text-muted-foreground">
                                    +{presentes.length - 15} outros…
                                  </li>
                                )}
                              </ul>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                  <td className="text-center px-2 py-2 font-bold bg-primary/5">
                    {colabs.length}
                  </td>
                </tr>
              ))}

              <tr className="border-t-2 bg-muted/30 font-bold">
                <td className="sticky left-0 bg-muted/30 z-10 px-3 py-2 border-r">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Total no horário
                  </div>
                </td>
                {slots.map((s) => {
                  const total = totaisPorSlot[s];
                  const isPico = total === maxTotalSlot && total > 0;
                  return (
                    <td
                      key={s}
                      className={`text-center px-1 py-2 ${
                        isPico
                          ? "bg-primary text-primary-foreground"
                          : total > 0
                          ? "bg-primary/15"
                          : ""
                      }`}
                    >
                      {total > 0 ? total : ""}
                      {isPico && <span className="ml-0.5">🔥</span>}
                    </td>
                  );
                })}
                <td className="text-center px-2 py-2 bg-primary/20">
                  {colaboradores.filter((c) => c.setor && c.turno).length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 p-3 border-t text-xs text-muted-foreground">
          <span className="font-medium">Intensidade:</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-3 rounded border bg-primary/15"></span>
            <span>baixa</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-3 rounded bg-primary/50"></span>
            <span>média</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-3 rounded bg-primary"></span>
            <span>pico</span>
          </div>
          <span className="ml-auto">🔥 = horário de maior concentração geral</span>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
