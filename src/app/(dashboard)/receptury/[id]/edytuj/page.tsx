"use client";

import { useParams, redirect } from "next/navigation";

/** Stary adres edycji — przekierowanie do jednego okna receptury /receptury/[id] */
export default function EdytujRecepturaRedirect() {
  const params = useParams();
  const id = params.id as string;
  redirect(`/receptury/${id}`);
}
