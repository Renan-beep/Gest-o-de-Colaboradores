import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, UserCheck, UserX, Coffee, Heart, Home, TrendingUp, Calendar, Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, readExcelFile } from '@/utils/secureExcel';
interface KPIData {
  totalColaboradores: number;
  presentes: number;
  faltas: number;
  folgas: number;
  atestados: number;
  ferias: number;
  percentualPresenca: number;
}
interface HistoricoItem {
  dia: string;
  presentes: number;
  total: number;
}
export default function Indicadores() {
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalColaboradores: 0,
    presentes: 0,
    faltas: 0,
    folgas: 0,
    atestados: 0,
    ferias: 0,
    percentualPresenca: 0
  });
  const [historicoSemanal, setHistoricoSemanal] = useState<HistoricoItem[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  useEffect(() => {
    fetchIndicadores();
  }, []);
  const fetchIndicadores = async () => {
    try {
      // Buscar todos os colaboradores para exportação
      const {
        data: todosColaboradores,
        error: todosError
      } = await supabase.from('colaboradores').select('*').order('colaborador');
      if (todosError) throw todosError;
      setColaboradores(todosColaboradores || []);

      // Buscar total de colaboradores ativos
      const {
        data: colaboradores,
        error: colaboradoresError
      } = await supabase.from('colaboradores').select('id').eq('status', 'ativo');
      if (colaboradoresError) throw colaboradoresError;
      const totalColaboradores = colaboradores?.length || 0;

      // Buscar dados de chamada de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const {
        data: chamadasHoje,
        error: chamadasError
      } = await supabase.from('chamadas').select('status').eq('data', hoje);
      if (chamadasError && chamadasError.code !== 'PGRST116') throw chamadasError;

      // Contar status de hoje
      const statusCounts = chamadasHoje?.reduce((acc: {
        [key: string]: number;
      }, chamada) => {
        acc[chamada.status] = (acc[chamada.status] || 0) + 1;
        return acc;
      }, {}) || {};
      const presentes = statusCounts.presente || 0;
      const faltas = statusCounts.falta || 0;
      const folgas = statusCounts.folga || 0;
      const atestados = statusCounts.atestado || 0;
      const ferias = statusCounts.ferias || 0;
      const totalChamadas = presentes + faltas + folgas + atestados + ferias;
      const percentualPresenca = totalChamadas > 0 ? presentes / totalChamadas * 100 : 0;
      setKpiData({
        totalColaboradores,
        presentes,
        faltas,
        folgas,
        atestados,
        ferias,
        percentualPresenca
      });

      // Buscar histórico dos últimos 7 dias
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
      const dataInicio = seteDiasAtras.toISOString().split('T')[0];
      const {
        data: historicoData,
        error: historicoError
      } = await supabase.from('chamadas').select('data, status').gte('data', dataInicio).lte('data', hoje).order('data');
      if (historicoError && historicoError.code !== 'PGRST116') throw historicoError;

      // Agrupar dados por data
      const historicoMap: {
        [key: string]: {
          presentes: number;
          total: number;
        };
      } = {};
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      // Inicializar os últimos 7 dias
      const historico: HistoricoItem[] = [];
      for (let i = 0; i < 7; i++) {
        const data = new Date();
        data.setDate(data.getDate() - (6 - i));
        const dataStr = data.toISOString().split('T')[0];
        const diaSemana = diasSemana[data.getDay()];
        historicoMap[dataStr] = {
          presentes: 0,
          total: 0
        };
        historico.push({
          dia: diaSemana,
          presentes: 0,
          total: 0
        });
      }

      // Preencher com dados reais
      historicoData?.forEach(chamada => {
        if (historicoMap[chamada.data]) {
          historicoMap[chamada.data].total += 1;
          if (chamada.status === 'presente') {
            historicoMap[chamada.data].presentes += 1;
          }
        }
      });

      // Atualizar array de histórico
      let index = 0;
      for (let i = 0; i < 7; i++) {
        const data = new Date();
        data.setDate(data.getDate() - (6 - i));
        const dataStr = data.toISOString().split('T')[0];
        if (historicoMap[dataStr]) {
          historico[index].presentes = historicoMap[dataStr].presentes;
          historico[index].total = historicoMap[dataStr].total;
        }
        index++;
      }
      setHistoricoSemanal(historico);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar indicadores: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const fileName = `colaboradores_${new Date().toISOString().split('T')[0]}`;
      exportToExcel(colaboradores, fileName);
      toast({
        title: "Sucesso",
        description: `Arquivo ${fileName}.xlsx exportado com sucesso!`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao exportar dados: " + error.message,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Use secure Excel reading
      const processedData = await readExcelFile(file);

      // Inserir dados no banco (upsert para evitar duplicatas)
      let successCount = 0;
      let errorCount = 0;
      for (const colaborador of processedData) {
        try {
          const {
            error
          } = await supabase.from('colaboradores').upsert(colaborador, {
            onConflict: 'matricula',
            ignoreDuplicates: false
          });
          if (error) {
            console.error(`Erro ao inserir ${colaborador.colaborador}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Erro ao processar ${colaborador.colaborador}:`, err);
          errorCount++;
        }
      }
      toast({
        title: "Importação Concluída",
        description: `${successCount} colaboradores importados com sucesso. ${errorCount > 0 ? `${errorCount} erros encontrados.` : ''}`
      });

      // Recarregar dados
      fetchIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro na Importação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const statusCards = [{
    title: "Colaboradores Ativos",
    value: kpiData.totalColaboradores,
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    title: "Presentes Hoje",
    value: kpiData.presentes,
    icon: UserCheck,
    color: "text-green-600",
    bgColor: "bg-green-100"
  }, {
    title: "Faltas",
    value: kpiData.faltas,
    icon: UserX,
    color: "text-red-600",
    bgColor: "bg-red-100"
  }, {
    title: "Folgas",
    value: kpiData.folgas,
    icon: Home,
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  }, {
    title: "Atestados",
    value: kpiData.atestados,
    icon: Heart,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100"
  }, {
    title: "Férias",
    value: kpiData.ferias,
    icon: Coffee,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  }];
  if (loading) {
    return <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Indicadores</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Exporte e Importe Dados</p>
        </div>
      </div>

      {/* Seção de Exportação e Importação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exportação */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Baixe todos os dados dos colaboradores em formato Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportExcel} disabled={exporting || colaboradores.length === 0} className="w-full">
              {exporting ? <>
                  <FileSpreadsheet className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </> : <>
                  
                  Exportar para Excel
                </>}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {colaboradores.length} colaboradores serão exportados
            </p>
          </CardContent>
        </Card>

        {/* Importação */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Dados
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo Excel para importar colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="excel-upload">Selecionar Arquivo Excel</Label>
              <Input id="excel-upload" ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={uploading} className="mt-1" />
            </div>
            
            {uploading && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4 animate-spin" />
                Processando arquivo...
              </div>}

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Colunas esperadas: Matrícula, Colaborador, Status, Cargo, Setor, etc.
              </p>
              <p className="flex items-center gap-1">
                
                Colaboradores existentes serão atualizados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}