import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-full h-full">
      <Loader2 className="w-10 h-10 animate-spin text-black" />
    </div>
  );
}
