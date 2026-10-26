import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData } from './types';
import { loadData, saveData, STORAGE_KEY } from './lib/storage';

interface Store {
  data: AppData;
  /** draft を直接書き換えてよい（内部で複製してから渡す） */
  update: (mutate: (draft: AppData) => void) => void;
  replace: (data: AppData) => void;
  saveError: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [saveError, setSaveError] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    setSaveError(!saveData(data));
  }, [data]);

  // 別タブで更新された内容を取り込む
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      skipSave.current = true;
      setData(loadData());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // mutate はイベントハンドラ内で即時に実行する（遅延実行だと制御コンポーネントの値が巻き戻った後に読まれるため）
  const current = useRef(data);
  current.current = data;

  const update = useCallback((mutate: (draft: AppData) => void) => {
    const draft = structuredClone(current.current);
    mutate(draft);
    current.current = draft;
    setData(draft);
  }, []);

  const replace = useCallback((next: AppData) => {
    current.current = next;
    setData(next);
  }, []);

  return <StoreContext.Provider value={{ data, update, replace, saveError }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreProvider がありません');
  return s;
}
