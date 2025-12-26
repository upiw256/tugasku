import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    // SEBELUMNYA: redirect("/admin/siswa/import");
    // UBAH JADI:
    redirect("/admin"); // Arahkan ke dashboard admin utama
  } else if (session.user.role === "siswa") {
    redirect("/siswa");
  }

  return null;
}