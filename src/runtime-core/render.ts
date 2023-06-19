import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    //
    patch(vnode, container);
}
function patch(vnode, container) {
    //处理组件
    if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    } else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    if (typeof vnode.children === "string") {
        el.textContent = vnode.children;
    } else if (Array.isArray(vnode.children)) {
        for (const val of vnode.children) {
            patch(val, el);
        }
    }
    for (const key in vnode.props) {
        el.setAttribute(key, vnode.props[key]);
    }
    container.append(el);
};
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    //vnode -> patch
    //vnode -> element -> mount
    patch(subTree, container);
}