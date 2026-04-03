export function generateStaticParams() {
  return [{ projectId: "placeholder" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
