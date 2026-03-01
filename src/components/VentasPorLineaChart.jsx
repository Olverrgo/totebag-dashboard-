import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getVentas } from '../supabaseClient';

const PERIODOS = [
  { label: '30 días', dias: 30 },
  { label: '60 días', dias: 60 },
  { label: '90 días', dias: 90 },
];

// Colores distinguibles para las líneas de producto
const LINE_COLORS = [
  '#C9A96E', '#C4784A', '#6B7B5E', '#B8954F', '#9CAF88',
  '#4A3728', '#7B6B8D', '#5E8B7B', '#8B5E5E', '#5E6B8B',
];

const getWeekNumber = (date, startDate) => {
  const diff = date - startDate;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
};

export default function VentasPorLineaChart({ colors }) {
  const [periodo, setPeriodo] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - periodo);
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

      const { data: ventas } = await getVentas({ fechaInicio: fechaInicioStr });
      if (!ventas || ventas.length === 0) {
        setChartData([]);
        setLineas([]);
        setLoading(false);
        return;
      }

      // Agrupar por semana y línea
      const startDate = new Date(fechaInicioStr);
      const lineasSet = new Set();
      const weekMap = {};

      ventas.forEach((v) => {
        const linea = v.producto?.linea_nombre || 'Sin línea';
        lineasSet.add(linea);
        const week = getWeekNumber(new Date(v.created_at), startDate);
        const weekKey = `Sem ${week}`;
        if (!weekMap[weekKey]) weekMap[weekKey] = { semana: weekKey, _order: week };
        weekMap[weekKey][linea] = (weekMap[weekKey][linea] || 0) + (v.cantidad || 0);
      });

      const lineasArr = [...lineasSet].sort();
      const data = Object.values(weekMap).sort((a, b) => a._order - b._order);

      setLineas(lineasArr);
      setChartData(data);
      setLoading(false);
    };

    fetchData();
  }, [periodo]);

  return (
    <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>
          VENTAS POR LÍNEA DE PRODUCTO
        </h3>
        <div style={{ display: 'flex', gap: '5px' }}>
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              onClick={() => setPeriodo(p.dias)}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                border: `1px solid ${colors.camel}`,
                background: periodo === p.dias ? colors.camel : 'transparent',
                color: periodo === p.dias ? colors.cotton : colors.espresso,
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.camel, fontSize: '13px' }}>
          Cargando...
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.camel, fontSize: '13px' }}>
          No hay ventas en este período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} stroke={colors.camel} />
            <YAxis stroke={colors.camel} />
            <Tooltip contentStyle={{ background: colors.cotton, border: `1px solid ${colors.camel}` }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {lineas.map((linea, i) => (
              <Bar key={linea} dataKey={linea} stackId="a" fill={LINE_COLORS[i % LINE_COLORS.length]} name={linea} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
