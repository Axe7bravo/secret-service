import { useEffect, useState } from 'react';
import { adminDirectoryRepository } from '../data/adminDirectoryRepository';
import type { AdminDirectory } from '../types/directory';

const empty: AdminDirectory = { customers: [], recipients: [], truncated: false };

export const useAdminDirectory = () => {
  const [state, setState] = useState<{ data: AdminDirectory; loading: boolean; error: string }>({ data: empty, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    adminDirectoryRepository.load()
      .then(data => { if (active) setState({ data, loading: false, error: '' }); })
      .catch(error => { if (active) setState(current => ({ ...current, loading: false, error: error instanceof Error ? error.message : 'The directory could not be loaded.' })); });
    return () => { active = false; };
  }, []);
  return state;
};
