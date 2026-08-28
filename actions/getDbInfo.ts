'use server'

import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function getDbInfo() {
  try {
    // Pastikan terkoneksi dulu
    await connectDB();
    
    // Ambil informasi dari Mongoose Connection
    // connection.name = Nama Database (misal: tugasku)
    // connection.host = Host (misal: mongo atau localhost)
    return {
      name: mongoose.connection.name || "Unknown",
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/getDbInfo.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    return { name: "Error", host: "-", port: "-" };
  }
}