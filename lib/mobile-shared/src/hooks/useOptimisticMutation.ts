import { useMutation, useQueryClient, type QueryKey, type UseMutationOptions } from "@tanstack/react-query";

export interface OptimisticMutationOptions<TData, TError, TVariables, TContext> extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "onMutate" | "onError" | "onSettled"> {
  queryKey: QueryKey;
  updater: (oldData: unknown, variables: TVariables) => unknown;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void;
}

export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void>(
  options: OptimisticMutationOptions<TData, TError, TVariables, { previousData: unknown }>
) {
  const qc = useQueryClient();
  const { queryKey, updater, onError, onSettled, ...rest } = options;

  return useMutation<TData, TError, TVariables, { previousData: unknown }>({
    ...rest,
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const previousData = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: unknown) => updater(old, variables));
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData !== undefined) {
        qc.setQueryData(queryKey, context.previousData);
      }
      onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      qc.invalidateQueries({ queryKey });
      onSettled?.(data, error, variables, context);
    },
  });
}

export function toggleBoolean<T extends Record<string, unknown>>(field: keyof T) {
  return (old: unknown, _variables: unknown): unknown => {
    if (!old || typeof old !== "object") return old;
    const obj = old as T;
    return { ...obj, [field]: !obj[field] };
  };
}

export function updateStatus<T extends Record<string, unknown>>(field: keyof T) {
  return (old: unknown, variables: { status: T[typeof field] }): unknown => {
    if (!old || typeof old !== "object") return old;
    return { ...(old as T), [field]: variables.status };
  };
}

export function updateListItem<T extends { id: number | string }>(
  idField: keyof T,
  patchFn: (item: T, variables: unknown) => T
) {
  return (old: unknown, variables: unknown): unknown => {
    if (!old) return old;
    const list = Array.isArray(old) ? old : (old as { data?: T[] }).data;
    if (!Array.isArray(list)) return old;
    const vars = variables as Record<string, unknown>;
    const updated = list.map((item: T) =>
      String(item[idField]) === String(vars.id ?? vars[idField as string]) ? patchFn(item, variables) : item
    );
    return Array.isArray(old) ? updated : { ...(old as object), data: updated };
  };
}

export function removeListItem<T extends { id: number | string }>(idField: keyof T) {
  return (old: unknown, variables: { id: number | string }): unknown => {
    if (!old) return old;
    const list = Array.isArray(old) ? old : (old as { data?: T[] }).data;
    if (!Array.isArray(list)) return old;
    const filtered = list.filter((item: T) => String(item[idField]) !== String(variables.id));
    return Array.isArray(old) ? filtered : { ...(old as object), data: filtered };
  };
}

export function addListItem<T>() {
  return (old: unknown, variables: T): unknown => {
    if (!old) return [variables];
    const list = Array.isArray(old) ? old : (old as { data?: T[] }).data;
    if (!Array.isArray(list)) return old;
    const updated = [...list, variables];
    return Array.isArray(old) ? updated : { ...(old as object), data: updated };
  };
}
