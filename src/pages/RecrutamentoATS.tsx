import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, History, Users, Briefcase, Clock, CheckCircle, XCircle, AlertCircle, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Vaga {
  id: string;
  cargo: string;
  setor: string | null;
  motivo_abertura: string;
  colaborador_substituido_id: string | null;
  tipo_vaga: string | null;
  gestor_solicitante_id: string;
  gestor_solicitante_nome: string;
  quantidade_vagas: number;
  descricao: string | null;
  status: string;
  turno: string | null;
  lideranca: string | null;
  subsetor: string | null;
  aprovador_id: string | null;
  aprovador_nome: string | null;
  data_aprovacao: string | null;
  comentarios_aprovacao: string | null;
  candidato_nome: string | null;
  candidato_matricula: string | null;
  created_at: string;
  updated_at: string;
}

interface Colaborador {
  id: string;
  colaborador: string;
  matricula: string;
  cargo: string | null;
  setor: string | null;
  turno: string | null;
  lideranca: string | null;
  subsetor: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface VagaHistorico {
  id: string;
  vaga_id: string;
  usuario_id: string;
  usuario_nome: string;
  acao: string;
  status_anterior: string | null;
  status_novo: string | null;
  comentarios: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: Clock },
  aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  ajuste_solicitado: { label: "Ajuste Solicitado", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
  aprovada: { label: "Vaga Aprovada", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  em_processo_seletivo: { label: "Em Processo Seletivo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Users },
  pre_cadastro: { label: "Pré-Cadastro", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: UserPlus },
  aguardando_cadastro: { label: "Aguardando Cadastro", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Briefcase },
  concluida: { label: "Vaga Concluída", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  reprovada: { label: "Vaga Reprovada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const KANBAN_COLUMNS = [
  { key: "rascunho", title: "Rascunho" },
  { key: "aguardando_aprovacao", title: "Aguardando Aprovação" },
  { key: "ajuste_solicitado", title: "Ajuste Solicitado" },
  { key: "aprovada", title: "Aprovadas" },
  { key: "em_processo_seletivo", title: "Em Processo Seletivo" },
  { key: "pre_cadastro", title: "Pré-Cadastro" },
  { key: "aguardando_cadastro", title: "Aguardando Cadastro" },
  { key: "concluida", title: "Concluídas" },
  { key: "reprovada", title: "Reprovadas" },
];

const MOTIVOS_ABERTURA = [
  { value: "reposicao", label: "Reposição" },
  { value: "aumento_quadro", label: "Aumento de Quadro" },
  { value: "projeto", label: "Projeto" },
  { value: "substituicao", label: "Substituição" },
];

export default function RecrutamentoATS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [aprovadores, setAprovadores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovaVaga, setShowNovaVaga] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [historico, setHistorico] = useState<VagaHistorico[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    cargo: "",
    setor: "",
    motivo_abertura: "",
    colaborador_substituido_id: "",
    tipo_vaga: "CLT",
    quantidade_vagas: 1,
    descricao: "",
    turno: "",
    lideranca: "",
    subsetor: "",
    aprovador_id: "",
  });

  const [preCadastro, setPreCadastro] = useState({
    candidato_nome: "",
    candidato_matricula: "",
  });

  const [comentariosAprovacao, setComentariosAprovacao] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setUserProfile(profile);
      }

      // Fetch vagas
      const { data: vagasData, error: vagasError } = await supabase
        .from("vagas")
        .select("*")
        .order("created_at", { ascending: false });

      if (vagasError) throw vagasError;
      setVagas(vagasData || []);

      // Fetch colaboradores ativos
      const { data: colabData, error: colabError } = await supabase
        .from("colaboradores")
        .select("id, colaborador, matricula, cargo, setor, turno, lideranca, subsetor")
        .eq("status", "Ativo")
        .order("colaborador");

      if (colabError) throw colabError;
      setColaboradores(colabData || []);

      // Fetch aprovadores (gerencia e admin)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["admin", "gerencia"]);

      if (profilesError) throw profilesError;
      setAprovadores(profilesData || []);

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Se selecionou substituição e escolheu colaborador, preencher campos automaticamente
    if (field === "colaborador_substituido_id" && value) {
      const colab = colaboradores.find((c) => c.id === value);
      if (colab) {
        setFormData((prev) => ({
          ...prev,
          colaborador_substituido_id: value,
          cargo: colab.cargo || prev.cargo,
          setor: colab.setor || prev.setor,
          turno: colab.turno || prev.turno,
          lideranca: colab.lideranca || prev.lideranca,
          subsetor: colab.subsetor || prev.subsetor,
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cargo: "",
      setor: "",
      motivo_abertura: "",
      colaborador_substituido_id: "",
      tipo_vaga: "CLT",
      quantidade_vagas: 1,
      descricao: "",
      turno: "",
      lideranca: "",
      subsetor: "",
      aprovador_id: "",
    });
  };

  const criarVaga = async (enviarAprovacao = false) => {
    if (!formData.cargo || !formData.motivo_abertura || !formData.quantidade_vagas) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha cargo, motivo da abertura e quantidade de vagas.",
        variant: "destructive",
      });
      return;
    }

    if (enviarAprovacao && !formData.aprovador_id) {
      toast({
        title: "Selecione um aprovador",
        description: "Para enviar para aprovação, selecione quem irá aprovar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const aprovador = aprovadores.find((a) => a.user_id === formData.aprovador_id);

      const novaVaga = {
        ...formData,
        colaborador_substituido_id: formData.colaborador_substituido_id || null,
        gestor_solicitante_id: user?.id,
        gestor_solicitante_nome: userProfile?.full_name || userProfile?.email || "Usuário",
        status: enviarAprovacao ? "aguardando_aprovacao" : "rascunho",
        aprovador_id: enviarAprovacao ? formData.aprovador_id : null,
        aprovador_nome: enviarAprovacao && aprovador ? (aprovador.full_name || aprovador.email) : null,
      };

      const { data, error } = await supabase.from("vagas").insert(novaVaga).select().single();

      if (error) throw error;

      // Registrar histórico
      await supabase.from("vagas_historico").insert({
        vaga_id: data.id,
        usuario_id: user?.id,
        usuario_nome: userProfile?.full_name || userProfile?.email || "Usuário",
        acao: enviarAprovacao ? "Criou e enviou para aprovação" : "Criou rascunho",
        status_anterior: null,
        status_novo: data.status,
      });

      toast({
        title: "Sucesso",
        description: enviarAprovacao ? "Vaga enviada para aprovação!" : "Rascunho salvo!",
      });

      setShowNovaVaga(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar vaga",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const abrirDetalhes = async (vaga: Vaga) => {
    setVagaSelecionada(vaga);
    setShowDetalhes(true);

    // Carregar histórico
    const { data } = await supabase
      .from("vagas_historico")
      .select("*")
      .eq("vaga_id", vaga.id)
      .order("created_at", { ascending: false });

    setHistorico(data || []);
  };

  const atualizarStatus = async (novoStatus: string, comentarios?: string) => {
    if (!vagaSelecionada) return;

    try {
      const updates: any = {
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      if (novoStatus === "aprovada" || novoStatus === "reprovada" || novoStatus === "ajuste_solicitado") {
        updates.data_aprovacao = new Date().toISOString();
        updates.comentarios_aprovacao = comentarios || null;
      }

      const { error } = await supabase
        .from("vagas")
        .update(updates)
        .eq("id", vagaSelecionada.id);

      if (error) throw error;

      // Registrar histórico
      let acao = "";
      switch (novoStatus) {
        case "aprovada": acao = "Aprovou a vaga"; break;
        case "reprovada": acao = "Reprovou a vaga"; break;
        case "ajuste_solicitado": acao = "Solicitou ajustes"; break;
        case "em_processo_seletivo": acao = "Iniciou processo seletivo"; break;
        case "pre_cadastro": acao = "Avançou para pré-cadastro"; break;
        case "aguardando_cadastro": acao = "Aguardando cadastro completo"; break;
        case "concluida": acao = "Concluiu a vaga"; break;
        default: acao = `Alterou status para ${novoStatus}`;
      }

      await supabase.from("vagas_historico").insert({
        vaga_id: vagaSelecionada.id,
        usuario_id: user?.id,
        usuario_nome: userProfile?.full_name || userProfile?.email || "Usuário",
        acao,
        status_anterior: vagaSelecionada.status,
        status_novo: novoStatus,
        comentarios: comentarios || null,
      });

      toast({
        title: "Status atualizado",
        description: `Vaga ${STATUS_CONFIG[novoStatus as keyof typeof STATUS_CONFIG]?.label || novoStatus}`,
      });

      setShowDetalhes(false);
      setComentariosAprovacao("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const salvarPreCadastro = async () => {
    if (!vagaSelecionada || !preCadastro.candidato_nome || !preCadastro.candidato_matricula) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e a matrícula do candidato.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("vagas")
        .update({
          candidato_nome: preCadastro.candidato_nome,
          candidato_matricula: preCadastro.candidato_matricula,
          status: "aguardando_cadastro",
        })
        .eq("id", vagaSelecionada.id);

      if (error) throw error;

      await supabase.from("vagas_historico").insert({
        vaga_id: vagaSelecionada.id,
        usuario_id: user?.id,
        usuario_nome: userProfile?.full_name || userProfile?.email || "Usuário",
        acao: "Realizou pré-cadastro do candidato",
        status_anterior: vagaSelecionada.status,
        status_novo: "aguardando_cadastro",
        comentarios: `Candidato: ${preCadastro.candidato_nome} - Matrícula: ${preCadastro.candidato_matricula}`,
      });

      toast({
        title: "Pré-cadastro salvo",
        description: "Candidato registrado com sucesso!",
      });

      setShowDetalhes(false);
      setPreCadastro({ candidato_nome: "", candidato_matricula: "" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar pré-cadastro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const enviarParaAprovacao = async () => {
    if (!vagaSelecionada || !formData.aprovador_id) {
      toast({
        title: "Selecione um aprovador",
        description: "Escolha quem irá aprovar a vaga.",
        variant: "destructive",
      });
      return;
    }

    try {
      const aprovador = aprovadores.find((a) => a.user_id === formData.aprovador_id);

      const { error } = await supabase
        .from("vagas")
        .update({
          status: "aguardando_aprovacao",
          aprovador_id: formData.aprovador_id,
          aprovador_nome: aprovador ? (aprovador.full_name || aprovador.email) : null,
        })
        .eq("id", vagaSelecionada.id);

      if (error) throw error;

      await supabase.from("vagas_historico").insert({
        vaga_id: vagaSelecionada.id,
        usuario_id: user?.id,
        usuario_nome: userProfile?.full_name || userProfile?.email || "Usuário",
        acao: "Enviou para aprovação",
        status_anterior: vagaSelecionada.status,
        status_novo: "aguardando_aprovacao",
      });

      toast({
        title: "Enviado para aprovação",
        description: `Aguardando aprovação de ${aprovador?.full_name || aprovador?.email}`,
      });

      setShowDetalhes(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar para aprovação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getVagasByStatus = (status: string) => {
    return vagas.filter((v) => v.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recrutamento & Seleção</h1>
          <p className="text-muted-foreground">Gerencie o fluxo de vagas e contratações</p>
        </div>
        <Dialog open={showNovaVaga} onOpenChange={setShowNovaVaga}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nova Vaga
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Abertura de Vaga</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Gestor Solicitante */}
              <div className="grid gap-2">
                <Label>Gestor Solicitante</Label>
                <Input
                  value={userProfile?.full_name || userProfile?.email || "Usuário"}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Cargo */}
              <div className="grid gap-2">
                <Label>Cargo *</Label>
                <Input
                  placeholder="Ex: Analista de RH"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange("cargo", e.target.value)}
                />
              </div>

              {/* Quantidade de Vagas */}
              <div className="grid gap-2">
                <Label>Quantidade de Vagas *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantidade_vagas}
                  onChange={(e) => handleInputChange("quantidade_vagas", parseInt(e.target.value) || 1)}
                />
              </div>

              {/* Motivo da Abertura */}
              <div className="grid gap-2">
                <Label>Motivo da Abertura *</Label>
                <Select
                  value={formData.motivo_abertura}
                  onValueChange={(value) => handleInputChange("motivo_abertura", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_ABERTURA.map((motivo) => (
                      <SelectItem key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Colaborador a ser substituído */}
              {formData.motivo_abertura === "substituicao" && (
                <div className="grid gap-2">
                  <Label>Colaborador a ser Substituído</Label>
                  <Select
                    value={formData.colaborador_substituido_id}
                    onValueChange={(value) => handleInputChange("colaborador_substituido_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((colab) => (
                        <SelectItem key={colab.id} value={colab.id}>
                          {colab.matricula} - {colab.colaborador}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tipo de Vaga */}
              <div className="grid gap-2">
                <Label>Tipo de Vaga</Label>
                <Select
                  value={formData.tipo_vaga}
                  onValueChange={(value) => handleInputChange("tipo_vaga", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="Temporário">Temporário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Setor */}
              <div className="grid gap-2">
                <Label>Setor</Label>
                <Input
                  placeholder="Ex: Recursos Humanos"
                  value={formData.setor}
                  onChange={(e) => handleInputChange("setor", e.target.value)}
                />
              </div>

              {/* Turno */}
              <div className="grid gap-2">
                <Label>Turno</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value) => handleInputChange("turno", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manhã">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liderança */}
              <div className="grid gap-2">
                <Label>Liderança</Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={formData.lideranca}
                  onChange={(e) => handleInputChange("lideranca", e.target.value)}
                />
              </div>

              {/* Subsetor */}
              <div className="grid gap-2">
                <Label>Subsetor</Label>
                <Input
                  placeholder="Ex: Recrutamento"
                  value={formData.subsetor}
                  onChange={(e) => handleInputChange("subsetor", e.target.value)}
                />
              </div>

              {/* Descrição */}
              <div className="grid gap-2">
                <Label>Descrição da Vaga</Label>
                <Textarea
                  placeholder="Descreva as responsabilidades e requisitos da vaga..."
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Aprovador */}
              <div className="grid gap-2">
                <Label>Enviar para Aprovação de</Label>
                <Select
                  value={formData.aprovador_id}
                  onValueChange={(value) => handleInputChange("aprovador_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aprovador" />
                  </SelectTrigger>
                  <SelectContent>
                    {aprovadores.map((aprovador) => (
                      <SelectItem key={aprovador.user_id} value={aprovador.user_id}>
                        {aprovador.full_name || aprovador.email} ({aprovador.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => criarVaga(false)} className="flex-1">
                  Salvar Rascunho
                </Button>
                <Button onClick={() => criarVaga(true)} className="flex-1">
                  Enviar para Aprovação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {getVagasByStatus("aguardando_aprovacao").length}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Aguardando Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getVagasByStatus("em_processo_seletivo").length}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Em Processo Seletivo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {getVagasByStatus("pre_cadastro").length + getVagasByStatus("aguardando_cadastro").length}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">Pré-Cadastro / Cadastro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {getVagasByStatus("concluida").length}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{vagas.length}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Total de Vagas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {KANBAN_COLUMNS.map((column) => {
            const columnVagas = getVagasByStatus(column.key);
            const StatusIcon = STATUS_CONFIG[column.key as keyof typeof STATUS_CONFIG]?.icon || Clock;

            return (
              <div
                key={column.key}
                className="w-72 flex-shrink-0 bg-muted/30 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-3 px-2">
                  <StatusIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {columnVagas.length}
                  </Badge>
                </div>

                <ScrollArea className="h-[calc(100vh-380px)]">
                  <div className="space-y-3 pr-2">
                    {columnVagas.map((vaga) => (
                      <Card
                        key={vaga.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-l-4"
                        style={{
                          borderLeftColor: column.key === "concluida" ? "#10b981" :
                            column.key === "reprovada" ? "#ef4444" :
                            column.key === "aprovada" ? "#22c55e" :
                            column.key === "em_processo_seletivo" ? "#3b82f6" :
                            column.key === "aguardando_aprovacao" ? "#f59e0b" :
                            column.key === "ajuste_solicitado" ? "#f97316" :
                            column.key === "pre_cadastro" ? "#a855f7" :
                            column.key === "aguardando_cadastro" ? "#6366f1" :
                            "#94a3b8"
                        }}
                        onClick={() => abrirDetalhes(vaga)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm line-clamp-2">{vaga.cargo}</h4>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {vaga.quantidade_vagas} vaga{vaga.quantidade_vagas > 1 ? "s" : ""}
                              </Badge>
                            </div>

                            {vaga.setor && (
                              <p className="text-xs text-muted-foreground">{vaga.setor}</p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{vaga.gestor_solicitante_nome}</span>
                            </div>

                            {vaga.candidato_nome && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-primary">
                                  Candidato: {vaga.candidato_nome}
                                </p>
                              </div>
                            )}

                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(vaga.created_at), "dd MMM yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {columnVagas.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma vaga
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog de Detalhes da Vaga */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {vagaSelecionada?.cargo}
              {vagaSelecionada && (
                <Badge className={STATUS_CONFIG[vagaSelecionada.status as keyof typeof STATUS_CONFIG]?.color}>
                  {STATUS_CONFIG[vagaSelecionada.status as keyof typeof STATUS_CONFIG]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {vagaSelecionada && (
            <div className="space-y-6">
              {/* Informações da Vaga */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Gestor Solicitante</Label>
                  <p className="font-medium">{vagaSelecionada.gestor_solicitante_nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantidade de Vagas</Label>
                  <p className="font-medium">{vagaSelecionada.quantidade_vagas}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Motivo</Label>
                  <p className="font-medium capitalize">{vagaSelecionada.motivo_abertura?.replace("_", " ")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Vaga</Label>
                  <p className="font-medium">{vagaSelecionada.tipo_vaga || "CLT"}</p>
                </div>
                {vagaSelecionada.setor && (
                  <div>
                    <Label className="text-muted-foreground">Setor</Label>
                    <p className="font-medium">{vagaSelecionada.setor}</p>
                  </div>
                )}
                {vagaSelecionada.turno && (
                  <div>
                    <Label className="text-muted-foreground">Turno</Label>
                    <p className="font-medium capitalize">{vagaSelecionada.turno}</p>
                  </div>
                )}
                {vagaSelecionada.lideranca && (
                  <div>
                    <Label className="text-muted-foreground">Liderança</Label>
                    <p className="font-medium">{vagaSelecionada.lideranca}</p>
                  </div>
                )}
                {vagaSelecionada.subsetor && (
                  <div>
                    <Label className="text-muted-foreground">Subsetor</Label>
                    <p className="font-medium">{vagaSelecionada.subsetor}</p>
                  </div>
                )}
              </div>

              {vagaSelecionada.descricao && (
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1 text-sm">{vagaSelecionada.descricao}</p>
                </div>
              )}

              {vagaSelecionada.aprovador_nome && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Label className="text-muted-foreground">Aprovador Designado</Label>
                  <p className="font-medium">{vagaSelecionada.aprovador_nome}</p>
                  {vagaSelecionada.comentarios_aprovacao && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      Comentário: {vagaSelecionada.comentarios_aprovacao}
                    </p>
                  )}
                </div>
              )}

              {/* Pré-cadastro do Candidato */}
              {vagaSelecionada.status === "pre_cadastro" && (
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Pré-Cadastro do Candidato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Matrícula *</Label>
                      <Input
                        placeholder="Ex: 12345"
                        value={preCadastro.candidato_matricula}
                        onChange={(e) => setPreCadastro(prev => ({ ...prev, candidato_matricula: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Nome do Candidato *</Label>
                      <Input
                        placeholder="Nome completo"
                        value={preCadastro.candidato_nome}
                        onChange={(e) => setPreCadastro(prev => ({ ...prev, candidato_nome: e.target.value }))}
                      />
                    </div>
                    <Button onClick={salvarPreCadastro} className="w-full">
                      Salvar Pré-Cadastro
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Candidato selecionado */}
              {vagaSelecionada.candidato_nome && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Candidato Selecionado</p>
                        <p className="text-sm text-muted-foreground">
                          {vagaSelecionada.candidato_matricula} - {vagaSelecionada.candidato_nome}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ações baseadas no status */}
              <div className="space-y-4 pt-4 border-t">
                {/* Rascunho - Enviar para aprovação */}
                {(vagaSelecionada.status === "rascunho" || vagaSelecionada.status === "ajuste_solicitado") && (
                  <div className="space-y-3">
                    <Label>Selecionar Aprovador</Label>
                    <Select
                      value={formData.aprovador_id}
                      onValueChange={(value) => handleInputChange("aprovador_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aprovador" />
                      </SelectTrigger>
                      <SelectContent>
                        {aprovadores.map((aprovador) => (
                          <SelectItem key={aprovador.user_id} value={aprovador.user_id}>
                            {aprovador.full_name || aprovador.email} ({aprovador.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={enviarParaAprovacao} className="w-full">
                      Enviar para Aprovação
                    </Button>
                  </div>
                )}

                {/* Aguardando Aprovação - Aprovar/Reprovar/Solicitar Ajustes */}
                {vagaSelecionada.status === "aguardando_aprovacao" && (
                  <div className="space-y-3">
                    <Label>Comentários (opcional)</Label>
                    <Textarea
                      placeholder="Adicione comentários sobre a decisão..."
                      value={comentariosAprovacao}
                      onChange={(e) => setComentariosAprovacao(e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => atualizarStatus("reprovada", comentariosAprovacao)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reprovar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => atualizarStatus("ajuste_solicitado", comentariosAprovacao)}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Solicitar Ajustes
                      </Button>
                      <Button
                        onClick={() => atualizarStatus("aprovada", comentariosAprovacao)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Aprovada - Iniciar Processo Seletivo */}
                {vagaSelecionada.status === "aprovada" && (
                  <Button
                    onClick={() => atualizarStatus("em_processo_seletivo")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Iniciar Processo Seletivo
                  </Button>
                )}

                {/* Em Processo Seletivo - Avançar para Pré-cadastro */}
                {vagaSelecionada.status === "em_processo_seletivo" && (
                  <Button
                    onClick={() => atualizarStatus("pre_cadastro")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Candidato Selecionado - Pré-Cadastro
                  </Button>
                )}

                {/* Aguardando Cadastro - Concluir */}
                {vagaSelecionada.status === "aguardando_cadastro" && (
                  <Button
                    onClick={() => atualizarStatus("concluida")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cadastro Completo - Concluir Vaga
                  </Button>
                )}
              </div>

              {/* Histórico */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-4 w-4" />
                  <h4 className="font-semibold">Histórico de Aprovações</h4>
                </div>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {historico.map((item) => (
                      <div key={item.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        <div>
                          <p className="font-medium">{item.acao}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.usuario_nome} • {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          {item.comentarios && (
                            <p className="text-xs mt-1 italic">"{item.comentarios}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {historico.length === 0 && (
                      <p className="text-muted-foreground text-sm">Nenhum histórico registrado</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
