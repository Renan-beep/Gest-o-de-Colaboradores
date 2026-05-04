import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Lock, Unlock, Loader2 } from "lucide-react";

interface Colab {
  id: string;
  colaborador: string;
  cargo: string | null;
  setor: string | null;
  turno: string | null;
  status: string;
}

const SEM_ALOCACAO = "__SEM_ALOCACAO__";

function getIniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ColabCard({ colab, isReadOnly }: { colab: Colab; isReadOnly: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: colab.id,
    disabled: isReadOnly,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/40 transition-colors ${
        isReadOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-30" : ""}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-muted">
          {getIniciais(colab.colaborador)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{colab.colaborador}</p>
        {colab.cargo && (
          <p className="text-[10px] text-muted-foreground truncate">{colab.cargo}</p>
        )}
      </div>
    </div>
  );
}

function Cell({
  setor,
  turno,
  colabs,
  isReadOnly,
  isSemAlocacao,
}: {
  setor: string;
  turno: string;
  colabs: Colab[];
  isReadOnly: boolean;
  isSemAlocacao?: boolean;
}) {
  const id = `${setor}|||${turno}`;
  const { setNodeRef, isOver } = useDroppable({ id, disabled: isReadOnly });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 rounded-md border-2 border-dashed transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      } ${isSemAlocacao ? "bg-amber-50/40 dark:bg-amber-950/10" : "bg-muted/20"}`}
    >
      {colabs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Arrastar aqui
        </p>
      ) : (
        <div className="space-y-1.5">
          {colabs.map((c) => (
            <ColabCard key={c.id} colab={c} isReadOnly={isReadOnly} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PainelEncarregado() {
  const { user, isGerencia, isAdmin, isEncarregado } = useAuth();
  const podeMover = isGerencia || isAdmin || isEncarregado;

  const [colabs, setColabs] = useState<Colab[]>([]);
  const [loading, setLoading] = useState(true);
  const [readOnly, setReadOnly] = useState(!podeMover);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [fSetor, setFSetor] = useState("__all__");
  const [fTurno, setFTurno] = useState("__all__");
  const [fStatus, setFStatus] = useState("__all__");
  const [fCargo, setFCargo] = useState("__all__");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Carregamento inicial + paginação manual
  const fetchColabs = async () => {
    const all: Colab[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, colaborador, cargo, setor, turno, status")
        .eq("status", "Ativo")
        .order("colaborador")
        .range(from, from + pageSize - 1);
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar colaboradores");
        break;
      }
      if (!data || data.length === 0) break;
      all.push(...(data as Colab[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setColabs(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchColabs();

    const channel = supabase
      .channel("painel-encarregado-colabs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "colaboradores" },
        (payload) => {
          setColabs((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== (payload.old as any).id);
            }
            const novo = payload.new as Colab;
            if (novo.status !== "Ativo") {
              return prev.filter((c) => c.id !== novo.id);
            }
            const exists = prev.some((c) => c.id === novo.id);
            if (exists) {
              return prev.map((c) => (c.id === novo.id ? { ...c, ...novo } : c));
            }
            return [...prev, novo].sort((a, b) =>
              a.colaborador.localeCompare(b.colaborador)
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Listas únicas
  const setores = useMemo(() => {
    const s = new Set<string>();
    colabs.forEach((c) => c.setor && s.add(c.setor));
    return Array.from(s).sort();
  }, [colabs]);

  const turnos = useMemo(() => {
    const s = new Set<string>();
    colabs.forEach((c) => c.turno && s.add(c.turno));
    return Array.from(s).sort();
  }, [colabs]);

  const cargos = useMemo(() => {
    const s = new Set<string>();
    colabs.forEach((c) => c.cargo && s.add(c.cargo));
    return Array.from(s).sort();
  }, [colabs]);

  const statusList = useMemo(() => {
    const s = new Set<string>();
    colabs.forEach((c) => c.status && s.add(c.status));
    return Array.from(s).sort();
  }, [colabs]);

  // Aplica filtros
  const colabsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return colabs.filter((c) => {
      if (termo && !c.colaborador.toLowerCase().includes(termo)) return false;
      if (fSetor !== "__all__" && (c.setor ?? "") !== fSetor) return false;
      if (fTurno !== "__all__" && (c.turno ?? "") !== fTurno) return false;
      if (fStatus !== "__all__" && c.status !== fStatus) return false;
      if (fCargo !== "__all__" && (c.cargo ?? "") !== fCargo) return false;
      return true;
    });
  }, [colabs, busca, fSetor, fTurno, fStatus, fCargo]);

  // Agrupa por setor + turno
  const grid = useMemo(() => {
    const map = new Map<string, Colab[]>();
    colabsFiltrados.forEach((c) => {
      const setor = c.setor || SEM_ALOCACAO;
      const turno = c.turno || SEM_ALOCACAO;
      const isSemAlocacao = setor === SEM_ALOCACAO || turno === SEM_ALOCACAO;
      const key = isSemAlocacao
        ? `${SEM_ALOCACAO}|||${turno === SEM_ALOCACAO ? SEM_ALOCACAO : turno}`
        : `${setor}|||${turno}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return map;
  }, [colabsFiltrados]);

  const turnosComSemAloc = useMemo(() => {
    const lista = [...turnos];
    if (colabsFiltrados.some((c) => !c.turno)) lista.push(SEM_ALOCACAO);
    return lista;
  }, [turnos, colabsFiltrados]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const colabId = String(e.active.id);
    const [novoSetor, novoTurno] = String(e.over.id).split("|||");

    const colab = colabs.find((c) => c.id === colabId);
    if (!colab) return;

    const setorAtual = colab.setor || SEM_ALOCACAO;
    const turnoAtual = colab.turno || SEM_ALOCACAO;
    if (setorAtual === novoSetor && turnoAtual === novoTurno) return;

    const setorParaSalvar = novoSetor === SEM_ALOCACAO ? null : novoSetor;
    const turnoParaSalvar = novoTurno === SEM_ALOCACAO ? null : novoTurno;

    // Otimista
    setColabs((prev) =>
      prev.map((c) =>
        c.id === colabId
          ? { ...c, setor: setorParaSalvar, turno: turnoParaSalvar }
          : c
      )
    );

    const { error: errColab } = await supabase
      .from("colaboradores")
      .update({ setor: setorParaSalvar, turno: turnoParaSalvar })
      .eq("id", colabId);

    if (errColab) {
      toast.error("Erro ao mover colaborador");
      // Reverte
      setColabs((prev) =>
        prev.map((c) =>
          c.id === colabId ? { ...c, setor: colab.setor, turno: colab.turno } : c
        )
      );
      return;
    }

    // Sincroniza headcount
    await supabase
      .from("headcount_colaboradores")
      .update({ setor: setorParaSalvar, turno: turnoParaSalvar })
      .eq("colaborador_origem_id", colabId);

    // Histórico
    await supabase.from("movimentacoes_colaboradores").insert({
      colaborador_id: colabId,
      setor_anterior: colab.setor,
      setor_novo: setorParaSalvar,
      turno_anterior: colab.turno,
      turno_novo: turnoParaSalvar,
      movido_por: user?.id ?? null,
    });

    const labelSetor = setorParaSalvar ?? "Sem Setor";
    const labelTurno = turnoParaSalvar ?? "Sem Turno";
    toast.success(`${colab.colaborador} movido para ${labelSetor} / ${labelTurno}`);
  };

  const setoresHeader = useMemo(() => {
    const lista = [...setores];
    return lista;
  }, [setores]);

  const totalPorSetor = (setor: string) =>
    colabsFiltrados.filter(
      (c) => (setor === SEM_ALOCACAO ? !c.setor : c.setor === setor)
    ).length;

  const totalPorTurno = (turno: string) =>
    colabsFiltrados.filter(
      (c) => (turno === SEM_ALOCACAO ? !c.turno : c.turno === turno)
    ).length;

  const colabAtivo = activeId ? colabs.find((c) => c.id === activeId) : null;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Painel do Encarregado</h1>
          <p className="text-sm text-muted-foreground">
            Arraste colaboradores entre setores e turnos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {readOnly && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" /> Somente leitura
            </Badge>
          )}
          <Button
            variant={readOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setReadOnly((v) => !v)}
            disabled={!podeMover && !readOnly}
          >
            {readOnly ? (
              <><Unlock className="h-4 w-4 mr-1" /> Ativar edição</>
            ) : (
              <><Lock className="h-4 w-4 mr-1" /> Modo leitura</>
            )}
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={fSetor} onValueChange={setFSetor}>
            <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os setores</SelectItem>
              {setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fTurno} onValueChange={setFTurno}>
            <SelectTrigger><SelectValue placeholder="Turno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os turnos</SelectItem>
              {turnos.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os status</SelectItem>
              {statusList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fCargo} onValueChange={setFCargo}>
            <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os cargos</SelectItem>
              {cargos.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Card className="p-3 overflow-x-auto">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `140px repeat(${setoresHeader.length}, minmax(180px, 1fr)) 200px`,
                minWidth: `${140 + setoresHeader.length * 180 + 200}px`,
              }}
            >
              {/* Header */}
              <div className="font-semibold text-xs text-muted-foreground p-2">
                Turno \ Setor
              </div>
              {setoresHeader.map((s) => (
                <div key={s} className="font-semibold text-sm p-2 text-center border-b">
                  {s}
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {totalPorSetor(s)} colab.
                  </div>
                </div>
              ))}
              <div className="font-semibold text-sm p-2 text-center border-b bg-amber-100/40 dark:bg-amber-950/20 rounded-t">
                Sem Alocação
                <div className="text-[10px] text-muted-foreground font-normal">
                  {colabsFiltrados.filter((c) => !c.setor || !c.turno).length} colab.
                </div>
              </div>

              {/* Linhas */}
              {turnosComSemAloc.map((t) => (
                <div key={t} className="contents">
                  <div className="font-medium text-sm p-2 flex flex-col justify-center border-r">
                    <span>{t === SEM_ALOCACAO ? "Sem Turno" : t}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {totalPorTurno(t)} colab.
                    </span>
                  </div>
                  {setoresHeader.map((s) => (
                    <Cell
                      key={`${s}|||${t}`}
                      setor={s}
                      turno={t}
                      colabs={grid.get(`${s}|||${t}`) ?? []}
                      isReadOnly={readOnly}
                    />
                  ))}
                  <Cell
                    key={`${SEM_ALOCACAO}|||${t}`}
                    setor={SEM_ALOCACAO}
                    turno={t}
                    colabs={grid.get(`${SEM_ALOCACAO}|||${t}`) ?? []}
                    isReadOnly={readOnly}
                    isSemAlocacao
                  />
                </div>
              ))}
            </div>
          </Card>

          <DragOverlay>
            {colabAtivo && (
              <div className="flex items-center gap-2 p-2 rounded-md border bg-card shadow-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted">
                    {getIniciais(colabAtivo.colaborador)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{colabAtivo.colaborador}</p>
                  {colabAtivo.cargo && (
                    <p className="text-[10px] text-muted-foreground">{colabAtivo.cargo}</p>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
