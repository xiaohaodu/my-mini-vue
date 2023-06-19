function createVNode(type, props, children) {
    const vnode = Object.assign({}, arguments);
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type
    };
    return component;
}
function setupComponent(instance) {
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
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

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //先vnode
            //component -> vnode
            //所有逻辑操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            render(vnode, document.querySelector(rootContainer));
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
