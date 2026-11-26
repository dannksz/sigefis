"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function EvidenceImage({ src, caption, date }: { src: string; caption: string; date: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  return <figure className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
    {failed ? <p className="grid aspect-[4/3] place-items-center bg-neutral-100 p-4">Imagem indisponível</p> :
      <button type="button" onClick={() => dialog.current?.showModal()} aria-label={`Ampliar foto: ${caption}`}
        className="relative block aspect-[4/3] w-full cursor-pointer bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
        <Image src={src} alt={caption} fill unoptimized className="object-cover" onError={() => setFailed(true)} />
      </button>}
    <figcaption className="px-4 py-3"><p className="font-medium">{caption}</p><p className="text-sm text-neutral-600">{date}</p></figcaption>
    <dialog ref={dialog} aria-label={caption} className="m-auto w-[min(92vw,900px)] rounded-lg bg-white p-4 backdrop:bg-black/65">
      <form method="dialog" className="mb-3 flex justify-end">
        <button className="cursor-pointer rounded-md bg-primary px-4 py-2 font-medium">Fechar</button>
      </form>
      <div className="relative h-[70vh]"><Image src={src} alt={caption} fill unoptimized className="object-contain" /></div>
    </dialog>
  </figure>;
}
