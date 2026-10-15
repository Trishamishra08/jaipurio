import { useEffect, useState } from 'react';
import api from './api';
import { DEFAULT_MOBILE_MENU } from '../data/mobileMenuDefaults';

const LOCATION = 'Mobile Menu';
let cache = null;
let inflight = null;

/** Turn the flat admin items (parentId links) into a tree sorted by `order`. */
const toTree = (flat) => {
  const byId = new Map(flat.map((i) => [i.id, { ...i, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parent = node.parentId && byId.get(node.parentId);
    (parent ? parent.children : roots).push(node);
  });
  const sort = (list) => {
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
};

/**
 * Items for the mobile drawer: the menu an admin assigned to "Mobile Menu"
 * (Admin → Appearance → Menus), or the built-in default when there is none.
 */
export const useMobileMenu = () => {
  const [items, setItems] = useState(cache || toTree(DEFAULT_MOBILE_MENU));

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get(`/menus/public/${encodeURIComponent(LOCATION)}`)
        .then((res) => {
          const list = res.data?.data?.items || [];
          cache = list.length ? toTree(list) : toTree(DEFAULT_MOBILE_MENU);
          return cache;
        })
        .catch(() => toTree(DEFAULT_MOBILE_MENU))
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((tree) => mounted && setItems(tree));
    return () => {
      mounted = false;
    };
  }, []);

  return items;
};
