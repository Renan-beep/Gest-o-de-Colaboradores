import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabelaIdealEditavel } from "./TabelaIdealEditavel";
import type { HeadcountColaborador } from "@/types/headcount";

interface MapaHeadcountProps {
  colaboradores: HeadcountColaborador[];
}

function GaugeChart({ atual, ideal }: { atual: number; ideal: number }) {
  const pct = ideal > 0 ? Math.min((atual / ideal) * 100, 100) : 0;
  const radius = 80;
  const strokeWidth = 18;
  const cx = 100;
  const cy = 100;
  const startAngle = -180;
  const endAngle = 0;
  const totalArc = endAngle - startAngle;
  const filledArc = (pct / 100) * totalArc;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const bgStart = polarToCartesian(startAngle);
  const bgEnd = polarToCartesian(endAngle);
  const fillEnd = polarToCartesian(startAngle + filledArc);
  const largeArc = filledArc > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-3xl font-bold" fontSize="32">
          {atual}
        </text>
        <text x={cx - radius} y={cy + 18} textAnchor="middle" className="fill-muted-foreground" fontSize="12">0</text>
        <text x={cx + radius} y={cy + 18} textAnchor="middle" className="fill-muted-foreground" fontSize="12">{ideal}</text>
      </svg>
    </div>
  );
}

function buildPivot(
  colaboradores: HeadcountColaborador[],
  rowKey: (c: HeadcountColaborador) => string,
  colKey: (c: HeadcountColaborador) => string
) {
  const rows = new Set<string>();
  const cols = new Set<string>();
  const data: Record<string, Record<string, number>> = {};

  colaboradores.forEach(c => {
    const r = rowKey(c) || "—";
    const col = colKey(c) || "—";
    rows.add(r);
    cols.add(col);
    if (!data[r]) data[r] = {};
    data[r][col] = (data[r][col] || 0) + 1;
  });

  const sortedRows = Array.from(rows).sort();
  const sortedCols = Array.from(cols).sort();
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;

  sortedRows.forEach(r => {
    rowTotals[r] = sortedCols.reduce((s, c) => s + (data[r]?.[c] || 0), 0);
    grandTotal += rowTotals[r];
  });
  sortedCols.forEach(c => {
    colTotals[c] = sortedRows.reduce((s, r) => s + (data[r]?.[c] || 0), 0);
  });

  return { sortedRows, sortedCols, data, rowTotals, colTotals, grandTotal };
}

function PivotTable({
  title,
  rowLabel,
  pivot,
}: {
  title: string;
  rowLabel: string;
  pivot: ReturnType<typeof buildPivot>;
}) {
  const { sortedRows, sortedCols, data, rowTotals, colTotals, grandTotal } = pivot;
  const maxRowTotal = Math.max(...Object.values(rowTotals), 1);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold sticky left-0 bg-background z-10 min-w-[100px]">{rowLabel}</TableHead>
                {sortedCols.map(c => (
                  <TableHead key={c} className="text-center whitespace-nowrap px-2">{c}</TableHead>
                ))}
                <TableHead className="text-center font-bold px-2">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map(r => (
                <TableRow key={r}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10 whitespace-nowrap">{r}</TableCell>
                  {sortedCols.map(c => (
                    <TableCell key={c} className="text-center px-2">
                      {(data[r]?.[c] || 0) > 0 ? data[r][c] : ""}
                    </TableCell>
                  ))}
                  <TableCell
                    className="text-center font-bold px-2"
                    style={{ backgroundColor: `hsl(var(--primary) / ${Math.max(0.08, (rowTotals[r] / maxRowTotal) * 0.35)})` }}
                  >
                    {rowTotals[r]}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-bold sticky left-0 bg-background z-10">Total</TableCell>
                {sortedCols.map(c => (
                  <TableCell key={c} className="text-center font-bold px-2">{colTotals[c]}</TableCell>
                ))}
                <TableCell className="text-center font-bold px-2 bg-primary/10">{grandTotal}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function MapaHeadcount({ colaboradores }: MapaHeadcountProps) {
  const [totalIdeal, setTotalIdeal] = useState(0);

  // Atual = ALL collaborators (full headcount, all statuses)
  const totalAtual = colaboradores.length;

  // Atual pivot: Turno × Cargo (active only for distribution view)
  const ativos = useMemo(() => colaboradores.filter(c => c.status?.toLowerCase() === "ativo"), [colaboradores]);
  const pivotAtual = useMemo(
    () => buildPivot(ativos, c => c.turno || "—", c => c.cargo || "—"),
    [ativos]
  );

  const pctAlcancado = totalIdeal > 0 ? ((totalAtual / totalIdeal) * 100).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      {/* Header with gauge */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <Card className="px-8 py-4 text-center">
          <p className="text-sm text-muted-foreground font-medium">Alcançado</p>
          <p className="text-4xl font-bold">{pctAlcancado}%</p>
        </Card>
        <GaugeChart atual={totalAtual} ideal={totalIdeal} />
      </div>

      {/* Ideal: editable table from headcount_planejado */}
      <TabelaIdealEditavel onTotalChange={setTotalIdeal} />

      {/* Atual pivot: Turno × Cargo */}
      <PivotTable title="Atual (Ativos por Turno × Cargo)" rowLabel="Turno" pivot={pivotAtual} />
    </div>
  );
}
