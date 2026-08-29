'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ClassGradeStats {
  kelas: string;
  rataRata: number;
  jumlahTugas: number;
}

interface Props {
  data: ClassGradeStats[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface p-4 border border-border-custom rounded-xl shadow-2xl text-sm backdrop-blur-md">
        <p className="font-black text-foreground mb-2 border-b border-border-custom pb-1 flex justify-between items-center text-xs uppercase tracking-tighter">Kelas {label}</p>
        <p className="text-purple-400 font-black text-xl">AVG: {data.rataRata}</p>
        <p className="text-[10px] text-foreground/40 font-bold uppercase mt-1">Total {data.jumlahTugas} Penilaian</p>
      </div>
    );
  }
  return null;
};

export default function GradesChart({ data }: Props) {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Rata-rata Nilai Kelas</h3>
        <p className="text-sm text-foreground/40 font-medium">Akumulasi nilai seluruh tugas</p>
      </div>

      <div className="w-full h-[300px]">
        {data.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-foreground/20 italic gap-2 bg-foreground/5 rounded-xl border-2 border-dashed border-border-custom">
             <span className="text-2xl grayscale">📉</span>
             <p className="font-bold">Belum ada data nilai masuk.</p>
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-foreground/10" />
              <XAxis 
                  dataKey="kelas" 
                  tick={{ fill: 'currentColor', fontSize: 10, className: "text-foreground/40 font-bold" }} 
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
              />
              <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: 'currentColor', fontSize: 11, className: "text-foreground/40 font-bold" }} 
                  axisLine={false}
                  tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', className: "text-foreground/5" }} />
              
              <Bar dataKey="rataRata" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    // Warna Ungu, tapi merah jika nilai rata-rata di bawah 60
                    fill={entry.rataRata < 60 ? '#ef4444' : '#8b5cf6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}