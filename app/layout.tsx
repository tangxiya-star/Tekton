import "./globals.css";

export const metadata = {
  title: "营造 Yingzao — 南禅寺大殿",
  description:
    "Evidence-based 3D reconstruction of Nanchan Temple Main Hall (782 CE). Every component can prove where it came from.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
