import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { THEME } from '../../utils/theme';

export function MonthlyChart({ data = [] }) {
  return (
    <div className="card-cut p-6 pt-7">
      <h3 className="font-display text-lg font-medium text-ink">Pages by month</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={THEME.line} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: THEME.muted }}
              axisLine={{ stroke: THEME.line }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: THEME.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: THEME.surface,
                border: `1px solid ${THEME.line}`,
                borderRadius: 8,
                fontSize: 12
              }}
            />
            <Bar dataKey="pagesRead" fill={THEME.brass} radius={[4, 4, 0, 0]} name="Pages read" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
