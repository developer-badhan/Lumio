import React from 'react';
import { useCall } from '../../hooks/useCall';
import IncomingCall from '../call/IncomingCall';
import CallWindow from '../call/CallWindow';

const CallModal = () => {
  const { callStatus } = useCall();

  // Nothing to show when idle
  if (callStatus === 'idle') return null;

  // Incoming call — show ringtone overlay with accept/decline
  if (callStatus === 'incoming') {
    return <IncomingCall />;
  }

  // Outgoing ('calling') or connected ('active') — show the call window
  if (callStatus === 'calling' || callStatus === 'active') {
    return <CallWindow />;
  }

  return null;
};

export default CallModal;