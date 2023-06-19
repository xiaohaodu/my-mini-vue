import { createVNode } from "./VNode";
import { render } from "./render";

export function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //先vnode
            //component -> vnode
            //所有逻辑操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            render(vnode, document.querySelector(rootContainer));
        }
    };
};