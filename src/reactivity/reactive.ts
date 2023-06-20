import { isObject } from '../shared/index';
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';
export const enum ReactiveFlags {
    IS_REACTIVE = "_v_isReactive",
    IS_READONLY = "_v_isReadonly"
}
export function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE];
}

export function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY];
}

export function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isProxy(val) {
    return isReactive(val) || isReadonly(val);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target:${target}必须是一个对象`);
    }
    return new Proxy(target, baseHandlers);
}