import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserMinus, Calendar } from "lucide-react"

interface DemissaoHistorico {
  id: string
  matricula: string
  colaborador: string
  cargo: string
  setor: string
  motivo_demissao: string
  data_demissao: string
}

export default function HistoricoDemissoes() {
  // Dados mockados até que a tabela seja configurada no Supabase
  const [demissoes] = useState<DemissaoHistorico[]>([
    {
      id: "1",
      matricula: "001234",
      colaborador: "João Silva Santos",
      cargo: "Operador de Produção",
      setor: "Produção",
      motivo_demissao: "Iniciativa empregadora/sem justa causa",
      data_demissao: "2024-01-15T10:30:00Z"
    },
    {
      id: "2", 
      matricula: "005678",
      colaborador: "Maria Oliveira Costa",
      cargo: "Assistente Administrativo",
      setor: "Administrativo",
      motivo_demissao: "Fim do contrato de trabalho",
      data_demissao: "2024-01-10T14:20:00Z"
    },
    {
      id: "3",
      matricula: "002345",
      colaborador: "Carlos Eduardo Lima",
      cargo: "Técnico de Manutenção", 
      setor: "Manutenção",
      motivo_demissao: "Transferência para outra filial",
      data_demissao: "2024-01-05T09:15:00Z"
    }
  ])

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  const getMotivoColor = (motivo: string) => {
    if (motivo.includes("justa causa")) return "destructive"
    if (motivo.includes("Transferência")) return "secondary"
    if (motivo.includes("Fim do contrato")) return "outline"
    return "default"
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserMinus className="w-5 h-5 text-destructive" />
          Últimas Demissões
        </CardTitle>
        <CardDescription>
          Histórico dos colaboradores demitidos recentemente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma demissão registrada
                  </TableCell>
                </TableRow>
              ) : (
                demissoes.map((demissao) => (
                  <TableRow key={demissao.id}>
                    <TableCell className="font-medium">{demissao.colaborador}</TableCell>
                    <TableCell>{demissao.matricula}</TableCell>
                    <TableCell>{demissao.cargo}</TableCell>
                    <TableCell>{demissao.setor}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatarData(demissao.data_demissao)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMotivoColor(demissao.motivo_demissao)} className="text-xs">
                        {demissao.motivo_demissao}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}