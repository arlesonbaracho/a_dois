"use client";

import { useEffect, useState } from "react";

import { APP_NAME } from "@repo/core";

// `beforeinstallprompt` não é padrão: só o Chromium implementa, e o lib.dom não
// tipa. Daí a declaração mínima do que a gente usa.
type EventoDeInstalacao = Event & { prompt: () => Promise<void> };

const CHAVE_PRIMEIRA_META = "a-dois:primeira-meta";
const CHAVE_DISPENSADO = "a-dois:instalacao-dispensada";
const AVISO = "a-dois:primeira-meta";

/**
 * Libera o convite de instalação. Deve ser chamado quando o casal cria a
 * primeira meta — antes disso o convite não aparece, mesmo que o navegador já
 * tenha oferecido.
 */
export function marcarPrimeiraMeta() {
  localStorage.setItem(CHAVE_PRIMEIRA_META, "1");
  window.dispatchEvent(new Event(AVISO));
}

/** Registra o service worker e convida a instalar, na hora certa. */
export function Pwa() {
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null);
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    // Em dev o service worker só atrapalha: fica servindo shell velho.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    const guardar = (e: Event) => {
      e.preventDefault(); // segura o banner do navegador para mostrarmos o nosso depois
      setEvento(e as EventoDeInstalacao);
    };
    const conferir = () =>
      setLiberado(
        localStorage.getItem(CHAVE_PRIMEIRA_META) === "1" &&
          localStorage.getItem(CHAVE_DISPENSADO) !== "1",
      );

    conferir();
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener(AVISO, conferir);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener(AVISO, conferir);
    };
  }, []);

  if (!evento || !liberado) return null;

  const dispensar = () => {
    localStorage.setItem(CHAVE_DISPENSADO, "1");
    setEvento(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-28 z-30 mx-auto max-w-sm rounded-cartao bg-white p-4 text-tinta shadow-polaroide lg:bottom-4 lg:left-28 lg:right-auto">
      <p className="font-corpo text-[12.5px] leading-relaxed">
        Quer o {APP_NAME} na tela de início? Fica mais perto na hora de lançar um
        aporte.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-full bg-tinta px-4 py-2.5 text-[12.5px] font-semibold text-white"
          onClick={() => {
            void evento.prompt();
            setEvento(null);
          }}
        >
          Instalar
        </button>
        <button
          type="button"
          className="rounded-full border border-borda px-4 py-2.5 text-[12.5px] font-semibold text-suave-forte"
          onClick={dispensar}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
