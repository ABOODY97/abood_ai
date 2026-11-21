import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_ASSISTANT_NAME,
  getAssistantName,
  setAssistantName as persistAssistantName,
  subscribeAssistantName,
} from '../utils/assistantName';

export function useAssistantName(): [string, (nextName: string) => void] {
  const name = useSyncExternalStore(
    subscribeAssistantName,
    getAssistantName,
    () => DEFAULT_ASSISTANT_NAME
  );

  const setName = useCallback((nextName: string) => {
    persistAssistantName(nextName);
  }, []);

  return [name, setName];
}
