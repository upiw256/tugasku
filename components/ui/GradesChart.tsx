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
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm">
        <p className="font-bold text-gray-800 mb-2 border-b pb-1">Kelas {label}</p>
        <p className="text-purple-600 font-bold text-lg">Rata-rata: {data.rataRata}</p>
        <p className="text-xs text-gray-500">Dari total {data.jumlahTugas} penilaian</p>
      </div>
    );
  }
  return null;
};

export default function GradesChart({ data }: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">Rata-rata Nilai Kelas</h3>
        <p className="text-sm text-gray-500">Akumulasi nilai seluruh tugas</p>
      </div>

      <div className="w-full h-[350px]">
        {data.length === 0 ? (
           <div className="h-full flex items-center justify-center text-gray-400">
             Belum ada data nilai masuk.
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                  dataKey="kelas" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
              />
              <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              
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