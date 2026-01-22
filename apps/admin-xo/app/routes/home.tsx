import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { ComponentExample } from "~/components/component-example";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <ComponentExample />
}
