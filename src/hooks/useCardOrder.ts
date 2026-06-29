import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'scada-card-order';

type OrderMap = Record<string, string[]>;

function loadOrders(): OrderMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOrders(orders: OrderMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function useCardOrder(groupKey: string, defaultIds: string[]): [string[], (newOrder: string[]) => void, () => void] {
  const [order, setOrder] = useState<string[]>(() => {
    const saved = loadOrders()[groupKey];
    if (saved && saved.length === defaultIds.length && defaultIds.every(id => saved.includes(id))) {
      return saved;
    }
    return defaultIds;
  });

  // Sync if defaultIds change
  useEffect(() => {
    const saved = loadOrders()[groupKey];
    if (!saved || saved.length !== defaultIds.length || !defaultIds.every(id => saved.includes(id))) {
      setOrder(defaultIds);
    }
  }, [groupKey, defaultIds.join(',')]);

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    const all = loadOrders();
    all[groupKey] = newOrder;
    saveOrders(all);
  }, [groupKey]);

  const resetOrder = useCallback(() => {
    setOrder(defaultIds);
    const all = loadOrders();
    delete all[groupKey];
    saveOrders(all);
  }, [groupKey, defaultIds]);

  return [order, updateOrder, resetOrder];
}
