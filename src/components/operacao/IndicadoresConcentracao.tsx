import { TrendingUp, TrendingDown, Flame, Snowflake } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ItemConcentracao {
  label: string;
  qtd: number;
}

interface IndicadoresConcentracaoProps {
  entidadeLabel: string; // "Setor" ou "Cargo"
  picoFaixa: { faixa: string; qtd: number } | null;
  valeFaixa: { faixa: string; qtd: number } | null;
  picoEntidade: ItemConcentracao | null;
  valeEntidade: ItemConcentracao | null;
}

function IndicadorCard({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  value,
  subtitle,
}: {
  icon: typeof Flame;
  iconColor: string;
  bgColor: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </p>
        <p className="text-sm font-bold truncate" title={value}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </Card>
  );
}

export function IndicadoresConcentracao({
  entidadeLabel,
  picoFaixa,
  valeFaixa,
  picoEntidade,
  valeEntidade,
}: IndicadoresConcentracaoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      <IndicadorCard
        icon={Flame}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-900/30"
        title="Pico de horário"
        value={picoFaixa ? picoFaixa.faixa : "—"}
        subtitle={picoFaixa ? `${picoFaixa.qtd} colaboradores` : "Sem dados"}
      />
      <IndicadorCard
        icon={Snowflake}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900/30"
        title="Vale de horário"
        value={valeFaixa ? valeFaixa.faixa : "—"}
        subtitle={valeFaixa ? `${valeFaixa.qtd} colaboradores` : "Sem dados"}
      />
    </div>
  );
}
