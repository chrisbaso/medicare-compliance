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

export function isTerminalState<State extends string>(
  machine: WorkflowStateMachine<State>,
  state: State
) {
  return machine.terminalStates.includes(state);
}

export interface OpenBlockingFlag {
  rule_id: string;
}

/**
 * Guarded transition. Behaves like transitionWorkflow, but additionally refuses
 * to enter a TERMINAL state while open, workflow-blocking compliance flags
 * remain. A blocking flag must actually block — an unresolved critical finding
 * cannot be closed out silently.
 */
export function assertTransitionAllowed<State extends string>(
  machine: WorkflowStateMachine<State>,
  from: State,
  to: State,
  options: { openBlockingFlags?: OpenBlockingFlag[] } = {}
) {
  const transition = transitionWorkflow(machine, from, to);
  const blocking = options.openBlockingFlags ?? [];

  if (isTerminalState(machine, to) && blocking.length > 0) {
    const ruleIds = Array.from(new Set(blocking.map((f) => f.rule_id))).join(", ");
    throw new Error(
      `Cannot transition to terminal state '${to}': ${blocking.length} open blocking compliance flag(s) must be resolved first (${ruleIds}).`
    );
  }

  return transition;
}
