import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import Pagination from "@/components/Pagination";
import { formatPhone } from "@/lib/input-masks";
import type { PaginatedResult } from "@/lib/pagination";
import { motivosContato, type MensagemContato, type MotivoContato } from "@/types/contato";

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const reasonLabel = (reason: string) => Object.hasOwn(motivosContato, reason) ? motivosContato[reason as MotivoContato] : reason;

export default function ContactMessages({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MensagemContato>();
  const dialog = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<{ page: number; data?: PaginatedResult<MensagemContato>; error?: string }>();
  const current = result?.page === page ? result : undefined;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/mensagens-contato?page=${page}&pageSize=10`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente." :
            response.status === 403 ? "Acesso exclusivo de administradores." : "Não foi possível carregar as mensagens.");
        }
        const data: PaginatedResult<MensagemContato> = await response.json();
        if (!controller.signal.aborted) setResult({ page, data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ page, error: error instanceof Error ? error.message : "Falha na consulta." });
      }
    }
    void load();
    return () => controller.abort();
  }, [page, token]);

  return (
    <section className="mx-auto max-w-[1500px]">
      <h1 className="mb-5 flex items-center gap-3 text-3xl font-bold"><MessageSquare aria-hidden="true" />Mensagens</h1>
      {!current && <p role="status">Carregando mensagens...</p>}
      {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{current.error}</p>}
      {current?.data && (
        <>
          <p className="mb-4 text-sm">Mensagens recebidas: {current.data.pagination.total}</p>
          {current.data.data.length ? <AdminTable data={current.data.data} keyExtractor={(item) => item.id} columns={[
            { key: "id", header: "ID", render: (item) => `#${item.id}` },
            { key: "nome", header: "Remetente" },
            { key: "email", header: "E-mail" },
            { key: "telefone", header: "Telefone", render: (item) => <span className="whitespace-nowrap">{formatPhone(item.telefone)}</span> },
            { key: "motivo", header: "Motivo", render: (item) => <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-semibold text-secondary">{reasonLabel(item.motivo)}</span> },
            { key: "criadoEm", header: "Enviado em", render: (item) => <span className="whitespace-nowrap">{date.format(new Date(item.criadoEm))}</span> },
            { key: "details", header: "Detalhes", align: "center", render: (item) => (
              <TableAction action="info" name={`Mensagem #${item.id}`} onClick={() => {
                setSelected(item);
                dialog.current?.showModal();
              }} />
            ) },
          ]} /> : <p className="rounded-lg bg-white p-5">Nenhuma mensagem recebida.</p>}
          <Pagination currentPage={page} totalPages={current.data.pagination.totalPages} onPageChange={setPage} />
        </>
      )}
      <dialog ref={dialog} onClose={() => setSelected(undefined)} aria-labelledby="contact-details-title"
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl p-6 shadow-xl backdrop:bg-black/55">
        <h2 id="contact-details-title" className="text-xl font-bold">Detalhes da mensagem {selected && `#${selected.id}`}</h2>
        {selected && <>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Remetente", selected.nome],
              ["E-mail", selected.email],
              ["Telefone", formatPhone(selected.telefone)],
              ["Motivo", reasonLabel(selected.motivo)],
              ["Enviado em", date.format(new Date(selected.criadoEm))],
            ].map(([label, value]) => (
              <div key={label}><dt className="text-sm text-gray-600">{label}</dt><dd className="break-words">{value}</dd></div>
            ))}
          </dl>
          <h3 className="mt-5 font-semibold">Mensagem</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 [overflow-wrap:anywhere]">{selected.mensagem}</p>
        </>}
        <form method="dialog" className="mt-6 flex justify-end"><AdminAction type="submit">Fechar</AdminAction></form>
      </dialog>
    </section>
  );
}
