import { X, Check } from "lucide-react";
import Link from "next/link";

type AdminFormButtonsProps = {
  cancelHref: string;
  onSubmit?: () => void;
  submitText?: string;
};

export default function AdminFormButtons({ 
  cancelHref, 
  onSubmit,
  submitText = "Enviar"
}: AdminFormButtonsProps) {
  return (
    <div className="flex gap-4 mt-6">
      <Link 
        href={cancelHref}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <span>Cancelar</span>
        <X className="w-4 h-4" />
      </Link>
      <button 
        type="submit"
        onClick={onSubmit}
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <span>{submitText}</span>
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}
