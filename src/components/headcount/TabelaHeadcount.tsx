import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Users, Filter, Search, RefreshCw, ArrowRightLeft, UserPlus, Clock, UserCheck, UserX, History, TrendingUp } from "lucide-react";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";
import { MovimentacaoModal } from "@/components/headcount/MovimentacaoModal";
import { LinhaTempoModal } from "@/components/headcount/LinhaTempoModal";
import { AdicionarColaboradorModal } from "@/components/headcount/AdicionarColaboradorModal";
import type { HeadcountColaborador } from "@/types/headcount";

interface TabelaHeadcountProps {
  colaboradores: HeadcountColaborador[];
  onRefresh: () => void;
}

export function TabelaHeadcount({ colaboradores, onRefresh }: TabelaHeadcountProps) {
  const [filtros, setFiltros] = useState({
    busca: "",
    status: [] as string[],
    cargo: [] as string[],
    setor: [] as string[],
    subsetor: [] as string[],
    lideranca: [] as string[],
    turno: [] as string[],
    sexo: [] as string[],
    movimentacao: "todos" as "todos" | "sem" | "aumento_quadro" | "substituicao",
  });

  const [movModalOpen, setMovModalOpen] = useState(false);
  const [linhaTempoOpen, setLinhaTempoOpen] = useState(false);
  const [addColabOpen, setAddColabOpen] = useState(false);
  const [selectedColab, setSelectedColab] = useState<HeadcountColaborador | null>(null);

  const opcoesFiltros = useMemo(() => {
    const get = (field: keyof HeadcountColaborador) =>
      [...new Set(colaboradores.map(c => c[field] as string).filter(v => v && v.trim() !== ""))].sort();
    return {
      cargos: get("cargo"),
      setores: get("setor"),
      subsetores: get("subsetor"),
      liderancas: get("lideranca"),
      turnos: get("turno"),
      sexos: get("sexo"),
      statuses: get("status"),
    };
  }, [colaboradores]);

  const filteredColaboradores = useMemo(() => {
    let filtered = colaboradores;
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      filtered = filtered.filter(c =>
        c.colaborador.toLowerCase().includes(busca) ||
        c.matricula.toLowerCase().includes(busca) ||
        c.cargo?.toLowerCase().includes(busca) ||
        c.setor?.toLowerCase().includes(busca) ||
        c.lideranca?.toLowerCase().includes(busca)
      );
    }
    if (filtros.status.length > 0) filtered = filtered.filter(c => filtros.status.includes(c.status));
    if (filtros.cargo.length > 0) filtered = filtered.filter(c => filtros.cargo.includes(c.cargo || ""));
    if (filtros.setor.length > 0) filtered = filtered.filter(c => filtros.setor.includes(c.setor || ""));
    if (filtros.subsetor.length > 0) filtered = filtered.filter(c => filtros.subsetor.includes(c.subsetor || ""));
    if (filtros.lideranca.length > 0) filtered = filtered.filter(c => filtros.lideranca.includes(c.lideranca || ""));
    if (filtros.turno.length > 0) filtered = filtered.filter(c => filtros.turno.includes(c.turno || ""));
    if (filtros.sexo.length > 0) filtered = filtered.filter(c => filtros.sexo.includes(c.sexo || ""));
    if (filtros.movimentacao !== "todos") {
      if (filtros.movimentacao === "sem") {
        filtered = filtered.filter(c => !c.movimentacao_tipo);
      } else {
        filtered = filtered.filter(c => c.movimentacao_tipo === filtros.movimentacao);
      }
    }
    return filtered;
  }, [colaboradores, filtros]);

  const limparFiltros = () => {
    setFiltros({ busca: "", status: [], cargo: [], setor: [], subsetor: [], lideranca: [], turno: [], sexo: [], movimentacao: "todos" });
  };

  const formatarData = (data: string | null) => {
    if (!data) return "-";
    const [y, m, d] = data.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  };

  const calcularTempoEmpresa = (dataAdmissao: string | null) => {
    if (!dataAdmissao) return null;
    try {
      const admissao = parseISO(dataAdmissao);
      const hoje = new Date();
      const totalMeses = differenceInMonths(hoje, admissao);
      const anos = differenceInYears(hoje, admissao);
      const meses = totalMeses - anos * 12;
      if (anos === 0 && meses === 0) return "< 1 mês";
      if (anos === 0) return `${meses}m`;
      if (meses === 0) return `${anos}a`;
      return `${anos}a ${meses}m`;
    } catch { return null; }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "ativo") return <Badge className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>;
    if (s === "demitido") return <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" />Demitido</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Afastado</Badge>;
  };

  const getMovimentacaoBadge = (tipo: string | null) => {
    if (!tipo) return <span className="text-muted-foreground text-xs">—</span>;
    if (tipo === "aumento_quadro") return <Badge className="bg-blue-100 text-blue-800"><TrendingUp className="w-3 h-3 mr-1" />Aumento</Badge>;
    return <Badge className="bg-orange-100 text-orange-800"><ArrowRightLeft className="w-3 h-3 mr-1" />Substituição</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setAddColabOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />Adicionar Histórico
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" />Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Busca Geral</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome, matrícula, cargo, setor..." value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} className="pl-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <MultiSelect options={opcoesFiltros.statuses} selected={filtros.status} onChange={v => setFiltros(p => ({ ...p, status: v }))} placeholder="Todos" />
            </div>
            <div className="space-y-2">
              <Label>Movimentação</Label>
              <Select value={filtros.movimentacao} onValueChange={v => setFiltros(p => ({ ...p, movimentacao: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="sem">Sem movimentação</SelectItem>
                  <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
                  <SelectItem value="substituicao">Substituição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cargo</Label><MultiSelect options={opcoesFiltros.cargos} selected={filtros.cargo} onChange={v => setFiltros(p => ({ ...p, cargo: v }))} placeholder="Todos" /></div>
            <div className="space-y-2"><Label>Setor</Label><MultiSelect options={opcoesFiltros.setores} selected={filtros.setor} onChange={v => setFiltros(p => ({ ...p, setor: v }))} placeholder="Todos" /></div>
            <div className="space-y-2"><Label>Subsetor</Label><MultiSelect options={opcoesFiltros.subsetores} selected={filtros.subsetor} onChange={v => setFiltros(p => ({ ...p, subsetor: v }))} placeholder="Todos" /></div>
            <div className="space-y-2"><Label>Liderança</Label><MultiSelect options={opcoesFiltros.liderancas} selected={filtros.lideranca} onChange={v => setFiltros(p => ({ ...p, lideranca: v }))} placeholder="Todas" /></div>
            <div className="space-y-2"><Label>Turno</Label><MultiSelect options={opcoesFiltros.turnos} selected={filtros.turno} onChange={v => setFiltros(p => ({ ...p, turno: v }))} placeholder="Todos" /></div>
            <div className="space-y-2"><Label>Sexo</Label><MultiSelect options={opcoesFiltros.sexos.length > 0 ? opcoesFiltros.sexos : ["Masculino", "Feminino"]} selected={filtros.sexo} onChange={v => setFiltros(p => ({ ...p, sexo: v }))} placeholder="Todos" /></div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Button variant="outline" onClick={limparFiltros}><RefreshCw className="w-4 h-4 mr-2" />Limpar Filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Exibindo {filteredColaboradores.length} de {colaboradores.length} colaboradores</div></CardContent></Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead><TableHead>Nome</TableHead><TableHead>Sexo</TableHead>
                  <TableHead>Status</TableHead><TableHead>Cargo</TableHead><TableHead>Setor</TableHead>
                  <TableHead>Subsetor</TableHead><TableHead>Liderança</TableHead><TableHead>Turno</TableHead>
                  <TableHead>Admissão</TableHead><TableHead>Tempo</TableHead><TableHead>Movimentação</TableHead>
                  <TableHead>Data Efetiva</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.map(colab => (
                  <TableRow key={colab.id}>
                    <TableCell className="font-medium">
                      {colab.matricula}
                      {colab.adicionado_manualmente && <Badge variant="outline" className="ml-1 text-[10px] px-1">Manual</Badge>}
                    </TableCell>
                    <TableCell>{colab.colaborador}</TableCell>
                    <TableCell>{colab.sexo || "-"}</TableCell>
                    <TableCell>{getStatusBadge(colab.status)}</TableCell>
                    <TableCell>{colab.cargo || "-"}</TableCell>
                    <TableCell>{colab.setor || "-"}</TableCell>
                    <TableCell>{colab.subsetor || "-"}</TableCell>
                    <TableCell>{colab.lideranca || "-"}</TableCell>
                    <TableCell>{colab.turno || "-"}</TableCell>
                    <TableCell>{formatarData(colab.admissao)}</TableCell>
                    <TableCell><span className="text-sm">{calcularTempoEmpresa(colab.admissao) || "-"}</span></TableCell>
                    <TableCell>{getMovimentacaoBadge(colab.movimentacao_tipo)}</TableCell>
                    <TableCell>{formatarData(colab.movimentacao_data)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedColab(colab); setMovModalOpen(true); }} title="Registrar movimentação"><ArrowRightLeft className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedColab(colab); setLinhaTempoOpen(true); }} title="Linha do tempo"><History className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredColaboradores.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">Nenhum colaborador encontrado</div>
            </div>
          )}
        </CardContent>
      </Card>

      <MovimentacaoModal open={movModalOpen} onOpenChange={setMovModalOpen} colaborador={selectedColab} todosColaboradores={colaboradores} onSuccess={onRefresh} />
      <LinhaTempoModal open={linhaTempoOpen} onOpenChange={setLinhaTempoOpen} colaboradorId={selectedColab?.id || null} colaboradorNome={selectedColab ? `${selectedColab.matricula} - ${selectedColab.colaborador}` : ""} />
      <AdicionarColaboradorModal open={addColabOpen} onOpenChange={setAddColabOpen} onSuccess={onRefresh} />
    </div>
  );
}
