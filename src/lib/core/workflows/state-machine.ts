export interface WorkflowTransition<State extends string> {
  from: State;
  to: State;
  action: string;
  requiresConsent?: boolean;
  createsTask?: boolean;
  auditLabel: string;
}

export interface WorkflowStateMachine<State extends string> {
  initialState: State;
  terminalStates: State[];
  transitions: WorkflowTransition<State>[];
}

export function getAllowedTransitions<State extends string>(
  machine: WorkflowStateMachine<State>,
  currentState: State
) {
  return machine.transitions.filter((transition) => transition.from === currentState);
}

export function canTransition<State extends string>(
  machine: WorkflowStateMachine<State>,
  from: State,
  to: State
) {
  return machine.transitions.some((transition) => transition.from === from && transition.to === to);
}

export function transitionWorkflow<State extends string>(
  machine: WorkflowStateMachine<State>,
  from: State,
  to: State
) {
  const transition = machine.transitions.find((item) => item.from === from && item.to === to);

  if (!transition) {
    throw new Error(`Invalid workflow transition from '${from}' to '${to}'.`);
  }

  return transition;
}
