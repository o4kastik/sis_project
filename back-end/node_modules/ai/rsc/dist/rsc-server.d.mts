import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import OpenAI from 'openai';
import { z } from 'zod';

type AIAction<T = any, R = any> = (...args: T[]) => Promise<R>;
type AIActions<T = any, R = any> = Record<string, AIAction<T, R>>;
type AIProviderProps<AIState = any, UIState = any, Actions = any> = {
    children: React.ReactNode;
    initialAIState?: AIState;
    initialUIState?: UIState;
    /** $ActionTypes is only added for type inference and is never used at runtime **/
    $ActionTypes?: Actions;
};
type AIProvider<AIState = any, UIState = any, Actions = any> = (props: AIProviderProps<AIState, UIState, Actions>) => Promise<React.ReactElement>;
type InferAIState<T, Fallback> = T extends AIProvider<infer AIState, any, any> ? AIState : Fallback;
type OnSetAIState<S> = ({ key, state, done, }: {
    key: string | number | symbol | undefined;
    state: S;
    done: boolean;
}) => void | Promise<void>;
type OnGetUIState<S> = AIAction<void, S | undefined>;
type ValueOrUpdater<T> = T | ((current: T) => T);
type MutableAIState<AIState> = {
    get: () => AIState;
    update: (newState: ValueOrUpdater<AIState>) => void;
    done: ((newState: AIState) => void) | (() => void);
};
/**
 * StreamableValue is a value that can be streamed over the network via AI Actions.
 * To read the streamed values, use the `readStreamableValue` or `useStreamableValue` APIs.
 */
type StreamableValue<T = any, E = any> = {};

/**
 * Get the current AI state.
 * If `key` is provided, it will return the value of the specified key in the
 * AI state, if it's an object. If it's not an object, it will throw an error.
 *
 * @example const state = getAIState() // Get the entire AI state
 * @example const field = getAIState('key') // Get the value of the key
 */
declare function getAIState<AI extends AIProvider = any>(): InferAIState<AI, any>;
declare function getAIState<AI extends AIProvider = any>(key: keyof InferAIState<AI, any>): InferAIState<AI, any>[typeof key];
/**
 * Get the mutable AI state. Note that you must call `.close()` when finishing
 * updating the AI state.
 *
 * @example
 * ```tsx
 * const state = getMutableAIState()
 * state.update({ ...state.get(), key: 'value' })
 * state.update((currentState) => ({ ...currentState, key: 'value' }))
 * state.done()
 * ```
 *
 * @example
 * ```tsx
 * const state = getMutableAIState()
 * state.done({ ...state.get(), key: 'value' }) // Done with a new state
 * ```
 */
declare function getMutableAIState<AI extends AIProvider = any>(): MutableAIState<InferAIState<AI, any>>;
declare function getMutableAIState<AI extends AIProvider = any>(key: keyof InferAIState<AI, any>): MutableAIState<InferAIState<AI, any>[typeof key]>;

/**
 * Create a piece of changable UI that can be streamed to the client.
 * On the client side, it can be rendered as a normal React node.
 */
declare function createStreamableUI(initialValue?: React.ReactNode): {
    /**
     * The value of the streamable UI. This can be returned from a Server Action and received by the client.
     */
    value: react_jsx_runtime.JSX.Element;
    /**
     * This method updates the current UI node. It takes a new UI node and replaces the old one.
     */
    update(value: React.ReactNode): void;
    /**
     * This method is used to append a new UI node to the end of the old one.
     * Once appended a new UI node, the previous UI node cannot be updated anymore.
     *
     * @example
     * ```jsx
     * const ui = createStreamableUI(<div>hello</div>)
     * ui.append(<div>world</div>)
     *
     * // The UI node will be:
     * // <>
     * //   <div>hello</div>
     * //   <div>world</div>
     * // </>
     * ```
     */
    append(value: React.ReactNode): void;
    /**
     * This method is used to signal that there is an error in the UI stream.
     * It will be thrown on the client side and caught by the nearest error boundary component.
     */
    error(error: any): void;
    /**
     * This method marks the UI node as finalized. You can either call it without any parameters or with a new UI node as the final state.
     * Once called, the UI node cannot be updated or appended anymore.
     *
     * This method is always **required** to be called, otherwise the response will be stuck in a loading state.
     */
    done(...args: [] | [React.ReactNode]): void;
};
/**
 * Create a wrapped, changable value that can be streamed to the client.
 * On the client side, the value can be accessed via the readStreamableValue() API.
 */
declare function createStreamableValue<T = any, E = any>(initialValue?: T): {
    /**
     * The value of the streamable. This can be returned from a Server Action and
     * received by the client. To read the streamed values, use the
     * `readStreamableValue` or `useStreamableValue` APIs.
     */
    readonly value: StreamableValue<T, E>;
    /**
     * This method updates the current value with a new one.
     */
    update(value: T): void;
    error(error: any): void;
    done(...args: [
    ] | [T]): void;
};
type Streamable = ReactNode | Promise<ReactNode>;
type Renderer<T> = (props: T) => Streamable | Generator<Streamable, Streamable, void> | AsyncGenerator<Streamable, Streamable, void>;
/**
 * `render` is a helper function to create a streamable UI from some LLMs.
 * Currently, it only supports OpenAI's GPT models with Function Calling and Assistants Tools.
 */
declare function render<TS extends {
    [name: string]: z.Schema;
} = {}, FS extends {
    [name: string]: z.Schema;
} = {}>(options: {
    /**
     * The model name to use. Must be OpenAI SDK compatible. Tools and Functions are only supported
     * GPT models (3.5/4), OpenAI Assistants, Mistral small and large, and Fireworks firefunction-v1.
     *
     * @example "gpt-3.5-turbo"
     */
    model: string;
    /**
     * The provider instance to use. Currently the only provider available is OpenAI.
     * This needs to match the model name.
     */
    provider: OpenAI;
    messages: Parameters<typeof OpenAI.prototype.chat.completions.create>[0]['messages'];
    text?: Renderer<{
        /**
         * The full text content from the model so far.
         */
        content: string;
        /**
         * The new appended text content from the model since the last `text` call.
         */
        delta: string;
        /**
         * Whether the model is done generating text.
         * If `true`, the `content` will be the final output and this call will be the last.
         */
        done: boolean;
    }>;
    tools?: {
        [name in keyof TS]: {
            description?: string;
            parameters: TS[name];
            render: Renderer<z.infer<TS[name]>>;
        };
    };
    functions?: {
        [name in keyof FS]: {
            description?: string;
            parameters: FS[name];
            render: Renderer<z.infer<FS[name]>>;
        };
    };
    initial?: ReactNode;
    temperature?: number;
}): ReactNode;

declare function createAI<AIState = any, UIState = any, Actions extends AIActions = {}>({ actions, initialAIState, initialUIState, unstable_onSetAIState: onSetAIState, unstable_onGetUIState: onGetUIState, }: {
    actions: Actions;
    initialAIState?: AIState;
    initialUIState?: UIState;
    unstable_onSetAIState?: OnSetAIState<AIState>;
    unstable_onGetUIState?: OnGetUIState<UIState>;
}): AIProvider<AIState, UIState, Actions>;

export { createAI, createStreamableUI, createStreamableValue, getAIState, getMutableAIState, render };
