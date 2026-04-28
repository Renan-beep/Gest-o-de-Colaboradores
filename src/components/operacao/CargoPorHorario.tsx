import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Users, UserCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { IndicadoresConcentracao } from "./IndicadoresConcentracao";
import { FullscreenWrapper } from "./FullscreenWrapper";

interface ColaboradorTurno {
  id: string;
  colaborador: string;
  cargo: string;
  turno: string | null;
}

interface CargoPorHorarioProps {
  colaboradores: ColaboradorTurno[];
  chamadasMap?: Map<string, string>;
}

// Converte "HH:MM" em minutos
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Parse turno "06:00 - 15:15" → { startMin, endMin }
const parseTurno = (turno: string): { start: number; end: number } | null => {
  const match = turno.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const start = toMin(match[1]);
  let end = toMin(match[2]);
  // Se atravessa a meia-noite (ex: 22:00 - 06:52), adiciona 24h
  if (end <= start) end += 24 * 60;
  return { start, end };
};

// Faixa de horas para exibir: 06:00 → 30:00 (06:00 do dia seguinte)
const HORA_INICIO = 6 * 60;
const HORA_FIM = 30 * 60; // 06:00 do dia seguinte
const STEP = 60; // intervalos de 1h

const formatHora = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  return `${String(h).padStart(2, "0")}:00`;
};

// Encontra a maior faixa contígua de slots com o valor alvo e retorna "HH:00 - HH:00"
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

export function CargoPorHorario({ colaboradores, chamadasMap }: CargoPorHorarioProps) {
  const [somentePresentes, setSomentePresentes] = useState(false);

  // Aplica filtro de "somente presentes" se ativado
  const colaboradoresBase = useMemo(() => {
    if (!somentePresentes || !chamadasMap) return colaboradores;
    return colaboradores.filter(
      (c) => chamadasMap.get(c.id)?.toLowerCase() === "presente"
    );
  }, [colaboradores, chamadasMap, somentePresentes]);

  // Agrupa por cargo
  const cargosData = useMemo(() => {
    const map = new Map<string, ColaboradorTurno[]>();
    colaboradoresBase.forEach((c) => {
      if (!c.cargo || !c.turno) return;
      const arr = map.get(c.cargo) || [];
      arr.push(c);
      map.set(c.cargo, arr);
    });
    return Array.from(map.entries())
      .map(([cargo, colabs]) => ({ cargo, colabs }))
      .sort((a, b) => b.colabs.length - a.colabs.length);
  }, [colaboradoresBase]);

  // Slots de hora
  const slots = useMemo(() => {
    const arr: number[] = [];
    for (let m = HORA_INICIO; m < HORA_FIM; m += STEP) arr.push(m);
    return arr;
  }, []);

  // Para cada cargo × slot, calcula quantos colaboradores estão ativos
  const matriz = useMemo(() => {
    const result: Record<string, Record<number, ColaboradorTurno[]>> = {};

    cargosData.forEach(({ cargo, colabs }) => {
      result[cargo] = {};
      slots.forEach((slotStart) => {
        const slotEnd = slotStart + STEP;
        const presentes = colabs.filter((c) => {
          const t = parseTurno(c.turno!);
          if (!t) return false;
          // Considera turno tanto no dia "normal" quanto deslocado +24h
          const overlap = (s: number, e: number) =>
            s < slotEnd && e > slotStart;
          return overlap(t.start, t.end) || overlap(t.start - 1440, t.end - 1440);
        });
        result[cargo][slotStart] = presentes;
      });
    });
    return result;
  }, [cargosData, slots]);

  // Total geral por slot (para destacar picos)
  const totaisPorSlot = useMemo(() => {
    const totais: Record<number, number> = {};
    slots.forEach((s) => {
      totais[s] = cargosData.reduce(
        (acc, { cargo }) => acc + (matriz[cargo]?.[s]?.length || 0),
        0
      );
    });
    return totais;
  }, [matriz, cargosData, slots]);

  // Máximo por cargo (para colorimetria)
  const maxPorCargo = useMemo(() => {
    const max: Record<string, number> = {};
    cargosData.forEach(({ cargo }) => {
      max[cargo] = Math.max(
        ...slots.map((s) => matriz[cargo]?.[s]?.length || 0),
        1
      );
    });
    return max;
  }, [matriz, cargosData, slots]);

  const maxTotalSlot = Math.max(...Object.values(totaisPorSlot), 1);

  // Indicadores: pico/vale por faixa e por cargo
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
    if (cargosData.length > 0) {
      const sorted = [...cargosData].sort((a, b) => a.colabs.length - b.colabs.length);
      const max = sorted[sorted.length - 1];
      const min = sorted[0];
      picoE = { label: max.cargo, qtd: max.colabs.length };
      valeE = { label: min.cargo, qtd: min.colabs.length };
    }
    return { picoFaixa: picoF, valeFaixa: valeF, picoEntidade: picoE, valeEntidade: valeE };
  }, [slots, totaisPorSlot, cargosData]);

  if (cargosData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum colaborador com cargo e turno definidos.
        </CardContent>
      </Card>
    );
  }

  // Cor base: primary normal, ou verde quando filtrando "somente presentes"
  const accentHsl = somentePresentes ? "142 71% 45%" : "var(--primary)";
  const accentClasses = somentePresentes
    ? {
        ring: "hover:ring-green-600",
        textOn: "text-white",
        bgFaded: "bg-green-600/15",
        bgStrong: "bg-green-600 text-white",
        bgSoft: "bg-green-600/5",
        bgSoft2: "bg-green-600/10",
        bgSoft3: "bg-green-600/20",
        icon: "text-green-600",
      }
    : {
        ring: "hover:ring-primary",
        textOn: "text-primary-foreground",
        bgFaded: "bg-primary/15",
        bgStrong: "bg-primary text-primary-foreground",
        bgSoft: "bg-primary/5",
        bgSoft2: "bg-primary/10",
        bgSoft3: "bg-primary/20",
        icon: "text-primary",
      };

  return (
    <div>
      <IndicadoresConcentracao
        entidadeLabel="Cargo"
        picoFaixa={picoFaixa}
        valeFaixa={valeFaixa}
        picoEntidade={picoEntidade}
        valeEntidade={valeEntidade}
      />
      <div className="flex items-center gap-2 mb-3 p-3 bg-muted/30 rounded-lg border border-border">
        <Switch
          id="cargo-somente-presentes"
          checked={somentePresentes}
          onCheckedChange={setSomentePresentes}
        />
        <Label htmlFor="cargo-somente-presentes" className="text-sm cursor-pointer flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-green-600" />
          Somente os Presentes
        </Label>
        {somentePresentes && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
            Mostrando apenas presentes na chamada
          </Badge>
        )}
      </div>
      <FullscreenWrapper>
        {(isFullscreen) => (
    <Card className={isFullscreen ? "h-full flex flex-col" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${accentClasses.icon}`} />
          Distribuição de Cargos por Horário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quantidade de colaboradores ativos por cargo ao longo do dia. Clique nas células para ver detalhes.
        </p>
      </CardHeader>
      <CardContent className={isFullscreen ? "p-0 flex-1 min-h-0 flex flex-col" : "p-0"}>
        <div className={isFullscreen ? "flex-1 min-h-0 overflow-auto" : "overflow-x-auto"}>
          <table className={`text-xs border-collapse ${isFullscreen ? "w-full table-fixed" : "w-full"}`}>
            <thead>
              <tr className="border-b bg-muted/40">
                <th className={`sticky left-0 bg-muted/40 z-10 text-left px-3 py-2 font-semibold ${isFullscreen ? "w-[180px]" : "min-w-[200px]"}`}>
                  Cargo
                </th>
                {slots.map((s) => (
                  <th
                    key={s}
                    className={`px-2 py-2 font-medium text-center whitespace-nowrap ${isFullscreen ? "" : "min-w-[80px]"}`}
                  >
                    {formatHora(s)} - {formatHora(s + STEP)}
                  </th>
                ))}
                <th className={`px-2 py-2 font-semibold text-center ${accentClasses.bgSoft2} ${isFullscreen ? "w-[60px]" : "min-w-[60px]"}`}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {cargosData.map(({ cargo, colabs }) => (
                <tr key={cargo} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="sticky left-0 bg-background z-10 px-3 py-2 font-medium whitespace-nowrap border-r">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[180px]">{cargo}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {colabs.length}
                      </span>
                    </div>
                  </td>
                  {slots.map((s) => {
                    const presentes = matriz[cargo]?.[s] || [];
                    const qtd = presentes.length;
                    const intensidade = qtd / maxPorCargo[cargo];
                    const opacity = qtd === 0 ? 0 : Math.max(0.15, intensidade);
                    return (
                      <Tooltip key={s}>
                        <TooltipTrigger asChild>
                          <td
                            className={`text-center px-1 py-2 cursor-pointer transition-all hover:ring-2 ${accentClasses.ring} hover:ring-inset`}
                            style={{
                              backgroundColor:
                                qtd > 0
                                  ? `hsl(${accentHsl} / ${opacity})`
                                  : undefined,
                            }}
                          >
                            <span
                              className={`font-semibold ${
                                opacity > 0.5
                                  ? accentClasses.textOn
                                  : "text-foreground"
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
                                {cargo} • {formatHora(s)}–{formatHora(s + STEP)}
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
                  <td className={`text-center px-2 py-2 font-bold ${accentClasses.bgSoft}`}>
                    {colabs.length}
                  </td>
                </tr>
              ))}

              {/* Linha de totais */}
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
                          ? accentClasses.bgStrong
                          : total > 0
                          ? accentClasses.bgFaded
                          : ""
                      }`}
                    >
                      {total > 0 ? total : ""}
                      {isPico && <span className="ml-0.5">🔥</span>}
                    </td>
                  );
                })}
                <td className={`text-center px-2 py-2 ${accentClasses.bgSoft3}`}>
                  {colaboradoresBase.filter((c) => c.cargo && c.turno).length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legenda */}
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
        )}
      </FullscreenWrapper>
    </div>
  );
}
