import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ROLES, getRoleAuthToken, listenForeground, syncPush } from '../../services/pushNotificationService';

/**
 * Mounted once inside the router. Keeps push working in the background:
 * listens for foreground messages and silently refreshes the device token for every
 * role that is signed in and has already opted in. It never asks for permission.
 */
const PushBootstrap = () => {
  const { pathname } = useLocation();

  useEffect(() => listenForeground(), []);

  useEffect(() => {
    ROLES.forEach((role) => {
      if (getRoleAuthToken(role)) syncPush(role);
    });
  }, [pathname]);

  return null;
};

export default PushBootstrap;
