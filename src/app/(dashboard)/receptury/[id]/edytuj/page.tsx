import EdytujRecepturaRedirect from "./EdytujRecepturaRedirect";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function EdytujRecepturaPage() {
  return <EdytujRecepturaRedirect />;
}
