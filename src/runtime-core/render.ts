import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
    //
    patch(vnode, container);
}
function patch(vnode, container) {
    //处理组件
    processElement(vnode, container);
    processComponent(vnode, container);
}
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