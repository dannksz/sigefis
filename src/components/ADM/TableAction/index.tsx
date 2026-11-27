import { Eye, Info, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

const actions = {
  details: { icon: Eye, label: "Ver detalhes", color: "text-blue-700 hover:bg-blue-50" },
  info: { icon: Info, label: "Ver informações", color: "text-blue-700 hover:bg-blue-50" },
  edit: { icon: Pencil, label: "Alterar", color: "text-amber-700 hover:bg-amber-50" },
  delete: { icon: Trash2, label: "Excluir", color: "text-red-600 hover:bg-red-50" },
};

type Props = { action: keyof typeof actions; name: string } & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

export default function TableAction({ action, name, href, onClick }: Props) {
  const { icon: Icon, label, color } = actions[action];
  const attributes = {
    title: label,
    "aria-label": `${label} — ${name}`,
    className: `inline-grid size-9 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${color}`,
  };
  const icon = <Icon className="size-5" aria-hidden="true" />;
  return href !== undefined
    ? <Link href={href} {...attributes}>{icon}</Link>
    : <button type="button" onClick={onClick} {...attributes}>{icon}</button>;
}
