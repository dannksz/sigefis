import { Plus, LucideIcon } from "lucide-react";
import Link from "next/link";

type AddButtonProps = {
  href: string;
  text: string;
  icon?: LucideIcon;
};

export default function AddButton({ href, text, icon: Icon = Plus }: AddButtonProps) {
  return (
    <Link 
      href={href}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{text}</span>
    </Link>
  );
}
