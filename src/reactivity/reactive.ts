import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';
export const enum ReactiveFlags {
    IS_REACTIVE = "_v_isReactive",
    IS_READONLY = "_v_isReadonly"
}
export function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE];
}

export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY];
}

export function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}

export function isProxy(val) {
    return isReactive(val) || isReadonly(val);
}
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}