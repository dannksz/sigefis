const statusColors: Record<string, string> = {
  EM_EXECUCAO: "bg-[#8bc9ff] text-[#17496f]", PARALISADA: "bg-[#ff9292] text-[#7d1717]",
  CONCLUIDA: "bg-[#9ee0ba] text-[#175d35]", ATRASADA: "bg-[#ffc56f] text-[#6d3d00]", PLANEJADA: "bg-[#d4c2ff] text-[#4b2879]",
};
const regionColors: Record<string, string> = {
  Norte: "bg-[#8ad8c2] text-[#145c49]", Nordeste: "bg-[#ffc894] text-[#7c400e]",
  "Centro-Oeste": "bg-[#ffe586] text-[#665000]", Sudeste: "bg-[#91a9ff] text-[#263b88]", Sul: "bg-[#cba8ef] text-[#54277d]",
};
const statuses: Record<string, string> = {
  EM_EXECUCAO: "Em execução", CONCLUIDA: "Concluída", PARALISADA: "Paralisada", ATRASADA: "Atrasada", PLANEJADA: "Planejada",
};
const statusKey = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replaceAll(" ", "_");

export function formatWorkStatus(value: string) {
  const key = statusKey(value);
  return Object.hasOwn(statuses, key) ? statuses[key] : value.replaceAll("_", " ").toLocaleLowerCase("pt-BR").replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

export default function ObraTag({ kind, value }: { kind: "status" | "region"; value: string }) {
  const colors = kind === "status" ? statusColors : regionColors;
  const key = kind === "status" ? statusKey(value) : value;
  const color = Object.hasOwn(colors, key) ? colors[key] : "bg-[#dedede] text-[#333]";
  return <span className={`inline-block rounded-md px-4 py-1.5 text-xs ${color}`}>{kind === "status" ? formatWorkStatus(value) : value}</span>;
}
