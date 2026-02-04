import { ReactNode } from "react";

export default function HomeV2Layout({ children }: { children: ReactNode }) {
  // Simple layout without the standard app header/footer for landing page experience
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}
