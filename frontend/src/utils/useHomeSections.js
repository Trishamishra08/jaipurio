import { useEffect, useState } from 'react';
import api from './api';
import { DEFAULT_HOME, mergeHomeSections } from '../data/homeSectionsDefaults';

let cache = null;
let inflight = null;

/** Admin-managed home page settings: { sections: {key: cfg}, order: [keys] }, merged over defaults. */
export const useHomeSections = () => {
  const [home, setHome] = useState(cache || DEFAULT_HOME);

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get('/settings')
        .then((res) => {
          cache = mergeHomeSections(res.data?.data?.settings?.homePage);
          return cache;
        })
        .catch(() => DEFAULT_HOME)
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((cfg) => mounted && setHome(cfg));
    return () => {
      mounted = false;
    };
  }, []);

  return home;
};
