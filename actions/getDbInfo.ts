'use server'

import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

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
    return { name: "Error", host: "-", port: "-" };
  }
}