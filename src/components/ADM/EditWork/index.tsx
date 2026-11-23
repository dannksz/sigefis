"use client";

import { useParams } from "next/navigation";
import AddWork from "@/components/ADM/AddWork";

export default function EditWork() {
  const params = useParams<{ id: string }>();
  return <AddWork workId={Number(params.id)} />;
}
