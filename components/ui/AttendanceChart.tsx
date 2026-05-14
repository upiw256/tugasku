'use client'

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DailyStats {
  date: string;
  Hadir: number;
  Sakit: number;
  Izin: number;
  Alpha: number;
}

interface Props {
  // Data berbentuk Object: { "X 1": [...data], "X 2": [...data] }
  dataByClass: Record<string, DailyStats[]>; 
  allClasses: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface p-3 border border-border-custom rounded-xl shadow-2xl text-sm backdrop-blur-md">
        <p className="font-black text-foreground mb-2 border-b border-border-custom pb-1 flex justify-between items-center">
            <span>Tgl: {label}</span>
        </p>
        <div className="space-y-1.5">
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.color }} className="font-bold flex justify-between gap-4">
                    <span>{entry.name}:</span>
                    <span>{entry.value}</span>
                </p>
            ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AttendanceChart({ dataByClass, allClasses }: Props) {
  // State untuk menyimpan kelas yang sedang dipilih
  const [selectedClass, setSelectedClass] = useState('');

  // Set default kelas pertama saat komponen dimuat
  useEffect(() => {
    if (allClasses.length > 0 && !selectedClass) {
      setSelectedClass(allClasses[0]);
    }
  }, [allClasses, selectedClass]);

  // Ambil data berdasarkan kelas yang dipilih (atau array kosong jika belum ada)
  const currentData = selectedClass ? dataByClass[selectedClass] : [];

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
      {/* Header & Filter Dropdown */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h3 className="text-lg font-bold text-foreground">Tren Absensi 7 Hari Terakhir</h3>
            <p className="text-sm text-foreground/40 font-medium">
                Menampilkan data kelas: <span className="text-blue-500 font-black underline decoration-blue-500/30">{selectedClass || '-'}</span>
            </p>
        </div>
        
        {/* Dropdown Pemilih Kelas */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border border-border-custom rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-foreground/5 text-foreground font-bold transition-all hover:bg-foreground/10 cursor-pointer"
        >
          {allClasses.length === 0 && <option value="">Data Kosong</option>}
          {allClasses.map(cls => (
            <option key={cls} value={cls} className="bg-surface text-foreground">Kelas {cls}</option>
          ))}
        </select>
      </div>

      {/* Area Grafik Line Chart */}
      <div className="w-full h-[300px]">
        {allClasses.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
                Belum ada data kelas atau siswa.
            </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={currentData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-foreground/10" />
                <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'currentColor', fontSize: 10, className: "text-foreground/40 font-bold" }} 
                    axisLine={false}
                    tickLine={false}
                    padding={{ left: 10, right: 10 }}
                    interval={0}
                />
                <YAxis 
                    tick={{ fill: 'currentColor', fontSize: 11, className: "text-foreground/40 font-bold" }} 
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '5 5', className: "text-foreground/20" }} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  formatter={(value) => <span className="text-foreground/60 text-xs font-bold uppercase tracking-widest">{value}</span>}
                />
                
                {/* 4 Garis untuk masing-masing status */}
                <Line 
                    type="monotone" 
                    dataKey="Hadir" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name="Hadir"
                />
                <Line 
                    type="monotone" 
                    dataKey="Sakit" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Sakit"
                />
                <Line 
                    type="monotone" 
                    dataKey="Izin" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Izin"
                />
                <Line 
                    type="monotone" 
                    dataKey="Alpha" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Alpha"
                />
                
            </LineChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}