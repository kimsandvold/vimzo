import { createElement, lazy, useState, type ComponentType, type ReactElement } from 'react'

type Laster = () => Promise<{ default: ComponentType }>

export interface LazyPage {
  (): ReactElement
  /** Starter (eller gjenbruker) nedlastingen av sidens JS-bit. */
  preload: () => Promise<unknown>
}

/**
 * Som `React.lazy`, men med `preload()`. Er biten allerede lastet når siden
 * monteres, rendres komponenten direkte – uten å suspendere – så Suspense-
 * fallbacken aldri vises for en side som er forhåndslastet. Det er dette som
 * gjør at den forhåndsrendrede HTML-en byttes rett mot den ekte siden, uten
 * et blink innom «Laster …».
 */
export function lazyPage(laster: Laster): LazyPage {
  let lastet: ComponentType | undefined
  let promise: Promise<{ default: ComponentType }> | undefined

  const preload = () =>
    (promise ??= laster().then(
      (mod) => {
        lastet = mod.default
        return mod
      },
      (err) => {
        // Prøv på nytt neste gang (f.eks. midlertidig nettverksfeil).
        promise = undefined
        throw err
      },
    ))

  const Lazy = lazy(preload)

  function Page() {
    // Velg komponent én gang per montering, så typen aldri skifter underveis
    // (det ville remontert hele siden).
    const [Komponent] = useState<ComponentType>(() => lastet ?? Lazy)
    return createElement(Komponent)
  }
  Page.preload = preload
  return Page
}
