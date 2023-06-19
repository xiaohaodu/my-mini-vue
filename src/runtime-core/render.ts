import { ShapeFlags } from "../shared/ShapeFlags";
import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    //
    patch(vnode, container);
}
function patch(vnode, container) {
    //处理组件
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
    } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));

    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = vnode.children;
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
function mountComponent(initialvnode, container) {
    const instance = createComponentInstance(initialvnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialvnode, container);
}
function setupRenderEffect(instance, initialvnode, container) {
    const subTree = instance.render.call(instance.proxy);
    //vnode -> patch
    //vnode -> element -> mount
    patch(subTree, container);
    initialvnode.el = subTree.el;
}