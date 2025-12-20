export type ReducerMap<State, Action extends { type: string }> = {
    [Type in Action['type']]: (
        state: State,
        action: Extract<Action, { type: Type }>
    ) => State;
};

export function createReducer<State, Action extends { type: string }>(
    handlers: ReducerMap<State, Action>
): (state: State, action: Action) => State {
    return (state, action) => {
        type ActionType = Action['type'];
        const handler = handlers[action.type as ActionType] as (
            state: State,
            action: Action
        ) => State;
        return handler(state, action);
    };
}
