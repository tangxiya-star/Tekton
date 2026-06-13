import "./globals.css";
import "../styles/annotation.css";

export const metadata = {
  title: "Tekton 营造",
  description:
    "Tekton 营造 — evidence-based 3D reconstruction. Nothing renders without a cited source. Notre-Dame de Paris (la flèche, west towers) · Nanchan Temple.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
