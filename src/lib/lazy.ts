import { lazy } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;
type ModuleWithDefault<T> = { default: T };

export function lazyWithPreload<T extends AnyComponent>(
  factory: () => Promise<ModuleWithDefault<T>>
) {
  let modulePromise: Promise<ModuleWithDefault<T>> | null = null;

  const load = () => {
    if (!modulePromise) {
      modulePromise = factory();
    }
    return modulePromise;
  };

  const Component = lazy(load);

  const preload = async () => {
    await load();
  };

  return { Component, preload };
}

export function createLazyDialog<T extends AnyComponent>(
  importFn: () => Promise<ModuleWithDefault<T>>
) {
  return lazyWithPreload(importFn);
}
