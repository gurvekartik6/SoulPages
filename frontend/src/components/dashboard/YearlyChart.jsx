import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { THEME } from '../../utils/theme';

const COLORS = [THEME.muted, THEME.brass, THEME.ribbon];

export function YearlyChart({ statusData = [] }) {
  return (
    <div className="card-cut p-6 pt-7">
      <h3 className="font-display text-lg font-medium text-ink">Library by status</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {statusData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: THEME.surface,
                border: `1px solid ${THEME.line}`,
                borderRadius: 8,
                fontSize: 12
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: THEME.inkSoft }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
