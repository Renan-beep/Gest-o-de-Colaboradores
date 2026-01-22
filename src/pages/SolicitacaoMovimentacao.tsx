import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, CheckCircle, XCircle, Clock, Edit3, ArrowRight, Search, Check, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Colaborador {
  id: string;
  matricula: string;
  colaborador: string;
  cargo?: string;
  setor?: string;
  subsetor?: string;
  turno?: string;
  lideranca?: string;
  sabado_trabalho?: string;
  sabado_horario?: string;
  horario_almoco?: string;
  horario_cafe?: string;
  admissao?: string;
  status: string;
}

interface SolicitacaoAlteracao {
  id: string;
  colaborador_id: string;
  campo_alterado: string;
  valor_atual: string;
  valor_solicitado: string;
  justificativa: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  observacoes_gerencia?: string;
  created_at: string;
  aprovado_por?: string;
  solicitante_id: string;
  solicitante_nome?: string;
  colaborador?: {
    matricula: string;
    colaborador: string;
  };
}

// Campos que podem ser alterados (todos exceto nome, matrícula e admissão)
const CAMPOS_ALTERAVEIS = [
  { value: 'cargo', label: 'Cargo' },
  { value: 'setor', label: 'Setor' },
  { value: 'subsetor', label: 'Subsetor' },
  { value: 'turno', label: 'Turno' },
  { value: 'lideranca', label: 'Liderança' },
  { value: 'sabado_trabalho', label: 'Trabalho aos Sábados' },
  { value: 'sabado_horario', label: 'Horário de Sábado' },
  { value: 'horario_almoco', label: 'Horário de Almoço' },
  { value: 'horario_cafe', label: 'Horário do Café' },
  { value: 'status', label: 'Status' },
];

const OPCOES_CAMPOS = {
  cargo: [
    'Analista de Logística Sr',
    'Assistente de Estoque Jr',
    'Assistente de Estoque Pl',
    'Coordenador de Logística',
    'Encarregado de Estoque',
    'Operador de Empilhadeira Jr',
    'Operador de Empilhadeira Pl',
    'Repositor de Estoque',
    'Supervisor de Estoque'
  ],
  setor: [
    'Armazenagem',
    'Conferência',
    'Controle dos pedidos',
    'Coordenação',
    'Embalagem',
    'Encarregado',
    'Expedição',
    'Garantia',
    'Inventário',
    'Logística',
    'Operador de empilhadeira',
    'Recebimento',
    'Ressuprimento',
    'Retira',
    'SAC',
    'Separação',
    'Separação Retira',
    'Supervisão'
  ],
  subsetor: [
    'Estado',
    'Gaiola/Retorno estoque',
    'RAPDO',
    'Ressuprimento',
    'Transferências',
    'Transferências/Vendas',
    'Transportadora'
  ],
  turno: [
    '06:00 - 15:15',
    '06:00 - 16:03',
    '07:00 - 17:03',
    '08:00 - 17:15',
    '08:00 - 18:03',
    '10:00 - 20:03',
    '10:45 - 20:03',
    '12:00 - 22:03',
    '12:45 - 22:00',
    '22:00 - 06:52'
  ],
  lideranca: [
    'Alexson de Moura Dettmann',
    'Almir Ribeiro de Queiroz',
    'Arivaldo Arlindo da Silva',
    'Bruno Martins Euzebio',
    'Carlos Eduardo Cavalcantes da Silva',
    'Davisson da Costa Rebuli',
    'Josimar Santos Silva',
    'Klaine Xavier da Silva Martins'
  ],
  sabado_trabalho: ['Sim', 'Não'],
  sabado_horario: [
    '08:00 - 12:00',
    '10:00 - 14:00',
    '12:00 - 16:00'
  ],
  horario_almoco: [
    '01:30 - 02:45',
    '11:00 - 12:15',
    '11:45 - 13:00',
    '12:15 - 13:30',
    '13:00 - 14:15',
    '14:45 - 16:00'
  ],
  horario_cafe: [
    '05:00 - 05:10',
    '15:00 - 15:10',
    '15:15 - 15:25',
    '15:30 - 15:40',
    '17:00 - 17:10',
    '19:00 - 19:10'
  ],
  status: ['Ativo', 'Inativo', 'Licença', 'Férias', 'Afastado']
};

const SolicitacaoMovimentacao = () => {
  const { isGerencia, isEncarregado, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAlteracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [selectedSetor, setSelectedSetor] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedEncarregado, setSelectedEncarregado] = useState('');
  const [solicitantes, setSolicitantes] = useState<{id: string, nome: string}[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    colaborador_id: '',
    campo_alterado: '',
    valor_solicitado: '',
    cargo: '',
    setor: '',
    subsetor: '',
    turno: '',
    sabado_trabalho: '',
    sabado_horario: '',
    horario_almoco: '',
    horario_cafe: ''
  });

  useEffect(() => {
    fetchColaboradores();
    fetchSolicitacoes();
  }, []);

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('colaborador');

      if (error) throw error;
      setColaboradores(data || []);
    } catch (error) {
      console.error('Error fetching colaboradores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os colaboradores",
        variant: "destructive",
      });
    }
  };

  const fetchSolicitacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_movimentacao')
        .select(`
          *,
          colaboradores (
            matricula,
            colaborador
          ),
          solicitante:profiles!solicitante_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        id: item.id,
        colaborador_id: item.colaborador_id,
        campo_alterado: '',
        valor_atual: '',
        valor_solicitado: '',
        justificativa: item.justificativa,
        status: item.status as 'pendente' | 'aprovada' | 'rejeitada',
        observacoes_gerencia: item.observacoes_gerencia,
        created_at: item.created_at,
        aprovado_por: item.aprovado_por,
        solicitante_id: item.solicitante_id,
        colaborador: item.colaboradores ? {
          matricula: item.colaboradores.matricula,
          colaborador: item.colaboradores.colaborador
        } : undefined,
        solicitante_nome: item.solicitante?.full_name || 'Não identificado'
      }));
      
      setSolicitacoes(transformedData as SolicitacaoAlteracao[]);
      
      // Extrair solicitantes únicos
      const solicitantesUnicos = [...new Set(transformedData.map(s => ({
        id: s.solicitante_id,
        nome: s.solicitante_nome
      })).filter(s => s.id))].reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [] as {id: string, nome: string}[]);
      
      setSolicitantes(solicitantesUnicos);
    } catch (error) {
      console.error('Error fetching solicitacoes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleColaboradorChange = (colaboradorId: string) => {
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    setSelectedColaborador(colaborador || null);
    setFormData({ ...formData, colaborador_id: colaboradorId, campo_alterado: '', valor_solicitado: '' });
    setComboboxOpen(false);
  };

  const getValorAtual = (campo: string): string => {
    if (!selectedColaborador) return '';
    return selectedColaborador[campo as keyof Colaborador] as string || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.colaborador_id) {
      toast({
        title: "Erro",
        description: "Selecione um colaborador",
        variant: "destructive",
      });
      return;
    }

    // Verificar se pelo menos um campo foi preenchido
    const camposPreenchidos = Object.entries(formData).filter(([key, value]) => 
      key !== 'colaborador_id' && value !== ''
    );

    if (camposPreenchidos.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos um campo para alterar",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!user) throw new Error('Usuário não autenticado');

      console.log('Creating solicitacao with fields:', camposPreenchidos);
      
      // Criar uma solicitação para cada campo alterado
      const solicitacoes = camposPreenchidos.map(([campo, novoValor]) => {
        const valorAtual = getValorAtual(campo);
        
        // Map field types to appropriate movement types
        let tipoMovimentacao = 'mudanca_setor'; // default
        if (campo === 'cargo') {
          tipoMovimentacao = 'promocao';
        } else if (campo === 'turno') {
          tipoMovimentacao = 'mudanca_turno';
        } else if (campo === 'setor' || campo === 'subsetor') {
          tipoMovimentacao = 'transferencia';
        }
        
        const solicitacaoData = {
          colaborador_id: formData.colaborador_id,
          tipo_movimentacao: tipoMovimentacao,
          justificativa: `Campo: ${campo}\nValor Atual: ${valorAtual}\nNovo Valor: ${novoValor}`,
          solicitante_id: user.id,
          status: 'pendente'
        };
        
        console.log('Solicitacao data:', solicitacaoData);
        return solicitacaoData;
      });

      for (const solicitacao of solicitacoes) {
        const { error } = await supabase
          .from('solicitacoes_movimentacao')
          .insert(solicitacao);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `${solicitacoes.length} solicitação(ões) criada(s) com sucesso`,
      });

      setFormData({
        colaborador_id: '',
        campo_alterado: '',
        valor_solicitado: '',
        cargo: '',
        setor: '',
        subsetor: '',
        turno: '',
        sabado_trabalho: '',
        sabado_horario: '',
        horario_almoco: '',
        horario_cafe: ''
      });
      
      setSelectedColaborador(null);
      setSelectedSetor('');
      setDialogOpen(false);
      fetchSolicitacoes();
    } catch (error) {
      console.error('Error creating solicitacao:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as solicitações",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: 'aprovada' | 'rejeitada', observacoes?: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar os detalhes da solicitação
      const { data: solicitacao, error: errorSolicitacao } = await supabase
        .from('solicitacoes_movimentacao')
        .select('*')
        .eq('id', id)
        .single();

      if (errorSolicitacao) throw errorSolicitacao;

      // Atualizar status da solicitação
      const { error } = await supabase
        .from('solicitacoes_movimentacao')
        .update({
          status,
          observacoes_gerencia: observacoes,
          aprovado_por: user.id
        })
        .eq('id', id);

      if (error) throw error;

      // Se aprovado, aplicar a alteração no colaborador
      if (status === 'aprovada' && solicitacao) {
        // Extrair informações da justificativa
        const justificativa = solicitacao.justificativa;
        const campoMatch = justificativa.match(/Campo: (.+)/);
        const novoValorMatch = justificativa.match(/Novo Valor: (.+)/);
        
        if (campoMatch && novoValorMatch) {
          const campo = campoMatch[1];
          const novoValor = novoValorMatch[1];
          
          const updateData = { [campo]: novoValor };
          
          const { error: errorUpdate } = await supabase
            .from('colaboradores')
            .update(updateData)
            .eq('id', solicitacao.colaborador_id);

          if (errorUpdate) {
            console.error('Error updating colaborador:', errorUpdate);
          } else {
            toast({
              title: "Sucesso",
              description: `Solicitação aprovada e colaborador atualizado automaticamente`,
            });
          }
        }
      } else {
        toast({
          title: "Sucesso",
          description: `Solicitação ${status} com sucesso`,
        });
      }

      fetchSolicitacoes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejeitada':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'bg-success/10 text-success';
      case 'rejeitada':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  const getCampoLabel = (campo: string) => {
    const campoObj = CAMPOS_ALTERAVEIS.find(c => c.value === campo);
    return campoObj ? campoObj.label : campo;
  };

  // Filtrar colaboradores baseado no filtro de setor
  const filteredColaboradores = colaboradores.filter(colaborador => {
    const matchesSetor = selectedSetor === '' || selectedSetor === 'todos' || colaborador.setor === selectedSetor;
    return matchesSetor;
  });

  // Obter lista única de setores
  const setoresUnicos = [...new Set(colaboradores.map(c => c.setor).filter(Boolean))].sort();

  // Obter datas únicas das solicitações (para marcar no calendário)
  const datasComSolicitacoes = useMemo(() => {
    const datas = new Set<string>();
    solicitacoes.forEach(s => {
      const dateStr = new Date(s.created_at).toISOString().split('T')[0];
      datas.add(dateStr);
    });
    return datas;
  }, [solicitacoes]);

  // Filtrar solicitações baseado nos filtros
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter(solicitacao => {
      // Filtro por data
      let matchesDate = true;
      if (selectedDate) {
        const solicitacaoDate = new Date(solicitacao.created_at).toISOString().split('T')[0];
        const filterDate = selectedDate.toISOString().split('T')[0];
        matchesDate = solicitacaoDate === filterDate;
      }
      
      const matchesEncarregado = selectedEncarregado === '' || selectedEncarregado === 'todos' || 
        solicitacao.solicitante_id === selectedEncarregado;
      
      return matchesDate && matchesEncarregado;
    });
  }, [solicitacoes, selectedDate, selectedEncarregado]);

  // Agrupar solicitações por colaborador e data
  interface SolicitacaoAgrupada {
    colaborador_id: string;
    colaborador_nome: string;
    colaborador_matricula: string;
    data: string;
    solicitante_nome: string;
    solicitante_id: string;
    solicitacoes: SolicitacaoAlteracao[];
  }

  const solicitacoesAgrupadas = useMemo(() => {
    const grupos: Record<string, SolicitacaoAgrupada> = {};
    
    solicitacoesFiltradas.forEach(solicitacao => {
      const dataStr = new Date(solicitacao.created_at).toISOString().split('T')[0];
      const chave = `${solicitacao.colaborador_id}-${dataStr}`;
      
      if (!grupos[chave]) {
        grupos[chave] = {
          colaborador_id: solicitacao.colaborador_id,
          colaborador_nome: solicitacao.colaborador?.colaborador || '',
          colaborador_matricula: solicitacao.colaborador?.matricula || '',
          data: solicitacao.created_at,
          solicitante_nome: solicitacao.solicitante_nome || 'Não identificado',
          solicitante_id: solicitacao.solicitante_id,
          solicitacoes: []
        };
      }
      
      grupos[chave].solicitacoes.push(solicitacao);
    });
    
    return Object.values(grupos).sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [solicitacoesFiltradas]);

  // Paginação baseada nos grupos
  const totalPages = Math.ceil(solicitacoesAgrupadas.length / ITEMS_PER_PAGE);
  const gruposPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return solicitacoesAgrupadas.slice(start, start + ITEMS_PER_PAGE);
  }, [solicitacoesAgrupadas, currentPage]);

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedEncarregado]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Alteração</h1>
          <p className="text-muted-foreground">
            Sistema para solicitar alterações nos dados dos colaboradores
          </p>
        </div>

        {!isGerencia && user && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto sm:max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Nova Solicitação de Alteração</DialogTitle>
                <DialogDescription>
                  Solicite alterações nos dados de um colaborador
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Filtro de setor */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="setor-filter">Filtrar por Setor</Label>
                    <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os setores</SelectItem>
                        {setoresUnicos.map((setor) => (
                          <SelectItem key={setor} value={setor}>
                            {setor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Combobox para buscar e selecionar colaborador */}
                <div className="space-y-2">
                  <Label htmlFor="colaborador">Buscar e Selecionar Colaborador *</Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between"
                      >
                        {selectedColaborador
                          ? `${selectedColaborador.matricula} - ${selectedColaborador.colaborador}`
                          : "Digite para buscar colaborador..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Digite o nome ou matrícula..." />
                        <CommandList>
                          <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                          <CommandGroup>
                            {filteredColaboradores.map((colaborador) => (
                              <CommandItem
                                key={colaborador.id}
                                value={`${colaborador.matricula} ${colaborador.colaborador}`}
                                onSelect={() => handleColaboradorChange(colaborador.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedColaborador?.id === colaborador.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {colaborador.matricula} - {colaborador.colaborador}
                                  </span>
                                  {colaborador.setor && (
                                    <span className="text-sm text-muted-foreground">
                                      {colaborador.setor}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedColaborador && (
                  <>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-medium mb-3">Dados Atuais do Colaborador</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><strong>Cargo:</strong> {selectedColaborador.cargo || 'Não definido'}</div>
                        <div><strong>Setor:</strong> {selectedColaborador.setor || 'Não definido'}</div>
                        <div><strong>Subsetor:</strong> {selectedColaborador.subsetor || 'Não definido'}</div>
                        <div><strong>Turno:</strong> {selectedColaborador.turno || 'Não definido'}</div>
                        <div><strong>Trabalho Sábado:</strong> {selectedColaborador.sabado_trabalho || 'Não definido'}</div>
                        <div><strong>Horário Sábado:</strong> {selectedColaborador.sabado_horario || 'Não definido'}</div>
                        <div><strong>Horário Almoço:</strong> {selectedColaborador.horario_almoco || 'Não definido'}</div>
                        <div><strong>Horário Café:</strong> {selectedColaborador.horario_cafe || 'Não definido'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cargo">Novo Cargo</Label>
                        <Select
                          value={formData.cargo}
                          onValueChange={(value) => setFormData({ ...formData, cargo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.cargo.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="setor">Novo Setor</Label>
                        <Select
                          value={formData.setor}
                          onValueChange={(value) => setFormData({ ...formData, setor: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.setor.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subsetor">Novo Subsetor</Label>
                        <Select
                          value={formData.subsetor}
                          onValueChange={(value) => setFormData({ ...formData, subsetor: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o subsetor" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.subsetor.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="turno">Novo Turno</Label>
                        <Select
                          value={formData.turno}
                          onValueChange={(value) => setFormData({ ...formData, turno: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o turno" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.turno.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sabado_trabalho">Trabalho aos Sábados</Label>
                        <Select
                          value={formData.sabado_trabalho}
                          onValueChange={(value) => setFormData({ ...formData, sabado_trabalho: value, sabado_horario: value === 'Não' ? '' : formData.sabado_horario })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Trabalha aos sábados?" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.sabado_trabalho.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.sabado_trabalho === 'Sim' && (
                        <div className="space-y-2">
                          <Label htmlFor="sabado_horario">Horário de Sábado</Label>
                          <Select
                            value={formData.sabado_horario}
                            onValueChange={(value) => setFormData({ ...formData, sabado_horario: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPCOES_CAMPOS.sabado_horario.map((opcao) => (
                                <SelectItem key={opcao} value={opcao}>
                                  {opcao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="horario_almoco">Horário de Almoço</Label>
                        <Select
                          value={formData.horario_almoco}
                          onValueChange={(value) => setFormData({ ...formData, horario_almoco: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.horario_almoco.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="horario_cafe">Horário do Café</Label>
                        <Select
                          value={formData.horario_cafe}
                          onValueChange={(value) => setFormData({ ...formData, horario_cafe: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPCOES_CAMPOS.horario_cafe.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    Criar Solicitações
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros das solicitações */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-2 min-w-[200px]">
          <Label htmlFor="date-filter">Filtrar por Data</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
                locale={ptBR}
                modifiers={{
                  hasSolicitacao: (date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    return datasComSolicitacoes.has(dateStr);
                  }
                }}
                modifiersStyles={{
                  hasSolicitacao: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--primary) / 0.15)',
                    borderRadius: '50%'
                  }
                }}
              />
              <div className="p-2 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-primary/15"></span>
                  Dias com solicitações
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setCalendarOpen(false);
                  }}
                >
                  Limpar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 min-w-[200px]">
          <Label htmlFor="encarregado-filter">Filtrar por Solicitante</Label>
          <Select value={selectedEncarregado} onValueChange={setSelectedEncarregado}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os solicitantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os solicitantes</SelectItem>
              {solicitantes.map((solicitante) => (
                <SelectItem key={solicitante.id} value={solicitante.id}>
                  {solicitante.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {gruposPaginados.map((grupo) => {
          const todasPendentes = grupo.solicitacoes.every(s => s.status === 'pendente');
          const todasAprovadas = grupo.solicitacoes.every(s => s.status === 'aprovada');
          const todasRejeitadas = grupo.solicitacoes.every(s => s.status === 'rejeitada');
          
          const statusGeral = todasAprovadas ? 'aprovada' : todasRejeitadas ? 'rejeitada' : todasPendentes ? 'pendente' : 'misto';

          return (
            <Card key={`${grupo.colaborador_id}-${grupo.data}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5" />
                      {grupo.colaborador_nome}
                      {grupo.solicitacoes.length > 1 && (
                        <Badge variant="secondary" className="ml-2">
                          {grupo.solicitacoes.length} alterações
                        </Badge>
                      )}
                    </CardTitle>
                     <CardDescription>
                       Matrícula: {grupo.colaborador_matricula} • 
                       Criado em: {new Date(grupo.data).toLocaleDateString('pt-BR')} •
                       Solicitante: {grupo.solicitante_nome}
                     </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusGeral === 'misto' ? (
                      <>
                        <Clock className="h-4 w-4 text-warning" />
                        <Badge className="bg-muted text-muted-foreground">misto</Badge>
                      </>
                    ) : (
                      <>
                        {getStatusIcon(statusGeral)}
                        <Badge className={getStatusColor(statusGeral)}>
                          {statusGeral}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {grupo.solicitacoes.map((solicitacao, idx) => {
                  // Extrair informações da justificativa
                  const justificativa = solicitacao.justificativa || '';
                  const campoMatch = justificativa.match(/Campo: (.+)/);
                  const valorAtualMatch = justificativa.match(/Valor Atual: (.+)/);
                  const novoValorMatch = justificativa.match(/Novo Valor: (.+)/);
                  
                  const campo = campoMatch ? campoMatch[1] : '';
                  const valorAtual = valorAtualMatch ? valorAtualMatch[1] : '';
                  const novoValor = novoValorMatch ? novoValorMatch[1] : '';

                  return (
                    <div key={solicitacao.id} className={cn(
                      "p-4 bg-muted/30 rounded-lg",
                      idx > 0 && "border-t border-border/50"
                    )}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {grupo.solicitacoes.length > 1 && (
                            <div className="flex items-center gap-1">
                              {getStatusIcon(solicitacao.status)}
                              <Badge variant="outline" className={cn("text-xs", getStatusColor(solicitacao.status))}>
                                {solicitacao.status}
                              </Badge>
                            </div>
                          )}
                          <div>
                            <span className="text-sm text-muted-foreground">Campo:</span>
                            <p className="font-medium">{getCampoLabel(campo)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">De:</span>
                            <p className="font-medium">{valorAtual || 'Não definido'}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm text-muted-foreground">Para:</span>
                            <p className="font-medium text-primary">{novoValor}</p>
                          </div>
                        </div>
                        {isGerencia && solicitacao.status === 'pendente' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(solicitacao.id, 'aprovada')}
                              className="bg-success hover:bg-success/90 text-success-foreground"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const observacao = prompt('Observação para rejeição (opcional):');
                                handleStatusChange(solicitacao.id, 'rejeitada', observacao || undefined);
                              }}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                      {solicitacao.observacoes_gerencia && (
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <span className="text-xs font-medium text-muted-foreground">Observação:</span>
                          <p className="text-sm text-muted-foreground">{solicitacao.observacoes_gerencia}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {solicitacoesAgrupadas.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground">
                {selectedDate 
                  ? `Nenhuma solicitação para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}. Clique no calendário para ver outros dias.`
                  : (!isGerencia ? 'Crie sua primeira solicitação de alteração.' : 'Aguardando novas solicitações.')
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, solicitacoesAgrupadas.length)} de {solicitacoesAgrupadas.length} grupos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitacaoMovimentacao;